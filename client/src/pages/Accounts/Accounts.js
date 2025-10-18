import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Paper,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  InputAdornment,
  LinearProgress,
} from '@mui/material';
import {
  Payment as PaymentIcon,
  AccountBalance as BalanceIcon,
  TrendingUp as TrendingIcon,
  Person as PersonIcon,
  Euro as EuroIcon,
  Check as CheckIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  AttachMoney as MoneyIcon,
  AccountBalanceWallet as WalletIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';

const Accounts = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [pendingInvoices, setPendingInvoices] = useState([]);
  const [balances, setBalances] = useState({
    cash: 25000,
    brokers: [],
    totalPaid: 45000,
    totalPending: 12000,
  });
  const [transactions, setTransactions] = useState([]);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [processing, setProcessing] = useState(false);
  
  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm({
    defaultValues: {
      paymentAmount: 0,
      paymentMethod: 'full',
      notes: '',
    },
  });
  
  // Mock data for pending invoices
  useEffect(() => {
    setPendingInvoices([
      {
        _id: '1',
        invoiceNumber: '2025-5588-001',
        type: 'pdf',
        clientName: 'أحمد محمد',
        companyName: 'شركة أمستردام التجارية',
        totalAmount: 1815.00,
        paidAmount: 0,
        remainingAmount: 1815.00,
        status: 'pending',
        createdAt: '2025-01-15',
        commissions: {
          type: '21-9',
          forUs: 272.25,
          forThem: 453.75,
          remaining: 1089.00,
        },
      },
      {
        _id: '2',
        invoiceNumber: '2025-5588-002',
        type: 'pdf',
        clientName: 'سارة أحمد',
        companyName: 'Rotterdam Business Center',
        totalAmount: 2420.00,
        paidAmount: 1200.00,
        remainingAmount: 1220.00,
        status: 'partial',
        createdAt: '2025-01-18',
        commissions: {
          type: '21-9',
          forUs: 363.00,
          forThem: 605.00,
          remaining: 1452.00,
        },
      },
      {
        _id: '3',
        invoiceNumber: 'DIG-2025-001',
        type: 'digital',
        mainBroker: { name: 'محمد علي', amount: 2000.00 },
        ourShare: { amount: 750.00 },
        additionalBrokers: [{ name: 'فاطمة خالد', amount: 500.00 }],
        totalAmount: 5000.00,
        baseAmount: 5000.00,
        status: 'pending',
        createdAt: '2025-01-20',
        commissions: {
          type: 'digital',
          distributions: {
            mainBroker: 2000.00,
            ourShare: 750.00,
            additionalBrokers: 500.00,
            remaining: 1750.00,
          },
        },
      },
    ]);
    
    // Mock broker balances
    setBalances(prev => ({
      ...prev,
      brokers: [
        {
          _id: '1',
          name: 'أحمد محمد',
          type: 'broker',
          balance: 2250.75,
          pendingAmount: 453.75,
          totalEarned: 12500.00,
          transactionCount: 15,
        },
        {
          _id: '2',
          name: 'سارة أحمد',
          type: 'financier',
          balance: 1850.50,
          pendingAmount: 605.00,
          totalEarned: 8750.00,
          transactionCount: 12,
        },
        {
          _id: '3',
          name: 'محمد علي',
          type: 'broker',
          balance: 3200.00,
          pendingAmount: 2000.00,
          totalEarned: 18500.00,
          transactionCount: 22,
        },
        {
          _id: '4',
          name: 'فاطمة خالد',
          type: 'broker',
          balance: 950.25,
          pendingAmount: 500.00,
          totalEarned: 5200.00,
          transactionCount: 8,
        },
      ],
    }));
    
    // Mock transaction history
    setTransactions([
      {
        _id: '1',
        type: 'payment',
        invoiceNumber: '2025-5588-003',
        clientName: 'خالد أحمد',
        amount: 1500.00,
        date: '2025-01-14',
        distributions: {
          ourShare: 225.00,
          brokerShare: 375.00,
        },
      },
      {
        _id: '2',
        type: 'payment',
        invoiceNumber: 'DIG-2025-002',
        clientName: 'ليلى محمد',
        amount: 3200.00,
        date: '2025-01-12',
        distributions: {
          ourShare: 640.00,
          mainBroker: 1120.00,
        },
      },
    ]);
  }, []);
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };
  
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'success';
      case 'partial': return 'warning';
      case 'pending': return 'error';
      default: return 'default';
    }
  };
  
  const getStatusText = (status) => {
    switch (status) {
      case 'paid': return 'مدفوعة';
      case 'partial': return 'مدفوعة جزئياً';
      case 'pending': return 'معلقة';
      default: return status;
    }
  };
  
  const handlePayment = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentDialog(true);
    reset({
      paymentAmount: invoice.remainingAmount || invoice.totalAmount,
      paymentMethod: 'full',
      notes: '',
    });
  };
  
  const onSubmitPayment = async (data) => {
    setProcessing(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      const isFullPayment = data.paymentMethod === 'full' || 
                           data.paymentAmount >= selectedInvoice.remainingAmount;
      
      // Update invoice status
      setPendingInvoices(prev => prev.map(inv => {
        if (inv._id === selectedInvoice._id) {
          const newPaidAmount = (inv.paidAmount || 0) + parseFloat(data.paymentAmount);
          const newRemainingAmount = inv.totalAmount - newPaidAmount;
          
          return {
            ...inv,
            paidAmount: newPaidAmount,
            remainingAmount: newRemainingAmount,
            status: newRemainingAmount <= 0 ? 'paid' : 'partial',
          };
        }
        return inv;
      }).filter(inv => !(inv._id === selectedInvoice._id && isFullPayment)));
      
      // Update balances if full payment
      if (isFullPayment) {
        if (selectedInvoice.type === 'pdf') {
          // Update our cash balance
          setBalances(prev => ({
            ...prev,
            cash: prev.cash + selectedInvoice.commissions.forUs,
            brokers: prev.brokers.map(broker => {
              if (broker.name === selectedInvoice.clientName) {
                return {
                  ...broker,
                  balance: broker.balance + selectedInvoice.commissions.forThem,
                  pendingAmount: Math.max(0, broker.pendingAmount - selectedInvoice.commissions.forThem),
                };
              }
              return broker;
            }),
          }));
        } else if (selectedInvoice.type === 'digital') {
          // Update digital invoice distributions
          const distributions = selectedInvoice.commissions.distributions;
          
          setBalances(prev => ({
            ...prev,
            cash: prev.cash + distributions.ourShare,
            brokers: prev.brokers.map(broker => {
              let additionalAmount = 0;
              
              // Main broker
              if (broker.name === selectedInvoice.mainBroker.name) {
                additionalAmount += distributions.mainBroker;
              }
              
              // Additional brokers
              selectedInvoice.additionalBrokers?.forEach(addBroker => {
                if (broker.name === addBroker.name) {
                  additionalAmount += distributions.additionalBrokers;
                }
              });
              
              if (additionalAmount > 0) {
                return {
                  ...broker,
                  balance: broker.balance + additionalAmount,
                  pendingAmount: Math.max(0, broker.pendingAmount - additionalAmount),
                };
              }
              
              return broker;
            }),
          }));
        }
        
        // Add transaction record
        setTransactions(prev => [{
          _id: Date.now().toString(),
          type: 'payment',
          invoiceNumber: selectedInvoice.invoiceNumber,
          clientName: selectedInvoice.clientName || selectedInvoice.mainBroker?.name,
          amount: parseFloat(data.paymentAmount),
          date: new Date().toISOString().split('T')[0],
          distributions: selectedInvoice.type === 'pdf' ? {
            ourShare: selectedInvoice.commissions.forUs,
            brokerShare: selectedInvoice.commissions.forThem,
          } : {
            ourShare: selectedInvoice.commissions.distributions.ourShare,
            mainBroker: selectedInvoice.commissions.distributions.mainBroker,
            additionalBrokers: selectedInvoice.commissions.distributions.additionalBrokers,
          },
        }, ...prev]);
      }
      
      toast.success(`تم تسجيل الدفعة بنجاح - ${formatCurrency(data.paymentAmount)}`);
      setPaymentDialog(false);
      setSelectedInvoice(null);
      
    } catch (error) {
      toast.error('فشل في معالجة الدفعة');
    } finally {
      setProcessing(false);
    }
  };
  
  const getTotalPendingCommissions = () => {
    return balances.brokers.reduce((sum, broker) => sum + broker.pendingAmount, 0);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          إدارة الحسابات والأرصدة
        </Typography>
        <Typography variant="subtitle1" sx={{ color: 'text.secondary' }}>
          إدارة المدفوعات وتوزيع الأرصدة على الوسطاء والممولين
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                    {formatCurrency(balances.cash)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    رصيد الصندوق
                  </Typography>
                </Box>
                <WalletIcon sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                    {formatCurrency(getTotalPendingCommissions())}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    عمولات معلقة
                  </Typography>
                </Box>
                <MoneyIcon sx={{ fontSize: 40, color: 'warning.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    {pendingInvoices.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    فواتير معلقة
                  </Typography>
                </Box>
                <PaymentIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'info.main' }}>
                    {balances.brokers.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    الوسطاء النشطون
                  </Typography>
                </Box>
                <PersonIcon sx={{ fontSize: 40, color: 'info.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab label="المالية - إدخال المدفوعات" icon={<PaymentIcon />} />
            <Tab label="الأرصدة - الوسطاء والممولين" icon={<BalanceIcon />} />
            <Tab label="سجل الحركات" icon={<TrendingIcon />} />
          </Tabs>
        </Box>

        {/* Tab 1: Financial - Payment Processing */}
        {activeTab === 0 && (
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3 }}>
              إدخال المدفوعات وتصفير الأرصدة
            </Typography>
            
            <Alert severity="info" sx={{ mb: 3 }}>
              هنا يتم إدخال المدفوعات للفواتير المعلقة. عند تسجيل الدفع الكامل، سيتم توزيع العمولات تلقائياً على الأرصدة.
            </Alert>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>رقم الفاتورة</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>النوع</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>العميل/الوسيط</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>المبلغ الكلي</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>المدفوع</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>المتبقي</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>الحالة</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>العمليات</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          لا توجد فواتير معلقة للدفع
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    pendingInvoices.map((invoice) => (
                      <TableRow key={invoice._id}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                            {invoice.invoiceNumber}
                          </Typography>
                        </TableCell>
                        
                        <TableCell>
                          <Chip
                            label={invoice.type === 'pdf' ? 'PDF' : 'رقمية'}
                            color={invoice.type === 'pdf' ? 'primary' : 'secondary'}
                            size="small"
                          />
                        </TableCell>
                        
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {invoice.clientName || invoice.mainBroker?.name}
                          </Typography>
                          {invoice.companyName && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              {invoice.companyName}
                            </Typography>
                          )}
                        </TableCell>
                        
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {formatCurrency(invoice.totalAmount)}
                          </Typography>
                        </TableCell>
                        
                        <TableCell>
                          <Typography variant="body2">
                            {formatCurrency(invoice.paidAmount || 0)}
                          </Typography>
                        </TableCell>
                        
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                            {formatCurrency(invoice.remainingAmount || invoice.totalAmount)}
                          </Typography>
                        </TableCell>
                        
                        <TableCell>
                          <Chip
                            label={getStatusText(invoice.status)}
                            color={getStatusColor(invoice.status)}
                            size="small"
                          />
                        </TableCell>
                        
                        <TableCell>
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<PaymentIcon />}
                            onClick={() => handlePayment(invoice)}
                            sx={{ mr: 1 }}
                          >
                            تسديد
                          </Button>
                          <IconButton size="small" color="primary">
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        )}

        {/* Tab 2: Balances - Brokers and Financiers */}
        {activeTab === 1 && (
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3 }}>
              أرصدة الوسطاء والممولين
            </Typography>
            
            <Grid container spacing={3}>
              {balances.brokers.map((broker) => (
                <Grid item xs={12} md={6} lg={4} key={broker._id}>
                  <Card sx={{ border: 1, borderColor: 'divider' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            {broker.name}
                          </Typography>
                          <Chip
                            label={broker.type === 'broker' ? 'وسيط' : 'ممول'}
                            size="small"
                            color={broker.type === 'broker' ? 'primary' : 'secondary'}
                          />
                        </Box>
                      </Box>
                      
                      <Divider sx={{ my: 2 }} />
                      
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">الرصيد الحالي:</Typography>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                            {formatCurrency(broker.balance)}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">معلق:</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                            {formatCurrency(broker.pendingAmount)}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">إجمالي الأرباح:</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {formatCurrency(broker.totalEarned)}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">عدد المعاملات:</Typography>
                          <Typography variant="body2">{broker.transactionCount}</Typography>
                        </Box>
                      </Box>
                      
                      {/* Progress bar for pending amount */}
                      {broker.pendingAmount > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" color="text.secondary">
                            نسبة المعلق: {((broker.pendingAmount / (broker.balance + broker.pendingAmount)) * 100).toFixed(1)}%
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={(broker.pendingAmount / (broker.balance + broker.pendingAmount)) * 100}
                            color="warning"
                            sx={{ mt: 0.5 }}
                          />
                        </Box>
                      )}
                      
                      <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<ViewIcon />}
                        size="small"
                      >
                        عرض التفاصيل
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        )}

        {/* Tab 3: Transaction History */}
        {activeTab === 2 && (
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3 }}>
              سجل الحركات المالية
            </Typography>
            
            <List>
              {transactions.length === 0 ? (
                <ListItem>
                  <ListItemText
                    primary="لا توجد حركات مالية"
                    secondary="سيتم عرض الحركات هنا بعد معالجة المدفوعات"
                    sx={{ textAlign: 'center' }}
                  />
                </ListItem>
              ) : (
                transactions.map((transaction) => (
                  <React.Fragment key={transaction._id}>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                              {transaction.invoiceNumber}
                            </Typography>
                            <Chip label="دفعة" color="success" size="small" />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              العميل: {transaction.clientName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              التاريخ: {formatDate(transaction.date)}
                            </Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                          {formatCurrency(transaction.amount)}
                        </Typography>
                      </ListItemSecondaryAction>
                    </ListItem>
                    
                    {/* Distribution Details */}
                    <Box sx={{ pl: 4, pr: 2, pb: 2 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1, color: 'primary.main' }}>
                        توزيع العمولات:
                      </Typography>
                      <Grid container spacing={2}>
                        {transaction.distributions.ourShare && (
                          <Grid item xs={6}>
                            <Paper sx={{ p: 1, bgcolor: 'success.light', color: 'white' }}>
                              <Typography variant="caption">نصيبنا</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {formatCurrency(transaction.distributions.ourShare)}
                              </Typography>
                            </Paper>
                          </Grid>
                        )}
                        
                        {transaction.distributions.brokerShare && (
                          <Grid item xs={6}>
                            <Paper sx={{ p: 1, bgcolor: 'primary.light', color: 'white' }}>
                              <Typography variant="caption">نصيب الوسيط</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {formatCurrency(transaction.distributions.brokerShare)}
                              </Typography>
                            </Paper>
                          </Grid>
                        )}
                        
                        {transaction.distributions.mainBroker && (
                          <Grid item xs={6}>
                            <Paper sx={{ p: 1, bgcolor: 'primary.light', color: 'white' }}>
                              <Typography variant="caption">الوسيط الرئيسي</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {formatCurrency(transaction.distributions.mainBroker)}
                              </Typography>
                            </Paper>
                          </Grid>
                        )}
                        
                        {transaction.distributions.additionalBrokers && (
                          <Grid item xs={6}>
                            <Paper sx={{ p: 1, bgcolor: 'secondary.light', color: 'white' }}>
                              <Typography variant="caption">وسطاء إضافيون</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {formatCurrency(transaction.distributions.additionalBrokers)}
                              </Typography>
                            </Paper>
                          </Grid>
                        )}
                      </Grid>
                    </Box>
                    
                    <Divider />
                  </React.Fragment>
                ))
              )}
            </List>
          </CardContent>
        )}
      </Card>

      {/* Payment Dialog */}
      <Dialog open={paymentDialog} onClose={() => setPaymentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          تسجيل دفعة للفاتورة {selectedInvoice?.invoiceNumber}
        </DialogTitle>
        <form onSubmit={handleSubmit(onSubmitPayment)}>
          <DialogContent>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  المبلغ المتبقي: {formatCurrency(selectedInvoice?.remainingAmount || selectedInvoice?.totalAmount || 0)}
                </Alert>
              </Grid>
              
              <Grid item xs={12}>
                <Controller
                  name="paymentMethod"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>طريقة الدفع</InputLabel>
                      <Select {...field} label="طريقة الدفع">
                        <MenuItem value="full">دفع كامل</MenuItem>
                        <MenuItem value="partial">دفع جزئي</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Controller
                  name="paymentAmount"
                  control={control}
                  rules={{ 
                    required: 'مبلغ الدفعة مطلوب',
                    min: { value: 0.01, message: 'يجب أن يكون المبلغ أكبر من 0' },
                    max: { 
                      value: selectedInvoice?.remainingAmount || selectedInvoice?.totalAmount || 0, 
                      message: 'لا يمكن أن يتجاوز المبلغ المتبقي' 
                    }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="مبلغ الدفعة"
                      type="number"
                      inputProps={{ min: 0, step: 0.01 }}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">€</InputAdornment>,
                      }}
                      error={!!errors.paymentAmount}
                      helperText={errors.paymentAmount?.message}
                      disabled={watch('paymentMethod') === 'full'}
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
              
              {selectedInvoice?.type === 'pdf' && (
                <Grid item xs={12}>
                  <Alert severity="success">
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>توزيع العمولات المتوقع:</Typography>
                    <Typography variant="body2">
                      • نصيبنا: {formatCurrency(selectedInvoice?.commissions?.forUs || 0)}
                    </Typography>
                    <Typography variant="body2">
                      • نصيب الوسيط: {formatCurrency(selectedInvoice?.commissions?.forThem || 0)}
                    </Typography>
                  </Alert>
                </Grid>
              )}
            </Grid>
          </DialogContent>
          
          <DialogActions>
            <Button onClick={() => setPaymentDialog(false)} disabled={processing}>
              إلغاء
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={processing}
              startIcon={processing ? <LinearProgress /> : <CheckIcon />}
            >
              {processing ? 'جاري المعالجة...' : 'تسجيل الدفعة'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Accounts;