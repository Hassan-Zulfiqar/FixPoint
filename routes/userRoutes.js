const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { isAuthenticated } = require('../middleware/auth');

// Service request routes
router.post('/user/service-request', isAuthenticated, userController.submitServiceRequest);
router.get('/user/service-requests', isAuthenticated, userController.getUserServiceRequests);

module.exports = router;