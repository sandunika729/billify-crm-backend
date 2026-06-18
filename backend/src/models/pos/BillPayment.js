'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const BillPayment = sequelize.define('BillPayment', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
    },
    business_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    bill_id: DataTypes.UUID,
    method: DataTypes.STRING,
    amount: DataTypes.FLOAT,
    reference: DataTypes.STRING,
    bank: DataTypes.STRING,
    branch: DataTypes.STRING,
    cheque_date: DataTypes.DATE,
    customer_id: DataTypes.UUID,
    customer_name: DataTypes.STRING,
    note: DataTypes.TEXT,
  }, {
    tableName: 'bill_payments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: false,
  });

  return BillPayment;
};
