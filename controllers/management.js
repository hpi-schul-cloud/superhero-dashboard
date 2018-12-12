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

// secure routes
router.use(authHelper.authChecker);

router.get('/releases', function (req, res, next) {
    api(req).get('/releases/fetch').then(() => {
        res.sendStatus(200);
    }).catch(err => {
        next(err);
    });
});

router.get('/timeline/fetch/:id', function (req, res, next) {
    api(req).get(`/timelines/fetch/${req.params.id}`).then(() => {
        res.sendStatus(200);
    }).catch(err => {
        next(err);
    });
});

router.get('/timeline/:id', function (req, res, next) {
    api(req).get(`/timelines/${req.params.id}`, {
        qs: {
            $select: [
                '_id',
                'title',
                'fetchUrl',
                'documentUrl'
            ]
        },
    }).then((response) => {
        res.json(response);
    }).catch(err => {
        next(err);
    });
});

router.patch('/timeline/:id', function (req, res, next) {
    api(req).patch(`/timelines/${req.params.id}`, {
        // TODO: sanitize
        json: req.body
    }).then(() => {
        res.redirect(`/management`);
    }).catch(err => {
        next(err);
    });
});

router.get('/', function (req, res, next) {
    api(req).get('/timelines', {qs: {
        $limit: 100,
        $select: [
            '_id',
            'title',
            'documentUrl'
        ]
    }}).then((timelineData) => {
        let timelines = {
            head: [
                'Titel/Name',
                'Actions'
            ]
        };
        timelines.body = timelineData.data.map((entry) => {
            return [
                entry.title,
                [
                    {
                        link: `/management/timeline/fetch/${entry._id}`,
                        class: "ajax-link",
                        attributes: `data-success-message="'${entry.title}' erfolgreich aktualisiert"`,
                        icon: 'refresh',
                        title: 'Einträge Aktualisieren'
                    },
                    {
                        link: `/management/timeline/${entry._id}`,
                        class: "btn-edit",
                        icon: 'edit',
                        title: 'Daten bearbeiten'
                    },
                    {
                        link: `${entry.documentUrl}`,
                        attributes: `target="_blank"`,
                        icon: 'file',
                        title: 'Dokument bearbeiten'
                    },
                ]
            ];
        });

        res.render('management/management', {
            title: 'Allgemeine Verwaltung',
            user: res.locals.currentUser,
            timelines,
        });
    }).catch(err => {
        next(err);
    });
});

module.exports = router;
