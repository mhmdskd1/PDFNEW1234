import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Paper,
  Typography,
  Tabs,
  Tab,
  Box,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Avatar,
  Tooltip,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Security as SecurityIcon,
  Palette as ThemeIcon,
  Language as LanguageIcon,
  Backup as BackupIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Visibility as ViewIcon,
  VisibilityOff as HideIcon,
  AdminPanelSettings as AdminIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Business as CompanyIcon
} from '@mui/icons-material';
import { formatDate } from '../../utils/formatters';
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  updateEmailSettings,
  updateSystemSettings,
  testEmailConnection,
  backupData,
  restoreData
} from '../../store/slices/settingsSlice';

const SettingsPage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const {
    users,
    emailSettings,
    systemSettings,
    loading,
    saving,
    error,
    testingEmail,
    backingUp
  } = useSelector(state => state.settings);

  const [currentTab, setCurrentTab] = useState(0);
  const [userDialog, setUserDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [emailTestResult, setEmailTestResult] = useState(null);
  
  // بيانات المستخدم الجديد/المعدل
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee',
    permissions: {
      createInvoices: false,
      viewReports: false,
      manageClients: false,
      manageCompanies: false,
      accessAccounts: false,
      manageSettings: false
    }
  });

  // إعدادات الإيميل
  const [emailConfig, setEmailConfig] = useState({
    host: '',
    port: 587,
    username: '',
    password: '',
    fromName: '',
    fromEmail: '',
    encryption: 'tls'
  });

  // إعدادات النظام
  const [systemConfig, setSystemConfig] = useState({
    companyName: '',
    companyAddress: '',
    companyPhone: '',
    companyEmail: '',
    theme: 'light',
    language: 'ar',
    timezone: 'Europe/Amsterdam',
    currency: 'EUR',
    dateFormat: 'DD/MM/YYYY',
    invoicePrefix: 'INV-',
    autoBackup: true,
    backupFrequency: 'daily'
  });

  const roles = [
    { value: 'admin', label: 'مدير عام', color: 'error' },
    { value: 'manager', label: 'مدير', color: 'warning' },
    { value: 'employee', label: 'موظف', color: 'info' }
  ];

  const permissions = [
    { key: 'createInvoices', label: 'إنشاء الفواتير' },
    { key: 'viewReports', label: 'عرض التقارير' },
    { key: 'manageClients', label: 'إدارة العملاء' },
    { key: 'manageCompanies', label: 'إدارة الشركات' },
    { key: 'accessAccounts', label: 'الوصول للحسابات' },
    { key: 'manageSettings', label: 'إدارة الإعدادات' }
  ];

  useEffect(() => {
    dispatch(fetchUsers());
    if (emailSettings) setEmailConfig(emailSettings);
    if (systemSettings) setSystemConfig(systemSettings);
  }, [dispatch, emailSettings, systemSettings]);

  // تغيير التبويب
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  // فتح حوار المستخدم
  const openUserDialog = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
        permissions: user.permissions || {}
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'employee',
        permissions: {
          createInvoices: false,
          viewReports: false,
          manageClients: false,
          manageCompanies: false,
          accessAccounts: false,
          manageSettings: false
        }
      });
    }
    setUserDialog(true);
  };

  // حفظ المستخدم
  const handleSaveUser = async () => {
    try {
      if (editingUser) {
        await dispatch(updateUser({ id: editingUser.id, ...formData })).unwrap();
      } else {
        await dispatch(createUser(formData)).unwrap();
      }
      setUserDialog(false);
      dispatch(fetchUsers());
    } catch (error) {
      console.error('خطأ في حفظ المستخدم:', error);
    }
  };

  // حذف مستخدم
  const handleDeleteUser = async (userId) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
      try {
        await dispatch(deleteUser(userId)).unwrap();
        dispatch(fetchUsers());
      } catch (error) {
        console.error('خطأ في حذف المستخدم:', error);
      }
    }
  };

  // حفظ إعدادات الإيميل
  const handleSaveEmailSettings = async () => {
    try {
      await dispatch(updateEmailSettings(emailConfig)).unwrap();
    } catch (error) {
      console.error('خطأ في حفظ إعدادات الإيميل:', error);
    }
  };

  // اختبار اتصال الإيميل
  const handleTestEmail = async () => {
    try {
      const result = await dispatch(testEmailConnection(emailConfig)).unwrap();
      setEmailTestResult(result);
    } catch (error) {
      setEmailTestResult({ success: false, message: error.message });
    }
  };

  // حفظ إعدادات النظام
  const handleSaveSystemSettings = async () => {
    try {
      await dispatch(updateSystemSettings(systemConfig)).unwrap();
    } catch (error) {
      console.error('خطأ في حفظ إعدادات النظام:', error);
    }
  };

  // نسخ احتياطي
  const handleBackup = async () => {
    try {
      await dispatch(backupData()).unwrap();
    } catch (error) {
      console.error('خطأ في إنشاء النسخة الاحتياطية:', error);
    }
  };

  // تحديث صلاحية
  const updatePermission = (key, value) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: value
      }
    }));
  };

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );

  if (loading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          جاري تحميل الإعدادات...
        </Typography>
        <LinearProgress />
      </Paper>
    );
  }

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        إعدادات النظام
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={currentTab} onChange={handleTabChange}>
            <Tab label="إدارة المستخدمين" icon={<PersonIcon />} />
            <Tab label="إعدادات الإيميل" icon={<EmailIcon />} />
            <Tab label="إعدادات النظام" icon={<SettingsIcon />} />
            <Tab label="النسخ الاحتياطي" icon={<BackupIcon />} />
          </Tabs>
        </Box>

        {/* تبويب إدارة المستخدمين */}
        <TabPanel value={currentTab} index={0}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">
              إدارة حسابات الموظفين
            </Typography>
            {user?.role === 'admin' && (
              <Button
                startIcon={<AddIcon />}
                onClick={() => openUserDialog()}
                variant="contained"
              >
                إضافة مستخدم
              </Button>
            )}
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>المستخدم</TableCell>
                  <TableCell>الإيميل</TableCell>
                  <TableCell>الدور</TableCell>
                  <TableCell>آخر دخول</TableCell>
                  <TableCell>الحالة</TableCell>
                  <TableCell>الإجراءات</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((userItem) => (
                  <TableRow key={userItem.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ mr: 2 }}>
                          {userItem.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <div>
                          <Typography variant="subtitle1">
                            {userItem.name}
                          </Typography>
                          {userItem.id === user?.id && (
                            <Chip label="أنت" size="small" color="primary" />
                          )}
                        </div>
                      </Box>
                    </TableCell>
                    <TableCell>{userItem.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={roles.find(r => r.value === userItem.role)?.label}
                        color={roles.find(r => r.value === userItem.role)?.color}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {userItem.lastLogin ? formatDate(userItem.lastLogin) : 'لم يدخل بعد'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={userItem.isActive ? 'نشط' : 'غير نشط'}
                        color={userItem.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {user?.role === 'admin' && userItem.role !== 'admin' && (
                        <Box display="flex" gap={1}>
                          <Tooltip title="تعديل">
                            <IconButton 
                              onClick={() => openUserDialog(userItem)}
                              size="small"
                              color="primary"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="حذف">
                            <IconButton 
                              onClick={() => handleDeleteUser(userItem.id)}
                              size="small"
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* تبويب إعدادات الإيميل */}
        <TabPanel value={currentTab} index={1}>
          <Typography variant="h6" gutterBottom>
            إعدادات خادم الإيميل
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="خادم SMTP"
                value={emailConfig.host}
                onChange={(e) => setEmailConfig(prev => ({ ...prev, host: e.target.value }))}
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="منفذ"
                type="number"
                value={emailConfig.port}
                onChange={(e) => setEmailConfig(prev => ({ ...prev, port: parseInt(e.target.value) }))}
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="اسم المستخدم"
                value={emailConfig.username}
                onChange={(e) => setEmailConfig(prev => ({ ...prev, username: e.target.value }))}
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="كلمة المرور"
                type={showPassword ? 'text' : 'password'}
                value={emailConfig.password}
                onChange={(e) => setEmailConfig(prev => ({ ...prev, password: e.target.value }))}
                margin="normal"
                InputProps={{
                  endAdornment: (
                    <IconButton onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <HideIcon /> : <ViewIcon />}
                    </IconButton>
                  )
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="اسم المرسل"
                value={emailConfig.fromName}
                onChange={(e) => setEmailConfig(prev => ({ ...prev, fromName: e.target.value }))}
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="إيميل المرسل"
                type="email"
                value={emailConfig.fromEmail}
                onChange={(e) => setEmailConfig(prev => ({ ...prev, fromEmail: e.target.value }))}
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>نوع التشفير</InputLabel>
                <Select
                  value={emailConfig.encryption}
                  onChange={(e) => setEmailConfig(prev => ({ ...prev, encryption: e.target.value }))}
                  label="نوع التشفير"
                >
                  <MenuItem value="none">بدون تشفير</MenuItem>
                  <MenuItem value="tls">TLS</MenuItem>
                  <MenuItem value="ssl">SSL</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          {emailTestResult && (
            <Alert 
              severity={emailTestResult.success ? 'success' : 'error'}
              sx={{ mt: 2 }}
            >
              {emailTestResult.message}
            </Alert>
          )}
          
          <Box display="flex" gap={2} mt={3}>
            <Button
              startIcon={<SaveIcon />}
              onClick={handleSaveEmailSettings}
              variant="contained"
              disabled={saving}
            >
              حفظ الإعدادات
            </Button>
            
            <Button
              startIcon={testingEmail ? <LinearProgress size={20} /> : <CheckIcon />}
              onClick={handleTestEmail}
              variant="outlined"
              disabled={testingEmail}
            >
              اختبار الاتصال
            </Button>
          </Box>
        </TabPanel>

        {/* تبويب إعدادات النظام */}
        <TabPanel value={currentTab} index={2}>
          <Typography variant="h6" gutterBottom>
            إعدادات عامة للنظام
          </Typography>
          
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box display="flex" alignItems="center">
                <CompanyIcon sx={{ mr: 1 }} />
                <Typography variant="h6">بيانات الشركة</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="اسم الشركة"
                    value={systemConfig.companyName}
                    onChange={(e) => setSystemConfig(prev => ({ ...prev, companyName: e.target.value }))}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="إيميل الشركة"
                    type="email"
                    value={systemConfig.companyEmail}
                    onChange={(e) => setSystemConfig(prev => ({ ...prev, companyEmail: e.target.value }))}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="هاتف الشركة"
                    value={systemConfig.companyPhone}
                    onChange={(e) => setSystemConfig(prev => ({ ...prev, companyPhone: e.target.value }))}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="عنوان الشركة"
                    value={systemConfig.companyAddress}
                    onChange={(e) => setSystemConfig(prev => ({ ...prev, companyAddress: e.target.value }))}
                    multiline
                    rows={2}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
          
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box display="flex" alignItems="center">
                <ThemeIcon sx={{ mr: 1 }} />
                <Typography variant="h6">إعدادات العرض</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>المظهر</InputLabel>
                    <Select
                      value={systemConfig.theme}
                      onChange={(e) => setSystemConfig(prev => ({ ...prev, theme: e.target.value }))}
                      label="المظهر"
                    >
                      <MenuItem value="light">فاتح</MenuItem>
                      <MenuItem value="dark">داكن</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>اللغة</InputLabel>
                    <Select
                      value={systemConfig.language}
                      onChange={(e) => setSystemConfig(prev => ({ ...prev, language: e.target.value }))}
                      label="اللغة"
                    >
                      <MenuItem value="ar">العربية</MenuItem>
                      <MenuItem value="en">English</MenuItem>
                      <MenuItem value="nl">Nederlands</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>العملة</InputLabel>
                    <Select
                      value={systemConfig.currency}
                      onChange={(e) => setSystemConfig(prev => ({ ...prev, currency: e.target.value }))}
                      label="العملة"
                    >
                      <MenuItem value="EUR">Euro (€)</MenuItem>
                      <MenuItem value="USD">US Dollar ($)</MenuItem>
                      <MenuItem value="GBP">British Pound (£)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="بادئة رقم الفاتورة"
                    value={systemConfig.invoicePrefix}
                    onChange={(e) => setSystemConfig(prev => ({ ...prev, invoicePrefix: e.target.value }))}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
          
          <Box mt={3}>
            <Button
              startIcon={<SaveIcon />}
              onClick={handleSaveSystemSettings}
              variant="contained"
              disabled={saving}
            >
              حفظ الإعدادات
            </Button>
          </Box>
        </TabPanel>

        {/* تبويب النسخ الاحتياطي */}
        <TabPanel value={currentTab} index={3}>
          <Typography variant="h6" gutterBottom>
            إدارة النسخ الاحتياطية
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    إنشاء نسخة احتياطية
                  </Typography>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    قم بإنشاء نسخة احتياطية من جميع بيانات النظام
                  </Typography>
                  <Button
                    startIcon={backingUp ? <LinearProgress size={20} /> : <BackupIcon />}
                    onClick={handleBackup}
                    variant="contained"
                    disabled={backingUp}
                    fullWidth
                  >
                    {backingUp ? 'جاري إنشاء النسخة...' : 'إنشاء نسخة احتياطية'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    إعدادات النسخ التلقائي
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={systemConfig.autoBackup}
                        onChange={(e) => setSystemConfig(prev => ({ ...prev, autoBackup: e.target.checked }))}
                      />
                    }
                    label="تفعيل النسخ التلقائي"
                  />
                  
                  {systemConfig.autoBackup && (
                    <FormControl fullWidth sx={{ mt: 2 }}>
                      <InputLabel>تكرار النسخ</InputLabel>
                      <Select
                        value={systemConfig.backupFrequency}
                        onChange={(e) => setSystemConfig(prev => ({ ...prev, backupFrequency: e.target.value }))}
                        label="تكرار النسخ"
                      >
                        <MenuItem value="daily">يومياً</MenuItem>
                        <MenuItem value="weekly">أسبوعياً</MenuItem>
                        <MenuItem value="monthly">شهرياً</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>

      {/* حوار إضافة/تعديل مستخدم */}
      <Dialog open={userDialog} onClose={() => setUserDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingUser ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="الاسم"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="الإيميل"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={editingUser ? 'كلمة مرور جديدة (اختياري)' : 'كلمة المرور'}
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>الدور</InputLabel>
                <Select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  label="الدور"
                >
                  {roles.filter(role => role.value !== 'admin' || user?.role === 'admin').map((role) => (
                    <MenuItem key={role.value} value={role.value}>
                      {role.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                الصلاحيات
              </Typography>
              <Grid container spacing={2}>
                {permissions.map((permission) => (
                  <Grid item xs={12} sm={6} key={permission.key}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.permissions[permission.key] || false}
                          onChange={(e) => updatePermission(permission.key, e.target.checked)}
                        />
                      }
                      label={permission.label}
                    />
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDialog(false)}>إلغاء</Button>
          <Button 
            onClick={handleSaveUser} 
            variant="contained"
            disabled={saving || !formData.name || !formData.email}
          >
            {saving ? 'جاري الحفظ...' : 'حفظ'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default SettingsPage;