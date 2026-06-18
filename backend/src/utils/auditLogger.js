'use strict';

const { CrmAuditLog } = require('../models');

const logAudit = async ({
  tenantId,
  userId,
  action,
  entityType,
  entityId,
  before = null,
  after = null,
  ipAddress = null,
  userAgent = null,
  description = null,
}) => {
  try {
    await CrmAuditLog.create({
      tenant_id: tenantId,
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      before_json: before,
      after_json: after,
      ip_address: ipAddress,
      user_agent: userAgent,
      description,
    });
  } catch (error) {
    
    console.error('Audit log error:', error.message);
  }
};

const getAuditContext = (req) => ({
  tenantId: req.user?.tenantId || req.tenantId,
  userId: req.user?.id,
  ipAddress: req.ip || req.connection?.remoteAddress,
  userAgent: req.get('User-Agent'),
});

module.exports = { logAudit, getAuditContext };
