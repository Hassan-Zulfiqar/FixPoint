const mongoose = require('mongoose');

const serviceRequestSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    category: {
        type: String,
        required: true
    },
    serviceType: {
        type: String,
        required: true
    },
    serviceTitle: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    scheduledDate: {
        type: Date,
        required: true
    },
    preferredTime: {
        type: String,
        required: true
    },
    alternateDate: {
        type: Date
    },
    urgencyLevel: {
        type: String,
        required: true,
        enum: ['Standard (3-5 days)', 'Priority (1-2 days)', 'Emergency (Same day)']
    },
    location: {
        type: String,
        required: true
    },
    photos: {
        type: [String]
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'in progress', 'completed', 'canceled'],
        default: 'pending'
    },
    providerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    providerAssignedDate: {
        type: Date
    },
    approvedDate: {
        type: Date
    },
    completedDate: {
        type: Date
    },
    canceledDate: {
        type: Date
    },
    canceledBy: {
        type: String,
        enum: ['user', 'provider', 'admin', 'system']
    },
    price: {
        type: Number
    },
    isPaid: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const ServiceRequest = mongoose.model('ServiceRequest', serviceRequestSchema);

module.exports = ServiceRequest;