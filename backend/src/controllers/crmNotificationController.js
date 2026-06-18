'use strict';

const notificationService = require('../services/notificationService');

exports.getRecent = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    const result = await notificationService.getRecentNotifications(req.user.tenantId, req.user.id, limit);
    if (!result.success) return res.status(500).json(result);
    
    
    const unreadResult = await notificationService.getUnreadNotifications(req.user.tenantId, req.user.id);
    const unreadCount = unreadResult.success ? unreadResult.data.length : 0;
    
    res.json({ success: true, data: result.data, unreadCount });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const result = await notificationService.markAsRead(req.user.tenantId, req.user.id, req.params.id);
    if (!result.success) return res.status(404).json(result);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const result = await notificationService.markAllAsRead(req.user.tenantId, req.user.id);
    if (!result.success) return res.status(500).json(result);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
