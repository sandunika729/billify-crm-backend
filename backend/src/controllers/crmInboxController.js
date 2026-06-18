'use strict';

const crmInboxService = require('../services/crmInboxService');
const { sendSuccess, sendError } = require('../utils/response');

const crmInboxController = {
  async getInbox(req, res) {
    try {
      const { channel, search, date, page, limit } = req.query;
      const feed = await crmInboxService.getInbox(req.tenantId, req.user.id, {
        channel,
        search,
        date,
        page: parseInt(page, 10) || 1,
        limit: parseInt(limit, 10) || 20
      });
      return sendSuccess(res, feed, 'Inbox feed retrieved successfully.');
    } catch (error) {
      console.error('Error in getInbox:', error);
      return sendError(res, error.message || 'Failed to retrieve inbox feed.', 500);
    }
  },

  async getStats(req, res) {
    try {
      const stats = await crmInboxService.getInboxStats(req.tenantId, req.user.id);
      return sendSuccess(res, stats, 'Inbox stats retrieved successfully.');
    } catch (error) {
      console.error('Error in getStats:', error);
      return sendError(res, error.message || 'Failed to retrieve inbox stats.', 500);
    }
  }
};

module.exports = crmInboxController;
