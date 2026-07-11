'use strict';

const { Op, fn, col } = require('sequelize');
const { 
  CrmCustomer,
  CrmLead,
  CrmDeal,
  CrmQuote,
  CrmTicket,
  BillPayment
} = require('../models');

const crmDashboardService = {
  async getSummary(tenantId) {
    const totalCustomers = await CrmCustomer.count({
      where: { tenant_id: tenantId, status: 'active' }
    });

    const activeLeads = await CrmLead.count({
      where: { tenant_id: tenantId, status: { [Op.notIn]: ['converted', 'disqualified'] } }
    });

    const pendingFollowUps = await CrmLead.count({
      where: { 
        tenant_id: tenantId, 
        status: { [Op.notIn]: ['converted', 'disqualified'] },
        next_follow_up_at: { [Op.not]: null, [Op.lte]: new Date() }
      }
    });

    const openDeals = await CrmDeal.count({
      where: { tenant_id: tenantId, status: 'open' }
    });

    const openTickets = await CrmTicket.count({
      where: { tenant_id: tenantId, status: { [Op.notIn]: ['resolved', 'closed'] } }
    });
    
    const openQuotesData = await CrmQuote.findAll({
      where: { tenant_id: tenantId, status: { [Op.in]: ['draft', 'sent', 'viewed'] } },
      attributes: [
        [fn('SUM', col('total_lkr')), 'totalValue']
      ],
      raw: true
    });
    const quoteValue = openQuotesData[0]?.totalValue || 0;

    
    const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const wonDealsData = await CrmDeal.findAll({
      where: { 
        tenant_id: tenantId, 
        status: 'won',
        updated_at: { [Op.gte]: currentMonthStart }
      },
      attributes: [
        [fn('SUM', col('value_lkr')), 'totalWonValue']
      ],
      raw: true
    });
    const monthlySalesValue = wonDealsData[0]?.totalWonValue || 0;

    return {
      totalCustomers,
      activeLeads,
      pendingFollowUps,
      openDeals,
      openTickets,
      quoteValue,
      monthlySalesValue
    };
  },

  async getCharts({ tenantId, from, to }) {
    const dateFilter = {};
    if (from || to) {
      dateFilter.created_at = {};
      if (from) dateFilter.created_at[Op.gte] = new Date(from);
      if (to) dateFilter.created_at[Op.lte] = new Date(to);
    }

    
    const dealsByStage = await CrmDeal.findAll({
      where: { tenant_id: tenantId, ...dateFilter },
      attributes: [
        'stage_id',
        [fn('COUNT', col('id')), 'count'],
        [fn('SUM', col('value_lkr')), 'totalValue']
      ],
      group: ['stage_id'],
      raw: true
    });

    
    const ticketsByStatus = await CrmTicket.findAll({
      where: { tenant_id: tenantId, ...dateFilter },
      attributes: [
        'status',
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    
    const leadsByStatus = await CrmLead.findAll({
      where: { tenant_id: tenantId, ...dateFilter },
      attributes: [
        'status',
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    const leadsTotal = await CrmLead.count({ where: { tenant_id: tenantId, ...dateFilter } });
    const leadsConverted = await CrmLead.count({ where: { tenant_id: tenantId, status: 'converted', ...dateFilter } });

    
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const salesPerformance = await CrmDeal.findAll({
      where: { 
        tenant_id: tenantId, 
        status: 'won',
        updated_at: { [Op.gte]: sixMonthsAgo }
      },
      attributes: [
        [fn('DATE_FORMAT', col('updated_at'), '%Y-%m'), 'month'],
        [fn('SUM', col('value_lkr')), 'totalValue']
      ],
      group: [fn('DATE_FORMAT', col('updated_at'), '%Y-%m')],
      order: [[fn('DATE_FORMAT', col('updated_at'), '%Y-%m'), 'ASC']],
      raw: true
    });

    
    const paymentCollection = await BillPayment.findAll({
      where: { 
        business_id: tenantId,
        created_at: { [Op.gte]: sixMonthsAgo }
      },
      attributes: [
        [fn('DATE_FORMAT', col('created_at'), '%Y-%m'), 'month'],
        [fn('SUM', col('amount')), 'totalAmount']
      ],
      group: [fn('DATE_FORMAT', col('created_at'), '%Y-%m')],
      order: [[fn('DATE_FORMAT', col('created_at'), '%Y-%m'), 'ASC']],
      raw: true
    });

    return {
      dealsByStage,
      ticketsByStatus,
      leadsByStatus,
      salesPerformance,
      paymentCollection,
      conversion: {
        total: leadsTotal,
        converted: leadsConverted
      }
    };
  }
};

module.exports = crmDashboardService;
