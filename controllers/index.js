const express = require('express');
const router = express.Router();

router.use(require('./login'));
router.use(express.json());
router.use('/dashboard/', require('./dashboard'));
router.use('/schools/', require('./schools'));
router.use('/users/', require('./users'));
router.use('/roles/', require('./roles'));
router.use('/management', require('./management'));
router.use('/federalstates', require('./federalstates'));
router.use('/accounts', require('./accounts'));
router.use('/account', require('./account'));
router.use('/ctltools', require('./ctltools'));
router.use('/runtime-config', require('./runtime-config'));
router.use('/storageproviders', require('./storageproviders'));
router.use('/base64files/', require('./base64files'));
router.use('/batch-deletion/', require('./batchdeletion'));

module.exports = router;