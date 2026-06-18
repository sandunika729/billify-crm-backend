'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CustomerLedger = sequelize.define('CustomerLedger', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
    },
    business_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    customer_id: DataTypes.UUID,
    transaction_type: DataTypes.STRING,
    debit_amount: DataTypes.FLOAT,
    credit_amount: DataTypes.FLOAT,
    running_balance: DataTypes.FLOAT,
    reference_id: DataTypes.STRING,
    reference_type: DataTypes.STRING,
    adjustment_reason: DataTypes.STRING,
    notes: DataTypes.TEXT,
    transaction_date: DataTypes.DATE,
  }, {
    tableName: 'customer_ledger',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: false,
  });

  return CustomerLedger;
};
