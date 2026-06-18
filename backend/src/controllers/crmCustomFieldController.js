'use strict';

const crmCustomFieldService = require('../services/crmCustomFieldService');
const { sendSuccess, sendError } = require('../utils/response');

const crmCustomFieldController = {
  async getFields(req, res) {
    try {
      const { entity_type } = req.query;
      const fields = await crmCustomFieldService.getFieldDefinitions(req.tenantId, entity_type);
      return sendSuccess(res, fields, 'Custom fields retrieved successfully.');
    } catch (error) {
      console.error('Error fetching custom fields:', error);
      return sendError(res, error.message || 'Failed to fetch custom fields.', 500);
    }
  },

  async createField(req, res) {
    try {
      const field = await crmCustomFieldService.createFieldDefinition(req.tenantId, req.body);
      return sendSuccess(res, field, 'Custom field created successfully.', 201);
    } catch (error) {
      console.error('Error creating custom field:', error);
      const statusCode = error.message.includes('required') ? 400 : 500;
      return sendError(res, error.message || 'Failed to create custom field.', statusCode);
    }
  },

  async updateField(req, res) {
    try {
      const { id } = req.params;
      const field = await crmCustomFieldService.updateFieldDefinition(id, req.tenantId, req.body);
      return sendSuccess(res, field, 'Custom field updated successfully.');
    } catch (error) {
      console.error('Error updating custom field:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      return sendError(res, error.message || 'Failed to update custom field.', statusCode);
    }
  },

  async deleteField(req, res) {
    try {
      const { id } = req.params;
      await crmCustomFieldService.deleteFieldDefinition(id, req.tenantId);
      return sendSuccess(res, null, 'Custom field deleted successfully.');
    } catch (error) {
      console.error('Error deleting custom field:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      return sendError(res, error.message || 'Failed to delete custom field.', statusCode);
    }
  }
};

module.exports = crmCustomFieldController;
