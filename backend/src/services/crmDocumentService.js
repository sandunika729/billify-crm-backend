'use strict';

const path = require('path');
const fs = require('fs');
const { CrmDocument, User } = require('../models');

const crmDocumentService = {
  async uploadDocument({ tenantId, fileData, body, userId }) {
    if (!fileData) {
      throw new Error('No file uploaded');
    }

    const { category, visibility, related_type, related_id } = body;

    const document = await CrmDocument.create({
      tenant_id: tenantId,
      related_type: related_type || 'general',
      related_id: related_id ? parseInt(related_id) : null,
      file_name: fileData.filename,
      original_name: fileData.originalname,
      file_path: fileData.path,
      mime_type: fileData.mimetype,
      size: fileData.size,
      category: category || 'internal',
      visibility: visibility || 'internal',
      uploaded_by: userId
    });

    const docWithUploader = await CrmDocument.findByPk(document.id, {
      include: [{ model: User, as: 'uploader', attributes: ['id', 'first_name', 'last_name'] }]
    });

    return docWithUploader;
  },

  async getDocuments({ tenantId, category, related_type, related_id }) {
    const whereClause = { tenant_id: tenantId };
    if (category) whereClause.category = category;
    if (related_type) whereClause.related_type = related_type;
    if (related_id) whereClause.related_id = related_id;

    const documents = await CrmDocument.findAll({
      where: whereClause,
      include: [{ model: User, as: 'uploader', attributes: ['id', 'first_name', 'last_name'] }],
      order: [['created_at', 'DESC']]
    });

    const docsJson = documents.map(d => d.toJSON());
    
    try {
      const { CrmCustomer, CrmDeal, CrmQuote, CrmLead, CrmSupportTicket } = require('../models');
      
      const quoteIds = docsJson.filter(d => d.related_type === 'quote' && d.related_id).map(d => d.related_id);
      const customerIds = docsJson.filter(d => d.related_type === 'customer' && d.related_id).map(d => d.related_id);
      const dealIds = docsJson.filter(d => d.related_type === 'deal' && d.related_id).map(d => d.related_id);
      const ticketIds = docsJson.filter(d => d.related_type === 'ticket' && d.related_id).map(d => d.related_id);
      const leadIds = docsJson.filter(d => d.related_type === 'lead' && d.related_id).map(d => d.related_id);

      const [quotes, customers, deals, tickets, leads] = await Promise.all([
        quoteIds.length ? CrmQuote.findAll({ where: { id: quoteIds }, attributes: ['id', 'quote_no'] }) : [],
        customerIds.length ? CrmCustomer.findAll({ where: { id: customerIds }, attributes: ['id', 'name'] }) : [],
        dealIds.length ? CrmDeal.findAll({ where: { id: dealIds }, attributes: ['id', 'title'] }) : [],
        ticketIds.length ? CrmSupportTicket.findAll({ where: { id: ticketIds }, attributes: ['id', 'ticket_no'] }) : [],
        leadIds.length ? CrmLead.findAll({ where: { id: leadIds }, attributes: ['id', 'name'] }) : []
      ]);

      const nameMap = {
        quote: Object.fromEntries(quotes.map(q => [q.id, q.quote_no])),
        customer: Object.fromEntries(customers.map(c => [c.id, c.name])),
        deal: Object.fromEntries(deals.map(d => [d.id, d.title])),
        ticket: Object.fromEntries(tickets.map(t => [t.id, t.ticket_no])),
        lead: Object.fromEntries(leads.map(l => [l.id, l.name]))
      };

      for (const doc of docsJson) {
        if (doc.related_type && doc.related_id && nameMap[doc.related_type]) {
          doc.linked_name = nameMap[doc.related_type][doc.related_id] || doc.related_id;
        } else {
          doc.linked_name = doc.related_id || 'General';
        }
      }
    } catch (err) {
      console.error('Error enriching document linked names:', err);
      for (const doc of docsJson) doc.linked_name = doc.related_id || 'General';
    }

    return docsJson;
  },

  async getDocumentForDownload(documentId, tenantId) {
    const document = await CrmDocument.findOne({
      where: { id: documentId, tenant_id: tenantId }
    });

    if (!document) {
      throw new Error('Document not found');
    }

    const filePath = path.resolve(document.file_path);
    if (!fs.existsSync(filePath)) {
      throw new Error('Physical file not found on server');
    }

    return { document, filePath };
  },

  async deleteDocument(documentId, tenantId) {
    const document = await CrmDocument.findOne({
      where: { id: documentId, tenant_id: tenantId }
    });

    if (!document) {
      throw new Error('Document not found');
    }

    
    const filePath = path.resolve(document.file_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await document.destroy();
    return document;
  }
};

module.exports = crmDocumentService;
