'use strict';

const crmReportService = require('../services/crmReportService');
const { sendSuccess, sendError } = require('../utils/response');

const crmReportController = {
  async getReports(req, res) {
    try {
      const { from, to } = req.query;
      const tenantId = req.tenantId;

      const [
        revenueTrend, leadFunnel, pipelineValue, teamPerformance, ticketStats,
        winLossReasons, lostDealsAnalysis, quoteStatusBreakdown,
        quoteConversionRate, newCustomerAcquisition, topCustomersByRevenue
      ] = await Promise.all([
        crmReportService.getRevenueTrend(tenantId, from, to),
        crmReportService.getLeadFunnel(tenantId, from, to),
        crmReportService.getPipelineValue(tenantId),
        crmReportService.getTeamPerformance(tenantId, from, to),
        crmReportService.getTicketStats(tenantId, from, to),
        crmReportService.getWinLossReasons(tenantId, from, to),
        crmReportService.getLostDealsAnalysis(tenantId, from, to),
        crmReportService.getQuoteStatusBreakdown(tenantId, from, to),
        crmReportService.getQuoteConversionRate(tenantId, from, to),
        crmReportService.getNewCustomerAcquisition(tenantId, from, to),
        crmReportService.getTopCustomersByRevenue(tenantId, from, to)
      ]);

      return sendSuccess(res, {
        revenueTrend, leadFunnel, pipelineValue, teamPerformance, ticketStats,
        winLossReasons, lostDealsAnalysis, quoteStatusBreakdown,
        quoteConversionRate, newCustomerAcquisition, topCustomersByRevenue
      }, 'Advanced reports retrieved successfully.', 200);
    } catch (error) {
      console.error('Error fetching advanced reports:', error);
      return sendError(res, error.message || 'Failed to fetch advanced reports.', 500);
    }
  }

};

module.exports = crmReportController;
