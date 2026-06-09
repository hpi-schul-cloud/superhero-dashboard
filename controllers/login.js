/*
 * One Controller per layout view
 */

const express = require("express");
const router = express.Router();
const { api } = require("../api");
const authHelper = require("../helpers/authentication");

// Login

router.post("/login/", function (req, res, next) {
  const username = req.body.email; // TODO: sanitize
  const password = req.body.password; // TODO: sanitize

  const login = (data) => {
    return api(req, { version: 'v3' })
      .post("/authentication/local", { json: data })
      .then((data) => {
        res.cookie("jwt", data.accessToken, {
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
          httpOnly: true,
        });
        res.redirect("/login/success/");
      })
      .catch(() => {
        res.locals.notification = {
          type: "danger",
          message: "Login fehlgeschlagen.",
        };
        next();
      });
  };

  return login({ strategy: "local", username, password });
});

router.all("/login/", function (req, res) {
  authHelper.isAuthenticated(req).then((isAuthenticated) => {
    if (isAuthenticated) {
      return res.redirect("/login/success/");
    } else {
      res.render("authentication/login", {});
    }
  });
});

// so we can do proper redirecting and stuff :)
router.get("/login/success", authHelper.authChecker, function (req, res) {
  res.redirect("/dashboard/");
});

router.get("/logout/", function (req, res) {
  api(req)
    .del("/authentication")
    .then(() => {
      res.clearCookie("jwt");
      return res.redirect("/login/");
    })
    .catch(() => {
      return res.redirect("/login/");
    });
});

module.exports = router;
