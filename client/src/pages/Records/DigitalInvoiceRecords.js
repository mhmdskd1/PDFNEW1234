import React, { useState, useEffect } from 'react';
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
  InputAdornment,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  AccountCircle as AccountIcon,
  Euro as EuroIcon,
  TrendingUp as TrendingIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';

const DigitalInvoiceRecords = () => {
  const [digitalInvoices, setDigitalInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [viewDialog, setViewDialog] = useState(false);
  
  // Mock data
  useEffect(() => {
    setDigitalInvoices([
      {
        _id: '1',
        invoiceNumber: 'DIG-2025-001',
        totalAmount: 5000.00,
        vatAmount: 1050.00,
        baseAmount: 5000.00,
        mainBroker: {
          name: 'أحمد محمد',
          percentage: 40,
          amount: 2000.00,
        },
        ourShare: {
          percentage: 15,
          amount: 750.00,
        },
        additionalBrokers: [
          {
            name: 'فاطمة خالد',
            percentage: 10,
            amount: 500.00,
          },
        ],
        remaining: 1750.00,
        date: '2025-01-15',
        notes: 'فاتورة رقمية لمشروع أمستردام الجديد',
        status: 'processed',
      },
      {
        _id: '2',
        invoiceNumber: 'DIG-2025-002',
        totalAmount: 3200.00,
        vatAmount: 672.00,
        baseAmount: 3200.00,
        mainBroker: {
          name: 'سارة أحمد',
          percentage: 35,
          amount: 1120.00,
        },
        ourShare: {
          percentage: 20,
          amount: 640.00,
        },
        additionalBrokers: [],
        remaining: 1440.00,
        date: '2025-01-18',
        notes: 'معاملة رقمية لشركة روتردام',
        status: 'processed',
      },
      {
        _id: '3',
        invoiceNumber: 'DIG-2025-003',
        totalAmount: 7500.00,
        vatAmount: 1575.00,
        baseAmount: 7500.00,
        mainBroker: {
          name: 'محمد علي',
          percentage: 30,
          amount: 2250.00,
        },
        ourShare: {
          percentage: 25,
          amount: 1875.00,
        },
        additionalBrokers: [
          {
            name: 'ليلى محمد',
            percentage: 5,
            amount: 375.00,
          },
          {
            name: 'خالد أحمد',
            percentage: 8,
            amount: 600.00,
          },
        ],
        remaining: 2400.00,
        date: '2025-01-20',
        notes: 'فاتورة عقد مشروع هولندي كبير',
        status: 'processed',
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
  
  const handleView = (invoice) => {
    setSelectedInvoice(invoice);
    setViewDialog(true);
  };
  
  const handleEdit = (invoice) => {
    toast.info(`فتح تحرير الفاتورة ${invoice.invoiceNumber}`);
  };
  
  const handleDelete = (invoice) => {
    setDigitalInvoices(prev => prev.filter(inv => inv._id !== invoice._id));
    toast.success(`تم حذف الفاتورة ${invoice.invoiceNumber}`);
  };
  
  const filteredInvoices = digitalInvoices.filter(invoice => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.mainBroker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (invoice.notes && invoice.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDate = !dateFilter || invoice.date.includes(dateFilter);
    return matchesSearch && matchesDate;
  });
  
  const getTotalRevenue = () => {
    return digitalInvoices.reduce((sum, inv) => sum + inv.baseAmount, 0);
  };
  
  const getTotalProfits = () => {
    return digitalInvoices.reduce((sum, inv) => sum + inv.ourShare.amount, 0);
  };
  
  const getTotalBrokerPayments = () => {
    return digitalInvoices.reduce((sum, inv) => {
      const mainBrokerAmount = inv.mainBroker.amount;
      const additionalAmount = inv.additionalBrokers.reduce((brokerSum, broker) => brokerSum + broker.amount, 0);
      return sum + mainBrokerAmount + additionalAmount;
    }, 0);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          سجل الفواتير الرقمية
        </Typography>
        <Typography variant="subtitle1" sx={{ color: 'text.secondary' }}>
          عرض جميع الفواتير الرقمية مع تفاصيل توزيع النسب والعمولات
        </Typography>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                placeholder="بحث برقم الفاتورة، اسم الوسيط، أو الملاحظات..."
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
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="فلترة بالتاريخ"
                type="month"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<FilterIcon />}
                onClick={() => {
                  setSearchTerm('');
                  setDateFilter('');
                }}
              >
                إعادة تعيين
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    {digitalInvoices.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    إجمالي الفواتير
                  </Typography>
                </Box>
                <DescriptionIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                    {formatCurrency(getTotalRevenue())}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    إجمالي الإيرادات
                  </Typography>
                </Box>
                <TrendingIcon sx={{ fontSize: 40, color: 'success.main' }} />
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
                    {formatCurrency(getTotalProfits())}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    إجمالي أرباحنا
                  </Typography>
                </Box>
                <EuroIcon sx={{ fontSize: 40, color: 'warning.main' }} />
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
                    {formatCurrency(getTotalBrokerPayments())}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    مدفوعات الوسطاء
                  </Typography>
                </Box>
                <AccountIcon sx={{ fontSize: 40, color: 'info.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Digital Invoices List */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3 }}>
            قائمة الفواتير الرقمية
          </Typography>
          
          {filteredInvoices.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                لا توجد فواتير رقمية مطابقة للبحث
              </Typography>
            </Box>
          ) : (
            filteredInvoices
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((invoice) => (
                <Accordion key={invoice._id} sx={{ mb: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={3}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          {invoice.invoiceNumber}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(invoice.date)}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} md={3}>
                        <Typography variant="body2" color="text.secondary">الوسيط الرئيسي:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {invoice.mainBroker.name}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} md={3}>
                        <Typography variant="body2" color="text.secondary">مبلغ الفاتورة:</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                          {formatCurrency(invoice.baseAmount)}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} md={3}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleView(invoice);
                            }}
                            sx={{ color: 'primary.main' }}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(invoice);
                            }}
                            sx={{ color: 'warning.main' }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(invoice);
                            }}
                            sx={{ color: 'error.main' }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Grid>
                    </Grid>
                  </AccordionSummary>
                  
                  <AccordionDetails>
                    <Grid container spacing={3}>
                      {/* Financial Summary */}
                      <Grid item xs={12} md={6}>
                        <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                          ملخص مالي
                        </Typography>
                        
                        <Paper sx={{ p: 2, mb: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2">قيمة الفاتورة:</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {formatCurrency(invoice.baseAmount)}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2">ضريبة القيمة المضافة:</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {formatCurrency(invoice.vatAmount)}
                            </Typography>
                          </Box>
                          
                          <Divider sx={{ my: 1 }} />
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>المجموع الإجمالي:</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                              {formatCurrency(invoice.totalAmount)}
                            </Typography>
                          </Box>
                        </Paper>
                      </Grid>
                      
                      {/* Commission Distribution */}
                      <Grid item xs={12} md={6}>
                        <Typography variant="h6" sx={{ mb: 2, color: 'success.main' }}>
                          توزيع العمولات
                        </Typography>
                        
                        {/* Main Broker */}
                        <Paper sx={{ p: 2, mb: 1, bgcolor: 'primary.light', color: 'white' }}>
                          <Typography variant="subtitle2">الوسيط الرئيسي</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {invoice.mainBroker.name}
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                            <Typography variant="caption">{invoice.mainBroker.percentage}%</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {formatCurrency(invoice.mainBroker.amount)}
                            </Typography>
                          </Box>
                        </Paper>
                        
                        {/* Our Share */}
                        <Paper sx={{ p: 2, mb: 1, bgcolor: 'success.light', color: 'white' }}>
                          <Typography variant="subtitle2">نصيبنا (الأرباح)</Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                            <Typography variant="caption">{invoice.ourShare.percentage}%</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {formatCurrency(invoice.ourShare.amount)}
                            </Typography>
                          </Box>
                        </Paper>
                        
                        {/* Additional Brokers */}
                        {invoice.additionalBrokers.map((broker, index) => (
                          <Paper key={index} sx={{ p: 2, mb: 1, bgcolor: 'secondary.light', color: 'white' }}>
                            <Typography variant="subtitle2">وسيط إضافي</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {broker.name}
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                              <Typography variant="caption">{broker.percentage}%</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {formatCurrency(broker.amount)}
                              </Typography>
                            </Box>
                          </Paper>
                        ))}
                        
                        {/* Remaining */}
                        <Paper sx={{ p: 2, bgcolor: 'grey.200' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>المتبقي:</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {formatCurrency(invoice.remaining)}
                            </Typography>
                          </Box>
                        </Paper>
                      </Grid>
                      
                      {/* Notes */}
                      {invoice.notes && (
                        <Grid item xs={12}>
                          <Typography variant="h6" sx={{ mb: 1, color: 'text.secondary' }}>
                            ملاحظات:
                          </Typography>
                          <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                            <Typography variant="body2">{invoice.notes}</Typography>
                          </Paper>
                        </Grid>
                      )}
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              ))
          )}
          
          {filteredInvoices.length > 0 && (
            <TablePagination
              component="div"
              count={filteredInvoices.length}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25]}
              labelDisplayedRows={({ from, to, count }) =>
                `${from}-${to} من ${count}`
              }
              labelRowsPerPage="عدد الصفوف:"
            />
          )}
        </CardContent>
      </Card>

      {/* View Invoice Dialog */}
      <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          تفاصيل الفاتورة الرقمية {selectedInvoice?.invoiceNumber}
        </DialogTitle>
        <DialogContent>
          {selectedInvoice && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                  المعلومات المالية
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">قيمة الفاتورة (بدون ضريبة):</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(selectedInvoice.baseAmount)}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">ضريبة القيمة المضافة:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(selectedInvoice.vatAmount)}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">المجموع الإجمالي:</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    {formatCurrency(selectedInvoice.totalAmount)}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">تاريخ الفاتورة:</Typography>
                  <Typography variant="body1">{formatDate(selectedInvoice.date)}</Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ mb: 2, color: 'success.main' }}>
                  توزيع العمولات
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">الوسيط الرئيسي:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {selectedInvoice.mainBroker.name}
                  </Typography>
                  <Typography variant="body2">
                    {selectedInvoice.mainBroker.percentage}% - {formatCurrency(selectedInvoice.mainBroker.amount)}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">نصيبنا (الأرباح):</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                    {selectedInvoice.ourShare.percentage}% - {formatCurrency(selectedInvoice.ourShare.amount)}
                  </Typography>
                </Box>
                
                {selectedInvoice.additionalBrokers.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">الوسطاء الإضافيون:</Typography>
                    {selectedInvoice.additionalBrokers.map((broker, index) => (
                      <Typography key={index} variant="body2">
                        {broker.name}: {broker.percentage}% - {formatCurrency(broker.amount)}
                      </Typography>
                    ))}
                  </Box>
                )}
                
                <Box sx={{ pt: 2, borderTop: 1, borderColor: 'divider' }}>
                  <Typography variant="body2" color="text.secondary">المتبقي:</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(selectedInvoice.remaining)}
                  </Typography>
                </Box>
              </Grid>
              
              {selectedInvoice.notes && (
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mb: 1, color: 'text.secondary' }}>
                    ملاحظات:
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                    <Typography variant="body2">{selectedInvoice.notes}</Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(false)}>إغلاق</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DigitalInvoiceRecords;