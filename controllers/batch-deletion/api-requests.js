const { invalid } = require("moment/moment");
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
    .then((response) => {
      const formattedBatches = response.data.map((batch) => {
        const formattedDate = getFormattedDate(batch.createdAt);
        const batchTitle = `${batch.name} - ${formattedDate} Uhr`;

        const usersByRole = batch.usersByRole.concat(batch.skippedUsersByRole);

        const sortedUserRolesByCount = usersByRole
          .sort((a, b) => b.userCount - a.userCount)
          .map((role) => {
            return {
              roleName: germanRoleNames[role.roleName],
              userCount: role.userCount,
            };
          });

        const invalidUsersCount = batch.invalidUsers.length;
        const invalidUsers = {
          roleName: "Ungültig",
          userCount: invalidUsersCount,
        };

        const overallCount =
          invalidUsersCount +
          sortedUserRolesByCount.reduce((acc, role) => {
            return acc + role.userCount;
          }, 0);

        return {
          id: batch.id,
          status: batch.status,
          usersByRole: sortedUserRolesByCount.concat(invalidUsers),
          createdAt: formattedDate,
          batchTitle,
          overallCount,
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

const getDeletionBatchDetails = (req, res, next) => {
  const { id } = req.params;

  api(req, { adminApi: true })
    .get(`/deletion-batches/${id}`)
    .then((response) => {
      res.status(200).json(response);
    })
    .catch((error) => {
      console.error("error", error);
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

module.exports = { getDeletionBatches, getDeletionBatchDetails, sendFile };
