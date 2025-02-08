/*
 * One Controller per layout view
 */

const express = require("express");
const router = express.Router();
const authHelper = require("../../helpers/authentication");
const apiRequests = require("./api-requests");

router.use(authHelper.authChecker);

router.get("/", apiRequests.getDeletionBatches);

router.post("/create-batch-deletion-file", apiRequests.sendFile);

module.exports = router;
