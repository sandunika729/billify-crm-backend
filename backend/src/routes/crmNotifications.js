'use strict';

const express = require('express');
const router = express.Router();
const crmNotificationController = require('../controllers/crmNotificationController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', crmNotificationController.getRecent);
router.patch('/read-all', crmNotificationController.markAllAsRead);
router.patch('/:id/read', crmNotificationController.markAsRead);

module.exports = router;
