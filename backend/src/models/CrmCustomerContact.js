'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CrmCustomerContact = sequelize.define('CrmCustomerContact', {
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
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Job title or role',
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    is_primary: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  }, {
    tableName: 'crm_customer_contacts',
    indexes: [
      { fields: ['tenant_id', 'customer_id'], name: 'idx_customer_contacts_tenant_cust' },
    ],
  });

  return CrmCustomerContact;
};
