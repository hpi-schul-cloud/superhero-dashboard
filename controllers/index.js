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

module.exports = router;