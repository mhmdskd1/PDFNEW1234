const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['broker', 'financer'], // وسيط أو ممول
    required: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    postalCode: String,
    country: { type: String, default: 'Netherlands' }
  },
  businessInfo: {
    companyName: String,
    registrationNumber: String,
    taxNumber: String,
    btwNumber: String,
    kvkNumber: String
  },
  bankDetails: {
    iban: String,
    bic: String,
    bankName: String
  },
  contactPerson: {
    name: String,
    phone: String,
    email: String
  },
  notes: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  totalInvoices: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    default: 0
  },
  balance: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for search
clientSchema.index({ name: 'text', 'businessInfo.companyName': 'text' });

module.exports = mongoose.model('Client', clientSchema);