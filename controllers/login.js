/*
 * One Controller per layout view
 */

const express = require('express');
const router = express.Router();
const { api } = require('../api');
const authHelper = require('../helpers/authentication');

// Login

router.post('/login/', function (req, res, next) {
    const username = req.body.email; // TODO: sanitize
    const password = req.body.password; // TODO: sanitize

    const login = (data) => {
        return api(req).post('/authentication', {json: data}).then(data => {
            res.cookie('jwt', data.accessToken, {expires: new Date(Date.now() + 60 * 60 * 1000)});
            res.redirect('/login/success/');
        }).catch(_ => {
            res.locals.notification = {
                'type': 'danger',
                'message': 'Login fehlgeschlagen.'
            };
            next();
        });
    };

    return login({strategy: 'local', username, password});

});


router.all('/login/', function (req, res, next) {
    authHelper.isAuthenticated(req).then(isAuthenticated => {
        if (isAuthenticated) {
            return res.redirect('/login/success/');
        } else {
             res.render('authentication/login', {themeTitle: process.env.SC_NAV_TITLE || 'Schul-Cloud'});
        }
    });
});

// so we can do proper redirecting and stuff :)
router.get('/login/success', authHelper.authChecker, function (req, res, next) {
    res.redirect('/dashboard/');
});

router.get('/logout/', function (req, res, next) {
    api(req).del('/authentication')
        .then(_ => {
            res.clearCookie('jwt');
            return res.redirect('/login/');
        }).catch(_ => {
        return res.redirect('/login/');
    });
});

module.exports = router;
