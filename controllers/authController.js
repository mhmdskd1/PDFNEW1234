const { User, Setting } = require('../models');
const { generateToken } = require('../utils/auth');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Private (Admin only)
const register = asyncHandler(async (req, res) => {
  const { username, email, password, fullName, role, permissions } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ email }, { username }]
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: existingUser.email === email ? 
        'البريد الإلكتروني مستخدم بالفعل' : 
        'اسم المستخدم مستخدم بالفعل'
    });
  }

  // Create user
  const userData = {
    username,
    email,
    password,
    fullName,
    role: role || 'employee'
  };

  // Set permissions based on role
  if (permissions) {
    userData.permissions = permissions;
  } else {
    // Default permissions based on role
    switch (userData.role) {
      case 'admin':
        userData.permissions = {
          dashboard: true,
          clients: true,
          companies: true,
          paymentCompanies: true,
          createInvoice: true,
          createDigitalInvoice: true,
          accounts: true,
          reports: true,
          settings: true,
          templates: true
        };
        break;
      case 'manager':
        userData.permissions = {
          dashboard: true,
          clients: true,
          companies: true,
          paymentCompanies: true,
          createInvoice: true,
          createDigitalInvoice: true,
          accounts: true,
          reports: true,
          settings: false,
          templates: false
        };
        break;
      default: // employee
        userData.permissions = {
          dashboard: true,
          clients: true,
          companies: true,
          paymentCompanies: true,
          createInvoice: true,
          createDigitalInvoice: false,
          accounts: false,
          reports: false,
          settings: false,
          templates: false
        };
    }
  }

  const user = await User.create(userData);

  res.status(201).json({
    success: true,
    message: 'تم إنشاء الحساب بنجاح',
    data: {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        permissions: user.permissions,
        isActive: user.isActive
      }
    }
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  // Check if user exists and get password
  const user = await User.findOne({ username }).select('+password');

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'اسم المستخدم أو كلمة المرور غير صحيحة'
    });
  }

  // Check if account is active
  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      message: 'الحساب غير نشط. يرجى التواصل مع المدير'
    });
  }

  // Check password
  const isPasswordMatch = await user.comparePassword(password);

  if (!isPasswordMatch) {
    return res.status(401).json({
      success: false,
      message: 'اسم المستخدم أو كلمة المرور غير صحيحة'
    });
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate token
  const token = generateToken(user._id);

  res.json({
    success: true,
    message: 'تم تسجيل الدخول بنجاح',
    data: {
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        permissions: user.permissions,
        lastLogin: user.lastLogin
      }
    }
  });
});

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        permissions: user.permissions,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        avatar: user.avatar,
        createdAt: user.createdAt
      }
    }
  });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const { fullName, email, currentPassword, newPassword } = req.body;
  
  const user = await User.findById(req.user.id).select('+password');

  // Update basic info
  if (fullName) user.fullName = fullName;
  if (email) {
    // Check if email is already used by another user
    const existingUser = await User.findOne({ 
      email, 
      _id: { $ne: user._id } 
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'البريد الإلكتروني مستخدم بالفعل'
      });
    }
    
    user.email = email;
  }

  // Update password if provided
  if (newPassword) {
    if (!currentPassword) {
      return res.status(400).json({
        success: false,
        message: 'كلمة المرور الحالية مطلوبة'
      });
    }

    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'كلمة المرور الحالية غير صحيحة'
      });
    }

    user.password = newPassword;
  }

  await user.save();

  res.json({
    success: true,
    message: 'تم تحديث الملف الشخصي بنجاح',
    data: {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        permissions: user.permissions
      }
    }
  });
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'كلمة المرور الحالية والجديدة مطلوبتان'
    });
  }

  const user = await User.findById(req.user.id).select('+password');
  
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    return res.status(400).json({
      success: false,
      message: 'كلمة المرور الحالية غير صحيحة'
    });
  }

  user.password = newPassword;
  await user.save();

  res.json({
    success: true,
    message: 'تم تغيير كلمة المرور بنجاح'
  });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  // In a stateless JWT setup, logout is handled client-side
  // Here we can log the logout action or implement token blacklisting if needed
  
  res.json({
    success: true,
    message: 'تم تسجيل الخروج بنجاح'
  });
});

// @desc    Check authentication status
// @route   GET /api/auth/check
// @access  Private
const checkAuth = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'المصادقة صحيحة',
    data: {
      user: {
        id: req.user._id,
        username: req.user.username,
        fullName: req.user.fullName,
        role: req.user.role,
        permissions: req.user.permissions
      }
    }
  });
});

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  logout,
  checkAuth
};