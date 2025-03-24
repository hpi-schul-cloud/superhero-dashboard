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
  // 'studentVisibility', // is now handled instead with env vars / permission in school combination
  'messengerSchoolRoom',
  'oauthProvisioningEnabled',
  'showOutdatedUsers',
  'enableLdapSyncDuringMigration'
];

const USER_MIGRATION_ENABLED = isFeatureFlagTrue(process.env.FEATURE_USER_LOGIN_MIGRATION_ENABLED);
const SHOW_OUTDATED_USERS = isFeatureFlagTrue(process.env.FEATURE_SHOW_OUTDATED_USERS);
const ENABLE_LDAP_SYNC_DURING_MIGRATION = isFeatureFlagTrue(process.env.FEATURE_ENABLE_LDAP_SYNC_DURING_MIGRATION);

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
  {
    link: path + item._id,
    class: "btn-delete-files",
    icon: "files-o",
    method: "delete",
    title: "Alle Dateien der Schule löschen",
  },
];

const getStorageTypes = () => [
  {
    label: 'S3',
    value: 'awsS3',
  },
];

const getDateFormat = (date) => {
  const formattedDate = moment(date).format("DD.MM.YYYY HH:mm");
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
    item.userLoginMigration?.startedAt ? getDateFormat(item.userLoginMigration.startedAt) : '',
    item.userLoginMigration?.mandatorySince ? getDateFormat(item.userLoginMigration.mandatorySince) : '',
    item.userLoginMigration?.closedAt ? getDateFormat(item.userLoginMigration.closedAt) : '',
    item.userLoginMigration?.finishedAt && Date.now() >= new Date(item.userLoginMigration.finishedAt).getTime() ? getDateFormat(item.userLoginMigration.finishedAt) : '',
    item.systems.map(system => system.alias).join(',') || ''
  ];
};

const customSort = (a, b, sortCriteria) => {
  let direction = sortCriteria.startsWith('-') ? -1 : 1;
  if (direction === -1) sortCriteria = sortCriteria.substring(1);

  const valueA = _.get(a, sortCriteria);
  const valueB = _.get(b, sortCriteria);

  if (valueA === undefined) return direction;
  if (valueB === undefined) return -direction;

  // Compare values, localeCompare will handle null and strings correctly
  return direction * String(valueA).localeCompare(String(valueB));
}

const sortSchools = (schools, sortCriteria) => {
  return schools.sort((a, b) => {
    switch (sortCriteria) {
      case 'userLoginMigration.startedAt':
      case '-userLoginMigration.startedAt':
      case 'userLoginMigration.mandatorySince':
      case '-userLoginMigration.mandatorySince':
      case 'userLoginMigration.closedAt':
      case '-userLoginMigration.closedAt':
      case 'userLoginMigration.finishedAt':
      case '-userLoginMigration.finishedAt':
        return customSort(a, b, sortCriteria);
      default:
        return 0;
    }
  });
};

const collectSchoolFeatures = (data) => {
  const features = [];
  for (let feature of SCHOOL_FEATURES) {
    let key = "hasFeature_" + feature;
    if (data[key]) {
      features.push(feature);
    }
  }
  return features;
}

const separateSchoolFeatures = (data) => {
  for (let feature of SCHOOL_FEATURES) {
    let key = 'hasFeature_' + feature;
    if (data.features) {
      data[key] = data.features.indexOf(feature) !== -1;
    } else {
      data[key] = false;
    }
  }
  return data;
}

const getCreateHandler = (service) => {
  return function (req, res, next) {
    req.body.features = collectSchoolFeatures(req.body);

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
  return async function (req, res, next) {
    try {
      const configuration = await api(req, {version: 'v3'}).get(`/config/public`);

      

      if (configuration.TEACHER_STUDENT_VISIBILITY__IS_CONFIGURABLE) {
        await api(req, {version: 'v3'}).patch(`/school/${req.params.id}`, {
          json: {
            permissions: {
              teacher: {
                STUDENT_LIST: !!req.body.hasFeature_studentVisibility
              }
            }
          },
        })
      }

      req.body.features = collectSchoolFeatures(req.body);

      await api(req).patch('/' + service + '/' + req.params.id, {
        // TODO: sanitize
        json: req.body,
      })

      res.redirect(req.header('Referer'));
    } catch (err) {
      next(err);
    }
  };
};

const getDetailHandler = (service) => {
  return async function (req, res, next) {
    try {
      const configuration = await api(req, { version: 'v3' }).get(`/config/public`);
      const data = await api(req).get('/' + service + '/' + req.params.id)

      // parse school features
      separateSchoolFeatures(data);

      if (!configuration.TEACHER_STUDENT_VISIBILITY__IS_CONFIGURABLE) {
        data.hasFeature_studentVisibility_disabled = true;
      }

      data.hasFeature_studentVisibility = !!configuration.TEACHER_STUDENT_VISIBILITY__IS_ENABLED_BY_DEFAULT;

      if (data.permissions && data.permissions.teacher && data.permissions.teacher.STUDENT_LIST !== undefined) {
        data.hasFeature_studentVisibility = data.permissions.teacher.STUDENT_LIST;
      }

      if (data.county && data.county.name && data.county._id) {
        data.county = data.county._id;
      }

      res.json(data);
    } catch (err) {
      next(err);
    }
  }
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

const getDeleteFilesHandler = () => {
  return function (req, res, next) {
    api(req, { version: 'v3', filesStorageApi: true })
      .delete('/admin/file/storage-location/school/' + req.params.id)
      .then((result) => {
        console.log(result);
        res.render('schools/after-files-delete', {
          title: 'Alle Dateien der Schule würden gelöscht',
          data: result
        });
      })
      .catch((err) => {
        next(err);
      });
  };
};

const getHandler = async (req, res) => {
  const itemsPerPage = req.query.limit || 10;
  const currentPage = parseInt(req.query.p) || 1;
  const sortCriteria = req.query.sort || '';

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
          $sort: sortCriteria,
          $populate: ['federalState', 'systems', 'userLoginMigration'],
        },
      }),
      getStorageProviders(req),
    ]);

    const head = ['ID', 'Name', 'Timezone', 'Bundesland', 'Filestorage', ...getMigrationHead(), ''];

    const sortedSchools = sortSchools(schools.data, sortCriteria);

    const body = sortedSchools.map((item) => {
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
      SHOW_OUTDATED_USERS,
      ENABLE_LDAP_SYNC_DURING_MIGRATION,
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
router.delete("/:id/delete-files", getDeleteFilesHandler());

module.exports = router;
