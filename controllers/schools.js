/*
 * One Controller per layout view
 */

const _ = require('lodash');
const express = require('express');
const router = express.Router();
const authHelper = require('../helpers/authentication');
const api = require('../api');
const moment = require('moment-timezone');

moment.locale('de');

// let timeZones = moment.tz.names();
// timeZones = timeZones.map((item) => {
//     return moment.tz.zone(item).country;
// });
function timeConvert(num) {
    let hours = (num / 60);
    let rhours = Math.floor(hours);
    let minutes = (hours - rhours) * 60;
    rhours = rhours > 0 ? `+${rhours}` : rhours;
    minutes = minutes === 0 ? '00' : minutes;
    return `${rhours}:${minutes}`;
}
let countryCodes = moment.tz.countries();
countryCodes = countryCodes.map((item) => {
    return moment.tz.zonesForCountry(item, true);
});
countryCodes = [].concat.apply([], countryCodes);

countryCodes = countryCodes.map((item) => {
    return {
        name: item.name,
        offset: timeConvert(item.offset)
    };
});
// const offsetTmz = [];
// for(let item in timeZones) {
//     offsetTmz.push(" (GMT"+moment.tz(timeZones[item]).format('Z')+")" + timeZones[item]);
// }
// offsetTmz.sort();
// console.log(offsetTmz);

const SCHOOL_FEATURES = [
    'rocketChat',
    'videoconference',
    'messenger',
    'studentVisibility',
    'messengerSchoolRoom',
];

const getTableActions = (item, path) => ([
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
    },
]);

const getStorageTypes = () => [
	{
		label: 'S3',
		value: 'awsS3',
	},
];

const getStorageProviders = async (req) => {
  const providers = await api(req).get('/storageProvider/');
  return providers.data.map(p => ({
    label: `${p.endpointUrl} (${p.accessKeyId})`,
    value: p._id,
  }));
};

const getCreateHandler = (service) => {
    return function (req, res, next) {
        api(req).post('/' + service + '/', {
            // TODO: sanitize
            json: req.body
        }).then(data => {
            next();
        }).catch(err => {
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

        api(req).patch('/' + service + '/' + req.params.id, {
            // TODO: sanitize
            json: req.body
        }).then(data => {
            res.redirect(req.header('Referer'));
        }).catch(err => {
            next(err);
        });
    };
};

const getDetailHandler = (service) => {
    return function (req, res, next) {
        api(req).get('/' + service + '/' + req.params.id).then(data => {
            // parse school features
            for (let feature of SCHOOL_FEATURES) {
                let key = 'hasFeature_' + feature;
                data[key] = data.features.indexOf(feature) !== -1;
            }

            res.json(data);
        }).catch(err => {
            next(err);
        });
    };
};

const getDeleteHandler = (service) => {
    return function (req, res, next) {
        api(req).delete('/' + service + '/' + req.params.id).then(_ => {
            res.redirect(req.header('Referer'));
        }).catch(err => {
            next(err);
        });
    };
};

const getHandler = async (req, res) => {
  const itemsPerPage = (req.query.limit || 10);
  const currentPage = parseInt(req.query.p) || 1;

  const [federalStates, data, storageProvider] = await Promise.all([
    api(req).get('/federalStates'),
    api(req).get('/schools', {
      qs: {
        name: (req.query.q ? {
          $regex: _.escapeRegExp(req.query.q),
          $options: 'i'
        } : undefined),
        $limit: itemsPerPage,
        $skip: itemsPerPage * (currentPage - 1),
        $sort: req.query.sort,
        $populate: 'federalState'
      },
    }),
    getStorageProviders(req),
  ]);

  const head = [
    'ID',
    'Name',
    'Bundesland',
    'Filestorage',
    ''
  ];

  const body = data.data.map(item => {
    return [
      item._id ||"",
      item.name ||"",
      ((item.federalState || {}).name || ''),
      (item.fileStorageType || ''),
      getTableActions(item, '/schools/')
    ];
  });

  const sortQuery = (req.query.sort ? `&sort=${req.query.sort}` : '');
  const limitQuery = (req.query.limit ? `&limit=${req.query.limit}` : '');
  const searchQuery = (req.query.q ? `&q=${req.query.q}` : '');

  const pagination = {
    currentPage,
    numPages: Math.ceil(data.total / itemsPerPage),
    baseUrl: `/schools/?p={{page}}${sortQuery}${limitQuery}${searchQuery}`
  };

  res.render('schools/schools', {
    title: 'Schulen',
    head,
    body,
    pagination,
    federalState: federalStates.data,
    user: res.locals.currentUser,
    storageType: getStorageTypes(),
    timeZones: countryCodes,
    storageProvider,
    limit: true,
    themeTitle: process.env.SC_NAV_TITLE || 'Schul-Cloud'
  });
};

// secure routes
router.use(authHelper.authChecker);

router.patch('/:id', getUpdateHandler('schools'));
router.get('/:id', getDetailHandler('schools'));
router.delete('/:id', getDeleteHandler('schools'));
router.post('/', getCreateHandler('schools'));
router.all('/', getHandler);

router.get('/', function (req, res, next) {
    api(req).get('/schools/').then(schools => {
        res.render('schools/schools', {
            title: 'Schulen',
            user: res.locals.currentUser,
            schools: schools.data,
            themeTitle: process.env.SC_NAV_TITLE || 'Schul-Cloud'
        });
    });
});

module.exports = router;
