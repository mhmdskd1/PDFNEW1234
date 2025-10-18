const { PaymentCompany } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');
const { sanitizeInput } = require('../utils/auth');

// @desc    Get all payment companies
// @route   GET /api/payment-companies
// @access  Private
const getPaymentCompanies = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    type = '',
    isActive = '',
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build filter object
  const filter = {};
  
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { defaultIban: { $regex: search, $options: 'i' } },
      { 'contactInfo.email': { $regex: search, $options: 'i' } }
    ];
  }
  
  if (type) {
    filter.type = type;
  }
  
  if (isActive !== '') {
    filter.isActive = isActive === 'true';
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Execute query with pagination
  const paymentCompanies = await PaymentCompany.find(filter)
    .populate('createdBy', 'fullName username')
    .sort(sort)
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

  const total = await PaymentCompany.countDocuments(filter);
  const totalPages = Math.ceil(total / parseInt(limit));

  res.json({
    success: true,
    data: {
      paymentCompanies,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      }
    }
  });
});

// @desc    Get single payment company
// @route   GET /api/payment-companies/:id
// @access  Private
const getPaymentCompany = asyncHandler(async (req, res) => {
  const paymentCompany = await PaymentCompany.findById(req.params.id)
    .populate('createdBy', 'fullName username');

  if (!paymentCompany) {
    return res.status(404).json({
      success: false,
      message: 'شركة الدفع غير موجودة'
    });
  }

  res.json({
    success: true,
    data: { paymentCompany }
  });
});

// @desc    Create new payment company
// @route   POST /api/payment-companies
// @access  Private
const createPaymentCompany = asyncHandler(async (req, res) => {
  const paymentCompanyData = {
    ...req.body,
    createdBy: req.user.id
  };

  // Sanitize inputs
  if (paymentCompanyData.name) {
    paymentCompanyData.name = sanitizeInput(paymentCompanyData.name);
  }
  if (paymentCompanyData.defaultIban) {
    paymentCompanyData.defaultIban = sanitizeInput(paymentCompanyData.defaultIban);
  }
  if (paymentCompanyData.contactInfo?.email) {
    paymentCompanyData.contactInfo.email = sanitizeInput(paymentCompanyData.contactInfo.email);
  }

  // Format IBAN (remove spaces and convert to uppercase)
  if (paymentCompanyData.defaultIban) {
    paymentCompanyData.defaultIban = paymentCompanyData.defaultIban
      .replace(/\s/g, '')
      .toUpperCase();
  }

  const paymentCompany = await PaymentCompany.create(paymentCompanyData);
  await paymentCompany.populate('createdBy', 'fullName username');

  res.status(201).json({
    success: true,
    message: 'تم إضافة شركة الدفع بنجاح',
    data: { paymentCompany }
  });
});

// @desc    Update payment company
// @route   PUT /api/payment-companies/:id
// @access  Private
const updatePaymentCompany = asyncHandler(async (req, res) => {
  let paymentCompany = await PaymentCompany.findById(req.params.id);

  if (!paymentCompany) {
    return res.status(404).json({
      success: false,
      message: 'شركة الدفع غير موجودة'
    });
  }

  // Sanitize inputs
  const updateData = { ...req.body };
  if (updateData.name) {
    updateData.name = sanitizeInput(updateData.name);
  }
  if (updateData.defaultIban) {
    updateData.defaultIban = sanitizeInput(updateData.defaultIban)
      .replace(/\s/g, '')
      .toUpperCase();
  }
  if (updateData.contactInfo?.email) {
    updateData.contactInfo.email = sanitizeInput(updateData.contactInfo.email);
  }

  paymentCompany = await PaymentCompany.findByIdAndUpdate(
    req.params.id,
    updateData,
    {
      new: true,
      runValidators: true
    }
  ).populate('createdBy', 'fullName username');

  res.json({
    success: true,
    message: 'تم تحديث بيانات شركة الدفع بنجاح',
    data: { paymentCompany }
  });
});

// @desc    Delete payment company
// @route   DELETE /api/payment-companies/:id
// @access  Private
const deletePaymentCompany = asyncHandler(async (req, res) => {
  const paymentCompany = await PaymentCompany.findById(req.params.id);

  if (!paymentCompany) {
    return res.status(404).json({
      success: false,
      message: 'شركة الدفع غير موجودة'
    });
  }

  // Check if payment company has associated invoices
  const { Invoice } = require('../models');
  const invoiceCount = await Invoice.countDocuments({ paymentCompany: req.params.id });

  if (invoiceCount > 0) {
    return res.status(400).json({
      success: false,
      message: 'لا يمكن حذف شركة الدفع لأنها مرتبطة بفواتير موجودة'
    });
  }

  await PaymentCompany.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'تم حذف شركة الدفع بنجاح'
  });
});

// @desc    Toggle payment company active status
// @route   PATCH /api/payment-companies/:id/toggle-status
// @access  Private
const togglePaymentCompanyStatus = asyncHandler(async (req, res) => {
  const paymentCompany = await PaymentCompany.findById(req.params.id);

  if (!paymentCompany) {
    return res.status(404).json({
      success: false,
      message: 'شركة الدفع غير موجودة'
    });
  }

  paymentCompany.isActive = !paymentCompany.isActive;
  await paymentCompany.save();

  res.json({
    success: true,
    message: paymentCompany.isActive ? 
      'تم تفعيل شركة الدفع بنجاح' : 
      'تم إلغاء تفعيل شركة الدفع بنجاح',
    data: {
      paymentCompany: {
        id: paymentCompany._id,
        name: paymentCompany.name,
        isActive: paymentCompany.isActive
      }
    }
  });
});

// @desc    Get payment company statistics
// @route   GET /api/payment-companies/:id/stats
// @access  Private
const getPaymentCompanyStats = asyncHandler(async (req, res) => {
  const paymentCompanyId = req.params.id;
  
  const paymentCompany = await PaymentCompany.findById(paymentCompanyId);
  if (!paymentCompany) {
    return res.status(404).json({
      success: false,
      message: 'شركة الدفع غير موجودة'
    });
  }

  const { Invoice } = require('../models');
  
  // Get payment company invoice stats
  const stats = await Invoice.aggregate([
    { $match: { paymentCompany: paymentCompany._id } },
    {
      $group: {
        _id: null,
        totalInvoices: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' },
        paidAmount: { $sum: '$paidAmount' },
        pendingInvoices: {
          $sum: {
            $cond: [{ $eq: ['$paymentStatus', 'pending'] }, 1, 0]
          }
        },
        partialInvoices: {
          $sum: {
            $cond: [{ $eq: ['$paymentStatus', 'partial'] }, 1, 0]
          }
        },
        paidInvoices: {
          $sum: {
            $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0]
          }
        }
      }
    }
  ]);

  const result = stats[0] || {
    totalInvoices: 0,
    totalAmount: 0,
    paidAmount: 0,
    pendingInvoices: 0,
    partialInvoices: 0,
    paidInvoices: 0
  };

  res.json({
    success: true,
    data: {
      paymentCompany: {
        id: paymentCompany._id,
        name: paymentCompany.name,
        defaultIban: paymentCompany.defaultIban
      },
      stats: result
    }
  });
});

// @desc    Get payment companies for dropdown/select
// @route   GET /api/payment-companies/dropdown
// @access  Private
const getPaymentCompaniesDropdown = asyncHandler(async (req, res) => {
  const { activeOnly = 'true', type = '' } = req.query;
  
  const filter = {};
  if (activeOnly === 'true') filter.isActive = true;
  if (type) filter.type = type;

  const paymentCompanies = await PaymentCompany.find(filter)
    .select('_id name defaultIban type invoiceNumbering')
    .sort({ name: 1 });

  res.json({
    success: true,
    data: { paymentCompanies }
  });
});

// @desc    Get next invoice number for payment company
// @route   GET /api/payment-companies/:id/next-invoice-number
// @access  Private
const getNextInvoiceNumber = asyncHandler(async (req, res) => {
  const paymentCompany = await PaymentCompany.findById(req.params.id);

  if (!paymentCompany) {
    return res.status(404).json({
      success: false,
      message: 'شركة الدفع غير موجودة'
    });
  }

  const nextInvoiceNumber = paymentCompany.getNextInvoiceNumber();
  
  // Don't save yet - just preview
  res.json({
    success: true,
    data: {
      nextInvoiceNumber,
      currentNumber: paymentCompany.invoiceNumbering.currentNumber,
      format: paymentCompany.invoiceNumbering.format
    }
  });
});

module.exports = {
  getPaymentCompanies,
  getPaymentCompany,
  createPaymentCompany,
  updatePaymentCompany,
  deletePaymentCompany,
  togglePaymentCompanyStatus,
  getPaymentCompanyStats,
  getPaymentCompaniesDropdown,
  getNextInvoiceNumber
};