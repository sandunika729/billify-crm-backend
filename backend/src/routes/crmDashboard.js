'use strict';

const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/crmDashboardController');
const { authenticate } = require('../middleware/auth');
const { tenantScope } = require('../middleware/tenantScope');

router.use(authenticate);
router.use(tenantScope);

router.get(
  '/summary',
  dashboardController.getSummary
);

router.get(
  '/charts',
  dashboardController.getCharts
);

module.exports = router;
