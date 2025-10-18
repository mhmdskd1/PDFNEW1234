const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, default: 'Netherlands' }
  },
  businessInfo: {
    registrationNumber: String,
    taxNumber: String,
    btwNumber: String,
    kvkNumber: String,
    isValidated: {
      btw: { type: Boolean, default: false },
      kvk: { type: Boolean, default: false }
    },
    validationDate: {
      btw: Date,
      kvk: Date
    }
  },
  contactInfo: {
    email: { type: String, required: true },
    phone: String,
    website: String
  },
  paymentMethods: [{
    type: {
      type: String,
      enum: ['bank_transfer', 'sepa', 'ideal', 'paypal', 'other'],
      required: true
    },
    details: {
      iban: String,
      bic: String,
      accountName: String,
      reference: String,
      other: String
    },
    isDefault: { type: Boolean, default: false }
  }],
  invoiceSettings: {
    defaultTemplate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Template'
    },
    paymentTerms: { type: Number, default: 30 }, // days
    language: { type: String, default: 'nl' },
    currency: { type: String, default: 'EUR' }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  totalReceived: {
    type: Number,
    default: 0
  },
  invoiceCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for validation and search
companySchema.index({ 'businessInfo.btwNumber': 1 });
companySchema.index({ 'businessInfo.kvkNumber': 1 });
companySchema.index({ name: 'text' });

module.exports = mongoose.model('Company', companySchema);