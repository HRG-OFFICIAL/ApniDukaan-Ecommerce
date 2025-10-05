import paypal from 'paypal-rest-sdk';
import Razorpay from 'razorpay';
import {
  PaymentMethod,
  PaymentStatus,
  IPayment,
  IRefund,
  IPaymentRequest,
  IPaymentResponse,
  IRefundRequest
} from '../types/order.types';

// Payment gateway configuration interfaces
interface IPayPalConfig {
  enabled: boolean;
  clientId: string;
  clientSecret: string;
  mode: 'sandbox' | 'live';
}

interface IRazorpayConfig {
  enabled: boolean;
  keyId: string;
  keySecret: string;
  webhookSecret: string;
}

interface IPaymentConfig {
  paypal: IPayPalConfig;
  razorpay: IRazorpayConfig;
  defaultCurrency: string;
  supportedCurrencies: string[];
  webhookTimeout: number;
}

class PaymentService {
  private razorpay: Razorpay | null = null;
  private config: IPaymentConfig;

  constructor() {
    this.config = {
      paypal: {
        enabled: process.env.PAYPAL_ENABLED === 'true',
        clientId: process.env.PAYPAL_CLIENT_ID || '',
        clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
        mode: (process.env.PAYPAL_MODE as 'sandbox' | 'live') || 'sandbox'
      },
      razorpay: {
        enabled: process.env.RAZORPAY_ENABLED !== 'false',
        keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_RPTmqUYFOHsjfL',
        keySecret: process.env.RAZORPAY_KEY_SECRET || '77jo8sW2SfaLZ62g6OBy6dK6',
        webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || ''
      },
      defaultCurrency: 'USD',
      supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR'],
      webhookTimeout: 30000
    };

    this.initializeGateways();
  }

  private initializeGateways(): void {
    // Initialize PayPal
    if (this.config.paypal.enabled && this.config.paypal.clientId) {
      try {
        paypal.configure({
          mode: this.config.paypal.mode,
          client_id: this.config.paypal.clientId,
          client_secret: this.config.paypal.clientSecret
        });
        console.log('PayPal payment gateway initialized');
      } catch (error) {
        console.error('Failed to initialize PayPal:', error);
      }
    }

    // Initialize Razorpay
    if (this.config.razorpay.enabled && this.config.razorpay.keyId && this.config.razorpay.keySecret) {
      try {
        this.razorpay = new Razorpay({
          key_id: this.config.razorpay.keyId,
          key_secret: this.config.razorpay.keySecret
        });
        console.log('Razorpay payment gateway initialized');
      } catch (error) {
        console.error('Failed to initialize Razorpay:', error);
      }
    }
  }

  async processPayment(paymentRequest: IPaymentRequest): Promise<IPaymentResponse> {
    try {
      // Validate payment request
      const validation = this.validatePaymentRequest(paymentRequest);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error || 'Invalid payment request',
          message: validation.error || 'Invalid payment request'
        };
      }

      // Route to appropriate payment processor
      switch (paymentRequest.method) {
        case PaymentMethod.PAYPAL:
          return await this.processPayPalPayment(paymentRequest);
        case PaymentMethod.RAZORPAY:
        case PaymentMethod.UPI:
        case PaymentMethod.NET_BANKING:
        case PaymentMethod.WALLET:
          return await this.processRazorpayPayment(paymentRequest);
        default:
          return {
            success: false,
            error: `Unsupported payment method: ${paymentRequest.method}`,
            message: 'Unsupported payment method'
          };
      }
    } catch (error: any) {
      console.error('Payment processing error:', error);
      return {
        success: false,
        error: error.message || 'Payment processing failed',
        message: 'Payment processing failed'
      };
    }
  }

  async createRazorpayOrder(orderData: {
    amount: number;
    currency: string;
    receipt: string;
    notes?: Record<string, any>;
  }): Promise<IPaymentResponse> {
    if (!this.razorpay) {
      return {
        success: false,
        error: 'Razorpay is not initialized',
        message: 'Razorpay is not initialized'
      };
    }

    try {
      const options = {
        amount: Math.round(orderData.amount * 100), // Convert to paise
        currency: orderData.currency,
        receipt: orderData.receipt,
        notes: orderData.notes || {}
      };

      const order = await this.razorpay.orders.create(options);

      return {
        success: true,
        data: {
          payment: {
            method: PaymentMethod.RAZORPAY,
            provider: 'razorpay',
            transactionId: order.id,
            amount: Number(order.amount) / 100, // Convert from paise
            currency: order.currency,
            status: order.status === 'created' ? PaymentStatus.PENDING : PaymentStatus.PROCESSING,
            paidAt: order.status === 'paid' ? new Date(Number(order.created_at) * 1000) : undefined,
            refunds: [],
            metadata: {
              orderId: order.id,
              receipt: order.receipt,
              keyId: this.config.razorpay.keyId,
              created_at: order.created_at
            },
            gateway: {
              paymentIntentId: order.id,
              chargeId: order.id
            }
          } as IPayment
        },
        message: 'Razorpay order created successfully'
      };
    } catch (error: any) {
      console.error('Razorpay order creation error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create Razorpay order',
        message: 'Failed to create Razorpay order'
      };
    }
  }

  async processRazorpayPayment(paymentRequest: IPaymentRequest): Promise<IPaymentResponse> {
    // This is a compatibility method that calls createRazorpayOrder
    return await this.createRazorpayOrder({
      amount: paymentRequest.amount,
      currency: paymentRequest.currency || this.config.defaultCurrency,
      receipt: paymentRequest.receipt || `receipt_${Date.now()}`,
      notes: {
        orderId: paymentRequest.orderId,
        customerId: paymentRequest.customerId
      }
    });
  }

  async verifyRazorpayPayment(paymentId: string, orderId: string, signature: string): Promise<IPaymentResponse> {
    if (!this.razorpay) {
      return {
        success: false,
        error: 'Razorpay is not initialized',
        message: 'Razorpay is not initialized'
      };
    }

    try {
      // Verify signature
      const crypto = require('crypto');
      const body = orderId + '|' + paymentId;
      const expectedSignature = crypto
        .createHmac('sha256', this.config.razorpay.keySecret)
        .update(body)
        .digest('hex');

      if (expectedSignature !== signature) {
        return {
          success: false,
          error: 'Invalid payment signature',
          message: 'Invalid payment signature'
        };
      }

      // Fetch payment details
      const payment = await this.razorpay.payments.fetch(paymentId);

      return {
        success: true,
        data: {
          payment: {
            method: PaymentMethod.RAZORPAY,
            provider: 'razorpay',
            transactionId: payment.id,
            amount: Number(payment.amount) / 100, // Convert from paise
            currency: payment.currency,
            status: payment.status === 'captured' ? PaymentStatus.COMPLETED : PaymentStatus.PROCESSING,
            paidAt: payment.status === 'captured' ? new Date(Number(payment.created_at) * 1000) : undefined,
            refunds: [],
            metadata: {
              orderId: payment.order_id,
              signature: signature,
              method: payment.method,
              captured: payment.captured,
              description: payment.description,
              notes: payment.notes,
              created_at: payment.created_at
            },
            gateway: {
              paymentIntentId: payment.id,
              chargeId: payment.id
            }
          } as IPayment
        },
        message: 'Payment verified successfully'
      };
    } catch (error: any) {
      console.error('Razorpay payment verification error:', error);
      return {
        success: false,
        error: error.message || 'Failed to verify payment',
        message: 'Failed to verify payment'
      };
    }
  }

  async processPayPalPayment(paymentRequest: IPaymentRequest): Promise<IPaymentResponse> {
    return new Promise((resolve) => {
      const payment = {
        intent: 'sale',
        payer: {
          payment_method: 'paypal'
        },
        redirect_urls: {
          return_url: `${process.env.FRONTEND_URL}/checkout/success`,
          cancel_url: `${process.env.FRONTEND_URL}/checkout`
        },
        transactions: [{
          amount: {
            currency: paymentRequest.currency || this.config.defaultCurrency,
            total: paymentRequest.amount.toString()
          },
          description: paymentRequest.description || 'Order payment',
          item_list: {
            items: paymentRequest.items?.map(item => ({
              name: item.name,
              sku: item.sku || item.productId,
              price: item.price.toString(),
              currency: paymentRequest.currency || this.config.defaultCurrency,
              quantity: item.quantity
            })) || []
          }
        }]
      };

      paypal.payment.create(payment, (error: any, payment: any) => {
        if (error) {
          console.error('PayPal payment creation error:', error);
          resolve({
            success: false,
            error: error.message || 'PayPal payment creation failed',
            message: 'PayPal payment creation failed'
          });
        } else {
          resolve({
            success: true,
            data: {
              payment: {
                method: PaymentMethod.PAYPAL,
                provider: 'paypal',
                transactionId: payment.id,
                amount: paymentRequest.amount,
                currency: paymentRequest.currency || this.config.defaultCurrency,
                status: PaymentStatus.PENDING,
                refunds: [],
                metadata: {
                  paypalPaymentId: payment.id,
                  approvalUrl: payment.links?.find((link: any) => link.rel === 'approval_url')?.href
                },
                gateway: {
                  paymentIntentId: payment.id,
                  chargeId: payment.id
                }
              } as IPayment
            },
            message: 'PayPal payment created successfully'
          });
        }
      });
    });
  }

  async processRefund(refundRequest: IRefundRequest): Promise<IPaymentResponse> {
    try {
      // For now, only support Razorpay refunds
      if (refundRequest.paymentMethod === PaymentMethod.RAZORPAY) {
        return await this.processRazorpayRefund(refundRequest);
      }

      return {
        success: false,
        error: `Refund not supported for payment method: ${refundRequest.paymentMethod}`,
        message: 'Refund not supported for payment method'
      };
    } catch (error: any) {
      console.error('Refund processing error:', error);
      return {
        success: false,
        error: error.message || 'Refund processing failed',
        message: 'Refund processing failed'
      };
    }
  }

  async processRazorpayRefund(refundRequest: IRefundRequest): Promise<IPaymentResponse> {
    if (!this.razorpay) {
      return {
        success: false,
        error: 'Razorpay is not initialized',
        message: 'Razorpay is not initialized'
      };
    }

    try {
      const refundAny: any = await (this.razorpay as any).payments.refund(refundRequest.paymentId, {
        amount: Math.round(refundRequest.amount * 100), // Convert to paise
        notes: {
          reason: refundRequest.reason,
          description: refundRequest.description
        }
      });

      return {
        success: true,
        data: {
          refund: {
            refundId: refundAny.id,
            paymentId: refundRequest.paymentId,
            amount: Number(refundAny.amount) / 100,
            currency: refundAny.currency,
            status: refundAny.status,
            reason: refundRequest.reason,
            description: refundRequest.description,
            processedAt: new Date(Number(refundAny.created_at) * 1000),
            metadata: {
              razorpayRefundId: refundAny.id,
              notes: refundAny.notes
            }
          } as IRefund
        },
        message: 'Refund processed successfully'
      };
    } catch (error: any) {
      console.error('Razorpay refund error:', error);
      return {
        success: false,
        error: error.message || 'Refund processing failed',
        message: 'Refund processing failed'
      };
    }
  }

  async handleRazorpayWebhook(payload: any, signature: string): Promise<IPaymentResponse> {
    if (!this.razorpay) {
      return {
        success: false,
        error: 'Razorpay is not initialized',
        message: 'Razorpay is not initialized'
      };
    }

    try {
      // Verify webhook signature
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', this.config.razorpay.webhookSecret)
        .update(JSON.stringify(payload))
        .digest('hex');

      if (expectedSignature !== signature) {
        return {
          success: false,
          error: 'Invalid webhook signature',
          message: 'Invalid webhook signature'
        };
      }

      // Process webhook event
      const event = payload;
      console.log('Processing Razorpay webhook event:', event.event);

      switch (event.event) {
        case 'payment.captured':
          return await this.handleRazorpayPaymentCaptured(event);
        case 'payment.failed':
          return await this.handleRazorpayPaymentFailed(event);
        case 'order.paid':
          return await this.handleRazorpayOrderPaid(event);
        default:
          console.log('Unhandled webhook event:', event.event);
          return {
            success: true,
            message: 'Webhook event received but not processed'
          };
      }
    } catch (error: any) {
      console.error('Razorpay webhook processing error:', error);
      return {
        success: false,
        error: error.message || 'Webhook processing failed',
        message: 'Webhook processing failed'
      };
    }
  }

  private async handleRazorpayPaymentCaptured(event: any): Promise<IPaymentResponse> {
    console.log('Payment captured:', event.payload.payment.entity);
      return {
        success: true,
        message: 'Payment captured event processed'
    };
  }

  private async handleRazorpayPaymentFailed(event: any): Promise<IPaymentResponse> {
    console.log('Payment failed:', event.payload.payment.entity);
    return {
      success: true,
      message: 'Payment failed event processed'
    };
  }

  private async handleRazorpayOrderPaid(event: any): Promise<IPaymentResponse> {
    console.log('Order paid:', event.payload.order.entity);
    return {
      success: true,
      message: 'Order paid event processed'
    };
  }

  // Stubs for Stripe/PayPal webhooks referenced in routes
  async handleStripeWebhook(_payload: any, _signature: string): Promise<IPaymentResponse> {
    return { success: true, message: 'Stripe webhook received' };
  }

  async handlePayPalWebhook(_body: any): Promise<IPaymentResponse> {
    return { success: true, message: 'PayPal webhook received' };
  }

  private validatePaymentRequest(paymentRequest: IPaymentRequest): { valid: boolean; error?: string } {
    if (!paymentRequest.amount || paymentRequest.amount <= 0) {
      return { valid: false, error: 'Invalid payment amount' };
    }

    if (!paymentRequest.currency || !this.config.supportedCurrencies.includes(paymentRequest.currency)) {
      return { valid: false, error: 'Unsupported currency' };
    }

    if (!paymentRequest.method) {
      return { valid: false, error: 'Payment method is required' };
    }

    return { valid: true };
  }

  // Reserved for future extension
  // private validatePaymentMethod(paymentData: any): { valid: boolean; error?: string } {
  //   switch (paymentData.method) {
  //     case PaymentMethod.PAYPAL:
  //       return this.validatePayPalPayment(paymentData);
  //     case PaymentMethod.RAZORPAY:
  //     case PaymentMethod.UPI:
  //     case PaymentMethod.NET_BANKING:
  //     case PaymentMethod.WALLET:
  //       return this.validateRazorpayPayment(paymentData);
  //     default:
  //       return { valid: false, error: 'Unsupported payment method' };
  //   }
  // }

  // private validatePayPalPayment(paymentData: any): { valid: boolean; error?: string } {
  //   if (!paymentData.paypalPaymentId) {
  //     return { valid: false, error: 'PayPal payment ID is required' };
  //   }
  //   return { valid: true };
  // }

  // private validateRazorpayPayment(paymentData: any): { valid: boolean; error?: string } {
  //   if (!paymentData.razorpayPaymentId) {
  //     return { valid: false, error: 'Razorpay payment ID is required' };
  //   }
  //   if (!paymentData.razorpayOrderId) {
  //     return { valid: false, error: 'Razorpay order ID is required' };
  //   }
  //   if (!paymentData.razorpaySignature) {
  //     return { valid: false, error: 'Razorpay signature is required' };
  //   }
  //   return { valid: true };
  // }

  getSupportedPaymentMethods(): PaymentMethod[] {
    const methods: PaymentMethod[] = [];
    
    if (this.config.paypal.enabled) {
      methods.push(PaymentMethod.PAYPAL);
    }
    
    if (this.config.razorpay.enabled) {
      methods.push(PaymentMethod.RAZORPAY, PaymentMethod.UPI, PaymentMethod.NET_BANKING, PaymentMethod.WALLET);
    }
    
    // If no payment methods are enabled, add a fallback
    if (methods.length === 0) {
      methods.push(PaymentMethod.CASH_ON_DELIVERY);
    }
    
    return methods;
  }

  getSupportedCurrencies(): string[] {
    return this.config.supportedCurrencies;
  }
}

export default PaymentService;