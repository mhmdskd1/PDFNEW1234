const express = require('express');
const { Invoice, DigitalInvoice, Client, Company } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');
const {
  authenticate,
  authorize
} = require('../middleware/auth');
const xl = require('excel4node');
const pdfService = require('../services/pdfService');

const router = express.Router();

// @route   GET /api/reports/unpaid-invoices
// @desc    Get unpaid invoices report
// @access  Private
router.get('/unpaid-invoices',
  authenticate,
  authorize('reports'),
  asyncHandler(async (req, res) => {
    const { format = 'json', clientId = '', companyId = '' } = req.query;
    
    // Build filter
    const pdfFilter = { paymentStatus: { $in: ['pending', 'partial'] } };
    const digitalFilter = { isPaid: false };
    
    if (clientId) {
      pdfFilter.client = clientId;
      digitalFilter['distribution.client'] = clientId;
    }
    if (companyId) {
      pdfFilter.company = companyId;
    }
    
    const [pdfInvoices, digitalInvoices] = await Promise.all([
      Invoice.find(pdfFilter)
        .populate('company', 'name contactInfo')
        .populate('client', 'name type')
        .sort({ dueDate: 1 }),
      DigitalInvoice.find(digitalFilter)
        .populate('distribution.client', 'name type')
        .sort({ issueDate: 1 })
    ]);
    
    const reportData = {
      pdfInvoices,
      digitalInvoices,
      summary: {
        totalPdfInvoices: pdfInvoices.length,
        totalDigitalInvoices: digitalInvoices.length,
        totalPdfAmount: pdfInvoices.reduce((sum, inv) => sum + inv.remainingAmount, 0),
        totalDigitalAmount: digitalInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
      },
      generatedAt: new Date()
    };
    
    if (format === 'excel') {
      // Generate Excel file
      const wb = new xl.Workbook();
      const ws = wb.addWorksheet('الفواتير غير المدفوعة');
      
      // Headers
      ws.cell(1, 1).string('رقم الفاتورة');
      ws.cell(1, 2).string('النوع');
      ws.cell(1, 3).string('العميل');
      ws.cell(1, 4).string('الشركة');
      ws.cell(1, 5).string('المبلغ');
      ws.cell(1, 6).string('تاريخ الإصدار');
      ws.cell(1, 7).string('حالة الدفع');
      
      let row = 2;
      
      // PDF Invoices
      pdfInvoices.forEach(invoice => {
        ws.cell(row, 1).string(invoice.invoiceNumber);
        ws.cell(row, 2).string('PDF');
        ws.cell(row, 3).string(invoice.client?.name || '');
        ws.cell(row, 4).string(invoice.company?.name || '');
        ws.cell(row, 5).number(invoice.remainingAmount);
        ws.cell(row, 6).string(invoice.issueDate.toLocaleDateString('ar'));
        ws.cell(row, 7).string(invoice.paymentStatus === 'pending' ? 'غير مدفوع' : 'جزئي');
        row++;
      });
      
      // Digital Invoices
      digitalInvoices.forEach(invoice => {
        ws.cell(row, 1).string(invoice.invoiceNumber);
        ws.cell(row, 2).string('رقمي');
        ws.cell(row, 3).string(invoice.distribution.map(d => d.name).join(', '));
        ws.cell(row, 4).string('-');
        ws.cell(row, 5).number(invoice.totalAmount);
        ws.cell(row, 6).string(invoice.issueDate.toLocaleDateString('ar'));
        ws.cell(row, 7).string('غير مدفوع');
        row++;
      });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="unpaid-invoices.xlsx"');
      wb.write('unpaid-invoices.xlsx', res);
    } else {
      res.json({
        success: true,
        data: reportData
      });
    }
  })
);

// @route   GET /api/reports/client-statement
// @desc    Get client statement report
// @access  Private
router.get('/client-statement/:clientId',
  authenticate,
  authorize('reports'),
  asyncHandler(async (req, res) => {
    const { clientId } = req.params;
    const { format = 'json', dateFrom = '', dateTo = '' } = req.query;
    
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'العميل غير موجود'
      });
    }
    
    // Build date filter
    const dateFilter = {};
    if (dateFrom) dateFilter.$gte = new Date(dateFrom);
    if (dateTo) dateFilter.$lte = new Date(dateTo);
    
    const pdfFilter = { client: clientId };
    const digitalFilter = { 'distribution.client': clientId };
    
    if (Object.keys(dateFilter).length > 0) {
      pdfFilter.issueDate = dateFilter;
      digitalFilter.issueDate = dateFilter;
    }
    
    const [pdfInvoices, digitalInvoices] = await Promise.all([
      Invoice.find(pdfFilter)
        .populate('company', 'name')
        .sort({ issueDate: -1 }),
      DigitalInvoice.find(digitalFilter)
        .sort({ issueDate: -1 })
    ]);
    
    const statement = {
      client: {
        id: client._id,
        name: client.name,
        type: client.type,
        email: client.email
      },
      period: {
        from: dateFrom || 'All time',
        to: dateTo || new Date().toISOString().split('T')[0]
      },
      pdfInvoices,
      digitalInvoices,
      summary: {
        totalPdfInvoices: pdfInvoices.length,
        totalDigitalInvoices: digitalInvoices.length,
        totalPdfAmount: pdfInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
        totalDigitalAmount: digitalInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
        paidPdfAmount: pdfInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0),
        paidDigitalAmount: digitalInvoices.filter(inv => inv.isPaid).reduce((sum, inv) => sum + inv.totalAmount, 0)
      },
      generatedAt: new Date()
    };
    
    if (format === 'pdf') {
      // Generate PDF report
      const htmlTemplate = `
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; direction: rtl; }
              .header { text-align: center; margin-bottom: 30px; }
              .client-info { background-color: #f5f5f5; padding: 15px; margin-bottom: 20px; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
              th { background-color: #f2f2f2; }
              .summary { background-color: #e7f3ff; padding: 15px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>بيان حساب العميل</h1>
            </div>
            <div class="client-info">
              <h3>بيانات العميل</h3>
              <p><strong>الاسم:</strong> ${client.name}</p>
              <p><strong>النوع:</strong> ${client.type === 'broker' ? 'وسيط' : 'ممول'}</p>
              <p><strong>الفترة:</strong> ${statement.period.from} - ${statement.period.to}</p>
            </div>
            <!-- Add table content here -->
            <div class="summary">
              <h3>ملخص الحساب</h3>
              <p>إجمالي الفواتير: ${statement.summary.totalPdfInvoices + statement.summary.totalDigitalInvoices}</p>
              <p>إجمالي المبلغ: €${(statement.summary.totalPdfAmount + statement.summary.totalDigitalAmount).toFixed(2)}</p>
            </div>
          </body>
        </html>
      `;
      
      const pdfBuffer = await pdfService.generateCustomPDF(htmlTemplate, '');
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="client-statement-${client.name}.pdf"`);
      res.send(pdfBuffer);
    } else {
      res.json({
        success: true,
        data: statement
      });
    }
  })
);

// @route   GET /api/reports/profit-report
// @desc    Get profit report
// @access  Private
router.get('/profit-report',
  authenticate,
  authorize('reports'),
  asyncHandler(async (req, res) => {
    const { dateFrom = '', dateTo = '', format = 'json' } = req.query;
    
    // Build date filter
    const dateFilter = {};
    if (dateFrom) dateFilter.$gte = new Date(dateFrom);
    if (dateTo) dateFilter.$lte = new Date(dateTo);
    
    const digitalFilter = { isPaid: true };
    if (Object.keys(dateFilter).length > 0) {
      digitalFilter.issueDate = dateFilter;
    }
    
    // Get profit data from digital invoices
    const profitData = await DigitalInvoice.aggregate([
      { $match: digitalFilter },
      { $unwind: '$distribution' },
      {
        $group: {
          _id: {
            type: '$distribution.type',
            name: '$distribution.name'
          },
          totalAmount: { $sum: '$distribution.amount' },
          invoiceCount: { $sum: 1 },
          averagePercentage: { $avg: '$distribution.percentage' }
        }
      },
      { $sort: { '_id.type': 1, totalAmount: -1 } }
    ]);
    
    const ourProfit = profitData.filter(item => item._id.type === 'us');
    const brokerProfits = profitData.filter(item => item._id.type !== 'us');
    
    const report = {
      period: {
        from: dateFrom || 'All time',
        to: dateTo || new Date().toISOString().split('T')[0]
      },
      ourProfit: {
        totalAmount: ourProfit.reduce((sum, item) => sum + item.totalAmount, 0),
        invoiceCount: ourProfit.reduce((sum, item) => sum + item.invoiceCount, 0)
      },
      brokerProfits,
      totalDistributed: profitData.reduce((sum, item) => sum + item.totalAmount, 0),
      generatedAt: new Date()
    };
    
    res.json({
      success: true,
      data: report
    });
  })
);

module.exports = router;