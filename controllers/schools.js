/*
 * One Controller per layout view
 */

const _ = require('lodash');
const express = require('express');
const router = express.Router();
const authHelper = require('../helpers/authentication');
const { getTimezones } = require('../helpers/timeZoneHelper');
const { isFeatureFlagTrue } = require('../helpers/featureFlagHelper');
const { api } = require('../api');
const moment = require('moment-timezone');

moment.locale('de');

const SCHOOL_FEATURES = [
  'rocketChat',
  'videoconference',
  'messenger',
  'studentVisibility',
  'messengerSchoolRoom',
];

const USER_MIGRATION_ENABLED = isFeatureFlagTrue(process.env.FEATURE_SCHOOL_SANIS_USER_MIGRATION_ENABLED);

const getTableActions = (item, path) => [
  {
    link: path + item._id,
    class: 'btn-edit',
    icon: 'edit',
    title: 'bearbeiten',
  },
  {
    link: path + item._id,
    class: 'btn-delete',
    icon: 'trash-o',
    method: 'delete',
    title: 'löschen',
  },
];

const getStorageTypes = () => [
  {
    label: 'S3',
    value: 'awsS3',
  },
];

const getDateFormat = (date) => {
  const formattedDate = moment(date).tz("Europe/Berlin").format("DD.MM.YYYY HH:mm");
  return formattedDate;
};

const getStorageProviders = async (req) => {
  const providers = await api(req).get('/storageProvider/');
  return providers.data.map((p) => ({
    label: `${p.endpointUrl} (${p.accessKeyId})`,
    value: p._id,
  }));
};

// Extracts all counties from federalstates
const getAllCounties = (federalStates) => {
  if (!federalStates || !federalStates.data || !federalStates.data.length) {
    return [];
  }

  let counties = [];
  federalStates.data.forEach((state) => {
    if (!state.counties || !state.counties.length) {
      return;
    }

    const allCounties = state.counties.filter(county => county && county.name);

    counties = [...counties, ...allCounties];
  });

  return counties;
};

const getMigrationHead = () => {
  if(!USER_MIGRATION_ENABLED){
    return [];
  }

  return [
    'Migration gestartet',
    'Migration verpflichtend',
    'Migration abgeschlossen',
    'Migration final beendet',
    'Login-System'
  ];
};

const getMigrationBody = (item) => {
  if(!USER_MIGRATION_ENABLED){
    return [];
  }

  return [
    item.oauthMigrationStart ? getDateFormat(item.oauthMigrationStart) : '',
    item.oauthMigrationMandatory ? getDateFormat(item.oauthMigrationMandatory) : '',
    item.oauthMigrationFinished ? getDateFormat(item.oauthMigrationFinished) : '',
    Date.now() >= new Date(item.oauthMigrationFinalFinish).getTime() ? getDateFormat(item.oauthMigrationFinalFinish) : '',
    item.systems.map(system => system.alias).join(',') || ''
  ];
};

const getCreateHandler = (service) => {
  return function (req, res, next) {
    api(req)
      .post('/' + service + '/', {
        // TODO: sanitize
        json: req.body,
      })
      .then((data) => {
        next();
      })
      .catch((err) => {
        next(err);
      });
  };
};

const getUpdateHandler = (service) => {
  return function (req, res, next) {
    // parse school features
    req.body.features = [];
    for (let feature of SCHOOL_FEATURES) {
      let key = 'hasFeature_' + feature;
      if (req.body[key]) {
        req.body.features.push(feature);
      }
    }

    api(req)
      .patch('/' + service + '/' + req.params.id, {
        // TODO: sanitize
        json: req.body,
      })
      .then((data) => {
        res.redirect(req.header('Referer'));
      })
      .catch((err) => {
        next(err);
      });
  };
};

const getDetailHandler = (service) => {
  return function (req, res, next) {
    api(req)
      .get('/' + service + '/' + req.params.id)
      .then((data) => {
        // parse school features
        for (let feature of SCHOOL_FEATURES) {
          let key = 'hasFeature_' + feature;
          if (data.features) {
            data[key] = data.features.indexOf(feature) !== -1;
          } else {
            data[key] = false;
          }
        }

        if (data.county && data.county.name && data.county._id) {
          data.county = data.county._id;
        }

        res.json(data);
      })
      .catch((err) => {
        next(err);
      });
  };
};

const getDeleteHandler = (service) => {
  return function (req, res, next) {
    api(req)
      .delete('/' + service + '/' + req.params.id)
      .then((_) => {
        res.redirect(req.header('Referer'));
      })
      .catch((err) => {
        next(err);
      });
  };
};

const getHandler = async (req, res) => {
  const itemsPerPage = req.query.limit || 10;
  const currentPage = parseInt(req.query.p) || 1;

  try {
    const [federalStates, schools, storageProvider] = await Promise.all([
      api(req).get('/federalStates'),
      api(req).get('/schools', {
        qs: {
          name: req.query.q
            ? {
                $regex: _.escapeRegExp(req.query.q),
                $options: 'i',
              }
            : undefined,
          $limit: itemsPerPage,
          $skip: itemsPerPage * (currentPage - 1),
          $sort: req.query.sort,
          $populate: ['federalState','systems'],
        },
      }),
      getStorageProviders(req),
    ]);

    const head = ['ID', 'Name', 'Timezone', 'Bundesland', 'Filestorage', ...getMigrationHead(), ''];

    const body = schools.data.map((item) => {
      return [
        item._id || '',
        item.name || '',
        item.timezone || '',
        (item.federalState || {}).name || '',
        item.fileStorageType || '',
        ...getMigrationBody(item),
        getTableActions(item, '/schools/'),
      ];
    });

    const sortQuery = req.query.sort ? `&sort=${req.query.sort}` : '';
    const limitQuery = req.query.limit ? `&limit=${req.query.limit}` : '';
    const searchQuery = req.query.q ? `&q=${req.query.q}` : '';

    const pagination = {
      currentPage,
      numPages: Math.ceil(schools.total / itemsPerPage),
      baseUrl: `/schools/?p={{page}}${sortQuery}${limitQuery}${searchQuery}`,
    };

    const allCounties = getAllCounties(federalStates);

    res.render('schools/schools', {
      title: 'Schulen',
      head,
      body,
      pagination,
      federalState: federalStates.data,
      county: allCounties,
      user: res.locals.currentUser,
      storageType: getStorageTypes(),
      timeZones: getTimezones(),
      storageProvider,
      limit: true,
      themeTitle: process.env.SC_NAV_TITLE || 'Schul-Cloud',
    });
  } catch (err) {
    res.render('schools/schools', {
      title: 'Schulen',
      notification: {
        type: 'danger',
        message: err.message ? err.message : err.error.message,
      },
    });
  }
};

// secure routes
router.use(authHelper.authChecker);

router.patch('/:id', getUpdateHandler('schools'));
router.get('/:id', getDetailHandler('schools'));
router.delete('/:id', getDeleteHandler('schools'));
router.post('/', getCreateHandler('schools'));
router.all('/', getHandler);

module.exports = router;
