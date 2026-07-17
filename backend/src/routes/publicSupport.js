'use strict';

const express = require('express');
const router = express.Router();
const publicSupportController = require('../controllers/publicSupportController');

// Public Support Endpoints (No authentication required, uses x-tenant-id)

// Create a new ticket
router.post('/tickets', publicSupportController.createTicket);

// Get a ticket and its public messages
router.get('/tickets/:ticket_no', publicSupportController.getTicket);

// Add a message to a ticket from the customer
router.post('/tickets/:ticket_no/messages', publicSupportController.addMessage);

module.exports = router;
