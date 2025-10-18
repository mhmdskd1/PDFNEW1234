const express = require('express');
const { Setting } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');
const {
  authenticate,
  requireSettingsAccess,
  requireAdmin
} = require('../middleware/auth');
const emailService = require('../services/emailService');
const validationService = require('../services/validationService');

const router = express.Router();

// @route   GET /api/settings
// @desc    Get all settings by category
// @access  Private
router.get('/',
  authenticate,
  requireSettingsAccess,
  asyncHandler(async (req, res) => {
    const { category = '' } = req.query;
    
    if (category) {
      const settings = await Setting.getByCategory(category, true);
      res.json({
        success: true,
        data: { [category]: settings }
      });
    } else {
      const categories = ['email', 'general', 'api', 'pdf', 'security', 'invoice', 'notifications'];
      const allSettings = {};
      
      for (const cat of categories) {
        allSettings[cat] = await Setting.getByCategory(cat, true);
      }
      
      res.json({
        success: true,
        data: allSettings
      });
    }
  })
);

// @route   GET /api/settings/public
// @desc    Get public settings
// @access  Private
router.get('/public',
  authenticate,
  asyncHandler(async (req, res) => {
    const publicSettings = await Setting.find({ isPublic: true })
      .select('key value category description');
    
    const settings = {};
    publicSettings.forEach(setting => {
      const keys = setting.key.split('.');
      let obj = settings;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!obj[keys[i]]) {
          obj[keys[i]] = {};
        }
        obj = obj[keys[i]];
      }
      
      obj[keys[keys.length - 1]] = setting.value;
    });
    
    res.json({
      success: true,
      data: settings
    });
  })
);

// @route   PUT /api/settings/:key
// @desc    Update setting
// @access  Private/Admin
router.put('/:key',
  authenticate,
  requireSettingsAccess,
  asyncHandler(async (req, res) => {
    const { key } = req.params;
    const { value } = req.body;
    
    if (value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'قيمة الإعداد مطلوبة'
      });
    }
    
    const setting = await Setting.set(key, value, req.user.id);
    
    res.json({
      success: true,
      message: 'تم تحديث الإعداد بنجاح',
      data: { setting }
    });
  })
);

// @route   PUT /api/settings/batch
// @desc    Update multiple settings
// @access  Private/Admin
router.put('/batch',
  authenticate,
  requireSettingsAccess,
  asyncHandler(async (req, res) => {
    const { settings } = req.body;
    
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'بيانات الإعدادات غير صحيحة'
      });
    }
    
    const updatedSettings = [];
    
    for (const [key, value] of Object.entries(settings)) {
      const setting = await Setting.set(key, value, req.user.id);
      updatedSettings.push(setting);
    }
    
    res.json({
      success: true,
      message: `تم تحديث ${updatedSettings.length} إعداد بنجاح`,
      data: { updatedSettings }
    });
  })
);

// @route   POST /api/settings/test-email
// @desc    Test email configuration
// @access  Private/Admin
router.post('/test-email',
  authenticate,
  requireSettingsAccess,
  asyncHandler(async (req, res) => {
    const { testEmail } = req.body;
    
    if (!testEmail) {
      return res.status(400).json({
        success: false,
        message: 'بريد إلكتروني للاختبار مطلوب'
      });
    }
    
    try {
      const result = await emailService.sendEmail({
        to: testEmail,
        subject: 'اختبار إعدادات البريد الإلكتروني',
        html: '<h1>مرحباً!</h1><p>هذه رسالة اختبار من نظام إدارة الفواتير.</p>',
        text: 'هذه رسالة اختبار من نظام إدارة الفواتير.'
      });
      
      res.json({
        success: result.success,
        message: result.message,
        data: result.success ? { messageId: result.messageId } : null
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'فشل في اختبار البريد الإلكتروني',
        error: error.message
      });
    }
  })
);

// @route   POST /api/settings/test-apis
// @desc    Test external API connections
// @access  Private/Admin
router.post('/test-apis',
  authenticate,
  requireSettingsAccess,
  asyncHandler(async (req, res) => {
    try {
      const results = await validationService.testConnections();
      
      res.json({
        success: true,
        message: 'تم اختبار الاتصالات بنجاح',
        data: { results }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'فشل في اختبار الاتصالات',
        error: error.message
      });
    }
  })
);

// @route   POST /api/settings/initialize-defaults
// @desc    Initialize default settings
// @access  Private/Admin
router.post('/initialize-defaults',
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    try {
      await Setting.initializeDefaults();
      
      res.json({
        success: true,
        message: 'تم تهيئة الإعدادات الافتراضية بنجاح'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'فشل في تهيئة الإعدادات',
        error: error.message
      });
    }
  })
);

module.exports = router;