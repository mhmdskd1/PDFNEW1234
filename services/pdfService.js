const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const handlebars = require('handlebars');
const { Template } = require('../models');

class PDFService {
  constructor() {
    this.browser = null;
  }

  async initializeBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      });
    }
    return this.browser;
  }

  async generateInvoicePDF(invoice, templateId) {
    try {
      const browser = await this.initializeBrowser();
      const page = await browser.newPage();

      // Get template
      const template = await Template.findById(templateId);
      if (!template) {
        throw new Error('القالب غير موجود');
      }

      // Prepare template data
      const templateData = this.prepareInvoiceData(invoice);
      
      // Compile template
      const compiledTemplate = handlebars.compile(template.htmlTemplate);
      const html = compiledTemplate(templateData);

      // Set content
      await page.setContent(html, {
        waitUntil: 'networkidle0'
      });

      // Add CSS
      await page.addStyleTag({
        content: template.cssStyles
      });

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: template.layout.pageSize || 'A4',
        orientation: template.layout.orientation || 'portrait',
        margin: {
          top: `${template.layout.margins.top || 50}px`,
          bottom: `${template.layout.margins.bottom || 50}px`,
          left: `${template.layout.margins.left || 50}px`,
          right: `${template.layout.margins.right || 50}px`
        },
        printBackground: true,
        preferCSSPageSize: true
      });

      // Save PDF file
      const outputDir = process.env.PDF_OUTPUT_PATH || './uploads/invoices';
      await this.ensureDirectoryExists(outputDir);
      
      const filename = `invoice-${invoice.invoiceNumber}-${Date.now()}.pdf`;
      const filepath = path.join(outputDir, filename);
      
      await fs.writeFile(filepath, pdfBuffer);

      // Update template usage
      await template.recordUsage();

      await page.close();

      return {
        success: true,
        filepath,
        filename,
        fileSize: pdfBuffer.length,
        message: 'تم إنشاء ملف PDF بنجاح'
      };
    } catch (error) {
      console.error('خطأ في إنشاء PDF:', error);
      throw new Error(`فشل في إنشاء PDF: ${error.message}`);
    }
  }

  prepareInvoiceData(invoice) {
    return {
      invoice: {
        number: invoice.invoiceNumber,
        issueDate: new Date(invoice.issueDate).toLocaleDateString('nl-NL'),
        dueDate: new Date(invoice.dueDate).toLocaleDateString('nl-NL'),
        subtotal: invoice.subtotal.toFixed(2),
        vatAmount: invoice.vatAmount.toFixed(2),
        totalAmount: invoice.totalAmount.toFixed(2),
        currency: invoice.currency,
        items: invoice.items.map(item => ({
          ...item,
          unitPrice: item.unitPrice.toFixed(2),
          totalPrice: item.totalPrice.toFixed(2)
        })),
        notes: invoice.notes
      },
      company: {
        name: invoice.company.name,
        address: {
          street: invoice.company.address.street,
          city: invoice.company.address.city,
          postalCode: invoice.company.address.postalCode,
          country: invoice.company.address.country
        },
        contact: {
          email: invoice.company.contactInfo.email,
          phone: invoice.company.contactInfo.phone
        },
        business: {
          btwNumber: invoice.company.businessInfo.btwNumber,
          kvkNumber: invoice.company.businessInfo.kvkNumber
        }
      },
      client: {
        name: invoice.client.name,
        email: invoice.client.email,
        phone: invoice.client.phone,
        address: invoice.client.address,
        business: invoice.client.businessInfo
      },
      paymentCompany: {
        name: invoice.paymentCompany.name,
        iban: invoice.paymentCompany.defaultIban
      },
      logo: invoice.logo ? {
        path: invoice.logo.path,
        width: invoice.logo.width,
        height: invoice.logo.height,
        position: invoice.logo.position
      } : null,
      currentDate: new Date().toLocaleDateString('nl-NL'),
      helpers: {
        formatCurrency: (amount) => `€${parseFloat(amount).toFixed(2)}`,
        formatDate: (date) => new Date(date).toLocaleDateString('nl-NL')
      }
    };
  }

  async generateCustomPDF(htmlContent, cssContent, options = {}) {
    try {
      const browser = await this.initializeBrowser();
      const page = await browser.newPage();

      await page.setContent(htmlContent, {
        waitUntil: 'networkidle0'
      });

      if (cssContent) {
        await page.addStyleTag({
          content: cssContent
        });
      }

      const pdfOptions = {
        format: options.pageSize || 'A4',
        orientation: options.orientation || 'portrait',
        margin: options.margins || {
          top: '50px',
          bottom: '50px',
          left: '50px',
          right: '50px'
        },
        printBackground: true,
        preferCSSPageSize: true,
        ...options
      };

      const pdfBuffer = await page.pdf(pdfOptions);
      await page.close();

      return pdfBuffer;
    } catch (error) {
      console.error('خطأ في إنشاء PDF مخصص:', error);
      throw new Error(`فشل في إنشاء PDF: ${error.message}`);
    }
  }

  async ensureDirectoryExists(dirPath) {
    try {
      await fs.access(dirPath);
    } catch (error) {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  // Cleanup on process exit
  async cleanup() {
    await this.closeBrowser();
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  await pdfService.cleanup();
});

process.on('SIGINT', async () => {
  await pdfService.cleanup();
});

const pdfService = new PDFService();
module.exports = pdfService;