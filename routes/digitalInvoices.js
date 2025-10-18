const express = require('express');
const {
  getDigitalInvoices,
  getDigitalInvoice,
  createDigitalInvoice,
  updateDigitalInvoice,
  deleteDigitalInvoice,
  markAsPaid,
  markAsUnpaid,
  getDigitalInvoiceStats,
  getProfitSummary
} = require('../controllers/digitalInvoiceController');
const {
  authenticate,
  authorize
} = require('../middleware/auth');
const {
  validate,
  digitalInvoiceSchemas
} = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/digital-invoices/stats
// @desc    Get digital invoice statistics
// @access  Private
router.get('/stats',
  authenticate,
  authorize('createDigitalInvoice'),
  getDigitalInvoiceStats
);

// @route   GET /api/digital-invoices/profit-summary
// @desc    Get profit distribution summary
// @access  Private
router.get('/profit-summary',
  authenticate,
  authorize('createDigitalInvoice'),
  getProfitSummary
);

// @route   GET /api/digital-invoices
// @desc    Get all digital invoices
// @access  Private
router.get('/',
  authenticate,
  authorize('createDigitalInvoice'),
  getDigitalInvoices
);

// @route   GET /api/digital-invoices/:id
// @desc    Get single digital invoice
// @access  Private
router.get('/:id',
  authenticate,
  authorize('createDigitalInvoice'),
  getDigitalInvoice
);

// @route   POST /api/digital-invoices
// @desc    Create new digital invoice
// @access  Private
router.post('/',
  authenticate,
  authorize('createDigitalInvoice'),
  validate(digitalInvoiceSchemas.create),
  createDigitalInvoice
);

// @route   PUT /api/digital-invoices/:id
// @desc    Update digital invoice
// @access  Private
router.put('/:id',
  authenticate,
  authorize('createDigitalInvoice'),
  updateDigitalInvoice
);

// @route   DELETE /api/digital-invoices/:id
// @desc    Delete digital invoice
// @access  Private
router.delete('/:id',
  authenticate,
  authorize('createDigitalInvoice'),
  deleteDigitalInvoice
);

// @route   PATCH /api/digital-invoices/:id/mark-paid
// @desc    Mark digital invoice as paid
// @access  Private
router.patch('/:id/mark-paid',
  authenticate,
  authorize('accounts'),
  markAsPaid
);

// @route   PATCH /api/digital-invoices/:id/mark-unpaid
// @desc    Mark digital invoice as unpaid
// @access  Private
router.patch('/:id/mark-unpaid',
  authenticate,
  authorize('accounts'),
  markAsUnpaid
);

module.exports = router;