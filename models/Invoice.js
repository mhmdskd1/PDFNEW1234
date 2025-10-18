const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  template: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Template',
    required: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  paymentCompany: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaymentCompany',
    required: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  // Invoice Details
  items: [{
    description: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1 },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    vatRate: { type: Number, default: 21 } // BTW rate
  }],
  subtotal: {
    type: Number,
    required: true
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
  // Profit Distribution Settings
  profitDistribution: {
    type: {
      type: String,
      enum: ['21_9', '0', 'verlicht'],
      required: true
    },
    settings: {
      // For 21_9 type
      forUs: Number, // النسبة لنا
      forThem: Number, // النسبة لهم
      
      // For verlicht type
      verlichtTotal: Number, // القيمة الكاملة للفيرلخت
      ourPercentage: Number, // نسبتنا المئوية
      brokerPercentage: Number // نسبة الوسيط المئوية
    }
  },
  // Payment Status
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid'],
    default: 'pending'
  },
  payments: [{
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    method: String,
    reference: String,
    notes: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  paidAmount: {
    type: Number,
    default: 0
  },
  remainingAmount: {
    type: Number
  },
  // Invoice Dates
  issueDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  paidDate: {
    type: Date
  },
  // File Information
  pdfPath: {
    type: String
  },
  fileSize: {
    type: Number
  },
  // Company Logo
  logo: {
    path: String,
    width: Number,
    height: Number,
    position: {
      x: Number,
      y: Number
    }
  },
  // Additional Information
  notes: String,
  internalNotes: String,
  
  // Email Status
  emailSent: {
    type: Boolean,
    default: false
  },
  emailSentDate: Date,
  
  // Creation Info
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Calculate remaining amount before saving
invoiceSchema.pre('save', function(next) {
  this.remainingAmount = this.totalAmount - this.paidAmount;
  
  // Update payment status
  if (this.paidAmount === 0) {
    this.paymentStatus = 'pending';
  } else if (this.paidAmount < this.totalAmount) {
    this.paymentStatus = 'partial';
  } else {
    this.paymentStatus = 'paid';
    if (!this.paidDate) {
      this.paidDate = new Date();
    }
  }
  
  next();
});

// Indexes for search and performance
invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ company: 1, issueDate: -1 });
invoiceSchema.index({ client: 1, issueDate: -1 });
invoiceSchema.index({ paymentStatus: 1 });
invoiceSchema.index({ issueDate: -1 });
invoiceSchema.index({ dueDate: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);