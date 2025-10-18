const express = require('express');
const { User } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');
const {
  authenticate,
  requireAdmin
} = require('../middleware/auth');
const {
  validate,
  userSchemas
} = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users
// @access  Private/Admin
router.get('/',
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 10,
      search = '',
      role = '',
      isActive = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) {
      filter.role = role;
    }
    
    if (isActive !== '') {
      filter.isActive = isActive === 'true';
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const users = await User.find(filter)
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await User.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  })
);

// @route   GET /api/users/:id
// @desc    Get single user
// @access  Private/Admin
router.get('/:id',
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  })
);

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private/Admin
router.put('/:id',
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    let user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    // Don't allow changing admin user's role/status by other admins
    if (user.role === 'admin' && user._id.toString() !== req.user.id) {
      if (req.body.role || req.body.isActive === false) {
        return res.status(403).json({
          success: false,
          message: 'لا يمكن تعديل صلاحيات مدير آخر'
        });
      }
    }

    const updateData = { ...req.body };
    delete updateData.password; // Password changes handled separately

    user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    res.json({
      success: true,
      message: 'تم تحديث بيانات المستخدم بنجاح',
      data: { user }
    });
  })
);

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Private/Admin
router.delete('/:id',
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    // Don't allow deleting admin users
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'لا يمكن حذف حساب مدير'
      });
    }

    // Don't allow deleting self
    if (user._id.toString() === req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'لا يمكن حذف حسابك الشخصي'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'تم حذف المستخدم بنجاح'
    });
  })
);

// @route   PATCH /api/users/:id/toggle-status
// @desc    Toggle user active status
// @access  Private/Admin
router.patch('/:id/toggle-status',
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    // Don't allow deactivating admin users
    if (user.role === 'admin' && user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'لا يمكن إلغاء تفعيل حساب مدير'
      });
    }

    // Don't allow deactivating self
    if (user._id.toString() === req.user.id && user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'لا يمكن إلغاء تفعيل حسابك الشخصي'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: user.isActive ? 
        'تم تفعيل المستخدم بنجاح' : 
        'تم إلغاء تفعيل المستخدم بنجاح',
      data: {
        user: {
          id: user._id,
          username: user.username,
          fullName: user.fullName,
          isActive: user.isActive
        }
      }
    });
  })
);

// @route   PUT /api/users/:id/reset-password
// @desc    Reset user password
// @access  Private/Admin
router.put('/:id/reset-password',
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'تم إعادة تعيين كلمة المرور بنجاح'
    });
  })
);

module.exports = router;