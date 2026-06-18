'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CrmDealAutomationRule = sequelize.define('CrmDealAutomationRule', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenant_id: {
      type: DataTypes.UUID, allowNull: false },
    stage_id: { type: DataTypes.UUID, allowNull: false },
    action_type: { type: DataTypes.ENUM('create_task', 'send_email', 'notify_owner'), allowNull: false },
    action_config: { type: DataTypes.JSON, allowNull: true },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  }, {
    tableName: 'crm_deal_automation_rules',
    indexes: [
      { fields: ['tenant_id', 'stage_id'], name: 'idx_automation_rules_stage' },
    ],
  });
  return CrmDealAutomationRule;
};
