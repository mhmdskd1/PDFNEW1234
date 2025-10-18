import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Paper,
  useTheme,
  Skeleton,
} from '@mui/material';
import {
  TrendingUp,
  Receipt,
  MonetizationOn,
  PendingActions,
  Today,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { fetchDashboardData } from '../../store/slices/dashboardSlice';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { stats, recentInvoices, monthlyRevenue, loading, error } = useSelector(
    state => state.dashboard
  );

  useEffect(() => {
    dispatch(fetchDashboardData());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

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

  const statsCards = [
    {
      title: 'إجمالي الفواتير',
      value: stats.totalInvoices,
      icon: <Receipt />,
      color: theme.palette.primary.main,
      bgColor: `${theme.palette.primary.main}15`,
    },
    {
      title: 'الفواتير غير المدفوعة',
      value: stats.unpaidInvoices,
      icon: <PendingActions />,
      color: theme.palette.warning.main,
      bgColor: `${theme.palette.warning.main}15`,
    },
    {
      title: 'فواتير اليوم',
      value: stats.todayInvoices,
      icon: <Today />,
      color: theme.palette.info.main,
      bgColor: `${theme.palette.info.main}15`,
    },
    {
      title: 'إجمالي الإيرادات',
      value: formatCurrency(stats.totalRevenue),
      icon: <MonetizationOn />,
      color: theme.palette.success.main,
      bgColor: `${theme.palette.success.main}15`,
    },
  ];

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

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
          الصفحة الرئيسية
        </Typography>
        <Grid container spacing={3}>
          {[...Array(4)].map((_, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card>
                <CardContent>
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="40%" height={40} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
          الصفحة الرئيسية
        </Typography>
        <Typography variant="subtitle1" sx={{ color: theme.palette.text.secondary, mt: 1 }}>
          نظرة عامة على النشاط والإحصائيات الرئيسية
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statsCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                height: '100%',
                background: `linear-gradient(135deg, ${card.bgColor} 0%, ${card.color}10 100%)`,
                border: `1px solid ${card.color}20`,
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 8px 25px ${card.color}25`,
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 'bold',
                        color: card.color,
                        mb: 1,
                      }}
                    >
                      {card.value}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.text.secondary,
                        fontWeight: 500,
                      }}
                    >
                      {card.title}
                    </Typography>
                  </Box>
                  <Box
                    sx={
                      {
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        backgroundColor: card.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                      }
                    }
                  >
                    {React.cloneElement(card.icon, { fontSize: 'large' })}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Monthly Revenue Chart */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: 400 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
                الإيرادات الشهرية
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis 
                    dataKey="month" 
                    stroke={theme.palette.text.secondary}
                    fontSize={12}
                  />
                  <YAxis 
                    stroke={theme.palette.text.secondary}
                    fontSize={12}
                    tickFormatter={formatCurrency}
                  />
                  <Tooltip 
                    formatter={[formatCurrency, 'الإيرادات']}
                    labelStyle={{ color: theme.palette.text.primary }}
                    contentStyle={{ 
                      backgroundColor: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 8
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke={theme.palette.primary.main}
                    strokeWidth={3}
                    dot={{ fill: theme.palette.primary.main, strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8, stroke: theme.palette.primary.main, strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Invoices */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: 400 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  آخر 10 فواتير
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => navigate('/pdf-invoices')}
                  sx={{ color: theme.palette.primary.main }}
                >
                  <ViewIcon />
                </IconButton>
              </Box>
              
              <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                {recentInvoices.length > 0 ? (
                  recentInvoices.map((invoice, index) => (
                    <ListItem
                      key={invoice._id}
                      sx={{
                        borderRadius: 2,
                        mb: 1,
                        backgroundColor: index % 2 === 0 ? theme.palette.action.hover : 'transparent',
                        '&:hover': {
                          backgroundColor: theme.palette.action.selected,
                        },
                      }}
                    >
                      <ListItemText
                        primary={
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {invoice.invoiceNumber}
                          </Typography>
                        }
                        secondary={
                          <Box>
                            <Typography variant="caption" sx={{ display: 'block' }}>
                              {invoice.client?.name || 'غير محدد'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                              {formatDate(invoice.createdAt)}
                            </Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                            {formatCurrency(invoice.totalAmount)}
                          </Typography>
                          <Chip
                            label={getStatusText(invoice.status)}
                            color={getStatusColor(invoice.status)}
                            size="small"
                          />
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText
                      primary="لا توجد فواتير حديثة"
                      sx={{ textAlign: 'center', color: theme.palette.text.secondary }}
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
