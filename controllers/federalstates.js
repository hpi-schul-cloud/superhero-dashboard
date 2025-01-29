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
    return [
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
        }
    ];
};

const getCreateHandler = (service) => {
    return function (req, res, next) {
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

router.use(authHelper.authChecker);

router.patch('/:id', getUpdateHandler('federalStates'));
router.get('/:id', getDetailHandler('federalStates'));
router.delete('/:id', getDeleteHandler('federalStates'));
router.post('/', getCreateHandler('federalStates'));
router.get('/', function (req, res, next) {

    const itemsPerPage = (req.query.limit || 10);
    const currentPage = parseInt(req.query.p) || 1;

    api(req).get('/federalStates', {
        qs: {
            $limit: itemsPerPage,
            $skip: itemsPerPage * (currentPage - 1),
            $sort: req.query.sort
        }
    }).then(data => {
        console.log(data);
        const head = [
            'ID',
            'Name',
            'Abkürzung',
            'Logo',
            ''
        ];

        const body = data.data.map(item => {
            return [
                item._id ||"",
                item.name ||"",
                item.abbreviation ||"",
                {image: true, url: item.logoUrl, height: 40},
                getTableActions(item, '/federalstates/')
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
            baseUrl: '/federalstates/?p={{page}}' + sortQuery + limitQuery
        };

        res.render('federalstates/federalstates', {
            title: 'Bundesländer',
            head,
            body,
            pagination,
            user: res.locals.currentUser ||"",
            limit: true,
            themeTitle: process.env.SC_NAV_TITLE || 'Schul-Cloud'
        });
    });
});

module.exports = router;
