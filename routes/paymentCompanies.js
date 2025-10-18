const express = require('express');
const {
  getPaymentCompanies,
  getPaymentCompany,
  createPaymentCompany,
  updatePaymentCompany,
  deletePaymentCompany,
  togglePaymentCompanyStatus,
  getPaymentCompanyStats,
  getPaymentCompaniesDropdown,
  getNextInvoiceNumber
} = require('../controllers/paymentCompanyController');
const {
  authenticate,
  authorize
} = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/payment-companies/dropdown
// @desc    Get payment companies for dropdown/select
// @access  Private
router.get('/dropdown',
  authenticate,
  authorize('paymentCompanies'),
  getPaymentCompaniesDropdown
);

// @route   GET /api/payment-companies
// @desc    Get all payment companies
// @access  Private
router.get('/',
  authenticate,
  authorize('paymentCompanies'),
  getPaymentCompanies
);

// @route   GET /api/payment-companies/:id
// @desc    Get single payment company
// @access  Private
router.get('/:id',
  authenticate,
  authorize('paymentCompanies'),
  getPaymentCompany
);

// @route   POST /api/payment-companies
// @desc    Create new payment company
// @access  Private
router.post('/',
  authenticate,
  authorize('paymentCompanies'),
  createPaymentCompany
);

// @route   PUT /api/payment-companies/:id
// @desc    Update payment company
// @access  Private
router.put('/:id',
  authenticate,
  authorize('paymentCompanies'),
  updatePaymentCompany
);

// @route   DELETE /api/payment-companies/:id
// @desc    Delete payment company
// @access  Private
router.delete('/:id',
  authenticate,
  authorize('paymentCompanies'),
  deletePaymentCompany
);

// @route   PATCH /api/payment-companies/:id/toggle-status
// @desc    Toggle payment company active status
// @access  Private
router.patch('/:id/toggle-status',
  authenticate,
  authorize('paymentCompanies'),
  togglePaymentCompanyStatus
);

// @route   GET /api/payment-companies/:id/stats
// @desc    Get payment company statistics
// @access  Private
router.get('/:id/stats',
  authenticate,
  authorize('paymentCompanies'),
  getPaymentCompanyStats
);

// @route   GET /api/payment-companies/:id/next-invoice-number
// @desc    Get next invoice number for payment company
// @access  Private
router.get('/:id/next-invoice-number',
  authenticate,
  authorize('createInvoice'),
  getNextInvoiceNumber
);

module.exports = router;