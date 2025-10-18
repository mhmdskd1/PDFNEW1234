const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  language: {
    type: String,
    enum: ['nl', 'en', 'ar'],
    default: 'nl'
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Template Structure
  layout: {
    pageSize: { type: String, default: 'A4' },
    orientation: { type: String, enum: ['portrait', 'landscape'], default: 'portrait' },
    margins: {
      top: { type: Number, default: 50 },
      bottom: { type: Number, default: 50 },
      left: { type: Number, default: 50 },
      right: { type: Number, default: 50 }
    }
  },
  // Design Elements
  styles: {
    primaryColor: { type: String, default: '#2563eb' },
    secondaryColor: { type: String, default: '#64748b' },
    textColor: { type: String, default: '#1e293b' },
    backgroundColor: { type: String, default: '#ffffff' },
    fonts: {
      primary: { type: String, default: 'Arial' },
      secondary: { type: String, default: 'Arial' },
      sizes: {
        title: { type: Number, default: 24 },
        heading: { type: Number, default: 16 },
        body: { type: Number, default: 11 },
        small: { type: Number, default: 9 }
      }
    }
  },
  // Template Components
  components: [{
    id: { type: String, required: true },
    type: {
      type: String,
      enum: [
        'header', 'logo', 'company_info', 'client_info', 
        'invoice_details', 'items_table', 'totals', 
        'payment_info', 'footer', 'notes', 'text_block'
      ],
      required: true
    },
    position: {
      x: { type: Number, required: true },
      y: { type: Number, required: true },
      width: { type: Number, required: true },
      height: { type: Number, required: true }
    },
    content: {
      text: String,
      variables: [String], // e.g., ['{{company.name}}', '{{invoice.number}}']
      style: {
        fontSize: Number,
        fontWeight: String,
        textAlign: String,
        color: String,
        backgroundColor: String,
        border: String,
        padding: String
      }
    },
    visibility: {
      type: Boolean,
      default: true
    },
    order: { type: Number, default: 0 }
  }],
  // Pre-defined Variables
  variables: {
    company: {
      name: { type: Boolean, default: true },
      address: { type: Boolean, default: true },
      contact: { type: Boolean, default: true },
      registration: { type: Boolean, default: true }
    },
    client: {
      name: { type: Boolean, default: true },
      address: { type: Boolean, default: true },
      contact: { type: Boolean, default: true }
    },
    invoice: {
      number: { type: Boolean, default: true },
      date: { type: Boolean, default: true },
      dueDate: { type: Boolean, default: true },
      items: { type: Boolean, default: true },
      totals: { type: Boolean, default: true }
    }
  },
  // HTML Template for PDF Generation
  htmlTemplate: {
    type: String,
    required: true
  },
  // CSS Styles
  cssStyles: {
    type: String,
    required: true
  },
  // Usage Statistics
  usageCount: {
    type: Number,
    default: 0
  },
  lastUsed: {
    type: Date
  },
  // Creation Info
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isSystemTemplate: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Ensure only one default template per language
templateSchema.pre('save', async function(next) {
  if (this.isDefault) {
    await this.constructor.updateMany(
      { 
        language: this.language, 
        _id: { $ne: this._id },
        isDefault: true 
      },
      { isDefault: false }
    );
  }
  next();
});

// Update usage statistics
templateSchema.methods.recordUsage = function() {
  this.usageCount += 1;
  this.lastUsed = new Date();
  return this.save();
};

// Indexes
templateSchema.index({ language: 1, isDefault: 1 });
templateSchema.index({ name: 'text' });
templateSchema.index({ isActive: 1 });

module.exports = mongoose.model('Template', templateSchema);