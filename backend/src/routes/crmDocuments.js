const express = require('express');
const router = express.Router();
const crmDocumentController = require('../controllers/crmDocumentController');
const { authenticate } = require('../middleware/auth');
const { tenantScope } = require('../middleware/tenantScope');
const upload = require('../middleware/upload');

router.use(authenticate);
router.use(tenantScope);

router.post('/upload', upload.single('file'), crmDocumentController.uploadDocument);

router.get('/', crmDocumentController.getDocuments);

router.get('/:id/download', crmDocumentController.downloadDocument);

router.delete('/:id', crmDocumentController.deleteDocument);

module.exports = router;
