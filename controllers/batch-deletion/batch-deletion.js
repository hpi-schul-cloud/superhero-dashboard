/*
 * One Controller per layout view
 */

// const _ = require('lodash');
const express = require("express");
const router = express.Router();
const authHelper = require("../../helpers/authentication");
const { api } = require("../../api");
const moment = require("moment");
const sendFile = require("./send-file");
moment.locale("de");

router.use(authHelper.authChecker);

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

router.get("/", function (req, res, next) {
  api(req, { adminApi: true })
    .get(`/deletion-batches`)
    .then((data) => {
      const formattedBatches = data.data.map((batch) => {
        const formattedDate = getFormattedDate(batch.createdAt);
        const batchTitle = `Sammellöschung vom ${formattedDate} Uhr`;
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
});

router.post("/create-batch-deletion-file", async (req, res, next) => {
  sendFile(req, res, next, api);
});

module.exports = router;
