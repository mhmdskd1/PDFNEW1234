const express = require('express');
const {
  getDashboardStats,
  getQuickActions,
  getPendingPayments
} = require('../controllers/dashboardController');
const {
  authenticate,
  authorize
} = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private
router.get('/stats',
  authenticate,
  authorize('dashboard'),
  getDashboardStats
);

// @route   GET /api/dashboard/quick-actions
// @desc    Get quick actions data
// @access  Private
router.get('/quick-actions',
  authenticate,
  authorize('dashboard'),
  getQuickActions
);

// @route   GET /api/dashboard/pending-payments
// @desc    Get pending payments
// @access  Private
router.get('/pending-payments',
  authenticate,
  authorize('dashboard'),
  getPendingPayments
);

module.exports = router;