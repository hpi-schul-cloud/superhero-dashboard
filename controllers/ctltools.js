/*
 * One Controller per layout view
 */

const express = require('express');
const router = express.Router();
const authHelper = require('../helpers/authentication');
const { api } = require('../api');
const moment = require('moment');
const {isFeatureFlagTrue} = require("../helpers/featureFlagHelper");
moment.locale('de');

const MEDIA_SHELF_ENABLED = isFeatureFlagTrue(process.env.FEATURE_MEDIA_SHELF_ENABLED)

const clearEmptyInputs = (object) => {
    Object.keys(object).forEach((key) => {
        const type = typeof object[key];

        switch (type) {
            case 'object':
                clearEmptyInputs(object[key]);

                if(JSON.stringify(object[key]) === JSON.stringify({})) {
                    object[key] = undefined;
                }
                break;
            case 'string':
                object[key] = object[key].trim();

                if(object[key] === "") {
                    object[key] = undefined;
                }
                break;
            case 'boolean':
            case 'number':
                break;
            default:
                console.log('Unsupported type for sanitization');
                break;
        }
    });
}

const transformToolInputs = (id, body) => {
    body.id = id;

    body.openNewTab = !!body.openNewTab;
    body.isHidden = !!body.isHidden;
    body.isDeactivated = !!body.isDeactivated;
    body.restrictToContexts = [].concat(body.restrictToContexts || []);

    if (body.config.type === 'oauth2') {
        body.config.skipConsent = !!body.config.skipConsent;
        body.config.redirectUris = body.config.redirectUris.split(';');
    }

    if(body.parameters && Array.isArray(body.parameters)) {
        body.parameters.forEach((param) => {
            param.isOptional = !!param.isOptional;
            param.isProtected = !!param.isProtected;
        });
    }

    clearEmptyInputs(body);

    return body;
};

const getUpdateHandler = (req, res, next) => {
    req.body = transformToolInputs(req.params.id, req.body);

    api(req, { version: 'v3' }).post(`/tools/external-tools/${req.params.id}`, {
        json: req.body
    }).then(() => {
        res.redirect(req.header('Referer'));
    }).catch(err => {
        next(err);
    });
};

const convertZerosToString = (obj) => {
    Object.keys(obj).forEach(key => {
        if (typeof obj[key] === 'object') {
            convertZerosToString(obj[key]);
        } else if (obj[key] === 0) {
            obj[key] = '0';
        }
    });
}

const getDetailHandler = (req, res, next) => {
    Promise.all([
        api(req, { version: 'v3' }).get(`/tools/external-tools/${req.params.id}`),
        api(req, { version: 'v3' }).get(`/tools/external-tools/${req.params.id}/metadata`)
    ]).then(([toolData, toolMetaData]) => {
        if (toolData.config.type === 'oauth2') {
            toolData.config.redirectUris = toolData.config.redirectUris.join(';');
        }

        const showMediaShelfCount = !MEDIA_SHELF_ENABLED && toolMetaData.contextExternalToolCountPerContext.mediaBoard === 0;
        if (showMediaShelfCount) {
            delete toolMetaData.contextExternalToolCountPerContext.mediaBoard;
        }

        convertZerosToString(toolMetaData);
        res.json({...toolData, ...toolMetaData});

    }).catch(err => {
        next(err);
    });
};

const getDeleteHandler = (req, res, next) => {
    api(req, { version: 'v3' }).delete(`/tools/external-tools/${req.params.id}`).then(() => {
        res.redirect(req.header('Referer'));
    }).catch(err => {
        next(err);
    });
};

const getCreateHandler = (req, res, next) => {
    req.body = transformToolInputs(undefined, req.body);

    api(req, { version: 'v3' }).post('/tools/external-tools/', {
        json: req.body
    }).then(() => {
        next();
    }).catch(err => {
        next(err);
    });
};

const getTableActions = (item, path) => {
    return [
        {
            link: path + item.id,
            class: 'btn-edit',
            icon: 'edit',
            title: 'bearbeiten'
        },
        {
            link: path + item.id + '/datasheet',
            class: 'btn-data-sheet',
            icon: 'file-text-o',
            title: 'Datenblatt anzeigen',
            target: '_blank'
        },
        {
            link: path + item.id,
            class: 'btn-delete',
            icon: 'trash-o',
            method: 'delete',
            title: 'löschen'
        }
    ];
};

const head = [
    'ID',
    'Name',
    'OAuthClientId',
    '',
];

const messageTypes = [
  { label: 'basic-lti-launch-request', value: 'basic-lti-launch-request' },
];

const privacies = [
  { label: 'Anonym', value: 'anonymous' },
  { label: 'Pseudonym', value: 'pseudonymous' },
  { label: 'E-Mail', value: 'e-mail' },
  { label: 'Name', value: 'name' },
  { label: 'Öffentlich', value: 'public' },
];

const authMethods = [
  { label: 'client_secret_basic', value: 'client_secret_basic' },
  { label: 'client_secret_post', value: 'client_secret_post' },
];

const toolTypes = [
    { label: 'Basic', value:'basic', active:'active' },
    { label: 'OAuth2', value:'oauth2' },
    { label: 'Lti 1.1', value:'lti11' },
];

const customParameterTypes = [
    { label: 'String', value: 'string' },
    { label: 'Number', value: 'number' },
    { label: 'Boolean', value: 'boolean' },
    { label: 'Context Id', value: 'auto_contextid' },
    { label: 'Context Name', value: 'auto_contextname' },
    { label: 'Schul Id', value: 'auto_schoolid' },
    { label: 'Offizielle Schulnummer', value: 'auto_schoolnumber' },
    { label: 'Medium Id', value: 'auto_mediumid' },
    { label: 'moin.schule Gruppen UUID', value: 'auto_moinschule_groupuuid' },
];

const customParameterLocations = [
    { label: 'Path-Parameter', value: 'path' },
    { label: 'Query-Parameter', value: 'query' },
    { label: 'Body-Parameter', value: 'body' },
];

const customParameterScopes = [
    { label: 'Global', value: 'global' },
    { label: 'Schule', value: 'school' },
    { label: 'Context', value: 'context' },
];

const showTools = (req, res) => {
    const itemsPerPage = (req.query.limit || 10);
    const currentPage = parseInt(req.query.p) || 1;

    let sortOrder;
    let sortBy;
    if (req.query.sort) {
        if (req.query.sort.startsWith('-')) {
            sortOrder = 'desc';
            sortBy = req.query.sort.substring(1);
        } else {
            sortOrder = 'asc';
            sortBy = req.query.sort;
        }

        if(sortBy === '_id') {
            sortBy = 'id';
        } else if(sortBy === 'undefined') {
            sortBy = undefined;
        }
    }

    Promise.all([
        api(req, {version: 'v3'}).get('/tools/context-types'),
        api(req, {version: 'v3'}).get('/tools/external-tools', {
            qs: {
                name: req.query.q,
                limit: itemsPerPage,
                skip: itemsPerPage * (currentPage - 1),
                sortOrder,
                sortBy,
            },
        })
    ]).then(([contextTypes, tools]) => {
        const toolContextTypes = contextTypes.data;

        const body = tools.data.map(item => {
            return [
                item.id || "",
                item.name || "",
                item.config.clientId || "",
                getTableActions(item, '/ctltools/')
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
            numPages: Math.ceil(tools.total / itemsPerPage),
            baseUrl: '/ctltools/?p={{page}}' + sortQuery + limitQuery
        };

        res.render('ctltools/ctltools', {
            title: 'Tools',
            head,
            body,
            pagination,
            user: res.locals.currentUser,
            limit: true,
            themeTitle: process.env.SC_NAV_TITLE || 'Schul-Cloud',
            messageTypes,
            privacies,
            authMethods,
            toolTypes,
            customParameterTypes,
            customParameterScopes,
            customParameterLocations,
            toolContextTypes
        });
    }).catch(err => {
        next(err);
    });
};

const getDatasheet = (req,res,next) => {
    try {
        api(req, { version: 'v3' }).get(`/tools/external-tools/${req.params.id}/datasheet`).pipe(res);
    } catch (e) {
        next(e);
    }
}

router.use(authHelper.authChecker);

router.get('/search', showTools);
router.put('/:id', getUpdateHandler);
router.get('/:id', getDetailHandler);
router.delete('/:id', getDeleteHandler);
router.post('/', getCreateHandler);
router.get('/:id/datasheet', getDatasheet);

router.all('/', showTools);

module.exports = router;
