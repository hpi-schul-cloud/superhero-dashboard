const { api } = require("../../api");
const moment = require("moment");
const { Readable } = require('stream');
const fastcsv = require('fast-csv');

moment.locale("de");

const getFormattedDate = (date) => {
  const formattedDate = moment(date).format("DD.MM.YYYY, HH:mm");
  return formattedDate;
};

const mapBatches = (batches) => {
  return batches.map((batch) => {
    const formattedDate = getFormattedDate(batch.createdAt);
    const batchTitle = `${batch.name} - ${formattedDate} Uhr`;

    const isValidBatch = batch.validUsers > 0;
    const status = isValidBatch ? batch.status : "invalid";
    const canDeleteBatch = status === "created" || status === "invalid";
    const canStartDeletion = isValidBatch && status === "created";

    const overallCount = batch.validUsers + batch.invalidUsers + batch.skippedUsers;
    const userStats = `Gesamt: ${overallCount}, Gültig: ${batch.validUsers}, Ungültig: ${batch.invalidUsers}, Übersprungen: ${batch.skippedUsers}`;

    return {
      id: batch.id,
      status,
      userStats,
      createdAt: formattedDate,
      batchTitle,
      canDeleteBatch,
      canStartDeletion,
    };
  });
};

const getDeletionBatches = async (req, res, next) => {
  try {
    const response = await api(req, { adminApi: true }).get(
      `/deletion-batches`
    );

    const formattedBatches = mapBatches(response.data);

    res.render("batch-deletion/batch-deletion", {
      title: "Sammellöschung von Nutzern",
      user: res.locals.currentUser,
      themeTitle: process.env.SC_NAV_TITLE || "Schul-Cloud",
      batches: formattedBatches,
    });
  } catch (error) {
    next(error);
  }
};

const getDeletionBatchDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    const response = await api(req, { adminApi: true }).get(
      `/deletion-batches/${id}`
    );

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

const deleteBatch = async (req, res, next) => {
  try {
    const { id } = req.params;
    await api(req, { adminApi: true }).delete(`/deletion-batches/${id}`);

    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};

const sendDeletionRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    await api(req, { adminApi: true }).post(`/deletion-batches/${id}/execute`);

    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};

const isMongoId = (str) => typeof str === 'string' && /^[a-f\d]{24}$/i.test(str);

const sendFile = async (req, res, next) => {
  const { batchTitle, batchFileData } = req.body;

  if (!batchTitle || !batchFileData) {
    return res.status(400).send({ message: "No batch title or file data provided" });
  }

  try {
    const targetRefIds = [];
    await new Promise((resolve, reject) => {
      Readable.from(batchFileData)
        .pipe(fastcsv.parse({ headers: false, ignoreEmpty: true }))
        .on('data', row => {
          // skip header row + all that don't match MongoDB ObjectId format
          if (row[0] && isMongoId(row[0])) targetRefIds.push(row[0].trim());
        })
        .on('end', resolve)
        .on('error', reject);
    });

    await api(req, { adminApi: true }).post("/deletion-batches/", {
      json: {
        name: batchTitle,
        targetRefDomain: "user",
        targetRefIds,
      },
    });

    res.redirect(req.header('Referer'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDeletionBatches,
  getDeletionBatchDetails,
  deleteBatch,
  sendDeletionRequest,
  sendFile,
};
