import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Grid,
  Card,
  CardContent,
  IconButton,
  Alert,
  LinearProgress,
  Box,
  Divider,
  Tooltip
} from '@mui/material';
import {
  Payment as PaymentIcon,
  Edit as EditIcon,
  PictureAsPdf as PdfIcon,
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  PartiallySecure as PartialIcon
} from '@mui/icons-material';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  fetchUnpaidInvoices,
  processPayment,
  updateInvoicePayment,
  transferToBalances
} from '../../store/slices/financialSlice';

const FinancialPage = () => {
  const dispatch = useDispatch();
  const {
    unpaidInvoices,
    digitalInvoices,
    paymentProcessing,
    transferring,
    loading,
    error
  } = useSelector(state => state.financial);

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentType, setPaymentType] = useState('full'); // full, partial
  const [editCommissionDialog, setEditCommissionDialog] = useState(false);
  const [commissionData, setCommissionData] = useState({});

  useEffect(() => {
    dispatch(fetchUnpaidInvoices());
  }, [dispatch]);

  const handleOpenPayment = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentAmount(invoice.remainingAmount || invoice.totalAmount);
    setPaymentDialog(true);
  };

  const handleProcessPayment = async () => {
    if (!selectedInvoice || !paymentAmount) return;

    const paymentData = {
      invoiceId: selectedInvoice.id,
      amount: parseFloat(paymentAmount),
      type: paymentType,
      isDigital: selectedInvoice.type === 'digital'
    };

    try {
      await dispatch(processPayment(paymentData)).unwrap();
      
      // إذا كان الدفع كاملاً، نقل الأرصدة
      if (paymentType === 'full' || parseFloat(paymentAmount) >= selectedInvoice.remainingAmount) {
        await dispatch(transferToBalances({
          invoiceId: selectedInvoice.id,
          commissions: selectedInvoice.commissions || commissionData
        })).unwrap();
      }
      
      setPaymentDialog(false);
      setSelectedInvoice(null);
      setPaymentAmount('');
      dispatch(fetchUnpaidInvoices());
    } catch (error) {
      console.error('خطأ في معالجة الدفع:', error);
    }
  };

  const handleEditCommissions = (invoice) => {
    setSelectedInvoice(invoice);
    setCommissionData(invoice.commissions || {
      mainBroker: { name: '', percentage: 0 },
      ourProfit: { percentage: 0 },
      additionalBrokers: []
    });
    setEditCommissionDialog(true);
  };

  const addAdditionalBroker = () => {
    setCommissionData(prev => ({
      ...prev,
      additionalBrokers: [...prev.additionalBrokers, { name: '', percentage: 0 }]
    }));
  };

  const removeAdditionalBroker = (index) => {
    setCommissionData(prev => ({
      ...prev,
      additionalBrokers: prev.additionalBrokers.filter((_, i) => i !== index)
    }));
  };

  const updateCommissionData = (field, value, brokerIndex = null) => {
    if (brokerIndex !== null) {
      setCommissionData(prev => ({
        ...prev,
        additionalBrokers: prev.additionalBrokers.map((broker, index) => 
          index === brokerIndex ? { ...broker, [field]: value } : broker
        )
      }));
    } else {
      setCommissionData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const getPaymentStatusIcon = (invoice) => {
    if (invoice.paidAmount === 0) {
      return <WarningIcon color="warning" />;
    } else if (invoice.paidAmount < invoice.totalAmount) {
      return <PartialIcon color="info" />;
    } else {
      return <CheckCircleIcon color="success" />;
    }
  };

  const getPaymentStatusText = (invoice) => {
    if (invoice.paidAmount === 0) {
      return 'غير مدفوعة';
    } else if (invoice.paidAmount < invoice.totalAmount) {
      return 'مدفوعة جزئياً';
    } else {
      return 'مدفوعة بالكامل';
    }
  };

  const calculateProgress = (invoice) => {
    return (invoice.paidAmount / invoice.totalAmount) * 100;
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          جاري تحميل البيانات المالية...
        </Typography>
        <LinearProgress />
      </Paper>
    );
  }

  return (
    <div>
      {/* إحصائيات سريعة */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <WarningIcon color="warning" sx={{ mr: 1 }} />
                <div>
                  <Typography variant="h6">
                    {unpaidInvoices.filter(inv => inv.paidAmount === 0).length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    فواتير غير مدفوعة
                  </Typography>
                </div>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <PartialIcon color="info" sx={{ mr: 1 }} />
                <div>
                  <Typography variant="h6">
                    {unpaidInvoices.filter(inv => inv.paidAmount > 0 && inv.paidAmount < inv.totalAmount).length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    فواتير مدفوعة جزئياً
                  </Typography>
                </div>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <AccountBalanceIcon color="primary" sx={{ mr: 1 }} />
                <div>
                  <Typography variant="h6">
                    {formatCurrency(
                      unpaidInvoices.reduce((sum, inv) => sum + (inv.totalAmount - inv.paidAmount), 0)
                    )}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    إجمالي المبالغ المعلقة
                  </Typography>
                </div>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TrendingUpIcon color="success" sx={{ mr: 1 }} />
                <div>
                  <Typography variant="h6">
                    {formatCurrency(
                      unpaidInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0)
                    )}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    إجمالي المدفوع جزئياً
                  </Typography>
                </div>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* جدول الفواتير */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          إدارة مدفوعات الفواتير
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>رقم الفاتورة</TableCell>
                <TableCell>النوع</TableCell>
                <TableCell>العميل</TableCell>
                <TableCell>المبلغ الإجمالي</TableCell>
                <TableCell>المبلغ المدفوع</TableCell>
                <TableCell>المبلغ المتبقي</TableCell>
                <TableCell>الحالة</TableCell>
                <TableCell>التقدم</TableCell>
                <TableCell>التاريخ</TableCell>
                <TableCell>الإجراءات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {unpaidInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      {invoice.type === 'pdf' ? <PdfIcon sx={{ mr: 1 }} /> : <AccountBalanceIcon sx={{ mr: 1 }} />}
                      {invoice.invoiceNumber}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={invoice.type === 'pdf' ? 'PDF' : 'رقمية'} 
                      color={invoice.type === 'pdf' ? 'primary' : 'secondary'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{invoice.clientName}</TableCell>
                  <TableCell>{formatCurrency(invoice.totalAmount)}</TableCell>
                  <TableCell>{formatCurrency(invoice.paidAmount || 0)}</TableCell>
                  <TableCell>{formatCurrency(invoice.totalAmount - (invoice.paidAmount || 0))}</TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      {getPaymentStatusIcon(invoice)}
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        {getPaymentStatusText(invoice)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <LinearProgress 
                        variant="determinate" 
                        value={calculateProgress(invoice)}
                        sx={{ width: 60, mr: 1 }}
                      />
                      <Typography variant="body2">
                        {Math.round(calculateProgress(invoice))}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{formatDate(invoice.createdAt)}</TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Tooltip title="معالجة الدفع">
                        <IconButton 
                          onClick={() => handleOpenPayment(invoice)}
                          disabled={paymentProcessing}
                          color="primary"
                          size="small"
                        >
                          <PaymentIcon />
                        </IconButton>
                      </Tooltip>
                      
                      {invoice.type === 'digital' && (
                        <Tooltip title="تعديل العمولات">
                          <IconButton 
                            onClick={() => handleEditCommissions(invoice)}
                            color="secondary"
                            size="small"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* حوار معالجة الدفع */}
      <Dialog open={paymentDialog} onClose={() => setPaymentDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          معالجة دفع الفاتورة رقم: {selectedInvoice?.invoiceNumber}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="المبلغ الإجمالي"
                value={formatCurrency(selectedInvoice?.totalAmount || 0)}
                disabled
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="المبلغ المدفوع سابقاً"
                value={formatCurrency(selectedInvoice?.paidAmount || 0)}
                disabled
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>نوع الدفع</InputLabel>
                <Select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value)}
                  label="نوع الدفع"
                >
                  <MenuItem value="full">دفع كامل</MenuItem>
                  <MenuItem value="partial">دفع جزئي</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="مبلغ الدفع"
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                helperText={`المبلغ المتبقي: ${formatCurrency((selectedInvoice?.totalAmount || 0) - (selectedInvoice?.paidAmount || 0))}`}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialog(false)}>إلغاء</Button>
          <Button 
            onClick={handleProcessPayment} 
            variant="contained"
            disabled={paymentProcessing || !paymentAmount}
          >
            {paymentProcessing ? 'جاري المعالجة...' : 'تأكيد الدفع'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* حوار تعديل العمولات */}
      <Dialog open={editCommissionDialog} onClose={() => setEditCommissionDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          تعديل عمولات الفاتورة الرقمية رقم: {selectedInvoice?.invoiceNumber}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* الوسيط الرئيسي */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                الوسيط الرئيسي
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="اسم الوسيط الرئيسي"
                    value={commissionData.mainBroker?.name || ''}
                    onChange={(e) => updateCommissionData('mainBroker', {
                      ...commissionData.mainBroker,
                      name: e.target.value
                    })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="النسبة المئوية"
                    type="number"
                    value={commissionData.mainBroker?.percentage || 0}
                    onChange={(e) => updateCommissionData('mainBroker', {
                      ...commissionData.mainBroker,
                      percentage: parseFloat(e.target.value)
                    })}
                    InputProps={{ endAdornment: '%' }}
                  />
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <Divider />
            </Grid>

            {/* ربحنا */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                ربحنا
              </Typography>
              <TextField
                fullWidth
                label="نسبة الربح"
                type="number"
                value={commissionData.ourProfit?.percentage || 0}
                onChange={(e) => updateCommissionData('ourProfit', {
                  percentage: parseFloat(e.target.value)
                })}
                InputProps={{ endAdornment: '%' }}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider />
            </Grid>

            {/* الوسطاء الإضافيون */}
            <Grid item xs={12}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  الوسطاء الإضافيون
                </Typography>
                <Button onClick={addAdditionalBroker} variant="outlined" size="small">
                  إضافة وسيط
                </Button>
              </Box>
              
              {commissionData.additionalBrokers?.map((broker, index) => (
                <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
                  <Grid item xs={12} sm={5}>
                    <TextField
                      fullWidth
                      label={`اسم الوسيط ${index + 1}`}
                      value={broker.name}
                      onChange={(e) => updateCommissionData('name', e.target.value, index)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={5}>
                    <TextField
                      fullWidth
                      label="النسبة المئوية"
                      type="number"
                      value={broker.percentage}
                      onChange={(e) => updateCommissionData('percentage', parseFloat(e.target.value), index)}
                      InputProps={{ endAdornment: '%' }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <Button 
                      onClick={() => removeAdditionalBroker(index)}
                      color="error"
                      fullWidth
                    >
                      حذف
                    </Button>
                  </Grid>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditCommissionDialog(false)}>إلغاء</Button>
          <Button 
            onClick={() => {
              // حفظ بيانات العمولات
              dispatch(updateInvoicePayment({
                invoiceId: selectedInvoice.id,
                commissions: commissionData
              }));
              setEditCommissionDialog(false);
            }}
            variant="contained"
          >
            حفظ العمولات
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default FinancialPage;