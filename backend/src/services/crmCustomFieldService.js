'use strict';

const { CrmCustomField } = require('../models');

const crmCustomFieldService = {
  async getFieldDefinitions(tenantId, entityType) {
    const whereClause = { tenant_id: tenantId };
    if (entityType) {
      whereClause.entity_type = entityType;
    }

    return await CrmCustomField.findAll({
      where: whereClause,
      order: [
        ['entity_type', 'ASC'],
        ['sort_order', 'ASC'],
        ['created_at', 'ASC']
      ]
    });
  },

  async createFieldDefinition(tenantId, data) {
    const { entity_type, field_name, field_label, field_type, options, is_required, sort_order } = data;

    if (!entity_type || !field_name || !field_label || !field_type) {
      throw new Error('Entity type, field name, field label, and field type are required.');
    }

    
    const safeFieldName = field_name.toLowerCase().replace(/[^a-z0-9_]/g, '_');

    
    const existingField = await CrmCustomField.findOne({
      where: { tenant_id: tenantId, entity_type, field_name: safeFieldName },
      paranoid: false
    });

    if (existingField) {
      if (existingField.deletedAt || existingField.deleted_at) {
        await existingField.restore();
        existingField.field_label = field_label;
        existingField.field_type = field_type;
        existingField.options = options || [];
        existingField.is_required = is_required || false;
        existingField.sort_order = sort_order || 0;
        await existingField.save();
        return existingField;
      } else {
        throw new Error('A custom field with this name already exists.');
      }
    }

    return await CrmCustomField.create({
      tenant_id: tenantId,
      entity_type,
      field_name: safeFieldName,
      field_label,
      field_type,
      options: options || [],
      is_required: is_required || false,
      sort_order: sort_order || 0
    });
  },

  async updateFieldDefinition(id, tenantId, data) {
    const field = await CrmCustomField.findOne({
      where: { id, tenant_id: tenantId }
    });

    if (!field) throw new Error('Custom field definition not found.');

    const { field_label, field_type, options, is_required, sort_order } = data;

    if (field_label !== undefined) field.field_label = field_label;
    if (field_type !== undefined) field.field_type = field_type;
    if (options !== undefined) field.options = options;
    if (is_required !== undefined) field.is_required = is_required;
    if (sort_order !== undefined) field.sort_order = sort_order;

    await field.save();
    return field;
  },

  async deleteFieldDefinition(id, tenantId) {
    const field = await CrmCustomField.findOne({
      where: { id, tenant_id: tenantId }
    });

    if (!field) throw new Error('Custom field definition not found.');

    await field.destroy({ force: true });
    return true;
  }
};

module.exports = crmCustomFieldService;
