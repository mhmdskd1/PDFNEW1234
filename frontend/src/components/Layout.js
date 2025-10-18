import React, { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  Chip
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  AccountBalance as AccountBalanceIcon,
  Receipt as ReceiptIcon,
  Add as AddIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  Archive as ArchiveIcon,
  Assignment as AssignmentIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  AccountCircle as AccountCircleIcon,
  Logout as LogoutIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon
} from '@mui/icons-material';
import { logout } from '../store/slices/authSlice';

const drawerWidth = 280;

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const { user } = useSelector(state => state.auth);
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const menuItems = [
    {
      text: 'الصفحة الرئيسية',
      icon: <DashboardIcon />,
      path: '/dashboard',
      permission: null
    },
    {
      text: 'العملاء (وسطاء + ممولين)',
      icon: <PeopleIcon />,
      path: '/clients',
      permission: 'manageClients'
    },
    {
      text: 'الشركات المستلمة',
      icon: <BusinessIcon />,
      path: '/companies',
      permission: 'manageCompanies'
    },
    {
      text: 'شركات الدفع (البنوك)',
      icon: <AccountBalanceIcon />,
      path: '/paying-companies',
      permission: 'manageCompanies'
    },
    {
      text: 'إنشاء فاتورة PDF',
      icon: <ReceiptIcon />,
      path: '/create-pdf-invoice',
      permission: 'createInvoices'
    },
    {
      text: 'إنشاء فاتورة رقمية',
      icon: <AddIcon />,
      path: '/create-digital-invoice',
      permission: 'createInvoices'
    },
    {
      text: 'إدارة الحسابات',
      icon: <AccountBalanceWalletIcon />,
      path: '/accounts',
      permission: 'accessAccounts'
    },
    {
      text: 'سجل الفواتير PDF',
      icon: <ArchiveIcon />,
      path: '/paid-invoices',
      permission: 'viewReports'
    },
    {
      text: 'سجل الفواتير الرقمية',
      icon: <AssignmentIcon />,
      path: '/digital-invoices',
      permission: 'viewReports'
    },
    {
      text: 'التقارير',
      icon: <AssessmentIcon />,
      path: '/reports',
      permission: 'viewReports'
    },
    {
      text: 'الإعدادات',
      icon: <SettingsIcon />,
      path: '/settings',
      permission: 'manageSettings'
    }
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
    handleProfileMenuClose();
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  // تحقق من الصلاحية
  const hasPermission = (permission) => {
    if (!permission) return true; // لا تحتاج صلاحية
    if (user?.role === 'admin') return true; // المدير له جميع الصلاحيات
    return user?.permissions?.[permission] || false;
  };

  const drawer = (
    <div>
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          نظام إدارة الفواتير
        </Typography>
        <Typography variant="body2" color="textSecondary">
          نظام شامل لإدارة الفواتير والمالية
        </Typography>
      </Box>
      
      <Divider />
      
      <List sx={{ px: 1 }}>
        {menuItems
          .filter(item => hasPermission(item.permission))
          .map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
              selected={location.pathname === item.path}
              sx={{
                borderRadius: 2,
                mx: 1,
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                },
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: location.pathname === item.path ? 'white' : 'inherit',
                  minWidth: 40
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{
                  fontSize: '0.9rem',
                  fontWeight: location.pathname === item.path ? 'bold' : 'normal'
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      
      <Divider sx={{ mt: 2 }} />
      
      {/* معلومات المستخدم */}
      <Box sx={{ p: 2, mt: 'auto' }}>
        <Box display="flex" alignItems="center" mb={1}>
          <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'primary.main' }}>
            {user?.name?.charAt(0)?.toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight="bold">
              {user?.name}
            </Typography>
            <Chip 
              label={user?.role === 'admin' ? 'مدير عام' : user?.role === 'manager' ? 'مدير' : 'موظف'}
              size="small"
              color={user?.role === 'admin' ? 'error' : user?.role === 'manager' ? 'warning' : 'info'}
            />
          </Box>
        </Box>
      </Box>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* شريط التطبيق العلوي */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: 1
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {menuItems.find(item => item.path === location.pathname)?.text || 'نظام إدارة الفواتير'}
          </Typography>
          
          {/* قائمة المستخدم */}
          <IconButton
            size="large"
            edge="end"
            aria-label="account of current user"
            aria-controls="profile-menu"
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            <AccountCircleIcon />
          </IconButton>
          
          <Menu
            id="profile-menu"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
          >
            <MenuItem onClick={() => {
              handleNavigation('/settings');
              handleProfileMenuClose();
            }}>
              <SettingsIcon sx={{ mr: 1 }} />
              الإعدادات
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1 }} />
              تسجيل الخروج
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      
      {/* الشريط الجانبي */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              position: 'relative',
              height: '100vh'
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      {/* المحتوى الرئيسي */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          bgcolor: 'background.default'
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;