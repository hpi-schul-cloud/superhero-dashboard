/*
 * One Controller per layout view
 */

const _ = require('lodash');
const express = require('express');
const router = express.Router();
const authHelper = require('../helpers/authentication');
const redirectHelper = require('../helpers/redirect');
const api = require('../api');
const moment = require('moment');
moment.locale('de');

// secure routes
router.use(authHelper.authChecker);

router.get('/releases', function (req, res, next) {
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
});

const updateInstancePolicy = (req, res, next) => {
	const { consentTitle, consentText, consentData } = req.body;
	api(req).post('/consentVersions', {
		json: {
			title: consentTitle,
			consentText,
			publishedAt: moment().format(),
			consentTypes: ['privacy'],
			consentData,
			shdUpload: true,
		},
	}).then(() => {
		redirectHelper.safeBackRedirect(req, res);
	}).catch(next);
};

const createPoliciesBody = (policiesData) => {
	return policiesData.map((consentVersion) => {
		const title = consentVersion.title;
		const text = consentVersion.consentText;
		const publishedAt = moment(consentVersion.publishedAt).format('DD.MM.YYYY HH:mm');
		const linkToPolicy = consentVersion.consentDataId;
		const links = [];
		if (linkToPolicy) {
			links.push({
				link: `/base64Files/${linkToPolicy}`,
				class: 'base64File-download-btn',
				icon: 'file-o',
				title: 'Datenschutzerklärung der Instanz',
			});
		}
		return [title, text, publishedAt, links];
	});
}

router.post('/uploadConsent', updateInstancePolicy);

router.get('/', async function (req, res, next) {

	const consentVersions = await api(req).get('/consentVersions', {
		qs: {
			$limit: 100,
			consentTypes: 'privacy',
			$sort: {
				publishedAt: -1,
			},
		},
	})

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
});

module.exports = router;
