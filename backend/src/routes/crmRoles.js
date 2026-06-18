'use strict';

const express = require('express');
const router = express.Router();
const roleController = require('../controllers/crmRoleController');
const { authenticate } = require('../middleware/auth');
const { tenantScope } = require('../middleware/tenantScope');
const { requirePermission } = require('../middleware/permission');
const { requireSuperAdmin } = require('../middleware/superAdmin');

router.use(authenticate);
router.use(tenantScope);

router.get(
  '/',
  requirePermission('roles', 'view'),
  roleController.getRoles
);

router.get(
  '/permissions',
  requirePermission('roles', 'view'),
  roleController.getPermissions
);

router.put(
  '/:id',
  requireSuperAdmin,
  roleController.updateRole
);

module.exports = router;
