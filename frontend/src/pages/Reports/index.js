import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Assessment as ReportIcon,
  FileDownload as DownloadIcon,
  PictureAsPdf as PdfIcon,
  TableView as ExcelIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  MonetizationOn as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  Receipt as ReceiptIcon,
  AccountBalance as AccountBalanceIcon,
  ExpandMore as ExpandMoreIcon,
  CalendarToday as CalendarIcon,
  Analytics as AnalyticsIcon,
  Print as PrintIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  generateUnpaidInvoicesReport,
  generateClientReport,
  generateCompanyReport,
  generateProfitReport,
  generateSummaryReport,
  exportReport,
  getReportStatistics
} from '../../store/slices/reportsSlice';

const ReportsPage = () => {
  const dispatch = useDispatch();
  const {
    reports,
    statistics,
    loading,
    generating,
    error
  } = useSelector(state => state.reports);

  // حالة التقارير
  const [selectedReportType, setSelectedReportType] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedBroker, setSelectedBroker] = useState('');
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  const [reportFormat, setReportFormat] = useState('pdf');
  
  // حالة الحوارات
  const [generateDialog, setGenerateDialog] = useState(false);
  const [previewDialog, setPreviewDialog] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  
  // قائمة أنواع التقارير
  const reportTypes = [
    {
      id: 'unpaid_invoices',
      name: 'كشف الفواتير الغير مدفوعة',
      description: 'تقرير شامل عن الفواتير الغير مدفوعة حسب العملاء',
      icon: <ReceiptIcon />,
      color: 'warning'
    },
    {
      id: 'client_statement',
      name: 'كشف خاص بعميل',
      description: 'تقرير مفصل عن جميع معاملات عميل محدد',
      icon: <PersonIcon />,
      color: 'primary'
    },
    {
      id: 'company_statement',
      name: 'كشف خاص بشركة',
      description: 'تقرير مفصل عن جميع معاملات شركة محددة',
      icon: <BusinessIcon />,
      color: 'secondary'
    },
    {
      id: 'profit_report',
      name: 'كشف الأرباح',
      description: 'تقرير مفصل عن إجمالي الأرباح والعمولات',
      icon: <TrendingUpIcon />,
      color: 'success'
    },
    {
      id: 'broker_statement',
      name: 'كشف خاص بوسيط',
      description: 'تقرير مفصل عن جميع معاملات وسيط محدد',
      icon: <AccountBalanceIcon />,
      color: 'info'
    },
    {
      id: 'summary_report',
      name: 'تقرير إجمالي',
      description: 'ملخص شامل لجميع العمليات المالية',
      icon: <AnalyticsIcon />,
      color: 'default'
    }
  ];

  useEffect(() => {
    dispatch(getReportStatistics());
  }, [dispatch]);

  // إنشاء تقرير
  const handleGenerateReport = async () => {
    const reportParams = {
      type: selectedReportType,
      clientId: selectedClient,
      companyId: selectedCompany,
      brokerId: selectedBroker,
      dateFrom,
      dateTo,
      format: reportFormat
    };

    try {
      let reportAction;
      
      switch (selectedReportType) {
        case 'unpaid_invoices':
          reportAction = generateUnpaidInvoicesReport(reportParams);
          break;
        case 'client_statement':
          reportAction = generateClientReport(reportParams);
          break;
        case 'company_statement':
          reportAction = generateCompanyReport(reportParams);
          break;
        case 'profit_report':
          reportAction = generateProfitReport(reportParams);
          break;
        case 'broker_statement':
          reportAction = generateBrokerReport(reportParams);
          break;
        case 'summary_report':
          reportAction = generateSummaryReport(reportParams);
          break;
        default:
          throw new Error('نوع تقرير غير محدد');
      }
      
      await dispatch(reportAction).unwrap();
      setGenerateDialog(false);
      
      // إعادة تعيين القيم
      setSelectedReportType('');
      setSelectedClient('');
      setSelectedCompany('');
      setSelectedBroker('');
      setDateFrom(null);
      setDateTo(null);
      
    } catch (error) {
      console.error('خطأ في إنشاء التقرير:', error);
    }
  };

  // تصدير تقرير
  const handleExportReport = async (reportId, format) => {
    try {
      await dispatch(exportReport({ reportId, format })).unwrap();
    } catch (error) {
      console.error('خطأ في تصدير التقرير:', error);
    }
  };

  // فتح حوار إنشاء تقرير
  const openGenerateDialog = (reportType) => {
    setSelectedReportType(reportType);
    setGenerateDialog(true);
  };

  // عرض معاينة التقرير
  const handlePreviewReport = (report) => {
    setSelectedReport(report);
    setPreviewDialog(true);
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          جاري تحميل بيانات التقارير...
        </Typography>
        <LinearProgress />
      </Paper>
    );
  }

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        مركز التقارير والإحصائيات
      </Typography>

      {/* إحصائيات سريعة */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <ReportIcon color="primary" sx={{ mr: 2, fontSize: 40 }} />
                <div>
                  <Typography variant="h4" color="primary">
                    {statistics?.totalReports || 0}
                  </Typography>
                  <Typography variant="body1" color="textSecondary">
                    إجمالي التقارير
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
                <ReceiptIcon color="warning" sx={{ mr: 2, fontSize: 40 }} />
                <div>
                  <Typography variant="h4" color="warning.main">
                    {statistics?.unpaidInvoicesCount || 0}
                  </Typography>
                  <Typography variant="body1" color="textSecondary">
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
                <TrendingUpIcon color="success" sx={{ mr: 2, fontSize: 40 }} />
                <div>
                  <Typography variant="h4" color="success.main">
                    {formatCurrency(statistics?.totalProfits || 0)}
                  </Typography>
                  <Typography variant="body1" color="textSecondary">
                    إجمالي الأرباح
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
                    {formatCurrency(statistics?.pendingAmount || 0)}
                  </Typography>
                  <Typography variant="body1" color="textSecondary">
                    مبالغ معلقة
                  </Typography>
                </div>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* قسم أنواع التقارير */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          أنواع التقارير المتاحة
        </Typography>
        
        <Grid container spacing={3}>
          {reportTypes.map((reportType) => (
            <Grid item xs={12} sm={6} md={4} key={reportType.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}
                onClick={() => openGenerateDialog(reportType.id)}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Box 
                      sx={{ 
                        mr: 2, 
                        p: 1, 
                        borderRadius: '50%', 
                        bgcolor: `${reportType.color}.light`,
                        color: `${reportType.color}.contrastText`
                      }}
                    >
                      {reportType.icon}
                    </Box>
                    <Typography variant="h6">
                      {reportType.name}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="textSecondary">
                    {reportType.description}
                  </Typography>
                  <Box mt={2}>
                    <Button 
                      variant="outlined" 
                      color={reportType.color}
                      startIcon={<ReportIcon />}
                      fullWidth
                    >
                      إنشاء تقرير
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* قسم التقارير الحالية */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          التقارير الحالية
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {reports && reports.length > 0 ? (
          <Grid container spacing={2}>
            {reports.map((report) => (
              <Grid item xs={12} key={report.id}>
                <Card>
                  <CardContent>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={6} md={3}>
                        <Box display="flex" alignItems="center">
                          <ReportIcon color="primary" sx={{ mr: 1 }} />
                          <div>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {report.title}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {report.type}
                            </Typography>
                          </div>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} sm={6} md={2}>
                        <Chip 
                          label={report.status === 'completed' ? 'مكتمل' : 'جاري المعالجة'}
                          color={report.status === 'completed' ? 'success' : 'warning'}
                          size="small"
                        />
                      </Grid>
                      
                      <Grid item xs={12} sm={6} md={2}>
                        <Typography variant="body2">
                          {formatDate(report.createdAt)}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} sm={6} md={2}>
                        <Typography variant="body2">
                          {report.format.toUpperCase()}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} sm={6} md={3}>
                        <Box display="flex" gap={1}>
                          <IconButton 
                            onClick={() => handlePreviewReport(report)}
                            color="primary"
                            size="small"
                          >
                            <ViewIcon />
                          </IconButton>
                          
                          <IconButton 
                            onClick={() => handleExportReport(report.id, 'pdf')}
                            color="secondary"
                            size="small"
                            disabled={report.status !== 'completed'}
                          >
                            <PdfIcon />
                          </IconButton>
                          
                          <IconButton 
                            onClick={() => handleExportReport(report.id, 'excel')}
                            color="success"
                            size="small"
                            disabled={report.status !== 'completed'}
                          >
                            <ExcelIcon />
                          </IconButton>
                          
                          <IconButton 
                            onClick={() => window.print()}
                            size="small"
                            disabled={report.status !== 'completed'}
                          >
                            <PrintIcon />
                          </IconButton>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Alert severity="info">
            لا توجد تقارير حالياً. قم بإنشاء تقرير جديد من الأعلى.
          </Alert>
        )}
      </Paper>

      {/* حوار إنشاء تقرير */}
      <Dialog open={generateDialog} onClose={() => setGenerateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          إنشاء تقرير جديد
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>نوع التقرير</InputLabel>
                <Select
                  value={selectedReportType}
                  onChange={(e) => setSelectedReportType(e.target.value)}
                  label="نوع التقرير"
                >
                  {reportTypes.map((type) => (
                    <MenuItem key={type.id} value={type.id}>
                      <Box display="flex" alignItems="center">
                        {type.icon}
                        <Typography sx={{ ml: 1 }}>{type.name}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {/* فلاتر حسب نوع التقرير */}
            {(selectedReportType === 'client_statement') && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>العميل</InputLabel>
                  <Select
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                    label="العميل"
                  >
                    <MenuItem value="">جميع العملاء</MenuItem>
                    {/* سيتم تعبئتها من API */}
                  </Select>
                </FormControl>
              </Grid>
            )}
            
            {(selectedReportType === 'company_statement') && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>الشركة</InputLabel>
                  <Select
                    value={selectedCompany}
                    onChange={(e) => setSelectedCompany(e.target.value)}
                    label="الشركة"
                  >
                    <MenuItem value="">جميع الشركات</MenuItem>
                    {/* سيتم تعبئتها من API */}
                  </Select>
                </FormControl>
              </Grid>
            )}
            
            {(selectedReportType === 'broker_statement') && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>الوسيط</InputLabel>
                  <Select
                    value={selectedBroker}
                    onChange={(e) => setSelectedBroker(e.target.value)}
                    label="الوسيط"
                  >
                    <MenuItem value="">جميع الوسطاء</MenuItem>
                    {/* سيتم تعبئتها من API */}
                  </Select>
                </FormControl>
              </Grid>
            )}
            
            {/* تواريخ التقرير */}
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
            
            {/* نوع الملف */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>نوع الملف</InputLabel>
                <Select
                  value={reportFormat}
                  onChange={(e) => setReportFormat(e.target.value)}
                  label="نوع الملف"
                >
                  <MenuItem value="pdf">
                    <Box display="flex" alignItems="center">
                      <PdfIcon sx={{ mr: 1 }} />
                      PDF
                    </Box>
                  </MenuItem>
                  <MenuItem value="excel">
                    <Box display="flex" alignItems="center">
                      <ExcelIcon sx={{ mr: 1 }} />
                      Excel
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGenerateDialog(false)}>إلغاء</Button>
          <Button 
            onClick={handleGenerateReport} 
            variant="contained"
            disabled={generating || !selectedReportType}
            startIcon={generating ? <LinearProgress size={20} /> : <ReportIcon />}
          >
            {generating ? 'جاري الإنشاء...' : 'إنشاء التقرير'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* حوار معاينة التقرير */}
      <Dialog open={previewDialog} onClose={() => setPreviewDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          معاينة التقرير: {selectedReport?.title}
        </DialogTitle>
        <DialogContent>
          {selectedReport && (
            <div>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="عنوان التقرير"
                    value={selectedReport.title}
                    disabled
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="نوع التقرير"
                    value={selectedReport.type}
                    disabled
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="تاريخ الإنشاء"
                    value={formatDate(selectedReport.createdAt)}
                    disabled
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="نوع الملف"
                    value={selectedReport.format.toUpperCase()}
                    disabled
                  />
                </Grid>
              </Grid>
              
              {/* ملخص بيانات التقرير */}
              {selectedReport.summary && (
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">ملخص التقرير</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <TableContainer component={Paper}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>البيان</TableCell>
                            <TableCell>القيمة</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {Object.entries(selectedReport.summary).map(([key, value]) => (
                            <TableRow key={key}>
                              <TableCell>{key}</TableCell>
                              <TableCell>
                                {typeof value === 'number' ? formatCurrency(value) : value}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </AccordionDetails>
                </Accordion>
              )}
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialog(false)}>إغلاق</Button>
          <Button 
            onClick={() => handleExportReport(selectedReport?.id, 'pdf')}
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

export default ReportsPage;