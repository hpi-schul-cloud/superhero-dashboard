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

const sanitizeTool = (req) => {
  req.body.resource_link_id = req.body.resource_link_id || 0;
  req.body.lti_version = req.body.lti_version || "none";
  req.body.lti_message_type = req.body.lti_message_type || "none";
  req.body.secret = req.body.secret || "none";
  req.body.key = req.body.key || "none";
  req.body.isLocal = req.body.isLocal || false;
  req.body.useIframePseudonym = req.body.useIframePseudonym || false;
  req.body.isTemplate = true;
  if(req.body.isLocal) {
    req.body.oAuthClientId = req.body.key;
  }
  return req;
}

const getCreateHandler = (service) => {

    return function (req, res, next) {
      req = sanitizeTool(req);
      api(req).post('/' + service + '/', {
        json: req.body
      }).then(tool => {
        if(req.body.isLocal) {
          api(req).post('/oauth2/clients/', {
            json: {
              "client_id": req.body.key,
              "client_name": req.body.name,
              "client_secret": req.body.secret,
              "redirect_uris": req.body.redirect_url.split(";"),
              "token_endpoint_auth_method": req.body.token_endpoint_auth_method,
              "subject_type": "pairwise"
            }
          }).then(_ => {
            next();
          }).catch(err => {
            next(err);
          });
        } else {
          next();
        }
      }).catch(err => {
          next(err);
      });
    };
};

const getUpdateHandler = (service) => {
    return function (req, res, next) {
      req = sanitizeTool(req);
        api(req).patch('/' + service + '/' + req.params.id, {
            json: req.body
        }).then(data => {
          if(data.oAuthClientId) {
            api(req).put(`/oauth2/clients/${data.oAuthClientId}`, {
              json: {
                "client_name": req.body.name,
                "client_secret": ((req.body.secret === PASSWORD || req.body.secret === "none")
                  ? undefined : req.body.secret),
                "redirect_uris": req.body.redirect_url.split(";"),
                "token_endpoint_auth_method": req.body.token_endpoint_auth_method,
                "subject_type": "pairwise"
              }
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
          if(data.oAuthClientId) {
            api(req).get(`/oauth2/clients/${data.oAuthClientId}`).then(client => {
              data.secret = PASSWORD;
              data.redirect_url = client.redirect_uris.join(";");
              data.token_endpoint_auth_method = client.token_endpoint_auth_method;
              res.json(data);
            });
          } else {
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
          console.log(data);
          if(data.oAuthClientId) {
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

// secure routes
router.use(authHelper.authChecker);

router.get('/search' , function (req, res, next) {

    const itemsPerPage = 10;
    const currentPage = parseInt(req.query.p) || 1;

    api(req).get('/ltitools', {
        qs: {
            name: {
                $regex: _.escapeRegExp(req.query.q),
                $options: 'i'
            },
            $limit: itemsPerPage,
            $skip: itemsPerPage * (currentPage - 1),
            $sort: req.query.sort,
            'isTemplate': true,
        }
    }).then(data => {
        const body = data.data.map(item => {
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

        const pagination = {
            currentPage,
            numPages: Math.ceil(data.total / itemsPerPage),
            baseUrl: '/tools/search/?q=' + res.req.query.q + '&p={{page}}' + sortQuery
        };

        res.render('tools/tools', {title: 'Tools', head, body, pagination, user: res.locals.currentUser,
          themeTitle: process.env.SC_NAV_TITLE || 'Schul-Cloud', versions, messageTypes, privacies, authMethods});
        });
});

router.patch('/:id', getUpdateHandler('ltitools'));
router.get('/:id', getDetailHandler('ltitools'));
router.delete('/:id', getDeleteHandler('ltitools'));
router.post('/', getCreateHandler('ltitools'));
router.all('/', function (req, res, next) {

    const itemsPerPage = (req.query.limit || 10);
    const currentPage = parseInt(req.query.p) || 1;

    api(req).get('/ltitools', {
      qs: {
          $limit: itemsPerPage,
          $skip: itemsPerPage * (currentPage - 1),
          $sort: req.query.sort,
          'isTemplate': true,
      }
    }).then(tools => {
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
});

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
