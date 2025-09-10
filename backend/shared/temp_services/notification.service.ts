import nodemailer from 'nodemailer';
import twilio from 'twilio';
import { v4 as uuidv4 } from 'uuid';
import { 
  NotificationChannel, 
  NotificationPriority, 
  EventType,
  EmailSentEvent,
  SMSSentEvent,
  OrderCreatedEvent,
  OrderShippedEvent,
  OrderDeliveredEvent,
  PaymentCompletedEvent,
  PaymentFailedEvent,
  UserRegisteredEvent,
  ProductStockLowEvent
} from '../events/event.types';
import { kafkaProducerService } from './kafka-producer.service';
import { logger } from '../utils/logger';

export interface NotificationTemplate {
  id: string;
  name: string;
  channel: NotificationChannel;
  subject?: string;
  template: string;
  variables: string[];
}

export interface NotificationRequest {
  to: string;
  channel: NotificationChannel;
  template: string;
  variables: Record<string, any>;
  priority?: NotificationPriority;
  scheduledAt?: Date;
  metadata?: Record<string, any>;
}

export interface NotificationResult {
  id: string;
  status: 'sent' | 'delivered' | 'failed';
  messageId?: string;
  error?: string;
  sentAt: string;
}

export class NotificationService {
  private emailTransporter!: nodemailer.Transporter;
  private twilioClient!: twilio.Twilio;
  private templates: Map<string, NotificationTemplate> = new Map();

  constructor() {
    this.initializeEmailTransporter();
    this.initializeTwilioClient();
    this.loadTemplates();
  }

  private initializeEmailTransporter(): void {
    this.emailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  private initializeTwilioClient(): void {
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
    }
  }

  private loadTemplates(): void {
    // Order confirmation email
    this.templates.set('order_confirmation_email', {
      id: 'order_confirmation_email',
      name: 'Order Confirmation Email',
      channel: NotificationChannel.EMAIL,
      subject: 'Order Confirmation - {{orderNumber}}',
      template: `
        <h2>Thank you for your order!</h2>
        <p>Dear {{customerName}},</p>
        <p>Your order <strong>{{orderNumber}}</strong> has been confirmed and is being processed.</p>
        
        <h3>Order Details:</h3>
        <ul>
          {{#each items}}
          <li>{{productName}} - Quantity: {{quantity}} - ${{itemPrice}}</li>
          {{/each}}
        </ul>
        
        <p><strong>Total: ${{orderTotal}}</strong></p>
        
        <h3>Shipping Address:</h3>
        <p>{{shippingAddress.street}}<br>
        {{shippingAddress.city}}, {{shippingAddress.state}} {{shippingAddress.zipCode}}<br>
        {{shippingAddress.country}}</p>
        
        <p>We'll send you another email when your order ships.</p>
        <p>Thank you for shopping with ApniDukaan!</p>
      `,
      variables: ['customerName', 'orderNumber', 'items', 'total', 'shippingAddress']
    });

    // Order shipped email
    this.templates.set('order_shipped_email', {
      id: 'order_shipped_email',
      name: 'Order Shipped Email',
      channel: NotificationChannel.EMAIL,
      subject: 'Your order has shipped - {{orderNumber}}',
      template: `
        <h2>Your order is on its way!</h2>
        <p>Dear {{customerName}},</p>
        <p>Great news! Your order <strong>{{orderNumber}}</strong> has shipped.</p>
        
        <h3>Tracking Information:</h3>
        <p><strong>Tracking Number:</strong> {{trackingNumber}}</p>
        <p><strong>Carrier:</strong> {{carrier}}</p>
        <p><strong>Estimated Delivery:</strong> {{estimatedDelivery}}</p>
        
        <p>You can track your package using the tracking number above.</p>
        <p>Thank you for shopping with ApniDukaan!</p>
      `,
      variables: ['customerName', 'orderNumber', 'trackingNumber', 'carrier', 'estimatedDelivery']
    });

    // Order delivered email
    this.templates.set('order_delivered_email', {
      id: 'order_delivered_email',
      name: 'Order Delivered Email',
      channel: NotificationChannel.EMAIL,
      subject: 'Your order has been delivered - {{orderNumber}}',
      template: `
        <h2>Your order has been delivered!</h2>
        <p>Dear {{customerName}},</p>
        <p>Your order <strong>{{orderNumber}}</strong> has been successfully delivered.</p>
        
        <p><strong>Delivered to:</strong> {{deliveredTo}}</p>
        <p><strong>Delivered at:</strong> {{deliveredAt}}</p>
        
        <p>We hope you enjoy your purchase! If you have any questions or concerns, please don't hesitate to contact us.</p>
        <p>Thank you for shopping with ApniDukaan!</p>
      `,
      variables: ['customerName', 'orderNumber', 'deliveredTo', 'deliveredAt']
    });

    // Payment confirmation email
    this.templates.set('payment_confirmation_email', {
      id: 'payment_confirmation_email',
      name: 'Payment Confirmation Email',
      channel: NotificationChannel.EMAIL,
      subject: 'Payment Confirmed - {{orderNumber}}',
      template: `
        <h2>Payment Confirmed!</h2>
        <p>Dear {{customerName}},</p>
        <p>Your payment for order <strong>{{orderNumber}}</strong> has been successfully processed.</p>
        
        <p><strong>Amount:</strong> ${{paymentAmount}}</p>
        <p><strong>Payment Method:</strong> {{paymentMethod}}</p>
        <p><strong>Transaction ID:</strong> {{transactionId}}</p>
        
        <p>Your order is now being processed and you'll receive a confirmation email shortly.</p>
        <p>Thank you for shopping with ApniDukaan!</p>
      `,
      variables: ['customerName', 'orderNumber', 'amount', 'paymentMethod', 'transactionId']
    });

    // Payment failed email
    this.templates.set('payment_failed_email', {
      id: 'payment_failed_email',
      name: 'Payment Failed Email',
      channel: NotificationChannel.EMAIL,
      subject: 'Payment Failed - {{orderNumber}}',
      template: `
        <h2>Payment Failed</h2>
        <p>Dear {{customerName}},</p>
        <p>We were unable to process your payment for order <strong>{{orderNumber}}</strong>.</p>
        
        <p><strong>Amount:</strong> ${{paymentAmount}}</p>
        <p><strong>Payment Method:</strong> {{paymentMethod}}</p>
        <p><strong>Error:</strong> {{errorMessage}}</p>
        
        <p>Please try again with a different payment method or contact your bank if the issue persists.</p>
        <p>If you need assistance, please contact our support team.</p>
      `,
      variables: ['customerName', 'orderNumber', 'amount', 'paymentMethod', 'errorMessage']
    });

    // Welcome email
    this.templates.set('welcome_email', {
      id: 'welcome_email',
      name: 'Welcome Email',
      channel: NotificationChannel.EMAIL,
      subject: 'Welcome to ApniDukaan!',
      template: `
        <h2>Welcome to ApniDukaan!</h2>
        <p>Dear {{customerName}},</p>
        <p>Thank you for registering with ApniDukaan! We're excited to have you as part of our community.</p>
        
        <p>Here's what you can do:</p>
        <ul>
          <li>Browse our extensive product catalog</li>
          <li>Save items to your wishlist</li>
          <li>Track your orders in real-time</li>
          <li>Enjoy fast and secure checkout</li>
        </ul>
        
        <p>Start shopping now and discover amazing products at great prices!</p>
        <p>Welcome aboard!</p>
      `,
      variables: ['customerName']
    });

    // Low stock notification email
    this.templates.set('low_stock_email', {
      id: 'low_stock_email',
      name: 'Low Stock Notification Email',
      channel: NotificationChannel.EMAIL,
      subject: 'Low Stock Alert - {{productName}}',
      template: `
        <h2>Low Stock Alert</h2>
        <p>Dear Admin,</p>
        <p>The following product is running low on stock:</p>
        
        <h3>Product Details:</h3>
        <p><strong>Product:</strong> {{productName}}</p>
        <p><strong>SKU:</strong> {{sku}}</p>
        <p><strong>Current Stock:</strong> {{currentStock}}</p>
        <p><strong>Low Stock Threshold:</strong> {{lowStockThreshold}}</p>
        
        <p>Please consider restocking this product to avoid stockouts.</p>
      `,
      variables: ['productName', 'sku', 'currentStock', 'lowStockThreshold']
    });

    // SMS templates
    this.templates.set('order_confirmation_sms', {
      id: 'order_confirmation_sms',
      name: 'Order Confirmation SMS',
      channel: NotificationChannel.SMS,
      template: 'Hi {{customerName}}! Your order {{orderNumber}} for ${{total}} has been confirmed. We\'ll notify you when it ships. - ApniDukaan',
      variables: ['customerName', 'orderNumber', 'total']
    });

    this.templates.set('order_shipped_sms', {
      id: 'order_shipped_sms',
      name: 'Order Shipped SMS',
      channel: NotificationChannel.SMS,
      template: 'Your order {{orderNumber}} has shipped! Track it with {{trackingNumber}}. Estimated delivery: {{estimatedDelivery}} - ApniDukaan',
      variables: ['orderNumber', 'trackingNumber', 'estimatedDelivery']
    });
  }

  async sendNotification(request: NotificationRequest): Promise<NotificationResult> {
    const notificationId = uuidv4();
    const sentAt = new Date().toISOString();

    try {
      const template = this.templates.get(request.template);
      if (!template) {
        throw new Error(`Template not found: ${request.template}`);
      }

      let result: NotificationResult;

      switch (request.channel) {
        case NotificationChannel.EMAIL:
          result = await this.sendEmail(request, template, notificationId, sentAt);
          break;
        case NotificationChannel.SMS:
          result = await this.sendSMS(request, template, notificationId, sentAt);
          break;
        default:
          throw new Error(`Unsupported notification channel: ${request.channel}`);
      }

      // Publish notification event
      await this.publishNotificationEvent(request.channel, result, request.template);

      return result;

    } catch (error) {
      logger.error('Failed to send notification', {
        notificationId,
        channel: request.channel,
        template: request.template,
        error: (error as any).message,
        action: 'notification_send_error'
      });

      const failedResult: NotificationResult = {
        id: notificationId,
        status: 'failed',
        error: (error as any).message,
        sentAt
      };

      return failedResult;
    }
  }

  private async sendEmail(
    request: NotificationRequest, 
    template: NotificationTemplate, 
    notificationId: string, 
    sentAt: string
  ): Promise<NotificationResult> {
    try {
      const renderedSubject = this.renderTemplate(template.subject || '', request.variables);
      const renderedBody = this.renderTemplate(template.template, request.variables);

      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@apnidukaan.com',
        to: request.to,
        subject: renderedSubject,
        html: renderedBody,
      };

      const info = await this.emailTransporter.sendMail(mailOptions);

      logger.info('Email sent successfully', {
        notificationId,
        to: request.to,
        messageId: info.messageId,
        action: 'email_sent'
      });

      return {
        id: notificationId,
        status: 'sent',
        messageId: info.messageId,
        sentAt
      };

    } catch (error) {
      logger.error('Failed to send email', {
        notificationId,
        to: request.to,
        error: (error as any).message,
        action: 'email_send_error'
      });
      throw error;
    }
  }

  private async sendSMS(
    request: NotificationRequest, 
    template: NotificationTemplate, 
    notificationId: string, 
    sentAt: string
  ): Promise<NotificationResult> {
    try {
      if (!this.twilioClient) {
        throw new Error('Twilio client not configured');
      }

      const renderedMessage = this.renderTemplate(template.template, request.variables);

      const message = await this.twilioClient.messages.create({
        body: renderedMessage,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: request.to,
      });

      logger.info('SMS sent successfully', {
        notificationId,
        to: request.to,
        messageId: message.sid,
        action: 'sms_sent'
      });

      return {
        id: notificationId,
        status: 'sent',
        messageId: message.sid,
        sentAt
      };

    } catch (error) {
      logger.error('Failed to send SMS', {
        notificationId,
        to: request.to,
        error: (error as any).message,
        action: 'sms_send_error'
      });
      throw error;
    }
  }

  private renderTemplate(template: string, variables: Record<string, any>): string {
    let rendered = template;

    // Simple template rendering (in production, use a proper template engine like Handlebars)
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(placeholder, String(value));
    }

    return rendered;
  }

  private async publishNotificationEvent(
    channel: NotificationChannel, 
    result: NotificationResult, 
    template: string
  ): Promise<void> {
    try {
      if (channel === NotificationChannel.EMAIL) {
        const event: EmailSentEvent = {
          id: uuidv4(),
          type: EventType.EMAIL_SENT,
          status: 'completed' as any,
          timestamp: new Date().toISOString(),
          source: 'notification-service',
          version: '1.0.0',
          data: {
            to: result.messageId || '',
            subject: template,
            template,
            messageId: result.messageId || '',
            sentAt: result.sentAt,
            status: result.status
          }
        };
        await kafkaProducerService.publish(event);
      } else if (channel === NotificationChannel.SMS) {
        const event: SMSSentEvent = {
          id: uuidv4(),
          type: EventType.SMS_SENT,
          status: 'completed' as any,
          timestamp: new Date().toISOString(),
          source: 'notification-service',
          version: '1.0.0',
          data: {
            to: result.messageId || '',
            message: template,
            messageId: result.messageId || '',
            sentAt: result.sentAt,
            status: result.status
          }
        };
        await kafkaProducerService.publish(event);
      }
    } catch (error) {
      logger.error('Failed to publish notification event', {
        channel,
        error: (error as any).message,
        action: 'notification_event_publish_error'
      });
    }
  }

  getTemplate(templateId: string): NotificationTemplate | undefined {
    return this.templates.get(templateId);
  }

  getAllTemplates(): NotificationTemplate[] {
    return Array.from(this.templates.values());
  }
}

export const notificationService = new NotificationService();
