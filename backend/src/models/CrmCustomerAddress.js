'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CrmCustomerAddress = sequelize.define('CrmCustomerAddress', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    tenant_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    customer_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'crm_customers', key: 'id' },
    },
    type: {
      type: DataTypes.ENUM('billing', 'shipping', 'office', 'home', 'other'),
      allowNull: false,
      defaultValue: 'office',
    },
    line1: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    line2: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    district: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    postal_code: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'Sri Lanka',
    },
  }, {
    tableName: 'crm_customer_addresses',
    indexes: [
      { fields: ['tenant_id', 'customer_id'], name: 'idx_customer_addresses_tenant_cust' },
    ],
  });

  return CrmCustomerAddress;
};
