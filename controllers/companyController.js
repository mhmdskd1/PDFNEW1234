const { Company } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');
const { sanitizeInput } = require('../utils/auth');
const validationService = require('../services/validationService');

// @desc    Get all companies
// @route   GET /api/companies
// @access  Private
const getCompanies = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    country = '',
    isActive = '',
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build filter object
  const filter = {};
  
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { 'contactInfo.email': { $regex: search, $options: 'i' } },
      { 'businessInfo.btwNumber': { $regex: search, $options: 'i' } },
      { 'businessInfo.kvkNumber': { $regex: search, $options: 'i' } }
    ];
  }
  
  if (country) {
    filter['address.country'] = country;
  }
  
  if (isActive !== '') {
    filter.isActive = isActive === 'true';
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Execute query with pagination
  const companies = await Company.find(filter)
    .populate('createdBy', 'fullName username')
    .populate('invoiceSettings.defaultTemplate', 'name')
    .sort(sort)
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

  const total = await Company.countDocuments(filter);
  const totalPages = Math.ceil(total / parseInt(limit));

  res.json({
    success: true,
    data: {
      companies,
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

// @desc    Get single company
// @route   GET /api/companies/:id
// @access  Private
const getCompany = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.params.id)
    .populate('createdBy', 'fullName username')
    .populate('invoiceSettings.defaultTemplate', 'name description');

  if (!company) {
    return res.status(404).json({
      success: false,
      message: 'الشركة غير موجودة'
    });
  }

  res.json({
    success: true,
    data: { company }
  });
});

// @desc    Create new company
// @route   POST /api/companies
// @access  Private
const createCompany = asyncHandler(async (req, res) => {
  const companyData = {
    ...req.body,
    createdBy: req.user.id
  };

  // Sanitize inputs
  if (companyData.name) companyData.name = sanitizeInput(companyData.name);
  if (companyData.contactInfo?.email) {
    companyData.contactInfo.email = sanitizeInput(companyData.contactInfo.email);
  }

  const company = await Company.create(companyData);
  await company.populate('createdBy', 'fullName username');

  res.status(201).json({
    success: true,
    message: 'تم إضافة الشركة بنجاح',
    data: { company }
  });
});

// @desc    Update company
// @route   PUT /api/companies/:id
// @access  Private
const updateCompany = asyncHandler(async (req, res) => {
  let company = await Company.findById(req.params.id);

  if (!company) {
    return res.status(404).json({
      success: false,
      message: 'الشركة غير موجودة'
    });
  }

  // Sanitize inputs
  const updateData = { ...req.body };
  if (updateData.name) updateData.name = sanitizeInput(updateData.name);
  if (updateData.contactInfo?.email) {
    updateData.contactInfo.email = sanitizeInput(updateData.contactInfo.email);
  }

  company = await Company.findByIdAndUpdate(
    req.params.id,
    updateData,
    {
      new: true,
      runValidators: true
    }
  ).populate('createdBy', 'fullName username')
   .populate('invoiceSettings.defaultTemplate', 'name description');

  res.json({
    success: true,
    message: 'تم تحديث بيانات الشركة بنجاح',
    data: { company }
  });
});

// @desc    Delete company
// @route   DELETE /api/companies/:id
// @access  Private
const deleteCompany = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.params.id);

  if (!company) {
    return res.status(404).json({
      success: false,
      message: 'الشركة غير موجودة'
    });
  }

  // Check if company has associated invoices
  const { Invoice } = require('../models');
  const invoiceCount = await Invoice.countDocuments({ company: req.params.id });

  if (invoiceCount > 0) {
    return res.status(400).json({
      success: false,
      message: 'لا يمكن حذف الشركة لأنها مرتبطة بفواتير موجودة'
    });
  }

  await Company.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'تم حذف الشركة بنجاح'
  });
});

// @desc    Toggle company active status
// @route   PATCH /api/companies/:id/toggle-status
// @access  Private
const toggleCompanyStatus = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.params.id);

  if (!company) {
    return res.status(404).json({
      success: false,
      message: 'الشركة غير موجودة'
    });
  }

  company.isActive = !company.isActive;
  await company.save();

  res.json({
    success: true,
    message: company.isActive ? 
      'تم تفعيل الشركة بنجاح' : 
      'تم إلغاء تفعيل الشركة بنجاح',
    data: {
      company: {
        id: company._id,
        name: company.name,
        isActive: company.isActive
      }
    }
  });
});

// @desc    Validate company (BTW and KVK)
// @route   POST /api/companies/:id/validate
// @access  Private
const validateCompany = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.params.id);

  if (!company) {
    return res.status(404).json({
      success: false,
      message: 'الشركة غير موجودة'
    });
  }

  let validationResult;

  if (company.address.country === 'Netherlands') {
    // Validate Dutch company
    validationResult = await validationService.validateDutchCompany(
      company.businessInfo.btwNumber,
      company.businessInfo.kvkNumber
    );

    // Update validation status
    if (validationResult.btw?.isValid) {
      company.businessInfo.isValidated.btw = true;
      company.businessInfo.validationDate.btw = new Date();
    }

    if (validationResult.kvk?.isValid) {
      company.businessInfo.isValidated.kvk = true;
      company.businessInfo.validationDate.kvk = new Date();
    }
  } else {
    // Validate non-Dutch company
    validationResult = await validationService.validateNonDutchCompany({
      name: company.name,
      country: company.address.country,
      email: company.contactInfo.email
    });
  }

  await company.save();

  res.json({
    success: true,
    message: 'تم التحقق من بيانات الشركة',
    data: {
      validation: validationResult,
      company: {
        id: company._id,
        name: company.name,
        businessInfo: company.businessInfo
      }
    }
  });
});

// @desc    Get company statistics
// @route   GET /api/companies/:id/stats
// @access  Private
const getCompanyStats = asyncHandler(async (req, res) => {
  const companyId = req.params.id;
  
  const company = await Company.findById(companyId);
  if (!company) {
    return res.status(404).json({
      success: false,
      message: 'الشركة غير موجودة'
    });
  }

  const { Invoice } = require('../models');
  
  // Get company invoice stats
  const stats = await Invoice.aggregate([
    { $match: { company: company._id } },
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
      company: {
        id: company._id,
        name: company.name,
        country: company.address.country
      },
      stats: result
    }
  });
});

// @desc    Get companies for dropdown/select
// @route   GET /api/companies/dropdown
// @access  Private
const getCompaniesDropdown = asyncHandler(async (req, res) => {
  const { activeOnly = 'true', country = '' } = req.query;
  
  const filter = {};
  if (activeOnly === 'true') filter.isActive = true;
  if (country) filter['address.country'] = country;

  const companies = await Company.find(filter)
    .select('_id name address.country contactInfo.email')
    .sort({ name: 1 });

  res.json({
    success: true,
    data: { companies }
  });
});

module.exports = {
  getCompanies,
  getCompany,
  createCompany,
  updateCompany,
  deleteCompany,
  toggleCompanyStatus,
  validateCompany,
  getCompanyStats,
  getCompaniesDropdown
};