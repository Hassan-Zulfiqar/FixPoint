const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    providerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    priceType: {
        type: String,
        enum: ['hourly', 'fixed', 'per_sqft'],
        default: 'hourly'
    },
    images: [{
        type: String // Paths to stored images
    }],
    options: [{
        name: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        description: {
            type: String
        }
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    averageRating: {
        type: Number,
        default: 0
    },
    totalReviews: {
        type: Number,
        default: 0
    },
    location: {
        type: String,
        required: true
    },
    serviceArea: {
        type: String,
        required: true
    },
    tags: [String],
    status: {
        type: String,
        enum: ['active', 'pending', 'rejected', 'inactive'],
        default: 'pending'
    }
}, { timestamps: true });

// Create indexes for faster querying
serviceSchema.index({ category: 1 });
serviceSchema.index({ providerId: 1 });
serviceSchema.index({ isActive: 1 });
serviceSchema.index({ 'options.name': 1 });

const Service = mongoose.model('Service', serviceSchema);

module.exports = Service;
