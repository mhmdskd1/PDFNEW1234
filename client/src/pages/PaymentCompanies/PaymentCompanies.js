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
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  AccountBalance as BankIcon,
  CreditCard as CardIcon,
  Euro as EuroIcon,
  SwapHoriz as TransferIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';

const PaymentCompanies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  
  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      bankName: '',
      iban: '',
      bic: '',
      accountHolder: '',
      currency: 'EUR',
      paymentMethod: 'bank_transfer',
      isActive: true,
      notes: '',
    },
  });

  // Mock data for development
  useEffect(() => {
    setCompanies([
      {
        _id: '1',
        name: 'ING Bank Nederland',
        bankName: 'ING Bank',
        iban: 'NL91INGB0002445588',
        bic: 'INGBNL2A',
        accountHolder: 'شركة الفواتير المحدودة',
        currency: 'EUR',
        paymentMethod: 'bank_transfer',
        isActive: true,
        notes: 'البنك الرئيسي للشركة',
      },
      {
        _id: '2',
        name: 'ABN AMRO',
        bankName: 'ABN AMRO',
        iban: 'NL12ABNA0123456789',
        bic: 'ABNANL2A',
        accountHolder: 'شركة الفواتير المحدودة',
        currency: 'EUR',
        paymentMethod: 'bank_transfer',
        isActive: true,
        notes: 'حساب احتياطي',
      },
    ]);
  }, []);

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
        bankName: '',
        iban: '',
        bic: '',
        accountHolder: '',
        currency: 'EUR',
        paymentMethod: 'bank_transfer',
        isActive: true,
        notes: '',
      });
    }
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditMode(false);
    setSelectedCompany(null);
    reset();
  };

  const onSubmit = async (data) => {
    try {
      if (editMode) {
        // Update company
        setCompanies(prev => prev.map(c => 
          c._id === selectedCompany._id ? { ...c, ...data } : c
        ));
        toast.success('تم تحديث شركة الدفع بنجاح');
      } else {
        // Add new company
        const newCompany = {
          _id: Date.now().toString(),
          ...data,
        };
        setCompanies(prev => [newCompany, ...prev]);
        toast.success('تم إضافة شركة الدفع بنجاح');
      }
      handleCloseDialog();
    } catch (error) {
      toast.error('حدث خطأ أثناء العملية');
    }
  };

  const handleDelete = async () => {
    try {
      setCompanies(prev => prev.filter(c => c._id !== selectedCompany._id));
      toast.success('تم حذف شركة الدفع بنجاح');
      setDeleteDialog(false);
      setSelectedCompany(null);
    } catch (error) {
      toast.error('حدث خطأ أثناء الحذف');
    }
  };

  const getPaymentMethodColor = (method) => {
    switch (method) {
      case 'bank_transfer':
        return 'primary';
      case 'credit_card':
        return 'secondary';
      case 'paypal':
        return 'info';
      case 'crypto':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getPaymentMethodText = (method) => {
    switch (method) {
      case 'bank_transfer':
        return 'تحويل بنكي';
      case 'credit_card':
        return 'بطاقة ائتمان';
      case 'paypal':
        return 'PayPal';
      case 'crypto':
        return 'عملة رقمية';
      default:
        return method;
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'bank_transfer':
        return <BankIcon />;
      case 'credit_card':
        return <CardIcon />;
      case 'paypal':
        return <EuroIcon />;
      case 'crypto':
        return <TransferIcon />;
      default:
        return <BankIcon />;
    }
  };

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.bankName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.iban.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || company.paymentMethod === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          إدارة شركات الدفع (البنوك)
        </Typography>
        <Typography variant="subtitle1" sx={{ color: 'text.secondary' }}>
          إدارة بيانات البنوك وشركات الدفع التي تدفع الفواتير المحولة
        </Typography>
      </Box>

      {/* Filters and Actions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="بحث في شركات الدفع..."
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
                <InputLabel>نوع الدفع</InputLabel>
                <Select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  label="نوع الدفع"
                >
                  <MenuItem value="all">جميع الطرق</MenuItem>
                  <MenuItem value="bank_transfer">تحويل بنكي</MenuItem>
                  <MenuItem value="credit_card">بطاقة ائتمان</MenuItem>
                  <MenuItem value="paypal">PayPal</MenuItem>
                  <MenuItem value="crypto">عملة رقمية</MenuItem>
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
                إضافة شركة دفع جديدة
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Payment Companies Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>الحالة</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>اسم الشركة</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>البنك</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>IBAN</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>نوع الدفع</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>العملة</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>العمليات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCompanies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      لا توجد شركات دفع مطابقة للبحث
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
                        label={company.isActive ? 'نشطة' : 'غير نشطة'}
                        color={company.isActive ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {company.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {company.accountHolder}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <BankIcon sx={{ fontSize: 16, mr: 1, color: 'action.active' }} />
                        <Typography variant="body2">{company.bankName}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {company.iban}
                      </Typography>
                      {company.bic && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          BIC: {company.bic}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getPaymentMethodIcon(company.paymentMethod)}
                        label={getPaymentMethodText(company.paymentMethod)}
                        color={getPaymentMethodColor(company.paymentMethod)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{company.currency}</Typography>
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
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editMode ? 'تعديل شركة دفع' : 'إضافة شركة دفع جديدة'}
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
                  name="bankName"
                  control={control}
                  rules={{ required: 'اسم البنك مطلوب' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="اسم البنك *"
                      error={!!errors.bankName}
                      helperText={errors.bankName?.message}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Controller
                  name="accountHolder"
                  control={control}
                  rules={{ required: 'اسم صاحب الحساب مطلوب' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="اسم صاحب الحساب *"
                      error={!!errors.accountHolder}
                      helperText={errors.accountHolder?.message}
                    />
                  )}
                />
              </Grid>

              {/* Bank Details */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, mt: 2, color: 'primary.main' }}>
                  تفاصيل البنك
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={8}>
                <Controller
                  name="iban"
                  control={control}
                  rules={{ 
                    required: 'رقم IBAN مطلوب',
                    pattern: {
                      value: /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$/,
                      message: 'رقم IBAN غير صحيح'
                    }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="رقم IBAN *"
                      placeholder="NL91INGB0002445588"
                      error={!!errors.iban}
                      helperText={errors.iban?.message}
                      sx={{ fontFamily: 'monospace' }}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Controller
                  name="bic"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="BIC/SWIFT Code"
                      placeholder="INGBNL2A"
                      sx={{ fontFamily: 'monospace' }}
                    />
                  )}
                />
              </Grid>

              {/* Payment Settings */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, mt: 2, color: 'primary.main' }}>
                  إعدادات الدفع
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Controller
                  name="paymentMethod"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>نوع الدفع *</InputLabel>
                      <Select {...field} label="نوع الدفع *">
                        <MenuItem value="bank_transfer">تحويل بنكي</MenuItem>
                        <MenuItem value="credit_card">بطاقة ائتمان</MenuItem>
                        <MenuItem value="paypal">PayPal</MenuItem>
                        <MenuItem value="crypto">عملة رقمية</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Controller
                  name="currency"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>العملة *</InputLabel>
                      <Select {...field} label="العملة *">
                        <MenuItem value="EUR">يورو (EUR)</MenuItem>
                        <MenuItem value="USD">دولار أمريكي (USD)</MenuItem>
                        <MenuItem value="GBP">جنيه إسترليني (GBP)</MenuItem>
                        <MenuItem value="CHF">فرنك سويسري (CHF)</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Controller
                  name="isActive"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Switch {...field} checked={field.value} />}
                      label="شركة دفع نشطة"
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
            هل أنت متأكد من حذف شركة الدفع "{selectedCompany?.name}"؟
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

export default PaymentCompanies;