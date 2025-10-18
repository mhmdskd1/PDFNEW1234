const mongoose = require('mongoose');

const paymentCompanySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['bank', 'payment_processor', 'financial_institution'],
    default: 'bank'
  },
  address: {
    street: String,
    city: String,
    postalCode: String,
    country: { type: String, default: 'Netherlands' }
  },
  contactInfo: {
    email: String,
    phone: String,
    website: String
  },
  bankDetails: {
    swift: String,
    bic: String,
    routingNumber: String
  },
  paymentMethods: [{
    type: {
      type: String,
      enum: ['wire_transfer', 'sepa', 'ach', 'swift', 'other'],
      required: true
    },
    processingTime: String, // e.g., "1-2 business days"
    fees: {
      fixed: Number,
      percentage: Number,
      currency: { type: String, default: 'EUR' }
    },
    limits: {
      min: Number,
      max: Number,
      currency: { type: String, default: 'EUR' }
    },
    isActive: { type: Boolean, default: true }
  }],
  defaultIban: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(v) {
        // Basic IBAN validation for Netherlands
        return /^NL\d{2}[A-Z]{4}\d{10}$/.test(v.replace(/\s/g, ''));
      },
      message: 'Invalid IBAN format'
    }
  },
  invoiceNumbering: {
    prefix: { type: String, default: 'INV' },
    currentNumber: { type: Number, default: 0 },
    format: { type: String, default: '{prefix}-{year}-{number}' },
    resetYearly: { type: Boolean, default: true }
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
  totalPaid: {
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

// Index for IBAN and search
paymentCompanySchema.index({ defaultIban: 1 });
paymentCompanySchema.index({ name: 'text' });

// Auto-increment invoice number
paymentCompanySchema.methods.getNextInvoiceNumber = function() {
  const currentYear = new Date().getFullYear();
  const lastYear = this.invoiceNumbering.lastYear || currentYear;
  
  if (this.invoiceNumbering.resetYearly && currentYear > lastYear) {
    this.invoiceNumbering.currentNumber = 1;
    this.invoiceNumbering.lastYear = currentYear;
  } else {
    this.invoiceNumbering.currentNumber += 1;
  }
  
  const number = this.invoiceNumbering.currentNumber.toString().padStart(4, '0');
  const invoiceNumber = this.invoiceNumbering.format
    .replace('{prefix}', this.invoiceNumbering.prefix)
    .replace('{year}', currentYear.toString())
    .replace('{number}', number);
    
  return invoiceNumber;
};

module.exports = mongoose.model('PaymentCompany', paymentCompanySchema);