const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  // Account Type
  type: {
    type: String,
    enum: ['our_balance', 'client_balance'], // صندوقنا أو رصيد عميل
    required: true
  },
  // Client Reference (for client balances)
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client'
  },
  // Transaction Details
  invoiceType: {
    type: String,
    enum: ['pdf', 'digital'],
    required: true
  },
  invoice: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'invoiceModel',
    required: true
  },
  invoiceModel: {
    type: String,
    enum: ['Invoice', 'DigitalInvoice'],
    required: true
  },
  invoiceNumber: {
    type: String,
    required: true
  },
  // Financial Details
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'EUR'
  },
  description: {
    type: String,
    required: true
  },
  // Transaction Type
  transactionType: {
    type: String,
    enum: ['debit', 'credit'], // خصم أو إضافة
    required: true
  },
  // Profit Distribution Details (for our balance)
  profitDetails: {
    distributionType: {
      type: String,
      enum: ['21_9', '0', 'verlicht']
    },
    percentage: Number,
    baseAmount: Number,
    calculatedAmount: Number
  },
  // Processing Status
  status: {
    type: String,
    enum: ['pending', 'processed', 'cancelled'],
    default: 'pending'
  },
  processedDate: {
    type: Date
  },
  // Creation and Processing Info
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: String,
  
  // Balance Tracking
  runningBalance: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Calculate running balance
accountSchema.pre('save', async function(next) {
  if (this.isNew && this.status === 'processed') {
    // Get the last balance for this account type and client
    const query = { type: this.type };
    if (this.client) {
      query.client = this.client;
    }
    
    const lastAccount = await this.constructor
      .findOne(query)
      .sort({ createdAt: -1 });
    
    const lastBalance = lastAccount ? lastAccount.runningBalance : 0;
    
    if (this.transactionType === 'credit') {
      this.runningBalance = lastBalance + this.amount;
    } else {
      this.runningBalance = lastBalance - this.amount;
    }
  }
  next();
});

// Static method to get current balance
accountSchema.statics.getCurrentBalance = async function(type, clientId = null) {
  const query = { type, status: 'processed' };
  if (clientId) {
    query.client = clientId;
  }
  
  const lastAccount = await this.findOne(query)
    .sort({ createdAt: -1 });
  
  return lastAccount ? lastAccount.runningBalance : 0;
};

// Static method to get balance summary
accountSchema.statics.getBalanceSummary = async function() {
  const ourBalance = await this.getCurrentBalance('our_balance');
  
  // Get all client balances
  const clientBalances = await this.aggregate([
    {
      $match: {
        type: 'client_balance',
        status: 'processed'
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $group: {
        _id: '$client',
        balance: { $first: '$runningBalance' },
        lastTransaction: { $first: '$createdAt' }
      }
    },
    {
      $lookup: {
        from: 'clients',
        localField: '_id',
        foreignField: '_id',
        as: 'clientInfo'
      }
    },
    {
      $unwind: '$clientInfo'
    },
    {
      $project: {
        clientId: '$_id',
        clientName: '$clientInfo.name',
        clientType: '$clientInfo.type',
        balance: 1,
        lastTransaction: 1
      }
    }
  ]);
  
  return {
    ourBalance,
    clientBalances,
    totalClientBalances: clientBalances.reduce((sum, client) => sum + client.balance, 0)
  };
};

// Indexes
accountSchema.index({ type: 1, client: 1, createdAt: -1 });
accountSchema.index({ invoice: 1 });
accountSchema.index({ status: 1 });
accountSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Account', accountSchema);