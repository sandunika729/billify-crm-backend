'use strict';

const express = require('express');
const router = express.Router();
const dealController = require('../controllers/crmDealController');
const { authenticate } = require('../middleware/auth');
const { tenantScope } = require('../middleware/tenantScope');
const { requirePermission } = require('../middleware/permission');

router.use(authenticate);
router.use(tenantScope);

router.get('/', requirePermission('deals', 'view'), dealController.getAllDeals);
router.get('/stages', requirePermission('deals', 'view'), dealController.getDealStages);
router.get('/:id', requirePermission('deals', 'view'), dealController.getDealById);
router.post('/', requirePermission('deals', 'create'), dealController.createDeal);
router.put('/:id', requirePermission('deals', 'update'), dealController.updateDeal);
router.patch('/:id/stage', requirePermission('deals', 'update'), dealController.updateDealStage);
router.delete('/:id', requirePermission('deals', 'delete'), dealController.deleteDeal);

router.get('/stages/:stageId/automation-rules', requirePermission('deals', 'view'), dealController.getAutomationRules);
router.post('/stages/:stageId/automation-rules', requirePermission('deals', 'update'), dealController.createAutomationRule);
router.delete('/automation-rules/:ruleId', requirePermission('deals', 'update'), dealController.deleteAutomationRule);

module.exports = router;
