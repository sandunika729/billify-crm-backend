'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CrmTicketMessage = sequelize.define('CrmTicketMessage', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenant_id: {
      type: DataTypes.UUID, allowNull: false },
    ticket_id: {
      type: DataTypes.UUID, allowNull: false, references: { model: 'crm_tickets', key: 'id' } },
    sender_user_id: {
      type: DataTypes.UUID, allowNull: true, references: { model: 'users', key: 'id' } },
    sender_name: {
      type: DataTypes.STRING(255), allowNull: true }, 
    message: { type: DataTypes.TEXT, allowNull: false },
    is_internal: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    is_internal_note: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    attachment_id: {
      type: DataTypes.UUID, allowNull: true, references: { model: 'crm_documents', key: 'id' } },
  }, {
    tableName: 'crm_ticket_messages',
    paranoid: false,
    indexes: [{ fields: ['tenant_id', 'ticket_id'], name: 'idx_ticket_messages_ticket' }],
  });
  return CrmTicketMessage;
};
