'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CrmShopProfile = sequelize.define('CrmShopProfile', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    tenant_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    shop_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    
    logo_base64: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
    },
    
    public_api_key: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },
  }, {
    tableName: 'crm_shop_profiles',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: false,
  });

  return CrmShopProfile;
};
