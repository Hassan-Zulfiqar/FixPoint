const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ServiceProviderSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  service_type: {
    type: String,
    required: true
  },
  licence_doc: {
    type: String
  },
  address: {
    type: String,
    required: true
  },
  approved_by_admin: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ServiceProvider', ServiceProviderSchema);