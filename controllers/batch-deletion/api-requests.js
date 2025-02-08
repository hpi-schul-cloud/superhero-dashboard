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
};

const getDeletionBatches = (req, res, next) => {
  api(req, { adminApi: true })
    .get(`/deletion-batches`)
    .then((data) => {
      const formattedBatches = data.data.map((batch) => {
        const formattedDate = getFormattedDate(batch.createdAt);
        const batchTitle = `${batch.name} - ${formattedDate} Uhr`;
        const sortedUserRolesByCount = batch.usersByRole
          .sort((a, b) => b.userCount - a.userCount)
          .map((role) => {
            return {
              roleName: germanRoleNames[role.roleName],
              userCount: role.userCount,
            };
          });

        const overallCount = sortedUserRolesByCount.reduce((acc, role) => {
          return acc + role.userCount;
        }, 0);

        const pending = 10;
        const pendingIds = ["pending-id-1", "pending-id-2"];
        const deleted = 5;
        const deletedIds = ["deleted-id-1", "deleted-id-2"];
        const failed = 2;
        const failedIds = ["failed-id-1", "failed-id-2"];

        return {
          id: batch.id,
          status: batch.status,
          usersByRole: sortedUserRolesByCount,
          createdAt: formattedDate,
          batchTitle,
          overallCount,
          pending,
          pendingIds,
          deleted,
          deletedIds,
          failed,
          failedIds,
        };
      });

      res.render("batch-deletion/batch-deletion", {
        title: "Sammellöschung von Schülern",
        user: res.locals.currentUser,
        themeTitle: process.env.SC_NAV_TITLE || "Schul-Cloud",
        batches: formattedBatches,
      });
    })
    .catch((err) => {
      next(err);
    });
};

const sendFile = async (req, res, next) => {
  const { fileContent, batchTitle } = req.body;
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
    // todo: React to certain responses
    console.log(response);

    res.status(200).send({ message: "File sent successfully" });
  } catch (error) {
    console.log("error: ", error.statusCode);
    next(error);
  }
};

module.exports = { getDeletionBatches, sendFile };
