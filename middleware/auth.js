const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { verifyToken } = require('../utils/auth');

// Authenticate user
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'لا يوجد رمز مصادقة. الوصول مرفوض'
      });
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'رمز غير صحيح. الوصول مرفوض'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'الحساب غير نشط. الوصول مرفوض'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('خطأ في المصادقة:', error);
    res.status(401).json({
      success: false,
      message: 'رمز غير صحيح. الوصول مرفوض'
    });
  }
};

// Check if user has specific permission
const authorize = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'يجب تسجيل الدخول أولاً'
      });
    }

    // Admin has all permissions
    if (req.user.role === 'admin') {
      return next();
    }

    // Check specific permission
    if (permission && !req.user.permissions[permission]) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية للوصول إلى هذه الميزة'
      });
    }

    next();
  };
};

// Check if user has admin role
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'يجب تسجيل الدخول أولاً'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'هذه العملية تتطلب صلاحيات مدير'
    });
  }

  next();
};

// Check if user can access settings
const requireSettingsAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'يجب تسجيل الدخول أولاً'
    });
  }

  if (req.user.role !== 'admin' && !req.user.permissions.settings) {
    return res.status(403).json({
      success: false,
      message: 'ليس لديك صلاحية للوصول إلى الإعدادات'
    });
  }

  next();
};

// Optional authentication (for public endpoints that can benefit from user context)
const optionalAuthenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication for optional endpoints
    next();
  }
};

module.exports = {
  authenticate,
  authorize,
  requireAdmin,
  requireSettingsAccess,
  optionalAuthenticate
};