const multer = require('multer');
const path = require('path');
const ServiceRequest = require('../models/ServiceRequest');
const User = require('../models/User');
const mongoose = require('mongoose');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/service_requests');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
}).array('photos', 5); // Allow up to 5 photos

exports.submitServiceRequest = async (req, res) => {
  try {
    // Handle file uploads
    upload(req, res, async (err) => {
      if (err) {
        console.error('File upload error:', err);
        return res.status(400).json({ 
          success: false, 
          message: 'Error uploading files',
          error: err.message 
        });
      }

      // Log the request body to debug
      console.log('Request body:', req.body);
      console.log('Request files:', req.files);

      // Get form data from request body
      const {
        category,
        serviceType,
        serviceTitle,
        description,
        scheduledDate,
        preferredTime,
        alternateDate,
        urgencyLevel,
        location
      } = req.body;

      // Validate required fields
      const requiredFields = {
        category: 'Category',
        serviceType: 'Service Type',
        serviceTitle: 'Service Title',
        description: 'Description',
        scheduledDate: 'Scheduled Date',
        preferredTime: 'Preferred Time',
        location: 'Location',
        urgencyLevel: 'Urgency Level'
      };

      const missingFields = Object.entries(requiredFields)
        .filter(([field]) => !req.body[field])
        .map(([_, label]) => label);

      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Please fill in the following required fields: ${missingFields.join(', ')}`
        });
      }

      // Validate urgency level
      const validUrgencyLevels = ['Standard (3-5 days)', 'Priority (1-2 days)', 'Emergency (Same day)'];
      if (!validUrgencyLevels.includes(urgencyLevel)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid urgency level selected'
        });
      }

      // Process uploaded files
      const photos = req.files ? req.files.map(file => `/uploads/service_requests/${file.filename}`) : [];

      // Create service request
      const serviceRequest = new ServiceRequest({
        userId: req.user._id, // MongoDB uses _id
        category,
        serviceType,
        serviceTitle,
        description,
        scheduledDate: new Date(scheduledDate),
        preferredTime,
        alternateDate: alternateDate ? new Date(alternateDate) : null,
        urgencyLevel,
        location,
        photos: photos, // Store as array directly
        status: 'pending'
      });
      
      await serviceRequest.save();

      console.log('Created service request:', serviceRequest);

      res.json({
        success: true,
        message: 'Service request submitted successfully',
        data: serviceRequest
      });
    });
  } catch (error) {
    console.error('Error submitting service request:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting service request',
      error: error.message
    });
  }
};

// Get user's service requests
exports.getUserServiceRequests = async (req, res) => {
  try {
    const requests = await ServiceRequest.find({ 
      userId: req.user._id 
    }).sort({ createdAt: -1 }); // Sort by creation date, newest first

    // For completed requests, check if user has left a review
    for (let request of requests) {
      if (request.status === 'completed' && request.providerId) {
        const review = await Review.findOne({
          userId: req.user._id,
          serviceRequestId: request._id
        });
        
        if (review) {
          request = request.toObject();
          request.userReview = true;
          request.userRating = review.rating;
        }
      }
      
      // If request has a provider, get provider details
      if (request.providerId) {
        const provider = await User.findById(request.providerId)
          .select('name profile_pic rating reviews');
        
        if (provider) {
          request = request.toObject();
          request.providerName = provider.name;
          request.providerImage = provider.profile_pic;
          request.providerRating = provider.rating || 4.5;
          request.providerReviews = provider.reviews?.length || 0;
        }
      }
    }

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Error fetching service requests:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching service requests',
      error: error.message
    });
  }
};

// Get a specific service request by ID
exports.getServiceRequestById = async (req, res) => {
  try {
    const requestId = req.params.id;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service request ID'
      });
    }
    
    const request = await ServiceRequest.findOne({
      _id: requestId,
      userId: req.user._id
    });
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Service request not found'
      });
    }
    
    // Get provider details if available
    let providerDetails = {};
    if (request.providerId) {
      const provider = await User.findById(request.providerId)
        .select('name email contact profile_pic rating reviews');
      
      if (provider) {
        providerDetails = {
          name: provider.name,
          email: provider.email,
          phone: provider.contact,
          image: provider.profile_pic,
          rating: provider.rating || 4.5,
          reviews: provider.reviews?.length || 0
        };
      }
    }
    
    res.json({
      success: true,
      data: {
        ...request.toObject(),
        provider: providerDetails
      }
    });
  } catch (error) {
    console.error('Error fetching service request:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching service request',
      error: error.message
    });
  }
};

// Cancel a service request
exports.cancelServiceRequest = async (req, res) => {
  try {
    const requestId = req.params.id;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service request ID'
      });
    }
    
    const request = await ServiceRequest.findOne({
      _id: requestId,
      userId: req.user._id
    });
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Service request not found'
      });
    }
    
    // Can only cancel pending requests
    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a request that is already ${request.status}`
      });
    }
    
    // Update request status
    request.status = 'canceled';
    request.canceledBy = 'user';
    request.canceledDate = Date.now();
    await request.save();
    
    res.json({
      success: true,
      message: 'Service request canceled successfully'
    });
  } catch (error) {
    console.error('Error canceling service request:', error);
    res.status(500).json({
      success: false,
      message: 'Error canceling service request',
      error: error.message
    });
  }
};

// Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile',
      error: error.message
    });
  }
};

// Update user profile
exports.updateUserProfile = async (req, res) => {
  try {
    const updates = req.body;
    
    // Remove sensitive fields that shouldn't be updated directly
    delete updates.password;
    delete updates.email; // Email changes should be handled separately with verification
    delete updates.is_verified;
    delete updates.verification_token;
    delete updates.resetToken;
    delete updates.resetTokenExpires;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user profile',
      error: error.message
    });
  }
};

// Submit a review
exports.submitReview = async (req, res) => {
  try {
    // Implement review submission logic here
    res.json({
      success: true,
      message: 'Review submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting review',
      error: error.message
    });
  }
};

// Get user reviews
exports.getUserReviews = async (req, res) => {
  try {
    // Implement logic to fetch user reviews
    res.json({
      success: true,
      data: []
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      error: error.message
    });
  }
};

// Get payment history
exports.getPaymentHistory = async (req, res) => {
  try {
    // Implement logic to fetch payment history
    res.json({
      success: true,
      data: []
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment history',
      error: error.message
    });
  }
};

// Make a payment
exports.makePayment = async (req, res) => {
  try {
    // Implement payment logic here
    res.json({
      success: true,
      message: 'Payment successful'
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing payment',
      error: error.message
    });
  }
};