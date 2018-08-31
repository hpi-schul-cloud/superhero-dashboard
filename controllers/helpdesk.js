/*
 * One Controller per layout view
 */

const _ = require('lodash');
const express = require('express');
const router = express.Router();
const authHelper = require('../helpers/authentication');
const api = require('../api');
const moment = require('moment');
moment.locale('de');

const getTableActionsSend = (item, path, state) => {
    let actions = [];
    if (state === 'submitted' || state === 'closed') {
        actions.push(
            {
                class: 'disabled',
                icon: 'edit'
            },
            {
                class: 'disabled',
                icon: 'ban'
            },
            {
                class: 'disabled',
                icon: 'paper-plane'
            });
    } else {
        actions.push(
            {
                link: path + item._id,
                class: 'btn-edit',
                icon: 'edit'
            },
            {
                link: path + item._id,
                class: 'btn-close',
                icon: 'ban',
                method: 'delete'
            },
            {
                link: path + item._id,
                class: 'btn',
                icon: 'paper-plane',
                method: 'post'
            });
    }
    return actions;
};

/**
 * send out problem to the sc helpdesk
 * @param service currently only used for helpdesk
 * @returns {Function}
 */
const getSendHelper = (service) => {
    return function (req, res, next) {
        api(req).get('/' + service + '/' + req.params.id + '?$populate=userId')
            .then(data => {
                api(req).get('/schools/' + data.userId.schoolId)
                    .then(school => {
                let user = data.userId;
                let email = user.email ? user.email : "";
                let innerText = "Problem in Kategorie: " + data.category + "\n";
                let content = {
                    "text": "User: " + user.firstName + ' ' + user.lastName + "\n"
                    + "E-Mail: " + email + "\n"
                    + "Schule: " + school.name + "\n"
                    + innerText
                    + "User schrieb folgendes: \nIst Zustand:\n" + data.currentState + "\n\nSoll-Zustand:\n" + data.targetState + "\n\nAnmerkungen vom Admin:\n" + data.notes
                };
                req.body.email = "schul-cloud-support@hpi.de";
                req.body.subject = data.subject;
                req.body.content = content;

                api(req).post('/mails', {json: req.body}).then(_ => {
                    api(req).patch('/' + service + '/' + req.params.id, {
                        json: {
                            state: 'submitted',
                            order: 1
                        }
                    });
                    res.sendStatus(200);
                }).catch(err => {
                    res.status((err.statusCode || 500)).send(err);
                });

                res.redirect(req.get('Referrer'));
                    });
            });
    };
};

const getCreateHandler = (service) => {
    return function (req, res, next) {
        api(req).post('/' + service + '/', {
            // TODO: sanitize
            json: req.body
        }).then(data => {
            next();
        }).catch(err => {
            next(err);
        });
    };
};

const getUpdateHandler = (service) => {
    return function (req, res, next) {
        api(req).patch('/' + service + '/' + req.params.id, {
            // TODO: sanitize
            json: req.body
        }).then(data => {
            res.redirect(req.header('Referer'));
        }).catch(err => {
            next(err);
        });
    };
};


const getDetailHandler = (service) => {
    return function (req, res, next) {
        api(req).get('/' + service + '/' + req.params.id).then(data => {
            res.json(data);
        }).catch(err => {
            next(err);
        });
    };
};

const getDeleteHandler = (service) => {
    return function (req, res, next) {
        api(req).delete('/' + service + '/' + req.params.id).then(_ => {
            res.redirect(req.header('Referer'));
        }).catch(err => {
            next(err);
        });
    };
};

/**
 * Set state to closed of helpdesk problem
 * @param service usually helpdesk, to disable instead of delete entry
 * @returns {Function}
 */
const getDisableHandler = (service) => {
    return function (req, res, next) {
        api(req).patch('/' + service + '/' + req.params.id, {
            json: {
                state: 'closed',
                order: 2
            }
        }).then(_ => {
            res.redirect(req.get('Referrer'));
        });
    };
};

/**
 * Truncates string to 25 chars
 * @param string given string to truncate
 * @returns {string}
 */
const truncate = (string) => {
    if ((string || {}).length > 25) {
        return string.substring(0, 25) + '...';
    } else {
        return string;
    }
};

const dictionary = {
    open: 'Offen',
    closed: "Geschlossen",
    submitted: 'Gesendet',
    dashboard: 'Übersicht',
    courses: 'Kurse',
    classes: 'Klassen',
    homework: 'Aufgaben',
    files: 'Dateien',
    content: 'Materialien',
    administration: 'Verwaltung',
    login_registration: 'Anmeldung/Registrierung',
    other: 'Sonstiges'
};

// secure routes
router.use(authHelper.authChecker);

router.patch('/:id', getUpdateHandler('helpdesk'));
router.get('/:id', getDetailHandler('helpdesk'));
router.delete('/:id', getDisableHandler('helpdesk'));
router.post('/:id', getSendHelper('helpdesk'));
router.get('/', function (req, res, next) {

    const itemsPerPage = (req.query.limit || 10);
    const currentPage = parseInt(req.query.p) || 1;

    api(req).get('/helpdesk', {
        qs: {
            $limit: itemsPerPage,
            $skip: itemsPerPage * (currentPage - 1),
            $sort: (req.query.sort) ? req.query.sort : 'order'
        }
    }).then(data => {
        const head = [
            'Titel',
            'Ist-Zustand',
            'Soll-Zustand',
            'Kategorie',
            'Status',
            'Anmerkungen',
            ''
        ];

        const body = data.data.map(item => {
            return [
                truncate(item.subject || ''),
                truncate(item.currentState || ''),
                truncate(item.targetState || ''),
                dictionary[item.category],
                dictionary[item.state],
                truncate(item.notes || ''),
                getTableActionsSend(item, '/helpdesk/', item.state)
            ];
        });

        let limitQuery = '';
        if (req.query.limit) {
            limitQuery = '&limit=' + req.query.limit;
        }

        const pagination = {
            currentPage,
            numPages: Math.ceil(data.total / itemsPerPage),
            baseUrl: '/helpdesk/?p={{page}}' + limitQuery
        };

        res.render('helpdesk/helpdesk', {title: 'Helpdesk', head, body, pagination, limit: true, themeTitle: process.env.SC_NAV_TITLE || 'Schul-Cloud'});
    });
});

module.exports = router;
