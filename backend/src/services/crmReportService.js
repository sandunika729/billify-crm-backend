'use strict';

const { Op, fn, col, literal } = require('sequelize');
const { 
  CrmLead,
  CrmDeal,
  CrmDealStage,
  CrmTicket,
  CrmActivity,
  CrmQuote,
  CrmCustomer,
  User
} = require('../models');

const crmReportService = {
  
  async getRevenueTrend(tenantId, from, to) {
    const dateFilter = { tenant_id: tenantId, status: 'won' };
    if (from || to) {
      dateFilter.updated_at = {};
      if (from) dateFilter.updated_at[Op.gte] = new Date(from);
      if (to) dateFilter.updated_at[Op.lte] = new Date(to);
    }

    
    
    const results = await CrmDeal.findAll({
      where: dateFilter,
      attributes: [
        [fn('DATE_FORMAT', col('updated_at'), '%Y-%m'), 'month'],
        [fn('SUM', col('value_lkr')), 'revenue']
      ],
      group: [fn('DATE_FORMAT', col('updated_at'), '%Y-%m')],
      order: [[fn('DATE_FORMAT', col('updated_at'), '%Y-%m'), 'ASC']],
      raw: true
    });

    return results.map(r => ({
      month: r.month,
      revenue: parseFloat(r.revenue || 0)
    }));
  },

  
  async getLeadFunnel(tenantId, from, to) {
    const dateFilter = { tenant_id: tenantId };
    if (from || to) {
      dateFilter.created_at = {};
      if (from) dateFilter.created_at[Op.gte] = new Date(from);
      if (to) dateFilter.created_at[Op.lte] = new Date(to);
    }

    const leads = await CrmLead.findAll({
      where: dateFilter,
      attributes: [
        'status',
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    
    const counts = {
      new: 0, contacted: 0, qualified: 0, won: 0, lost: 0
    };
    leads.forEach(l => { counts[l.status] = parseInt(l.count, 10); });

    const totalLeads = counts.new + counts.contacted + counts.qualified + counts.won + counts.lost;
    
    const reachedQualified = counts.qualified + counts.won;
    const reachedWon = counts.won;

    return [
      { stage: 'Total Leads', count: totalLeads },
      { stage: 'Qualified', count: reachedQualified },
      { stage: 'Won (Converted)', count: reachedWon }
    ];
  },

  
  async getPipelineValue(tenantId) {
    
    const deals = await CrmDeal.findAll({
      where: { tenant_id: tenantId, status: 'open' },
      attributes: [
        'stage_id',
        [fn('SUM', col('value_lkr')), 'totalValue'],
        [fn('COUNT', col('CrmDeal.id')), 'count']
      ],
      include: [{
        model: CrmDealStage,
        as: 'stage',
        attributes: ['name', 'color']
      }],
      group: ['stage_id', 'stage.id'],
      raw: true
    });

    return deals.map(d => ({
      stage_name: d['stage.name'] || 'Unknown',
      color: d['stage.color'] || '#3b82f6',
      value: parseFloat(d.totalValue || 0),
      count: parseInt(d.count, 10)
    }));
  },

  
  async getTeamPerformance(tenantId, from, to) {
    const dateFilter = {};
    if (from || to) {
      dateFilter.updated_at = {};
      if (from) dateFilter.updated_at[Op.gte] = new Date(from);
      if (to) dateFilter.updated_at[Op.lte] = new Date(to);
    }

    
    const dealsWon = await CrmDeal.findAll({
      where: { tenant_id: tenantId, status: 'won', ...dateFilter },
      attributes: [
        'owner_id',
        [fn('COUNT', col('CrmDeal.id')), 'deals_won'],
        [fn('SUM', col('value_lkr')), 'revenue']
      ],
      include: [{ model: User, as: 'owner', attributes: ['first_name'] }],
      group: ['owner_id', 'owner.id'],
      raw: true
    });

    
    return dealsWon.map(d => ({
      owner_id: d.owner_id,
      name: d['owner.first_name'] ? `${d['owner.first_name']}` : 'Unassigned',
      deals_won: parseInt(d.deals_won, 10),
      revenue: parseFloat(d.revenue || 0)
    })).sort((a, b) => b.revenue - a.revenue);
  },

  
  async getTicketStats(tenantId, from, to) {
    const dateFilter = { tenant_id: tenantId };
    if (from || to) {
      dateFilter.created_at = {};
      if (from) dateFilter.created_at[Op.gte] = new Date(from);
      if (to) dateFilter.created_at[Op.lte] = new Date(to);
    }

    const tickets = await CrmTicket.findAll({
      where: dateFilter,
      attributes: [
        [fn('DATE_FORMAT', col('created_at'), '%Y-%m'), 'month'],
        'status',
        [fn('COUNT', col('id')), 'count']
      ],
      group: [fn('DATE_FORMAT', col('created_at'), '%Y-%m'), 'status'],
      raw: true
    });

    const monthlyMap = {};
    tickets.forEach(t => {
      const m = t.month;
      if (!monthlyMap[m]) monthlyMap[m] = { month: m, opened: 0, resolved: 0 };
      
      if (t.status === 'resolved' || t.status === 'closed') {
        monthlyMap[m].resolved += parseInt(t.count, 10);
      } else {
        monthlyMap[m].opened += parseInt(t.count, 10);
      }
    });

    return Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));
  },

  async getWinLossReasons(tenantId, from, to) {
    const dateFilter = { tenant_id: tenantId, status: { [Op.in]: ['won', 'lost'] } };
    if (from || to) {
      dateFilter.updated_at = {};
      if (from) dateFilter.updated_at[Op.gte] = new Date(from);
      if (to) dateFilter.updated_at[Op.lte] = new Date(to);
    }

    const deals = await CrmDeal.findAll({
      where: dateFilter,
      attributes: ['status', 'won_lost_reason', [fn('COUNT', col('id')), 'count']],
      group: ['status', 'won_lost_reason'],
      raw: true
    });

    const wonMap = {};
    const lostMap = {};

    deals.forEach(d => {
      const reason = d.won_lost_reason?.trim() || 'No reason given';
      const count = parseInt(d.count, 10);
      if (d.status === 'won') {
        wonMap[reason] = (wonMap[reason] || 0) + count;
      } else {
        lostMap[reason] = (lostMap[reason] || 0) + count;
      }
    });

    const wonReasons = Object.entries(wonMap).map(([reason, count]) => ({ reason, count, type: 'won' }))
      .sort((a, b) => b.count - a.count).slice(0, 8);

    const lostReasons = Object.entries(lostMap).map(([reason, count]) => ({ reason, count, type: 'lost' }))
      .sort((a, b) => b.count - a.count).slice(0, 8);

    const totalWon = Object.values(wonMap).reduce((s, v) => s + v, 0);
    const totalLost = Object.values(lostMap).reduce((s, v) => s + v, 0);

    return { wonReasons, lostReasons, totalWon, totalLost, winRate: totalWon + totalLost > 0 ? Math.round((totalWon / (totalWon + totalLost)) * 100) : 0 };
  },

  
  async getLostDealsAnalysis(tenantId, from, to) {
    const dateFilter = { tenant_id: tenantId, status: 'lost' };
    if (from || to) {
      dateFilter.updated_at = {};
      if (from) dateFilter.updated_at[Op.gte] = new Date(from);
      if (to) dateFilter.updated_at[Op.lte] = new Date(to);
    }

    const deals = await CrmDeal.findAll({
      where: dateFilter,
      attributes: ['title', 'value_lkr', 'won_lost_reason', 'updated_at'],
      include: [
        { model: CrmCustomer, as: 'customer', attributes: ['name'] },
        { model: User, as: 'owner', attributes: ['first_name', 'last_name'] }
      ],
      order: [['updated_at', 'DESC']],
      limit: 50
    });

    
    const reasonMap = {};
    deals.forEach(d => {
      const reason = d.won_lost_reason?.trim() || 'No reason given';
      if (!reasonMap[reason]) reasonMap[reason] = { reason, count: 0, value: 0 };
      reasonMap[reason].count++;
      reasonMap[reason].value += parseFloat(d.value_lkr || 0);
    });

    return {
      deals: deals.map(d => ({
        title: d.title,
        value_lkr: parseFloat(d.value_lkr || 0),
        reason: d.won_lost_reason || 'No reason given',
        customer: d.customer?.name || 'Unknown',
        owner: d.owner ? `${d.owner.first_name} ${d.owner.last_name}` : 'Unassigned',
        date: d.updated_at
      })),
      reasonBreakdown: Object.values(reasonMap).sort((a, b) => b.count - a.count),
      totalLost: deals.length,
      totalValueLost: deals.reduce((s, d) => s + parseFloat(d.value_lkr || 0), 0)
    };
  },

  
  async getQuoteStatusBreakdown(tenantId, from, to) {
    const dateFilter = { tenant_id: tenantId };
    if (from || to) {
      dateFilter.created_at = {};
      if (from) dateFilter.created_at[Op.gte] = new Date(from);
      if (to) dateFilter.created_at[Op.lte] = new Date(to);
    }

    const rows = await CrmQuote.findAll({
      where: dateFilter,
      attributes: [
        'status',
        [fn('COUNT', col('id')), 'count'],
        [fn('SUM', col('total_lkr')), 'total_value']
      ],
      group: ['status'],
      raw: true
    });

    const STATUS_ORDER = ['draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired', 'converted'];
    const result = STATUS_ORDER.map(s => {
      const found = rows.find(r => r.status === s);
      return { status: s, count: found ? parseInt(found.count) : 0, total_value: found ? parseFloat(found.total_value || 0) : 0 };
    }).filter(r => r.count > 0);

    const totalQuotes = result.reduce((s, r) => s + r.count, 0);
    return { breakdown: result, totalQuotes };
  },

  
  async getQuoteConversionRate(tenantId, from, to) {
    const dateFilter = { tenant_id: tenantId };
    if (from || to) {
      dateFilter.created_at = {};
      if (from) dateFilter.created_at[Op.gte] = new Date(from);
      if (to) dateFilter.created_at[Op.lte] = new Date(to);
    }

    const rows = await CrmQuote.findAll({
      where: dateFilter,
      attributes: [
        [fn('DATE_FORMAT', col('created_at'), '%Y-%m'), 'month'],
        'status',
        [fn('COUNT', col('id')), 'count']
      ],
      group: [fn('DATE_FORMAT', col('created_at'), '%Y-%m'), 'status'],
      raw: true
    });

    const monthMap = {};
    rows.forEach(r => {
      const m = r.month;
      if (!monthMap[m]) monthMap[m] = { month: m, sent: 0, accepted: 0, rejected: 0, total: 0 };
      monthMap[m].total += parseInt(r.count);
      if (r.status === 'sent' || r.status === 'viewed') monthMap[m].sent += parseInt(r.count);
      if (r.status === 'accepted' || r.status === 'converted') monthMap[m].accepted += parseInt(r.count);
      if (r.status === 'rejected' || r.status === 'expired') monthMap[m].rejected += parseInt(r.count);
    });

    const timeline = Object.values(monthMap)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(m => ({
        ...m,
        conversionRate: m.total > 0 ? Math.round((m.accepted / m.total) * 100) : 0
      }));

    const totalSent = timeline.reduce((s, m) => s + m.sent + m.accepted + m.rejected, 0);
    const totalAccepted = timeline.reduce((s, m) => s + m.accepted, 0);
    const overallRate = totalSent > 0 ? Math.round((totalAccepted / totalSent) * 100) : 0;

    return { timeline, totalSent, totalAccepted, overallRate };
  },

  
  async getNewCustomerAcquisition(tenantId, from, to) {
    const dateFilter = { tenant_id: tenantId };
    if (from || to) {
      dateFilter.created_at = {};
      if (from) dateFilter.created_at[Op.gte] = new Date(from);
      if (to) dateFilter.created_at[Op.lte] = new Date(to);
    }

    const rows = await CrmCustomer.findAll({
      where: dateFilter,
      attributes: [
        [fn('DATE_FORMAT', col('created_at'), '%Y-%m'), 'month'],
        'source',
        [fn('COUNT', col('id')), 'count']
      ],
      group: [fn('DATE_FORMAT', col('created_at'), '%Y-%m'), 'source'],
      raw: true
    });

    const monthMap = {};
    const sourceMap = {};

    rows.forEach(r => {
      const m = r.month;
      const src = r.source || 'direct';
      if (!monthMap[m]) monthMap[m] = { month: m, count: 0 };
      monthMap[m].count += parseInt(r.count);
      sourceMap[src] = (sourceMap[src] || 0) + parseInt(r.count);
    });

    const timeline = Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month));
    const bySource = Object.entries(sourceMap)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);

    return { timeline, bySource, total: timeline.reduce((s, m) => s + m.count, 0) };
  },

  
  async getTopCustomersByRevenue(tenantId, from, to) {
    const dealFilter = { tenant_id: tenantId, status: 'won' };
    if (from || to) {
      dealFilter.updated_at = {};
      if (from) dealFilter.updated_at[Op.gte] = new Date(from);
      if (to) dealFilter.updated_at[Op.lte] = new Date(to);
    }

    const deals = await CrmDeal.findAll({
      where: dealFilter,
      attributes: [
        'customer_id',
        [fn('SUM', col('value_lkr')), 'revenue'],
        [fn('COUNT', col('CrmDeal.id')), 'deals_won']
      ],
      include: [{ model: CrmCustomer, as: 'customer', attributes: ['name', 'email', 'type'] }],
      group: ['customer_id', 'customer.id'],
      order: [[fn('SUM', col('value_lkr')), 'DESC']],
      limit: 15,
      raw: true
    });

    return deals.map((d, i) => ({
      rank: i + 1,
      customer_id: d.customer_id,
      name: d['customer.name'] || 'Unknown',
      email: d['customer.email'] || '',
      type: d['customer.type'] || 'individual',
      revenue: parseFloat(d.revenue || 0),
      deals_won: parseInt(d.deals_won, 10)
    }));
  }
};

module.exports = crmReportService;
