'use strict';

const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const leadController = require('../controllers/crmLeadController');
const { authenticate } = require('../middleware/auth');
const { tenantScope } = require('../middleware/tenantScope');
const { requirePermission } = require('../middleware/permission');

router.use(authenticate);
router.use(tenantScope);

router.get('/', requirePermission('leads', 'view'), leadController.getAllLeads);
router.get('/export', requirePermission('leads', 'view'), leadController.exportLeads);
router.get('/:id', requirePermission('leads', 'view'), leadController.getLeadById);
router.post('/', requirePermission('leads', 'create'), leadController.createLead);
router.post('/bulk-delete', requirePermission('leads', 'delete'), leadController.bulkDeleteLeads);
router.put('/bulk-reassign', requirePermission('leads', 'update'), leadController.bulkReassignLeads);
router.post('/import', requirePermission('leads', 'create'), upload.single('file'), leadController.importLeads);
router.put('/:id', requirePermission('leads', 'update'), leadController.updateLead);
router.post('/:id/convert', requirePermission('leads', 'update'), leadController.convertLead);
router.delete('/:id', requirePermission('leads', 'delete'), leadController.deleteLead);

module.exports = router;
