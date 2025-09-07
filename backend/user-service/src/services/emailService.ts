import nodemailer from 'nodemailer';
import { logger } from '@shopsphere/shared';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

class EmailService {
  private transporter: nodemailer.Transporter;
  private fromEmail: string;
  private frontendUrl: string;

  constructor() {
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@shopsphere.com';
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    this.initializeTransporter();
  }

  private initializeTransporter() {
    // Use different email providers based on environment
    if (process.env.NODE_ENV === 'production') {
      // Production: Use SendGrid or similar service
      this.transporter = nodemailer.createTransporter({
        service: 'SendGrid',
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_API_KEY
        }
      });
    } else if (process.env.SMTP_HOST) {
      // Custom SMTP configuration
      const config: EmailConfig = {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASS || ''
        }
      };
      this.transporter = nodemailer.createTransporter(config);
    } else {
      // Development: Use Ethereal Email for testing
      this.createTestAccount();
    }
  }

  private async createTestAccount() {
    try {
      const testAccount = await nodemailer.createTestAccount();
      
      this.transporter = nodemailer.createTransporter({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });

      logger.info('Test email account created', {
        user: testAccount.user,
        pass: testAccount.pass,
        action: 'email_setup'
      });
    } catch (error) {
      logger.error('Failed to create test email account', {
        error: error.message,
        action: 'email_setup'
      });
    }
  }

  async sendVerificationEmail(email: string, firstName: string, token: string): Promise<boolean> {
    try {
      const verificationUrl = `${this.frontendUrl}/verify-email?token=${token}`;
      
      const mailOptions = {
        from: this.fromEmail,
        to: email,
        subject: 'Verify Your ShopSphere Account',
        html: this.getVerificationEmailTemplate(firstName, verificationUrl)
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      logger.info('Verification email sent successfully', {
        email,
        messageId: info.messageId,
        previewUrl: nodemailer.getTestMessageUrl(info),
        action: 'send_verification_email'
      });

      return true;
    } catch (error) {
      logger.error('Failed to send verification email', {
        email,
        error: error.message,
        action: 'send_verification_email'
      });
      return false;
    }
  }

  async sendPasswordResetEmail(email: string, firstName: string, token: string): Promise<boolean> {
    try {
      const resetUrl = `${this.frontendUrl}/reset-password?token=${token}`;
      
      const mailOptions = {
        from: this.fromEmail,
        to: email,
        subject: 'Reset Your ShopSphere Password',
        html: this.getPasswordResetEmailTemplate(firstName, resetUrl)
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      logger.info('Password reset email sent successfully', {
        email,
        messageId: info.messageId,
        previewUrl: nodemailer.getTestMessageUrl(info),
        action: 'send_password_reset_email'
      });

      return true;
    } catch (error) {
      logger.error('Failed to send password reset email', {
        email,
        error: error.message,
        action: 'send_password_reset_email'
      });
      return false;
    }
  }

  async sendWelcomeEmail(email: string, firstName: string): Promise<boolean> {
    try {
      const mailOptions = {
        from: this.fromEmail,
        to: email,
        subject: 'Welcome to ShopSphere!',
        html: this.getWelcomeEmailTemplate(firstName)
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      logger.info('Welcome email sent successfully', {
        email,
        messageId: info.messageId,
        previewUrl: nodemailer.getTestMessageUrl(info),
        action: 'send_welcome_email'
      });

      return true;
    } catch (error) {
      logger.error('Failed to send welcome email', {
        email,
        error: error.message,
        action: 'send_welcome_email'
      });
      return false;
    }
  }

  private getVerificationEmailTemplate(firstName: string, verificationUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4f46e5; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; }
          .button { 
            display: inline-block; 
            background: #4f46e5; 
            color: white; 
            padding: 12px 30px; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0; 
          }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🛍️ ShopSphere</h1>
          </div>
          <div class="content">
            <h2>Hi ${firstName}!</h2>
            <p>Welcome to ShopSphere! We're excited to have you join our community.</p>
            <p>To complete your registration and start shopping, please verify your email address by clicking the button below:</p>
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </div>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #4f46e5;">${verificationUrl}</p>
            <p><strong>This link will expire in 24 hours.</strong></p>
            <p>If you didn't create an account with ShopSphere, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>© 2024 ShopSphere. All rights reserved.</p>
            <p>This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getPasswordResetEmailTemplate(firstName: string, resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; }
          .button { 
            display: inline-block; 
            background: #dc2626; 
            color: white; 
            padding: 12px 30px; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0; 
          }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
          .warning { background: #fef3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🛍️ ShopSphere</h1>
          </div>
          <div class="content">
            <h2>Hi ${firstName}!</h2>
            <p>We received a request to reset your password for your ShopSphere account.</p>
            <p>Click the button below to create a new password:</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #dc2626;">${resetUrl}</p>
            <div class="warning">
              <strong>⚠️ Important:</strong>
              <ul>
                <li>This link will expire in 1 hour for security reasons</li>
                <li>If you didn't request this reset, please ignore this email</li>
                <li>Your password won't change until you create a new one</li>
              </ul>
            </div>
            <p>If you continue to have problems, please contact our support team.</p>
          </div>
          <div class="footer">
            <p>© 2024 ShopSphere. All rights reserved.</p>
            <p>This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getWelcomeEmailTemplate(firstName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to ShopSphere</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; }
          .button { 
            display: inline-block; 
            background: #10b981; 
            color: white; 
            padding: 12px 30px; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0; 
          }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
          .features { background: #f0fdf4; padding: 20px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🛍️ Welcome to ShopSphere!</h1>
          </div>
          <div class="content">
            <h2>Hi ${firstName}!</h2>
            <p>🎉 Congratulations! Your email has been verified and your ShopSphere account is now active.</p>
            <p>You're now part of our amazing shopping community with access to:</p>
            <div class="features">
              <ul>
                <li>🛒 <strong>Thousands of products</strong> at great prices</li>
                <li>⚡ <strong>Fast shipping</strong> and easy returns</li>
                <li>💳 <strong>Secure payments</strong> with multiple options</li>
                <li>⭐ <strong>Customer reviews</strong> to help you decide</li>
                <li>🎯 <strong>Personalized recommendations</strong> just for you</li>
                <li>📱 <strong>Mobile-friendly</strong> shopping experience</li>
              </ul>
            </div>
            <div style="text-align: center;">
              <a href="${this.frontendUrl}" class="button">Start Shopping Now</a>
            </div>
            <p>Need help getting started? Check out our <a href="${this.frontendUrl}/help">Help Center</a> or contact our friendly support team.</p>
            <p>Happy shopping!</p>
            <p>The ShopSphere Team</p>
          </div>
          <div class="footer">
            <p>© 2024 ShopSphere. All rights reserved.</p>
            <p>Follow us on social media for the latest deals and updates!</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export const emailService = new EmailService();
