const express = require('express');
const validationService = require('../services/validationService');
const { asyncHandler } = require('../middleware/errorHandler');
const {
  authenticate,
  authorize
} = require('../middleware/auth');
const {
  validationLimiter
} = require('../middleware/rateLimiter');

const router = express.Router();

// @route   POST /api/validation/btw
// @desc    Validate BTW number
// @access  Private
router.post('/btw',
  validationLimiter,
  authenticate,
  authorize('companies'),
  asyncHandler(async (req, res) => {
    const { btwNumber } = req.body;
    
    if (!btwNumber) {
      return res.status(400).json({
        success: false,
        message: 'رقم BTW مطلوب'
      });
    }
    
    try {
      const result = await validationService.validateBTW(btwNumber);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'فشل في التحقق من رقم BTW',
        error: error.message
      });
    }
  })
);

// @route   POST /api/validation/kvk
// @desc    Validate KVK number
// @access  Private
router.post('/kvk',
  validationLimiter,
  authenticate,
  authorize('companies'),
  asyncHandler(async (req, res) => {
    const { kvkNumber } = req.body;
    
    if (!kvkNumber) {
      return res.status(400).json({
        success: false,
        message: 'رقم KVK مطلوب'
      });
    }
    
    try {
      const result = await validationService.validateKVK(kvkNumber);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'فشل في التحقق من رقم KVK',
        error: error.message
      });
    }
  })
);

// @route   POST /api/validation/dutch-company
// @desc    Validate Dutch company (BTW and KVK)
// @access  Private
router.post('/dutch-company',
  validationLimiter,
  authenticate,
  authorize('companies'),
  asyncHandler(async (req, res) => {
    const { btwNumber, kvkNumber } = req.body;
    
    if (!btwNumber && !kvkNumber) {
      return res.status(400).json({
        success: false,
        message: 'رقم BTW أو KVK مطلوب على الأقل'
      });
    }
    
    try {
      const result = await validationService.validateDutchCompany(btwNumber, kvkNumber);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'فشل في التحقق من بيانات الشركة',
        error: error.message
      });
    }
  })
);

// @route   POST /api/validation/non-dutch-company
// @desc    Validate non-Dutch company
// @access  Private
router.post('/non-dutch-company',
  authenticate,
  authorize('companies'),
  asyncHandler(async (req, res) => {
    const companyData = req.body;
    
    try {
      const result = await validationService.validateNonDutchCompany(companyData);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'فشل في التحقق من بيانات الشركة',
        error: error.message
      });
    }
  })
);

// @route   GET /api/validation/test-connections
// @desc    Test API connections
// @access  Private
router.get('/test-connections',
  authenticate,
  authorize('companies'),
  asyncHandler(async (req, res) => {
    try {
      const results = await validationService.testConnections();
      
      res.json({
        success: true,
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

module.exports = router;