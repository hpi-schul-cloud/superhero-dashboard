/*
 * One Controller per layout view
 */

const _ = require('lodash');
const express = require('express');
const router = express.Router();
const authHelper = require('../helpers/authentication');
const { api } = require('../api');
const moment = require('moment');
moment.locale('de');

const getTableActions = (item, path) => {
    let tableActions = [
        {
            link: path + item.id,
            class: 'btn-edit',
            icon: 'edit',
            title: 'bearbeiten'
        },
        {
            link: path + item.id,
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

const getUpdateHandler = (service) => {
    return function (req, res, next) {
        const { username, password, activated } = req.body;
        api(req, { useCallback: false, json: true, version: 'v3' })
            .patch('/' + service + '/' + req.params.id, {
                json: {
                    username,
                    password,
                    activated: activated === 'on',
                }
            })
            .then(() => res.redirect(req.header('Referer')))
            .catch(err => next(err));
    };
};

const getDetailHandler = (service) => {
    return function (req, res, next) {
        api(req, { useCallback: false, json: true, version: 'v3' })
            .get('/' + service + '/' + req.params.id)
            .then(data => res.json(data))
            .catch(err => next(err));
    };
};

const getDeleteHandler = (service) => {
    return function (req, res, next) {
        api(req, { useCallback: false, json: true, version: 'v3' })
            .delete('/' + service + '/' + req.params.id)
            .then(account =>
                api(req)
                    .delete('/users/' + account.userId)
                    .then(() => res.redirect(req.header('Referer'))))
            .catch(err => next(err));
    };
};

// secure routes
router.use(authHelper.authChecker);

router.get('/search' , function (req, res, next) {
    const itemsPerPage = 10;
    const currentPage = parseInt(req.query.p) || 1;

    api(req, { useCallback: false, json: true, version: 'v3' })
        .get('/account', {
            qs: {
                type: 'username',
                value: req.query.q,
                limit: itemsPerPage,
                skip: itemsPerPage * (currentPage - 1),
            }
        })
        .then(data => {
            const head = [
                'ID',
                'Username',
                'Aktiviert',
                'UserId',
                ''
            ];

            const body = data.data.map(item => {
                return [
                    item.id ||"",
                    item.username ||"",
                    item.activated ? '✔️' : '❌',
                    item.userId ||"",
                    getTableActions(item, '/accounts/')
                ];
            });

            const pagination = {
                currentPage,
                numPages: Math.ceil(data.total / itemsPerPage),
                baseUrl: '/accounts/search/?q=' + res.req.query.q + '&p={{page}}'
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

router.patch('/:id', getUpdateHandler('account'));
router.get('/:id', getDetailHandler('account'));
router.delete('/:id', getDeleteHandler('account'));

router.get('/account/:id' , function (req, res, next) {
    const itemsPerPage = 100;
    const currentPage = parseInt(req.query.p) || 1;

    api(req, { useCallback: false, json: true, version: 'v3' })
        .get('/account', {
            qs: {
                type: 'userId',
                value: req.params.id,
                limit: itemsPerPage,
                skip: itemsPerPage * (currentPage - 1),
            }
        })
        .then(data => {
            const head = [
                'ID',
                'Username',
                'Aktiviert',
                ''
            ];

            const body = data.data.map(item => {
                return [
                    item.id ||"",
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
