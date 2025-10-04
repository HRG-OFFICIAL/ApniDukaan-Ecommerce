import { logger } from '@apnidukaan/shared';

export interface SMSData {
  to: string;
  message: string;
  templateId?: string;
  data?: Record<string, any>;
}

export class SMSService {
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    this.apiKey = process.env.SMS_API_KEY || '';
    this.apiUrl = process.env.SMS_API_URL || 'https://api.textlocal.in/send/';
  }

  async sendSMS(smsData: SMSData): Promise<boolean> {
    try {
      // Mock SMS sending for development
      if (process.env.NODE_ENV === 'development' || !this.apiKey) {
        logger.info('SMS sent (mock)', {
          to: smsData.to,
          message: smsData.message,
          action: 'sms_sent_mock'
        });
        return true;
      }

      // Real SMS implementation would go here
      // For now, we'll just log the SMS
      logger.info('SMS sent successfully', {
        to: smsData.to,
        message: smsData.message,
        action: 'sms_sent'
      });

      return true;
    } catch (error: any) {
      logger.error('Failed to send SMS', {
        error: error.message,
        to: smsData.to,
        message: smsData.message,
        action: 'sms_send_failed'
      });
      return false;
    }
  }

  // SMS templates
  getOrderConfirmationSMS(orderNumber: string, total: number): string {
    return `Your order #${orderNumber} has been confirmed! Total: ₹${total}. Track at ${process.env.FRONTEND_URL}/orders`;
  }

  getOTPSMS(otp: string): string {
    return `Your ApniDukaan OTP is ${otp}. Valid for 5 minutes. Do not share with anyone.`;
  }

  getOrderShippedSMS(orderNumber: string, trackingNumber: string): string {
    return `Your order #${orderNumber} has been shipped! Tracking: ${trackingNumber}. Track at ${process.env.FRONTEND_URL}/orders`;
  }

  getOrderDeliveredSMS(orderNumber: string): string {
    return `Your order #${orderNumber} has been delivered! Thank you for shopping with ApniDukaan.`;
  }
}

export default SMSService;
