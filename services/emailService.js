const nodemailer = require('nodemailer');
const { Setting } = require('../models');

class EmailService {
  constructor() {
    this.transporter = null;
  }

  async initializeTransporter() {
    const emailSettings = await Setting.getByCategory('email', true);
    
    if (!emailSettings.smtp || !emailSettings.smtp.user) {
      throw new Error('إعدادات البريد الإلكتروني غير مكتملة');
    }

    this.transporter = nodemailer.createTransporter({
      host: emailSettings.smtp.host,
      port: emailSettings.smtp.port,
      secure: emailSettings.smtp.port === 465,
      auth: {
        user: emailSettings.smtp.user,
        pass: emailSettings.smtp.password
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    this.fromEmail = emailSettings.from.address;
    this.fromName = emailSettings.from.name;
  }

  async sendEmail({ to, subject, html, text, attachments = [] }) {
    try {
      if (!this.transporter) {
        await this.initializeTransporter();
      }

      const mailOptions = {
        from: `${this.fromName} <${this.fromEmail}>`,
        to,
        subject,
        html,
        text,
        attachments
      };

      const result = await this.transporter.sendMail(mailOptions);
      return {
        success: true,
        messageId: result.messageId,
        message: 'تم إرسال البريد بنجاح'
      };
    } catch (error) {
      console.error('خطأ في إرسال البريد:', error);
      return {
        success: false,
        error: error.message,
        message: 'فشل في إرسال البريد'
      };
    }
  }

  async sendInvoiceEmail(invoice, pdfPath) {
    const emailTemplate = this.getInvoiceEmailTemplate(invoice);
    
    return await this.sendEmail({
      to: invoice.company.contactInfo.email,
      subject: `فاتورة رقم ${invoice.invoiceNumber}`,
      html: emailTemplate.html,
      text: emailTemplate.text,
      attachments: [{
        filename: `invoice-${invoice.invoiceNumber}.pdf`,
        path: pdfPath,
        contentType: 'application/pdf'
      }]
    });
  }

  getInvoiceEmailTemplate(invoice) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center;">
          <h1>فاتورة جديدة</h1>
        </div>
        
        <div style="padding: 20px; background-color: #f8fafc;">
          <h2>عزيزي ${invoice.company.name}</h2>
          
          <p>نتقدم بفاتورة جديدة بالتفاصيل التالية:</p>
          
          <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p><strong>رقم الفاتورة:</strong> ${invoice.invoiceNumber}</p>
            <p><strong>تاريخ الإصدار:</strong> ${new Date(invoice.issueDate).toLocaleDateString('ar')}</p>
            <p><strong>تاريخ الاستحقاق:</strong> ${new Date(invoice.dueDate).toLocaleDateString('ar')}</p>
            <p><strong>المبلغ الإجمالي:</strong> €${invoice.totalAmount.toFixed(2)}</p>
          </div>
          
          <p>يرجى مراجعة الفاتورة المرفقة وتنفيذ الدفع في الموعد المحدد.</p>
          
          <p>شكراً لتعاملكم معنا.</p>
        </div>
        
        <div style="background-color: #374151; color: white; padding: 15px; text-align: center; font-size: 12px;">
          <p>هذه رسالة تلقائية من نظام إدارة الفواتير</p>
        </div>
      </div>
    `;

    const text = `
      فاتورة جديدة
      
      عزيزي ${invoice.company.name}
      
      نتقدم بفاتورة جديدة:
      
      رقم الفاتورة: ${invoice.invoiceNumber}
      تاريخ الإصدار: ${new Date(invoice.issueDate).toLocaleDateString('ar')}
      تاريخ الاستحقاق: ${new Date(invoice.dueDate).toLocaleDateString('ar')}
      المبلغ الإجمالي: €${invoice.totalAmount.toFixed(2)}
      
      يرجى مراجعة الفاتورة المرفقة.
      
      شكراً لتعاملكم معنا.
    `;

    return { html, text };
  }

  async testConnection() {
    try {
      if (!this.transporter) {
        await this.initializeTransporter();
      }
      
      await this.transporter.verify();
      return {
        success: true,
        message: 'تم الاتصال بخادم البريد بنجاح'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'فشل في الاتصال بخادم البريد'
      };
    }
  }
}

module.exports = new EmailService();