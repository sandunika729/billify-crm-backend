'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Bill = sequelize.define('Bill', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
    },
    business_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    bill_number: DataTypes.STRING,
    transaction_type: DataTypes.STRING,
    sale_type: DataTypes.STRING,
    status: DataTypes.STRING,
    customer_id: DataTypes.UUID,
    customer_name: DataTypes.STRING,
    customer_mobile: DataTypes.STRING,
    cashier_id: DataTypes.UUID,
    cashier_name: DataTypes.STRING,
    terminal: DataTypes.STRING,
    subtotal: DataTypes.FLOAT,
    discount_percent: DataTypes.FLOAT,
    discount_amount: DataTypes.FLOAT,
    tax_amount: DataTypes.FLOAT,
    total: DataTypes.FLOAT,
    paid_amount: DataTypes.FLOAT,
    amount_tendered: DataTypes.FLOAT,
    change_amount: DataTypes.FLOAT,
    payment_method: DataTypes.STRING,
    notes: DataTypes.TEXT,
    bill_date: DataTypes.DATE,
    advance_order_id: DataTypes.UUID,
    client_bill_id: DataTypes.STRING,
  }, {
    tableName: 'bills',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: false,
  });

  return Bill;
};
