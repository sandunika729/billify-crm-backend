'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CrmDocument = sequelize.define('CrmDocument', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenant_id: {
      type: DataTypes.UUID, allowNull: false },
    related_type: { type: DataTypes.ENUM('customer', 'lead', 'deal', 'quote', 'ticket', 'admin', 'general'), allowNull: false, defaultValue: 'general' },
    related_id: { type: DataTypes.STRING(36), allowNull: true },
    file_name: { type: DataTypes.STRING(255), allowNull: false },
    original_name: { type: DataTypes.STRING(255), allowNull: false },
    file_path: { type: DataTypes.STRING(500), allowNull: false },
    mime_type: { type: DataTypes.STRING(100), allowNull: true },
    size: { type: DataTypes.INTEGER, allowNull: true, comment: 'File size in bytes' },
    category: { type: DataTypes.STRING(100), allowNull: true },
    visibility: { type: DataTypes.ENUM('public', 'private', 'internal'), allowNull: false, defaultValue: 'internal' },
    uploaded_by: {
      type: DataTypes.UUID, allowNull: true, references: { model: 'users', key: 'id' } },
  }, {
    tableName: 'crm_documents',
    indexes: [
      { fields: ['tenant_id', 'related_type', 'related_id'], name: 'idx_documents_related' },
    ],
  });
  return CrmDocument;
};
