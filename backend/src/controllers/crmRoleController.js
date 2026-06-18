'use strict';

const crmRoleService = require('../services/crmRoleService');
const { sendSuccess, sendError } = require('../utils/response');
const { logAudit, getAuditContext } = require('../utils/auditLogger');

const roleController = {
  async getRoles(req, res) {
    try {
      const formattedRoles = await crmRoleService.getRoles(req.user.tenantId);
      return sendSuccess(res, formattedRoles, 'Roles retrieved successfully');
    } catch (error) {
      console.error('Error fetching roles:', error);
      return sendError(res, error.message || 'Failed to fetch roles', 500);
    }
  },

  async getPermissions(req, res) {
    try {
      const permissions = await crmRoleService.getPermissions();
      return sendSuccess(res, permissions, 'Permissions retrieved');
    } catch (error) {
      console.error('Error fetching permissions:', error);
      return sendError(res, error.message || 'Failed to fetch permissions', 500);
    }
  },

  async updateRole(req, res) {
    try {
      const { name, description, permission_ids } = req.body;
      const role = await crmRoleService.updateRole({
        roleId: req.params.id,
        tenantId: req.user.tenantId,
        name,
        description,
        permission_ids
      });

      await logAudit({
        ...getAuditContext(req),
        action: 'update',
        entityType: 'role',
        entityId: req.params.id,
        description: `Role "${name || role.name}" updated with ${permission_ids ? permission_ids.length : 0} permissions.`
      });

      return sendSuccess(res, role, 'Role updated successfully');
    } catch (error) {
      console.error('Error updating role:', error);
      const statusCode = error.message.includes('not found') ? 404 : error.message.includes('cannot be modified') ? 403 : 500;
      return sendError(res, error.message || 'Failed to update role', statusCode);
    }
  }
};

module.exports = roleController;
