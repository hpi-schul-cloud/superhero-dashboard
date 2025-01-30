/*
 * One Controller per layout view
 */

// const _ = require('lodash');
const express = require("express");
const router = express.Router();
const authHelper = require("../helpers/authentication");
const { api } = require("../api");
// const moment = require('moment');
// moment.locale('de');

// secure routes
router.use(authHelper.authChecker);

router.get("/", function (req, res, next) {
  const deletionContainerHead = ["Schüler-IDs", "Lehrer-IDs"];

  res.render("batch-deletion/batch-deletion", {
    title: "Sammellöschung von Schülern",
    user: res.locals.currentUser,
    themeTitle: process.env.SC_NAV_TITLE || "Schul-Cloud",
    deletionContainerHead,
  });
});

module.exports = router;
