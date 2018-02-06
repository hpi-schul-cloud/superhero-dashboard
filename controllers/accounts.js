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
            link: '/users/user/' + item.userId,
            class: 'btn-account',
            icon: 'address-card',
            method: 'get'
        }
    ];
};


const getCreateHandler = (service) => {
    return function (req, res, next) {
        req.body.schoolId = req.query.schoolId;
        api(req).post('/' + service + '/', {
            // TODO: sanitize
            json: req.body
        }).then(data => {
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

    console.log(req.query.q);

    api(req).get('/accounts/', {
            qs: {
                username: {
                    $regex: _.escapeRegExp(req.query.q)
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
                item._id,
                item.username,
                item.activated,
                item.userId,
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
            user: res.locals.currentUser
        });
    });
});

router.patch('/:id', getUpdateHandler('accounts'));
router.get('/:id', getDetailHandler('accounts'));
router.delete('/:id', getDeleteHandler('accounts'));
router.post('/search/', getCreateHandler('accounts'));

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
                item._id,
                item.username,
                item.activated,
                getTableActions(item, '/accounts/')
            ];
        });

        res.render('accounts/accounts', {
            title: 'Account',
            head,
            body,
            user: res.locals.currentUser
        });
    });
});

router.get('/' , function (req, res, next) {
        res.render('accounts/search', {
            title: 'Account suchen',
            user: res.locals.currentUser
        });
});

module.exports = router;
