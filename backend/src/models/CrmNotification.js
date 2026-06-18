'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CrmNotification = sequelize.define('CrmNotification', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenant_id: {
      type: DataTypes.UUID, allowNull: false },
    user_id: {
      type: DataTypes.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
    title: { type: DataTypes.STRING(255), allowNull: false },
    body: { type: DataTypes.TEXT, allowNull: true },
    link: { type: DataTypes.STRING(500), allowNull: true },
    type: { type: DataTypes.ENUM('info', 'success', 'warning', 'error', 'assignment'), allowNull: false, defaultValue: 'info' },
    read_at: { type: DataTypes.DATE, allowNull: true },
  }, {
    tableName: 'crm_notifications',
    paranoid: false,
    indexes: [
      { fields: ['tenant_id', 'user_id', 'read_at'], name: 'idx_notifications_user_read' },
    ],
  });
  return CrmNotification;
};
