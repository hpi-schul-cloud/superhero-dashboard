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

const getClient = (body, create = false) => ({
  "client_id": (create ? body.oAuthClientId : undefined),
  "client_name": body.name,
  "client_secret": body.secret,
  "redirect_uris": body.redirect_url.split(";"),
  "token_endpoint_auth_method": body.token_endpoint_auth_method,
  "subject_type": "pairwise",
  "scope": body.scope,
  "frontchannel_logout_uri": body.frontchannel_logout_uri,
});

const sanitizeTool = (req, create=false) => {
  req.body.key = req.body.key || null;
  req.body.resource_link_id = req.body.resource_link_id || null;
  req.body.lti_version = req.body.lti_version || null;
  req.body.lti_message_type = req.body.lti_message_type || null;
  req.body.secret = (req.body.secret === PASSWORD ? undefined : req.body.secret);
  req.body.isTemplate = true;
  if(create || !req.body.isLocal) { // non-local (LTI) tools can be updated forever, local (OAuth2) only during creation
    req.body.oAuthClientId = req.body.oAuthClientId || "";
  } else {
    req.body.oAuthClientId = undefined; // undefine the property prohibits database update
  }
  req.body.isLocal = (create ? !!req.body.isLocal : undefined);
  req.body.scope = req.body.scope || "openid offline";
  req.body.skipConsent = !!req.body.skipConsent;
  req.body.openNewTab = !!req.body.openNewTab;
  req.body.frontchannel_logout_uri = req.body.frontchannel_logout_uri || null;
  return req;
};

const createTool = (req, service, next) => {
  api(req).post('/' + service + '/', {
    json: req.body
  }).then(tool => {
    next();
  }).catch(err => {
    if(req.body.isLocal) {
      api(req).delete(`/oauth2/clients/${req.body.oAuthClientId}`).then(_ => {
        next(err);
      });
    }
    next(err);
  });
};

const getCreateHandler = (service) => {
    return function (req, res, next) {
      req = sanitizeTool(req, true);
      if(req.body.isLocal) {
        return api(req).post('/oauth2/clients/', {
          json: getClient(req.body, true)
        }).then(response => {
          req.body.oAuthClientId = response.client_id;
          createTool(req, service, next);
        }).catch(err => {
          next(err);
        });
      } else {
        createTool(req, service, next);
      }
    };
};

const getUpdateHandler = (service) => {
    return function (req, res, next) {
      req = sanitizeTool(req);
      return api(req).patch('/' + service + '/' + req.params.id, {
          json: req.body
      }).then(data => {
        if(data.isLocal) {
          return api(req).put(`/oauth2/clients/${data.oAuthClientId}`, {
            json: getClient(req.body)
          }).then(_ => {
            res.redirect(req.header('Referer'));
          });
        }
      res.redirect(req.header('Referer'));
      }).catch(err => {
          next(err);
      });
    };
};

const getDetailHandler = (service) => {
    return function (req, res, next) {
        api(req).get('/' + service + '/' + req.params.id).then(data => {
          if(data.isLocal) {
            api(req).get(`/oauth2/clients/${data.oAuthClientId}`).then(client => {
              data.secret = PASSWORD;
              data.redirect_url = client.redirect_uris.join(";");
              data.token_endpoint_auth_method = client.token_endpoint_auth_method;
              data.scope = client.scope;
              data.frontchannel_logout_uri = client.frontchannel_logout_uri;
              res.json(data);
            });
          } else {
            data.secret = PASSWORD;
            res.json(data);
          }
        }).catch(err => {
          next(err);
        });
    };
};

const getDeleteHandler = (service) => {
    return function (req, res, next) {
        api(req).delete('/' + service + '/' + req.params.id).then(data => {
          if(data.isLocal) {
            api(req).delete(`/oauth2/clients/${data.oAuthClientId}`).then(_ => {
              res.redirect(req.header('Referer'));
            });
          } else {
            res.redirect(req.header('Referer'));
          }
        }).catch(err => {
            next(err);
        });
    };
};

const head = [
  'ID',
  'Name',
  'OAuthClientId',
  '',
];

const versions = [
  {label: 'none', value: '-'},
  {label: '1.1', value: 'LTI-1p0'},
  {label: '1.3', value: '1.3.0'},
];

const messageTypes = [
  {label: '-', value: 'none'},
  {label: 'basic-lti-launch-request', value: 'basic-lti-launch-request'},
  {label: 'LtiResourceLinkRequest', value: 'LtiResourceLinkRequest'},
  {label: 'LtiDeepLinkingRequest', value: 'LtiDeepLinkingRequest'},
];

const privacies = [
  {label: 'Anonym', value: 'anonymous'},
  {label: 'Pseudonym', value: 'pseudonymous'},
  {label: 'E-Mail', value: 'e-mail'},
  {label: 'Name', value: 'name'},
  {label: 'Öffentlich', value: 'public'},
];

const authMethods = [
  {label: 'client_secret_basic', value: 'client_secret_basic'},
  {label: 'client_secret_post', value: 'client_secret_post'},
];

const showTools = (req, res) => {
  const itemsPerPage = (req.query.limit || 10);
  const currentPage = parseInt(req.query.p) || 1;
  api(req).get('/ltitools', {
    qs: {
      name: (req.query.q ? {
        $regex: _.escapeRegExp(req.query.q),
        $options: 'i'
      } : undefined),
      $limit: itemsPerPage,
      $skip: itemsPerPage * (currentPage - 1),
      $sort: req.query.sort,
      'isTemplate': true,
    },
  }).then((tools) => {
    const body = tools.data.map(item => {
      return [
        item._id ||"",
        item.name ||"",
        item.oAuthClientId || "",
        getTableActions(item, '/tools/')
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

    res.render('tools/tools', {title: 'Tools', head, body, pagination, user: res.locals.currentUser, limit: true,
      themeTitle: process.env.SC_NAV_TITLE || 'Schul-Cloud', versions, messageTypes, privacies, authMethods});
  });
}

// secure routes
router.use(authHelper.authChecker);

router.get('/search' , showTools);

router.patch('/:id', getUpdateHandler('ltitools'));
router.get('/:id', getDetailHandler('ltitools'));
router.delete('/:id', getDeleteHandler('ltitools'));
router.post('/', getCreateHandler('ltitools'));
router.all('/', showTools);

router.get('/', function (req, res, next) {
    api(req).get('/ltitools/').then(ltitools => {
        res.render('tools/tools', {
            title: 'Tools',
            user: res.locals.currentUser,
            tools: ltitools.data,
            themeTitle: process.env.SC_NAV_TITLE || 'Schul-Cloud'
        });
    });
});

module.exports = router;
