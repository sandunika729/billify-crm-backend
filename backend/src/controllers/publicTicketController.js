'use strict';

const { CrmShopProfile, CrmCustomer, CrmTicket, CrmTicketMessage } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');
const { emitToTenant } = require('../socket');
const crmSlaService = require('../services/crmSlaService');

const publicTicketController = {
  async submitTicket(req, res) {
    try {
      const apiKey = req.headers['x-api-key'] || req.body.api_key;
      if (!apiKey) {
        return sendError(res, 'API key is required.', 401);
      }

      
      const shopProfile = await CrmShopProfile.findOne({
        where: { public_api_key: apiKey },
      });

      if (!shopProfile) {
        return sendError(res, 'Invalid API key.', 401);
      }

      const tenantId = shopProfile.tenant_id;
      const { name, email, phone, subject, message, category, priority } = req.body;

      if (!name || !subject || !message) {
        return sendError(res, 'Name, subject, and message are required.', 400);
      }

      
      let customer = null;
      if (email) {
        customer = await CrmCustomer.findOne({ where: { tenant_id: tenantId, email } });
      }
      if (!customer && phone) {
        customer = await CrmCustomer.findOne({ where: { tenant_id: tenantId, phone } });
      }
      if (!customer) {
        
        const count = await CrmCustomer.count({ where: { tenant_id: tenantId }, paranoid: false });
        customer = await CrmCustomer.create({
          tenant_id: tenantId,
          customer_code: `CUST-${String(count + 1).padStart(5, '0')}`,
          name,
          email: email || null,
          phone: phone || null,
          type: 'individual',
          status: 'active',
          source: 'website',
        });
      }

      
      const count = await CrmTicket.count({ where: { tenant_id: tenantId }, paranoid: false });
      const ticket_no = `TKT-${String(count + 1).padStart(5, '0')}`;
      const ticketPriority = priority || 'medium';

      const newTicket = await CrmTicket.create({
        tenant_id: tenantId,
        ticket_no,
        customer_id: customer.id,
        subject,
        description: message,
        status: 'open',
        priority: ticketPriority,
        category: category || 'general',
        source: 'portal',           
        due_at: crmSlaService.calculateDueAt(ticketPriority),
        is_overdue: false,
        sla_alert_sent: false,
        created_by: null,           
      });

      
      await CrmTicketMessage.create({
        tenant_id: tenantId,
        ticket_id: newTicket.id,
        sender_user_id: null,       
        sender_name: name,          
        message,
        is_internal: false,
      });

      
      emitToTenant(tenantId, 'ticket:new', {
        ...newTicket.toJSON(),
        source_label: 'Web Portal',
      });

      return sendSuccess(
        res,
        { ticket_no: newTicket.ticket_no },
        'Your ticket has been submitted successfully. We will get back to you soon.',
        201
      );
    } catch (error) {
      console.error('Error submitting public ticket:', error);
      return sendError(res, 'Failed to submit ticket. Please try again later.', 500);
    }
  },
};

module.exports = publicTicketController;
