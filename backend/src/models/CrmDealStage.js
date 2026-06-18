'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CrmDealStage = sequelize.define('CrmDealStage', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    tenant_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'businesses', key: 'id' },
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    sort_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    probability_default: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Default win probability percentage (0-100)',
    },
    is_won_stage: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    is_lost_stage: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    color: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: '#3B82F6',
    },
  }, {
    tableName: 'crm_deal_stages',
    paranoid: false,
    indexes: [
      { fields: ['tenant_id', 'sort_order'], name: 'idx_deal_stages_order' },
    ],
  });

  return CrmDealStage;
};
