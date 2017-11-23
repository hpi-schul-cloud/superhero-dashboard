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
        icon: 'users'
    },
    {
        name: 'schools',
        icon: 'institution'
    },
    {
        name: 'accounts',
        icon: 'user-secret'
    },
    {
        name: 'homework',
        icon: 'tasks'
    },
    {
        name: 'submissions',
        icon: 'hourglass'
    },
    {
        name: 'comments',
        icon: 'comments-o'
    },
    {
        name: 'lessons',
        icon: 'lemon'
    },
    {
        name: 'classes',
        icon: 'odnoklassniki'
    },
    {
        name: 'courses',
        icon: 'graduation-cap'
    },
    {
        name: 'teachers',
        icon: 'user'
    },
    {
        name: 'students',
        icon: 'user'
    },
    {
        name: 'files',
        icon: 'files-o'
    },
    {
        name: 'directories',
        icon: 'folder-o'
    },
];

// secure routes
router.use(authHelper.authChecker);

router.get('/:id', function (req, res, next) {
   api(req).get('/statistics/' + req.params.id, {qs: {returnArray: true}})
       .then(stats => {

           let finStat = [{"x": Array.from(stats.x), "y": Array.from(stats.y)}];

           res.render('statistic/plottedStat', {
               title: 'Statistiken',
               user: res.locals.currentUser,
               stats: JSON.stringify(finStat)
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
                    obj.action = 'statistics/' + obj.name;
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
