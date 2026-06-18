const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
  }

  async initTransporter() {
    let user = process.env.SMTP_USER;
    let pass = process.env.SMTP_PASS;

    if (user === 'test_user' || !user) {
      console.log('Generating Ethereal test account...');
      const testAccount = await nodemailer.createTestAccount();
      user = testAccount.user;
      pass = testAccount.pass;
      console.log(`Test account created: ${user}`);
    }

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: process.env.SMTP_PORT || 587,
      auth: { user, pass },
    });
  }

  

  async sendEmail({ to, subject, html, attachments = [] }) {
    if (!this.transporter) {
      await this.initTransporter();
    }
    
    try {
      const info = await this.transporter.sendMail({
        from: `"${process.env.APP_NAME || 'Billify CRM'}" <${process.env.SMTP_FROM || 'noreply@billify-crm.local'}>`,
        to,
        subject,
        html,
        attachments,
      });
      
      console.log('Message sent: %s', info.messageId);
      
      
      if (process.env.SMTP_HOST === 'smtp.ethereal.email') {
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
      }
      
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }
}

module.exports = new EmailService();
