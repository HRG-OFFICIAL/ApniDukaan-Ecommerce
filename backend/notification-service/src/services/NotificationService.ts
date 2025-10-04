import { EventEmitter } from 'events';
import EmailService, { EmailData } from './EmailService';
import SMSService, { SMSData } from './SMSService';
import { logger } from '@apnidukaan/shared';

export interface NotificationData {
  type: 'email' | 'sms' | 'push' | 'in_app';
  recipient: string | string[];
  template: string;
  data: Record<string, any>;
  priority?: 'low' | 'normal' | 'high';
  scheduledAt?: Date;
}

export class NotificationService extends EventEmitter {
  private emailService: EmailService;
  private smsService: SMSService;
  private notificationQueue: NotificationData[] = [];

  constructor() {
    super();
    this.emailService = new EmailService();
    this.smsService = new SMSService();
    
    // Process notification queue every 5 seconds
    setInterval(() => {
      this.processQueue();
    }, 5000);
  }

  async sendNotification(notification: NotificationData): Promise<boolean> {
    try {
      // Add to queue for processing
      this.notificationQueue.push(notification);
      
      logger.info('Notification queued', {
        type: notification.type,
        recipient: notification.recipient,
        template: notification.template,
        action: 'notification_queued'
      });

      return true;
    } catch (error: any) {
      logger.error('Failed to queue notification', {
        error: error.message,
        notification,
        action: 'notification_queue_failed'
      });
      return false;
    }
  }

  private async processQueue(): Promise<void> {
    if (this.notificationQueue.length === 0) return;

    const notifications = this.notificationQueue.splice(0, 10); // Process up to 10 at a time

    for (const notification of notifications) {
      try {
        await this.processNotification(notification);
      } catch (error: any) {
        logger.error('Failed to process notification', {
          error: error.message,
          notification,
          action: 'notification_process_failed'
        });
      }
    }
  }

  private async processNotification(notification: NotificationData): Promise<void> {
    const { type, recipient, template, data } = notification;

    switch (type) {
      case 'email':
        await this.sendEmailNotification(recipient as string | string[], template, data);
        break;
      case 'sms':
        await this.sendSMSNotification(recipient as string, template, data);
        break;
      case 'push':
        await this.sendPushNotification(recipient as string, template, data);
        break;
      case 'in_app':
        await this.sendInAppNotification(recipient as string, template, data);
        break;
      default:
        logger.warn('Unknown notification type', { type });
    }
  }

  private async sendEmailNotification(recipient: string | string[], template: string, data: any): Promise<void> {
    let emailTemplate;

    switch (template) {
      case 'welcome':
        emailTemplate = this.emailService.getWelcomeEmailTemplate(data.userName);
        break;
      case 'order_confirmation':
        emailTemplate = this.emailService.getOrderConfirmationTemplate(data.orderData);
        break;
      case 'password_reset':
        emailTemplate = this.emailService.getPasswordResetTemplate(data.resetToken, data.userName);
        break;
      default:
        logger.warn('Unknown email template', { template });
        return;
    }

    const emailData: EmailData = {
      to: recipient,
      template: emailTemplate,
      data
    };

    await this.emailService.sendEmail(emailData);
  }

  private async sendSMSNotification(recipient: string, template: string, data: any): Promise<void> {
    let message: string;

    switch (template) {
      case 'order_confirmation':
        message = this.smsService.getOrderConfirmationSMS(data.orderNumber, data.total);
        break;
      case 'otp':
        message = this.smsService.getOTPSMS(data.otp);
        break;
      case 'order_shipped':
        message = this.smsService.getOrderShippedSMS(data.orderNumber, data.trackingNumber);
        break;
      case 'order_delivered':
        message = this.smsService.getOrderDeliveredSMS(data.orderNumber);
        break;
      default:
        logger.warn('Unknown SMS template', { template });
        return;
    }

    const smsData: SMSData = {
      to: recipient,
      message
    };

    await this.smsService.sendSMS(smsData);
  }

  private async sendPushNotification(recipient: string, template: string, data: any): Promise<void> {
    // Mock push notification implementation
    logger.info('Push notification sent (mock)', {
      recipient,
      template,
      data,
      action: 'push_notification_sent'
    });
  }

  private async sendInAppNotification(recipient: string, template: string, data: any): Promise<void> {
    // Mock in-app notification implementation
    logger.info('In-app notification sent (mock)', {
      recipient,
      template,
      data,
      action: 'in_app_notification_sent'
    });
  }

  // Convenience methods for common notifications
  async sendWelcomeEmail(userEmail: string, userName: string): Promise<boolean> {
    return this.sendNotification({
      type: 'email',
      recipient: userEmail,
      template: 'welcome',
      data: { userName }
    });
  }

  async sendOrderConfirmation(userEmail: string, orderData: any): Promise<boolean> {
    return this.sendNotification({
      type: 'email',
      recipient: userEmail,
      template: 'order_confirmation',
      data: { orderData }
    });
  }

  async sendPasswordResetEmail(userEmail: string, resetToken: string, userName: string): Promise<boolean> {
    return this.sendNotification({
      type: 'email',
      recipient: userEmail,
      template: 'password_reset',
      data: { resetToken, userName }
    });
  }

  async sendOrderSMS(phoneNumber: string, orderNumber: string, total: number): Promise<boolean> {
    return this.sendNotification({
      type: 'sms',
      recipient: phoneNumber,
      template: 'order_confirmation',
      data: { orderNumber, total }
    });
  }

  async sendOTP(phoneNumber: string, otp: string): Promise<boolean> {
    return this.sendNotification({
      type: 'sms',
      recipient: phoneNumber,
      template: 'otp',
      data: { otp }
    });
  }
}

export default NotificationService;
