const express = require('express');
const router = express.Router();
const providerServiceController = require('../controllers/providerServiceController');
const { isAuthenticated } = require('../middleware/auth');

// All routes require authentication
router.use(isAuthenticated);

// GET all services for the logged-in provider
router.get('/', providerServiceController.getAllServices);

// GET service statistics for the provider
router.get('/stats', providerServiceController.getServiceStats);

// GET a specific service by ID
router.get('/:id', providerServiceController.getServiceById);

// POST create a new service
router.post('/', providerServiceController.createService);

// PUT update an existing service
router.put('/:id', providerServiceController.updateService);

// DELETE a service
router.delete('/:id', providerServiceController.deleteService);

// PATCH toggle service active/inactive status
router.patch('/:id/toggle-status', providerServiceController.toggleServiceStatus);

module.exports = router;
