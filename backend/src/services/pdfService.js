const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');

class PdfService {
  

  async generatePdf(templateName, data) {
    let browser;
    try {
      const templatePath = path.join(__dirname, '../templates', `${templateName}.html`);
      const templateHtml = fs.readFileSync(templatePath, 'utf8');
      
      
      handlebars.registerHelper('formatCurrency', (value) => {
        return Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      });

      
      const template = handlebars.compile(templateHtml);
      const finalHtml = template(data);

      
      browser = await puppeteer.launch({
        headless: 'new', 
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      
      const page = await browser.newPage();
      
      
      await page.setContent(finalHtml, { waitUntil: 'networkidle0' });
      
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm',
        },
      });
      
      return pdfBuffer;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}

module.exports = new PdfService();
