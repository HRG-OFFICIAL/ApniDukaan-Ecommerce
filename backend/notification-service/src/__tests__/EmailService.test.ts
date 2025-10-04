import EmailService from '../services/EmailService';

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransporter: jest.fn(() => ({
    sendMail: jest.fn()
  }))
}));

describe('EmailService', () => {
  let emailService: EmailService;
  let mockTransporter: any;

  beforeEach(() => {
    emailService = new EmailService();
    mockTransporter = {
      sendMail: jest.fn()
    };
  });

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      const emailData = {
        to: 'test@example.com',
        template: {
          subject: 'Test Subject',
          html: '<p>Test HTML</p>',
          text: 'Test Text'
        }
      };

      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-message-id' });

      const result = await emailService.sendEmail(emailData);

      expect(result).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'noreply@apnidukaan.com',
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        text: 'Test Text',
        attachments: undefined
      });
    });

    it('should handle multiple recipients', async () => {
      const emailData = {
        to: ['test1@example.com', 'test2@example.com'],
        template: {
          subject: 'Test Subject',
          html: '<p>Test HTML</p>',
          text: 'Test Text'
        }
      };

      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-message-id' });

      const result = await emailService.sendEmail(emailData);

      expect(result).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'noreply@apnidukaan.com',
        to: 'test1@example.com, test2@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        text: 'Test Text',
        attachments: undefined
      });
    });

    it('should return false when email sending fails', async () => {
      const emailData = {
        to: 'test@example.com',
        template: {
          subject: 'Test Subject',
          html: '<p>Test HTML</p>',
          text: 'Test Text'
        }
      };

      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP Error'));

      const result = await emailService.sendEmail(emailData);

      expect(result).toBe(false);
    });
  });

  describe('getWelcomeEmailTemplate', () => {
    it('should generate welcome email template', () => {
      const template = emailService.getWelcomeEmailTemplate('John Doe');

      expect(template.subject).toBe('Welcome to ApniDukaan!');
      expect(template.html).toContain('John Doe');
      expect(template.html).toContain('Welcome to ApniDukaan!');
      expect(template.text).toContain('John Doe');
    });
  });

  describe('getOrderConfirmationTemplate', () => {
    it('should generate order confirmation email template', () => {
      const orderData = {
        orderNumber: 'ORD-123',
        customerName: 'John Doe',
        total: 1500,
        createdAt: new Date().toISOString(),
        _id: 'order-id'
      };

      const template = emailService.getOrderConfirmationTemplate(orderData);

      expect(template.subject).toBe('Order Confirmation - #ORD-123');
      expect(template.html).toContain('John Doe');
      expect(template.html).toContain('ORD-123');
      expect(template.html).toContain('₹1500');
    });
  });

  describe('getPasswordResetTemplate', () => {
    it('should generate password reset email template', () => {
      const template = emailService.getPasswordResetTemplate('reset-token-123', 'John Doe');

      expect(template.subject).toBe('Password Reset Request - ApniDukaan');
      expect(template.html).toContain('John Doe');
      expect(template.html).toContain('reset-token-123');
      expect(template.text).toContain('reset-token-123');
    });
  });
});
