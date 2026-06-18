'use strict';

const express = require('express');
const router = express.Router();
const crmCustomFieldController = require('../controllers/crmCustomFieldController');
const { authenticate } = require('../middleware/auth');
const { tenantScope } = require('../middleware/tenantScope');
const { requirePermission } = require('../middleware/permission');

router.use(authenticate);
router.use(tenantScope);

router.get('/', crmCustomFieldController.getFields);
router.post('/', requirePermission('dashboard', 'view'), crmCustomFieldController.createField);
router.put('/:id', requirePermission('dashboard', 'view'), crmCustomFieldController.updateField);
router.delete('/:id', requirePermission('dashboard', 'view'), crmCustomFieldController.deleteField);

module.exports = router;
