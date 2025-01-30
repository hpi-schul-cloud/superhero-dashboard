const moment = require('moment');
moment.locale('de');

const redirectHelper = require('../../helpers/redirect');
const { createPoliciesBody } = require('./helpers');
const { api } = require('../../api');

const fetchReleases = (req, res, next) => {
    api(req).get('/releases/fetch')
        .then(() => {
            res.locals.notification = {
                'type': 'success',
                'message': 'Releases erfolgreich gefetched.'
            };
            res.render('management/management', {
                title: 'Allgemeine Verwaltung',
                user: res.locals.currentUser,
                themeTitle: process.env.SC_NAV_TITLE || 'Schul-Cloud'
            });
        })
        .catch(next);
};

const updateInstancePolicy = (req, res, next) => {
	const { consentTitle, consentText, consentData } = req.body;
	return api(req).post('/consentVersions', {
		json: {
			title: consentTitle,
			consentText,
			publishedAt: moment().format(),
			consentTypes: ['privacy'],
			consentData,
		},
	}).then(() => {
		redirectHelper.safeBackRedirect(req, res);
	}).catch(next);
};

const mainRoute = async function (req, res, next) {
	try {
		const consentVersions = await api(req).get('/consentVersions', {
			qs: {
				$limit: 100,
				consentTypes: 'privacy',
				$sort: {
					publishedAt: -1,
				},
			},
		});
		const policiesHead = [
			'Titel',
			'Beschreibung',
			'Hochgeladen am',
			'Link',
		];
		const policiesBody = createPoliciesBody(consentVersions.data);
		res.render('management/management', {
			title: 'Allgemeine Verwaltung',
			user: res.locals.currentUser,
			themeTitle: process.env.SC_NAV_TITLE || 'Schul-Cloud',
			policiesHead,
			policiesBody,
		});
	} catch (err) {
		next(err);
	}
};

module.exports = {
	updateInstancePolicy,
	fetchReleases,
	mainRoute,
};