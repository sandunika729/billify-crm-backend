const crmDocumentService = require('../services/crmDocumentService');
const { sendSuccess, sendError } = require('../utils/response');
const { logAudit, getAuditContext } = require('../utils/auditLogger');

exports.uploadDocument = async (req, res) => {
  try {
    const docWithUploader = await crmDocumentService.uploadDocument({
      tenantId: req.tenantId,
      fileData: req.file,
      body: req.body,
      userId: req.user.id
    });

    await logAudit({
      ...getAuditContext(req),
      action: 'create',
      entityType: 'document',
      entityId: docWithUploader.id,
      description: `Uploaded document ${docWithUploader.original_name}`
    });

    return sendSuccess(res, docWithUploader, 'Document uploaded successfully', 201);
  } catch (error) {
    console.error('Upload error:', error);
    const statusCode = error.message.includes('No file') ? 400 : 500;
    return sendError(res, error.message || 'Failed to upload document', statusCode);
  }
};

exports.getDocuments = async (req, res) => {
  try {
    const { category, related_type, related_id } = req.query;
    const documents = await crmDocumentService.getDocuments({
      tenantId: req.tenantId,
      category,
      related_type,
      related_id
    });

    return sendSuccess(res, documents, 'Documents retrieved successfully');
  } catch (error) {
    console.error('Get documents error:', error);
    return sendError(res, error.message || 'Failed to fetch documents', 500);
  }
};

exports.downloadDocument = async (req, res) => {
  try {
    const { document, filePath } = await crmDocumentService.getDocumentForDownload(req.params.id, req.tenantId);
    res.download(filePath, document.original_name);
  } catch (error) {
    console.error('Download error:', error);
    const statusCode = error.message.includes('not found') ? 404 : 500;
    return sendError(res, error.message || 'Failed to download document', statusCode);
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    const document = await crmDocumentService.deleteDocument(req.params.id, req.tenantId);

    await logAudit({
      ...getAuditContext(req),
      action: 'delete',
      entityType: 'document',
      entityId: document.id,
      description: `Deleted document ${document.original_name}`
    });

    return sendSuccess(res, null, 'Document deleted successfully');
  } catch (error) {
    console.error('Delete document error:', error);
    const statusCode = error.message.includes('not found') ? 404 : 500;
    return sendError(res, error.message || 'Failed to delete document', statusCode);
  }
};
