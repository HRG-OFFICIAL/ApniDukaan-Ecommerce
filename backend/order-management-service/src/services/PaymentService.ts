import Stripe from 'stripe';
import paypal from 'paypal-rest-sdk';
import Decimal from 'decimal.js';
import {
  PaymentMethod,
  PaymentStatus,
  IPayment,
  IRefund,
  IPaymentRequest,
  IPaymentResponse,
  IRefundRequest,
  RefundReason
} from '../types/order.types';

// Payment gateway configuration interfaces
interface IStripeConfig {
  enabled: boolean;
  secretKey: string;
  webhookSecret: string;
  publishableKey: string;
}

interface IPayPalConfig {
  enabled: boolean;
  clientId: string;
  clientSecret: string;
  mode: 'sandbox' | 'live';
}

interface IPaymentConfig {
  stripe: IStripeConfig;
  paypal: IPayPalConfig;
  defaultCurrency: string;
  supportedCurrencies: string[];
  webhookTimeout: number;
}

class PaymentService {
  private stripe: Stripe | null = null;
  private config: IPaymentConfig;

  constructor() {
    this.config = {
      stripe: {
        enabled: process.env.STRIPE_ENABLED === 'true',
        secretKey: process.env.STRIPE_SECRET_KEY || '',
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || ''
      },
      paypal: {
        enabled: process.env.PAYPAL_ENABLED === 'true',
        clientId: process.env.PAYPAL_CLIENT_ID || '',
        clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
        mode: (process.env.PAYPAL_MODE as 'sandbox' | 'live') || 'sandbox'
      },
      defaultCurrency: 'USD',
      supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
      webhookTimeout: 30000
    };

    this.initializeGateways();
  }

  private initializeGateways(): void {
    // Initialize Stripe
    if (this.config.stripe.enabled && this.config.stripe.secretKey) {
      try {
        this.stripe = new Stripe(this.config.stripe.secretKey, {
          apiVersion: '2023-10-16',
          timeout: this.config.webhookTimeout
        });
        console.log('Stripe payment gateway initialized');
      } catch (error) {
        console.error('Failed to initialize Stripe:', error);
      }
    }

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
  }

  // ==================== PAYMENT PROCESSING ====================

  /**
   * Process payment using appropriate gateway
   */
  async processPayment(paymentRequest: IPaymentRequest): Promise<IPaymentResponse> {
    try {
      // Validate payment request
      const validation = this.validatePaymentRequest(paymentRequest);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error!,
          code: 'PAYMENT_VALIDATION_FAILED',
          message: validation.error!
        };
      }

      // Route to appropriate payment gateway
      switch (paymentRequest.method) {
        case PaymentMethod.STRIPE:
        case PaymentMethod.CREDIT_CARD:
        case PaymentMethod.DEBIT_CARD:
          return await this.processStripePayment(paymentRequest);
        
        case PaymentMethod.PAYPAL:
          return await this.processPayPalPayment(paymentRequest);
        
        case PaymentMethod.APPLE_PAY:
        case PaymentMethod.GOOGLE_PAY:
          // These would typically go through Stripe or another processor
          return await this.processStripePayment(paymentRequest);
        
        case PaymentMethod.CASH_ON_DELIVERY:
          return this.processCashOnDelivery(paymentRequest);
        
        default:
          return {
            success: false,
            error: 'Unsupported payment method',
            code: 'UNSUPPORTED_PAYMENT_METHOD',
            message: 'Unsupported payment method'
          };
      }

    } catch (error: any) {
      console.error('Error processing payment:', error);
      return {
        success: false,
        error: 'Payment processing failed',
        code: 'PAYMENT_PROCESSING_ERROR',
        message: 'Payment processing failed'
      };
    }
  }

  /**
   * Process Stripe payment
   */
  private async processStripePayment(paymentRequest: IPaymentRequest): Promise<IPaymentResponse> {
    if (!this.stripe) {
      return {
        success: false,
        error: 'Stripe not configured',
        code: 'STRIPE_NOT_CONFIGURED',
        message: 'Stripe not configured'
      };
    }

    try {
      const { orderId, amount, currency, paymentData } = paymentRequest;
      const amountInCents = new Decimal(amount).mul(100).toNumber();

      // Create payment intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amountInCents,
        currency: currency.toLowerCase(),
        payment_method: paymentData.paymentMethodId,
        confirmation_method: 'manual',
        confirm: paymentData.confirm || false,
        metadata: {
          orderId,
          ...(paymentRequest.metadata || {})
        },
        ...(paymentData.shipping && {
          shipping: {
            address: {
              line1: paymentData.shipping.address.line1,
              line2: paymentData.shipping.address.line2,
              city: paymentData.shipping.address.city,
              state: paymentData.shipping.address.state,
              postal_code: paymentData.shipping.address.postal_code,
              country: paymentData.shipping.address.country
            },
            name: paymentData.shipping.name,
            phone: paymentData.shipping.phone
          }
        }),
        receipt_email: paymentData.receiptEmail
      });

      // Handle confirmation if needed
      let finalPaymentIntent = paymentIntent;
      if (paymentData.confirm && paymentIntent.status === 'requires_confirmation') {
        finalPaymentIntent = await this.stripe.paymentIntents.confirm(paymentIntent.id, {
          return_url: paymentData.returnUrl
        });
      }

      // Determine success based on payment intent status
      const isSuccess = finalPaymentIntent.status === 'succeeded';
      
      const payment: IPayment = {
        method: PaymentMethod.STRIPE,
        provider: 'stripe',
        transactionId: finalPaymentIntent.id,
        amount,
        currency,
        status: this.mapStripeStatus(finalPaymentIntent.status),
        paidAt: isSuccess ? new Date() : new Date(),
        metadata: paymentRequest.metadata || {},
        gateway: {
          paymentIntentId: finalPaymentIntent.id,
          chargeId: (finalPaymentIntent as any).charges?.data[0]?.id,
          customerId: paymentData.customerId,
          paymentMethodId: paymentData.paymentMethodId
        },
        refunds: []
      };

      // Add card details if available
      if ((finalPaymentIntent as any).charges?.data[0]?.payment_method_details?.card) {
        const card = (finalPaymentIntent as any).charges.data[0].payment_method_details.card;
        payment.card = {
          last4: card.last4!,
          brand: card.brand!,
          expiryMonth: card.exp_month!,
          expiryYear: card.exp_year!,
          fingerprint: card.fingerprint
        };
      }

      return {
        success: isSuccess,
        message: isSuccess ? 'Payment processed successfully' : 'Payment requires additional action',
        data: {
          payment,
          ...(finalPaymentIntent.client_secret && { clientSecret: finalPaymentIntent.client_secret })
        }
      };

    } catch (error: any) {
      console.error('Stripe payment error:', error);
      
      return {
        success: false,
        error: error.message || 'Stripe payment failed',
        code: 'STRIPE_PAYMENT_FAILED',
        message: error.message || 'Stripe payment failed'
      };
    }
  }

  /**
   * Process PayPal payment
   */
  private async processPayPalPayment(paymentRequest: IPaymentRequest): Promise<IPaymentResponse> {
    if (!this.config.paypal.enabled) {
      return {
        success: false,
        error: 'PayPal not configured',
        code: 'PAYPAL_NOT_CONFIGURED',
        message: 'PayPal not configured'
      };
    }

    try {
      const { orderId, amount, currency, paymentData } = paymentRequest;

      // Create PayPal payment
      const paymentConfig = {
        intent: 'sale',
        payer: {
          payment_method: 'paypal'
        },
        redirect_urls: {
          return_url: paymentData.returnUrl || `${process.env.BASE_URL}/payment/success`,
          cancel_url: paymentData.cancelUrl || `${process.env.BASE_URL}/payment/cancel`
        },
        transactions: [{
          amount: {
            total: amount.toFixed(2),
            currency: currency
          },
          description: `Order ${orderId}`,
          custom: orderId,
          item_list: {
            items: paymentData.items || []
          }
        }]
      };

      return new Promise((resolve) => {
        paypal.payment.create(paymentConfig, (error: any, payment: any) => {
          if (error) {
            console.error('PayPal payment error:', error);
            resolve({
              success: false,
              error: error.message || 'PayPal payment failed',
              code: 'PAYPAL_PAYMENT_FAILED',
              message: error.message || 'PayPal payment failed'
            });
          } else {
            const approvalUrl = payment.links.find((link: any) => link.rel === 'approval_url')?.href;
            
            const paymentRecord: IPayment = {
              method: PaymentMethod.PAYPAL,
              provider: 'paypal',
              transactionId: payment.id,
              amount,
              currency,
              status: PaymentStatus.PENDING,
              metadata: paymentRequest.metadata || {},
              gateway: {
                paymentIntentId: payment.id
              },
              refunds: []
            };

            resolve({
              success: true,
              message: 'PayPal payment created successfully',
              data: {
                payment: paymentRecord,
                redirectUrl: approvalUrl
              }
            });
          }
        });
      });

    } catch (error: any) {
      console.error('PayPal payment error:', error);
      return {
        success: false,
        error: error.message || 'PayPal payment failed',
        code: 'PAYPAL_PAYMENT_FAILED',
        message: error.message || 'PayPal payment failed'
      };
    }
  }

  /**
   * Process cash on delivery payment
   */
  private processCashOnDelivery(paymentRequest: IPaymentRequest): IPaymentResponse {
    const payment: IPayment = {
      method: PaymentMethod.CASH_ON_DELIVERY,
      provider: 'cod',
      amount: paymentRequest.amount,
      currency: paymentRequest.currency,
      status: PaymentStatus.PENDING,
      metadata: paymentRequest.metadata || {},
      refunds: []
    };

    return {
      success: true,
      message: 'Cash on delivery payment recorded',
      data: { payment }
    };
  }

  /**
   * Execute PayPal payment after approval
   */
  async executePayPalPayment(paymentId: string, payerId: string): Promise<IPaymentResponse> {
    return new Promise((resolve) => {
      const executePayment = {
        payer_id: payerId
      };

      paypal.payment.execute(paymentId, executePayment, (error: any, payment: any) => {
        if (error) {
          console.error('PayPal execution error:', error);
          resolve({
            success: false,
            error: error.message || 'PayPal payment execution failed',
            code: 'PAYPAL_EXECUTION_FAILED',
            message: error.message || 'PayPal payment execution failed'
          });
        } else {
          const updatedPayment: Partial<IPayment> = {
            status: PaymentStatus.COMPLETED,
            paidAt: new Date(),
            transactionId: payment.transactions[0].related_resources[0].sale.id,
            gateway: {
              paymentIntentId: payment.id,
              chargeId: payment.transactions[0].related_resources[0].sale.id
            }
          };

          resolve({
            success: true,
            message: 'PayPal payment executed successfully',
            data: { payment: updatedPayment as IPayment }
          });
        }
      });
    });
  }

  // ==================== REFUND PROCESSING ====================

  /**
   * Process refund
   */
  async processRefund(refundRequest: IRefundRequest): Promise<{ success: boolean; refund?: IRefund; error?: string }> {
    try {
      // Get payment details to determine gateway
      const payment = await this.getPaymentDetails(refundRequest.paymentId);
      if (!payment) {
        return {
          success: false,
          error: 'Payment not found'
        };
      }

      // Route to appropriate gateway
      switch (payment.provider) {
        case 'stripe':
          return await this.processStripeRefund(payment, refundRequest);
        
        case 'paypal':
          return await this.processPayPalRefund(payment, refundRequest);
        
        default:
          return {
            success: false,
            error: 'Refunds not supported for this payment method'
          };
      }

    } catch (error: any) {
      console.error('Error processing refund:', error);
      return {
        success: false,
        error: 'Refund processing failed'
      };
    }
  }

  /**
   * Process Stripe refund
   */
  private async processStripeRefund(payment: IPayment, refundRequest: IRefundRequest): Promise<{ success: boolean; refund?: IRefund; error?: string }> {
    if (!this.stripe) {
      return {
        success: false,
        error: 'Stripe not configured'
      };
    }

    try {
      const amountInCents = new Decimal(refundRequest.amount).mul(100).toNumber();

      const refund = await this.stripe.refunds.create({
        payment_intent: payment.gateway?.paymentIntentId || '',
        amount: amountInCents,
        reason: this.mapRefundReasonToStripe(refundRequest.reason),
        metadata: {
          orderId: refundRequest.orderId,
          originalPaymentId: refundRequest.paymentId,
          ...(refundRequest.metadata || {})
        }
      });

      const refundRecord: IRefund = {
        amount: refundRequest.amount,
        currency: payment.currency, // <- corrected: use payment.currency
        reason: refundRequest.reason,
        description: refundRequest.description || '',
        refundId: refund.id,
        status: refund.status === 'succeeded' ? 'completed' : 'processing',
        processedAt: refund.status === 'succeeded' ? new Date() : new Date(), // ensure Date type
        metadata: refundRequest.metadata || {}
      };

      return {
        success: true,
        refund: refundRecord
      };

    } catch (error: any) {
      console.error('Stripe refund error:', error);
      return {
        success: false,
        error: error.message || 'Stripe refund failed'
      };
    }
  }

  /**
   * Process PayPal refund
   */
  private async processPayPalRefund(payment: IPayment, refundRequest: IRefundRequest): Promise<{ success: boolean; refund?: IRefund; error?: string }> {
    return new Promise((resolve) => {
      const refundData = {
        amount: {
          total: refundRequest.amount.toFixed(2),
          currency: payment.currency
        },
        reason: refundRequest.description || 'Refund requested'
      };

      paypal.sale.refund(payment.gateway?.chargeId!, refundData, (error: any, refund: any) => {
        if (error) {
          console.error('PayPal refund error:', error);
          resolve({
            success: false,
            error: error.message || 'PayPal refund failed'
          });
        } else {
          const refundRecord: IRefund = {
            amount: refundRequest.amount,
            currency: payment.currency,
            reason: refundRequest.reason,
            description: refundRequest.description || '',
            refundId: refund.id,
            status: refund.state === 'completed' ? 'completed' : 'processing',
            // Make processedAt always a Date to satisfy type expectations
            processedAt: refund.state === 'completed' ? new Date() : new Date(),
            metadata: refundRequest.metadata || {}
          };

          resolve({
            success: true,
            refund: refundRecord
          });
        }
      });
    });
  }

  // ==================== WEBHOOK HANDLING ====================

  /**
   * Handle Stripe webhooks
   */
  async handleStripeWebhook(payload: string, signature: string): Promise<{ success: boolean; event?: any; error?: string }> {
    if (!this.stripe) {
      return {
        success: false,
        error: 'Stripe not configured'
      };
    }

    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.config.stripe.webhookSecret
      );

      // Process different event types
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;
        
        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
          break;
        
        case 'charge.dispute.created':
          await this.handleChargeDispute(event.data.object as Stripe.Dispute);
          break;
        
        default:
          console.log(`Unhandled Stripe webhook event type: ${event.type}`);
      }

      return {
        success: true,
        event
      };

    } catch (error: any) {
      console.error('Stripe webhook error:', error);
      return {
        success: false,
        error: error.message || 'Webhook processing failed'
      };
    }
  }

  /**
   * Handle PayPal webhooks
   */
  async handlePayPalWebhook(payload: any): Promise<{ success: boolean; event?: any; error?: string }> {
    try {
      // PayPal webhook verification would go here
      const eventType = payload.event_type;

      switch (eventType) {
        case 'PAYMENT.CAPTURE.COMPLETED':
          await this.handlePayPalPaymentCompleted(payload.resource);
          break;
        
        case 'PAYMENT.CAPTURE.DENIED':
          await this.handlePayPalPaymentDenied(payload.resource);
          break;
        
        default:
          console.log(`Unhandled PayPal webhook event type: ${eventType}`);
      }

      return {
        success: true,
        event: payload
      };

    } catch (error: any) {
      console.error('PayPal webhook error:', error);
      return {
        success: false,
        error: error.message || 'PayPal webhook processing failed'
      };
    }
  }

  // ==================== VALIDATION & UTILITIES ====================

  /**
   * Validate payment method
   */
  async validatePaymentMethod(method: PaymentMethod, paymentData: any): Promise<{ isValid: boolean; error?: string }> {
    switch (method) {
      case PaymentMethod.STRIPE:
      case PaymentMethod.CREDIT_CARD:
      case PaymentMethod.DEBIT_CARD:
        return this.validateStripePayment(paymentData);
      
      case PaymentMethod.PAYPAL:
        return this.validatePayPalPayment(paymentData);
      
      case PaymentMethod.CASH_ON_DELIVERY:
        return { isValid: true };
      
      default:
        return {
          isValid: false,
          error: 'Unsupported payment method'
        };
    }
  }

  /**
   * Validate Stripe payment data
   */
  private validateStripePayment(paymentData: any): { isValid: boolean; error?: string } {
    if (!this.stripe) {
      return {
        isValid: false,
        error: 'Stripe not configured'
      };
    }

    if (!paymentData.paymentMethodId) {
      return {
        isValid: false,
        error: 'Payment method ID is required for Stripe'
      };
    }

    return { isValid: true };
  }

  /**
   * Validate PayPal payment data
   */
  private validatePayPalPayment(paymentData: any): { isValid: boolean; error?: string } {
    if (!this.config.paypal.enabled) {
      return {
        isValid: false,
        error: 'PayPal not configured'
      };
    }

    if (!paymentData.returnUrl || !paymentData.cancelUrl) {
      return {
        isValid: false,
        error: 'Return and cancel URLs are required for PayPal'
      };
    }

    return { isValid: true };
  }

  /**
   * Validate payment request
   */
  private validatePaymentRequest(request: IPaymentRequest): { isValid: boolean; error?: string } {
    if (!request.orderId) {
      return {
        isValid: false,
        error: 'Order ID is required'
      };
    }

    if (!request.amount || request.amount <= 0) {
      return {
        isValid: false,
        error: 'Valid amount is required'
      };
    }

    if (!this.config.supportedCurrencies.includes(request.currency)) {
      return {
        isValid: false,
        error: `Currency ${request.currency} not supported`
      };
    }

    return { isValid: true };
  }

  // ==================== HELPER METHODS ====================

  /**
   * Map Stripe payment intent status to internal status
   */
  private mapStripeStatus(stripeStatus: string): PaymentStatus {
    switch (stripeStatus) {
      case 'succeeded':
        return PaymentStatus.COMPLETED;
      case 'processing':
        return PaymentStatus.PROCESSING;
      case 'requires_payment_method':
      case 'requires_confirmation':
      case 'requires_action':
        return PaymentStatus.PENDING;
      case 'canceled':
        return PaymentStatus.CANCELLED;
      default:
        return PaymentStatus.FAILED;
    }
  }

  /**
   * Map refund reason to Stripe format
   */
  private mapRefundReasonToStripe(reason: RefundReason): 'duplicate' | 'fraudulent' | 'requested_by_customer' {
    switch (reason) {
      case RefundReason.CUSTOMER_REQUEST:
        return 'requested_by_customer';
      case RefundReason.DEFECTIVE:
      case RefundReason.DAMAGED_ITEM:
      case RefundReason.NOT_AS_DESCRIBED:
        return 'requested_by_customer';
      default:
        return 'requested_by_customer';
    }
  }

  /**
   * Get payment details (mock implementation)
   */
  private async getPaymentDetails(paymentId: string): Promise<IPayment | null> {
    // This would typically query the database
    // For now, return a mock payment
    return {
      method: PaymentMethod.STRIPE,
      provider: 'stripe',
      transactionId: paymentId,
      amount: 100,
      currency: 'USD',
      status: PaymentStatus.COMPLETED,
      gateway: {
        paymentIntentId: paymentId
      },
      refunds: []
    };
  }

  // ==================== WEBHOOK EVENT HANDLERS ====================

  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    console.log(`Payment succeeded: ${paymentIntent.id}`);
    // Update order status, send confirmation email, etc.
  }

  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    console.log(`Payment failed: ${paymentIntent.id}`);
    // Update order status, send failure notification, etc.
  }

  private async handleChargeDispute(dispute: Stripe.Dispute): Promise<void> {
    console.log(`Charge dispute created: ${dispute.id}`);
    // Handle dispute process
  }

  private async handlePayPalPaymentCompleted(resource: any): Promise<void> {
    console.log(`PayPal payment completed: ${resource.id}`);
    // Update order status
  }

  private async handlePayPalPaymentDenied(resource: any): Promise<void> {
    console.log(`PayPal payment denied: ${resource.id}`);
    // Update order status
  }
}

export default PaymentService;