/*
 * One Controller per layout view
 */

const express = require('express');
const router = express.Router();
const authHelper = require('../../helpers/authentication');

const controllerLogic = require('./managementLogic');

// secure routes
router.use(authHelper.authChecker);

router.get('/releases', controllerLogic.fetchReleases);
router.post('/uploadConsent', controllerLogic.updateInstancePolicy);
router.get('/', controllerLogic.mainRoute);

module.exports = router;
