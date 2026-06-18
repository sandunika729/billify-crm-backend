'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CrmDealStageHistory = sequelize.define('CrmDealStageHistory', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    tenant_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    deal_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'crm_deals', key: 'id' },
    },
    from_stage_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'crm_deal_stages', key: 'id' },
    },
    to_stage_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'crm_deal_stages', key: 'id' },
    },
    changed_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    changed_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'crm_deal_stage_history',
    timestamps: false,
    paranoid: false,
    indexes: [
      { fields: ['tenant_id', 'deal_id'], name: 'idx_stage_history_deal' },
    ],
  });

  return CrmDealStageHistory;
};
