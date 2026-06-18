'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const BillItem = sequelize.define('BillItem', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
    },
    business_id: DataTypes.UUID,
    bill_id: DataTypes.UUID,
    product_id: DataTypes.UUID,
    sku: DataTypes.STRING,
    item_code: DataTypes.STRING,
    name: DataTypes.STRING,
    unit_price: DataTypes.FLOAT,
    original_price: DataTypes.FLOAT,
    retail_price: DataTypes.FLOAT,
    wholesale_price: DataTypes.FLOAT,
    quantity: DataTypes.FLOAT,
    discount_amount: DataTypes.FLOAT,
    line_total: DataTypes.FLOAT,
    is_free: DataTypes.BOOLEAN,
    is_return: DataTypes.BOOLEAN,
    return_from_bill_id: DataTypes.UUID,
    tax_amount: DataTypes.FLOAT,
    tax_rate: DataTypes.FLOAT,
    unit: DataTypes.STRING,
  }, {
    tableName: 'bill_items',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: false,
  });

  return BillItem;
};
