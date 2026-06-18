'use strict';

const { Op } = require('sequelize');
const { 
  CrmCustomer, 
  CrmCustomerContact, 
  CrmCustomerAddress,
  CrmAuditLog,
  CrmDocument,
  CrmDeal,
  CrmTicket,
  CrmQuote,
  Bill,
  CustomerLedger
} = require('../models');

const crmCustomerService = {
  async getAllCustomers({ tenantId, limit, offset, search, type, status }) {
    const whereClause = { tenant_id: tenantId };
    
    if (type) whereClause.type = type;
    if (status) whereClause.status = status;
    
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { company_name: { [Op.like]: `%${search}%` } },
        { customer_code: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await CrmCustomer.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      attributes: ['id', 'customer_code', 'name', 'company_name', 'email', 'phone', 'type', 'status', 'tags_json', 'custom_fields', 'created_at']
    });

    return { count, rows };
  },

  async getCustomerById(customerId, tenantId) {
    const customer = await CrmCustomer.findOne({
      where: { id: customerId, tenant_id: tenantId },
      include: [
        { model: CrmCustomerContact, as: 'contacts' },
        { model: CrmCustomerAddress, as: 'addresses' },
        { model: CrmDeal, as: 'deals' },
        { model: CrmTicket, as: 'tickets' },
        { model: CrmQuote, as: 'quotes' }
      ]
    });

    if (!customer) {
      throw new Error('Customer not found.');
    }

    return customer;
  },

  async createCustomer({ tenantId, data, userId }) {
    const { 
      type, name, company_name, email, phone, secondary_phone, 
      website, source, tags_json, notes, billify_customer_id, custom_fields 
    } = data;

    if (!name) {
      throw new Error('Customer name is required.');
    }

    if (email || phone || company_name) {
      const duplicateConditions = [];
      if (email) duplicateConditions.push({ email });
      if (phone) duplicateConditions.push({ phone });
      if (company_name) duplicateConditions.push({ company_name });
      
      const existingCustomer = await CrmCustomer.findOne({
        where: {
          tenant_id: tenantId,
          [Op.or]: duplicateConditions
        }
      });
      
      if (existingCustomer) {
        throw new Error('A customer with this email, phone, or company name already exists.');
      }
    }

    const count = await CrmCustomer.count({ where: { tenant_id: tenantId }, paranoid: false });
    const customer_code = `CUST-${String(count + 1).padStart(4, '0')}`;

    const newCustomer = await CrmCustomer.create({
      tenant_id: tenantId,
      customer_code,
      type: type || 'individual',
      name,
      company_name,
      email,
      phone,
      secondary_phone,
      website,
      source: source || 'other',
      status: 'active',
      tags_json: tags_json || [],
      notes,
      billify_customer_id,
      custom_fields: custom_fields || {},
      created_by: userId
    });

    return newCustomer;
  },

  async updateCustomer(customerId, tenantId, updateData, userId) {
    const customer = await CrmCustomer.findOne({
      where: { id: customerId, tenant_id: tenantId }
    });

    if (!customer) {
      throw new Error('Customer not found.');
    }

    delete updateData.id;
    delete updateData.tenant_id;
    delete updateData.customer_code;
    
    updateData.updated_by = userId;

    const beforeData = customer.toJSON();
    await customer.update(updateData);

    return { customer, beforeData };
  },

  async deleteCustomer(customerId, tenantId) {
    const customer = await CrmCustomer.findOne({
      where: { id: customerId, tenant_id: tenantId }
    });

    if (!customer) {
      throw new Error('Customer not found.');
    }

    await customer.destroy();
    return customer;
  },

  async getCustomerTimeline(customerId, tenantId) {
    const logs = await CrmAuditLog.findAll({
      where: { tenant_id: tenantId, entity_type: 'customer', entity_id: customerId },
      order: [['created_at', 'DESC']],
      limit: 20
    });
    return logs;
  },

  async getCustomerTransactions(customerId, tenantId) {
    
    const customer = await CrmCustomer.findOne({
      where: { id: customerId, tenant_id: tenantId },
      attributes: ['id', 'billify_customer_id', 'name']
    });

    if (!customer || !customer.billify_customer_id) {
      return { bills: [], ledger: [] };
    }

    const posCustomerId = customer.billify_customer_id;

    
    const [bills, ledger] = await Promise.all([
      Bill.findAll({
        where: { customer_id: posCustomerId },
        order: [['bill_date', 'DESC']],
        limit: 50,
        raw: true
      }),
      CustomerLedger.findAll({
        where: { customer_id: posCustomerId },
        order: [['transaction_date', 'DESC']],
        limit: 50,
        raw: true
      })
    ]);

    return { bills, ledger };
  },

  async getCustomerDocuments(customerId, tenantId) {
    const documents = await CrmDocument.findAll({
      where: { tenant_id: tenantId, related_type: 'customer', related_id: customerId }
    });
    return documents;
  },

  async addCustomerContact(customerId, tenantId, contactData) {
    const customer = await CrmCustomer.findOne({ where: { id: customerId, tenant_id: tenantId } });
    if (!customer) throw new Error('Customer not found.');

    const contact = await CrmCustomerContact.create({
      tenant_id: tenantId,
      customer_id: customerId,
      name: contactData.name,
      role: contactData.role,
      email: contactData.email,
      phone: contactData.phone,
      is_primary: contactData.is_primary || false
    });
    return contact;
  },

  async addCustomerAddress(customerId, tenantId, addressData) {
    const customer = await CrmCustomer.findOne({ where: { id: customerId, tenant_id: tenantId } });
    if (!customer) throw new Error('Customer not found.');

    const address = await CrmCustomerAddress.create({
      tenant_id: tenantId,
      customer_id: customerId,
      type: addressData.type || 'billing',
      line1: addressData.line1,
      line2: addressData.line2,
      city: addressData.city,
      district: addressData.district,
      postal_code: addressData.postal_code,
      country: addressData.country
    });
    return address;
  },

  async uploadCustomerDocument(customerId, tenantId, file, userId) {
    const customer = await CrmCustomer.findOne({ where: { id: customerId, tenant_id: tenantId } });
    if (!customer) throw new Error('Customer not found.');

    const document = await CrmDocument.create({
      tenant_id: tenantId,
      related_type: 'customer',
      related_id: customerId,
      file_name: file.filename,
      original_name: file.originalname,
      file_path: file.path,
      mime_type: file.mimetype,
      size: file.size,
      category: 'general',
      visibility: 'internal',
      uploaded_by: userId
    });
    return document;
  }
};

module.exports = crmCustomerService;
