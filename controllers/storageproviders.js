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

const themeTitle = process.env.SC_NAV_TITLE || 'Schul-Cloud';

const PASSWORD = "******";

const types = [
  {label: 'S3', value: 'S3'},
];

const servicePath = '/storageProvider/';

const getTableActions = (item) => {
    const path = '/storageproviders/';
    let actions = [{
        link: path + item._id,
        class: 'btn-edit',
        icon: 'edit',
        title: 'bearbeiten'
    }];
    if(item.freeBuckets === item.maxBuckets) {
    actions.push({
        link: path + item._id,
        class: 'btn-delete',
        icon: 'trash-o',
        method: 'delete',
        title: 'löschen'
    });
    }
    return actions;
};

const sanitize = (body, create=false) => ({
  ...body,
  secretAccessKey: (body.secretAccessKey === PASSWORD ? undefined : body.secretAccessKey),
  isShared: (body.isShared || false),
  freeBuckets: (create ? body.maxBuckets : undefined),
});

const createHandler = (req, res, next) => {
    const body = sanitize(req.body, true);
    api(req).post(servicePath, {
        json: body
    }).then(data => {
        res.redirect(req.header('Referer'));
    }).catch(err => {
        next(err);
    });
};

const updateHandler = (req, res, next) => {
    const body = sanitize(req.body);
    api(req).patch(servicePath + req.params.id, {
        json: body
    }).then(data => {
        res.redirect(req.header('Referer'));
    }).catch(err => {
        next(err);
    });
};


const detailHandler = (req, res, next) => {
    api(req).get(servicePath + req.params.id).then(data => {
        data.secretAccessKey = PASSWORD;
        res.json(data);
    }).catch(err => {
        next(err);
    });
};


const deleteHandler = (req, res, next) => {
    api(req).delete(servicePath + req.params.id).then(_ => {
        res.redirect(req.header('Referer'));
    }).catch(err => {
        next(err);
    });
};

const getHandler = (req, res, next) => {

  const itemsPerPage = (req.query.limit || 10);
  const currentPage = parseInt(req.query.p) || 1;

  api(req).get('/storageProvider/', {
    qs: {
      $limit: itemsPerPage,
      $skip: itemsPerPage * (currentPage - 1),
      $sort: req.query.sort,
    }
  }).then(data => {
    const head = [
      'ID',
      'URL',
      'Anzahl Schulen',
      ''
    ];
    const body = data.data.map(item => {
      return [
        item._id || "",
        item.endpointUrl || "",
        `${item.maxBuckets - item.freeBuckets}/${item.maxBuckets}` || "",
        getTableActions(item)
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
      user: res.locals.currentUser || "",
      limit: true,
      themeTitle,
      types
    });
  });
};

router.use(authHelper.authChecker);

router.patch('/:id', updateHandler);
router.get('/:id', detailHandler);
router.delete('/:id', deleteHandler);
router.post('/', createHandler);
router.get('/', getHandler);

module.exports = router;
