/*
 * One Controller per layout view
 */

const express = require("express");
const router = express.Router();
const authHelper = require("../../helpers/authentication");
const { api } = require("../../api");
const apiRequests = require("./fetch-data");
const sendFile = require("./send-file");

router.use(authHelper.authChecker);

router.get("/", apiRequests.getDeletionBatches);

router.post("/create-batch-deletion-file", async (req, res, next) => {
  await sendFile(req, res, next, api);
});

module.exports = router;
