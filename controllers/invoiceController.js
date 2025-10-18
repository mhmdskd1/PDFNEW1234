const { Invoice, Template, Company, Client, PaymentCompany } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');
const pdfService = require('../services/pdfService');
const emailService = require('../services/emailService');
const fileService = require('../services/fileService');

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private
const getInvoices = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    status = '',
    company = '',
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
      { notes: { $regex: search, $options: 'i' } }
    ];
  }
  
  if (status) {
    filter.paymentStatus = status;
  }
  
  if (company) {
    filter.company = company;
  }
  
  if (client) {
    filter.client = client;
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
  const invoices = await Invoice.find(filter)
    .populate('company', 'name contactInfo address')
    .populate('client', 'name type businessInfo')
    .populate('paymentCompany', 'name defaultIban')
    .populate('template', 'name')
    .populate('createdBy', 'fullName username')
    .sort(sort)
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

  const total = await Invoice.countDocuments(filter);
  const totalPages = Math.ceil(total / parseInt(limit));

  res.json({
    success: true,
    data: {
      invoices,
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

// @desc    Get single invoice
// @route   GET /api/invoices/:id
// @access  Private
const getInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id)
    .populate('company')
    .populate('client')
    .populate('paymentCompany')
    .populate('template')
    .populate('createdBy', 'fullName username')
    .populate('lastModifiedBy', 'fullName username');

  if (!invoice) {
    return res.status(404).json({
      success: false,
      message: 'الفاتورة غير موجودة'
    });
  }

  res.json({
    success: true,
    data: { invoice }
  });
});

// @desc    Create new invoice
// @route   POST /api/invoices
// @access  Private
const createInvoice = asyncHandler(async (req, res) => {
  const {
    template: templateId,
    company: companyId,
    paymentCompany: paymentCompanyId,
    client: clientId,
    items,
    profitDistribution,
    dueDate,
    notes,
    logo
  } = req.body;

  // Validate required references
  const [template, company, paymentCompany, client] = await Promise.all([
    Template.findById(templateId),
    Company.findById(companyId),
    PaymentCompany.findById(paymentCompanyId),
    Client.findById(clientId)
  ]);

  if (!template || !company || !paymentCompany || !client) {
    return res.status(400).json({
      success: false,
      message: 'بيانات مرجعية غير صحيحة'
    });
  }

  // Calculate totals
  let subtotal = 0;
  let vatAmount = 0;
  
  const processedItems = items.map(item => {
    const totalPrice = item.quantity * item.unitPrice;
    const itemVat = (totalPrice * item.vatRate) / 100;
    
    subtotal += totalPrice;
    vatAmount += itemVat;
    
    return {
      ...item,
      totalPrice
    };
  });

  const totalAmount = subtotal + vatAmount;

  // Generate invoice number
  const invoiceNumber = paymentCompany.getNextInvoiceNumber();
  await paymentCompany.save(); // Save the updated counter

  // Create invoice
  const invoiceData = {
    invoiceNumber,
    template: templateId,
    company: companyId,
    paymentCompany: paymentCompanyId,
    client: clientId,
    items: processedItems,
    subtotal,
    vatAmount,
    totalAmount,
    profitDistribution,
    dueDate: new Date(dueDate),
    notes,
    logo,
    createdBy: req.user.id
  };

  const invoice = await Invoice.create(invoiceData);
  
  // Populate the created invoice
  await invoice.populate([
    { path: 'company' },
    { path: 'client' },
    { path: 'paymentCompany' },
    { path: 'template' },
    { path: 'createdBy', select: 'fullName username' }
  ]);

  res.status(201).json({
    success: true,
    message: 'تم إنشاء الفاتورة بنجاح',
    data: { invoice }
  });
});

// @desc    Update invoice
// @route   PUT /api/invoices/:id
// @access  Private
const updateInvoice = asyncHandler(async (req, res) => {
  let invoice = await Invoice.findById(req.params.id);

  if (!invoice) {
    return res.status(404).json({
      success: false,
      message: 'الفاتورة غير موجودة'
    });
  }

  // Check if invoice is paid (can't edit paid invoices)
  if (invoice.paymentStatus === 'paid') {
    return res.status(400).json({
      success: false,
      message: 'لا يمكن تعديل فاتورة مدفوعة بالكامل'
    });
  }

  const updateData = {
    ...req.body,
    lastModifiedBy: req.user.id
  };

  // Recalculate totals if items are updated
  if (req.body.items) {
    let subtotal = 0;
    let vatAmount = 0;
    
    const processedItems = req.body.items.map(item => {
      const totalPrice = item.quantity * item.unitPrice;
      const itemVat = (totalPrice * item.vatRate) / 100;
      
      subtotal += totalPrice;
      vatAmount += itemVat;
      
      return {
        ...item,
        totalPrice
      };
    });

    updateData.items = processedItems;
    updateData.subtotal = subtotal;
    updateData.vatAmount = vatAmount;
    updateData.totalAmount = subtotal + vatAmount;
  }

  invoice = await Invoice.findByIdAndUpdate(
    req.params.id,
    updateData,
    {
      new: true,
      runValidators: true
    }
  ).populate([
    { path: 'company' },
    { path: 'client' },
    { path: 'paymentCompany' },
    { path: 'template' },
    { path: 'createdBy', select: 'fullName username' },
    { path: 'lastModifiedBy', select: 'fullName username' }
  ]);

  res.json({
    success: true,
    message: 'تم تحديث الفاتورة بنجاح',
    data: { invoice }
  });
});

// @desc    Delete invoice
// @route   DELETE /api/invoices/:id
// @access  Private
const deleteInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);

  if (!invoice) {
    return res.status(404).json({
      success: false,
      message: 'الفاتورة غير موجودة'
    });
  }

  // Check if invoice has payments
  if (invoice.paidAmount > 0) {
    return res.status(400).json({
      success: false,
      message: 'لا يمكن حذف فاتورة تم دفع جزء منها'
    });
  }

  // Delete PDF file if exists
  if (invoice.pdfPath) {
    try {
      await fileService.deleteFile(invoice.pdfPath);
    } catch (error) {
      console.warn('تحذير: فشل في حذف ملف PDF:', error.message);
    }
  }

  await Invoice.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'تم حذف الفاتورة بنجاح'
  });
});

// @desc    Generate PDF for invoice
// @route   POST /api/invoices/:id/generate-pdf
// @access  Private
const generatePDF = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id)
    .populate('company')
    .populate('client')
    .populate('paymentCompany')
    .populate('template');

  if (!invoice) {
    return res.status(404).json({
      success: false,
      message: 'الفاتورة غير موجودة'
    });
  }

  try {
    const pdfResult = await pdfService.generateInvoicePDF(invoice, invoice.template._id);
    
    // Update invoice with PDF info
    invoice.pdfPath = pdfResult.filepath;
    invoice.fileSize = pdfResult.fileSize;
    await invoice.save();

    res.json({
      success: true,
      message: 'تم إنشاء ملف PDF بنجاح',
      data: {
        pdfPath: pdfResult.filepath,
        filename: pdfResult.filename,
        fileSize: pdfResult.fileSize,
        downloadUrl: `/api/invoices/${invoice._id}/download`
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'فشل في إنشاء ملف PDF',
      error: error.message
    });
  }
});

// @desc    Download invoice PDF
// @route   GET /api/invoices/:id/download
// @access  Private
const downloadPDF = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);

  if (!invoice) {
    return res.status(404).json({
      success: false,
      message: 'الفاتورة غير موجودة'
    });
  }

  if (!invoice.pdfPath) {
    return res.status(404).json({
      success: false,
      message: 'ملف PDF غير موجود. يرجى إنشاء الملف أولاً'
    });
  }

  try {
    const fileInfo = await fileService.getFileInfo(invoice.pdfPath);
    
    if (!fileInfo.exists) {
      return res.status(404).json({
        success: false,
        message: 'ملف PDF غير موجود'
      });
    }

    res.download(invoice.pdfPath, `invoice-${invoice.invoiceNumber}.pdf`);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'فشل في تحميل الملف',
      error: error.message
    });
  }
});

// @desc    Send invoice via email
// @route   POST /api/invoices/:id/send-email
// @access  Private
const sendEmail = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id)
    .populate('company');

  if (!invoice) {
    return res.status(404).json({
      success: false,
      message: 'الفاتورة غير موجودة'
    });
  }

  if (!invoice.pdfPath) {
    return res.status(400).json({
      success: false,
      message: 'يجب إنشاء ملف PDF أولاً'
    });
  }

  try {
    const result = await emailService.sendInvoiceEmail(invoice, invoice.pdfPath);
    
    if (result.success) {
      invoice.emailSent = true;
      invoice.emailSentDate = new Date();
      await invoice.save();
    }

    res.json({
      success: result.success,
      message: result.message,
      data: result.success ? { messageId: result.messageId } : null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'فشل في إرسال البريد',
      error: error.message
    });
  }
});

module.exports = {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  generatePDF,
  downloadPDF,
  sendEmail
};