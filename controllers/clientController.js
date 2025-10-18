const { Client } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');
const { sanitizeInput } = require('../utils/auth');

// @desc    Get all clients
// @route   GET /api/clients
// @access  Private
const getClients = asyncHandler(async (req, res) => {
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
      { 'businessInfo.companyName': { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
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
  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort,
    populate: {
      path: 'createdBy',
      select: 'fullName username'
    }
  };

  const clients = await Client.find(filter)
    .populate('createdBy', 'fullName username')
    .sort(sort)
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

  const total = await Client.countDocuments(filter);
  const totalPages = Math.ceil(total / parseInt(limit));

  res.json({
    success: true,
    data: {
      clients,
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

// @desc    Get single client
// @route   GET /api/clients/:id
// @access  Private
const getClient = asyncHandler(async (req, res) => {
  const client = await Client.findById(req.params.id)
    .populate('createdBy', 'fullName username');

  if (!client) {
    return res.status(404).json({
      success: false,
      message: 'العميل غير موجود'
    });
  }

  res.json({
    success: true,
    data: { client }
  });
});

// @desc    Create new client
// @route   POST /api/clients
// @access  Private
const createClient = asyncHandler(async (req, res) => {
  const clientData = {
    ...req.body,
    createdBy: req.user.id
  };

  // Sanitize inputs
  if (clientData.name) clientData.name = sanitizeInput(clientData.name);
  if (clientData.email) clientData.email = sanitizeInput(clientData.email);
  
  const client = await Client.create(clientData);
  
  await client.populate('createdBy', 'fullName username');

  res.status(201).json({
    success: true,
    message: 'تم إضافة العميل بنجاح',
    data: { client }
  });
});

// @desc    Update client
// @route   PUT /api/clients/:id
// @access  Private
const updateClient = asyncHandler(async (req, res) => {
  let client = await Client.findById(req.params.id);

  if (!client) {
    return res.status(404).json({
      success: false,
      message: 'العميل غير موجود'
    });
  }

  // Sanitize inputs
  const updateData = { ...req.body };
  if (updateData.name) updateData.name = sanitizeInput(updateData.name);
  if (updateData.email) updateData.email = sanitizeInput(updateData.email);

  client = await Client.findByIdAndUpdate(
    req.params.id,
    updateData,
    {
      new: true,
      runValidators: true
    }
  ).populate('createdBy', 'fullName username');

  res.json({
    success: true,
    message: 'تم تحديث بيانات العميل بنجاح',
    data: { client }
  });
});

// @desc    Delete client
// @route   DELETE /api/clients/:id
// @access  Private
const deleteClient = asyncHandler(async (req, res) => {
  const client = await Client.findById(req.params.id);

  if (!client) {
    return res.status(404).json({
      success: false,
      message: 'العميل غير موجود'
    });
  }

  // Check if client has associated invoices
  const { Invoice, DigitalInvoice } = require('../models');
  const [pdfInvoices, digitalInvoices] = await Promise.all([
    Invoice.countDocuments({ client: req.params.id }),
    DigitalInvoice.countDocuments({ 'distribution.client': req.params.id })
  ]);

  if (pdfInvoices > 0 || digitalInvoices > 0) {
    return res.status(400).json({
      success: false,
      message: 'لا يمكن حذف العميل لأنه مرتبط بفواتير موجودة'
    });
  }

  await Client.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'تم حذف العميل بنجاح'
  });
});

// @desc    Toggle client active status
// @route   PATCH /api/clients/:id/toggle-status
// @access  Private
const toggleClientStatus = asyncHandler(async (req, res) => {
  const client = await Client.findById(req.params.id);

  if (!client) {
    return res.status(404).json({
      success: false,
      message: 'العميل غير موجود'
    });
  }

  client.isActive = !client.isActive;
  await client.save();

  res.json({
    success: true,
    message: client.isActive ? 
      'تم تفعيل العميل بنجاح' : 
      'تم إلغاء تفعيل العميل بنجاح',
    data: {
      client: {
        id: client._id,
        name: client.name,
        isActive: client.isActive
      }
    }
  });
});

// @desc    Get client statistics
// @route   GET /api/clients/:id/stats
// @access  Private
const getClientStats = asyncHandler(async (req, res) => {
  const clientId = req.params.id;
  
  const client = await Client.findById(clientId);
  if (!client) {
    return res.status(404).json({
      success: false,
      message: 'العميل غير موجود'
    });
  }

  const { Invoice, DigitalInvoice } = require('../models');
  
  // Get PDF invoices stats
  const pdfStats = await Invoice.aggregate([
    { $match: { client: client._id } },
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

  // Get digital invoices stats
  const digitalStats = await DigitalInvoice.aggregate([
    { $match: { 'distribution.client': client._id } },
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
        pendingInvoices: {
          $sum: {
            $cond: [{ $eq: ['$isPaid', false] }, 1, 0]
          }
        }
      }
    }
  ]);

  const pdf = pdfStats[0] || { totalInvoices: 0, totalAmount: 0, paidAmount: 0, pendingInvoices: 0, partialInvoices: 0, paidInvoices: 0 };
  const digital = digitalStats[0] || { totalInvoices: 0, totalAmount: 0, paidInvoices: 0, pendingInvoices: 0 };

  res.json({
    success: true,
    data: {
      client: {
        id: client._id,
        name: client.name,
        type: client.type
      },
      stats: {
        pdf,
        digital,
        combined: {
          totalInvoices: pdf.totalInvoices + digital.totalInvoices,
          totalAmount: pdf.totalAmount + digital.totalAmount,
          paidAmount: pdf.paidAmount + (digital.paidInvoices * digital.totalAmount / (digital.totalInvoices || 1)),
          pendingInvoices: pdf.pendingInvoices + digital.pendingInvoices,
          paidInvoices: pdf.paidInvoices + digital.paidInvoices
        }
      }
    }
  });
});

// @desc    Get clients for dropdown/select
// @route   GET /api/clients/dropdown
// @access  Private
const getClientsDropdown = asyncHandler(async (req, res) => {
  const { type = '', activeOnly = 'true' } = req.query;
  
  const filter = {};
  if (type) filter.type = type;
  if (activeOnly === 'true') filter.isActive = true;

  const clients = await Client.find(filter)
    .select('_id name type businessInfo.companyName')
    .sort({ name: 1 });

  res.json({
    success: true,
    data: { clients }
  });
});

module.exports = {
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  toggleClientStatus,
  getClientStats,
  getClientsDropdown
};