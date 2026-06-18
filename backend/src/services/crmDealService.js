'use strict';

const { Op } = require('sequelize');
const { CrmDeal, CrmCustomer, CrmLead, CrmDealStage, CrmDealStageHistory, User, sequelize } = require('../models');
const crmDealAutomationService = require('./crmDealAutomationService');

const crmDealService = {
  async getAllDeals({ tenantId, limit, offset, search, stage_id, status, owner_id }) {
    const whereClause = { tenant_id: tenantId };
    
    if (stage_id) whereClause.stage_id = stage_id;
    if (status) whereClause.status = status;
    if (owner_id) whereClause.owner_id = owner_id;

    if (search) {
      whereClause.title = { [Op.like]: `%${search}%` };
    }

    const { count, rows } = await CrmDeal.findAndCountAll({
      where: whereClause,
      include: [
        { model: CrmCustomer, as: 'customer', attributes: ['id', 'name', 'company_name'] },
        { model: CrmDealStage, as: 'stage', attributes: ['id', 'name', 'color'] },
        { model: User, as: 'owner', attributes: ['id', 'first_name', 'last_name'] }
      ],
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });

    return { count, rows };
  },

  async getDealStages(tenantId) {
    return await CrmDealStage.findAll({
      where: { tenant_id: tenantId },
      order: [['sort_order', 'ASC']]
    });
  },

  async getDealById(dealId, tenantId) {
    const deal = await CrmDeal.findOne({
      where: { id: dealId, tenant_id: tenantId },
      include: [
        { model: CrmCustomer, as: 'customer', attributes: ['id', 'name', 'email', 'phone'] },
        { model: CrmLead, as: 'lead', attributes: ['id', 'name'] },
        { model: CrmDealStage, as: 'stage' },
        { model: User, as: 'owner', attributes: ['id', 'first_name', 'last_name'] }
      ]
    });

    if (!deal) throw new Error('Deal not found.');
    return deal;
  },

  async createDeal({ tenantId, data, userId }) {
    const { customer_id, lead_id, title, stage_id, value_lkr, probability, expected_close_at, owner_id, notes, custom_fields, products_interest } = data;

    if (!customer_id || !title || !stage_id) {
      throw new Error('Customer, title, and stage are required.');
    }

    const newDeal = await CrmDeal.create({
      tenant_id: tenantId,
      customer_id,
      lead_id,
      title,
      stage_id,
      value_lkr: value_lkr || 0,
      probability,
      expected_close_at,
      owner_id: owner_id || userId,
      status: 'open',
      notes,
      products_interest: products_interest || [],
      custom_fields: custom_fields || {},
      created_by: userId
    });

    
    await CrmDealStageHistory.create({
      tenant_id: tenantId,
      deal_id: newDeal.id,
      from_stage_id: null,
      to_stage_id: stage_id,
      changed_by: userId,
      changed_at: new Date()
    });

    return await this.getDealById(newDeal.id, tenantId);
  },

  async updateDeal(dealId, tenantId, updateData) {
    const deal = await CrmDeal.findOne({ where: { id: dealId, tenant_id: tenantId } });
    if (!deal) throw new Error('Deal not found.');

    delete updateData.id;
    delete updateData.tenant_id;
    delete updateData.stage_id; 

    if (updateData.custom_fields !== undefined) {
      deal.custom_fields = updateData.custom_fields;
    }

    const beforeData = deal.toJSON();
    await deal.update(updateData);

    const updatedDeal = await this.getDealById(deal.id, tenantId);
    return { deal: updatedDeal, beforeData };
  },

  async updateDealStage({ dealId, tenantId, stage_id, won_lost_reason, userId }) {
    if (!stage_id) throw new Error('New stage_id is required.');

    const { Product } = require('../models');
    const transaction = await sequelize.transaction();
    try {
      const deal = await CrmDeal.findOne({ where: { id: dealId, tenant_id: tenantId }, transaction });
      if (!deal) {
        await transaction.rollback();
        throw new Error('Deal not found.');
      }

      if (deal.stage_id === stage_id) {
        await transaction.rollback();
        throw new Error('Deal is already in this stage.');
      }

      const oldStageId = deal.stage_id;

      const newStage = await CrmDealStage.findOne({ where: { id: stage_id, tenant_id: tenantId }, transaction });
      if (!newStage) {
        await transaction.rollback();
        throw new Error('Invalid stage provided.');
      }

      let newStatus = 'open';
      if (newStage.is_won_stage) newStatus = 'won';
      if (newStage.is_lost_stage) newStatus = 'lost';

      const updateData = { 
        stage_id, 
        status: newStatus,
        probability: newStage.probability_default !== null ? newStage.probability_default : deal.probability
      };
      
      if (won_lost_reason !== undefined) {
        updateData.won_lost_reason = won_lost_reason;
      }

      await deal.update(updateData, { transaction });

      await CrmDealStageHistory.create({
        tenant_id: tenantId,
        deal_id: deal.id,
        from_stage_id: oldStageId,
        to_stage_id: stage_id,
        changed_by: userId,
        changed_at: new Date()
      }, { transaction });

      await transaction.commit();

      
      crmDealAutomationService.triggerRules(deal, stage_id);

      return { deal, oldStageId };
    } catch (error) {
      
      if (!error.message.includes('not found') && !error.message.includes('already in this stage') && !error.message.includes('Invalid stage')) {
        await transaction.rollback();
      }
      throw error;
    }
  },

  async deleteDeal(dealId, tenantId) {
    const deal = await CrmDeal.findOne({ where: { id: dealId, tenant_id: tenantId } });
    if (!deal) throw new Error('Deal not found.');

    await deal.destroy();
    return deal;
  }
};

module.exports = crmDealService;
