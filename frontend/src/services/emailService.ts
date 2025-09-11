'use client';

export interface EmailTemplate {
  type: 'order_confirmation' | 'order_shipped' | 'order_delivered' | 'password_reset' | 'welcome' | 'promotional';
  subject: string;
  htmlContent: string;
  textContent: string;
}

export interface EmailNotification {
  to: string;
  template: EmailTemplate;
  data: Record<string, any>;
}

class EmailService {
  private static instance: EmailService;
  private apiUrl: string;

  constructor() {
    this.apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/graphql', '') || 'http://localhost:4000';
  }

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  // Email Templates
  private getTemplate(type: EmailTemplate['type'], data: Record<string, any>): EmailTemplate {
    switch (type) {
      case 'order_confirmation':
        return {
          type,
          subject: `Order Confirmation #${data.orderNumber} - ApniDukaan`,
          htmlContent: this.getOrderConfirmationHTML(data),
          textContent: this.getOrderConfirmationText(data)
        };

      case 'order_shipped':
        return {
          type,
          subject: `Your order #${data.orderNumber} has been shipped!`,
          htmlContent: this.getOrderShippedHTML(data),
          textContent: this.getOrderShippedText(data)
        };

      case 'order_delivered':
        return {
          type,
          subject: `Your order #${data.orderNumber} has been delivered!`,
          htmlContent: this.getOrderDeliveredHTML(data),
          textContent: this.getOrderDeliveredText(data)
        };

      case 'password_reset':
        return {
          type,
          subject: 'Reset your ApniDukaan password',
          htmlContent: this.getPasswordResetHTML(data),
          textContent: this.getPasswordResetText(data)
        };

      case 'welcome':
        return {
          type,
          subject: 'Welcome to ApniDukaan!',
          htmlContent: this.getWelcomeHTML(data),
          textContent: this.getWelcomeText(data)
        };

      case 'promotional':
        return {
          type,
          subject: data.subject || 'Special Offer from ApniDukaan',
          htmlContent: this.getPromotionalHTML(data),
          textContent: this.getPromotionalText(data)
        };

      default:
        throw new Error(`Unknown email template type: ${type}`);
    }
  }

  // Send email notification
  async sendNotification(notification: Omit<EmailNotification, 'template'> & { templateType: EmailTemplate['type'] }): Promise<boolean> {
    try {
      const template = this.getTemplate(notification.templateType, notification.data);
      
      const response = await fetch(`${this.apiUrl}/api/notifications/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          to: notification.to,
          subject: template.subject,
          htmlContent: template.htmlContent,
          textContent: template.textContent,
          type: template.type
        })
      });

      if (!response.ok) {
        throw new Error(`Email service responded with status: ${response.status}`);
      }

      const result = await response.json();
      return result.success || false;
    } catch (error) {
      console.error('Failed to send email notification:', error);
      return false;
    }
  }

  // Template HTML generators
  private getOrderConfirmationHTML(data: any): string {
    const { orderNumber, customerName, items, total, shippingAddress } = data;
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmation</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f8f9fa; }
        .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .total { font-size: 1.2em; font-weight: bold; color: #3b82f6; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Order Confirmed!</h1>
            <p>Thank you for your purchase, ${customerName}!</p>
        </div>
        
        <div class="content">
            <h2>Order #${orderNumber}</h2>
            <p>Your order has been confirmed and will be processed shortly.</p>
            
            <div class="order-details">
                <h3>Order Items:</h3>
                ${items.map((item: any) => `
                    <div class="item">
                        <span>${item.name} (x${item.quantity})</span>
                        <span>$${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                `).join('')}
                
                <div class="item total">
                    <span>Total</span>
                    <span>$${total.toFixed(2)}</span>
                </div>
            </div>
            
            <h3>Shipping Address:</h3>
            <p>
                ${shippingAddress.street}<br>
                ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zipCode}<br>
                ${shippingAddress.country}
            </p>
            
            <p>You will receive another email when your order ships.</p>
        </div>
    </div>
</body>
</html>`;
  }

  private getOrderConfirmationText(data: any): string {
    const { orderNumber, customerName, items, total, shippingAddress } = data;
    
    return `
ORDER CONFIRMED!

Hi ${customerName},

Thank you for your purchase! Your order #${orderNumber} has been confirmed.

Order Items:
${items.map((item: any) => `- ${item.name} (x${item.quantity}): $${(item.price * item.quantity).toFixed(2)}`).join('\n')}

Total: $${total.toFixed(2)}

Shipping Address:
${shippingAddress.street}
${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zipCode}
${shippingAddress.country}

You will receive another email when your order ships.

Best regards,
The ApniDukaan Team
`;
  }

  private getOrderShippedHTML(data: any): string {
    const { orderNumber, customerName, trackingNumber, carrier, estimatedDelivery } = data;
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Shipped</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f8f9fa; }
        .tracking { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .tracking-number { font-size: 1.2em; font-weight: bold; color: #10b981; }
        .btn { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Your Order is on its way!</h1>
            <p>Hi ${customerName}, great news!</p>
        </div>
        
        <div class="content">
            <h2>Order #${orderNumber} Shipped</h2>
            <p>Your order has been shipped and is on its way to you.</p>
            
            <div class="tracking">
                <h3>Tracking Information</h3>
                <p><strong>Carrier:</strong> ${carrier}</p>
                <p><strong>Tracking Number:</strong></p>
                <p class="tracking-number">${trackingNumber}</p>
                <p><strong>Estimated Delivery:</strong> ${estimatedDelivery}</p>
                
                <a href="#" class="btn">Track Your Package</a>
            </div>
        </div>
    </div>
</body>
</html>`;
  }

  private getOrderShippedText(data: any): string {
    const { orderNumber, customerName, trackingNumber, carrier, estimatedDelivery } = data;
    
    return `
YOUR ORDER IS ON ITS WAY!

Hi ${customerName},

Great news! Your order #${orderNumber} has been shipped.

Tracking Information:
- Carrier: ${carrier}
- Tracking Number: ${trackingNumber}
- Estimated Delivery: ${estimatedDelivery}

You can track your package using the tracking number above.

Best regards,
The ApniDukaan Team
`;
  }

  private getOrderDeliveredHTML(data: any): string {
    const { orderNumber, customerName } = data;
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Delivered</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #059669; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f8f9fa; }
        .review-section { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .btn { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Order Delivered!</h1>
            <p>Hi ${customerName}, your order has arrived!</p>
        </div>
        
        <div class="content">
            <h2>Order #${orderNumber} Delivered</h2>
            <p>We hope you love your purchase!</p>
            
            <div class="review-section">
                <h3>How was your experience?</h3>
                <p>We'd love to hear about your purchase. Your feedback helps us serve you better.</p>
                <a href="#" class="btn">Leave a Review</a>
            </div>
        </div>
    </div>
</body>
</html>`;
  }

  private getOrderDeliveredText(data: any): string {
    const { orderNumber, customerName } = data;
    
    return `
ORDER DELIVERED!

Hi ${customerName},

Your order #${orderNumber} has been delivered!

We hope you love your purchase. We'd appreciate it if you could leave a review to help other customers.

Best regards,
The ApniDukaan Team
`;
  }

  private getPasswordResetHTML(data: any): string {
    const { customerName, resetLink } = data;
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ef4444; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f8f9fa; }
        .reset-section { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .btn { display: inline-block; background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Reset Your Password</h1>
        </div>
        
        <div class="content">
            <p>Hi ${customerName || 'there'},</p>
            <p>We received a request to reset your password for your ApniDukaan account.</p>
            
            <div class="reset-section">
                <p>Click the button below to reset your password:</p>
                <a href="${resetLink}" class="btn">Reset Password</a>
                <p><small>This link will expire in 1 hour.</small></p>
            </div>
            
            <p>If you didn't request this password reset, please ignore this email.</p>
        </div>
    </div>
</body>
</html>`;
  }

  private getPasswordResetText(data: any): string {
    const { customerName, resetLink } = data;
    
    return `
RESET YOUR PASSWORD

Hi ${customerName || 'there'},

We received a request to reset your password for your ApniDukaan account.

Click the link below to reset your password:
${resetLink}

This link will expire in 1 hour.

If you didn't request this password reset, please ignore this email.

Best regards,
The ApniDukaan Team
`;
  }

  private getWelcomeHTML(data: any): string {
    const { customerName } = data;
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to ApniDukaan</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #6366f1; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f8f9fa; }
        .welcome-section { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .btn { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to ApniDukaan!</h1>
            <p>Hi ${customerName}, we're excited to have you!</p>
        </div>
        
        <div class="content">
            <div class="welcome-section">
                <h2>Get Started</h2>
                <p>Thanks for joining ApniDukaan! Here's what you can do:</p>
                <ul>
                    <li>Browse thousands of products</li>
                    <li>Create wishlists for future purchases</li>
                    <li>Track your orders in real-time</li>
                    <li>Enjoy fast and secure checkout</li>
                </ul>
                
                <a href="#" class="btn">Start Shopping</a>
            </div>
        </div>
    </div>
</body>
</html>`;
  }

  private getWelcomeText(data: any): string {
    const { customerName } = data;
    
    return `
WELCOME TO APNIDUKAAN!

Hi ${customerName},

Thanks for joining ApniDukaan! We're excited to have you as part of our community.

Here's what you can do:
- Browse thousands of products
- Create wishlists for future purchases  
- Track your orders in real-time
- Enjoy fast and secure checkout

Start shopping today!

Best regards,
The ApniDukaan Team
`;
  }

  private getPromotionalHTML(data: any): string {
    const { title, content, ctaText, ctaLink } = data;
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Special Offer</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f8f9fa; }
        .promo-section { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .btn { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${title}</h1>
        </div>
        
        <div class="content">
            <div class="promo-section">
                ${content}
                ${ctaText && ctaLink ? `<a href="${ctaLink}" class="btn">${ctaText}</a>` : ''}
            </div>
        </div>
    </div>
</body>
</html>`;
  }

  private getPromotionalText(data: any): string {
    const { title, content, ctaText, ctaLink } = data;
    
    return `
${title.toUpperCase()}

${content}

${ctaText && ctaLink ? `${ctaText}: ${ctaLink}` : ''}

Best regards,
The ApniDukaan Team
`;
  }
}

export const emailService = EmailService.getInstance();
