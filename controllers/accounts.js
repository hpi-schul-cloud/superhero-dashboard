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

const getTableActions = (item, path) => {
    let tableActions = [
        {
            link: path + item._id,
            class: 'btn-edit',
            icon: 'edit',
            title: 'bearbeiten'
        },
        {
            link: path + item._id,
            class: 'btn-delete',
            icon: 'trash-o',
            method: 'delete',
            title: 'löschen'
        },
        {
            link: '/users/user/' + item.userId,
            class: 'btn-account',
            icon: 'address-card',
            method: 'get',
            title: 'Nutzerinformationen anzeigen'
        }
    ];
    if (item.username && item.userId) {
        tableActions.push({
            link: `${path.replace("accounts","users")}registrationlink/${item.userId}?save=true&patchUser=true`,
            class: 'btn-reglink',
            icon: 'share-alt',
            title: 'Registrierungslink generieren'
        });
    }
    return tableActions;
};

/*
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
*/
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
        api(req).delete('/' + service + '/' + req.params.id).then(account => {
                api(req).delete('/users/' + account.userId)
                    .then(_ => {
                        res.redirect(req.header('Referer'));
                    });
        }).catch(err => {
            next(err);
        });
    };
};

// secure routes
router.use(authHelper.authChecker);

router.get('/search' , function (req, res, next) {
    const itemsPerPage = 10;
    const currentPage = parseInt(req.query.p) || 1;

    api(req).get('/accounts/', {
            qs: {
                username: {
                    $regex: _.escapeRegExp(req.query.q),
                    $options: 'i'
                },
                $limit: itemsPerPage,
                $skip: itemsPerPage * (currentPage - 1),
                $sort: req.query.sort
            }
        }
    ).then(data => {
        const head = [
            'ID',
            'Username',
            'Aktiviert',
            'UserId',
            ''
        ];

        const body = data.map(item => {
            return [
                item._id ||"",
                item.username ||"",
                item.activated ? '✔️' : '❌',
                item.userId ||"",
                getTableActions(item, '/accounts/')
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

        res.render('accounts/accounts', {
            title: 'Account',
            head,
            body,
            pagination,
            user: res.locals.currentUser ||"",
            themeTitle: process.env.SC_NAV_TITLE || 'Schul-Cloud'
        });
    });
});

router.patch('/:id', getUpdateHandler('accounts'));
router.get('/:id', getDetailHandler('accounts'));
router.delete('/:id', getDeleteHandler('accounts'));
//router.post('/', getCreateHandler('accounts'));

router.get('/account/:id' , function (req, res, next) {
    const itemsPerPage = 100;
    const currentPage = parseInt(req.query.p) || 1;

    api(req).get('/accounts/', {
            qs: {
                userId: req.params.id,
                $limit: itemsPerPage,
                $skip: itemsPerPage * (currentPage - 1),
                $sort: req.query.sort
            }
        }
    ).then(data => {
        const head = [
            'ID',
            'Username',
            'Aktiviert',
            ''
        ];

        const body = data.map(item => {
            return [
                item._id ||"",
                item.username ||"",
                item.activated ? '✔️' : '❌',
                getTableActions(item, '/accounts/')
            ];
        });

        res.render('accounts/accounts', {
            title: 'Account',
            head,
            body,
            user: res.locals.currentUser ||""
        });
    });
});

router.get('/' , function (req, res, next) {
        res.render('accounts/search', {
            title: 'Account suchen',
            user: res.locals.currentUser,
            themeTitle: process.env.SC_NAV_TITLE || 'Schul-Cloud'
        });
});

module.exports = router;
