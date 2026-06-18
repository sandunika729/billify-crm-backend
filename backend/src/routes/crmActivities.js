'use strict';

const express = require('express');
const router = express.Router();
const activityController = require('../controllers/crmActivityController');
const { authenticate } = require('../middleware/auth');
const { tenantScope } = require('../middleware/tenantScope');

router.use(authenticate);
router.use(tenantScope);

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../uploads/emails');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'email-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

router.get('/', activityController.getActivities);
router.post('/', activityController.createActivity);
router.put('/:id', activityController.updateActivity);
router.delete('/:id', activityController.deleteActivity);

router.get('/interactions', activityController.getInteractions);
router.post('/interactions', activityController.createInteraction);
router.post('/upload-email', upload.single('emailFile'), activityController.uploadEmail);
router.get('/preview-email', activityController.previewEmail);

router.post('/send-email', activityController.sendEmail);
router.post('/send-whatsapp', activityController.sendWhatsApp);

router.get('/calendar', activityController.getCalendarActivities);

module.exports = router;
