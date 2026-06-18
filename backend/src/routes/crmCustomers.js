'use strict';

const express = require('express');
const router = express.Router();
const customerController = require('../controllers/crmCustomerController');
const { authenticate } = require('../middleware/auth');
const { tenantScope } = require('../middleware/tenantScope');
const { requirePermission } = require('../middleware/permission');
const { validate } = require('../middleware/validate');
const { createCustomerRules, updateCustomerRules } = require('../validators/customerValidator');
const upload = require('../middleware/upload');

router.use(authenticate);
router.use(tenantScope);

router.get(
  '/',
  requirePermission('customers', 'view'),
  customerController.getAllCustomers
);

router.get(
  '/pos-customers',
  requirePermission('customers', 'view'),
  customerController.getPosCustomers
);

router.get(
  '/:id',
  requirePermission('customers', 'view'),
  customerController.getCustomerById
);

router.get(
  '/:id/timeline',
  requirePermission('customers', 'view'),
  customerController.getCustomerTimeline
);

router.get(
  '/:id/transactions',
  requirePermission('customers', 'view'),
  customerController.getCustomerTransactions
);

router.get(
  '/:id/documents',
  requirePermission('customers', 'view'),
  customerController.getCustomerDocuments
);

router.post(
  '/',
  requirePermission('customers', 'create'),
  createCustomerRules(),
  validate,
  customerController.createCustomer
);

router.put(
  '/:id',
  requirePermission('customers', 'update'),
  updateCustomerRules(),
  validate,
  customerController.updateCustomer
);

router.delete(
  '/:id',
  requirePermission('customers', 'delete'),
  customerController.deleteCustomer
);

router.post(
  '/import',
  requirePermission('customers', 'create'),
  upload.single('file'),
  customerController.importCustomers
);

router.post(
  '/:id/contacts',
  requirePermission('customers', 'update'),
  customerController.addCustomerContact
);

router.post(
  '/:id/addresses',
  requirePermission('customers', 'update'),
  customerController.addCustomerAddress
);

router.post(
  '/:id/documents',
  requirePermission('customers', 'update'),
  upload.single('file'),
  customerController.uploadDocument
);

module.exports = router;
