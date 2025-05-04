const db = require('../models');
const multer = require('multer');
const path = require('path');

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
        location: 'Location'
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
      const serviceRequest = await db.ServiceRequest.create({
        userId: req.user.id,
        category,
        serviceType,
        serviceTitle,
        description,
        scheduledDate: new Date(scheduledDate),
        preferredTime,
        alternateDate: alternateDate ? new Date(alternateDate) : null,
        urgencyLevel,
        location,
        photos: JSON.stringify(photos), // Store as JSON string
        status: 'pending'
      });

      console.log('Created service request:', serviceRequest.toJSON());

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
    const requests = await db.ServiceRequest.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });

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