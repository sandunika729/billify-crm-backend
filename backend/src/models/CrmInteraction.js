'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CrmInteraction = sequelize.define('CrmInteraction', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenant_id: {
      type: DataTypes.UUID, allowNull: false },
    customer_id: {
      type: DataTypes.UUID, allowNull: false, references: { model: 'crm_customers', key: 'id' } },
    related_type: { type: DataTypes.ENUM('lead', 'deal', 'quote', 'ticket', 'general'), allowNull: true },
    related_id: {
      type: DataTypes.UUID, allowNull: true },
    channel: { type: DataTypes.ENUM('call', 'email', 'whatsapp', 'meeting', 'sms', 'note', 'other'), allowNull: false },
    direction: { type: DataTypes.ENUM('inbound', 'outbound', 'internal'), allowNull: false, defaultValue: 'outbound' },
    summary: { type: DataTypes.TEXT, allowNull: false },
    interaction_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    attachment_url: { type: DataTypes.STRING(1000), allowNull: true },
    attachment_name: { type: DataTypes.STRING(255), allowNull: true },
    created_by: {
      type: DataTypes.UUID, allowNull: true, references: { model: 'users', key: 'id' } },
  }, {
    tableName: 'crm_interactions',
    indexes: [
      { fields: ['tenant_id', 'customer_id'], name: 'idx_interactions_customer' },
    ],
  });
  return CrmInteraction;
};
