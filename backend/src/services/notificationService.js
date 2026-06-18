'use strict';

const { CrmNotification } = require('../models');
const { emitToUser } = require('../socket');

const createNotification = async (data) => {
  try {
    const notification = await CrmNotification.create({
      tenant_id: data.tenant_id,
      user_id: data.user_id,
      title: data.title,
      body: data.body,
      link: data.link,
      type: data.type || 'info',
    });

    
    emitToUser(data.user_id, 'new_notification', notification);

    return { success: true, data: notification };
  } catch (error) {
    console.error('Failed to create notification:', error);
    return { success: false, message: 'Failed to create notification' };
  }
};

const getUnreadNotifications = async (tenant_id, user_id, limit = 20) => {
  try {
    const notifications = await CrmNotification.findAll({
      where: {
        tenant_id,
        user_id,
        read_at: null,
      },
      order: [['createdAt', 'DESC']],
      limit,
    });
    return { success: true, data: notifications };
  } catch (error) {
    console.error('Failed to fetch unread notifications:', error);
    return { success: false, message: 'Failed to fetch unread notifications', error: error.message };
  }
};

const getRecentNotifications = async (tenant_id, user_id, limit = 20) => {
  try {
    const notifications = await CrmNotification.findAll({
      where: {
        tenant_id,
        user_id,
      },
      order: [['createdAt', 'DESC']],
      limit,
    });
    return { success: true, data: notifications };
  } catch (error) {
    console.error('Failed to fetch notifications:', error.stack || error);
    return { success: false, message: 'Failed to fetch notifications', error: error.message };
  }
};

const markAsRead = async (tenant_id, user_id, notification_id) => {
  try {
    const notification = await CrmNotification.findOne({
      where: { id: notification_id, tenant_id, user_id },
    });
    if (!notification) {
      return { success: false, message: 'Notification not found' };
    }
    notification.read_at = new Date();
    await notification.save();
    return { success: true, data: notification };
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    return { success: false, message: 'Failed to mark as read' };
  }
};

const markAllAsRead = async (tenant_id, user_id) => {
  try {
    await CrmNotification.update(
      { read_at: new Date() },
      { where: { tenant_id, user_id, read_at: null } }
    );
    return { success: true, message: 'All notifications marked as read' };
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error);
    return { success: false, message: 'Failed to mark all as read' };
  }
};

module.exports = {
  createNotification,
  getUnreadNotifications,
  getRecentNotifications,
  markAsRead,
  markAllAsRead,
};
