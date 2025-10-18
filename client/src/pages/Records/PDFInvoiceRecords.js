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
  InputAdornment,
  Paper,
  Menu,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  GetApp as DownloadIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Print as PrintIcon,
  MoreVert as MoreIcon,
  PictureAsPdf as PdfIcon,
  Euro as EuroIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';

const PDFInvoiceRecords = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [viewDialog, setViewDialog] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  
  // Mock data
  useEffect(() => {
    setInvoices([
      {
        _id: '1',
        invoiceNumber: '2025-5588-001',
        clientName: 'أحمد محمد',
        companyName: 'شركة أمستردام التجارية',
        amount: 1500.00,
        vatAmount: 315.00,
        totalAmount: 1815.00,
        status: 'paid',
        createdAt: '2025-01-15',
        dueDate: '2025-02-15',
        template: 'Template Modern',
        paymentCompany: 'ING Bank Nederland',
      },
      {
        _id: '2',
        invoiceNumber: '2025-5588-002',
        clientName: 'سارة أحمد',
        companyName: 'Rotterdam Business Center',
        amount: 2000.00,
        vatAmount: 420.00,
        totalAmount: 2420.00,
        status: 'partial',
        createdAt: '2025-01-18',
        dueDate: '2025-02-18',
        template: 'Template Professional',
        paymentCompany: 'ABN AMRO',
      },
      {
        _id: '3',
        invoiceNumber: '2025-5588-003',
        clientName: 'محمد علي',
        companyName: 'Dutch Innovation Hub',
        amount: 3500.00,
        vatAmount: 735.00,
        totalAmount: 4235.00,
        status: 'pending',
        createdAt: '2025-01-20',
        dueDate: '2025-02-20',
        template: 'Template Classic',
        paymentCompany: 'ING Bank Nederland',
      },
    ]);
  }, []);
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'partial':
        return 'warning';
      case 'pending':
        return 'error';
      default:
        return 'default';
    }
  };
  
  const getStatusText = (status) => {
    switch (status) {
      case 'paid':
        return 'مدفوعة';
      case 'partial':
        return 'مدفوعة جزئياً';
      case 'pending':
        return 'معلقة';
      default:
        return status;
    }
  };
  
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
  
  const handleDownload = (invoice) => {
    toast.success(`تم تحميل الفاتورة ${invoice.invoiceNumber}`);
  };
  
  const handlePrint = (invoice) => {
    toast.success(`تم إرسال الفاتورة ${invoice.invoiceNumber} للطباعة`);
  };
  
  const handleEdit = (invoice) => {
    toast.info(`فتح تحرير الفاتورة ${invoice.invoiceNumber}`);
  };
  
  const handleDelete = (invoice) => {
    toast.success(`تم حذف الفاتورة ${invoice.invoiceNumber}`);
  };
  
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.companyName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    const matchesDate = !dateFilter || invoice.createdAt.includes(dateFilter);
    return matchesSearch && matchesStatus && matchesDate;
  });
  
  const handleMenuOpen = (event, invoice) => {
    setSelectedInvoice(invoice);
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedInvoice(null);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          سجل فواتير PDF
        </Typography>
        <Typography variant="subtitle1" sx={{ color: 'text.secondary' }}>
          أرشيف جميع فواتير PDF التي تم إنشاؤها مع إمكانية البحث والفلترة
        </Typography>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="بحث برقم الفاتورة، العميل، أو الشركة..."
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
                <InputLabel>حالة الفاتورة</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="حالة الفاتورة"
                >
                  <MenuItem value="all">جميع الحالات</MenuItem>
                  <MenuItem value="paid">مدفوعة</MenuItem>
                  <MenuItem value="partial">مدفوعة جزئياً</MenuItem>
                  <MenuItem value="pending">معلقة</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="فلترة بالتاريخ"
                type="month"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} md={2}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<FilterIcon />}
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
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
                    {invoices.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    إجمالي الفواتير
                  </Typography>
                </Box>
                <PdfIcon sx={{ fontSize: 40, color: 'primary.main' }} />
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
                    {invoices.filter(inv => inv.status === 'paid').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    فواتير مدفوعة
                  </Typography>
                </Box>
                <EuroIcon sx={{ fontSize: 40, color: 'success.main' }} />
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
                    {invoices.filter(inv => inv.status === 'partial').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    مدفوعة جزئياً
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
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                    {invoices.filter(inv => inv.status === 'pending').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    فواتير معلقة
                  </Typography>
                </Box>
                <EuroIcon sx={{ fontSize: 40, color: 'error.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Invoices Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>رقم الفاتورة</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>العميل</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>الشركة</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>المبلغ</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>الحالة</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>تاريخ الإنشاء</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>الاستحقاق</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>العمليات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, index) => (
                  <TableRow key={index}>
                    {[...Array(8)].map((_, cellIndex) => (
                      <TableCell key={cellIndex}>
                        <Box sx={{ height: 20, bgcolor: 'action.hover', borderRadius: 1 }} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      لا توجد فواتير مطابقة للبحث
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((invoice) => (
                    <TableRow 
                      key={invoice._id}
                      sx={{
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', fontFamily: 'monospace' }}>
                          {invoice.invoiceNumber}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {invoice.template}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {invoice.clientName}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2">
                          {invoice.companyName}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {formatCurrency(invoice.totalAmount)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ({formatCurrency(invoice.amount)} + VAT)
                          </Typography>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Chip
                          label={getStatusText(invoice.status)}
                          color={getStatusColor(invoice.status)}
                          size="small"
                        />
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(invoice.createdAt)}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(invoice.dueDate)}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="عرض">
                            <IconButton
                              size="small"
                              onClick={() => handleView(invoice)}
                              sx={{ color: 'primary.main' }}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="تحميل PDF">
                            <IconButton
                              size="small"
                              onClick={() => handleDownload(invoice)}
                              sx={{ color: 'success.main' }}
                            >
                              <DownloadIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="المزيد">
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuOpen(e, invoice)}
                            >
                              <MoreIcon fontSize="small" />
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
          count={filteredInvoices.length}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} من ${count}`
          }
          labelRowsPerPage="عدد الصفوف:"
        />
      </Card>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          handleEdit(selectedInvoice);
          handleMenuClose();
        }}>
          <EditIcon sx={{ mr: 1 }} />
          تعديل
        </MenuItem>
        
        <MenuItem onClick={() => {
          handlePrint(selectedInvoice);
          handleMenuClose();
        }}>
          <PrintIcon sx={{ mr: 1 }} />
          طباعة
        </MenuItem>
        
        <MenuItem onClick={() => {
          handleDelete(selectedInvoice);
          handleMenuClose();
        }}>
          <DeleteIcon sx={{ mr: 1 }} />
          حذف
        </MenuItem>
      </Menu>

      {/* View Invoice Dialog */}
      <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          تفاصيل الفاتورة {selectedInvoice?.invoiceNumber}
        </DialogTitle>
        <DialogContent>
          {selectedInvoice && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">العميل:</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>{selectedInvoice.clientName}</Typography>
                
                <Typography variant="subtitle2" color="text.secondary">الشركة:</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>{selectedInvoice.companyName}</Typography>
                
                <Typography variant="subtitle2" color="text.secondary">شركة الدفع:</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>{selectedInvoice.paymentCompany}</Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">المبلغ الأساسي:</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>{formatCurrency(selectedInvoice.amount)}</Typography>
                
                <Typography variant="subtitle2" color="text.secondary">ضريبة القيمة المضافة:</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>{formatCurrency(selectedInvoice.vatAmount)}</Typography>
                
                <Typography variant="subtitle2" color="text.secondary">المجموع الإجمالي:</Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  {formatCurrency(selectedInvoice.totalAmount)}
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                  <Chip
                    label={getStatusText(selectedInvoice.status)}
                    color={getStatusColor(selectedInvoice.status)}
                  />
                  <Typography variant="body2" color="text.secondary">
                    تاريخ الإنشاء: {formatDate(selectedInvoice.createdAt)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(false)}>إغلاق</Button>
          <Button variant="contained" onClick={() => handleDownload(selectedInvoice)}>
            تحميل PDF
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PDFInvoiceRecords;