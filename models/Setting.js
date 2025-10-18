const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  category: {
    type: String,
    enum: [
      'email', 'pdf', 'general', 'api', 
      'notifications', 'security', 'invoice'
    ],
    required: true
  },
  description: {
    type: String
  },
  isEncrypted: {
    type: Boolean,
    default: false
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Default Settings
const defaultSettings = [
  // Email Settings
  {
    key: 'email.smtp.host',
    value: 'smtp.gmail.com',
    category: 'email',
    description: 'SMTP Host',
    isPublic: true
  },
  {
    key: 'email.smtp.port',
    value: 587,
    category: 'email',
    description: 'SMTP Port',
    isPublic: true
  },
  {
    key: 'email.smtp.user',
    value: '',
    category: 'email',
    description: 'SMTP Username',
    isEncrypted: true
  },
  {
    key: 'email.smtp.password',
    value: '',
    category: 'email',
    description: 'SMTP Password',
    isEncrypted: true
  },
  {
    key: 'email.from.name',
    value: 'Invoice System',
    category: 'email',
    description: 'From Name',
    isPublic: true
  },
  {
    key: 'email.from.address',
    value: '',
    category: 'email',
    description: 'From Email Address',
    isPublic: true
  },
  
  // API Settings
  {
    key: 'api.btw.url',
    value: 'https://api.btw-nummer.nl',
    category: 'api',
    description: 'BTW Validation API URL',
    isPublic: true
  },
  {
    key: 'api.kvk.url',
    value: 'https://api.kvk.nl/api/v1',
    category: 'api',
    description: 'KVK API URL',
    isPublic: true
  },
  {
    key: 'api.kvk.key',
    value: '',
    category: 'api',
    description: 'KVK API Key',
    isEncrypted: true
  },
  
  // General Settings
  {
    key: 'general.company.name',
    value: 'شركة إدارة الفواتير',
    category: 'general',
    description: 'Company Name',
    isPublic: true
  },
  {
    key: 'general.company.address',
    value: '',
    category: 'general',
    description: 'Company Address',
    isPublic: true
  },
  {
    key: 'general.company.phone',
    value: '',
    category: 'general',
    description: 'Company Phone',
    isPublic: true
  },
  {
    key: 'general.company.email',
    value: '',
    category: 'general',
    description: 'Company Email',
    isPublic: true
  },
  {
    key: 'general.currency.default',
    value: 'EUR',
    category: 'general',
    description: 'Default Currency',
    isPublic: true
  },
  {
    key: 'general.language.default',
    value: 'nl',
    category: 'general',
    description: 'Default Language',
    isPublic: true
  },
  
  // Invoice Settings
  {
    key: 'invoice.payment.terms',
    value: 30,
    category: 'invoice',
    description: 'Default Payment Terms (days)',
    isPublic: true
  },
  {
    key: 'invoice.vat.default',
    value: 21,
    category: 'invoice',
    description: 'Default VAT Rate (%)',
    isPublic: true
  },
  {
    key: 'invoice.numbering.format',
    value: '{prefix}-{year}-{number}',
    category: 'invoice',
    description: 'Invoice Number Format',
    isPublic: true
  },
  
  // PDF Settings
  {
    key: 'pdf.page.size',
    value: 'A4',
    category: 'pdf',
    description: 'Default PDF Page Size',
    isPublic: true
  },
  {
    key: 'pdf.page.orientation',
    value: 'portrait',
    category: 'pdf',
    description: 'Default PDF Orientation',
    isPublic: true
  },
  
  // Security Settings
  {
    key: 'security.session.timeout',
    value: 30,
    category: 'security',
    description: 'Session Timeout (minutes)',
    isPublic: true
  },
  {
    key: 'security.password.minLength',
    value: 8,
    category: 'security',
    description: 'Minimum Password Length',
    isPublic: true
  },
  
  // Notification Settings
  {
    key: 'notifications.email.enabled',
    value: true,
    category: 'notifications',
    description: 'Enable Email Notifications',
    isPublic: true
  },
  {
    key: 'notifications.invoice.created',
    value: true,
    category: 'notifications',
    description: 'Notify on Invoice Created',
    isPublic: true
  },
  {
    key: 'notifications.payment.received',
    value: true,
    category: 'notifications',
    description: 'Notify on Payment Received',
    isPublic: true
  }
];

// Initialize default settings
settingSchema.statics.initializeDefaults = async function() {
  for (const setting of defaultSettings) {
    const existing = await this.findOne({ key: setting.key });
    if (!existing) {
      await this.create(setting);
    }
  }
};

// Get setting by key
settingSchema.statics.get = async function(key, defaultValue = null) {
  const setting = await this.findOne({ key });
  return setting ? setting.value : defaultValue;
};

// Set setting by key
settingSchema.statics.set = async function(key, value, userId = null) {
  const setting = await this.findOneAndUpdate(
    { key },
    { 
      value, 
      lastModifiedBy: userId,
      updatedAt: new Date()
    },
    { 
      upsert: true, 
      new: true 
    }
  );
  return setting;
};

// Get settings by category
settingSchema.statics.getByCategory = async function(category, includePrivate = false) {
  const query = { category };
  if (!includePrivate) {
    query.isPublic = true;
  }
  
  const settings = await this.find(query).select('-__v');
  const result = {};
  
  settings.forEach(setting => {
    const keys = setting.key.split('.');
    let obj = result;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!obj[keys[i]]) {
        obj[keys[i]] = {};
      }
      obj = obj[keys[i]];
    }
    
    obj[keys[keys.length - 1]] = setting.value;
  });
  
  return result;
};

settingSchema.index({ key: 1 });
settingSchema.index({ category: 1 });

module.exports = mongoose.model('Setting', settingSchema);