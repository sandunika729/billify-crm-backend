'use strict';

const crmDealService = require('../services/crmDealService');
const crmDealAutomationService = require('../services/crmDealAutomationService');
const notificationService = require('../services/notificationService');
const { sendSuccess, sendError, sendPaginated, getPagination, getPaginationMeta } = require('../utils/response');
const { logAudit, getAuditContext } = require('../utils/auditLogger');

const crmDealController = {
  async getAllDeals(req, res) {
    try {
      const { page, limit, offset } = getPagination(req.query);
      const { search, stage_id, status, owner_id } = req.query;

      const { count, rows } = await crmDealService.getAllDeals({
        tenantId: req.tenantId,
        limit,
        offset,
        search,
        stage_id,
        status,
        owner_id
      });

      const paginationMeta = getPaginationMeta(count, page, limit);
      return sendPaginated(res, rows, paginationMeta, 'Deals retrieved successfully.');
    } catch (error) {
      console.error('Error fetching deals:', error);
      return sendError(res, error.message || 'Failed to fetch deals.', 500);
    }
  },

  async getDealStages(req, res) {
    try {
      const stages = await crmDealService.getDealStages(req.tenantId);
      return sendSuccess(res, stages, 'Deal stages retrieved successfully.');
    } catch (error) {
      console.error('Error fetching deal stages:', error);
      return sendError(res, error.message || 'Failed to fetch deal stages.', 500);
    }
  },

  async getDealById(req, res) {
    try {
      const deal = await crmDealService.getDealById(req.params.id, req.tenantId);
      return sendSuccess(res, deal, 'Deal retrieved successfully.');
    } catch (error) {
      console.error('Error fetching deal:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      return sendError(res, error.message || 'Failed to fetch deal.', statusCode);
    }
  },

  async createDeal(req, res) {
    try {
      const newDeal = await crmDealService.createDeal({
        tenantId: req.tenantId,
        data: req.body,
        userId: req.user.id
      });

      await logAudit({
        ...getAuditContext(req),
        action: 'create',
        entityType: 'deal',
        entityId: newDeal.id,
        after: newDeal.toJSON(),
        description: `Deal "${newDeal.title}" created.`
      });

      if (newDeal.owner_id && newDeal.owner_id !== req.user.id) {
        await notificationService.createNotification({
          tenant_id: req.tenantId,
          user_id: newDeal.owner_id,
          title: 'Deal Assigned',
          body: `You have been assigned to a new deal: ${newDeal.title}`,
          link: `/crm/deals?search=${encodeURIComponent(newDeal.title)}`,
          type: 'assignment'
        });
      }

      return sendSuccess(res, newDeal, 'Deal created successfully.', 201);
    } catch (error) {
      console.error('Error creating deal:', error);
      const statusCode = error.message.includes('required') ? 400 : 500;
      return sendError(res, error.message || 'Failed to create deal.', statusCode);
    }
  },

  async updateDeal(req, res) {
    try {
      const { deal, beforeData } = await crmDealService.updateDeal(req.params.id, req.tenantId, req.body);

      await logAudit({
        ...getAuditContext(req),
        action: 'update',
        entityType: 'deal',
        entityId: deal.id,
        before: beforeData,
        after: deal.toJSON(),
        description: `Deal "${deal.title}" updated.`
      });

      if (deal.owner_id && deal.owner_id !== beforeData.owner_id && deal.owner_id !== req.user.id) {
        await notificationService.createNotification({
          tenant_id: req.tenantId,
          user_id: deal.owner_id,
          title: 'Deal Assigned',
          body: `You have been assigned to deal: ${deal.title}`,
          link: `/crm/deals?search=${encodeURIComponent(deal.title)}`,
          type: 'assignment'
        });
      }

      return sendSuccess(res, deal, 'Deal updated successfully.');
    } catch (error) {
      console.error('Error updating deal:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      return sendError(res, error.message || 'Failed to update deal.', statusCode);
    }
  },

  async updateDealStage(req, res) {
    try {
      const { stage_id, won_lost_reason } = req.body;
      const { deal, oldStageId } = await crmDealService.updateDealStage({
        dealId: req.params.id,
        tenantId: req.tenantId,
        stage_id,
        won_lost_reason,
        userId: req.user.id
      });

      await logAudit({
        ...getAuditContext(req),
        action: 'status_change',
        entityType: 'deal',
        entityId: deal.id,
        description: `Deal stage changed from ${oldStageId} to ${stage_id}.`
      });

      return sendSuccess(res, deal, 'Deal stage updated successfully.');
    } catch (error) {
      console.error('Error updating deal stage:', error);
      const statusCode = error.message.includes('not found') ? 404 : 400;
      return sendError(res, error.message || 'Failed to update deal stage.', statusCode);
    }
  },

  async deleteDeal(req, res) {
    try {
      const deal = await crmDealService.deleteDeal(req.params.id, req.tenantId);

      await logAudit({
        ...getAuditContext(req),
        action: 'archive',
        entityType: 'deal',
        entityId: deal.id,
        description: `Deal "${deal.title}" archived.`
      });

      return sendSuccess(res, null, 'Deal archived successfully.');
    } catch (error) {
      console.error('Error deleting deal:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      return sendError(res, error.message || 'Failed to archive deal.', statusCode);
    }
  },

  

  async getAutomationRules(req, res) {
    try {
      const { stageId } = req.params;
      const rules = await crmDealAutomationService.getRulesByStage(req.tenantId, stageId);
      return sendSuccess(res, rules, 'Rules retrieved successfully.');
    } catch (error) {
      console.error('Error fetching automation rules:', error);
      return sendError(res, 'Failed to fetch automation rules.', 500);
    }
  },

  async createAutomationRule(req, res) {
    try {
      const { stageId } = req.params;
      const rule = await crmDealAutomationService.createRule(req.tenantId, stageId, req.body);
      return sendSuccess(res, rule, 'Rule created successfully.', 201);
    } catch (error) {
      console.error('Error creating automation rule:', error);
      return sendError(res, error.message || 'Failed to create automation rule.', 400);
    }
  },

  async deleteAutomationRule(req, res) {
    try {
      await crmDealAutomationService.deleteRule(req.tenantId, req.params.ruleId);
      return sendSuccess(res, null, 'Rule deleted successfully.');
    } catch (error) {
      console.error('Error deleting automation rule:', error);
      return sendError(res, error.message || 'Failed to delete automation rule.', 400);
    }
  }
};

module.exports = crmDealController;
