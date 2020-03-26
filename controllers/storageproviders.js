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

const types = [
  {label: 'Amazon Web Services S3', value: 'awsS3'},
];

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

const sanitize = (body) => ({
  ...body,
  isShared: (body.isShared || false),
})

const getCreateHandler = (service) => {
    return function (req, res, next) {
        const body = sanitize(req.body);
        api(req).post('/' + service + '/', {
            json: body
        }).then(data => {
            res.redirect(req.header('Referer'));
        }).catch(err => {
            next(err);
        });
    };
};

const getUpdateHandler = (service) => {
    return function (req, res, next) {
        const body = sanitize(req.body);
        api(req).patch('/' + service + '/' + req.params.id, {
            json: body
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

router.patch('/:id', getUpdateHandler('storageProvider'));
router.get('/:id', getDetailHandler('storageProvider'));
router.delete('/:id', getDeleteHandler('storageProvider'));
router.post('/', getCreateHandler('storageProvider'));
router.get('/', function (req, res, next) {

    const itemsPerPage = (req.query.limit || 10);
    const currentPage = parseInt(req.query.p) || 1;

    api(req).get('/storageProvider/', {
        qs: {
            $limit: itemsPerPage,
            $skip: itemsPerPage * (currentPage - 1),
            $sort: req.query.sort,
            $populate: 'schools.storageProvider',
        }
    }).then(data => {
        const head = [
            'ID',
            'URL',
            'Anzahl Schulen',
            ''
        ];
        const body = data.data.map(item => {
            const countSchools = (item.schools ? item.schools.length : 0);
            return [
                item._id || "",
                item.endpointUrl || "",
                `${countSchools}/${item.maxBuckets}` || "",
                getTableActions(item, '/storageproviders/')
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
            baseUrl: '/storageproviders/?p={{page}}' + sortQuery + limitQuery
        };

        res.render('storageproviders/storageproviders', {
            title: 'Datenspeicher-Provider',
            head,
            body,
            pagination,
            user: res.locals.currentUser ||"",
            limit: true,
            themeTitle: process.env.SC_NAV_TITLE || 'Schul-Cloud',
            types
        });
    });
});

module.exports = router;
