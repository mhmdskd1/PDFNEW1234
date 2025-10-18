const express = require('express');
const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  logout,
  checkAuth
} = require('../controllers/authController');
const {
  authenticate,
  requireAdmin
} = require('../middleware/auth');
const {
  validate,
  userSchemas
} = require('../middleware/validation');
const {
  authLimiter
} = require('../middleware/rateLimiter');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register new user (Admin only)
// @access  Private/Admin
router.post('/register', 
  authLimiter,
  authenticate,
  requireAdmin,
  validate(userSchemas.register),
  register
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login',
  authLimiter,
  validate(userSchemas.login),
  login
);

// @route   GET /api/auth/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile',
  authenticate,
  getProfile
);

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile',
  authenticate,
  validate(userSchemas.updateProfile),
  updateProfile
);

// @route   PUT /api/auth/change-password
// @desc    Change password
// @access  Private
router.put('/change-password',
  authenticate,
  changePassword
);

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout',
  authenticate,
  logout
);

// @route   GET /api/auth/check
// @desc    Check authentication status
// @access  Private
router.get('/check',
  authenticate,
  checkAuth
);

module.exports = router;