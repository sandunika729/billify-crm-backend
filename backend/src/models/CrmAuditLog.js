'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CrmAuditLog = sequelize.define('CrmAuditLog', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenant_id: {
      type: DataTypes.UUID, allowNull: false },
    user_id: {
      type: DataTypes.UUID, allowNull: true, references: { model: 'users', key: 'id' } },
    action: { type: DataTypes.STRING(50), allowNull: false, comment: 'create, update, delete, archive, status_change, assign, login, export' },
    entity_type: { type: DataTypes.STRING(50), allowNull: false },
    entity_id: { type: DataTypes.STRING(255), allowNull: true },
    before_json: { type: DataTypes.JSON, allowNull: true },
    after_json: { type: DataTypes.JSON, allowNull: true },
    ip_address: { type: DataTypes.STRING(45), allowNull: true },
    user_agent: { type: DataTypes.STRING(500), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
  }, {
    tableName: 'crm_audit_logs',
    updatedAt: false,
    paranoid: false,
    indexes: [
      { fields: ['tenant_id', 'entity_type', 'entity_id'], name: 'idx_audit_entity' },
      { fields: ['tenant_id', 'user_id'], name: 'idx_audit_user' },
      { fields: ['tenant_id', 'created_at'], name: 'idx_audit_date' },
    ],
  });
  return CrmAuditLog;
};
