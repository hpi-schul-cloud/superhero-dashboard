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
        },
        {
            link: path + 'jwt/' + item._id,
            class: 'btn-jwt',
            icon: 'sign-in',
            method: 'get'
        },
        {
            link: '/accounts/account/' + item._id,
            class: 'btn-account',
            icon: 'address-card',
            method: 'get'
        }
    ];
};

const sendMailHandler = (user, req) => {
    let createdUser = user;
    let email = createdUser.email;
    let content = {
        "text": "Sehr geehrte/r " + createdUser.firstName + " " + createdUser.lastName + ",\n\n" +
        "Sie wurden in die " + (process.env.SC_NAV_TITLE || "Schul-Cloud") + " eingeladen, bitte registrieren Sie sich unter folgendem Link:\n" +
        (process.env.HOST || 'https://schul-cloud.org') + "/register/account/" + createdUser._id + "\n\n" +
        "Mit Freundlichen Grüßen" + "\nIhr " + (process.env.SC_NAV_TITLE || "Schul-Cloud") + " Team"
    };
    api(req).post('/mails', {
        json: {
            headers: {},
            email: email,
            subject: "Einladung in die " + (process.env.SC_NAV_TITLE || "Schul-Cloud"),
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
            api(req).get('/accounts/', { qs: { userId: req.params.id }})
                .then(account => {
                    api(req).delete('/accounts/' + account[0]._id)
                        .then(_ => {
                            res.redirect(req.header('Referer'));
                        });
                })
                .catch(_ => {
                    res.redirect(req.header('Referer'));
                });
        }).catch(err => {
            next(err);
        });
    };
};

const capitalize = ([first,...rest]) => first.toUpperCase() + rest.join('').toLowerCase();

// secure routes
router.use(authHelper.authChecker);

router.get('/user/:id' , function (req, res, next) {
    const itemsPerPage = (req.query.limit || 10);
    const currentPage = parseInt(req.query.p) || 1;

    api(req).get('/users/', {
            qs: {
                _id: req.params.id,
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
                    'E-Mail-Adresse',
                    'Rollen',
                    'Schule',
                    ''
                ];

                const body = data.data.map(item => {
                    let roles = '';
                    item.roles.map(role => {
                        roles = roles + ' ' + role.name;
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

                let limitQuery = '';
                if (req.query.limit) {
                    limitQuery = '&limit=' + req.query.limit;
                }

                const pagination = {
                    currentPage,
                    numPages: Math.ceil(data.total / itemsPerPage),
                    baseUrl: '/users/search/?q=' + res.req.query.q + '&p={{page}}' + sortQuery + limitQuery
                };

                res.render('users/users', {
                    title: 'Users',
                    head,
                    body,
                    pagination,
                    role: role.data,
                    user: res.locals.currentUser,
                    schoolId: req.query.schoolId,
                    limit: true,
                    themeTitle: process.env.SC_NAV_TITLE || 'Schul-Cloud'
                });
            });
    });
});

router.get('/search' , function (req, res, next) {
    const itemsPerPage = (req.query.limit || 10);
    const currentPage = parseInt(req.query.p) || 1;

    api(req).get('/users/', {
            qs: {
                firstName: {
                    $regex: _.escapeRegExp(capitalize(req.query.q))
                },
                schoolId: (req.query.schoolId) ? req.query.schoolId : undefined,
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
                    'E-Mail-Adresse',
                    'Rollen',
                    'Schule',
                    ''
                ];

                const body = data.data.map(item => {
                    let roles = '';
                    item.roles.map(role => {
                        roles = roles + ' ' + role.name;
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

                let limitQuery = '';
                if (req.query.limit) {
                    limitQuery = '&limit=' + req.query.limit;
                }

                const pagination = {
                    currentPage,
                    numPages: Math.ceil(data.total / itemsPerPage),
                    baseUrl: '/users/search/?q=' + res.req.query.q + '&p={{page}}' + sortQuery + limitQuery
                };

                res.render('users/users', {
                    title: 'Users',
                    head,
                    body,
                    pagination,
                    role: role.data,
                    user: res.locals.currentUser,
                    schoolId: req.query.schoolId,
                    limit: true
                });
        });
    });
});

router.get('/jwt/:id', function (req, res, next) {
    api(req).post('/accounts/jwt', {json: { userId: req.params.id }})
        .then(jwt => {
            api(req).get('/users/' + req.params.id)
                .then(user => {
                    res.render('users/jwt', {
                        title: 'JWT',
                        jwt: jwt,
                        user: user,
                        themeTitle: process.env.SC_NAV_TITLE || 'Schul-Cloud'
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
        const itemsPerPage = (req.query.limit || 10);
        const currentPage = parseInt(req.query.p) || 1;

        api(req).get('/roles', {qs: {$limit: 25}}).then(role => {
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
                'E-Mail-Adresse',
                'Rollen',
                ''
            ];

            const body = data.data.map(item => {
                let roles = '';
                item.roles.map(role => {
                    roles = roles + ' ' + role.name;
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

            let limitQuery = '';
            if (req.query.limit) {
                limitQuery = '&limit=' + req.query.limit;
            }

            const pagination = {
                currentPage,
                numPages: Math.ceil(data.total / itemsPerPage),
                baseUrl: '/users/?schoolId=' + res.req.query.schoolId + '&p={{page}}' + sortQuery + limitQuery
            };

            api(req).get('/schools/' + req.query.schoolId)
                .then(schoolData => {
                    res.render('users/users', {
                        title: 'Users',
                        head,
                        body,
                        pagination,
                        schoolId: res.req.query.schoolId,
                        role: role.data,
                        user: res.locals.currentUser,
                        school: schoolData,
                        limit: true,
                        themeTitle: process.env.SC_NAV_TITLE || 'Schul-Cloud'
                    });
                });
                });
        });
    } else {
        api(req).get('/schools/').then(schools => {
            res.render('users/preselect', {
                title: 'Users',
                user: res.locals.currentUser,
                schools: schools.data,
                themeTitle: process.env.SC_NAV_TITLE || 'Schul-Cloud'
            });
        });
    }
});

module.exports = router;
