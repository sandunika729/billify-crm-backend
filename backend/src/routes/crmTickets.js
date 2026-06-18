'use strict';

const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/crmTicketController');
const { authenticate } = require('../middleware/auth');
const { tenantScope } = require('../middleware/tenantScope');
const { requirePermission } = require('../middleware/permission');

router.use(authenticate);
router.use(tenantScope);

router.get('/', requirePermission('tickets', 'view'), ticketController.getAllTickets);
router.get('/:id', requirePermission('tickets', 'view'), ticketController.getTicketById);
router.post('/', requirePermission('tickets', 'create'), ticketController.createTicket);
router.put('/:id', requirePermission('tickets', 'update'), ticketController.updateTicket);
router.post('/:id/messages', requirePermission('tickets', 'update'), ticketController.addMessage);
router.delete('/:id', requirePermission('tickets', 'delete'), ticketController.deleteTicket);

module.exports = router;
