const User = require('../models/User');

exports.isAuthenticated = async (req, res, next) => {
    // Check if user is authenticated via session
    if (req.isAuthenticated && req.isAuthenticated()) {
        return next();
    }
    
    // If no valid session, return error
    res.status(401).json({
        success: false,
        message: 'Please login to access this resource'
    });
};

exports.isAdmin = async (req, res, next) => {
    // First check if authenticated
    if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({
            success: false,
            message: 'Please login to access this resource'
        });
    }
    
    // Then check if user is admin
    if (req.user && req.user.role === 'admin') {
        return next();
    }
    
    // If not admin, return error
    res.status(403).json({
        success: false,
        message: 'Access denied: Admin privileges required'
    });
};