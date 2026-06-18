'use strict';

const express = require('express');
const router = express.Router();
const shopProfileController = require('../controllers/crmShopProfileController');
const { authenticate } = require('../middleware/auth');
const { tenantScope } = require('../middleware/tenantScope');

router.use(authenticate);
router.use(tenantScope);

router.get('/', shopProfileController.getProfile);
router.post('/', shopProfileController.upsertProfile);
router.post('/regenerate-key', shopProfileController.regenerateKey);

module.exports = router;
