'use strict';

const express = require('express');
const router = express.Router();
const crmReportController = require('../controllers/crmReportController');
const { authenticate } = require('../middleware/auth');
const { tenantScope } = require('../middleware/tenantScope');
const { requirePermission } = require('../middleware/permission');

router.use(authenticate);
router.use(tenantScope);

router.get(
  '/',
  requirePermission('dashboard', 'view'),
  crmReportController.getReports
);

module.exports = router;
