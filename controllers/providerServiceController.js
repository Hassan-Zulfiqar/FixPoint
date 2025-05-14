const Service = require('../models/Service');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'public/uploads/services';
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'service-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Get all services for the logged-in provider
exports.getAllServices = async (req, res) => {
    try {
        // Check if user is a service provider
        if (req.user.user_type !== 'service_provider') {
            return res.status(403).json({
                success: false,
                message: 'Access denied: Only service providers can access this resource'
            });
        }

        const services = await Service.find({ providerId: req.user._id })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: services.length,
            data: services
        });
    } catch (error) {
        console.error('Error fetching provider services:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching services',
            error: error.message
        });
    }
};

// Get a specific service by ID
exports.getServiceById = async (req, res) => {
    try {
        const serviceId = req.params.id;
        
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(serviceId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid service ID'
            });
        }
        
        const service = await Service.findOne({
            _id: serviceId,
            providerId: req.user._id
        });
        
        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Service not found'
            });
        }
        
        res.json({
            success: true,
            data: service
        });
    } catch (error) {
        console.error('Error fetching service details:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching service details',
            error: error.message
        });
    }
};

// Create a new service
exports.createService = async (req, res) => {
    try {
        // Multiple image upload (up to 5)
        const uploadImages = upload.array('images', 5);
        
        uploadImages(req, res, async (err) => {
            if (err) {
                console.error('Error uploading images:', err);
                return res.status(400).json({
                    success: false,
                    message: 'Error uploading images',
                    error: err.message
                });
            }

            // Check required fields
            const { title, description, category, price, priceType, location, serviceArea } = req.body;
            
            if (!title || !description || !category || !price || !location || !serviceArea) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields'
                });
            }

            // Process options if they exist
            let serviceOptions = [];
            if (req.body.options) {
                try {
                    serviceOptions = JSON.parse(req.body.options);
                } catch (parseErr) {
                    console.error('Error parsing options:', parseErr);
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid options format'
                    });
                }
            }

            // Process tags if they exist
            let serviceTags = [];
            if (req.body.tags) {
                try {
                    serviceTags = JSON.parse(req.body.tags);
                } catch (parseErr) {
                    console.error('Error parsing tags:', parseErr);
                    // If tags parsing fails, we'll just use an empty array
                }
            }

            // Generate image paths
            const imagePaths = req.files ? req.files.map(file => `/uploads/services/${file.filename}`) : [];

            // Create new service
            const newService = new Service({
                providerId: req.user._id,
                title,
                description,
                category,
                price: parseFloat(price),
                priceType: priceType || 'hourly',
                images: imagePaths,
                options: serviceOptions,
                location,
                serviceArea,
                tags: serviceTags
            });

            await newService.save();

            res.status(201).json({
                success: true,
                message: 'Service created successfully',
                data: newService
            });
        });
    } catch (error) {
        console.error('Error creating service:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating service',
            error: error.message
        });
    }
};

// Update an existing service
exports.updateService = async (req, res) => {
    try {
        const serviceId = req.params.id;
        
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(serviceId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid service ID'
            });
        }
        
        // Check if service exists and belongs to this provider
        const service = await Service.findOne({
            _id: serviceId,
            providerId: req.user._id
        });
        
        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Service not found or access denied'
            });
        }

        // Handle image upload if there are new images
        const uploadImages = upload.array('images', 5);
        
        uploadImages(req, res, async (err) => {
            if (err) {
                console.error('Error uploading images:', err);
                return res.status(400).json({
                    success: false,
                    message: 'Error uploading images',
                    error: err.message
                });
            }

            // Update fields if they are provided
            const updates = {};
            
            if (req.body.title) updates.title = req.body.title;
            if (req.body.description) updates.description = req.body.description;
            if (req.body.category) updates.category = req.body.category;
            if (req.body.price) updates.price = parseFloat(req.body.price);
            if (req.body.priceType) updates.priceType = req.body.priceType;
            if (req.body.location) updates.location = req.body.location;
            if (req.body.serviceArea) updates.serviceArea = req.body.serviceArea;
            
            // Process options if they exist
            if (req.body.options) {
                try {
                    updates.options = JSON.parse(req.body.options);
                } catch (parseErr) {
                    console.error('Error parsing options:', parseErr);
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid options format'
                    });
                }
            }

            // Process tags if they exist
            if (req.body.tags) {
                try {
                    updates.tags = JSON.parse(req.body.tags);
                } catch (parseErr) {
                    console.error('Error parsing tags:', parseErr);
                    // If tags parsing fails, we'll just ignore it
                }
            }

            // Add new images to existing ones
            if (req.files && req.files.length > 0) {
                const newImagePaths = req.files.map(file => `/uploads/services/${file.filename}`);
                
                // Check if we should replace all images or add to existing ones
                if (req.body.replaceImages === 'true') {
                    updates.images = newImagePaths;
                } else {
                    updates.images = [...service.images, ...newImagePaths];
                }
            }

            // Handle removal of specific images if requested
            if (req.body.removeImages) {
                try {
                    const imagesToRemove = JSON.parse(req.body.removeImages);
                    // Filter out images that should be removed
                    const currentImages = updates.images || service.images;
                    updates.images = currentImages.filter(img => !imagesToRemove.includes(img));
                } catch (parseErr) {
                    console.error('Error parsing removeImages:', parseErr);
                }
            }

            // Update the service in database
            const updatedService = await Service.findByIdAndUpdate(
                serviceId,
                { $set: updates },
                { new: true, runValidators: true }
            );

            res.json({
                success: true,
                message: 'Service updated successfully',
                data: updatedService
            });
        });
    } catch (error) {
        console.error('Error updating service:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating service',
            error: error.message
        });
    }
};

// Delete a service
exports.deleteService = async (req, res) => {
    try {
        const serviceId = req.params.id;
        
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(serviceId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid service ID'
            });
        }
        
        // Check if service exists and belongs to this provider
        const service = await Service.findOne({
            _id: serviceId,
            providerId: req.user._id
        });
        
        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Service not found or access denied'
            });
        }
        
        // Delete the service
        await Service.findByIdAndDelete(serviceId);
        
        // Optional: Delete associated image files to free up storage
        if (service.images && service.images.length > 0) {
            service.images.forEach(imagePath => {
                const fullPath = path.join(__dirname, '../public', imagePath);
                if (fs.existsSync(fullPath)) {
                    fs.unlinkSync(fullPath);
                }
            });
        }
        
        res.json({
            success: true,
            message: 'Service deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting service:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting service',
            error: error.message
        });
    }
};

// Toggle service active/inactive status
exports.toggleServiceStatus = async (req, res) => {
    try {
        const serviceId = req.params.id;
        
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(serviceId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid service ID'
            });
        }
        
        // Check if service exists and belongs to this provider
        const service = await Service.findOne({
            _id: serviceId,
            providerId: req.user._id
        });
        
        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Service not found or access denied'
            });
        }
        
        // Toggle the isActive status
        service.isActive = !service.isActive;
        await service.save();
        
        res.json({
            success: true,
            message: `Service ${service.isActive ? 'activated' : 'deactivated'} successfully`,
            isActive: service.isActive
        });
    } catch (error) {
        console.error('Error toggling service status:', error);
        res.status(500).json({
            success: false,
            message: 'Error toggling service status',
            error: error.message
        });
    }
};

// Get service stats for the provider (count by category, active vs inactive, etc.)
exports.getServiceStats = async (req, res) => {
    try {
        // Total services count
        const totalServices = await Service.countDocuments({ providerId: req.user._id });
        
        // Active services count
        const activeServices = await Service.countDocuments({ 
            providerId: req.user._id,
            isActive: true 
        });
        
        // Inactive services count
        const inactiveServices = await Service.countDocuments({ 
            providerId: req.user._id,
            isActive: false 
        });
        
        // Services by category
        const categoryCounts = await Service.aggregate([
            { $match: { providerId: mongoose.Types.ObjectId(req.user._id) } },
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);
        
        // Average rating across all services
        const ratingsAggregate = await Service.aggregate([
            { $match: { providerId: mongoose.Types.ObjectId(req.user._id) } },
            { $group: { 
                _id: null, 
                averageRating: { $avg: '$averageRating' },
                totalReviews: { $sum: '$totalReviews' }
            }}
        ]);
        
        const averageRating = ratingsAggregate.length > 0 ? 
            ratingsAggregate[0].averageRating : 0;
            
        const totalReviews = ratingsAggregate.length > 0 ? 
            ratingsAggregate[0].totalReviews : 0;
        
        res.json({
            success: true,
            data: {
                totalServices,
                activeServices,
                inactiveServices,
                categoryCounts,
                averageRating,
                totalReviews
            }
        });
    } catch (error) {
        console.error('Error fetching service stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching service statistics',
            error: error.message
        });
    }
};
