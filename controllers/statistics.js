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
        name: 'files/directories',
        icon: 'files-o'
    }
];

// secure routes
router.use(authHelper.authChecker);

router.get('/:id', function (req, res, next) {
    api(req).get('/statistics/' + req.params.id, { qs: { returnArray: true } })
        .then(stats => {
            let colourLine = '#b10438';
            if (process.env.SC_NAV_TITLE)
                colourLine = '#78aae5';

            let finStat = [{
                "x": Array.from(stats.x),
                "y": Array.from(stats.y)
            }];

            let position = _.findIndex(options, { name: req.params.id });
            let next = ((position + 1) > options.length - 1) ? options[0].name : options[position + 1].name;
            let prev = ((position - 1) < 0) ? options[options.length - 1].name : options[position - 1].name;

            // Increment users in statistics
            let xIncremented = [];
            let yIncremented = [];
            let currentCount = 0;
            let lastDateIndex = 0;
            try {
                let startDate = new Date(stats.x[0]);
                let endDate = new Date();
                do {
                    let currentDate = moment(startDate).format("YYYY-MM-DD");
                    if (currentDate == stats.x[lastDateIndex]) {
                        currentCount += stats.y[lastDateIndex];
                        lastDateIndex++;
                    }

                    xIncremented.push(currentDate);
                    yIncremented.push(currentCount);

                    startDate.setDate(startDate.getDate() + 1);
                } while (!moment(startDate).isSame(endDate, 'day'));
            } catch (error) {
                xIncremented = [];
                yIncremented = [];
            }

            let incrementedFinStat = [{
                "x": Array.from(xIncremented),
                "y": Array.from(yIncremented),
                line: { color: colourLine },
                fill: 'tozeroy'
            }];

            res.render('statistic/plottedStat', {
                title: 'Statistiken (' + req.params.id + ")",
                user: res.locals.currentUser,
                stats: JSON.stringify(finStat),
                statsIncremented: JSON.stringify(incrementedFinStat),
                name: req.params.id,
                prev: prev,
                next: next,
                themeTitle: process.env.SC_NAV_TITLE || 'Schul-Cloud'
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
                stats: finalStats,
                themeTitle: process.env.SC_NAV_TITLE || 'Schul-Cloud'
            });
    });
});

module.exports = router;
