/*
 * One Controller per layout view
 */

const express = require('express');
const router = express.Router();
const authHelper = require('../helpers/authentication');
const { api } = require('../api');
const moment = require('moment');
moment.locale('de');

const trimWhitespaces = (object) => {
    Object.keys(object).forEach((key) => {
        const type = typeof object[key];
        if (type === 'object') {
            trimWhitespaces(object[key]);
        } else if (type === 'string') {
            object[key] = object[key].trim();
        }
    });
};

const sanitizeToolInputs = (body, create= false) => {
    body.url = body.url || undefined;
    body.logoUrl = body.logoUrl || undefined;
    body.openNewTab = !!body.openNewTab;
    body.isHidden = !!body.isHidden;
    body.config.baseUrl = body.config.baseUrl || undefined;

    switch (body.config.type) {
        case 'oauth2':
            if(!create) {
                // undefine the property prohibits database update of immutable
                body.config.clientId = undefined;
            }
            body.config.clientSecret = body.config.clientSecret || undefined;
            body.config.skipConsent = !!body.config.skipConsent;
            body.config.redirectUris = body.config.redirectUris.split(';');
            body.config.scope = body.config.scope || undefined;
            body.config.frontchannelLogoutUri = body.config.frontchannelLogoutUri || undefined;
            break;
        case 'lti11':
            body.config.secret = body.config.secret || undefined;
            body.config.resource_link_id = body.config.resource_link_id || undefined;
            break;
        case 'basic':
            break;
        default:
            throw new Error('Unknown tool config type');
    }

    if(body.parameters && Array.isArray(body.parameters)) {
        body.parameters.forEach((param) => {
            param.default = param.default || undefined;
            param.regex = param.regex || undefined;
        });
    }

    trimWhitespaces(body);

    return body;
};

const getUpdateHandler = (req, res, next) => {
    req.body = sanitizeToolInputs(req.body);

    api(req, { version: 'v3' }).put(`/tools/${req.params.id}`, {
        json: req.body
    }).then(() => {
        res.redirect(req.header('Referer'));
    }).catch(err => {
        next(err);
    });
};

const getDetailHandler = (req, res, next) => {
    api(req, { version: 'v3' }).get(`/tools/${req.params.id}`).then(data => {
        if (data.config.type === 'oauth2') {
            data.config.redirectUris = data.config.redirectUris.join(';');
        }
        res.json(data);
    }).catch(err => {
        next(err);
    });
};

const getDeleteHandler = (req, res, next) => {
    api(req, { version: 'v3' }).delete(`/tools/${req.params.id}`).then(() => {
        res.redirect(req.header('Referer'));
    }).catch(err => {
        next(err);
    });
};

const getCreateHandler = (req, res, next) => {
    req.body = sanitizeToolInputs(req.body, true);

    api(req, { version: 'v3' }).post('/tools/', {
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

const versions = [
  { label: '1.1', value: 'LTI-1p0' },
  { label: '1.3', value: '1.3.0' },
];

const messageTypes = [
  { label: 'basic-lti-launch-request', value: 'basic-lti-launch-request' },
  { label: 'LtiResourceLinkRequest', value: 'LtiResourceLinkRequest' },
  { label: 'LtiDeepLinkingRequest', value: 'LtiDeepLinkingRequest' },
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
    { label: 'KursId', value: 'auto_courseid' },
    { label: 'Kursname', value: 'auto_coursename' },
    { label: 'SchulId', value: 'auto_schoolid' },
];

const customParameterLocations = [
    { label: 'Path-Parameter', value: 'path' },
    { label: 'Query-Parameter', value: 'query' },
    { label: 'Token-Parameter', value: 'token' },
];

const customParameterScopes = [
    { label: 'Global', value: 'global' },
    { label: 'Schule', value: 'school' },
    { label: 'Kurs', value: 'course' },
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

    api(req, { version: 'v3' }).get('/tools', {
        json: {
            name: req.query.q,
            limit: itemsPerPage,
            skip: itemsPerPage * (currentPage - 1),
            sortOrder,
            sortBy,
        },
    }).then((tools) => {
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
            baseUrl: '/tools/?p={{page}}' + sortQuery + limitQuery
        };

        res.render('ctltools/ctltools', {
            title: 'Tools',
            head,
            body,
            pagination,
            user: res.locals.currentUser,
            limit: true,
            themeTitle: process.env.SC_NAV_TITLE || 'Schul-Cloud',
            versions,
            messageTypes,
            privacies,
            authMethods,
            toolTypes,
            customParameterTypes,
            customParameterScopes,
            customParameterLocations
        });
    }).catch(() => {
        res.render('ctltools/ctltools', {
            title: 'Tools',
            head,
            body: [],
            user: res.locals.currentUser,
            limit: true,
            themeTitle: process.env.SC_NAV_TITLE || 'Schul-Cloud',
            versions,
            messageTypes,
            privacies,
            authMethods,
            toolTypes,
            customParameterTypes,
            customParameterScopes,
            customParameterLocations
        });
    });
};

router.use(authHelper.authChecker);

router.get('/search', showTools);
router.patch('/:id', getUpdateHandler);
router.get('/:id', getDetailHandler);
router.delete('/:id', getDeleteHandler);
router.post('/', getCreateHandler);

router.all('/', showTools);

module.exports = router;
