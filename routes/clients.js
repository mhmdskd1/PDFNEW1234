const express = require('express');
const {
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  toggleClientStatus,
  getClientStats,
  getClientsDropdown
} = require('../controllers/clientController');
const {
  authenticate,
  authorize
} = require('../middleware/auth');
const {
  validate,
  clientSchemas
} = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/clients/dropdown
// @desc    Get clients for dropdown/select
// @access  Private
router.get('/dropdown',
  authenticate,
  authorize('clients'),
  getClientsDropdown
);

// @route   GET /api/clients
// @desc    Get all clients
// @access  Private
router.get('/',
  authenticate,
  authorize('clients'),
  getClients
);

// @route   GET /api/clients/:id
// @desc    Get single client
// @access  Private
router.get('/:id',
  authenticate,
  authorize('clients'),
  getClient
);

// @route   POST /api/clients
// @desc    Create new client
// @access  Private
router.post('/',
  authenticate,
  authorize('clients'),
  validate(clientSchemas.create),
  createClient
);

// @route   PUT /api/clients/:id
// @desc    Update client
// @access  Private
router.put('/:id',
  authenticate,
  authorize('clients'),
  validate(clientSchemas.update),
  updateClient
);

// @route   DELETE /api/clients/:id
// @desc    Delete client
// @access  Private
router.delete('/:id',
  authenticate,
  authorize('clients'),
  deleteClient
);

// @route   PATCH /api/clients/:id/toggle-status
// @desc    Toggle client active status
// @access  Private
router.patch('/:id/toggle-status',
  authenticate,
  authorize('clients'),
  toggleClientStatus
);

// @route   GET /api/clients/:id/stats
// @desc    Get client statistics
// @access  Private
router.get('/:id/stats',
  authenticate,
  authorize('clients'),
  getClientStats
);

module.exports = router;