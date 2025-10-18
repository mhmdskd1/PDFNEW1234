const express = require('express');
const {
  getCompanies,
  getCompany,
  createCompany,
  updateCompany,
  deleteCompany,
  toggleCompanyStatus,
  validateCompany,
  getCompanyStats,
  getCompaniesDropdown
} = require('../controllers/companyController');
const {
  authenticate,
  authorize
} = require('../middleware/auth');
const {
  validate,
  companySchemas
} = require('../middleware/validation');
const {
  validationLimiter
} = require('../middleware/rateLimiter');

const router = express.Router();

// @route   GET /api/companies/dropdown
// @desc    Get companies for dropdown/select
// @access  Private
router.get('/dropdown',
  authenticate,
  authorize('companies'),
  getCompaniesDropdown
);

// @route   GET /api/companies
// @desc    Get all companies
// @access  Private
router.get('/',
  authenticate,
  authorize('companies'),
  getCompanies
);

// @route   GET /api/companies/:id
// @desc    Get single company
// @access  Private
router.get('/:id',
  authenticate,
  authorize('companies'),
  getCompany
);

// @route   POST /api/companies
// @desc    Create new company
// @access  Private
router.post('/',
  authenticate,
  authorize('companies'),
  validate(companySchemas.create),
  createCompany
);

// @route   PUT /api/companies/:id
// @desc    Update company
// @access  Private
router.put('/:id',
  authenticate,
  authorize('companies'),
  updateCompany
);

// @route   DELETE /api/companies/:id
// @desc    Delete company
// @access  Private
router.delete('/:id',
  authenticate,
  authorize('companies'),
  deleteCompany
);

// @route   PATCH /api/companies/:id/toggle-status
// @desc    Toggle company active status
// @access  Private
router.patch('/:id/toggle-status',
  authenticate,
  authorize('companies'),
  toggleCompanyStatus
);

// @route   POST /api/companies/:id/validate
// @desc    Validate company (BTW and KVK)
// @access  Private
router.post('/:id/validate',
  validationLimiter,
  authenticate,
  authorize('companies'),
  validateCompany
);

// @route   GET /api/companies/:id/stats
// @desc    Get company statistics
// @access  Private
router.get('/:id/stats',
  authenticate,
  authorize('companies'),
  getCompanyStats
);

module.exports = router;