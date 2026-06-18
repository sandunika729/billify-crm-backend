'use strict';

const crmDashboardService = require('../services/crmDashboardService');
const { sendSuccess, sendError } = require('../utils/response');

const crmDashboardController = {
  async getSummary(req, res) {
    try {
      const summary = await crmDashboardService.getSummary(req.tenantId);
      return sendSuccess(res, summary, 'Dashboard summary retrieved successfully.');
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      return sendError(res, error.message || 'Failed to fetch dashboard summary.', 500);
    }
  },

  async getCharts(req, res) {
    try {
      const { from, to } = req.query;
      const chartData = await crmDashboardService.getCharts({
        tenantId: req.tenantId,
        from,
        to
      });
      return sendSuccess(res, chartData, 'Dashboard chart data retrieved successfully.');
    } catch (error) {
      console.error('Error fetching dashboard charts:', error);
      return sendError(res, error.message || 'Failed to fetch dashboard charts.', 500);
    }
  }
};

module.exports = crmDashboardController;
