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
  Tabs,
  Tab,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Alert,
  LinearProgress,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  FilterList as FilterIcon,
  FileDownload as ExportIcon,
  Visibility as ViewIcon,
  MonetizationOn as MoneyIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  fetchBalances,
  fetchTransactions,
  exportBalanceStatement,
  filterTransactions
} from '../../store/slices/balanceSlice';

const BalancesPage = () => {
  const dispatch = useDispatch();
  const {
    cashBalance,
    brokerBalances,
    transactions,
    filteredTransactions,
    loading,
    error
  } = useSelector(state => state.balances);

  const [currentTab, setCurrentTab] = useState(0);
  const [filterDialog, setFilterDialog] = useState(false);
  const [exportDialog, setExportDialog] = useState(false);
  const [selectedBroker, setSelectedBroker] = useState('');
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  const [transactionType, setTransactionType] = useState('');
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  useEffect(() => {
    dispatch(fetchBalances());
    dispatch(fetchTransactions());
  }, [dispatch]);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleFilter = () => {
    const filters = {
      brokerId: selectedBroker,
      dateFrom,
      dateTo,
      type: transactionType
    };
    dispatch(filterTransactions(filters));
    setFilterDialog(false);
  };

  const clearFilters = () => {
    setSelectedBroker('');
    setDateFrom(null);
    setDateTo(null);
    setTransactionType('');
    dispatch(filterTransactions({}));
  };

  const handleExport = async (format) => {
    const exportData = {
      format, // 'excel' or 'pdf'
      filters: {
        brokerId: selectedBroker,
        dateFrom,
        dateTo,
        type: transactionType
      }
    };
    
    try {
      await dispatch(exportBalanceStatement(exportData)).unwrap();
      setExportDialog(false);
    } catch (error) {
      console.error('خطأ في تصدير البيانات:', error);
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'payment':
        return <MoneyIcon color="success" />;
      case 'commission':
        return <TrendingUpIcon color="primary" />;
      case 'withdrawal':
        return <TrendingDownIcon color="error" />;
      case 'transfer':
        return <AccountBalanceIcon color="info" />;
      default:
        return <ReceiptIcon />;
    }
  };

  const getTransactionTypeText = (type) => {
    const types = {
      payment: 'دفع فاتورة',
      commission: 'عمولة',
      withdrawal: 'سحب',
      transfer: 'تحويل',
      profit: 'ربح'
    };
    return types[type] || type;
  };

  const getTotalBrokerBalance = () => {
    return brokerBalances.reduce((sum, broker) => sum + broker.balance, 0);
  };

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );

  if (loading && !transactions.length) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          جاري تحميل بيانات الأرصدة...
        </Typography>
        <LinearProgress />
      </Paper>
    );
  }

  return (
    <div>
      {/* إحصائيات مالية سريعة */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <AccountBalanceIcon color="primary" sx={{ mr: 2, fontSize: 40 }} />
                <div>
                  <Typography variant="h4" color="primary">
                    {formatCurrency(cashBalance)}
                  </Typography>
                  <Typography variant="body1" color="textSecondary">
                    رصيد الصندوق
                  </Typography>
                </div>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <PersonIcon color="secondary" sx={{ mr: 2, fontSize: 40 }} />
                <div>
                  <Typography variant="h4" color="secondary">
                    {formatCurrency(getTotalBrokerBalance())}
                  </Typography>
                  <Typography variant="body1" color="textSecondary">
                    إجمالي أرصدة الوسطاء
                  </Typography>
                </div>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TrendingUpIcon color="success" sx={{ mr: 2, fontSize: 40 }} />
                <div>
                  <Typography variant="h4" color="success.main">
                    {formatCurrency(cashBalance + getTotalBrokerBalance())}
                  </Typography>
                  <Typography variant="body1" color="textSecondary">
                    إجمالي الرصيد
                  </Typography>
                </div>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={currentTab} onChange={handleTabChange}>
            <Tab label="صندوقي" icon={<AccountBalanceIcon />} />
            <Tab label="الوسطاء والممولين" icon={<PersonIcon />} />
          </Tabs>
        </Box>

        {/* تبويب الصندوق */}
        <TabPanel value={currentTab} index={0}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              حركات الصندوق
            </Typography>
            <Box>
              <Button 
                startIcon={<FilterIcon />} 
                onClick={() => setFilterDialog(true)}
                sx={{ mr: 1 }}
              >
                ترشيح
              </Button>
              <Button 
                startIcon={<ExportIcon />} 
                onClick={() => setExportDialog(true)}
                variant="outlined"
              >
                تصدير
              </Button>
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>النوع</TableCell>
                  <TableCell>الوصف</TableCell>
                  <TableCell>رقم الفاتورة</TableCell>
                  <TableCell>المبلغ</TableCell>
                  <TableCell>التاريخ</TableCell>
                  <TableCell>الإجراءات</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(filteredTransactions.length ? filteredTransactions : transactions)
                  .filter(t => t.accountType === 'cash')
                  .map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        {getTransactionIcon(transaction.type)}
                        <Typography sx={{ ml: 1 }}>
                          {getTransactionTypeText(transaction.type)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>
                      {transaction.invoiceNumber ? (
                        <Chip 
                          label={transaction.invoiceNumber} 
                          size="small" 
                          color="primary"
                        />
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <Typography 
                        color={transaction.amount > 0 ? 'success.main' : 'error.main'}
                        fontWeight="bold"
                      >
                        {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                      </Typography>
                    </TableCell>
                    <TableCell>{formatDate(transaction.createdAt)}</TableCell>
                    <TableCell>
                      <Tooltip title="عرض التفاصيل">
                        <IconButton 
                          onClick={() => {
                            setSelectedTransaction(transaction);
                            setDetailsDialog(true);
                          }}
                          size="small"
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* تبويب الوسطاء */}
        <TabPanel value={currentTab} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  قائمة الوسطاء
                </Typography>
                <List>
                  {brokerBalances.map((broker) => (
                    <React.Fragment key={broker.id}>
                      <ListItem 
                        button 
                        onClick={() => setSelectedBroker(broker.id)}
                        selected={selectedBroker === broker.id}
                      >
                        <ListItemText
                          primary={broker.name}
                          secondary={`${broker.type === 'broker' ? 'وسيط' : 'ممول'}`}
                        />
                        <ListItemSecondaryAction>
                          <Typography 
                            variant="h6" 
                            color={broker.balance >= 0 ? 'success.main' : 'error.main'}
                          >
                            {formatCurrency(broker.balance)}
                          </Typography>
                        </ListItemSecondaryAction>
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  حركات الوسيط المختار
                </Typography>
                
                {selectedBroker ? (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>النوع</TableCell>
                          <TableCell>الوصف</TableCell>
                          <TableCell>رقم الفاتورة</TableCell>
                          <TableCell>المبلغ</TableCell>
                          <TableCell>التاريخ</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {transactions
                          .filter(t => t.brokerId === selectedBroker)
                          .map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell>
                              <Box display="flex" alignItems="center">
                                {getTransactionIcon(transaction.type)}
                                <Typography sx={{ ml: 1 }}>
                                  {getTransactionTypeText(transaction.type)}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>{transaction.description}</TableCell>
                            <TableCell>
                              {transaction.invoiceNumber ? (
                                <Chip 
                                  label={transaction.invoiceNumber} 
                                  size="small" 
                                  color="primary"
                                />
                              ) : '-'}
                            </TableCell>
                            <TableCell>
                              <Typography 
                                color={transaction.amount > 0 ? 'success.main' : 'error.main'}
                                fontWeight="bold"
                              >
                                {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                              </Typography>
                            </TableCell>
                            <TableCell>{formatDate(transaction.createdAt)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Alert severity="info">
                    اختر وسيطاً من القائمة لعرض حركاته
                  </Alert>
                )}
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>

      {/* حوار الترشيح */}
      <Dialog open={filterDialog} onClose={() => setFilterDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>ترشيح الحركات</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>الوسيط</InputLabel>
                <Select
                  value={selectedBroker}
                  onChange={(e) => setSelectedBroker(e.target.value)}
                  label="الوسيط"
                >
                  <MenuItem value="">جميع الوسطاء</MenuItem>
                  {brokerBalances.map((broker) => (
                    <MenuItem key={broker.id} value={broker.id}>
                      {broker.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>نوع الحركة</InputLabel>
                <Select
                  value={transactionType}
                  onChange={(e) => setTransactionType(e.target.value)}
                  label="نوع الحركة"
                >
                  <MenuItem value="">جميع الأنواع</MenuItem>
                  <MenuItem value="payment">دفع فاتورة</MenuItem>
                  <MenuItem value="commission">عمولة</MenuItem>
                  <MenuItem value="withdrawal">سحب</MenuItem>
                  <MenuItem value="transfer">تحويل</MenuItem>
                  <MenuItem value="profit">ربح</MenuItem>
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
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={clearFilters}>مسح المرشحات</Button>
          <Button onClick={() => setFilterDialog(false)}>إلغاء</Button>
          <Button onClick={handleFilter} variant="contained">
            تطبيق الفلتر
          </Button>
        </DialogActions>
      </Dialog>

      {/* حوار التصدير */}
      <Dialog open={exportDialog} onClose={() => setExportDialog(false)}>
        <DialogTitle>تصدير كشف الأرصدة</DialogTitle>
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

      {/* حوار تفاصيل الحركة */}
      <Dialog open={detailsDialog} onClose={() => setDetailsDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>تفاصيل الحركة</DialogTitle>
        <DialogContent>
          {selectedTransaction && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="نوع الحركة"
                  value={getTransactionTypeText(selectedTransaction.type)}
                  disabled
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="الوصف"
                  value={selectedTransaction.description}
                  disabled
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="المبلغ"
                  value={formatCurrency(selectedTransaction.amount)}
                  disabled
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="التاريخ"
                  value={formatDate(selectedTransaction.createdAt)}
                  disabled
                />
              </Grid>
              {selectedTransaction.invoiceNumber && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="رقم الفاتورة"
                    value={selectedTransaction.invoiceNumber}
                    disabled
                  />
                </Grid>
              )}
              {selectedTransaction.details && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="تفاصيل إضافية"
                    value={JSON.stringify(selectedTransaction.details, null, 2)}
                    disabled
                    multiline
                    rows={4}
                  />
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialog(false)}>إغلاق</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default BalancesPage;