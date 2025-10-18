import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Alert,
  CircularProgress,
  InputAdornment,
  FormControlLabel,
  Radio,
  RadioGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  Badge,
  Tab,
  Tabs,
  Stepper,
  Step,
  StepLabel,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Upload as UploadIcon,
  Preview as PreviewIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Calculate as CalculateIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  FileCopy as CopyIcon,
} from '@mui/icons-material';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import toast from 'react-hot-toast';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const CreatePDFInvoice = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState(1);
  const [previewMode, setPreviewMode] = useState(false);
  const [logo, setLogo] = useState(null);
  const [logoPosition, setLogoPosition] = useState({ x: 50, y: 50, width: 100, height: 50 });
  const [calculating, setCalculating] = useState(false);
  const [commissionType, setCommissionType] = useState('21-9');
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState('2025-001');
  const [validationResults, setValidationResults] = useState({});
  const logoInputRef = useRef(null);
  
  const { control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
    defaultValues: {
      // Client Information
      clientType: 'existing',
      clientId: '',
      newClient: {
        name: '',
        email: '',
        phone: '',
        address: '',
        type: 'broker',
      },
      
      // Company Information
      companyType: 'existing',
      companyId: '',
      newCompany: {
        name: '',
        email: '',
        address: '',
        city: '',
        country: 'NL',
        btwNumber: '',
        kvkNumber: '',
      },
      
      // Payment Company
      paymentCompanyId: '',
      
      // Invoice Details
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      currency: 'EUR',
      vatRate: 21,
      
      // Line Items
      items: [{
        description: '',
        quantity: 1,
        unitPrice: 0,
        vatRate: 21,
        total: 0,
      }],
      
      // Commission Settings
      commissionType: '21-9',
      commission21_9: {
        forUs: 0,
        forThem: 0,
      },
      verlichtCommission: {
        percentage: 0,
        brokerPercentage: 0,
      },
      
      // Additional
      notes: '',
    },
  });
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });
  
  const watchItems = watch('items');
  const watchPaymentCompany = watch('paymentCompanyId');
  const watchCommissionType = watch('commissionType');
  
  // Mock data
  const templates = [
    { id: 1, name: 'Template Modern', preview: '/templates/modern.png' },
    { id: 2, name: 'Template Classic', preview: '/templates/classic.png' },
    { id: 3, name: 'Template Professional', preview: '/templates/professional.png' },
    { id: 4, name: 'Template Minimal', preview: '/templates/minimal.png' },
    { id: 5, name: 'Template Corporate', preview: '/templates/corporate.png' },
    { id: 6, name: 'Template Creative', preview: '/templates/creative.png' },
  ];
  
  const mockClients = [
    { _id: '1', name: 'أحمد محمد', type: 'broker', email: 'ahmed@example.com' },
    { _id: '2', name: 'سارة أحمد', type: 'financier', email: 'sara@example.com' },
  ];
  
  const mockCompanies = [
    { _id: '1', name: 'شركة أمستردام التجارية', country: 'NL', btwNumber: 'NL123456789B01' },
    { _id: '2', name: 'Rotterdam Business Center', country: 'NL', btwNumber: 'NL987654321B01' },
  ];
  
  const mockPaymentCompanies = [
    { _id: '1', name: 'ING Bank Nederland', iban: 'NL91INGB0002445588' },
    { _id: '2', name: 'ABN AMRO', iban: 'NL12ABNA0123456789' },
  ];

  const steps = [
    'معلومات العميل',
    'معلومات الشركة',
    'تفاصيل الفاتورة',
    'النسب والعمولات',
    'المعاينة والتصدير',
  ];

  // Calculate totals
  const calculateTotals = () => {
    let subtotal = 0;
    watchItems.forEach((item, index) => {
      const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
      subtotal += itemTotal;
      setValue(`items.${index}.total`, itemTotal);
    });
    
    const vatAmount = subtotal * ((watch('vatRate') || 0) / 100);
    const total = subtotal + vatAmount;
    
    return { subtotal, vatAmount, total };
  };
  
  // Generate next invoice number based on IBAN
  const generateInvoiceNumber = () => {
    const paymentCompany = mockPaymentCompanies.find(c => c._id === watchPaymentCompany);
    if (paymentCompany) {
      const year = new Date().getFullYear();
      const lastDigits = paymentCompany.iban.slice(-4);
      // This would normally come from the database
      const nextNumber = '001'; // Mock next number
      setNextInvoiceNumber(`${year}-${lastDigits}-${nextNumber}`);
    }
  };
  
  useEffect(() => {
    if (watchPaymentCompany) {
      generateInvoiceNumber();
    }
  }, [watchPaymentCompany]);
  
  // Calculate commissions
  const calculateCommissions = () => {
    setCalculating(true);
    const totals = calculateTotals();
    
    setTimeout(() => {
      let results = {};
      
      switch (watchCommissionType) {
        case '21-9':
          const commission21_9 = watch('commission21_9');
          results = {
            forUs: (totals.subtotal * (commission21_9.forUs || 0)) / 100,
            forThem: (totals.subtotal * (commission21_9.forThem || 0)) / 100,
            remaining: totals.subtotal - ((totals.subtotal * (commission21_9.forUs || 0)) / 100) - ((totals.subtotal * (commission21_9.forThem || 0)) / 100),
          };
          break;
          
        case '0':
          results = {
            forUs: 0,
            forThem: 0,
            remaining: totals.subtotal,
            note: 'يتم تسجيل المبلغ كما هو بدون أرباح - يجب استيفاؤه من قبل الوسيط أو الممول',
          };
          break;
          
        case 'verlicht':
          const verlicht = watch('verlichtCommission');
          const totalPercentage = (verlicht.percentage || 0) + (verlicht.brokerPercentage || 0);
          results = {
            forUs: (totals.subtotal * (verlicht.percentage || 0)) / 100,
            forBroker: (totals.subtotal * (verlicht.brokerPercentage || 0)) / 100,
            remaining: totals.subtotal - ((totals.subtotal * totalPercentage) / 100),
          };
          break;
          
        default:
          results = { forUs: 0, forThem: 0, remaining: totals.subtotal };
      }
      
      setCalculating(false);
      toast.success('تم حساب النسب بنجاح');
    }, 1000);
  };
  
  // Handle logo upload
  const handleLogoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogo({
          file,
          url: e.target.result,
          name: file.name,
        });
        toast.success('تم رفع الشعار بنجاح');
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Validate BTW/KVK
  const validateCompanyNumbers = async (btwNumber, kvkNumber) => {
    if (!btwNumber && !kvkNumber) return;
    
    try {
      // Mock validation - replace with real API calls
      setTimeout(() => {
        setValidationResults({
          btw: btwNumber ? { valid: true, message: 'رقم BTW صحيح' } : null,
          kvk: kvkNumber ? { valid: true, message: 'رقم KVK صحيح' } : null,
        });
      }, 1000);
    } catch (error) {
      toast.error('فشل في التحقق من البيانات');
    }
  };
  
  // Handle form submission
  const onSubmit = async (data) => {
    try {
      // Here you would send the data to the backend
      console.log('Invoice Data:', data);
      toast.success('تم إنشاء الفاتورة بنجاح');
    } catch (error) {
      toast.error('فشل في إنشاء الفاتورة');
    }
  };
  
  const totals = calculateTotals();

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          إنشاء فاتورة PDF
        </Typography>
        <Typography variant="subtitle1" sx={{ color: 'text.secondary' }}>
          إنشاء فواتير احترافية مع معاينة مباشرة وحساب النسب التلقائي
        </Typography>
      </Box>

      {/* Progress Stepper */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Main Form */}
        <Grid item xs={12} lg={8}>
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Step 1: Client Information */}
            {activeStep === 0 && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 3, color: 'primary.main' }}>
                    معلومات العميل (الوسيط/الممول)
                  </Typography>
                  
                  <Controller
                    name="clientType"
                    control={control}
                    render={({ field }) => (
                      <RadioGroup {...field} row sx={{ mb: 3 }}>
                        <FormControlLabel
                          value="existing"
                          control={<Radio />}
                          label="عميل موجود"
                        />
                        <FormControlLabel
                          value="new"
                          control={<Radio />}
                          label="عميل جديد"
                        />
                      </RadioGroup>
                    )}
                  />
                  
                  {watch('clientType') === 'existing' ? (
                    <FormControl fullWidth>
                      <InputLabel>اختر العميل</InputLabel>
                      <Controller
                        name="clientId"
                        control={control}
                        rules={{ required: 'يرجى اختيار العميل' }}
                        render={({ field }) => (
                          <Select {...field} label="اختر العميل">
                            {mockClients.map((client) => (
                              <MenuItem key={client._id} value={client._id}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <Chip
                                    label={client.type === 'broker' ? 'وسيط' : 'ممول'}
                                    size="small"
                                    color={client.type === 'broker' ? 'primary' : 'secondary'}
                                  />
                                  <Typography>{client.name}</Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {client.email}
                                  </Typography>
                                </Box>
                              </MenuItem>
                            ))}
                          </Select>
                        )}
                      />
                    </FormControl>
                  ) : (
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Controller
                          name="newClient.name"
                          control={control}
                          rules={{ required: 'اسم العميل مطلوب' }}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="اسم العميل *"
                              error={!!errors.newClient?.name}
                              helperText={errors.newClient?.name?.message}
                            />
                          )}
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <Controller
                          name="newClient.type"
                          control={control}
                          render={({ field }) => (
                            <FormControl fullWidth>
                              <InputLabel>نوع العميل</InputLabel>
                              <Select {...field} label="نوع العميل">
                                <MenuItem value="broker">وسيط</MenuItem>
                                <MenuItem value="financier">ممول</MenuItem>
                              </Select>
                            </FormControl>
                          )}
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <Controller
                          name="newClient.email"
                          control={control}
                          rules={{ required: 'البريد الإلكتروني مطلوب' }}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="البريد الإلكتروني *"
                              type="email"
                              error={!!errors.newClient?.email}
                              helperText={errors.newClient?.email?.message}
                            />
                          )}
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <Controller
                          name="newClient.phone"
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
                      
                      <Grid item xs={12}>
                        <Controller
                          name="newClient.address"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="العنوان"
                              multiline
                              rows={2}
                            />
                          )}
                        />
                      </Grid>
                    </Grid>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 2: Company Information */}
            {activeStep === 1 && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 3, color: 'primary.main' }}>
                    معلومات الشركة المستلمة
                  </Typography>
                  
                  <Controller
                    name="companyType"
                    control={control}
                    render={({ field }) => (
                      <RadioGroup {...field} row sx={{ mb: 3 }}>
                        <FormControlLabel
                          value="existing"
                          control={<Radio />}
                          label="شركة موجودة"
                        />
                        <FormControlLabel
                          value="new"
                          control={<Radio />}
                          label="شركة جديدة"
                        />
                      </RadioGroup>
                    )}
                  />
                  
                  {watch('companyType') === 'existing' ? (
                    <FormControl fullWidth>
                      <InputLabel>اختر الشركة</InputLabel>
                      <Controller
                        name="companyId"
                        control={control}
                        rules={{ required: 'يرجى اختيار الشركة' }}
                        render={({ field }) => (
                          <Select {...field} label="اختر الشركة">
                            {mockCompanies.map((company) => (
                              <MenuItem key={company._id} value={company._id}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <Typography>{company.name}</Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {company.country}
                                  </Typography>
                                  {company.btwNumber && (
                                    <Chip label={`BTW: ${company.btwNumber}`} size="small" />
                                  )}
                                </Box>
                              </MenuItem>
                            ))}
                          </Select>
                        )}
                      />
                    </FormControl>
                  ) : (
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Controller
                          name="newCompany.name"
                          control={control}
                          rules={{ required: 'اسم الشركة مطلوب' }}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="اسم الشركة *"
                              error={!!errors.newCompany?.name}
                              helperText={errors.newCompany?.name?.message}
                            />
                          )}
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <Controller
                          name="newCompany.email"
                          control={control}
                          rules={{ required: 'البريد الإلكتروني مطلوب' }}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="البريد الإلكتروني *"
                              type="email"
                              error={!!errors.newCompany?.email}
                              helperText={errors.newCompany?.email?.message}
                            />
                          )}
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={4}>
                        <Controller
                          name="newCompany.country"
                          control={control}
                          render={({ field }) => (
                            <FormControl fullWidth>
                              <InputLabel>الدولة</InputLabel>
                              <Select {...field} label="الدولة">
                                <MenuItem value="NL">🇳🇱 هولندا</MenuItem>
                                <MenuItem value="DE">🇩🇪 ألمانيا</MenuItem>
                                <MenuItem value="BE">🇧🇪 بلجيكا</MenuItem>
                                <MenuItem value="FR">🇫🇷 فرنسا</MenuItem>
                              </Select>
                            </FormControl>
                          )}
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={8}>
                        <Controller
                          name="newCompany.city"
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
                      
                      {watch('newCompany.country') === 'NL' && (
                        <>
                          <Grid item xs={12} md={6}>
                            <Controller
                              name="newCompany.btwNumber"
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
                                        <IconButton
                                          onClick={() => validateCompanyNumbers(field.value, watch('newCompany.kvkNumber'))}
                                          edge="end"
                                        >
                                          <CheckIcon />
                                        </IconButton>
                                      </InputAdornment>
                                    ),
                                  }}
                                />
                              )}
                            />
                          </Grid>
                          
                          <Grid item xs={12} md={6}>
                            <Controller
                              name="newCompany.kvkNumber"
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
                                        <IconButton
                                          onClick={() => validateCompanyNumbers(watch('newCompany.btwNumber'), field.value)}
                                          edge="end"
                                        >
                                          <CheckIcon />
                                        </IconButton>
                                      </InputAdornment>
                                    ),
                                  }}
                                />
                              )}
                            />
                          </Grid>
                        </>
                      )}
                      
                      <Grid item xs={12}>
                        <Controller
                          name="newCompany.address"
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
                    </Grid>
                  )}
                  
                  {/* Validation Results */}
                  {validationResults.btw && (
                    <Alert severity={validationResults.btw.valid ? 'success' : 'error'} sx={{ mt: 2 }}>
                      BTW: {validationResults.btw.message}
                    </Alert>
                  )}
                  {validationResults.kvk && (
                    <Alert severity={validationResults.kvk.valid ? 'success' : 'error'} sx={{ mt: 2 }}>
                      KVK: {validationResults.kvk.message}
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 3: Invoice Details */}
            {activeStep === 2 && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 3, color: 'primary.main' }}>
                    تفاصيل الفاتورة
                  </Typography>
                  
                  <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12} md={4}>
                      <Controller
                        name="invoiceDate"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="تاريخ الفاتورة"
                            type="date"
                            InputLabelProps={{ shrink: true }}
                          />
                        )}
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <Controller
                        name="dueDate"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="تاريخ الاستحقاق"
                            type="date"
                            InputLabelProps={{ shrink: true }}
                          />
                        )}
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <Controller
                        name="currency"
                        control={control}
                        render={({ field }) => (
                          <FormControl fullWidth>
                            <InputLabel>العملة</InputLabel>
                            <Select {...field} label="العملة">
                              <MenuItem value="EUR">يورو (EUR)</MenuItem>
                              <MenuItem value="USD">دولار أمريكي (USD)</MenuItem>
                              <MenuItem value="GBP">جنيه إسترليني (GBP)</MenuItem>
                            </Select>
                          </FormControl>
                        )}
                      />
                    </Grid>
                  </Grid>
                  
                  <Divider sx={{ my: 3 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">بنود الفاتورة</Typography>
                    <Button
                      startIcon={<AddIcon />}
                      onClick={() => append({
                        description: '',
                        quantity: 1,
                        unitPrice: 0,
                        vatRate: 21,
                        total: 0,
                      })}
                    >
                      إضافة بند
                    </Button>
                  </Box>
                  
                  {fields.map((field, index) => (
                    <Card key={field.id} sx={{ mb: 2, border: 1, borderColor: 'divider' }}>
                      <CardContent>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} md={4}>
                            <Controller
                              name={`items.${index}.description`}
                              control={control}
                              rules={{ required: 'وصف البند مطلوب' }}
                              render={({ field }) => (
                                <TextField
                                  {...field}
                                  fullWidth
                                  label="وصف البند"
                                  multiline
                                  rows={2}
                                  error={!!errors.items?.[index]?.description}
                                  helperText={errors.items?.[index]?.description?.message}
                                />
                              )}
                            />
                          </Grid>
                          
                          <Grid item xs={6} md={2}>
                            <Controller
                              name={`items.${index}.quantity`}
                              control={control}
                              render={({ field }) => (
                                <TextField
                                  {...field}
                                  fullWidth
                                  label="الكمية"
                                  type="number"
                                  inputProps={{ min: 0, step: 1 }}
                                  onChange={(e) => {
                                    field.onChange(parseFloat(e.target.value) || 0);
                                    calculateTotals();
                                  }}
                                />
                              )}
                            />
                          </Grid>
                          
                          <Grid item xs={6} md={2}>
                            <Controller
                              name={`items.${index}.unitPrice`}
                              control={control}
                              render={({ field }) => (
                                <TextField
                                  {...field}
                                  fullWidth
                                  label="سعر الوحدة"
                                  type="number"
                                  inputProps={{ min: 0, step: 0.01 }}
                                  onChange={(e) => {
                                    field.onChange(parseFloat(e.target.value) || 0);
                                    calculateTotals();
                                  }}
                                />
                              )}
                            />
                          </Grid>
                          
                          <Grid item xs={6} md={2}>
                            <Controller
                              name={`items.${index}.vatRate`}
                              control={control}
                              render={({ field }) => (
                                <FormControl fullWidth>
                                  <InputLabel>ضريبة القيمة المضافة</InputLabel>
                                  <Select {...field} label="ضريبة القيمة المضافة">
                                    <MenuItem value={0}>0%</MenuItem>
                                    <MenuItem value={9}>9%</MenuItem>
                                    <MenuItem value={21}>21%</MenuItem>
                                  </Select>
                                </FormControl>
                              )}
                            />
                          </Grid>
                          
                          <Grid item xs={6} md={1.5}>
                            <TextField
                              fullWidth
                              label="المجموع"
                              value={((watchItems[index]?.quantity || 0) * (watchItems[index]?.unitPrice || 0)).toFixed(2)}
                              InputProps={{ readOnly: true }}
                              variant="filled"
                            />
                          </Grid>
                          
                          <Grid item xs={12} md={0.5}>
                            <IconButton
                              color="error"
                              onClick={() => remove(index)}
                              disabled={fields.length === 1}
                            >
                              <RemoveIcon />
                            </IconButton>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {/* Totals Summary */}
                  <Card sx={{ mt: 3, bgcolor: 'background.default' }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2 }}>ملخص الفاتورة</Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography>المجموع الفرعي:</Typography>
                        <Typography sx={{ fontWeight: 'bold' }}>
                          €{totals.subtotal.toFixed(2)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography>ضريبة القيمة المضافة ({watch('vatRate')}%):</Typography>
                        <Typography sx={{ fontWeight: 'bold' }}>
                          €{totals.vatAmount.toFixed(2)}
                        </Typography>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="h6">المجموع الإجمالي:</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                          €{totals.total.toFixed(2)}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            )}

            {/* Step 4: Commission Calculations */}
            {activeStep === 3 && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 3, color: 'primary.main' }}>
                    حساب النسب والعمولات
                  </Typography>
                  
                  <Alert severity="info" sx={{ mb: 3 }}>
                    المبلغ الأساسي للحساب: €{totals.subtotal.toFixed(2)} (بدون ضريبة القيمة المضافة)
                  </Alert>
                  
                  <Controller
                    name="commissionType"
                    control={control}
                    render={({ field }) => (
                      <RadioGroup {...field} sx={{ mb: 3 }}>
                        <FormControlLabel
                          value="21-9"
                          control={<Radio />}
                          label={
                            <Box>
                              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                نمط 21-9
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                تحديد النسب لنا وله بشكل يدوي
                              </Typography>
                            </Box>
                          }
                        />
                        <FormControlLabel
                          value="0"
                          control={<Radio />}
                          label={
                            <Box>
                              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                نمط 0
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                تسجيل المبلغ كما هو بدون أرباح - يستوفى من قبل الوسيط أو الممول
                              </Typography>
                            </Box>
                          }
                        />
                        <FormControlLabel
                          value="verlicht"
                          control={<Radio />}
                          label={
                            <Box>
                              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                فيرلخت (Verlicht)
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                تحديد التقسيم بنسبة مئوية بين طرفين
                              </Typography>
                            </Box>
                          }
                        />
                      </RadioGroup>
                    )}
                  />
                  
                  {/* 21-9 Mode */}
                  {watchCommissionType === '21-9' && (
                    <Card sx={{ mb: 3, border: 1, borderColor: 'primary.main' }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                          إعدادات نمط 21-9
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <Controller
                              name="commission21_9.forUs"
                              control={control}
                              render={({ field }) => (
                                <TextField
                                  {...field}
                                  fullWidth
                                  label="النسبة لنا (%)"
                                  type="number"
                                  inputProps={{ min: 0, max: 100, step: 0.1 }}
                                  InputProps={{
                                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                  }}
                                />
                              )}
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Controller
                              name="commission21_9.forThem"
                              control={control}
                              render={({ field }) => (
                                <TextField
                                  {...field}
                                  fullWidth
                                  label="النسبة لهم (%)"
                                  type="number"
                                  inputProps={{ min: 0, max: 100, step: 0.1 }}
                                  InputProps={{
                                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                  }}
                                />
                              )}
                            />
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* 0 Mode */}
                  {watchCommissionType === '0' && (
                    <Card sx={{ mb: 3, border: 1, borderColor: 'warning.main' }}>
                      <CardContent>
                        <Alert severity="warning">
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            نمط بدون أرباح
                          </Typography>
                          <Typography variant="body2">
                            سيتم تسجيل المبلغ كما هو في الأرصدة بدون أرباح. 
                            يجب استيفاء المبلغ من قبل الوسيط أو الممول.
                          </Typography>
                        </Alert>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Verlicht Mode */}
                  {watchCommissionType === 'verlicht' && (
                    <Card sx={{ mb: 3, border: 1, borderColor: 'secondary.main' }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ mb: 2, color: 'secondary.main' }}>
                          إعدادات فيرلخت (Verlicht)
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <Controller
                              name="verlichtCommission.percentage"
                              control={control}
                              render={({ field }) => (
                                <TextField
                                  {...field}
                                  fullWidth
                                  label="نسبتنا (%)"
                                  type="number"
                                  inputProps={{ min: 0, max: 100, step: 0.1 }}
                                  InputProps={{
                                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                  }}
                                />
                              )}
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Controller
                              name="verlichtCommission.brokerPercentage"
                              control={control}
                              render={({ field }) => (
                                <TextField
                                  {...field}
                                  fullWidth
                                  label="نسبة الوسيط (%)"
                                  type="number"
                                  inputProps={{ min: 0, max: 100, step: 0.1 }}
                                  InputProps={{
                                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                  }}
                                />
                              )}
                            />
                          </Grid>
                        </Grid>
                        
                        <Alert severity="info" sx={{ mt: 2 }}>
                          المجموع الكلي للنسب: {
                            ((watch('verlichtCommission.percentage') || 0) + 
                             (watch('verlichtCommission.brokerPercentage') || 0)).toFixed(1)
                          }%
                        </Alert>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Calculate Button */}
                  <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={calculating ? <CircularProgress size={20} /> : <CalculateIcon />}
                      onClick={calculateCommissions}
                      disabled={calculating}
                      sx={{ minWidth: 200 }}
                    >
                      {calculating ? 'جاري الحساب...' : 'حساب النسب والأرباح'}
                    </Button>
                  </Box>
                  
                  {/* Commission Results */}
                  <Card sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2 }}>
                        نتائج حساب العمولات
                      </Typography>
                      
                      <Grid container spacing={2}>
                        {watchCommissionType === '21-9' && (
                          <>
                            <Grid item xs={12} md={4}>
                              <Paper sx={{ p: 2, textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary">نصيبنا</Typography>
                                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                                  €{((totals.subtotal * (watch('commission21_9.forUs') || 0)) / 100).toFixed(2)}
                                </Typography>
                              </Paper>
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <Paper sx={{ p: 2, textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary">نصيبهم</Typography>
                                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                  €{((totals.subtotal * (watch('commission21_9.forThem') || 0)) / 100).toFixed(2)}
                                </Typography>
                              </Paper>
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <Paper sx={{ p: 2, textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary">المتبقي</Typography>
                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                  €{(totals.subtotal - 
                                    ((totals.subtotal * (watch('commission21_9.forUs') || 0)) / 100) - 
                                    ((totals.subtotal * (watch('commission21_9.forThem') || 0)) / 100)
                                  ).toFixed(2)}
                                </Typography>
                              </Paper>
                            </Grid>
                          </>
                        )}
                        
                        {watchCommissionType === '0' && (
                          <Grid item xs={12}>
                            <Paper sx={{ p: 2, textAlign: 'center' }}>
                              <Typography variant="body2" color="text.secondary">المبلغ بدون أرباح</Typography>
                              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                €{totals.subtotal.toFixed(2)}
                              </Typography>
                              <Typography variant="caption" color="warning.main">
                                يستوفى من قبل الوسيط أو الممول
                              </Typography>
                            </Paper>
                          </Grid>
                        )}
                        
                        {watchCommissionType === 'verlicht' && (
                          <>
                            <Grid item xs={12} md={4}>
                              <Paper sx={{ p: 2, textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary">نصيبنا</Typography>
                                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                                  €{((totals.subtotal * (watch('verlichtCommission.percentage') || 0)) / 100).toFixed(2)}
                                </Typography>
                              </Paper>
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <Paper sx={{ p: 2, textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary">نصيب الوسيط</Typography>
                                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'secondary.main' }}>
                                  €{((totals.subtotal * (watch('verlichtCommission.brokerPercentage') || 0)) / 100).toFixed(2)}
                                </Typography>
                              </Paper>
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <Paper sx={{ p: 2, textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary">المتبقي</Typography>
                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                  €{(totals.subtotal - 
                                    ((totals.subtotal * ((watch('verlichtCommission.percentage') || 0) + 
                                                        (watch('verlichtCommission.brokerPercentage') || 0))) / 100)
                                  ).toFixed(2)}
                                </Typography>
                              </Paper>
                            </Grid>
                          </>
                        )}
                      </Grid>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            )}

            {/* Step 5: Preview and Export */}
            {activeStep === 4 && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 3, color: 'primary.main' }}>
                    المعاينة والتصدير
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={8}>
                      {/* Invoice Preview */}
                      <Paper 
                        sx={{ 
                          p: 3, 
                          minHeight: 400, 
                          border: 1, 
                          borderColor: 'divider',
                          position: 'relative',
                          bgcolor: 'background.paper'
                        }}
                      >
                        <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
                          معاينة الفاتورة - Template {selectedTemplate}
                        </Typography>
                        
                        {/* Mock Invoice Preview */}
                        <Box sx={{ border: '1px dashed', borderColor: 'divider', p: 2, mb: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            {logo && (
                              <Box
                                sx={{
                                  width: logoPosition.width,
                                  height: logoPosition.height,
                                  backgroundImage: `url(${logo.url})`,
                                  backgroundSize: 'contain',
                                  backgroundRepeat: 'no-repeat',
                                  border: '1px dashed',
                                  borderColor: 'primary.main',
                                }}
                              />
                            )}
                            <Box sx={{ textAlign: 'right' }}>
                              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>FACTUUR</Typography>
                              <Typography variant="body2">#{nextInvoiceNumber}</Typography>
                              <Typography variant="body2">Datum: {watch('invoiceDate')}</Typography>
                            </Box>
                          </Box>
                          
                          <Grid container spacing={2} sx={{ mb: 2 }}>
                            <Grid item xs={6}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Van:</Typography>
                              <Typography variant="body2">Uw Bedrijf</Typography>
                              <Typography variant="body2">Adres</Typography>
                              <Typography variant="body2">Amsterdam, Nederland</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Aan:</Typography>
                              <Typography variant="body2">
                                {watch('clientType') === 'existing' 
                                  ? mockClients.find(c => c._id === watch('clientId'))?.name 
                                  : watch('newClient.name')}
                              </Typography>
                              <Typography variant="body2">
                                {watch('companyType') === 'existing' 
                                  ? mockCompanies.find(c => c._id === watch('companyId'))?.name 
                                  : watch('newCompany.name')}
                              </Typography>
                            </Grid>
                          </Grid>
                          
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>Items:</Typography>
                            {watchItems.map((item, index) => (
                              <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="body2">{item.description || `Item ${index + 1}`}</Typography>
                                <Typography variant="body2">€{((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2)}</Typography>
                              </Box>
                            ))}
                          </Box>
                          
                          <Box sx={{ textAlign: 'right', mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                            <Typography variant="body2">Subtotaal: €{totals.subtotal.toFixed(2)}</Typography>
                            <Typography variant="body2">BTW ({watch('vatRate')}%): €{totals.vatAmount.toFixed(2)}</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                              Totaal: €{totals.total.toFixed(2)}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Alert severity="info">
                          هذه معاينة تقريبية للفاتورة. التصميم النهائي سيكون أكثر احترافية عند التصدير.
                        </Alert>
                      </Paper>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      {/* Export Options */}
                      <Card sx={{ mb: 2 }}>
                        <CardContent>
                          <Typography variant="h6" sx={{ mb: 2 }}>خيارات التصدير</Typography>
                          
                          <Controller
                            name="notes"
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                fullWidth
                                label="ملاحظات إضافية"
                                multiline
                                rows={3}
                                sx={{ mb: 2 }}
                              />
                            )}
                          />
                          
                          <Button
                            variant="contained"
                            fullWidth
                            size="large"
                            startIcon={<DownloadIcon />}
                            sx={{ mb: 1 }}
                            onClick={handleSubmit(onSubmit)}
                          >
                            تصدير وحفظ الفاتورة
                          </Button>
                          
                          <Button
                            variant="outlined"
                            fullWidth
                            startIcon={<SaveIcon />}
                            sx={{ mb: 1 }}
                          >
                            حفظ كمسودة
                          </Button>
                          
                          <Button
                            variant="outlined"
                            fullWidth
                            startIcon={<CopyIcon />}
                          >
                            نسخ كفاتورة جديدة
                          </Button>
                        </CardContent>
                      </Card>
                      
                      {/* Commission Summary */}
                      <Card>
                        <CardContent>
                          <Typography variant="h6" sx={{ mb: 2 }}>ملخص العمولات</Typography>
                          <Alert severity="success" sx={{ mb: 2 }}>
                            نمط العمولة: {
                              watchCommissionType === '21-9' ? '21-9' :
                              watchCommissionType === '0' ? 'بدون أرباح' :
                              'فيرلخت'
                            }
                          </Alert>
                          
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            المبلغ الأساسي: €{totals.subtotal.toFixed(2)}
                          </Typography>
                          
                          {watchCommissionType === '21-9' && (
                            <>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                نصيبنا ({watch('commission21_9.forUs')}%): €{((totals.subtotal * (watch('commission21_9.forUs') || 0)) / 100).toFixed(2)}
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                نصيبهم ({watch('commission21_9.forThem')}%): €{((totals.subtotal * (watch('commission21_9.forThem') || 0)) / 100).toFixed(2)}
                              </Typography>
                            </>
                          )}
                          
                          {watchCommissionType === 'verlicht' && (
                            <>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                نصيبنا ({watch('verlichtCommission.percentage')}%): €{((totals.subtotal * (watch('verlichtCommission.percentage') || 0)) / 100).toFixed(2)}
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                نصيب الوسيط ({watch('verlichtCommission.brokerPercentage')}%): €{((totals.subtotal * (watch('verlichtCommission.brokerPercentage') || 0)) / 100).toFixed(2)}
                              </Typography>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}

            {/* Navigation Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button
                onClick={() => setActiveStep(prev => Math.max(0, prev - 1))}
                disabled={activeStep === 0}
              >
                السابق
              </Button>
              
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  color="success"
                  size="large"
                  startIcon={<DownloadIcon />}
                  onClick={handleSubmit(onSubmit)}
                >
                  إنشاء وتصدير الفاتورة
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={() => setActiveStep(prev => Math.min(steps.length - 1, prev + 1))}
                >
                  التالي
                </Button>
              )}
            </Box>
          </form>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} lg={4}>
          {/* Template Selection */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                اختيار القالب
              </Typography>
              <Grid container spacing={2}>
                {templates.map((template) => (
                  <Grid item xs={6} key={template.id}>
                    <Paper
                      sx={{
                        p: 1,
                        border: selectedTemplate === template.id ? 2 : 1,
                        borderColor: selectedTemplate === template.id ? 'primary.main' : 'divider',
                        cursor: 'pointer',
                        '&:hover': {
                          borderColor: 'primary.main',
                        },
                      }}
                      onClick={() => setSelectedTemplate(template.id)}
                    >
                      <Box
                        sx={{
                          height: 100,
                          bgcolor: 'grey.100',
                          borderRadius: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 1,
                        }}
                      >
                        <Typography variant="caption">Template {template.id}</Typography>
                      </Box>
                      <Typography variant="caption" sx={{ textAlign: 'center', display: 'block' }}>
                        {template.name}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>

          {/* Logo Upload */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                شعار الشركة
              </Typography>
              
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                style={{ display: 'none' }}
                ref={logoInputRef}
              />
              
              <Button
                variant="outlined"
                startIcon={<UploadIcon />}
                onClick={() => logoInputRef.current?.click()}
                fullWidth
                sx={{ mb: 2 }}
              >
                رفع شعار
              </Button>
              
              {logo && (
                <Box>
                  <Box
                    sx={{
                      width: '100%',
                      height: 100,
                      border: '1px dashed',
                      borderColor: 'divider',
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 2,
                      backgroundImage: `url(${logo.url})`,
                      backgroundSize: 'contain',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'center',
                    }}
                  />
                  
                  <Typography variant="caption" sx={{ display: 'block', mb: 2 }}>
                    {logo.name}
                  </Typography>
                  
                  {/* Logo Position Controls */}
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>موقع الشعار:</Typography>
                  <Grid container spacing={1} sx={{ mb: 1 }}>
                    <Grid item xs={6}>
                      <TextField
                        label="X"
                        type="number"
                        size="small"
                        value={logoPosition.x}
                        onChange={(e) => setLogoPosition(prev => ({ ...prev, x: parseInt(e.target.value) }))}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        label="Y"
                        type="number"
                        size="small"
                        value={logoPosition.y}
                        onChange={(e) => setLogoPosition(prev => ({ ...prev, y: parseInt(e.target.value) }))}
                        fullWidth
                      />
                    </Grid>
                  </Grid>
                  
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>حجم الشعار:</Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <TextField
                        label="العرض"
                        type="number"
                        size="small"
                        value={logoPosition.width}
                        onChange={(e) => setLogoPosition(prev => ({ ...prev, width: parseInt(e.target.value) }))}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        label="الارتفاع"
                        type="number"
                        size="small"
                        value={logoPosition.height}
                        onChange={(e) => setLogoPosition(prev => ({ ...prev, height: parseInt(e.target.value) }))}
                        fullWidth
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Invoice Number */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                رقم الفاتورة
              </Typography>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>شركة الدفع</InputLabel>
                <Controller
                  name="paymentCompanyId"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} label="شركة الدفع">
                      {mockPaymentCompanies.map((company) => (
                        <MenuItem key={company._id} value={company._id}>
                          <Box>
                            <Typography variant="body2">{company.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {company.iban}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
              </FormControl>
              
              <Alert severity="info">
                رقم الفاتورة التالي: <strong>{nextInvoiceNumber}</strong>
              </Alert>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                إجراءات سريعة
              </Typography>
              
              <Button
                variant="outlined"
                startIcon={<PreviewIcon />}
                fullWidth
                sx={{ mb: 1 }}
                onClick={() => setPreviewMode(true)}
              >
                معاينة الفاتورة
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<SaveIcon />}
                fullWidth
                sx={{ mb: 1 }}
              >
                حفظ كمسودة
              </Button>
              
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                fullWidth
                color="success"
              >
                تصدير PDF
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CreatePDFInvoice;