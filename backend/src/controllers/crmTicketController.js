'use strict';

const crmTicketService = require('../services/crmTicketService');
const notificationService = require('../services/notificationService');
const { User } = require('../models');
const { Op } = require('sequelize');
const { sendSuccess, sendError, sendPaginated, getPagination, getPaginationMeta } = require('../utils/response');
const { logAudit, getAuditContext } = require('../utils/auditLogger');

const crmTicketController = {
  async getAllTickets(req, res) {
    try {
      const { page, limit, offset } = getPagination(req.query);
      const { search, status, priority, assignee_id, customer_id } = req.query;

      const { count, rows } = await crmTicketService.getAllTickets({
        tenantId: req.tenantId,
        limit,
        offset,
        search,
        status,
        priority,
        assignee_id,
        customer_id
      });

      const paginationMeta = getPaginationMeta(count, page, limit);
      return sendPaginated(res, rows, paginationMeta, 'Tickets retrieved successfully.');
    } catch (error) {
      console.error('Error fetching tickets:', error);
      return sendError(res, error.message || 'Failed to fetch tickets.', 500);
    }
  },

  async getTicketById(req, res) {
    try {
      const ticket = await crmTicketService.getTicketById(req.params.id, req.tenantId);
      return sendSuccess(res, ticket, 'Ticket retrieved successfully.');
    } catch (error) {
      console.error('Error fetching ticket:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      return sendError(res, error.message || 'Failed to fetch ticket.', statusCode);
    }
  },

  async createTicket(req, res) {
    try {
      const newTicket = await crmTicketService.createTicket({
        tenantId: req.tenantId,
        data: req.body,
        userId: req.user.id
      });

      await logAudit({
        ...getAuditContext(req),
        action: 'create',
        entityType: 'ticket',
        entityId: newTicket.id,
        after: newTicket.toJSON(),
        description: `Ticket ${newTicket.ticket_no} created: ${newTicket.subject}`
      });

      
      const excludeIds = [req.user.id];
      if (newTicket.assignee_id) {
        excludeIds.push(newTicket.assignee_id);
      }

      const notifyUsers = await User.findAll({
        where: {
          business_id: req.tenantId,
          role: { [Op.in]: ['admin', 'manager'] },
          status: 'active',
          id: { [Op.notIn]: excludeIds }
        },
        attributes: ['id']
      });

      for (const u of notifyUsers) {
        await notificationService.createNotification({
          tenant_id: req.tenantId,
          user_id: u.id,
          title: 'New Ticket Raised',
          body: `${req.user.firstName || 'A user'} raised a new ticket: ${newTicket.subject}`,
          link: `/crm/support/${newTicket.id}`,
          type: 'info'
        });
      }

      if (newTicket.assignee_id && newTicket.assignee_id !== req.user.id) {
        await notificationService.createNotification({
          tenant_id: req.tenantId,
          user_id: newTicket.assignee_id,
          title: 'Ticket Assigned',
          body: `You have been assigned to a new ticket: ${newTicket.subject}`,
          link: `/crm/support/${newTicket.id}`,
          type: 'assignment'
        });
      }

      return sendSuccess(res, newTicket, 'Ticket created successfully.', 201);
    } catch (error) {
      console.error('Error creating ticket:', error);
      const statusCode = error.message.includes('required') ? 400 : 500;
      return sendError(res, error.message || 'Failed to create ticket.', statusCode);
    }
  },

  async updateTicket(req, res) {
    try {
      const { ticket, beforeData } = await crmTicketService.updateTicket(req.params.id, req.tenantId, req.body);

      await logAudit({
        ...getAuditContext(req),
        action: 'update',
        entityType: 'ticket',
        entityId: ticket.id,
        before: beforeData,
        after: ticket.toJSON(),
        description: `Ticket ${ticket.ticket_no} updated.`
      });

      if (ticket.assignee_id && ticket.assignee_id !== beforeData.assignee_id && ticket.assignee_id !== req.user.id) {
        await notificationService.createNotification({
          tenant_id: req.tenantId,
          user_id: ticket.assignee_id,
          title: 'Ticket Assigned',
          body: `You have been assigned to ticket: ${ticket.subject}`,
          link: `/crm/support/${ticket.id}`,
          type: 'assignment'
        });
      }

      return sendSuccess(res, ticket, 'Ticket updated successfully.');
    } catch (error) {
      console.error('Error updating ticket:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      return sendError(res, error.message || 'Failed to update ticket.', statusCode);
    }
  },

  async addMessage(req, res) {
    try {
      const { message, is_internal } = req.body;
      const newMessage = await crmTicketService.addMessage({
        ticketId: req.params.id,
        tenantId: req.tenantId,
        userId: req.user.id,
        message,
        is_internal
      });

      return sendSuccess(res, newMessage, 'Message added successfully.', 201);
    } catch (error) {
      console.error('Error adding ticket message:', error);
      const statusCode = error.message.includes('not found') ? 404 : error.message.includes('required') ? 400 : 500;
      return sendError(res, error.message || 'Failed to add message.', statusCode);
    }
  },

  async deleteTicket(req, res) {
    try {
      const ticket = await crmTicketService.deleteTicket(req.params.id, req.tenantId);

      await logAudit({
        ...getAuditContext(req),
        action: 'archive',
        entityType: 'ticket',
        entityId: ticket.id,
        description: `Ticket ${ticket.ticket_no} archived.`
      });

      return sendSuccess(res, null, 'Ticket archived successfully.');
    } catch (error) {
      console.error('Error deleting ticket:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      return sendError(res, error.message || 'Failed to archive ticket.', statusCode);
    }
  }
};

module.exports = crmTicketController;
