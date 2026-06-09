/*
 * One Controller per layout view
 */

const express = require('express');
const router = express.Router();
const authHelper = require('../helpers/authentication');
const moment = require('moment');
moment.locale('de');

// secure routes
router.use(authHelper.authChecker);

router.get('/', function (req, res) {
    res.render('dashboard/dashboard', {
        title: 'Übersicht',
        user: res.locals.currentUser,
    });
});


module.exports = router;
