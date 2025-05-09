const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { isAuthenticated } = require('../middleware/auth');

// User service request routes
router.post('/service-request', isAuthenticated, userController.submitServiceRequest);
router.get('/service-requests', isAuthenticated, userController.getUserServiceRequests);
router.get('/service-requests/:id', isAuthenticated, userController.getServiceRequestById);
router.put('/service-requests/:id/cancel', isAuthenticated, userController.cancelServiceRequest);

// User profile routes
router.get('/profile', isAuthenticated, userController.getUserProfile);
router.put('/profile', isAuthenticated, userController.updateUserProfile);

// User review routes
router.post('/reviews', isAuthenticated, userController.submitReview);
router.get('/reviews', isAuthenticated, userController.getUserReviews);

// User payment routes
router.get('/payments', isAuthenticated, userController.getPaymentHistory);
router.post('/payments', isAuthenticated, userController.makePayment);

module.exports = router;