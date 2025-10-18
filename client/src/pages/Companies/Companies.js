import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Alert,
  InputAdornment,
  CircularProgress,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Language as WebIcon,
} from '@mui/icons-material';
import {
  fetchCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
  validateBTW,
  validateKVK,
  clearValidationResult,
} from '../../store/slices/companiesSlice';
import toast from 'react-hot-toast';
import { useForm, Controller } from 'react-hook-form';

const Companies = () => {
  const dispatch = useDispatch();
  const { 
    companies, 
    total, 
    page, 
    limit, 
    loading, 
    error, 
    validationLoading, 
    validationResult 
  } = useSelector(state => state.companies);
  
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [countryFilter, setCountryFilter] = useState('all');
  
  const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      postalCode: '',
      country: 'NL',
      btwNumber: '',
      kvkNumber: '',
      website: '',
      isActive: true,
      isDutch: true,
      notes: '',
    },
  });

  const watchCountry = watch('country');
  const watchIsDutch = watch('isDutch');

  useEffect(() => {
    dispatch(fetchCompanies({ page, limit, search: searchTerm, country: countryFilter }));
  }, [dispatch, page, limit, searchTerm, countryFilter]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  useEffect(() => {
    if (validationResult) {
      if (validationResult.valid) {
        toast.success(`تم التحقق بنجاح: ${validationResult.message}`);
      } else {
        toast.error(`فشل التحقق: ${validationResult.message}`);
      }
    }
  }, [validationResult]);

  // Update isDutch when country changes
  useEffect(() => {
    setValue('isDutch', watchCountry === 'NL');
  }, [watchCountry, setValue]);

  const handleOpenDialog = (company = null) => {
    if (company) {
      setEditMode(true);
      setSelectedCompany(company);
      reset(company);
    } else {
      setEditMode(false);
      setSelectedCompany(null);
      reset({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        postalCode: '',
        country: 'NL',
        btwNumber: '',
        kvkNumber: '',
        website: '',
        isActive: true,
        isDutch: true,
        notes: '',
      });
    }
    setOpen(true);
    dispatch(clearValidationResult());
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditMode(false);
    setSelectedCompany(null);
    reset();
    dispatch(clearValidationResult());
  };

  const handleValidateBTW = () => {
    const btwNumber = watch('btwNumber');
    if (btwNumber) {
      dispatch(validateBTW(btwNumber));
    } else {
      toast.error('يرجى إدخال رقم BTW');
    }
  };

  const handleValidateKVK = () => {
    const kvkNumber = watch('kvkNumber');
    if (kvkNumber) {
      dispatch(validateKVK(kvkNumber));
    } else {
      toast.error('يرجى إدخال رقم KVK');
    }
  };

  const onSubmit = async (data) => {
    try {
      if (editMode) {
        await dispatch(updateCompany({ id: selectedCompany._id, data })).unwrap();
        toast.success('تم تحديث الشركة بنجاح');
      } else {
        await dispatch(createCompany(data)).unwrap();
        toast.success('تم إضافة الشركة بنجاح');
      }
      handleCloseDialog();
    } catch (error) {
      toast.error(error);
    }
  };

  const handleDelete = async () => {
    try {
      await dispatch(deleteCompany(selectedCompany._id)).unwrap();
      toast.success('تم حذف الشركة بنجاح');
      setDeleteDialog(false);
      setSelectedCompany(null);
    } catch (error) {
      toast.error(error);
    }
  };

  const getStatusColor = (isActive) => {
    return isActive ? 'success' : 'error';
  };

  const getStatusText = (isActive) => {
    return isActive ? 'نشطة' : 'غير نشطة';
  };

  const getCountryFlag = (country) => {
    const flags = {
      'NL': '🇳🇱',
      'DE': '🇩🇪',
      'BE': '🇧🇪',
      'FR': '🇫🇷',
      'GB': '🇬🇧',
      'US': '🇺🇸',
    };
    return flags[country] || '🌍';
  };

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (company.city && company.city.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCountry = countryFilter === 'all' || company.country === countryFilter;
    return matchesSearch && matchesCountry;
  });

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          إدارة الشركات المستلمة
        </Typography>
        <Typography variant="subtitle1" sx={{ color: 'text.secondary' }}>
          إدارة بيانات الشركات المستلمة للفواتير مع التحقق من BTW و KVK
        </Typography>
      </Box>

      {/* Filters and Actions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="بحث في الشركات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>الدولة</InputLabel>
                <Select
                  value={countryFilter}
                  onChange={(e) => setCountryFilter(e.target.value)}
                  label="الدولة"
                >
                  <MenuItem value="all">جميع الدول</MenuItem>
                  <MenuItem value="NL">🇳🇱 هولندا</MenuItem>
                  <MenuItem value="DE">🇩🇪 ألمانيا</MenuItem>
                  <MenuItem value="BE">🇧🇪 بلجيكا</MenuItem>
                  <MenuItem value="FR">🇫🇷 فرنسا</MenuItem>
                  <MenuItem value="GB">🇬🇧 بريطانيا</MenuItem>
                  <MenuItem value="US">🇺🇸 أمريكا</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={5} sx={{ textAlign: 'right' }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
                size="large"
                sx={{ borderRadius: 2 }}
              >
                إضافة شركة جديدة
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Companies Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>الحالة</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>اسم الشركة</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>الدولة</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>المدينة</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>البريد الإلكتروني</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>BTW/KVK</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>العمليات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, index) => (
                  <TableRow key={index}>
                    {[...Array(7)].map((_, cellIndex) => (
                      <TableCell key={cellIndex}>
                        <Box sx={{ height: 20, bgcolor: 'action.hover', borderRadius: 1 }} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredCompanies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      لا توجد شركات مطابقة للبحث
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCompanies.map((company) => (
                  <TableRow 
                    key={company._id}
                    sx={{
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    <TableCell>
                      <Chip
                        label={getStatusText(company.isActive)}
                        color={getStatusColor(company.isActive)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {company.name}
                        </Typography>
                        {company.website && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                            <WebIcon sx={{ fontSize: 14, mr: 0.5, color: 'action.active' }} />
                            <Typography variant="caption" color="text.secondary">
                              {company.website}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ mr: 1 }}>
                          {getCountryFlag(company.country)}
                        </Typography>
                        <Typography variant="body2">
                          {company.country}
                        </Typography>
                        {company.isDutch && (
                          <Chip label="هولندية" size="small" color="primary" sx={{ ml: 1 }} />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LocationIcon sx={{ fontSize: 16, mr: 1, color: 'action.active' }} />
                        <Typography variant="body2">
                          {company.city}
                          {company.postalCode && `, ${company.postalCode}`}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <EmailIcon sx={{ fontSize: 16, mr: 1, color: 'action.active' }} />
                        <Typography variant="body2">{company.email}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        {company.btwNumber && (
                          <Typography variant="caption" sx={{ display: 'block' }}>
                            BTW: {company.btwNumber}
                          </Typography>
                        )}
                        {company.kvkNumber && (
                          <Typography variant="caption" sx={{ display: 'block' }}>
                            KVK: {company.kvkNumber}
                          </Typography>
                        )}
                        {!company.btwNumber && !company.kvkNumber && (
                          <Typography variant="caption" color="text.secondary">
                            غير محدد
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="تعديل">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(company)}
                            sx={{ color: 'primary.main' }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="حذف">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedCompany(company);
                              setDeleteDialog(true);
                            }}
                            sx={{ color: 'error.main' }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          component="div"
          count={total}
          page={page - 1}
          onPageChange={(e, newPage) => dispatch({ type: 'companies/setPage', payload: newPage + 1 })}
          rowsPerPage={limit}
          rowsPerPageOptions={[limit]}
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} من ${count}`
          }
          labelRowsPerPage="عدد الصفوف:"
        />
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
        <DialogTitle>
          {editMode ? 'تعديل شركة' : 'إضافة شركة جديدة'}
        </DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Grid container spacing={3}>
              {/* Basic Information */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                  المعلومات الأساسية
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Controller
                  name="name"
                  control={control}
                  rules={{ required: 'اسم الشركة مطلوب' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="اسم الشركة *"
                      error={!!errors.name}
                      helperText={errors.name?.message}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Controller
                  name="email"
                  control={control}
                  rules={{ 
                    required: 'البريد الإلكتروني مطلوب',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'بريد إلكتروني غير صحيح'
                    }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="البريد الإلكتروني *"
                      type="email"
                      error={!!errors.email}
                      helperText={errors.email?.message}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="رقم الهاتف"
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Controller
                  name="website"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="موقع الويب"
                      placeholder="https://example.com"
                    />
                  )}
                />
              </Grid>

              {/* Location Information */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, mt: 2, color: 'primary.main' }}>
                  معلومات الموقع
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Controller
                  name="country"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>الدولة *</InputLabel>
                      <Select {...field} label="الدولة *">
                        <MenuItem value="NL">🇳🇱 هولندا</MenuItem>
                        <MenuItem value="DE">🇩🇪 ألمانيا</MenuItem>
                        <MenuItem value="BE">🇧🇪 بلجيكا</MenuItem>
                        <MenuItem value="FR">🇫🇷 فرنسا</MenuItem>
                        <MenuItem value="GB">🇬🇧 بريطانيا</MenuItem>
                        <MenuItem value="US">🇺🇸 أمريكا</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Controller
                  name="city"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="المدينة"
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Controller
                  name="postalCode"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="الرمز البريدي"
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Controller
                  name="address"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="العنوان الكامل"
                      multiline
                      rows={2}
                    />
                  )}
                />
              </Grid>

              {/* BTW & KVK Section */}
              {watchIsDutch && (
                <>
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ mb: 2, mt: 2, color: 'primary.main' }}>
                      معلومات BTW و KVK (للشركات الهولندية)
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Controller
                      name="btwNumber"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="رقم BTW"
                          placeholder="NL123456789B01"
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                <Tooltip title="تحقق من رقم BTW">
                                  <IconButton
                                    onClick={handleValidateBTW}
                                    disabled={validationLoading}
                                    edge="end"
                                  >
                                    {validationLoading ? <CircularProgress size={20} /> : <CheckIcon />}
                                  </IconButton>
                                </Tooltip>
                              </InputAdornment>
                            ),
                          }}
                        />
                      )}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Controller
                      name="kvkNumber"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="رقم KVK"
                          placeholder="12345678"
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                <Tooltip title="تحقق من رقم KVK">
                                  <IconButton
                                    onClick={handleValidateKVK}
                                    disabled={validationLoading}
                                    edge="end"
                                  >
                                    {validationLoading ? <CircularProgress size={20} /> : <CheckIcon />}
                                  </IconButton>
                                </Tooltip>
                              </InputAdornment>
                            ),
                          }}
                        />
                      )}
                    />
                  </Grid>
                </>
              )}

              {/* Validation Result */}
              {validationResult && (
                <Grid item xs={12}>
                  <Alert severity={validationResult.valid ? 'success' : 'error'}>
                    {validationResult.message}
                    {validationResult.details && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2">
                          {JSON.stringify(validationResult.details, null, 2)}
                        </Typography>
                      </Box>
                    )}
                  </Alert>
                </Grid>
              )}

              {/* Settings */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, mt: 2, color: 'primary.main' }}>
                  إعدادات
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Controller
                  name="isActive"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Switch {...field} checked={field.value} />}
                      label="شركة نشطة"
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Controller
                  name="isDutch"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Switch {...field} checked={field.value} disabled />}
                      label="شركة هولندية (يتم تحديدها حسب الدولة)"
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Controller
                  name="notes"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="ملاحظات"
                      multiline
                      rows={3}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>إلغاء</Button>
            <Button type="submit" variant="contained">
              {editMode ? 'تحديث' : 'إضافة'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>تأكيد الحذف</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            هل أنت متأكد من حذف الشركة "{selectedCompany?.name}"?
            هذه العملية لا يمكن التراجع عنها.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>إلغاء</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            حذف
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Companies;
