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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Paper,
  IconButton,
  Alert,
  InputAdornment,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Save as SaveIcon,
  Calculate as CalculateIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  Euro as EuroIcon,
} from '@mui/icons-material';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import toast from 'react-hot-toast';

const CreateDigitalInvoice = () => {
  const dispatch = useDispatch();
  const [calculating, setCalculating] = useState(false);
  const [commissionResults, setCommissionResults] = useState(null);
  
  const { control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
    defaultValues: {
      invoiceAmount: 0,
      vatRate: 21,
      vatAmount: 0,
      totalAmount: 0,
      mainBroker: {
        clientId: '',
        name: '',
        percentage: 0,
        amount: 0,
      },
      ourShare: {
        percentage: 0,
        amount: 0,
      },
      additionalBrokers: [],
      date: new Date().toISOString().split('T')[0],
      notes: '',
    },
  });
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'additionalBrokers',
  });
  
  const watchInvoiceAmount = watch('invoiceAmount');
  const watchVatRate = watch('vatRate');
  const watchMainBrokerPercentage = watch('mainBroker.percentage');
  const watchOurPercentage = watch('ourShare.percentage');
  const watchAdditionalBrokers = watch('additionalBrokers');
  
  // Mock clients data
  const mockClients = [
    { _id: '1', name: 'أحمد محمد', type: 'broker', email: 'ahmed@example.com' },
    { _id: '2', name: 'سارة أحمد', type: 'financier', email: 'sara@example.com' },
    { _id: '3', name: 'محمد علي', type: 'broker', email: 'mohamed@example.com' },
    { _id: '4', name: 'فاطمة خالد', type: 'broker', email: 'fatima@example.com' },
  ];
  
  // Calculate VAT amount when invoice amount or VAT rate changes
  useEffect(() => {
    const invoiceAmount = parseFloat(watchInvoiceAmount) || 0;
    const vatRate = parseFloat(watchVatRate) || 0;
    const vatAmount = (invoiceAmount * vatRate) / 100;
    const totalAmount = invoiceAmount + vatAmount;
    
    setValue('vatAmount', vatAmount);
    setValue('totalAmount', totalAmount);
  }, [watchInvoiceAmount, watchVatRate, setValue]);
  
  // Calculate commission amounts
  const calculateCommissions = () => {
    setCalculating(true);
    
    setTimeout(() => {
      const invoiceAmount = parseFloat(watchInvoiceAmount) || 0;
      const mainBrokerPercentage = parseFloat(watchMainBrokerPercentage) || 0;
      const ourPercentage = parseFloat(watchOurPercentage) || 0;
      
      // Calculate amounts for main broker and us
      const mainBrokerAmount = (invoiceAmount * mainBrokerPercentage) / 100;
      const ourAmount = (invoiceAmount * ourPercentage) / 100;
      
      setValue('mainBroker.amount', mainBrokerAmount);
      setValue('ourShare.amount', ourAmount);
      
      // Calculate additional brokers amounts
      let totalAdditionalAmount = 0;
      const updatedAdditionalBrokers = watchAdditionalBrokers.map((broker, index) => {
        const amount = (invoiceAmount * (parseFloat(broker.percentage) || 0)) / 100;
        totalAdditionalAmount += amount;
        setValue(`additionalBrokers.${index}.amount`, amount);
        return { ...broker, amount };
      });
      
      const totalAllocated = mainBrokerAmount + ourAmount + totalAdditionalAmount;
      const remaining = invoiceAmount - totalAllocated;
      
      setCommissionResults({
        mainBroker: { percentage: mainBrokerPercentage, amount: mainBrokerAmount },
        ourShare: { percentage: ourPercentage, amount: ourAmount },
        additionalBrokers: updatedAdditionalBrokers,
        totalAllocated,
        remaining,
        percentageUsed: (totalAllocated / invoiceAmount) * 100,
      });
      
      setCalculating(false);
      toast.success('تم حساب التوزيعات بنجاح');
    }, 1000);
  };
  
  // Add additional broker
  const addAdditionalBroker = () => {
    append({
      clientId: '',
      name: '',
      percentage: 0,
      amount: 0,
    });
  };
  
  // Handle form submission
  const onSubmit = async (data) => {
    try {
      if (!commissionResults) {
        toast.error('يرجى حساب التوزيعات أولاً');
        return;
      }
      
      if (commissionResults.remaining < 0) {
        toast.error('مجموع النسب يتجاوز 100%. يرجى التحقق من البيانات.');
        return;
      }
      
      console.log('Digital Invoice Data:', {
        ...data,
        commissionResults,
      });
      
      toast.success('تم إنشاء الفاتورة الرقمية بنجاح');
      
      // Reset form
      reset();
      setCommissionResults(null);
    } catch (error) {
      toast.error('فشل في إنشاء الفاتورة الرقمية');
    }
  };
  
  const getTotalPercentageUsed = () => {
    const mainPercentage = parseFloat(watchMainBrokerPercentage) || 0;
    const ourPercentage = parseFloat(watchOurPercentage) || 0;
    const additionalPercentage = watchAdditionalBrokers.reduce((sum, broker) => {
      return sum + (parseFloat(broker.percentage) || 0);
    }, 0);
    
    return mainPercentage + ourPercentage + additionalPercentage;
  };
  
  const totalPercentageUsed = getTotalPercentageUsed();
  const isOverLimit = totalPercentageUsed > 100;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          إنشاء فاتورة رقمية
        </Typography>
        <Typography variant="subtitle1" sx={{ color: 'text.secondary' }}>
          إنشاء فاتورة رقمية مع توزيع النسب تلقائياً على الوسطاء والأرصدة
        </Typography>
      </Box>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3}>
          {/* Main Form */}
          <Grid item xs={12} lg={8}>
            {/* Invoice Amount Section */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, color: 'primary.main' }}>
                  قيمة الفاتورة
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Controller
                      name="invoiceAmount"
                      control={control}
                      rules={{ 
                        required: 'مبلغ الفاتورة مطلوب',
                        min: { value: 0.01, message: 'يجب أن يكون المبلغ أكبر من 0' }
                      }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="مبلغ الفاتورة (بدون ضريبة القيمة المضافة) *"
                          type="number"
                          inputProps={{ min: 0, step: 0.01 }}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">€</InputAdornment>,
                          }}
                          error={!!errors.invoiceAmount}
                          helperText={errors.invoiceAmount?.message}
                        />
                      )}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Controller
                      name="vatRate"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <InputLabel>نسبة ضريبة القيمة المضافة</InputLabel>
                          <Select {...field} label="نسبة ضريبة القيمة المضافة">
                            <MenuItem value={0}>0%</MenuItem>
                            <MenuItem value={9}>9%</MenuItem>
                            <MenuItem value={21}>21%</MenuItem>
                          </Select>
                        </FormControl>
                      )}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="قيمة ضريبة القيمة المضافة"
                      value={`€${(watch('vatAmount') || 0).toFixed(2)}`}
                      InputProps={{ readOnly: true }}
                      variant="filled"
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="المبلغ الإجمالي"
                      value={`€${(watch('totalAmount') || 0).toFixed(2)}`}
                      InputProps={{ readOnly: true }}
                      variant="filled"
                      sx={{
                        '& .MuiFilledInput-input': {
                          fontWeight: 'bold',
                          fontSize: '1.1rem',
                        },
                      }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Commission Distribution */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, color: 'primary.main' }}>
                  توزيع النسب والعمولات
                </Typography>
                
                {/* Percentage Usage Alert */}
                <Alert 
                  severity={isOverLimit ? 'error' : totalPercentageUsed > 90 ? 'warning' : 'info'} 
                  sx={{ mb: 3 }}
                >
                  النسبة المستخدمة: {totalPercentageUsed.toFixed(1)}% من 100%
                  {isOverLimit && ' - تجاوزت النسبة الحد المسموح!'}
                </Alert>
                
                {/* Main Broker */}
                <Accordion expanded sx={{ mb: 2 }}>
                  <AccordionSummary sx={{ bgcolor: 'primary.light', color: 'white' }}>
                    <PersonIcon sx={{ mr: 1 }} />
                    <Typography variant="h6">الوسيط الرئيسي</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Controller
                          name="mainBroker.clientId"
                          control={control}
                          rules={{ required: 'يرجى اختيار الوسيط الرئيسي' }}
                          render={({ field }) => (
                            <FormControl fullWidth error={!!errors.mainBroker?.clientId}>
                              <InputLabel>اختر الوسيط الرئيسي *</InputLabel>
                              <Select 
                                {...field} 
                                label="اختر الوسيط الرئيسي *"
                                onChange={(e) => {
                                  field.onChange(e);
                                  const selectedClient = mockClients.find(c => c._id === e.target.value);
                                  if (selectedClient) {
                                    setValue('mainBroker.name', selectedClient.name);
                                  }
                                }}
                              >
                                {mockClients.map((client) => (
                                  <MenuItem key={client._id} value={client._id}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Chip
                                        label={client.type === 'broker' ? 'وسيط' : 'ممول'}
                                        size="small"
                                        color={client.type === 'broker' ? 'primary' : 'secondary'}
                                      />
                                      <Typography>{client.name}</Typography>
                                    </Box>
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          )}
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={3}>
                        <Controller
                          name="mainBroker.percentage"
                          control={control}
                          rules={{ 
                            required: 'نسبة الوسيط الرئيسي مطلوبة',
                            min: { value: 0, message: 'النسبة يجب أن تكون 0 أو أكثر' },
                            max: { value: 100, message: 'النسبة يجب أن تكون 100 أو أقل' }
                          }}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="النسبة % *"
                              type="number"
                              inputProps={{ min: 0, max: 100, step: 0.1 }}
                              InputProps={{
                                endAdornment: <InputAdornment position="end">%</InputAdornment>,
                              }}
                              error={!!errors.mainBroker?.percentage}
                              helperText={errors.mainBroker?.percentage?.message}
                            />
                          )}
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={3}>
                        <TextField
                          fullWidth
                          label="المبلغ"
                          value={`€${(watch('mainBroker.amount') || 0).toFixed(2)}`}
                          InputProps={{ readOnly: true }}
                          variant="filled"
                        />
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
                
                {/* Our Share */}
                <Accordion expanded sx={{ mb: 2 }}>
                  <AccordionSummary sx={{ bgcolor: 'success.light', color: 'white' }}>
                    <EuroIcon sx={{ mr: 1 }} />
                    <Typography variant="h6">نصيبنا (الأرباح)</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Controller
                          name="ourShare.percentage"
                          control={control}
                          rules={{ 
                            required: 'نسبة أرباحنا مطلوبة',
                            min: { value: 0, message: 'النسبة يجب أن تكون 0 أو أكثر' },
                            max: { value: 100, message: 'النسبة يجب أن تكون 100 أو أقل' }
                          }}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="نسبة الربح % *"
                              type="number"
                              inputProps={{ min: 0, max: 100, step: 0.1 }}
                              InputProps={{
                                endAdornment: <InputAdornment position="end">%</InputAdornment>,
                              }}
                              error={!!errors.ourShare?.percentage}
                              helperText={errors.ourShare?.percentage?.message}
                            />
                          )}
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="مبلغ الربح"
                          value={`€${(watch('ourShare.amount') || 0).toFixed(2)}`}
                          InputProps={{ readOnly: true }}
                          variant="filled"
                        />
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
                
                {/* Additional Brokers */}
                <Accordion expanded sx={{ mb: 2 }}>
                  <AccordionSummary sx={{ bgcolor: 'secondary.light', color: 'white' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PersonIcon sx={{ mr: 1 }} />
                        <Typography variant="h6">وسطاء إضافيون ({fields.length})</Typography>
                      </Box>
                      <IconButton
                        onClick={addAdditionalBroker}
                        sx={{ color: 'white' }}
                      >
                        <AddIcon />
                      </IconButton>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    {fields.length === 0 ? (
                      <Alert severity="info">
                        لا توجد وسطاء إضافيون. يمكنك إضافة وسطاء ثانويين هنا.
                      </Alert>
                    ) : (
                      fields.map((field, index) => (
                        <Card key={field.id} sx={{ mb: 2, border: 1, borderColor: 'divider' }}>
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 2 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                وسيط إضافي #{index + 1}
                              </Typography>
                              <IconButton
                                color="error"
                                onClick={() => remove(index)}
                                size="small"
                              >
                                <RemoveIcon />
                              </IconButton>
                            </Box>
                            
                            <Grid container spacing={2}>
                              <Grid item xs={12} md={6}>
                                <Controller
                                  name={`additionalBrokers.${index}.clientId`}
                                  control={control}
                                  rules={{ required: 'يرجى اختيار الوسيط' }}
                                  render={({ field }) => (
                                    <FormControl fullWidth>
                                      <InputLabel>اختر الوسيط</InputLabel>
                                      <Select 
                                        {...field} 
                                        label="اختر الوسيط"
                                        onChange={(e) => {
                                          field.onChange(e);
                                          const selectedClient = mockClients.find(c => c._id === e.target.value);
                                          if (selectedClient) {
                                            setValue(`additionalBrokers.${index}.name`, selectedClient.name);
                                          }
                                        }}
                                      >
                                        {mockClients.map((client) => (
                                          <MenuItem key={client._id} value={client._id}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                              <Chip
                                                label={client.type === 'broker' ? 'وسيط' : 'ممول'}
                                                size="small"
                                                color={client.type === 'broker' ? 'primary' : 'secondary'}
                                              />
                                              <Typography>{client.name}</Typography>
                                            </Box>
                                          </MenuItem>
                                        ))}
                                      </Select>
                                    </FormControl>
                                  )}
                                />
                              </Grid>
                              
                              <Grid item xs={6} md={3}>
                                <Controller
                                  name={`additionalBrokers.${index}.percentage`}
                                  control={control}
                                  rules={{ 
                                    required: 'النسبة مطلوبة',
                                    min: { value: 0, message: 'النسبة يجب أن تكون 0 أو أكثر' },
                                    max: { value: 100, message: 'النسبة يجب أن تكون 100 أو أقل' }
                                  }}
                                  render={({ field }) => (
                                    <TextField
                                      {...field}
                                      fullWidth
                                      label="النسبة %"
                                      type="number"
                                      inputProps={{ min: 0, max: 100, step: 0.1 }}
                                      InputProps={{
                                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                      }}
                                    />
                                  )}
                                />
                              </Grid>
                              
                              <Grid item xs={6} md={3}>
                                <TextField
                                  fullWidth
                                  label="المبلغ"
                                  value={`€${(watchAdditionalBrokers[index]?.amount || 0).toFixed(2)}`}
                                  InputProps={{ readOnly: true }}
                                  variant="filled"
                                />
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </AccordionDetails>
                </Accordion>
                
                {/* Calculate Button */}
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<CalculateIcon />}
                    onClick={calculateCommissions}
                    disabled={calculating || !watchInvoiceAmount || isOverLimit}
                    sx={{ minWidth: 200 }}
                  >
                    {calculating ? 'جاري الحساب...' : 'حساب التوزيعات'}
                  </Button>
                </Box>
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, color: 'primary.main' }}>
                  معلومات إضافية
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Controller
                      name="date"
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
                </Grid>
                
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
                      sx={{ mt: 2 }}
                    />
                  )}
                />
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="outlined"
                onClick={() => {
                  reset();
                  setCommissionResults(null);
                }}
              >
                إعادة تعيين
              </Button>
              
              <Button
                type="submit"
                variant="contained"
                size="large"
                startIcon={<SaveIcon />}
                disabled={!commissionResults || isOverLimit}
              >
                حفظ الفاتورة الرقمية
              </Button>
            </Box>
          </Grid>

          {/* Sidebar - Summary */}
          <Grid item xs={12} lg={4}>
            {/* Commission Results */}
            {commissionResults && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, color: 'success.main' }}>
                    ملخص التوزيعات
                  </Typography>
                  
                  <Paper sx={{ p: 2, mb: 2, bgcolor: 'primary.light', color: 'white' }}>
                    <Typography variant="subtitle2">الوسيط الرئيسي</Typography>
                    <Typography variant="h6">
                      €{commissionResults.mainBroker.amount.toFixed(2)}
                    </Typography>
                    <Typography variant="caption">
                      ({commissionResults.mainBroker.percentage}%)
                    </Typography>
                  </Paper>
                  
                  <Paper sx={{ p: 2, mb: 2, bgcolor: 'success.light', color: 'white' }}>
                    <Typography variant="subtitle2">نصيبنا (الأرباح)</Typography>
                    <Typography variant="h6">
                      €{commissionResults.ourShare.amount.toFixed(2)}
                    </Typography>
                    <Typography variant="caption">
                      ({commissionResults.ourShare.percentage}%)
                    </Typography>
                  </Paper>
                  
                  {commissionResults.additionalBrokers.length > 0 && (
                    <Paper sx={{ p: 2, mb: 2, bgcolor: 'secondary.light', color: 'white' }}>
                      <Typography variant="subtitle2">الوسطاء الإضافيون</Typography>
                      {commissionResults.additionalBrokers.map((broker, index) => (
                        <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                          <Typography variant="caption">{broker.name}</Typography>
                          <Typography variant="caption">
                            €{broker.amount.toFixed(2)} ({broker.percentage}%)
                          </Typography>
                        </Box>
                      ))}
                    </Paper>
                  )}
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">المجموع الموزع:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      €{commissionResults.totalAllocated.toFixed(2)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">المتبقي:</Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 'bold',
                        color: commissionResults.remaining < 0 ? 'error.main' : 'success.main'
                      }}
                    >
                      €{commissionResults.remaining.toFixed(2)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">النسبة المستخدمة:</Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 'bold',
                        color: commissionResults.percentageUsed > 100 ? 'error.main' : 'success.main'
                      }}
                    >
                      {commissionResults.percentageUsed.toFixed(1)}%
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            )}
            
            {/* Invoice Summary */}
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  ملخص الفاتورة
                </Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">مبلغ الفاتورة:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    €{(watchInvoiceAmount || 0).toFixed(2)}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">ضريبة القيمة المضافة ({watchVatRate}%):</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    €{(watch('vatAmount') || 0).toFixed(2)}
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 1 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6">المجموع الإجمالي:</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    €{(watch('totalAmount') || 0).toFixed(2)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default CreateDigitalInvoice;