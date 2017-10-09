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
        }
    ];
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
        if (req.body.permissions[0].includes(',')) {
            req.body.permissions = req.body.permissions[0].split(',');
        }
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
            let permissions = [];
            if (data.roles[0]) {
                api(req).get('/' + service + '/' + data.roles[0])
                    .then(roleData => {
                        permissions.push.apply(permissions, roleData.permissions);
                        data.permissions = _.xor(data.permissions, permissions);
                        res.json(data);
                    });
            } else {
                res.json(data);
            }
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


// secure routes
router.use(authHelper.authChecker);

router.patch('/:id', getUpdateHandler('roles'));
router.get('/:id', getDetailHandler('roles'));
router.delete('/:id', getDeleteHandler('roles'));
router.post('/', getCreateHandler('roles'));
router.all('/', function (req, res, next) {

    const itemsPerPage = 10;
    const currentPage = parseInt(req.query.p) || 1;

        api(req).get('/roles', {
            qs: {
                $limit: itemsPerPage,
                $skip: itemsPerPage * (currentPage - 1),
                $sort: req.query.sort,
                $populate: 'roles'
            }
        }).then(data => {
            const head = [
                'ID',
                'Name',
                'Geerbt von',
                'Permissions',
                ''
            ];

            const body = data.data.map(item => {
                let permissions = "";
                item.permissions.map(permission => {
                    permissions = permissions + ' | ' + permission
                });
                return [
                    item._id,
                    item.name,
                    (item.roles[0] || {}).name,
                    permissions,
                    getTableActions(item, '/roles/')
                ];
            });

            let sortQuery = '';
            if (req.query.sort) {
                sortQuery = '&sort=' + req.query.sort;
            }

            const pagination = {
                currentPage,
                numPages: Math.ceil(data.total / itemsPerPage),
                baseUrl: '/roles/?p={{page}}' + sortQuery
            };

            res.render('roles/roles', {title: 'Rollen', head, body, pagination, roles: data.data, user: res.locals.currentUser});
        });
});

module.exports = router;
