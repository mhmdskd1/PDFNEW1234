const express = require('express');
const {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  generatePDF,
  downloadPDF,
  sendEmail
} = require('../controllers/invoiceController');
const {
  authenticate,
  authorize
} = require('../middleware/auth');
const {
  validate,
  invoiceSchemas
} = require('../middleware/validation');
const {
  pdfLimiter,
  uploadLimiter
} = require('../middleware/rateLimiter');

const router = express.Router();

// @route   GET /api/invoices
// @desc    Get all invoices
// @access  Private
router.get('/',
  authenticate,
  authorize('createInvoice'),
  getInvoices
);

// @route   GET /api/invoices/:id
// @desc    Get single invoice
// @access  Private
router.get('/:id',
  authenticate,
  authorize('createInvoice'),
  getInvoice
);

// @route   POST /api/invoices
// @desc    Create new invoice
// @access  Private
router.post('/',
  authenticate,
  authorize('createInvoice'),
  validate(invoiceSchemas.create),
  createInvoice
);

// @route   PUT /api/invoices/:id
// @desc    Update invoice
// @access  Private
router.put('/:id',
  authenticate,
  authorize('createInvoice'),
  updateInvoice
);

// @route   DELETE /api/invoices/:id
// @desc    Delete invoice
// @access  Private
router.delete('/:id',
  authenticate,
  authorize('createInvoice'),
  deleteInvoice
);

// @route   POST /api/invoices/:id/generate-pdf
// @desc    Generate PDF for invoice
// @access  Private
router.post('/:id/generate-pdf',
  pdfLimiter,
  authenticate,
  authorize('createInvoice'),
  generatePDF
);

// @route   GET /api/invoices/:id/download
// @desc    Download invoice PDF
// @access  Private
router.get('/:id/download',
  authenticate,
  authorize('createInvoice'),
  downloadPDF
);

// @route   POST /api/invoices/:id/send-email
// @desc    Send invoice via email
// @access  Private
router.post('/:id/send-email',
  uploadLimiter,
  authenticate,
  authorize('createInvoice'),
  sendEmail
);

module.exports = router;