'use strict';

const express = require('express');
const router = express.Router();
const quoteController = require('../controllers/crmQuoteController');
const { authenticate } = require('../middleware/auth');
const { tenantScope } = require('../middleware/tenantScope');
const { requirePermission } = require('../middleware/permission');

router.use(authenticate);
router.use(tenantScope);

router.get('/', requirePermission('quotes', 'view'), quoteController.getAllQuotes);
router.get('/:id', requirePermission('quotes', 'view'), quoteController.getQuoteById);
router.get('/:id/pdf', requirePermission('quotes', 'view'), quoteController.generatePdf);
router.post('/:id/send-email', requirePermission('quotes', 'update'), quoteController.sendEmail);
router.post('/:id/convert-to-invoice', requirePermission('quotes', 'update'), quoteController.convertToInvoice);
router.post('/', requirePermission('quotes', 'create'), quoteController.createQuote);
router.put('/:id', requirePermission('quotes', 'update'), quoteController.updateQuote);
router.patch('/:id/status', requirePermission('quotes', 'update'), quoteController.updateQuoteStatus);
router.delete('/:id', requirePermission('quotes', 'delete'), quoteController.deleteQuote);

module.exports = router;
