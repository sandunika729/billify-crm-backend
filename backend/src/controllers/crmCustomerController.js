'use strict';

const crmCustomerService = require('../services/crmCustomerService');
const { sendSuccess, sendError, sendPaginated, getPagination, getPaginationMeta } = require('../utils/response');
const { logAudit, getAuditContext } = require('../utils/auditLogger');
const fs = require('fs');
const csv = require('csv-parser');

const crmCustomerController = {
  async getAllCustomers(req, res) {
    try {
      const { page, limit, offset } = getPagination(req.query);
      const { search, type, status } = req.query;

      const { count, rows } = await crmCustomerService.getAllCustomers({
        tenantId: req.tenantId,
        limit,
        offset,
        search,
        type,
        status
      });

      const paginationMeta = getPaginationMeta(count, page, limit);
      return sendPaginated(res, rows, paginationMeta, 'Customers retrieved successfully.');
    } catch (error) {
      console.error('Error fetching customers:', error);
      return sendError(res, error.message || 'Failed to fetch customers.', 500);
    }
  },

  async getCustomerById(req, res) {
    try {
      const customer = await crmCustomerService.getCustomerById(req.params.id, req.tenantId);
      return sendSuccess(res, customer, 'Customer retrieved successfully.');
    } catch (error) {
      console.error('Error fetching customer:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      return sendError(res, error.message || 'Failed to fetch customer.', statusCode);
    }
  },

  async getPosCustomers(req, res) {
    try {
      const posIntegrationService = require('../services/posIntegrationService');
      const customers = await posIntegrationService.getPosCustomers(req.tenantId);
      return sendSuccess(res, customers, 'POS customers retrieved successfully.');
    } catch (error) {
      console.error('Error fetching POS customers:', error);
      return sendError(res, error.message || 'Failed to fetch POS customers.', 500);
    }
  },

  async createCustomer(req, res) {
    try {
      const newCustomer = await crmCustomerService.createCustomer({
        tenantId: req.tenantId,
        data: req.body,
        userId: req.user.id
      });

      await logAudit({
        ...getAuditContext(req),
        action: 'create',
        entityType: 'customer',
        entityId: newCustomer.id,
        after: newCustomer.toJSON(),
        description: `Customer ${newCustomer.name} created.`
      });

      return sendSuccess(res, newCustomer, 'Customer created successfully.', 201);
    } catch (error) {
      console.error('Error creating customer:', error);
      const statusCode = error.message.includes('already exists') || error.message.includes('required') ? 400 : 500;
      return sendError(res, error.message || 'Failed to create customer.', statusCode);
    }
  },

  async updateCustomer(req, res) {
    try {
      const { customer, beforeData } = await crmCustomerService.updateCustomer(
        req.params.id,
        req.tenantId,
        req.body,
        req.user.id
      );

      await logAudit({
        ...getAuditContext(req),
        action: 'update',
        entityType: 'customer',
        entityId: customer.id,
        before: beforeData,
        after: customer.toJSON(),
        description: `Customer ${customer.name} updated.`
      });

      return sendSuccess(res, customer, 'Customer updated successfully.');
    } catch (error) {
      console.error('Error updating customer:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      return sendError(res, error.message || 'Failed to update customer.', statusCode);
    }
  },

  async deleteCustomer(req, res) {
    try {
      const customer = await crmCustomerService.deleteCustomer(req.params.id, req.tenantId);

      await logAudit({
        ...getAuditContext(req),
        action: 'archive',
        entityType: 'customer',
        entityId: customer.id,
        description: `Customer ${customer.name} archived.`
      });

      return sendSuccess(res, null, 'Customer archived successfully.');
    } catch (error) {
      console.error('Error deleting customer:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      return sendError(res, error.message || 'Failed to archive customer.', statusCode);
    }
  },

  async getCustomerTimeline(req, res) {
    try {
      const logs = await crmCustomerService.getCustomerTimeline(req.params.id, req.tenantId);
      return sendSuccess(res, logs, 'Customer timeline retrieved successfully.');
    } catch (error) {
      console.error('Error fetching timeline:', error);
      return sendError(res, error.message || 'Failed to fetch timeline.', 500);
    }
  },

  async getCustomerTransactions(req, res) {
    try {
      const transactions = await crmCustomerService.getCustomerTransactions(req.params.id, req.tenantId);
      return sendSuccess(res, transactions, 'Customer transactions retrieved successfully.');
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return sendError(res, error.message || 'Failed to fetch transactions.', 500);
    }
  },

  async getCustomerDocuments(req, res) {
    try {
      const documents = await crmCustomerService.getCustomerDocuments(req.params.id, req.tenantId);
      return sendSuccess(res, documents, 'Customer documents retrieved successfully.');
    } catch (error) {
      console.error('Error fetching documents:', error);
      return sendError(res, error.message || 'Failed to fetch documents.', 500);
    }
  },

  async addCustomerContact(req, res) {
    try {
      const contact = await crmCustomerService.addCustomerContact(req.params.id, req.tenantId, req.body);
      
      await logAudit({
        ...getAuditContext(req),
        action: 'update',
        entityType: 'customer',
        entityId: req.params.id,
        description: `Added new contact: ${contact.name}`
      });

      return sendSuccess(res, contact, 'Contact added successfully.');
    } catch (error) {
      console.error('Error adding contact:', error);
      return sendError(res, error.message || 'Failed to add contact.', 500);
    }
  },

  async addCustomerAddress(req, res) {
    try {
      const address = await crmCustomerService.addCustomerAddress(req.params.id, req.tenantId, req.body);
      
      await logAudit({
        ...getAuditContext(req),
        action: 'update',
        entityType: 'customer',
        entityId: req.params.id,
        description: `Added new address: ${address.type}`
      });

      return sendSuccess(res, address, 'Address added successfully.');
    } catch (error) {
      console.error('Error adding address:', error);
      return sendError(res, error.message || 'Failed to add address.', 500);
    }
  },

  async uploadDocument(req, res) {
    try {
      if (!req.file) {
        return sendError(res, 'No file uploaded.', 400);
      }

      const document = await crmCustomerService.uploadCustomerDocument(
        req.params.id, 
        req.tenantId, 
        req.file, 
        req.user.id
      );
      
      await logAudit({
        ...getAuditContext(req),
        action: 'create',
        entityType: 'document',
        entityId: document.id,
        description: `Uploaded document: ${document.original_name} for customer`
      });

      return sendSuccess(res, document, 'Document uploaded successfully.', 201);
    } catch (error) {
      console.error('Error uploading document:', error);
      return sendError(res, error.message || 'Failed to upload document.', 500);
    }
  },

  async importCustomers(req, res) {
    try {
      if (!req.file) {
        return sendError(res, 'No CSV file uploaded.', 400);
      }

      const results = [];
      const errors = [];
      let imported = 0;
      let skipped = 0;

      const { CrmCustomer } = require('../models');

      
      const existingCustomers = await CrmCustomer.findAll({
        where: { tenant_id: req.tenantId },
        attributes: ['email', 'phone']
      });
      const existingEmails = new Set(existingCustomers.map(c => c.email).filter(Boolean));
      const existingPhones = new Set(existingCustomers.map(c => c.phone).filter(Boolean));

      
      await new Promise((resolve, reject) => {
        fs.createReadStream(req.file.path)
          .pipe(csv())
          .on('data', (data) => results.push(data))
          .on('end', resolve)
          .on('error', reject);
      });

      
      fs.unlinkSync(req.file.path);

      if (results.length === 0) {
        return sendError(res, 'The uploaded CSV file is empty.', 400);
      }

      const customersToCreate = [];

      for (let i = 0; i < results.length; i++) {
        const row = results[i];
        const rowNum = i + 2; 

        
        if (!row.name) {
          errors.push(`Row ${rowNum}: 'name' is required.`);
          skipped++;
          continue;
        }

        const email = row.email ? row.email.trim() : null;
        const phone = row.phone ? row.phone.trim() : null;

        if (email && existingEmails.has(email)) {
          errors.push(`Row ${rowNum}: Email '${email}' already exists.`);
          skipped++;
          continue;
        }

        if (phone && existingPhones.has(phone)) {
          errors.push(`Row ${rowNum}: Phone '${phone}' already exists.`);
          skipped++;
          continue;
        }

        let type = 'individual';
        if (row.type && ['individual', 'retail', 'company', 'supplier', 'lead_only'].includes(row.type.toLowerCase())) {
          type = row.type.toLowerCase();
        }

        let tagsJson = [];
        if (row.tags) {
          tagsJson = row.tags.split(',').map(t => t.trim()).filter(Boolean);
        }

        customersToCreate.push({
          tenant_id: req.tenantId,
          name: row.name.trim(),
          email: email,
          phone: phone,
          company_name: row.company_name ? row.company_name.trim() : null,
          type: type,
          tags_json: tagsJson,
          source: row.source ? row.source.trim() : 'CSV Import',
          status: 'active',
          created_by: req.user.id
        });

        
        if (email) existingEmails.add(email);
        if (phone) existingPhones.add(phone);
      }

      if (customersToCreate.length > 0) {
        await CrmCustomer.bulkCreate(customersToCreate);
        imported = customersToCreate.length;

        await logAudit({
          ...getAuditContext(req),
          action: 'create',
          entityType: 'customer',
          entityId: 'bulk-import',
          description: `Bulk imported ${imported} customers via CSV.`
        });
      }

      return sendSuccess(res, { imported, skipped, errors }, `Import complete: ${imported} imported, ${skipped} skipped.`);
    } catch (error) {
      console.error('Error importing customers:', error);
      return sendError(res, error.message || 'Failed to import customers.', 500);
    }
  }
};

module.exports = crmCustomerController;
