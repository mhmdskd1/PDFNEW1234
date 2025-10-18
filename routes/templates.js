const express = require('express');
const {
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
} = require('../controllers/templateController');
const {
  authenticate,
  authorize
} = require('../middleware/auth');
const {
  pdfLimiter
} = require('../middleware/rateLimiter');

const router = express.Router();

// @route   GET /api/templates/dropdown
// @desc    Get templates for dropdown/select
// @access  Private
router.get('/dropdown',
  authenticate,
  authorize('templates'),
  getTemplatesDropdown
);

// @route   GET /api/templates
// @desc    Get all templates
// @access  Private
router.get('/',
  authenticate,
  authorize('templates'),
  getTemplates
);

// @route   GET /api/templates/:id
// @desc    Get single template
// @access  Private
router.get('/:id',
  authenticate,
  authorize('templates'),
  getTemplate
);

// @route   POST /api/templates
// @desc    Create new template
// @access  Private
router.post('/',
  authenticate,
  authorize('templates'),
  createTemplate
);

// @route   PUT /api/templates/:id
// @desc    Update template
// @access  Private
router.put('/:id',
  authenticate,
  authorize('templates'),
  updateTemplate
);

// @route   DELETE /api/templates/:id
// @desc    Delete template
// @access  Private
router.delete('/:id',
  authenticate,
  authorize('templates'),
  deleteTemplate
);

// @route   PATCH /api/templates/:id/toggle-status
// @desc    Toggle template active status
// @access  Private
router.patch('/:id/toggle-status',
  authenticate,
  authorize('templates'),
  toggleTemplateStatus
);

// @route   PATCH /api/templates/:id/set-default
// @desc    Set template as default
// @access  Private
router.patch('/:id/set-default',
  authenticate,
  authorize('templates'),
  setAsDefault
);

// @route   POST /api/templates/:id/preview
// @desc    Preview template with sample data
// @access  Private
router.post('/:id/preview',
  pdfLimiter,
  authenticate,
  authorize('templates'),
  previewTemplate
);

// @route   POST /api/templates/:id/clone
// @desc    Clone template
// @access  Private
router.post('/:id/clone',
  authenticate,
  authorize('templates'),
  cloneTemplate
);

module.exports = router;