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
  TextField,
  Grid,
  Card,
  CardContent,
  IconButton,
  Alert,
  LinearProgress,
  Box,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  TablePagination,
  InputAdornment,
  Collapse,
  List,
  ListItem,
  ListItemText,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  AccountBalanceWallet as DigitalIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  FileDownload as ExportIcon,
  Clear as ClearIcon,
  Visibility as ViewIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  MonetizationOn as MoneyIcon,
  Percent as PercentIcon,
  TrendingUp as TrendingUpIcon,
  Receipt as ReceiptIcon,
  PieChart as PieChartIcon
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { formatCurrency, formatDate, calculatePercentage } from '../../utils/formatters';
import {
  fetchDigitalInvoices,
  searchDigitalInvoices,
  exportDigitalInvoices,
  getDigitalInvoiceStatistics
} from '../../store/slices/digitalInvoiceSlice';

const DigitalInvoicesPage = () => {
  const dispatch = useDispatch();
  const {
    digitalInvoices,
    filteredInvoices,
    statistics,
    loading,
    error,
    totalPages,
    currentPage
  } = useSelector(state => state.digitalInvoices);

  // حالة البحث والترشيح
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBroker, setFilterBroker] = useState('');
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  const [amountFrom, setAmountFrom] = useState('');
  const [amountTo, setAmountTo] = useState('');
  
  // حالة الجدول والترقيم
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // حالة الحوارات
  const [filterDialog, setFilterDialog] = useState(false);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [exportDialog, setExportDialog] = useState(false);
  
  // حالة الصفوف القابلة للطي
  const [expandedRows, setExpandedRows] = useState({});

  useEffect(() => {
    dispatch(fetchDigitalInvoices({ page: page + 1, limit: rowsPerPage }));
    dispatch(getDigitalInvoiceStatistics());
  }, [dispatch, page, rowsPerPage]);

  // معالجة البحث
  const handleSearch = () => {
    const searchParams = {
      searchTerm,
      brokerId: filterBroker,
      dateFrom,
      dateTo,
      amountFrom: amountFrom ? parseFloat(amountFrom) : null,
      amountTo: amountTo ? parseFloat(amountTo) : null,
      page: 1,
      limit: rowsPerPage
    };
    
    dispatch(searchDigitalInvoices(searchParams));
    setPage(0);
  };

  // مسح المرشحات
  const clearFilters = () => {
    setSearchTerm('');
    setFilterBroker('');
    setDateFrom(null);
    setDateTo(null);
    setAmountFrom('');
    setAmountTo('');
    dispatch(fetchDigitalInvoices({ page: 1, limit: rowsPerPage }));
  };

  // تصدير الفواتير
  const handleExport = async (format) => {
    const exportParams = {
      format, // 'excel' or 'pdf'
      filters: {
        searchTerm,
        brokerId: filterBroker,
        dateFrom,
        dateTo,
        amountFrom: amountFrom ? parseFloat(amountFrom) : null,
        amountTo: amountTo ? parseFloat(amountTo) : null
      }
    };
    
    try {
      await dispatch(exportDigitalInvoices(exportParams)).unwrap();
      setExportDialog(false);
    } catch (error) {
      console.error('خطأ في تصدير الفواتير:', error);
    }
  };

  // عرض تفاصيل الفاتورة
  const handleViewDetails = (invoice) => {
    setSelectedInvoice(invoice);
    setDetailsDialog(true);
  };

  // طي/فرد صف التفاصيل
  const toggleRowExpansion = (invoiceId) => {
    setExpandedRows(prev => ({
      ...prev,
      [invoiceId]: !prev[invoiceId]
    }));
  };

  // حساب إجمالي نسب العمولات
  const getTotalCommissionPercentage = (commissions) => {
    let total = 0;
    if (commissions.mainBroker?.percentage) total += commissions.mainBroker.percentage;
    if (commissions.ourProfit?.percentage) total += commissions.ourProfit.percentage;
    if (commissions.additionalBrokers) {
      total += commissions.additionalBrokers.reduce((sum, broker) => sum + (broker.percentage || 0), 0);
    }
    return total;
  };

  // حساب قيمة العمولة بالعملة
  const getCommissionAmount = (baseAmount, percentage) => {
    return (baseAmount * percentage) / 100;
  };

  // تغيير الصفحة
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const displayedInvoices = filteredInvoices.length > 0 ? filteredInvoices : digitalInvoices;

  if (loading && !digitalInvoices.length) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          جاري تحميل سجل الفواتير الرقمية...
        </Typography>
        <LinearProgress />
      </Paper>
    );
  }

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        سجل الفواتير الرقمية
      </Typography>

      {/* بطاقات إحصائية */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <DigitalIcon color="primary" sx={{ mr: 2, fontSize: 40 }} />
                <div>
                  <Typography variant="h4" color="primary">
                    {statistics?.totalInvoices || 0}
                  </Typography>
                  <Typography variant="body1" color="textSecondary">
                    إجمالي الفواتير
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
                <TrendingUpIcon color="success" sx={{ mr: 2, fontSize: 40 }} />
                <div>
                  <Typography variant="h4" color="success.main">
                    {formatCurrency(statistics?.totalAmount || 0)}
                  </Typography>
                  <Typography variant="body1" color="textSecondary">
                    إجمالي المبالغ
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
                <MoneyIcon color="info" sx={{ mr: 2, fontSize: 40 }} />
                <div>
                  <Typography variant="h4" color="info.main">
                    {formatCurrency(statistics?.totalCommissions || 0)}
                  </Typography>
                  <Typography variant="body1" color="textSecondary">
                    إجمالي العمولات
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
                <PieChartIcon color="secondary" sx={{ mr: 2, fontSize: 40 }} />
                <div>
                  <Typography variant="h4" color="secondary.main">
                    {formatCurrency(statistics?.averageAmount || 0)}
                  </Typography>
                  <Typography variant="body1" color="textSecondary">
                    متوسط قيمة الفاتورة
                  </Typography>
                </div>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* شريط البحث والترشيح */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="بحث في الفواتير الرقمية"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setSearchTerm('')} size="small">
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                )
              }}
              placeholder="رقم الفاتورة، اسم الوسيط..."
            />
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Box display="flex" gap={1} justifyContent="flex-end">
              <Button
                startIcon={<SearchIcon />}
                onClick={handleSearch}
                variant="contained"
              >
                بحث
              </Button>
              
              <Button
                startIcon={<FilterIcon />}
                onClick={() => setFilterDialog(true)}
                variant="outlined"
              >
                فلتر متقدم
              </Button>
              
              <Button
                startIcon={<ExportIcon />}
                onClick={() => setExportDialog(true)}
                variant="outlined"
              >
                تصدير
              </Button>
              
              {(searchTerm || filterBroker || dateFrom || dateTo) && (
                <Button
                  startIcon={<ClearIcon />}
                  onClick={clearFilters}
                  color="secondary"
                >
                  مسح الفلاتر
                </Button>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* رسالة خطأ */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* جدول الفواتير */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell></TableCell>
                <TableCell>رقم الفاتورة</TableCell>
                <TableCell>المبلغ الإجمالي</TableCell>
                <TableCell>المبلغ بدون ضريبة</TableCell>
                <TableCell>نسبة الضريبة</TableCell>
                <TableCell>إجمالي العمولات</TableCell>
                <TableCell>تاريخ الفاتورة</TableCell>
                <TableCell>الإجراءات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayedInvoices
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((invoice) => (
                <React.Fragment key={invoice.id}>
                  <TableRow hover>
                    <TableCell>
                      <IconButton 
                        onClick={() => toggleRowExpansion(invoice.id)}
                        size="small"
                      >
                        <ExpandMoreIcon 
                          sx={{
                            transform: expandedRows[invoice.id] ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.3s'
                          }}
                        />
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <DigitalIcon color="primary" sx={{ mr: 1 }} />
                        <Typography fontWeight="bold">
                          {invoice.invoiceNumber}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight="bold" color="primary">
                        {formatCurrency(invoice.totalAmount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight="bold">
                        {formatCurrency(invoice.amountWithoutVat)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={`${invoice.vatPercentage}%`}
                        color="info"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography color="success.main" fontWeight="bold">
                        {formatCurrency(
                          Object.values(invoice.commissions || {}).reduce((sum, commission) => {
                            if (commission.percentage) {
                              return sum + getCommissionAmount(invoice.amountWithoutVat, commission.percentage);
                            }
                            return sum;
                          }, 0)
                        )}
                      </Typography>
                    </TableCell>
                    <TableCell>{formatDate(invoice.createdAt)}</TableCell>
                    <TableCell>
                      <Tooltip title="عرض التفاصيل">
                        <IconButton 
                          onClick={() => handleViewDetails(invoice)}
                          size="small"
                          color="primary"
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                  
                  {/* صف التفاصيل القابل للطي */}
                  <TableRow>
                    <TableCell colSpan={8} sx={{ p: 0 }}>
                      <Collapse in={expandedRows[invoice.id]} timeout="auto" unmountOnExit>
                        <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                          <Typography variant="h6" gutterBottom>
                            تفاصيل العمولات
                          </Typography>
                          
                          <Grid container spacing={2}>
                            {/* الوسيط الرئيسي */}
                            {invoice.commissions?.mainBroker && (
                              <Grid item xs={12} md={6}>
                                <Paper sx={{ p: 2 }}>
                                  <Box display="flex" alignItems="center" mb={1}>
                                    <PersonIcon color="primary" sx={{ mr: 1 }} />
                                    <Typography variant="h6">
                                      الوسيط الرئيسي
                                    </Typography>
                                  </Box>
                                  <Typography>
                                    <strong>الاسم:</strong> {invoice.commissions.mainBroker.name}
                                  </Typography>
                                  <Typography>
                                    <strong>النسبة:</strong> {invoice.commissions.mainBroker.percentage}%
                                  </Typography>
                                  <Typography color="success.main">
                                    <strong>المبلغ:</strong> {formatCurrency(
                                      getCommissionAmount(
                                        invoice.amountWithoutVat, 
                                        invoice.commissions.mainBroker.percentage
                                      )
                                    )}
                                  </Typography>
                                </Paper>
                              </Grid>
                            )}
                            
                            {/* ربحنا */}
                            {invoice.commissions?.ourProfit && (
                              <Grid item xs={12} md={6}>
                                <Paper sx={{ p: 2 }}>
                                  <Box display="flex" alignItems="center" mb={1}>
                                    <BusinessIcon color="secondary" sx={{ mr: 1 }} />
                                    <Typography variant="h6">
                                      ربحنا
                                    </Typography>
                                  </Box>
                                  <Typography>
                                    <strong>النسبة:</strong> {invoice.commissions.ourProfit.percentage}%
                                  </Typography>
                                  <Typography color="success.main">
                                    <strong>المبلغ:</strong> {formatCurrency(
                                      getCommissionAmount(
                                        invoice.amountWithoutVat, 
                                        invoice.commissions.ourProfit.percentage
                                      )
                                    )}
                                  </Typography>
                                </Paper>
                              </Grid>
                            )}
                            
                            {/* الوسطاء الإضافيون */}
                            {invoice.commissions?.additionalBrokers?.map((broker, index) => (
                              <Grid item xs={12} md={6} key={index}>
                                <Paper sx={{ p: 2 }}>
                                  <Box display="flex" alignItems="center" mb={1}>
                                    <PersonIcon color="info" sx={{ mr: 1 }} />
                                    <Typography variant="h6">
                                      وسيط إضافي {index + 1}
                                    </Typography>
                                  </Box>
                                  <Typography>
                                    <strong>الاسم:</strong> {broker.name}
                                  </Typography>
                                  <Typography>
                                    <strong>النسبة:</strong> {broker.percentage}%
                                  </Typography>
                                  <Typography color="success.main">
                                    <strong>المبلغ:</strong> {formatCurrency(
                                      getCommissionAmount(invoice.amountWithoutVat, broker.percentage)
                                    )}
                                  </Typography>
                                </Paper>
                              </Grid>
                            ))}
                          </Grid>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          component="div"
          count={statistics?.totalInvoices || displayedInvoices.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage="عدد الصفوف في الصفحة:"
        />
      </Paper>

      {/* حوار الفلتر المتقدم */}
      <Dialog open={filterDialog} onClose={() => setFilterDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>فلتر متقدم للفواتير الرقمية</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>الوسيط</InputLabel>
                <Select
                  value={filterBroker}
                  onChange={(e) => setFilterBroker(e.target.value)}
                  label="الوسيط"
                >
                  <MenuItem value="">جميع الوسطاء</MenuItem>
                  {/* سيتم تعبئتها من API */}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="من تاريخ"
                  value={dateFrom}
                  onChange={setDateFrom}
                  renderInput={(params) => <TextField fullWidth {...params} />}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="إلى تاريخ"
                  value={dateTo}
                  onChange={setDateTo}
                  renderInput={(params) => <TextField fullWidth {...params} />}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="من مبلغ"
                type="number"
                value={amountFrom}
                onChange={(e) => setAmountFrom(e.target.value)}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="إلى مبلغ"
                type="number"
                value={amountTo}
                onChange={(e) => setAmountTo(e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={clearFilters}>مسح المرشحات</Button>
          <Button onClick={() => setFilterDialog(false)}>إلغاء</Button>
          <Button onClick={() => {
            handleSearch();
            setFilterDialog(false);
          }} variant="contained">
            تطبيق الفلتر
          </Button>
        </DialogActions>
      </Dialog>

      {/* حوار التصدير */}
      <Dialog open={exportDialog} onClose={() => setExportDialog(false)}>
        <DialogTitle>تصدير سجل الفواتير الرقمية</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            اختر نوع الملف للتصدير:
          </Typography>
          <Box display="flex" gap={2} mt={2}>
            <Button 
              variant="outlined" 
              onClick={() => handleExport('excel')}
              startIcon={<ExportIcon />}
              fullWidth
            >
              Excel
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => handleExport('pdf')}
              startIcon={<ExportIcon />}
              fullWidth
            >
              PDF
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialog(false)}>إلغاء</Button>
        </DialogActions>
      </Dialog>

      {/* حوار تفاصيل الفاتورة */}
      <Dialog open={detailsDialog} onClose={() => setDetailsDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          تفاصيل الفاتورة الرقمية رقم: {selectedInvoice?.invoiceNumber}
        </DialogTitle>
        <DialogContent>
          {selectedInvoice && (
            <div>
              {/* بيانات أساسية */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="رقم الفاتورة"
                    value={selectedInvoice.invoiceNumber}
                    disabled
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="المبلغ الإجمالي"
                    value={formatCurrency(selectedInvoice.totalAmount)}
                    disabled
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="المبلغ بدون ضريبة"
                    value={formatCurrency(selectedInvoice.amountWithoutVat)}
                    disabled
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="نسبة الضريبة"
                    value={`${selectedInvoice.vatPercentage}%`}
                    disabled
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="تاريخ الفاتورة"
                    value={formatDate(selectedInvoice.createdAt)}
                    disabled
                  />
                </Grid>
              </Grid>

              {/* تفاصيل العمولات */}
              <Typography variant="h6" gutterBottom>
                تفاصيل العمولات
              </Typography>
              
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">عمولات الوسطاء</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    {selectedInvoice.commissions?.mainBroker && (
                      <Grid item xs={12}>
                        <Paper sx={{ p: 2, mb: 2 }}>
                          <Typography variant="subtitle1" gutterBottom>
                            الوسيط الرئيسي
                          </Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={4}>
                              <TextField
                                fullWidth
                                label="الاسم"
                                value={selectedInvoice.commissions.mainBroker.name}
                                disabled
                              />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <TextField
                                fullWidth
                                label="النسبة"
                                value={`${selectedInvoice.commissions.mainBroker.percentage}%`}
                                disabled
                              />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <TextField
                                fullWidth
                                label="المبلغ"
                                value={formatCurrency(
                                  getCommissionAmount(
                                    selectedInvoice.amountWithoutVat,
                                    selectedInvoice.commissions.mainBroker.percentage
                                  )
                                )}
                                disabled
                              />
                            </Grid>
                          </Grid>
                        </Paper>
                      </Grid>
                    )}
                    
                    {selectedInvoice.commissions?.ourProfit && (
                      <Grid item xs={12}>
                        <Paper sx={{ p: 2, mb: 2 }}>
                          <Typography variant="subtitle1" gutterBottom>
                            ربحنا
                          </Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                fullWidth
                                label="النسبة"
                                value={`${selectedInvoice.commissions.ourProfit.percentage}%`}
                                disabled
                              />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                fullWidth
                                label="المبلغ"
                                value={formatCurrency(
                                  getCommissionAmount(
                                    selectedInvoice.amountWithoutVat,
                                    selectedInvoice.commissions.ourProfit.percentage
                                  )
                                )}
                                disabled
                              />
                            </Grid>
                          </Grid>
                        </Paper>
                      </Grid>
                    )}
                    
                    {selectedInvoice.commissions?.additionalBrokers?.map((broker, index) => (
                      <Grid item xs={12} key={index}>
                        <Paper sx={{ p: 2, mb: 2 }}>
                          <Typography variant="subtitle1" gutterBottom>
                            وسيط إضافي {index + 1}
                          </Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={4}>
                              <TextField
                                fullWidth
                                label="الاسم"
                                value={broker.name}
                                disabled
                              />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <TextField
                                fullWidth
                                label="النسبة"
                                value={`${broker.percentage}%`}
                                disabled
                              />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <TextField
                                fullWidth
                                label="المبلغ"
                                value={formatCurrency(
                                  getCommissionAmount(selectedInvoice.amountWithoutVat, broker.percentage)
                                )}
                                disabled
                              />
                            </Grid>
                          </Grid>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialog(false)}>إغلاق</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default DigitalInvoicesPage;