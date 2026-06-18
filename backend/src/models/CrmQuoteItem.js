'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CrmQuoteItem = sequelize.define('CrmQuoteItem', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenant_id: {
      type: DataTypes.UUID, allowNull: false },
    quote_id: {
      type: DataTypes.UUID, allowNull: false, references: { model: 'crm_quotes', key: 'id' } },
    product_id: {
      type: DataTypes.UUID, allowNull: true },
    item_name: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    qty: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 1 },
    unit_price_lkr: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0.00 },
    discount_lkr: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0.00 },
    tax_lkr: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0.00 },
    line_total_lkr: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0.00 },
    sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  }, {
    tableName: 'crm_quote_items',
    paranoid: false,
    indexes: [{ fields: ['tenant_id', 'quote_id'], name: 'idx_quote_items_quote' }],
  });
  return CrmQuoteItem;
};
