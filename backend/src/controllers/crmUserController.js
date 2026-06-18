'use strict';

const crmUserService = require('../services/crmUserService');
const { sendSuccess, sendError, getPagination, getPaginationMeta } = require('../utils/response');
const { logAudit, getAuditContext } = require('../utils/auditLogger');

const crmUserController = {
  
  async getAllUsers(req, res) {
    try {
      const users = await crmUserService.getAllUsers(req.tenantId);
      return sendSuccess(res, users, 'Users retrieved successfully.');
    } catch (error) {
      console.error('Error fetching users:', error);
      return sendError(res, error.message || 'Failed to fetch users.', 500);
    }
  },

  
  async createUser(req, res) {
    try {
      const newUser = await crmUserService.createUser({
        tenantId: req.tenantId,
        data: req.body,
        createdBy: req.user.id,
      });

      await logAudit({
        ...getAuditContext(req),
        action: 'create',
        entityType: 'user',
        entityId: newUser.id,
        after: { email: newUser.email, role: newUser.role },
        description: `New user created: ${newUser.email} (${newUser.role_label})`,
      });

      return sendSuccess(res, newUser, 'User created successfully.', 201);
    } catch (error) {
      console.error('Error creating user:', error);
      const statusCode =
        error.message.includes('already exists') ? 409 :
        error.message.includes('required') || error.message.includes('Invalid') ? 400 : 500;
      return sendError(res, error.message || 'Failed to create user.', statusCode);
    }
  },

  
  async updateUser(req, res) {
    try {
      const { user: updatedUser, before } = await crmUserService.updateUser(
        req.params.id,
        req.tenantId,
        req.body
      );

      await logAudit({
        ...getAuditContext(req),
        action: 'update',
        entityType: 'user',
        entityId: req.params.id,
        before,
        after: { first_name: updatedUser.first_name, last_name: updatedUser.last_name, role: updatedUser.role, phone: updatedUser.phone },
        description: `User ${updatedUser.email} updated (role: ${updatedUser.role_label})`,
      });

      return sendSuccess(res, updatedUser, 'User updated successfully.');
    } catch (error) {
      console.error('Error updating user:', error);
      const statusCode = error.message.includes('not found') ? 404 :
        error.message.includes('Invalid') ? 400 : 500;
      return sendError(res, error.message || 'Failed to update user.', statusCode);
    }
  },

  
  async deactivateUser(req, res) {
    try {
      const result = await crmUserService.deactivateUser(
        req.params.id,
        req.tenantId,
        req.user.id
      );

      await logAudit({
        ...getAuditContext(req),
        action: 'deactivate',
        entityType: 'user',
        entityId: req.params.id,
        description: `User ${result.email} deactivated.`,
      });

      return sendSuccess(res, result, 'User deactivated successfully.');
    } catch (error) {
      console.error('Error deactivating user:', error);
      const statusCode = error.message.includes('not found') ? 404 :
        error.message.includes('cannot') ? 403 : 500;
      return sendError(res, error.message || 'Failed to deactivate user.', statusCode);
    }
  },

  
  async reactivateUser(req, res) {
    try {
      const result = await crmUserService.reactivateUser(req.params.id, req.tenantId);

      await logAudit({
        ...getAuditContext(req),
        action: 'reactivate',
        entityType: 'user',
        entityId: req.params.id,
        description: `User ${result.email} reactivated.`,
      });

      return sendSuccess(res, result, 'User reactivated successfully.');
    } catch (error) {
      console.error('Error reactivating user:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      return sendError(res, error.message || 'Failed to reactivate user.', statusCode);
    }
  },

  
  async resetPassword(req, res) {
    try {
      const { new_password } = req.body;

      if (!new_password) {
        return sendError(res, 'new_password is required.', 400);
      }

      const result = await crmUserService.resetPassword(
        req.params.id,
        req.tenantId,
        new_password,
        req.user.id
      );

      await logAudit({
        ...getAuditContext(req),
        action: 'reset_password',
        entityType: 'user',
        entityId: req.params.id,
        description: `Password reset for user ${result.email} by ${req.user.email}.`,
      });

      return sendSuccess(res, { id: result.id }, 'Password reset successfully.');
    } catch (error) {
      console.error('Error resetting password:', error);
      const statusCode = error.message.includes('not found') ? 404 :
        error.message.includes('characters') || error.message.includes('required') ? 400 :
        error.message.includes('Only a Super') ? 403 : 500;
      return sendError(res, error.message || 'Failed to reset password.', statusCode);
    }
  },
};

module.exports = crmUserController;
