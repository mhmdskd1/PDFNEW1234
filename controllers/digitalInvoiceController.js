const { DigitalInvoice, Client } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');
const { sanitizeInput } = require('../utils/auth');

// @desc    Get all digital invoices
// @route   GET /api/digital-invoices
// @access  Private
const getDigitalInvoices = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    isPaid = '',
    client = '',
    dateFrom = '',
    dateTo = '',
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build filter object
  const filter = {};
  
  if (search) {
    filter.$or = [
      { invoiceNumber: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }
  
  if (isPaid !== '') {
    filter.isPaid = isPaid === 'true';
  }
  
  if (client) {
    filter['distribution.client'] = client;
  }
  
  if (dateFrom || dateTo) {
    filter.issueDate = {};
    if (dateFrom) filter.issueDate.$gte = new Date(dateFrom);
    if (dateTo) filter.issueDate.$lte = new Date(dateTo);
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Execute query with pagination
  const digitalInvoices = await DigitalInvoice.find(filter)
    .populate('distribution.client', 'name type')
    .populate('createdBy', 'fullName username')
    .populate('lastModifiedBy', 'fullName username')
    .sort(sort)
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

  const total = await DigitalInvoice.countDocuments(filter);
  const totalPages = Math.ceil(total / parseInt(limit));

  res.json({
    success: true,
    data: {
      digitalInvoices,
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

// @desc    Get single digital invoice
// @route   GET /api/digital-invoices/:id
// @access  Private
const getDigitalInvoice = asyncHandler(async (req, res) => {
  const digitalInvoice = await DigitalInvoice.findById(req.params.id)
    .populate('distribution.client', 'name type businessInfo')
    .populate('createdBy', 'fullName username')
    .populate('lastModifiedBy', 'fullName username');

  if (!digitalInvoice) {
    return res.status(404).json({
      success: false,
      message: 'الفاتورة الرقمية غير موجودة'
    });
  }

  res.json({
    success: true,
    data: { digitalInvoice }
  });
});

// @desc    Create new digital invoice
// @route   POST /api/digital-invoices
// @access  Private
const createDigitalInvoice = asyncHandler(async (req, res) => {
  const {
    baseAmount,
    vatRate = 21,
    description,
    distribution,
    notes
  } = req.body;

  // Validate distribution clients
  const clientIds = distribution
    .filter(dist => dist.client)
    .map(dist => dist.client);
    
  if (clientIds.length > 0) {
    const clients = await Client.find({ _id: { $in: clientIds } });
    if (clients.length !== clientIds.length) {
      return res.status(400).json({
        success: false,
        message: 'بعض عملاء التوزيع غير موجودين'
      });
    }
  }

  // Validate distribution percentages
  const totalPercentage = distribution.reduce((sum, dist) => sum + dist.percentage, 0);
  if (Math.abs(totalPercentage - 100) > 0.01) {
    return res.status(400).json({
      success: false,
      message: 'مجموع نسب التوزيع يجب أن يساوي 100%'
    });
  }

  // Generate invoice number
  const invoiceNumber = await DigitalInvoice.generateInvoiceNumber();

  // Sanitize inputs
  const sanitizedDescription = sanitizeInput(description);
  const sanitizedNotes = notes ? sanitizeInput(notes) : '';

  // Create digital invoice
  const digitalInvoiceData = {
    invoiceNumber,
    baseAmount,
    vatRate,
    description: sanitizedDescription,
    distribution,
    notes: sanitizedNotes,
    createdBy: req.user.id
  };

  const digitalInvoice = await DigitalInvoice.create(digitalInvoiceData);
  
  // Populate the created invoice
  await digitalInvoice.populate([
    { path: 'distribution.client', select: 'name type' },
    { path: 'createdBy', select: 'fullName username' }
  ]);

  res.status(201).json({
    success: true,
    message: 'تم إنشاء الفاتورة الرقمية بنجاح',
    data: { digitalInvoice }
  });
});

// @desc    Update digital invoice
// @route   PUT /api/digital-invoices/:id
// @access  Private
const updateDigitalInvoice = asyncHandler(async (req, res) => {
  let digitalInvoice = await DigitalInvoice.findById(req.params.id);

  if (!digitalInvoice) {
    return res.status(404).json({
      success: false,
      message: 'الفاتورة الرقمية غير موجودة'
    });
  }

  // Check if invoice is paid (can't edit paid invoices)
  if (digitalInvoice.isPaid) {
    return res.status(400).json({
      success: false,
      message: 'لا يمكن تعديل فاتورة رقمية مدفوعة'
    });
  }

  // Validate distribution if updated
  if (req.body.distribution) {
    const totalPercentage = req.body.distribution.reduce((sum, dist) => sum + dist.percentage, 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      return res.status(400).json({
        success: false,
        message: 'مجموع نسب التوزيع يجب أن يساوي 100%'
      });
    }
  }

  const updateData = {
    ...req.body,
    lastModifiedBy: req.user.id
  };

  // Sanitize inputs
  if (updateData.description) {
    updateData.description = sanitizeInput(updateData.description);
  }
  if (updateData.notes) {
    updateData.notes = sanitizeInput(updateData.notes);
  }

  digitalInvoice = await DigitalInvoice.findByIdAndUpdate(
    req.params.id,
    updateData,
    {
      new: true,
      runValidators: true
    }
  ).populate([
    { path: 'distribution.client', select: 'name type' },
    { path: 'createdBy', select: 'fullName username' },
    { path: 'lastModifiedBy', select: 'fullName username' }
  ]);

  res.json({
    success: true,
    message: 'تم تحديث الفاتورة الرقمية بنجاح',
    data: { digitalInvoice }
  });
});

// @desc    Delete digital invoice
// @route   DELETE /api/digital-invoices/:id
// @access  Private
const deleteDigitalInvoice = asyncHandler(async (req, res) => {
  const digitalInvoice = await DigitalInvoice.findById(req.params.id);

  if (!digitalInvoice) {
    return res.status(404).json({
      success: false,
      message: 'الفاتورة الرقمية غير موجودة'
    });
  }

  // Check if invoice is paid
  if (digitalInvoice.isPaid) {
    return res.status(400).json({
      success: false,
      message: 'لا يمكن حذف فاتورة رقمية مدفوعة'
    });
  }

  await DigitalInvoice.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'تم حذف الفاتورة الرقمية بنجاح'
  });
});

// @desc    Mark digital invoice as paid
// @route   PATCH /api/digital-invoices/:id/mark-paid
// @access  Private
const markAsPaid = asyncHandler(async (req, res) => {
  const digitalInvoice = await DigitalInvoice.findById(req.params.id)
    .populate('distribution.client', 'name type');

  if (!digitalInvoice) {
    return res.status(404).json({
      success: false,
      message: 'الفاتورة الرقمية غير موجودة'
    });
  }

  if (digitalInvoice.isPaid) {
    return res.status(400).json({
      success: false,
      message: 'الفاتورة مدفوعة بالفعل'
    });
  }

  // Mark as paid
  digitalInvoice.isPaid = true;
  digitalInvoice.paymentDate = new Date();
  await digitalInvoice.save();

  // TODO: Create account entries for profit distribution
  // This would be implemented when the Account system is fully integrated

  res.json({
    success: true,
    message: 'تم تسجيل الفاتورة كمدفوعة بنجاح',
    data: { digitalInvoice }
  });
});

// @desc    Mark digital invoice as unpaid
// @route   PATCH /api/digital-invoices/:id/mark-unpaid
// @access  Private
const markAsUnpaid = asyncHandler(async (req, res) => {
  const digitalInvoice = await DigitalInvoice.findById(req.params.id);

  if (!digitalInvoice) {
    return res.status(404).json({
      success: false,
      message: 'الفاتورة الرقمية غير موجودة'
    });
  }

  if (!digitalInvoice.isPaid) {
    return res.status(400).json({
      success: false,
      message: 'الفاتورة غير مدفوعة بالفعل'
    });
  }

  // Mark as unpaid
  digitalInvoice.isPaid = false;
  digitalInvoice.paymentDate = null;
  await digitalInvoice.save();

  res.json({
    success: true,
    message: 'تم تسجيل الفاتورة كغير مدفوعة بنجاح',
    data: { digitalInvoice }
  });
});

// @desc    Get digital invoice statistics
// @route   GET /api/digital-invoices/stats
// @access  Private
const getDigitalInvoiceStats = asyncHandler(async (req, res) => {
  const stats = await DigitalInvoice.aggregate([
    {
      $group: {
        _id: null,
        totalInvoices: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' },
        paidInvoices: {
          $sum: {
            $cond: [{ $eq: ['$isPaid', true] }, 1, 0]
          }
        },
        paidAmount: {
          $sum: {
            $cond: [
              { $eq: ['$isPaid', true] },
              '$totalAmount',
              0
            ]
          }
        },
        pendingInvoices: {
          $sum: {
            $cond: [{ $eq: ['$isPaid', false] }, 1, 0]
          }
        },
        pendingAmount: {
          $sum: {
            $cond: [
              { $eq: ['$isPaid', false] },
              '$totalAmount',
              0
            ]
          }
        }
      }
    }
  ]);

  const result = stats[0] || {
    totalInvoices: 0,
    totalAmount: 0,
    paidInvoices: 0,
    paidAmount: 0,
    pendingInvoices: 0,
    pendingAmount: 0
  };

  res.json({
    success: true,
    data: { stats: result }
  });
});

// @desc    Get profit distribution summary
// @route   GET /api/digital-invoices/profit-summary
// @access  Private
const getProfitSummary = asyncHandler(async (req, res) => {
  const { clientId = '', isPaid = '' } = req.query;

  const matchFilter = {};
  if (isPaid !== '') {
    matchFilter.isPaid = isPaid === 'true';
  }

  const pipeline = [
    { $match: matchFilter },
    { $unwind: '$distribution' }
  ];

  if (clientId) {
    pipeline.push({
      $match: { 'distribution.client': mongoose.Types.ObjectId(clientId) }
    });
  }

  pipeline.push(
    {
      $group: {
        _id: {
          type: '$distribution.type',
          client: '$distribution.client',
          name: '$distribution.name'
        },
        totalAmount: { $sum: '$distribution.amount' },
        totalPercentage: { $avg: '$distribution.percentage' },
        invoiceCount: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'clients',
        localField: '_id.client',
        foreignField: '_id',
        as: 'clientInfo'
      }
    },
    {
      $sort: { '_id.type': 1, totalAmount: -1 }
    }
  );

  const summary = await DigitalInvoice.aggregate(pipeline);

  res.json({
    success: true,
    data: { profitSummary: summary }
  });
});

module.exports = {
  getDigitalInvoices,
  getDigitalInvoice,
  createDigitalInvoice,
  updateDigitalInvoice,
  deleteDigitalInvoice,
  markAsPaid,
  markAsUnpaid,
  getDigitalInvoiceStats,
  getProfitSummary
};