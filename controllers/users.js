/*
 * One Controller per layout view
 */

const _ = require('lodash');
const express = require('express');
const router = express.Router();
const authHelper = require('../helpers/authentication');
const api = require('../api');
const moment = require('moment');
const fs = require('fs');
const handlebars = require('handlebars');
moment.locale('de');

const getTableActions = (item, path) => {
    return [
        {
            link: path + item._id,
            class: 'btn-edit',
            icon: 'edit'
        },
        {
            link: path + item._id,
            class: 'btn-delete',
            icon: 'trash-o',
            method: 'delete'
        }
    ];
};

const sendMailHandler = (user, req) => {
    let createdUser = user;
    let email = createdUser.email;
    let content = {
        "text": "Sehr geehrte/r " + createdUser.firstName + " " + createdUser.lastName + ",\n\n" +
        "Sie wurden in die Schul-Cloud eingeladen, bitte registrieren Sie sich unter folgendem Link:\n" +
        (req.headers.origin || process.env.HOST) + "/register/account/" + createdUser._id + "\n\n" +
        "Mit Freundlichen Grüßen" + "\nIhr Schul-Cloud Team"
    };
    api(req).post('/mails', {
        json: {
            headers: {},
            email: email,
            subject: "Einladung in die Schul-Cloud",
            content: content
        }
    }).then(_ => {
    });
    /**fs.readFile(path.join(__dirname, '../views/template/registration.hbs'), (err, data) => {
        if (!err) {
            let source = data.toString();
            let template = handlebars.compile(source);
            let outputString = template({
                "url": (req.headers.origin || process.env.HOST) + "/register/account/" + createdUser._id,
                "firstName": createdUser.firstName,
                "lastName": createdUser.lastName
            });

            let content = {
                "html": outputString,
                "text": "Sehr geehrte/r " + createdUser.firstName + " " + createdUser.lastName + ",\n\n" +
                "Sie wurden in die Schul-Cloud eingeladen, bitte registrieren Sie sich unter folgendem Link:\n" +
                (req.headers.origin || process.env.HOST) + "/register/account/" + createdUser._id + "\n\n" +
                "Mit Freundlichen Grüßen" + "\nIhr Schul-Cloud Team"
            };
            req.body.content = content;
            api(req).post('/mails', {
                json: {
                    headers: {},
                    email: email,
                    subject: "Einladung in die Schul-Cloud",
                    content: content
                }
            }).then(_ => {
                return true;
            });
        }
    });**/
};

const getCreateHandler = (service) => {
    return function (req, res, next) {
        req.body.schoolId = req.query.schoolId;
        api(req).post('/' + service + '/', {
            // TODO: sanitize
            json: req.body
        }).then(data => {
            if (req.body.silent !== 'on')
                sendMailHandler(data, req);
            res.redirect(req.header('Referer'));
        }).catch(err => {
            next(err);
        });
    };
};

const getUpdateHandler = (service) => {
    return function (req, res, next) {
        /**if (req.body.roles[0].includes(',')) {
            req.body.roles = req.body.roles[0].split(',');
        }**/
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

const capitalize = ([first,...rest]) => first.toUpperCase() + rest.join('').toLowerCase();

// secure routes
router.use(authHelper.authChecker);


router.get('/search' , function (req, res, next) {
    const itemsPerPage = 10;
    const currentPage = parseInt(req.query.p) || 1;
    
    api(req).get('/users/', {
            qs: {
                firstName: {
                    $regex: _.escapeRegExp(capitalize(req.query.q))
                },
                $populate: ['roles', 'schoolId'],
                $limit: itemsPerPage,
                $skip: itemsPerPage * (currentPage - 1),
                $sort: req.query.sort
            }
        }
    ).then(data => {
        api(req).get('/roles')
            .then(role => {
                const head = [
                    'Vorname',
                    'Nachname',
                    'E-Mail',
                    'Rolen',
                    'Schule',
                    ''
                ];

                const body = data.data.map(item => {
                    let roles = '';
                    item.roles.map(role => {
                        roles = roles + ' ' + role.name
                    });
                    return [
                        item.firstName,
                        item.lastName,
                        item.email,
                        roles,
                        item.schoolId.name,
                        getTableActions(item, '/users/')
                    ];
                });

                let sortQuery = '';
                if (req.query.sort) {
                    sortQuery = '&sort=' + req.query.sort;
                }

                const pagination = {
                    currentPage,
                    numPages: Math.ceil(data.total / itemsPerPage),
                    baseUrl: '/users/search/?q=' + res.req.query.q + '&p={{page}}' + sortQuery
                };

                res.render('users/users', {
                    title: 'Users',
                    head,
                    body,
                    pagination,
                    role: role.data,
                    user: res.locals.currentUser
                });
        });
    });
});

router.patch('/:id', getUpdateHandler('users'));
router.get('/:id', getDetailHandler('users'));
router.delete('/:id', getDeleteHandler('users'));
router.post('/', getCreateHandler('users'));

router.get('/', function (req, res, next) {
    if (res.req.query.schoolId) {
        const itemsPerPage = 10;
        const currentPage = parseInt(req.query.p) || 1;

        api(req).get('/roles').then(role => {
        api(req).get('/users?schoolId=' + res.req.query.schoolId, {
            qs: {
                $limit: itemsPerPage,
                $skip: itemsPerPage * (currentPage - 1),
                $sort: req.query.sort,
                $populate: 'roles'
            }
        }).then(data => {
            const head = [
                'ID',
                'Vorname',
                'Nachname',
                'E-Mail',
                'Rolen',
                ''
            ];

            const body = data.data.map(item => {
                let roles = '';
                item.roles.map(role => {
                    roles = roles + ' ' + role.name
                });
                return [
                    item._id,
                    item.firstName,
                    item.lastName,
                    item.email,
                    roles,
                    getTableActions(item, '/users/')
                ];
            });

            let sortQuery = '';
            if (req.query.sort) {
                sortQuery = '&sort=' + req.query.sort;
            }

            const pagination = {
                currentPage,
                numPages: Math.ceil(data.total / itemsPerPage),
                baseUrl: '/users/?schoolId=' + res.req.query.schoolId + '&p={{page}}' + sortQuery
            };

            res.render('users/users', {title: 'Users', head, body, pagination, schoolId: res.req.query.schoolId, role: role.data, user: res.locals.currentUser});
        });
        });
    } else {
        api(req).get('/schools/').then(schools => {
            res.render('users/preselect', {
                title: 'Users',
                user: res.locals.currentUser,
                schools: schools.data
            });
        });
    }
});

module.exports = router;
