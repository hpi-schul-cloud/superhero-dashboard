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

let options = [
    {
        name: 'users',
        icon: 'users',
        action: ''
    },
    {
        name: 'schools',
        icon: 'institution',
        action: ''
    },
    {
        name: 'accounts',
        icon: 'user-secret',
        action: ''
    },
    {
        name: 'homework',
        icon: 'tasks',
        action: ''
    },
    {
        name: 'submissions',
        icon: 'hourglass',
        action: ''
    },
    {
        name: 'comments',
        icon: 'comments-o',
        action: ''
    },
    {
        name: 'lessons',
        icon: 'lemon',
        action: ''
    },
    {
        name: 'classes',
        icon: 'odnoklassniki',
        action: ''
    },
    {
        name: 'courses',
        icon: 'graduation-cap',
        action: ''
    },
    {
        name: 'teachers',
        icon: 'user',
        action: ''
    },
    {
        name: 'students',
        icon: 'user',
        action: ''
    },
    {
        name: 'files',
        icon: 'files-o',
        action: ''
    },
    {
        name: 'directories',
        icon: 'folder-o',
        action: ''
    },
];

// secure routes
router.use(authHelper.authChecker);

router.get('/:id', function (req, res, next) {
   api(req).get('/statistics/' + req.params.id, {qs: {returnArray: true}})
       .then(stats => {

           stats.x = stats.x.map(x => {
               return '"' + x + '"';
           });

           res.render('statistic/plottedStat', {
               title: 'Statistiken',
               user: res.locals.currentUser,
               x: Array.from(stats.x),
               y: Array.from(stats.y)
           });
       });
});

router.get('/', function (req, res, next) {
    api(req).get('/statistics')
        .then(stats => {
            let finalStats = [];

            for (let key in stats) {
                if (stats.hasOwnProperty(key)) {
                    let obj = _.find(options, {name: key});
                    Object.assign(obj, {value: stats[key]});
                    finalStats.push(obj);
                }
            }

            res.render('statistic/statistic', {
                title: 'Statistiken',
                user: res.locals.currentUser,
                stats: finalStats
            });
    });
});

module.exports = router;
