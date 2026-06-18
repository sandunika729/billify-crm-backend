'use strict';

const express = require('express');
const router = express.Router();
const crmInboxController = require('../controllers/crmInboxController');
const { authenticate } = require('../middleware/auth');
const { tenantScope } = require('../middleware/tenantScope');
const { requirePermission } = require('../middleware/permission');

router.use(authenticate);
router.use(tenantScope);

router.get('/', requirePermission('dashboard', 'view'), crmInboxController.getInbox);
router.get('/stats', requirePermission('dashboard', 'view'), crmInboxController.getStats);

module.exports = router;
