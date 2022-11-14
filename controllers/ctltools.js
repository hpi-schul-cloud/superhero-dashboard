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
const PASSWORD = "******";

const getHydraVersion = () => {
    return process.env.FEATURE_LEGACY_HYDRA_ENABLED ? 'v1' : 'v3';
};

const HYDRA_VERSION = getHydraVersion();

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

const mapToolToOauthClient = (body, create = false) => {
    const { config } = body;
    return {
        client_id: create ? config.clientId : undefined,
        client_name: body.name,
        client_secret: config.clientSecret,
        redirect_uris: config.redirectUris.split(";"),
        token_endpoint_auth_method: config.tokenEndpointAuthMethod,
        subject_type: "pairwise",
        scope: config.scope,
        frontchannel_logout_uri: config.frontchannelLogoutUri,
    };
};

const mapOauthClientToOauthConfig = (client) => {
    return {
        clientId: client.client_id,
        clientSecret: PASSWORD,
        redirectUris: client.redirect_uris.join(";"),
        tokenEndpointAuthMethod: client.token_endpoint_auth_method,
        scope: client.scope,
        frontchannelLogoutUri: client.frontchannel_logout_uri,
    };
};

const sanitizeSecret = (secret, create) => secret === PASSWORD && !create ? undefined : secret;

const sanitizeToolInputs = (body, create=false) => {
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
            body.config.skipConsent = !!body.config.skipConsent;
            body.config.clientSecret = sanitizeSecret(body.config.clientSecret);
            break;
        case 'lti11':
            body.config.secret = sanitizeSecret(body.config.secret);
            body.config.resource_link_id = body.config.resource_link_id || undefined;
            body.config.launch_presentation_locale = body.config.launch_presentation_locale || undefined;
            body.config.launch_presentation_document_target = body.config.launch_presentation_document_target || undefined;
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
    return body;
};

const getUpdateHandler = (req, res, next) => {
    req.body = sanitizeToolInputs(req.body);

    api(req, { version: 'v3' }).patch(`/tools/${req.params.id}`, {
        json: req.body
    }).then(data => {
        if(data.config.type === 'oauth2') {
            api(req, { version: HYDRA_VERSION }).put(`/oauth2/clients/${data.config.clientId}`, {
                json: mapToolToOauthClient(req.body)
            });
        }
        res.redirect(req.header('Referer'));
    }).catch(err => {
        next(err);
    });
};

const getDetailHandler = (req, res, next) => {
    api(req, { version: 'v3' }).get(`/tools/${req.params.id}`).then(data => {
        if (data.config.type === 'oauth2') {
            api(req, { version: HYDRA_VERSION }).get(`/oauth2/clients/${data.config.clientId}`).then(client => {
                data.config = { ...data.config, ...mapOauthClientToOauthConfig(client) };
                res.json(data);
            });
        } else if (data.config.type === 'lti11') {
            req.body.config.secret = PASSWORD;
        }
    }).catch(err => {
        next(err);
    });
};

const getDeleteHandler = (req, res, next) => {
    api(req, { version: 'v3' }).delete(`/tools/${req.params.id}`).then(data => {
        if (data.config.type === 'oauth2') {
            api(req, { version: HYDRA_VERSION }).delete(`/oauth2/clients/${data.config.clientId}`);
        }
        res.redirect(req.header('Referer'));
    }).catch(err => {
        next(err);
    });
};

const createTool = (req, next) => {
    api(req, { version: 'v3' }).post('/tools/', {
        json: req.body
    }).then(_ => {
        next();
    }).catch(err => {
        if (req.body.config.type === 'oauth2') {
            api(req, { version: HYDRA_VERSION }).delete(`/oauth2/clients/${req.body.config.clientId}`).then(_ => {
                next(err);
            });
        }
        next(err);
    });
};

const getCreateHandler = (req, res, next) => {
    req.body = sanitizeToolInputs(req.body, true);

    if(req.body.config.type === 'oauth2') {
        api(req, { version: HYDRA_VERSION }).post('/oauth2/clients/', {
            json: mapToolToOauthClient(req.body, true)
        }).then(response => {
            req.body.config.clientId = response.client_id;
            createTool(req, next);
        }).catch(err => {
            next(err);
        });
    } else {
        createTool(req, next);
    }
};

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
        });
    }).catch(() => {
        res.render('ctltools/ctltools', {
            title: 'Tools',
            head,
            body: [],
            user: res.locals.currentUser,
            limit: true,
            themeTitle: process.env.SC_NAV_TITLE || 'Schul-Cloud',
        });
    });
};


// secure routes
router.use(authHelper.authChecker);

router.get('/search', showTools);
router.patch('/:id', getUpdateHandler);
router.get('/:id', getDetailHandler);
router.delete('/:id', getDeleteHandler);
router.post('/', getCreateHandler);

router.all('/', showTools);

module.exports = router;
