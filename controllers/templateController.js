const { Template } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');
const { sanitizeInput } = require('../utils/auth');
const pdfService = require('../services/pdfService');

// @desc    Get all templates
// @route   GET /api/templates
// @access  Private
const getTemplates = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    language = '',
    isActive = '',
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build filter object
  const filter = {};
  
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }
  
  if (language) {
    filter.language = language;
  }
  
  if (isActive !== '') {
    filter.isActive = isActive === 'true';
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Execute query with pagination
  const templates = await Template.find(filter)
    .populate('createdBy', 'fullName username')
    .sort(sort)
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

  const total = await Template.countDocuments(filter);
  const totalPages = Math.ceil(total / parseInt(limit));

  res.json({
    success: true,
    data: {
      templates,
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

// @desc    Get single template
// @route   GET /api/templates/:id
// @access  Private
const getTemplate = asyncHandler(async (req, res) => {
  const template = await Template.findById(req.params.id)
    .populate('createdBy', 'fullName username');

  if (!template) {
    return res.status(404).json({
      success: false,
      message: 'القالب غير موجود'
    });
  }

  res.json({
    success: true,
    data: { template }
  });
});

// @desc    Create new template
// @route   POST /api/templates
// @access  Private
const createTemplate = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    language = 'nl',
    layout,
    styles,
    components,
    variables,
    htmlTemplate,
    cssStyles
  } = req.body;

  // Sanitize inputs
  const sanitizedName = sanitizeInput(name);
  const sanitizedDescription = description ? sanitizeInput(description) : '';

  const templateData = {
    name: sanitizedName,
    description: sanitizedDescription,
    language,
    layout,
    styles,
    components,
    variables,
    htmlTemplate,
    cssStyles,
    createdBy: req.user.id
  };

  const template = await Template.create(templateData);
  await template.populate('createdBy', 'fullName username');

  res.status(201).json({
    success: true,
    message: 'تم إنشاء القالب بنجاح',
    data: { template }
  });
});

// @desc    Update template
// @route   PUT /api/templates/:id
// @access  Private
const updateTemplate = asyncHandler(async (req, res) => {
  let template = await Template.findById(req.params.id);

  if (!template) {
    return res.status(404).json({
      success: false,
      message: 'القالب غير موجود'
    });
  }

  // Check if template is system template
  if (template.isSystemTemplate && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'لا يمكن تعديل قوالب النظام'
    });
  }

  const updateData = { ...req.body };

  // Sanitize inputs
  if (updateData.name) {
    updateData.name = sanitizeInput(updateData.name);
  }
  if (updateData.description) {
    updateData.description = sanitizeInput(updateData.description);
  }

  template = await Template.findByIdAndUpdate(
    req.params.id,
    updateData,
    {
      new: true,
      runValidators: true
    }
  ).populate('createdBy', 'fullName username');

  res.json({
    success: true,
    message: 'تم تحديث القالب بنجاح',
    data: { template }
  });
});

// @desc    Delete template
// @route   DELETE /api/templates/:id
// @access  Private
const deleteTemplate = asyncHandler(async (req, res) => {
  const template = await Template.findById(req.params.id);

  if (!template) {
    return res.status(404).json({
      success: false,
      message: 'القالب غير موجود'
    });
  }

  // Check if template is system template
  if (template.isSystemTemplate) {
    return res.status(400).json({
      success: false,
      message: 'لا يمكن حذف قوالب النظام'
    });
  }

  // Check if template is in use
  const { Invoice } = require('../models');
  const invoiceCount = await Invoice.countDocuments({ template: req.params.id });

  if (invoiceCount > 0) {
    return res.status(400).json({
      success: false,
      message: 'لا يمكن حذف القالب لأنه مستخدم في فواتير موجودة'
    });
  }

  await Template.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'تم حذف القالب بنجاح'
  });
});

// @desc    Toggle template active status
// @route   PATCH /api/templates/:id/toggle-status
// @access  Private
const toggleTemplateStatus = asyncHandler(async (req, res) => {
  const template = await Template.findById(req.params.id);

  if (!template) {
    return res.status(404).json({
      success: false,
      message: 'القالب غير موجود'
    });
  }

  template.isActive = !template.isActive;
  await template.save();

  res.json({
    success: true,
    message: template.isActive ? 
      'تم تفعيل القالب بنجاح' : 
      'تم إلغاء تفعيل القالب بنجاح',
    data: {
      template: {
        id: template._id,
        name: template.name,
        isActive: template.isActive
      }
    }
  });
});

// @desc    Set template as default
// @route   PATCH /api/templates/:id/set-default
// @access  Private
const setAsDefault = asyncHandler(async (req, res) => {
  const template = await Template.findById(req.params.id);

  if (!template) {
    return res.status(404).json({
      success: false,
      message: 'القالب غير موجود'
    });
  }

  if (!template.isActive) {
    return res.status(400).json({
      success: false,
      message: 'لا يمكن تعيين قالب غير نشط كافتراضي'
    });
  }

  template.isDefault = true;
  await template.save(); // This will automatically unset other defaults due to pre-save hook

  res.json({
    success: true,
    message: 'تم تعيين القالب كافتراضي بنجاح',
    data: {
      template: {
        id: template._id,
        name: template.name,
        isDefault: template.isDefault
      }
    }
  });
});

// @desc    Get templates for dropdown/select
// @route   GET /api/templates/dropdown
// @access  Private
const getTemplatesDropdown = asyncHandler(async (req, res) => {
  const { activeOnly = 'true', language = '' } = req.query;
  
  const filter = {};
  if (activeOnly === 'true') filter.isActive = true;
  if (language) filter.language = language;

  const templates = await Template.find(filter)
    .select('_id name description language isDefault usageCount')
    .sort({ isDefault: -1, usageCount: -1, name: 1 });

  res.json({
    success: true,
    data: { templates }
  });
});

// @desc    Preview template with sample data
// @route   POST /api/templates/:id/preview
// @access  Private
const previewTemplate = asyncHandler(async (req, res) => {
  const template = await Template.findById(req.params.id);

  if (!template) {
    return res.status(404).json({
      success: false,
      message: 'القالب غير موجود'
    });
  }

  // Create sample invoice data for preview
  const sampleData = {
    invoice: {
      number: 'INV-2025-0001',
      issueDate: new Date().toLocaleDateString('nl-NL'),
      dueDate: new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString('nl-NL'),
      subtotal: '1000.00',
      vatAmount: '210.00',
      totalAmount: '1210.00',
      currency: 'EUR',
      items: [
        {
          description: 'Sample Service 1',
          quantity: 2,
          unitPrice: '250.00',
          totalPrice: '500.00',
          vatRate: 21
        },
        {
          description: 'Sample Service 2',
          quantity: 1,
          unitPrice: '500.00',
          totalPrice: '500.00',
          vatRate: 21
        }
      ],
      notes: 'Sample invoice notes'
    },
    company: {
      name: 'Sample Receiving Company BV',
      address: {
        street: 'Hoofdstraat 123',
        city: 'Amsterdam',
        postalCode: '1000 AB',
        country: 'Netherlands'
      },
      contact: {
        email: 'info@samplecompany.nl',
        phone: '+31 20 123 4567'
      },
      business: {
        btwNumber: 'NL123456789B01',
        kvkNumber: '12345678'
      }
    },
    client: {
      name: 'Sample Client',
      email: 'client@example.com',
      phone: '+31 20 987 6543',
      address: {
        street: 'Klientstraat 456',
        city: 'Utrecht',
        postalCode: '3500 CD',
        country: 'Netherlands'
      },
      business: {
        companyName: 'Sample Client BV',
        btwNumber: 'NL987654321B01'
      }
    },
    paymentCompany: {
      name: 'Sample Bank',
      iban: 'NL91ABNA0417164300'
    },
    currentDate: new Date().toLocaleDateString('nl-NL')
  };

  try {
    const pdfBuffer = await pdfService.generateCustomPDF(
      template.htmlTemplate,
      template.cssStyles,
      {
        format: template.layout?.pageSize || 'A4',
        orientation: template.layout?.orientation || 'portrait',
        margin: {
          top: `${template.layout?.margins?.top || 50}px`,
          bottom: `${template.layout?.margins?.bottom || 50}px`,
          left: `${template.layout?.margins?.left || 50}px`,
          right: `${template.layout?.margins?.right || 50}px`
        }
      }
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="preview-${template.name}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'فشل في إنشاء معاينة القالب',
      error: error.message
    });
  }
});

// @desc    Clone template
// @route   POST /api/templates/:id/clone
// @access  Private
const cloneTemplate = asyncHandler(async (req, res) => {
  const originalTemplate = await Template.findById(req.params.id);

  if (!originalTemplate) {
    return res.status(404).json({
      success: false,
      message: 'القالب غير موجود'
    });
  }

  const { name } = req.body;
  const cloneName = name || `${originalTemplate.name} - نسخة`;

  const clonedTemplateData = {
    ...originalTemplate.toObject(),
    _id: undefined,
    name: sanitizeInput(cloneName),
    isDefault: false,
    isSystemTemplate: false,
    usageCount: 0,
    lastUsed: null,
    createdBy: req.user.id,
    createdAt: undefined,
    updatedAt: undefined
  };

  const clonedTemplate = await Template.create(clonedTemplateData);
  await clonedTemplate.populate('createdBy', 'fullName username');

  res.status(201).json({
    success: true,
    message: 'تم نسخ القالب بنجاح',
    data: { template: clonedTemplate }
  });
});

module.exports = {
  getTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  toggleTemplateStatus,
  setAsDefault,
  getTemplatesDropdown,
  previewTemplate,
  cloneTemplate
};