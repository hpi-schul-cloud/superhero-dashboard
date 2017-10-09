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


// secure routes
router.use(authHelper.authChecker);

router.patch('/:id', getUpdateHandler('schools'));
router.get('/:id', getDetailHandler('schools'));
router.delete('/:id', getDeleteHandler('schools'));
router.post('/', getCreateHandler('schools'));
router.all('/', function (req, res, next) {

    const itemsPerPage = 10;
    const currentPage = parseInt(req.query.p) || 1;

    api(req).get('/federalStates').then(federalStates => {
        api(req).get('/schools', {
            qs: {
                $limit: itemsPerPage,
                $skip: itemsPerPage * (currentPage - 1),
                $sort: req.query.sort,
                $populate: 'federalState'
            }
        }).then(data => {
            const head = [
                'ID',
                'Name',
                'Bundesland',
                ''
            ];

            const body = data.data.map(item => {
                return [
                    item._id,
                    item.name,
                    (item.federalState || {}).name,
                    getTableActions(item, '/schools/')
                ];
            });

            let sortQuery = '';
            if (req.query.sort) {
                sortQuery = '&sort=' + req.query.sort;
            }

            const pagination = {
                currentPage,
                numPages: Math.ceil(data.total / itemsPerPage),
                baseUrl: '/schools/?p={{page}}' + sortQuery
            };

            res.render('schools/schools', {title: 'Schulen', head, body, pagination, federalState: federalStates.data, user: res.locals.currentUser});
        });
    });
});

router.get('/', function (req, res, next) {
    api(req).get('/schools/').then(schools => {
        res.render('schools/schools', {
            title: 'Schulen',
            user: res.locals.currentUser,
            schools: schools.data
        });
    });
});

module.exports = router;
