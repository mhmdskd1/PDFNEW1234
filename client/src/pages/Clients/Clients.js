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
  Paper,
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
  Alert,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  AccountBalance as BankIcon,
} from '@mui/icons-material';
import {
  fetchClients,
  createClient,
  updateClient,
  deleteClient,
  setPage,
} from '../../store/slices/clientsSlice';
import toast from 'react-hot-toast';
import { useForm, Controller } from 'react-hook-form';

const Clients = () => {
  const dispatch = useDispatch();
  const { clients, total, page, limit, loading, error } = useSelector(
    state => state.clients
  );
  
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  
  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      type: 'broker',
      companyName: '',
      bankAccount: '',
      notes: '',
    },
  });

  useEffect(() => {
    dispatch(fetchClients({ page, limit, search: searchTerm, type: typeFilter }));
  }, [dispatch, page, limit, searchTerm, typeFilter]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleOpenDialog = (client = null) => {
    if (client) {
      setEditMode(true);
      setSelectedClient(client);
      reset(client);
    } else {
      setEditMode(false);
      setSelectedClient(null);
      reset({
        name: '',
        email: '',
        phone: '',
        address: '',
        type: 'broker',
        companyName: '',
        bankAccount: '',
        notes: '',
      });
    }
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditMode(false);
    setSelectedClient(null);
    reset();
  };

  const onSubmit = async (data) => {
    try {
      if (editMode) {
        await dispatch(updateClient({ id: selectedClient._id, data })).unwrap();
        toast.success('تم تحديث العميل بنجاح');
      } else {
        await dispatch(createClient(data)).unwrap();
        toast.success('تم إضافة العميل بنجاح');
      }
      handleCloseDialog();
    } catch (error) {
      toast.error(error);
    }
  };

  const handleDelete = async () => {
    try {
      await dispatch(deleteClient(selectedClient._id)).unwrap();
      toast.success('تم حذف العميل بنجاح');
      setDeleteDialog(false);
      setSelectedClient(null);
    } catch (error) {
      toast.error(error);
    }
  };

  const handleChangePage = (event, newPage) => {
    dispatch(setPage(newPage + 1));
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'broker':
        return 'primary';
      case 'financier':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getTypeText = (type) => {
    switch (type) {
      case 'broker':
        return 'وسيط';
      case 'financier':
        return 'ممول';
      default:
        return type;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'broker':
        return <PersonIcon />;
      case 'financier':
        return <BankIcon />;
      default:
        return <PersonIcon />;
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (client.companyName && client.companyName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = typeFilter === 'all' || client.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          إدارة العملاء
        </Typography>
        <Typography variant="subtitle1" sx={{ color: 'text.secondary' }}>
          إدارة بيانات الوسطاء والممولين
        </Typography>
      </Box>

      {/* Filters and Actions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="بحث في العملاء..."
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
                <InputLabel>نوع العميل</InputLabel>
                <Select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  label="نوع العميل"
                >
                  <MenuItem value="all">جميع العملاء</MenuItem>
                  <MenuItem value="broker">وسطاء</MenuItem>
                  <MenuItem value="financier">ممولين</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={5} sx={{ textAlign: 'right' }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
                size="large"
                sx={{ borderRadius: 2 }}
              >
                إضافة عميل جديد
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>النوع</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>الاسم</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>الشركة</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>البريد الإلكتروني</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>الهاتف</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>العمليات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, index) => (
                  <TableRow key={index}>
                    {[...Array(6)].map((_, cellIndex) => (
                      <TableCell key={cellIndex}>
                        <Box sx={{ height: 20, bgcolor: 'action.hover', borderRadius: 1 }} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      لا توجد عملاء مطابقة للبحث
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => (
                  <TableRow 
                    key={client._id}
                    sx={{
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    <TableCell>
                      <Chip
                        icon={getTypeIcon(client.type)}
                        label={getTypeText(client.type)}
                        color={getTypeColor(client.type)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {client.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {client.companyName || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <EmailIcon sx={{ fontSize: 16, mr: 1, color: 'action.active' }} />
                        <Typography variant="body2">{client.email}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PhoneIcon sx={{ fontSize: 16, mr: 1, color: 'action.active' }} />
                        <Typography variant="body2">{client.phone}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="تعديل">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(client)}
                            sx={{ color: 'primary.main' }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="حذف">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedClient(client);
                              setDeleteDialog(true);
                            }}
                            sx={{ color: 'error.main' }}
                          >
                            <DeleteIcon fontSize="small" />
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
          count={total}
          page={page - 1}
          onPageChange={handleChangePage}
          rowsPerPage={limit}
          rowsPerPageOptions={[limit]}
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} من ${count}`
          }
          labelRowsPerPage="عدد الصفوف:"
        />
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editMode ? 'تعديل عميل' : 'إضافة عميل جديد'}
        </DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="name"
                  control={control}
                  rules={{ required: 'الاسم مطلوب' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="الاسم *"
                      error={!!errors.name}
                      helperText={errors.name?.message}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>نوع العميل *</InputLabel>
                      <Select {...field} label="نوع العميل *">
                        <MenuItem value="broker">وسيط</MenuItem>
                        <MenuItem value="financier">ممول</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Controller
                  name="email"
                  control={control}
                  rules={{ 
                    required: 'البريد الإلكتروني مطلوب',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'بريد إلكتروني غير صحيح'
                    }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="البريد الإلكتروني *"
                      type="email"
                      error={!!errors.email}
                      helperText={errors.email?.message}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Controller
                  name="phone"
                  control={control}
                  rules={{ required: 'رقم الهاتف مطلوب' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="رقم الهاتف *"
                      error={!!errors.phone}
                      helperText={errors.phone?.message}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Controller
                  name="companyName"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="اسم الشركة"
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Controller
                  name="bankAccount"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="رقم الحساب البنكي"
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Controller
                  name="address"
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
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>إلغاء</Button>
            <Button type="submit" variant="contained">
              {editMode ? 'تحديث' : 'إضافة'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>تأكيد الحذف</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            هل أنت متأكد من حذف العميل "{selectedClient?.name}"?
            هذه العملية لا يمكن التراجع عنها.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>إلغاء</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            حذف
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Clients;
