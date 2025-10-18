const mongoose = require('mongoose');

const digitalInvoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  // Invoice Amount Details
  baseAmount: {
    type: Number,
    required: true
  },
  vatRate: {
    type: Number,
    required: true,
    default: 21
  },
  vatAmount: {
    type: Number,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'EUR'
  },
  // Profit Distribution
  distribution: [{
    type: {
      type: String,
      enum: ['main_broker', 'us', 'additional_broker'],
      required: true
    },
    name: String, // اسم الوسيط أو "لنا"
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client'
    },
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    amount: {
      type: Number,
      required: true
    },
    // For main broker - automatic calculation
    baseAmount: Number, // Amount without VAT for main broker
    // For us and additional brokers - manual percentage
    isManualPercentage: { type: Boolean, default: true }
  }],
  // Payment Status
  isPaid: {
    type: Boolean,
    default: false
  },
  paymentDate: {
    type: Date
  },
  // Dates
  issueDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  description: {
    type: String,
    required: true
  },
  notes: String,
  
  // Creation and Modification
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Validation
  isDistributionValid: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Pre-save validation and calculations
digitalInvoiceSchema.pre('save', function(next) {
  // Calculate VAT amount
  this.vatAmount = (this.baseAmount * this.vatRate) / 100;
  this.totalAmount = this.baseAmount + this.vatAmount;
  
  // Validate distribution percentages
  const totalPercentage = this.distribution.reduce((sum, dist) => sum + dist.percentage, 0);
  this.isDistributionValid = Math.abs(totalPercentage - 100) < 0.01; // Allow for floating point precision
  
  // Calculate amounts for each distribution
  this.distribution.forEach(dist => {
    if (dist.type === 'main_broker') {
      // Main broker gets base amount automatically
      dist.baseAmount = this.baseAmount;
      dist.amount = this.baseAmount;
    } else {
      // Others get percentage of base amount
      dist.amount = (this.baseAmount * dist.percentage) / 100;
    }
  });
  
  next();
});

// Static method to generate invoice number
digitalInvoiceSchema.statics.generateInvoiceNumber = async function() {
  const currentYear = new Date().getFullYear();
  const prefix = 'DIG';
  
  // Find the last invoice number for this year
  const lastInvoice = await this.findOne({
    invoiceNumber: new RegExp(`^${prefix}-${currentYear}-`, 'i')
  }).sort({ invoiceNumber: -1 });
  
  let nextNumber = 1;
  if (lastInvoice) {
    const match = lastInvoice.invoiceNumber.match(/-([\d]+)$/);
    if (match) {
      nextNumber = parseInt(match[1]) + 1;
    }
  }
  
  return `${prefix}-${currentYear}-${nextNumber.toString().padStart(4, '0')}`;
};

// Indexes
digitalInvoiceSchema.index({ invoiceNumber: 1 });
digitalInvoiceSchema.index({ issueDate: -1 });
digitalInvoiceSchema.index({ isPaid: 1 });
digitalInvoiceSchema.index({ 'distribution.client': 1 });

module.exports = mongoose.model('DigitalInvoice', digitalInvoiceSchema);