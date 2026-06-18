'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PosCustomer = sequelize.define('PosCustomer', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
    },
    business_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    name: DataTypes.STRING(255),
    phone: DataTypes.STRING(255),
    customer_type: DataTypes.STRING(255),
    status: DataTypes.STRING(255),
    available_credit: DataTypes.FLOAT,
    current_balance: DataTypes.FLOAT,
    payment_terms: DataTypes.STRING(255),
    alert_limit: DataTypes.FLOAT,
    nic: DataTypes.STRING(255),
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
  }, {
    tableName: 'customers',
    timestamps: false,
    paranoid: false,
  });

  return PosCustomer;
};
