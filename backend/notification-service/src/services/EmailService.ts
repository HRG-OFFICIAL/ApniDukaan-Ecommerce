import nodemailer from 'nodemailer';
import { logger } from '@apnidukaan/shared';

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface EmailData {
  to: string | string[];
  template: EmailTemplate;
  data?: Record<string, any>;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@apnidukaan.com',
        to: Array.isArray(emailData.to) ? emailData.to.join(', ') : emailData.to,
        subject: emailData.template.subject,
        html: emailData.template.html,
        text: emailData.template.text,
        attachments: emailData.attachments
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      logger.info('Email sent successfully', {
        messageId: result.messageId,
        to: emailData.to,
        subject: emailData.template.subject,
        action: 'email_sent'
      });

      return true;
    } catch (error: any) {
      logger.error('Failed to send email', {
        error: error.message,
        to: emailData.to,
        subject: emailData.template.subject,
        action: 'email_send_failed'
      });
      return false;
    }
  }

  // Email templates
  getWelcomeEmailTemplate(userName: string): EmailTemplate {
    return {
      subject: 'Welcome to ApniDukaan!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Welcome to ApniDukaan!</h1>
          <p>Hello ${userName},</p>
          <p>Thank you for joining ApniDukaan! We're excited to have you on board.</p>
          <p>Start exploring our amazing products and enjoy a seamless shopping experience.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Start Shopping</a>
          </div>
          <p>Best regards,<br>The ApniDukaan Team</p>
        </div>
      `,
      text: `Welcome to ApniDukaan! Hello ${userName}, Thank you for joining ApniDukaan! We're excited to have you on board. Start exploring our amazing products and enjoy a seamless shopping experience. Visit ${process.env.FRONTEND_URL} to start shopping. Best regards, The ApniDukaan Team`
    };
  }

  getOrderConfirmationTemplate(orderData: any): EmailTemplate {
    return {
      subject: `Order Confirmation - #${orderData.orderNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Order Confirmation</h1>
          <p>Hello ${orderData.customerName},</p>
          <p>Thank you for your order! We've received your order and it's being processed.</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Order Details</h3>
            <p><strong>Order Number:</strong> #${orderData.orderNumber}</p>
            <p><strong>Order Date:</strong> ${new Date(orderData.createdAt).toLocaleDateString()}</p>
            <p><strong>Total Amount:</strong> ₹${orderData.total}</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/orders/${orderData._id}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Track Your Order</a>
          </div>
          
          <p>We'll send you another email when your order ships.</p>
          <p>Best regards,<br>The ApniDukaan Team</p>
        </div>
      `,
      text: `Order Confirmation - #${orderData.orderNumber}. Hello ${orderData.customerName}, Thank you for your order! Order Number: #${orderData.orderNumber}, Order Date: ${new Date(orderData.createdAt).toLocaleDateString()}, Total Amount: ₹${orderData.total}. Track your order at ${process.env.FRONTEND_URL}/orders/${orderData._id}. Best regards, The ApniDukaan Team`
    };
  }

  getPasswordResetTemplate(resetToken: string, userName: string): EmailTemplate {
    const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;
    
    return {
      subject: 'Password Reset Request - ApniDukaan',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Password Reset Request</h1>
          <p>Hello ${userName},</p>
          <p>We received a request to reset your password for your ApniDukaan account.</p>
          <p>Click the button below to reset your password:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Reset Password</a>
          </div>
          
          <p>This link will expire in 1 hour for security reasons.</p>
          <p>If you didn't request this password reset, please ignore this email.</p>
          <p>Best regards,<br>The ApniDukaan Team</p>
        </div>
      `,
      text: `Password Reset Request - ApniDukaan. Hello ${userName}, We received a request to reset your password. Click here to reset: ${resetUrl}. This link expires in 1 hour. If you didn't request this, please ignore this email. Best regards, The ApniDukaan Team`
    };
  }
}

export default EmailService;
