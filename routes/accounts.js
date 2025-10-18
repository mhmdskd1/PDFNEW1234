const express = require('express');
const { Account } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');
const {
  authenticate,
  authorize
} = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/accounts/balance-summary
// @desc    Get balance summary
// @access  Private
router.get('/balance-summary',
  authenticate,
  authorize('accounts'),
  asyncHandler(async (req, res) => {
    const balanceSummary = await Account.getBalanceSummary();
    
    res.json({
      success: true,
      data: { balanceSummary }
    });
  })
);

// @route   GET /api/accounts/our-balance
// @desc    Get our balance
// @access  Private
router.get('/our-balance',
  authenticate,
  authorize('accounts'),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    
    const accounts = await Account.find({ type: 'our_balance' })
      .populate('invoice', 'invoiceNumber totalAmount')
      .populate('createdBy', 'fullName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await Account.countDocuments({ type: 'our_balance' });
    const currentBalance = await Account.getCurrentBalance('our_balance');
    
    res.json({
      success: true,
      data: {
        accounts,
        currentBalance,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  })
);

// @route   GET /api/accounts/client-balances
// @desc    Get client balances
// @access  Private
router.get('/client-balances',
  authenticate,
  authorize('accounts'),
  asyncHandler(async (req, res) => {
    const { clientId = '', page = 1, limit = 20 } = req.query;
    
    const filter = { type: 'client_balance' };
    if (clientId) filter.client = clientId;
    
    const accounts = await Account.find(filter)
      .populate('client', 'name type')
      .populate('invoice', 'invoiceNumber totalAmount')
      .populate('createdBy', 'fullName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await Account.countDocuments(filter);
    
    res.json({
      success: true,
      data: {
        accounts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  })
);

// @route   GET /api/accounts/client/:clientId/balance
// @desc    Get specific client balance
// @access  Private
router.get('/client/:clientId/balance',
  authenticate,
  authorize('accounts'),
  asyncHandler(async (req, res) => {
    const { clientId } = req.params;
    
    const currentBalance = await Account.getCurrentBalance('client_balance', clientId);
    
    const recentTransactions = await Account.find({
      type: 'client_balance',
      client: clientId
    })
      .populate('invoice', 'invoiceNumber totalAmount')
      .sort({ createdAt: -1 })
      .limit(10);
    
    res.json({
      success: true,
      data: {
        clientId,
        currentBalance,
        recentTransactions
      }
    });
  })
);

module.exports = router;