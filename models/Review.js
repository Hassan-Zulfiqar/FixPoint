const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    providerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    serviceRequestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ServiceRequest',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: true
    },
    // Optional fields
    serviceQuality: {
        type: Number,
        min: 1,
        max: 5
    },
    punctuality: {
        type: Number,
        min: 1,
        max: 5
    },
    professionalism: {
        type: Number,
        min: 1,
        max: 5
    },
    valueMoney: {
        type: Number,
        min: 1,
        max: 5
    },
    isAnonymous: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
