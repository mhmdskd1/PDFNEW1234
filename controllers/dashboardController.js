const { 
  Invoice, 
  DigitalInvoice, 
  Client, 
  Company, 
  PaymentCompany, 
  Account, 
  User 
} = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');
const mongoose = require('mongoose');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = asyncHandler(async (req, res) => {
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfYear = new Date(today.getFullYear(), 0, 1);

  // Get basic counts
  const [totalInvoices, unpaidInvoices, partiallyPaidInvoices, todayInvoices] = await Promise.all([
    // Total invoices (PDF + Digital)
    Promise.all([
      Invoice.countDocuments(),
      DigitalInvoice.countDocuments()
    ]).then(([pdf, digital]) => pdf + digital),
    
    // Unpaid invoices
    Promise.all([
      Invoice.countDocuments({ paymentStatus: 'pending' }),
      DigitalInvoice.countDocuments({ isPaid: false })
    ]).then(([pdf, digital]) => pdf + digital),
    
    // Partially paid invoices (PDF only)
    Invoice.countDocuments({ paymentStatus: 'partial' }),
    
    // Today's invoices
    Promise.all([
      Invoice.countDocuments({ issueDate: { $gte: startOfToday } }),
      DigitalInvoice.countDocuments({ issueDate: { $gte: startOfToday } })
    ]).then(([pdf, digital]) => pdf + digital)
  ]);

  // Get financial summary
  const [pdfFinancials, digitalFinancials] = await Promise.all([
    // PDF Invoices financials
    Invoice.aggregate([
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$totalAmount' },
          paidAmount: { $sum: '$paidAmount' },
          pendingAmount: {
            $sum: {
              $cond: [
                { $eq: ['$paymentStatus', 'pending'] },
                '$totalAmount',
                0
              ]
            }
          },
          partialAmount: {
            $sum: {
              $cond: [
                { $eq: ['$paymentStatus', 'partial'] },
                { $subtract: ['$totalAmount', '$paidAmount'] },
                0
              ]
            }
          }
        }
      }
    ]),
    
    // Digital Invoices financials
    DigitalInvoice.aggregate([
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$totalAmount' },
          paidAmount: {
            $sum: {
              $cond: [
                { $eq: ['$isPaid', true] },
                '$totalAmount',
                0
              ]
            }
          },
          pendingAmount: {
            $sum: {
              $cond: [
                { $eq: ['$isPaid', false] },
                '$totalAmount',
                0
              ]
            }
          }
        }
      }
    ])
  ]);

  const pdfStats = pdfFinancials[0] || { totalAmount: 0, paidAmount: 0, pendingAmount: 0, partialAmount: 0 };
  const digitalStats = digitalFinancials[0] || { totalAmount: 0, paidAmount: 0, pendingAmount: 0 };

  // Combined financial stats
  const financialStats = {
    totalAmount: pdfStats.totalAmount + digitalStats.totalAmount,
    paidAmount: pdfStats.paidAmount + digitalStats.paidAmount,
    pendingAmount: pdfStats.pendingAmount + digitalStats.pendingAmount + (pdfStats.partialAmount || 0),
    partialAmount: pdfStats.partialAmount || 0
  };

  // Get recent invoices (last 10)
  const [recentPdfInvoices, recentDigitalInvoices] = await Promise.all([
    Invoice.find()
      .populate('company', 'name')
      .populate('client', 'name type')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('invoiceNumber totalAmount paymentStatus issueDate company client createdAt'),
    
    DigitalInvoice.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('invoiceNumber totalAmount isPaid issueDate description createdAt')
  ]);

  // Combine and sort recent invoices
  const allRecentInvoices = [
    ...recentPdfInvoices.map(inv => ({
      id: inv._id,
      invoiceNumber: inv.invoiceNumber,
      totalAmount: inv.totalAmount,
      status: inv.paymentStatus,
      issueDate: inv.issueDate,
      type: 'pdf',
      company: inv.company?.name,
      client: inv.client?.name,
      createdAt: inv.createdAt
    })),
    ...recentDigitalInvoices.map(inv => ({
      id: inv._id,
      invoiceNumber: inv.invoiceNumber,
      totalAmount: inv.totalAmount,
      status: inv.isPaid ? 'paid' : 'pending',
      issueDate: inv.issueDate,
      type: 'digital',
      description: inv.description,
      createdAt: inv.createdAt
    }))
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10);

  // Get accounts balance summary
  const balanceSummary = await Account.getBalanceSummary();

  // Monthly statistics for charts
  const monthlyStats = await getMonthlyStats(startOfYear);

  res.json({
    success: true,
    data: {
      overview: {
        totalInvoices,
        unpaidInvoices,
        partiallyPaidInvoices,
        todayInvoices
      },
      financial: financialStats,
      accounts: balanceSummary,
      recentInvoices: allRecentInvoices,
      monthlyStats
    }
  });
});

// Helper function to get monthly statistics
const getMonthlyStats = async (startOfYear) => {
  const monthlyData = await Promise.all([
    // PDF Invoices monthly stats
    Invoice.aggregate([
      {
        $match: {
          issueDate: { $gte: startOfYear }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$issueDate' },
            month: { $month: '$issueDate' }
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          paidAmount: { $sum: '$paidAmount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]),
    
    // Digital Invoices monthly stats
    DigitalInvoice.aggregate([
      {
        $match: {
          issueDate: { $gte: startOfYear }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$issueDate' },
            month: { $month: '$issueDate' }
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          paidAmount: {
            $sum: {
              $cond: [
                { $eq: ['$isPaid', true] },
                '$totalAmount',
                0
              ]
            }
          }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ])
  ]);

  // Combine and format monthly data
  const monthMap = new Map();
  
  [...monthlyData[0], ...monthlyData[1]].forEach(item => {
    const key = `${item._id.year}-${item._id.month}`;
    if (monthMap.has(key)) {
      const existing = monthMap.get(key);
      monthMap.set(key, {
        month: item._id.month,
        year: item._id.year,
        count: existing.count + item.count,
        totalAmount: existing.totalAmount + item.totalAmount,
        paidAmount: existing.paidAmount + item.paidAmount
      });
    } else {
      monthMap.set(key, {
        month: item._id.month,
        year: item._id.year,
        count: item.count,
        totalAmount: item.totalAmount,
        paidAmount: item.paidAmount
      });
    }
  });

  return Array.from(monthMap.values()).sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });
};

// @desc    Get quick actions data
// @route   GET /api/dashboard/quick-actions
// @access  Private
const getQuickActions = asyncHandler(async (req, res) => {
  const [clientsCount, companiesCount, paymentCompaniesCount, templatesCount] = await Promise.all([
    Client.countDocuments({ isActive: true }),
    Company.countDocuments({ isActive: true }),
    PaymentCompany.countDocuments({ isActive: true }),
    // Template count would be added when Template model is available
    0
  ]);

  const actions = [
    {
      title: 'إنشاء فاتورة PDF',
      description: 'إنشاء فاتورة جديدة بصيغة PDF',
      icon: 'FileText',
      color: 'blue',
      link: '/invoices/create',
      available: clientsCount > 0 && companiesCount > 0 && paymentCompaniesCount > 0
    },
    {
      title: 'إنشاء فاتورة رقمية',
      description: 'إنشاء فاتورة رقمية للحسابات',
      icon: 'Calculator',
      color: 'green',
      link: '/digital-invoices/create',
      available: clientsCount > 0
    },
    {
      title: 'إضافة عميل',
      description: 'إضافة عميل جديد (وسيط أو ممول)',
      icon: 'UserPlus',
      color: 'purple',
      link: '/clients/add'
    },
    {
      title: 'إضافة شركة',
      description: 'إضافة شركة مستلمة جديدة',
      icon: 'Building',
      color: 'orange',
      link: '/companies/add'
    },
    {
      title: 'عرض الفواتير',
      description: 'عرض جميع الفواتير وإدارتها',
      icon: 'List',
      color: 'indigo',
      link: '/invoices'
    },
    {
      title: 'التقارير',
      description: 'عرض التقارير والإحصائيات',
      icon: 'BarChart',
      color: 'teal',
      link: '/reports'
    }
  ];

  res.json({
    success: true,
    data: {
      actions,
      systemInfo: {
        clients: clientsCount,
        companies: companiesCount,
        paymentCompanies: paymentCompaniesCount,
        templates: templatesCount
      }
    }
  });
});

// @desc    Get pending payments
// @route   GET /api/dashboard/pending-payments
// @access  Private
const getPendingPayments = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const [pendingPdfInvoices, pendingDigitalInvoices] = await Promise.all([
    Invoice.find({ 
      paymentStatus: { $in: ['pending', 'partial'] }
    })
      .populate('company', 'name contactInfo')
      .populate('client', 'name type')
      .sort({ dueDate: 1 })
      .limit(parseInt(limit))
      .select('invoiceNumber totalAmount paidAmount remainingAmount paymentStatus dueDate company client'),
    
    DigitalInvoice.find({ isPaid: false })
      .sort({ issueDate: 1 })
      .limit(parseInt(limit))
      .select('invoiceNumber totalAmount description issueDate')
  ]);

  const pendingPayments = [
    ...pendingPdfInvoices.map(inv => ({
      id: inv._id,
      invoiceNumber: inv.invoiceNumber,
      totalAmount: inv.totalAmount,
      paidAmount: inv.paidAmount || 0,
      remainingAmount: inv.remainingAmount,
      status: inv.paymentStatus,
      dueDate: inv.dueDate,
      type: 'pdf',
      company: inv.company?.name,
      client: inv.client?.name,
      overdue: new Date(inv.dueDate) < new Date()
    })),
    ...pendingDigitalInvoices.map(inv => ({
      id: inv._id,
      invoiceNumber: inv.invoiceNumber,
      totalAmount: inv.totalAmount,
      paidAmount: 0,
      remainingAmount: inv.totalAmount,
      status: 'pending',
      dueDate: inv.issueDate,
      type: 'digital',
      description: inv.description,
      overdue: false // Digital invoices don't have due dates
    }))
  ].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  res.json({
    success: true,
    data: {
      pendingPayments: pendingPayments.slice(0, parseInt(limit))
    }
  });
});

module.exports = {
  getDashboardStats,
  getQuickActions,
  getPendingPayments
};