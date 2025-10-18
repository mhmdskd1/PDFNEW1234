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
  Menu,
  MenuList,
  ListItemIcon,
  ListItemText,
  MenuItem as MenuItemComponent
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon,
  FileDownload as ExportIcon,
  Clear as ClearIcon,
  MoreVert as MoreIcon,
  Archive as ArchiveIcon,
  Receipt as ReceiptIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  fetchPaidInvoices,
  searchInvoices,
  downloadInvoice,
  printInvoice,
  exportInvoices,
  getInvoiceStatistics
} from '../../store/slices/pdfInvoiceSlice';

const PaidInvoicesPage = () => {
  const dispatch = useDispatch();
  const {
    paidInvoices,
    filteredInvoices,
    statistics,
    loading,
    downloading,
    error,
    totalPages,
    currentPage
  } = useSelector(state => state.pdfInvoices);

  // حالة البحث والترشيح
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  const [amountFrom, setAmountFrom] = useState('');
  const [amountTo, setAmountTo] = useState('');
  
  // حالة الجدول والترقيم
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // حالة الحوارات
  const [filterDialog, setFilterDialog] = useState(false);
  const [previewDialog, setPreviewDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [exportDialog, setExportDialog] = useState(false);
  
  // حالة القائمة المنسدلة
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuInvoice, setMenuInvoice] = useState(null);

  useEffect(() => {
    dispatch(fetchPaidInvoices({ page: page + 1, limit: rowsPerPage }));
    dispatch(getInvoiceStatistics());
  }, [dispatch, page, rowsPerPage]);

  // معالجة البحث
  const handleSearch = () => {
    const searchParams = {
      searchTerm,
      clientId: filterClient,
      companyId: filterCompany,
      status: filterStatus,
      dateFrom,
      dateTo,
      amountFrom: amountFrom ? parseFloat(amountFrom) : null,
      amountTo: amountTo ? parseFloat(amountTo) : null,
      page: 1,
      limit: rowsPerPage
    };
    
    dispatch(searchInvoices(searchParams));
    setPage(0);
  };

  // مسح المرشحات
  const clearFilters = () => {
    setSearchTerm('');
    setFilterClient('');
    setFilterCompany('');
    setFilterStatus('');
    setDateFrom(null);
    setDateTo(null);
    setAmountFrom('');
    setAmountTo('');
    dispatch(fetchPaidInvoices({ page: 1, limit: rowsPerPage }));
  };

  // تحميل الفاتورة
  const handleDownload = async (invoiceId) => {
    try {
      await dispatch(downloadInvoice(invoiceId)).unwrap();
    } catch (error) {
      console.error('خطأ في تحميل الفاتورة:', error);
    }
  };

  // طباعة الفاتورة
  const handlePrint = async (invoiceId) => {
    try {
      await dispatch(printInvoice(invoiceId)).unwrap();
    } catch (error) {
      console.error('خطأ في طباعة الفاتورة:', error);
    }
  };

  // عرض معاينة الفاتورة
  const handlePreview = (invoice) => {
    setSelectedInvoice(invoice);
    setPreviewDialog(true);
  };

  // تصدير الفواتير
  const handleExport = async (format) => {
    const exportParams = {
      format, // 'excel' or 'pdf'
      filters: {
        searchTerm,
        clientId: filterClient,
        companyId: filterCompany,
        status: filterStatus,
        dateFrom,
        dateTo,
        amountFrom: amountFrom ? parseFloat(amountFrom) : null,
        amountTo: amountTo ? parseFloat(amountTo) : null
      }
    };
    
    try {
      await dispatch(exportInvoices(exportParams)).unwrap();
      setExportDialog(false);
    } catch (error) {
      console.error('خطأ في تصدير الفواتير:', error);
    }
  };

  // فتح قائمة الإجراءات
  const handleMenuOpen = (event, invoice) => {
    setAnchorEl(event.currentTarget);
    setMenuInvoice(invoice);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuInvoice(null);
  };

  // تغيير الصفحة
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // حصول على لون حالة الفاتورة
  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'partial':
        return 'warning';
      case 'overdue':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusText = (status) => {
    const statusTexts = {
      paid: 'مدفوعة بالكامل',
      partial: 'مدفوعة جزئياً',
      overdue: 'متأخرة'
    };
    return statusTexts[status] || status;
  };

  const displayedInvoices = filteredInvoices.length > 0 ? filteredInvoices : paidInvoices;

  if (loading && !paidInvoices.length) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          جاري تحميل سجل الفواتير...
        </Typography>
        <LinearProgress />
      </Paper>
    );
  }

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        سجل الفواتير المدفوعة (PDF)
      </Typography>

      {/* بطاقات إحصائية */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <ArchiveIcon color="primary" sx={{ mr: 2, fontSize: 40 }} />
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
                <ReceiptIcon color="info" sx={{ mr: 2, fontSize: 40 }} />
                <div>
                  <Typography variant="h4" color="info.main">
                    {statistics?.thisMonthCount || 0}
                  </Typography>
                  <Typography variant="body1" color="textSecondary">
                    فواتير هذا الشهر
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
                <PdfIcon color="secondary" sx={{ mr: 2, fontSize: 40 }} />
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
              label="بحث في الفواتير"
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
              placeholder="رقم الفاتورة، اسم العميل، الشركة..."
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
              
              {(searchTerm || filterClient || filterCompany || dateFrom || dateTo) && (
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
                <TableCell>رقم الفاتورة</TableCell>
                <TableCell>العميل</TableCell>
                <TableCell>الشركة الدافعة</TableCell>
                <TableCell>المبلغ</TableCell>
                <TableCell>حالة الدفع</TableCell>
                <TableCell>تاريخ الإنشاء</TableCell>
                <TableCell>تاريخ الدفع</TableCell>
                <TableCell>الإجراءات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayedInvoices
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((invoice) => (
                <TableRow key={invoice.id} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <PdfIcon color="primary" sx={{ mr: 1 }} />
                      <Typography fontWeight="bold">
                        {invoice.invoiceNumber}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{invoice.client?.name || 'غير محدد'}</TableCell>
                  <TableCell>{invoice.payingCompany?.name || 'غير محدد'}</TableCell>
                  <TableCell>
                    <Typography fontWeight="bold">
                      {formatCurrency(invoice.totalAmount)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={getStatusText(invoice.paymentStatus)}
                      color={getStatusColor(invoice.paymentStatus)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{formatDate(invoice.createdAt)}</TableCell>
                  <TableCell>{formatDate(invoice.paidAt)}</TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Tooltip title="عرض معاينة">
                        <IconButton 
                          onClick={() => handlePreview(invoice)}
                          size="small"
                          color="primary"
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="تحميل">
                        <IconButton 
                          onClick={() => handleDownload(invoice.id)}
                          size="small"
                          color="secondary"
                          disabled={downloading}
                        >
                          <DownloadIcon />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="المزيد">
                        <IconButton 
                          onClick={(e) => handleMenuOpen(e, invoice)}
                          size="small"
                        >
                          <MoreIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
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

      {/* قائمة منسدلة للإجراءات */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuList>
          <MenuItemComponent onClick={() => {
            handlePrint(menuInvoice?.id);
            handleMenuClose();
          }}>
            <ListItemIcon>
              <PrintIcon />
            </ListItemIcon>
            <ListItemText>طباعة</ListItemText>
          </MenuItemComponent>
          
          <MenuItemComponent onClick={() => {
            handleDownload(menuInvoice?.id);
            handleMenuClose();
          }}>
            <ListItemIcon>
              <DownloadIcon />
            </ListItemIcon>
            <ListItemText>تحميل مرة أخرى</ListItemText>
          </MenuItemComponent>
          
          <MenuItemComponent onClick={() => {
            handlePreview(menuInvoice);
            handleMenuClose();
          }}>
            <ListItemIcon>
              <ViewIcon />
            </ListItemIcon>
            <ListItemText>عرض تفاصيل كاملة</ListItemText>
          </MenuItemComponent>
        </MenuList>
      </Menu>

      {/* حوار الفلتر المتقدم */}
      <Dialog open={filterDialog} onClose={() => setFilterDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>فلتر متقدم للفواتير</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>العميل</InputLabel>
                <Select
                  value={filterClient}
                  onChange={(e) => setFilterClient(e.target.value)}
                  label="العميل"
                >
                  <MenuItem value="">جميع العملاء</MenuItem>
                  {/* سيتم تعبئتها من API */}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>الشركة</InputLabel>
                <Select
                  value={filterCompany}
                  onChange={(e) => setFilterCompany(e.target.value)}
                  label="الشركة"
                >
                  <MenuItem value="">جميع الشركات</MenuItem>
                  {/* سيتم تعبئتها من API */}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>حالة الدفع</InputLabel>
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  label="حالة الدفع"
                >
                  <MenuItem value="">جميع الحالات</MenuItem>
                  <MenuItem value="paid">مدفوعة بالكامل</MenuItem>
                  <MenuItem value="partial">مدفوعة جزئياً</MenuItem>
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
        <DialogTitle>تصدير سجل الفواتير</DialogTitle>
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

      {/* حوار معاينة الفاتورة */}
      <Dialog open={previewDialog} onClose={() => setPreviewDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          معاينة الفاتورة رقم: {selectedInvoice?.invoiceNumber}
        </DialogTitle>
        <DialogContent>
          {selectedInvoice && (
            <Grid container spacing={2}>
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
                  label="العميل"
                  value={selectedInvoice.client?.name || ''}
                  disabled
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="الشركة الدافعة"
                  value={selectedInvoice.payingCompany?.name || ''}
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
                  label="تاريخ الإنشاء"
                  value={formatDate(selectedInvoice.createdAt)}
                  disabled
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="تاريخ الدفع"
                  value={formatDate(selectedInvoice.paidAt)}
                  disabled
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialog(false)}>إغلاق</Button>
          <Button 
            onClick={() => handleDownload(selectedInvoice?.id)}
            startIcon={<DownloadIcon />}
            variant="contained"
          >
            تحميل
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default PaidInvoicesPage;