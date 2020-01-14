const express = require('express');
const router = express.Router();

// only execute middleware on this router
const handlebarsHelper = require('../helpers/handlebars');
//router.use(handlebarsHelper.middleware);

router.use(require('./login'));
router.use('/dashboard/', require('./dashboard'));
router.use('/schools/', require('./schools'));
router.use('/users/', require('./users'));
router.use('/roles/', require('./roles'));
router.use('/management', require('./management'));
router.use('/helpdesk', require('./helpdesk'));
router.use('/federalstates', require('./federalstates'));
router.use('/accounts', require('./accounts'));
router.use('/account', require('./account'));
router.use('/statistics', require('./statistics'));
router.use('/tools', require('./tools'));

module.exports = router;