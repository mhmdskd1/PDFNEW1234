// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('❌ Error Stack:', err.stack);
  
  let error = { ...err };
  error.message = err.message;

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'معرف غير صحيح';
    error = { statusCode: 404, message };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    let message = 'بيانات مكررة';
    
    if (field === 'email') {
      message = 'البريد الإلكتروني مستخدم بالفعل';
    } else if (field === 'username') {
      message = 'اسم المستخدم مستخدم بالفعل';
    } else if (field === 'invoiceNumber') {
      message = 'رقم الفاتورة مستخدم بالفعل';
    }
    
    error = { statusCode: 400, message };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    error = { statusCode: 400, message: messages.join(', ') };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'رمز غير صحيح';
    error = { statusCode: 401, message };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'رمز منتهي الصلاحية';
    error = { statusCode: 401, message };
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'حجم الملف كبير جداً';
    error = { statusCode: 400, message };
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = 'نوع ملف غير مدعوم';
    error = { statusCode: 400, message };
  }

  // Database connection errors
  if (err.name === 'MongoNetworkError' || err.name === 'MongooseServerSelectionError') {
    const message = 'خطأ في الاتصال بقاعدة البيانات';
    error = { statusCode: 500, message };
  }

  // PDF generation errors
  if (err.message && err.message.includes('puppeteer')) {
    const message = 'فشل في إنشاء ملف PDF';
    error = { statusCode: 500, message };
  }

  // Email sending errors
  if (err.message && (err.message.includes('SMTP') || err.message.includes('nodemailer'))) {
    const message = 'فشل في إرسال البريد الإلكتروني';
    error = { statusCode: 500, message };
  }

  // API validation errors
  if (err.message && (err.message.includes('BTW') || err.message.includes('KVK'))) {
    error = { statusCode: 400, message: err.message };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'خطأ داخلي في الخادم',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// Async error wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// 404 handler
const notFound = (req, res, next) => {
  const error = new Error(`المسار ${req.originalUrl} غير موجود`);
  res.status(404);
  next(error);
};

module.exports = {
  errorHandler,
  asyncHandler,
  notFound
};