'use strict';

const express = require('express');
const router = express.Router();
const crmUserController = require('../controllers/crmUserController');
const { authenticate } = require('../middleware/auth');
const { tenantScope } = require('../middleware/tenantScope');
const { requirePermission } = require('../middleware/permission');
const { requireSuperAdmin } = require('../middleware/superAdmin');

router.use(authenticate);
router.use(tenantScope);

router.get(
  '/',
  requirePermission('roles', 'view'),
  crmUserController.getAllUsers
);

router.post(
  '/',
  requireSuperAdmin,
  crmUserController.createUser
);

router.put(
  '/:id',
  requireSuperAdmin,
  crmUserController.updateUser
);

router.delete(
  '/:id',
  requireSuperAdmin,
  crmUserController.deactivateUser
);

router.patch(
  '/:id/reactivate',
  requireSuperAdmin,
  crmUserController.reactivateUser
);

router.post(
  '/:id/reset-password',
  requireSuperAdmin,
  crmUserController.resetPassword
);

module.exports = router;
