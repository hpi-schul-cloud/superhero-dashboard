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

const getMostSignificantRole = (roles) => {
	return roles.find((role) => role === 'administrator') ||
		roles.find((role) => role === 'teacher') ||
		roles.find((role) => role === 'student');
};

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
    return async function (req, res, next) {
        try {
            const { id } = req.params;
            const { username, password, activated } = req.body;
            await api(req, { useCallback: false, json: true, version: 'v3' })
                .patch(`/${service}/${id}`, {
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

const getDetailHandler = (service) => {
    return async function (req, res, next) {
        try {
            const { id } = req.params;
            const data = await api(req, { useCallback: false, json: true, version: 'v3' })
                .get(`/${service}/${id}`);
            res.json(data);
        } catch (err) {
            next(err);
        }
    };
};

const getDeleteHandler = (service) => {
    let roles;
    return async function (req, res, next) {
        try {
            const { id } = req.params;
            const { userId } = await api(req, { useCallback: false, json: true, version: 'v3' })
                .delete(`/${service}/${id}`);
            api(req)
                .get('/users/' + userId, { qs: { $populate: ['roles'] } })
                .then(async (user) => {
                    roles = user.roles.map((role) => {
                        return role.name;
                    });
                    return roles;
                })
                .then((roles) => {
                    const pathRole = getMostSignificantRole(roles);
                    if (pathRole === undefined) {
                        const error = new Error('Deletion is supported only for users with role student, teacher or administrator.');
                        error.status = 403;
                        throw error;
                    }
                    api(req)
                        .delete(`/users/v2/admin/${pathRole}/${userId}`)
                        .then((data) => {
                            res.redirect(req.header('Referer'));
                        })
                        .catch((err) => {
                            next(err);
                        });
                });
        } catch (err) {
            next(err);
        }
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
