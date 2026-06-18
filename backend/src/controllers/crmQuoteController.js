'use strict';

const crmQuoteService = require('../services/crmQuoteService');
const { sendSuccess, sendError, sendPaginated, getPagination, getPaginationMeta } = require('../utils/response');
const { logAudit, getAuditContext } = require('../utils/auditLogger');
const { saveGeneratedPdf } = require('../utils/documentSyncHelper');

async function _createQuotePdfBuffer(quote, tenantId) {
  const { Tenant, CrmShopProfile } = require('../models');
  const tenant = await Tenant.findByPk(tenantId);
  const shopProfile = await CrmShopProfile.findOne({ where: { tenant_id: tenantId } });
  const pdfService = require('../services/pdfService');
  
  const data = {
    quote_no: quote.quote_no,
    date: new Date(quote.created_at).toLocaleDateString(),
    valid_until: quote.valid_until ? new Date(quote.valid_until).toLocaleDateString() : 'N/A',
    tenant: tenant ? tenant.toJSON() : { name: 'Billify', email: '', phone: '', address: '' },
    shopProfile: shopProfile ? shopProfile.toJSON() : null,
    customer: quote.customer ? quote.customer.toJSON() : {},
    items: quote.items.map(i => ({
      item_name: i.description || 'Item',
      qty: i.quantity,
      unit_price_lkr: i.unit_price,
      discount_lkr: i.discount_amount || 0,
      tax_lkr: i.tax_amount || 0,
      line_total_lkr: i.total_price
    })),
    subtotal_lkr: quote.subtotal_lkr,
    discount_lkr: quote.discount_lkr,
    tax_lkr: quote.tax_lkr,
    total_lkr: quote.total_lkr
  };

  return await pdfService.generatePdf('quoteTemplate', data);
}

const crmQuoteController = {
  async getAllQuotes(req, res) {
    try {
      const { page, limit, offset } = getPagination(req.query);
      const { search, status, customer_id } = req.query;

      const { count, rows } = await crmQuoteService.getAllQuotes({
        tenantId: req.tenantId,
        limit,
        offset,
        search,
        status,
        customer_id
      });

      const paginationMeta = getPaginationMeta(count, page, limit);
      return sendPaginated(res, rows, paginationMeta, 'Quotes retrieved successfully.');
    } catch (error) {
      console.error('Error fetching quotes:', error);
      return sendError(res, error.message || 'Failed to fetch quotes.', 500);
    }
  },

  async getQuoteById(req, res) {
    try {
      const quote = await crmQuoteService.getQuoteById(req.params.id, req.tenantId);
      return sendSuccess(res, quote, 'Quote retrieved successfully.');
    } catch (error) {
      console.error('Error fetching quote:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      return sendError(res, error.message || 'Failed to fetch quote.', statusCode);
    }
  },

  async createQuote(req, res) {
    try {
      const { quote, quote_no, total_lkr } = await crmQuoteService.createQuote({
        tenantId: req.tenantId,
        data: req.body,
        userId: req.user.id
      });

      await logAudit({
        ...getAuditContext(req),
        action: 'create',
        entityType: 'quote',
        entityId: quote.id,
        description: `Quote ${quote_no} created for ${total_lkr} LKR.`
      });

      return sendSuccess(res, quote, 'Quote created successfully.', 201);
    } catch (error) {
      console.error('Error creating quote:', error);
      const statusCode = error.message.includes('required') ? 400 : 500;
      return sendError(res, error.message || 'Failed to create quote.', statusCode);
    }
  },

  async updateQuote(req, res) {
    try {
      const { quote, beforeData } = await crmQuoteService.updateQuote(req.params.id, req.tenantId, req.body);

      await logAudit({
        ...getAuditContext(req),
        action: 'update',
        entityType: 'quote',
        entityId: quote.id,
        before: beforeData,
        after: quote.toJSON(),
        description: `Quote ${quote.quote_no} updated.`
      });

      return sendSuccess(res, quote, 'Quote updated successfully.');
    } catch (error) {
      console.error('Error updating quote:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      return sendError(res, error.message || 'Failed to update quote.', statusCode);
    }
  },

  async updateQuoteStatus(req, res) {
    try {
      const { status } = req.body;
      const { quote, oldStatus } = await crmQuoteService.updateQuoteStatus(req.params.id, req.tenantId, status);

      await logAudit({
        ...getAuditContext(req),
        action: 'status_change',
        entityType: 'quote',
        entityId: quote.id,
        description: `Quote ${quote.quote_no} status changed from ${oldStatus} to ${status}.`
      });

      
      if (status === 'accepted') {
        try {
          const fullQuote = await crmQuoteService.getQuoteById(quote.id, req.tenantId);
          const pdfBuffer = await _createQuotePdfBuffer(fullQuote, req.tenantId);
          await saveGeneratedPdf(
            req.tenantId, 
            req.user.id, 
            pdfBuffer, 
            `quote-${quote.quote_no}.pdf`, 
            'quote', 
            quote.id, 
            'quote'
          );
        } catch (syncErr) {
          console.error('[Auto Sync] Failed to sync PDF for accepted quote:', syncErr);
        }
      }

      return sendSuccess(res, quote, 'Quote status updated successfully.');
    } catch (error) {
      console.error('Error updating quote status:', error);
      const statusCode = error.message.includes('not found') ? 404 : 400;
      return sendError(res, error.message || 'Failed to update quote status.', statusCode);
    }
  },

  async deleteQuote(req, res) {
    try {
      const quote = await crmQuoteService.deleteQuote(req.params.id, req.tenantId);

      await logAudit({
        ...getAuditContext(req),
        action: 'archive',
        entityType: 'quote',
        entityId: quote.id,
        description: `Quote ${quote.quote_no} archived.`
      });

      return sendSuccess(res, null, 'Quote archived successfully.');
    } catch (error) {
      console.error('Error deleting quote:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      return sendError(res, error.message || 'Failed to archive quote.', statusCode);
    }
  },

  async generatePdf(req, res) {
    try {
      const quote = await crmQuoteService.getQuoteById(req.params.id, req.tenantId);
      const pdfBuffer = await _createQuotePdfBuffer(quote, req.tenantId);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=quote-${quote.quote_no}.pdf`);
      return res.end(Buffer.from(pdfBuffer));
    } catch (error) {
      console.error('Error generating PDF:', error);
      return sendError(res, error.message || 'Failed to generate PDF.', 500);
    }
  },

  async sendEmail(req, res) {
    try {
      const { to_email, subject, message } = req.body;
      if (!to_email) return sendError(res, 'Recipient email is required.', 400);

      const quote = await crmQuoteService.getQuoteById(req.params.id, req.tenantId);
      const { Tenant } = require('../models');
      const tenant = await Tenant.findByPk(req.tenantId);

      const emailSubject = subject || `Quotation ${quote.quote_no} from ${tenant ? tenant.name : 'Billify'}`;
      const emailBody = message || `Dear ${quote.customer ? quote.customer.name : 'Customer'},\n\nPlease find the attached quotation ${quote.quote_no}.\n\nThank you!`;

      const emailUrl = `mailto:${to_email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

      if (quote.status === 'draft') {
        await crmQuoteService.updateQuoteStatus(quote.id, req.tenantId, 'sent');
      }

      
      try {
        const fullQuote = await crmQuoteService.getQuoteById(quote.id, req.tenantId);
        const pdfBuffer = await _createQuotePdfBuffer(fullQuote, req.tenantId);
        await saveGeneratedPdf(
          req.tenantId, 
          req.user.id, 
          pdfBuffer, 
          `quote-${quote.quote_no}.pdf`, 
          'quote', 
          quote.id, 
          'quote'
        );
      } catch (syncErr) {
        console.error('[Auto Sync] Failed to sync PDF for emailed quote:', syncErr);
      }

      await logAudit({
        ...getAuditContext(req),
        action: 'email_sent',
        entityType: 'quote',
        entityId: quote.id,
        description: `Quote ${quote.quote_no} email interaction logged for ${to_email}.`
      });

      return sendSuccess(res, { emailUrl, quote_no: quote.quote_no }, 'Email interaction logged successfully.');
    } catch (error) {
      console.error('Error logging email interaction:', error);
      return sendError(res, error.message || 'Failed to log email interaction.', 500);
    }
  },

  async convertToInvoice(req, res) {
    try {
      const quote = await crmQuoteService.getQuoteById(req.params.id, req.tenantId);
      
      if (!quote) return sendError(res, 'Quote not found.', 404);
      if (quote.status !== 'accepted') {
        return sendError(res, 'Only accepted quotes can be converted to invoices.', 400);
      }

      const { CrmCustomer } = require('../models');
      const customer = await CrmCustomer.findOne({ where: { id: quote.customer_id, tenant_id: req.tenantId } });

      const posIntegrationService = require('../services/posIntegrationService');
      const newBill = await posIntegrationService.createInvoiceFromQuote(quote, customer, req.tenantId);

      
      await quote.update({ status: 'converted' });

      await logAudit({
        ...getAuditContext(req),
        action: 'convert',
        entityType: 'quote',
        entityId: quote.id,
        description: `Quote ${quote.quote_no} converted to Invoice ${newBill.bill_number}`
      });

      return sendSuccess(res, { bill: newBill, quote }, 'Quote successfully converted to invoice.', 201);
    } catch (error) {
      console.error('Error converting quote:', error);
      return sendError(res, error.message || 'Failed to convert quote to invoice.', 500);
    }
  }
};

module.exports = crmQuoteController;
