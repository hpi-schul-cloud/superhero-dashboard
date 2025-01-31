/*
 * One Controller per layout view
 */

// const _ = require('lodash');
const express = require("express");
const multer = require('multer');
const router = express.Router();
const authHelper = require("../helpers/authentication");
const { api } = require("../api");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

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

router.post('/create-batch-deletion-file', upload.single('file'), (req, res, next) => {
  if (req.file) {
    console.log('Datei empfangen:', req.file.originalname);
    // Datei direkt weiterverarbeiten
    const fileBuffer = req.file.buffer;
    // Beispiel: Datei als Antwort senden
    res.set('Content-Type', req.file.mimetype);
    res.send(fileBuffer);
  } else {
    res.status(400).send('Keine Datei hochgeladen');
  }
});

module.exports = router;



