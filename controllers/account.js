const express = require('express');
const router = express.Router();
const { api } = require('../api');
const authHelper = require('../helpers/authentication');

// secure routes
router.use(authHelper.authChecker);

router.post('/', async function (req, res) {
    try {
        const { firstName, lastName, email, password, password_new } = req.body;
        await api(req, { useCallback: false, json: true, version: 'v3' })
            .patch('/account/me', {
                json: {
                    passwordOld: password,
                    passwordNew: password_new !== '' ? password_new : undefined,
                    firstName,
                    lastName,
                    email,
                }
            });
            authHelper.populateCurrentUser.bind(this, req, res);
            res.redirect('/account/');
    } catch (err) {
        res.render('account/settings', {
            title: 'Dein Account',
            notification: {
                type: 'danger',
                message: err.error.message,
            }
        });
    }
});

router.get('/', function (req, res, next) {
    if (process.env.NOTIFICATION_SERVICE_ENABLED) {
        api(req).get('/notification/devices')
            .then(device => {
                device.map(d => {
                    if (d.token === req.cookies.deviceToken) {
                        Object.assign(d, {selected: true});
                    }
                    return d;
                });
                res.render('account/settings', {
                    title: 'Dein Account',
                    device,
                    userId: res.locals.currentUser._id
                });
            }).catch(err => {
            res.render('account/settings', {
                title: 'Dein Account',
                userId: res.locals.currentUser._id
            });
        });
    } else {
        res.render('account/settings', {
            title: 'Dein Account',
            userId: res.locals.currentUser._id
        });
    }
});

// delete file
router.delete('/settings/device', function (req, res, next) {
    const {name, _id = ''} = req.body;

    api(req).delete('/notification/devices/' + _id).then(_ => {
        res.sendStatus(200);
    }).catch(err => {
        res.status((err.statusCode || 500)).send(err);
    });
});

router.get('/user', function (req, res, next) {
    res.locals.currentUser.schoolName = res.locals.currentSchoolData.name;
    res.json(res.locals.currentUser);
});

module.exports = router;
