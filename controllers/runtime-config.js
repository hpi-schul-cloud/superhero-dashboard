/*
 * One Controller per layout view
 */

const express = require('express');
const router = express.Router();
const authHelper = require('../helpers/authentication');
const { api } = require('../api');
const moment = require('moment');
moment.locale('de');

router.use(authHelper.authChecker);

let runtimeConfig = [];

const updateHandler = (req, res, next) => {
    let value = req.body.value;
    const config = runtimeConfig.find(c => c.key === req.params.key);
    if (config) {
        if (config.type === 'boolean') {
            value = req.body.value === 'checked' || false;
        } else if (config.type === 'number') {
            value = Number(req.body.value);
        }
        config.value = value;
    }

    api(req, { version: 'v3' }).patch(`/runtime-config/${req.params.key}`, {
        json: { value: value }
    }).then(({ value }) => {
        res.status(200).json({ value });
    }).catch(err => {
        next(err);
    });
};

const listHandler = (req, res, next) => {
    api(req, { version: 'v3' }).get(`/runtime-config`).then(data => {
        const head = [
            'Name',
            'Wert',
            ''
        ];

        runtimeConfig = data.data.map(config => {
            return {
                key: config.key,
                value: config.value,
                description: config.description,
                type: config.type,
                isString: config.type === 'string',
                isNumber: config.type === 'number',
                isBoolean: config.type === 'boolean',
            };
        });

        res.render('runtime-config/runtime-config', {
            title: 'Konfiguration',
            head,
            values: runtimeConfig,
            user: res.locals.currentUser ||"",
            themeTitle: process.env.SC_NAV_TITLE || 'Schul-Cloud'
        });
    });
};

router.patch('/:key', updateHandler);
router.get('/', listHandler);
module.exports = router;
