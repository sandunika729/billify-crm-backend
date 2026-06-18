'use strict';

const express = require('express');
const router = express.Router();
const crmPaymentController = require('../controllers/crmPaymentController');
const { requirePermission } = require('../middleware/permission');
const { authenticate } = require('../middleware/auth');
const { tenantScope } = require('../middleware/tenantScope');

router.use(authenticate);
router.use(tenantScope);

router.get(
  '/summary',
  requirePermission('payments', 'view'),
  crmPaymentController.getPaymentSummary
);

router.get(
  '/customer/:id',
  requirePermission('payments', 'view'),
  crmPaymentController.getCustomerPayments
);

module.exports = router;
