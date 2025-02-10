const { api } = require("../../api");
const moment = require("moment");

moment.locale("de");

const getFormattedDate = (date) => {
  const formattedDate = moment(date).format("DD.MM.YYYY, HH:mm");
  return formattedDate;
};

const germanRoleNames = {
  student: "Schüler",
  teacher: "Lehrer",
  administrator: "Admin",
  expert: "Experte",
  superhero: "Superhero",
  invalid: "Ungültig",
};

const mapUserIds = (batch) => {
  const invalidUsersCount = batch.invalidUsers.length;
  const invalidUsers = {
    roleName: "invalid",
    userCount: invalidUsersCount,
  };

  const usersByRole = batch.usersByRole.concat(
    batch.skippedUsersByRole,
    invalidUsers
  );

  return usersByRole
    .sort((a, b) => b.userCount - a.userCount)
    .map((role) => {
      return {
        roleName: germanRoleNames[role.roleName],
        userCount: role.userCount,
      };
    });
};

const mapBatches = (batches) => {
  return batches.map((batch) => {
    const formattedDate = getFormattedDate(batch.createdAt);
    const batchTitle = `${batch.name} - ${formattedDate} Uhr`;

    const isValidBatch = batch.usersByRole.length > 0;
    const status = isValidBatch ? batch.status : "invalid";
    const canDeleteBatch = status === "created" || status === "invalid";
    const canStartDeletion = canDeleteBatch && isValidBatch;

    const ids = mapUserIds(batch);
    const overallCount = ids.reduce((acc, role) => {
      return acc + role.userCount;
    }, 0);

    return {
      id: batch.id,
      status,
      usersByRole: ids,
      createdAt: formattedDate,
      batchTitle,
      overallCount,
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
      title: "Sammellöschung von Schülern",
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

const sendFile = async (req, res, next) => {
  const { fileContent, batchTitle } = req.body;

  if (!fileContent || !batchTitle) {
    return res
      .status(400)
      .send({ message: "No file content or batch title provided" });
  }

  const targetRefIds = fileContent.split("\n").map((item) => item.trim());
  try {
    const response = await api(req, { adminApi: true }).post(
      "/deletion-batches/",
      {
        json: {
          name: batchTitle,
          targetRefDomain: "domain",
          targetRefIds,
        },
      }
    );

    res.status(200).send({ message: "File sent successfully" });
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
