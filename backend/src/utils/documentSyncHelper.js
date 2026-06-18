'use strict';

const fs = require('fs');
const path = require('path');
const { CrmDocument } = require('../models');

async function saveGeneratedPdf(tenantId, userId, buffer, fileName, relatedType, relatedId, category) {
  try {
    const uploadDir = path.join(__dirname, '../../uploads');
    
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const physicalFileName = `system-${uniqueSuffix}-${fileName}`;
    const filePath = path.join(uploadDir, physicalFileName);

    
    await fs.promises.writeFile(filePath, buffer);

    
    const document = await CrmDocument.create({
      tenant_id: tenantId,
      related_type: relatedType || 'general',
      related_id: relatedId || null,
      file_name: physicalFileName,
      original_name: fileName,
      file_path: filePath,
      mime_type: 'application/pdf',
      size: buffer.length,
      category: category || 'internal',
      visibility: 'public', 
      uploaded_by: userId
    });

    return document;
  } catch (error) {
    console.error('Error auto-syncing generated PDF:', error);
    throw error;
  }
}

module.exports = {
  saveGeneratedPdf
};
