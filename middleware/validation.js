const Joi = require('joi');

// User validation schemas
const userSchemas = {
  register: Joi.object({
    username: Joi.string().alphanum().min(3).max(50).required()
      .messages({
        'string.alphanum': 'اسم المستخدم يجب أن يحتوي على أحرف وأرقام فقط',
        'string.min': 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل',
        'string.max': 'اسم المستخدم يجب أن يكون 50 حرفاً على الأكثر',
        'any.required': 'اسم المستخدم مطلوب'
      }),
    email: Joi.string().email().required()
      .messages({
        'string.email': 'بريد إلكتروني غير صحيح',
        'any.required': 'البريد الإلكتروني مطلوب'
      }),
    password: Joi.string().min(6).max(100).required()
      .messages({
        'string.min': 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
        'any.required': 'كلمة المرور مطلوبة'
      }),
    fullName: Joi.string().min(2).max(100).required()
      .messages({
        'string.min': 'الاسم الكامل يجب أن يكون حرفين على الأقل',
        'any.required': 'الاسم الكامل مطلوب'
      }),
    role: Joi.string().valid('admin', 'manager', 'employee').default('employee')
  }),
  
  login: Joi.object({
    username: Joi.string().required()
      .messages({
        'any.required': 'اسم المستخدم مطلوب'
      }),
    password: Joi.string().required()
      .messages({
        'any.required': 'كلمة المرور مطلوبة'
      })
  }),
  
  updateProfile: Joi.object({
    fullName: Joi.string().min(2).max(100),
    email: Joi.string().email(),
    currentPassword: Joi.string().when('newPassword', {
      is: Joi.exist(),
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    newPassword: Joi.string().min(6).max(100)
  })
};

// Client validation schemas
const clientSchemas = {
  create: Joi.object({
    name: Joi.string().min(2).max(100).required()
      .messages({
        'any.required': 'اسم العميل مطلوب'
      }),
    type: Joi.string().valid('broker', 'financer').required()
      .messages({
        'any.only': 'نوع العميل يجب أن يكون وسيط أو ممول',
        'any.required': 'نوع العميل مطلوب'
      }),
    email: Joi.string().email().allow(''),
    phone: Joi.string().allow(''),
    address: Joi.object({
      street: Joi.string().allow(''),
      city: Joi.string().allow(''),
      postalCode: Joi.string().allow(''),
      country: Joi.string().default('Netherlands')
    }),
    businessInfo: Joi.object({
      companyName: Joi.string().allow(''),
      registrationNumber: Joi.string().allow(''),
      taxNumber: Joi.string().allow(''),
      btwNumber: Joi.string().allow(''),
      kvkNumber: Joi.string().allow('')
    }),
    bankDetails: Joi.object({
      iban: Joi.string().allow(''),
      bic: Joi.string().allow(''),
      bankName: Joi.string().allow('')
    }),
    contactPerson: Joi.object({
      name: Joi.string().allow(''),
      phone: Joi.string().allow(''),
      email: Joi.string().email().allow('')
    }),
    notes: Joi.string().allow('')
  }),
  
  update: Joi.object({
    name: Joi.string().min(2).max(100),
    type: Joi.string().valid('broker', 'financer'),
    email: Joi.string().email().allow(''),
    phone: Joi.string().allow(''),
    address: Joi.object({
      street: Joi.string().allow(''),
      city: Joi.string().allow(''),
      postalCode: Joi.string().allow(''),
      country: Joi.string()
    }),
    businessInfo: Joi.object({
      companyName: Joi.string().allow(''),
      registrationNumber: Joi.string().allow(''),
      taxNumber: Joi.string().allow(''),
      btwNumber: Joi.string().allow(''),
      kvkNumber: Joi.string().allow('')
    }),
    bankDetails: Joi.object({
      iban: Joi.string().allow(''),
      bic: Joi.string().allow(''),
      bankName: Joi.string().allow('')
    }),
    contactPerson: Joi.object({
      name: Joi.string().allow(''),
      phone: Joi.string().allow(''),
      email: Joi.string().email().allow('')
    }),
    notes: Joi.string().allow(''),
    isActive: Joi.boolean()
  })
};

// Company validation schemas
const companySchemas = {
  create: Joi.object({
    name: Joi.string().min(2).max(100).required()
      .messages({
        'any.required': 'اسم الشركة مطلوب'
      }),
    address: Joi.object({
      street: Joi.string().required().messages({ 'any.required': 'الشارع مطلوب' }),
      city: Joi.string().required().messages({ 'any.required': 'المدينة مطلوبة' }),
      postalCode: Joi.string().required().messages({ 'any.required': 'الرمز البريدي مطلوب' }),
      country: Joi.string().default('Netherlands')
    }).required(),
    contactInfo: Joi.object({
      email: Joi.string().email().required()
        .messages({ 'any.required': 'بريد إلكتروني مطلوب' }),
      phone: Joi.string().allow(''),
      website: Joi.string().uri().allow('')
    }).required(),
    businessInfo: Joi.object({
      registrationNumber: Joi.string().allow(''),
      taxNumber: Joi.string().allow(''),
      btwNumber: Joi.string().allow(''),
      kvkNumber: Joi.string().allow('')
    }),
    paymentMethods: Joi.array().items(
      Joi.object({
        type: Joi.string().valid('bank_transfer', 'sepa', 'ideal', 'paypal', 'other').required(),
        details: Joi.object({
          iban: Joi.string().allow(''),
          bic: Joi.string().allow(''),
          accountName: Joi.string().allow(''),
          reference: Joi.string().allow(''),
          other: Joi.string().allow('')
        }),
        isDefault: Joi.boolean().default(false)
      })
    ),
    notes: Joi.string().allow('')
  })
};

// Invoice validation schemas
const invoiceSchemas = {
  create: Joi.object({
    template: Joi.string().required()
      .messages({ 'any.required': 'قالب الفاتورة مطلوب' }),
    company: Joi.string().required()
      .messages({ 'any.required': 'الشركة المستلمة مطلوبة' }),
    paymentCompany: Joi.string().required()
      .messages({ 'any.required': 'شركة الدفع مطلوبة' }),
    client: Joi.string().required()
      .messages({ 'any.required': 'العميل مطلوب' }),
    items: Joi.array().min(1).items(
      Joi.object({
        description: Joi.string().required()
          .messages({ 'any.required': 'وصف العنصر مطلوب' }),
        quantity: Joi.number().min(0.01).required()
          .messages({ 'any.required': 'الكمية مطلوبة' }),
        unitPrice: Joi.number().min(0).required()
          .messages({ 'any.required': 'سعر الوحدة مطلوب' }),
        vatRate: Joi.number().min(0).max(100).default(21)
      })
    ).required().messages({ 'array.min': 'يجب إضافة عنصر واحد على الأقل' }),
    profitDistribution: Joi.object({
      type: Joi.string().valid('21_9', '0', 'verlicht').required(),
      settings: Joi.object().required()
    }).required(),
    dueDate: Joi.date().greater('now').required()
      .messages({ 'any.required': 'تاريخ الاستحقاق مطلوب' }),
    notes: Joi.string().allow(''),
    logo: Joi.object({
      path: Joi.string(),
      width: Joi.number(),
      height: Joi.number(),
      position: Joi.object({
        x: Joi.number(),
        y: Joi.number()
      })
    })
  })
};

// Digital Invoice validation schemas
const digitalInvoiceSchemas = {
  create: Joi.object({
    baseAmount: Joi.number().min(0.01).required()
      .messages({ 'any.required': 'مبلغ الفاتورة مطلوب' }),
    vatRate: Joi.number().min(0).max(100).default(21),
    description: Joi.string().min(5).required()
      .messages({ 'any.required': 'وصف الفاتورة مطلوب' }),
    distribution: Joi.array().min(1).items(
      Joi.object({
        type: Joi.string().valid('main_broker', 'us', 'additional_broker').required(),
        name: Joi.string().when('type', {
          is: 'us',
          then: Joi.string().default('لنا'),
          otherwise: Joi.string().required()
        }),
        client: Joi.string().when('type', {
          is: Joi.valid('main_broker', 'additional_broker'),
          then: Joi.required(),
          otherwise: Joi.optional()
        }),
        percentage: Joi.number().min(0).max(100).required()
      })
    ).required(),
    notes: Joi.string().allow('')
  })
};

// Validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      return res.status(400).json({
        success: false,
        message: 'بيانات غير صحيحة',
        errors: errorMessages
      });
    }

    req.body = value;
    next();
  };
};

// Query validation
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: true
    });

    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      return res.status(400).json({
        success: false,
        message: 'معاملات البحث غير صحيحة',
        errors: errorMessages
      });
    }

    req.query = value;
    next();
  };
};

module.exports = {
  userSchemas,
  clientSchemas,
  companySchemas,
  invoiceSchemas,
  digitalInvoiceSchemas,
  validate,
  validateQuery
};