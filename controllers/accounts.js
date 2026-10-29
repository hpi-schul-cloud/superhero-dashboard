/*
 * One Controller per layout view
 */

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

const getUpdateHandler = () => {
    return async function (req, res, next) {
        try {
            const { id } = req.params;
            const { username, password, activated } = req.body;
            await api(req, { json: true, adminApi: true })
                .patch(`/admin/accounts/${id}`, {
                    json: {
                        username,
                        password,
                        activated: activated === 'on',
                    }
                });
            res.redirect(req.header('Referer'));
        } catch (err) {
            next(err);
        }
    };
};

const getDetailHandler = () => {
    return async function (req, res, next) {
        try {
            const { id } = req.params;
            const data = await api(req, { json: true, adminApi: true })
                .get(`/admin/accounts/${id}`);
            res.json(data);
        } catch (err) {
            next(err);
        }
    };
};

const getDeleteHandler = () => {
    return async function (req, res, next) {
        try {
            const { id } = req.params;
            await api(req, { json: true, adminApi: true })
                .delete(`/admin/accounts/${id}`);

            res.redirect(req.header('Referer'));
        } catch (err) {
            next(err);
        }
    };
};

// secure routes
router.use(authHelper.authChecker);

router.get('/search' , function (req, res) {
    const itemsPerPage = 10;
    const currentPage = parseInt(req.query.p) || 1;

    api(req, { json: true, adminApi: true })
        .get('/admin/accounts', {
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
                'updatedAt',
                ''
            ];

            const body = data.data.map(item => {
                return [
                    item.id ||"",
                    item.username ||"",
                    item.activated ? '✔️' : '❌',
                    item.userId ||"",
                    item.updatedAt || "",
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
            });
        });
});

router.patch('/:id', getUpdateHandler());
router.get('/:id', getDetailHandler());
router.delete('/:id', getDeleteHandler());

router.get('/account/:id' , function (req, res) {
    const itemsPerPage = 100;
    const currentPage = parseInt(req.query.p) || 1;

    api(req, { json: true, adminApi: true })
        .get('/admin/accounts', {
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

router.get('/' , function (req, res) {
        res.render('accounts/search', {
            title: 'Account suchen',
            user: res.locals.currentUser,
        });
});

module.exports = router;
