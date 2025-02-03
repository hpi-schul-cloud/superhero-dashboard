/*
 * One Controller per layout view
 */

// const _ = require('lodash');
const express = require("express");
const multer = require("multer");
const router = express.Router();
const authHelper = require("../helpers/authentication");
const { api } = require("../api");
const moment = require("moment");
moment.locale("de");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.use(authHelper.authChecker);

router.get("/", function (req, res, next) {
  const batches = [
    {
      id: "0000d231816abba584714c9c", // batch id
      status: "created",
      createdAt: "2024-09-28T11:58:46.601Z",
      usersByRole: [
        {
          roleName: "student",
          userCount: 42,
        },
        {
          roleName: "teacher",
          userCount: 3,
        },
        {
          roleName: "admin",
          userCount: 1,
        },
      ],
    },
    {
      id: "0000d231816abba584714c9d", // batch id
      status: "pending",
      createdAt: "2024-07-12T11:58:46.601Z",
      usersByRole: [
        {
          roleName: "student",
          userCount: 42,
        },
        {
          roleName: "teacher",
          userCount: 3,
        },
        {
          roleName: "admin",
          userCount: 1,
        },
      ],
    },
    {
      id: "0000d231816abba584714c9e", // batch id
      status: "finished",
      createdAt: "2024-04-28T11:58:46.601Z",
      usersByRole: [
        {
          roleName: "student",
          userCount: 42,
        },
        {
          roleName: "teacher",
          userCount: 3,
        },
        {
          roleName: "admin",
          userCount: 1,
        },
      ],
    },
  ];

  const batchesWithFormattedDate = batches.map((batch) => {
    const studentCount = batch.usersByRole.find(
      (role) => role.roleName === "student"
    ).userCount;
    const teacherCount = batch.usersByRole.find(
      (role) => role.roleName === "teacher"
    ).userCount;
    const adminCount = batch.usersByRole.find(
      (role) => role.roleName === "admin"
    ).userCount;

    const overallCount = studentCount + teacherCount + adminCount;

    const pending = 10;
    const pendingIds = ["pending-id-1", "pending-id-2"];
    const deleted = 5;
    const deletedIds = ["deleted-id-1", "deleted-id-2"];
    const failed = 2;
    const failedIds = ["failed-id-1", "failed-id-2"];

    return {
      id: batch.id,
      status: batch.status,
      createdAt: moment(batch.createdAt).format("DD.MM.YYYY, HH:MM"),
      studentCount,
      teacherCount,
      adminCount,
      overallCount,
      pending,
      pendingIds,
      deleted,
      deletedIds,
      failed,
      failedIds,
    };
  });
  //   api
  //     .get("/batch-deletion")
  //     .then((data) => {
  res.render("batch-deletion/batch-deletion", {
    title: "Sammellöschung von Schülern",
    user: res.locals.currentUser,
    themeTitle: process.env.SC_NAV_TITLE || "Schul-Cloud",
    batches: batchesWithFormattedDate,
  });
  //     })
  //     .catch((err) => {
  //       next(err);
  //     });
});

router.post(
  "/create-batch-deletion-file",
  upload.single("file"),
  (req, res, next) => {
    if (req.file) {
      console.log("Datei empfangen:", req.file.originalname);
      const fileBuffer = req.file.buffer;
      // TODO: Send the file to the API "schulcloud-server"
      res.redirect(303, "/batch-deletion/");
    } else {
      res.status(400).send("Keine Datei hochgeladen");
    }
  }
);

module.exports = router;
