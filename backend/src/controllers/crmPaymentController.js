'use strict';

const posIntegrationService = require('../services/posIntegrationService');
const { sendSuccess, sendError } = require('../utils/response');

const crmPaymentController = {
  

  async getPaymentSummary(req, res) {
    try {
      const summaryData = await posIntegrationService.getPaymentSummary(req.tenantId);
      
      
      const formattedRows = summaryData.rows.map(payment => ({
        id: payment.id,
        invoice_ref: payment.reference || 'N/A',
        customer_name: payment.customer_name || 'Unknown',
        amount: payment.amount,
        method: payment.method,
        status: 'completed', 
        date: payment.created_at
      }));

      const finalResponse = {
        summary: summaryData.summary,
        rows: formattedRows
      };

      return sendSuccess(res, finalResponse, 'Payment summary retrieved successfully.');
    } catch (error) {
      console.error('Error fetching payment summary:', error);
      return sendError(res, error.message || 'Failed to fetch payment summary.', 500);
    }
  },

  

  async getCustomerPayments(req, res) {
    try {
      
      
      const { CrmCustomer } = require('../models');
      const customer = await CrmCustomer.findOne({
        where: { id: req.params.id, tenant_id: req.tenantId }
      });

      if (!customer) {
        return sendError(res, 'Customer not found in CRM.', 404);
      }

      if (!customer.billify_customer_id) {
        return sendSuccess(res, [], 'This CRM customer is not linked to a POS customer yet.');
      }

      const payments = await posIntegrationService.getCustomerPayments(
        req.tenantId,
        customer.billify_customer_id
      );

      return sendSuccess(res, payments, 'Customer payments retrieved.');
    } catch (error) {
      console.error('Error fetching customer payments:', error);
      return sendError(res, error.message || 'Failed to fetch customer payments.', 500);
    }
  }
};

module.exports = crmPaymentController;
