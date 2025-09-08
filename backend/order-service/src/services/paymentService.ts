import Stripe from 'stripe';
import axios from 'axios';
import crypto from 'crypto';
import { Order, IOrderDocument } from '../models/Order';
import { OrderStatus, PaymentStatus, logger } from '@shopsphere/shared';
import { kafkaService } from './kafkaService';
import { orderService } from './orderService';

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  clientSecret?: string;
  metadata?: Record<string, any>;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'bank_transfer';
  details: Record<string, any>;
}

export interface RefundRequest {
  amount?: number; // If not provided, full refund
  reason: string;
  metadata?: Record<string, any>;
}

export interface PaymentWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
  created: number;
}

class PaymentService {
  private stripe: Stripe;
  private paypalClientId: string;
  private paypalClientSecret: string;
  private webhookSecrets: {
    stripe: string;
    paypal: string;
  };

  constructor() {
    // Initialize Stripe
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      logger.warn('Stripe secret key not configured. Stripe payments will be disabled.');
    } else {
      this.stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2023-10-16',
        typescript: true
      });
    }

    // Initialize PayPal
    this.paypalClientId = process.env.PAYPAL_CLIENT_ID || '';
    this.paypalClientSecret = process.env.PAYPAL_CLIENT_SECRET || '';

    if (!this.paypalClientId || !this.paypalClientSecret) {
      logger.warn('PayPal credentials not configured. PayPal payments will be disabled.');
    }

    // Webhook secrets
    this.webhookSecrets = {
      stripe: process.env.STRIPE_WEBHOOK_SECRET || '',
      paypal: process.env.PAYPAL_WEBHOOK_SECRET || ''
    };
  }

  /**
   * Create payment intent for Stripe
   */
  async createStripePaymentIntent(
    orderId: string,
    amount: number,
    currency: string = 'usd',
    metadata?: Record<string, any>
  ): Promise<PaymentIntent> {
    try {
      if (!this.stripe) {
        throw new Error('Stripe is not configured');
      }

      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Stripe expects cents
        currency: currency.toLowerCase(),
        metadata: {
          orderId,
          orderNumber: order.orderNumber,
          ...metadata
        },
        automatic_payment_methods: {
          enabled: true
        },
        description: `Payment for order ${order.orderNumber}`
      });

      // Update order with payment intent ID
      order.paymentIntentId = paymentIntent.id;
      await order.save();

      logger.info('Stripe payment intent created', {
        orderId,
        paymentIntentId: paymentIntent.id,
        amount,
        currency,
        action: 'create_stripe_payment_intent'
      });

      return {
        id: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        clientSecret: paymentIntent.client_secret,
        metadata: paymentIntent.metadata
      };

    } catch (error) {
      logger.error('Failed to create Stripe payment intent', {
        orderId,
        amount,
        currency,
        error: error.message,
        action: 'create_stripe_payment_intent'
      });
      throw error;
    }
  }

  /**
   * Confirm Stripe payment intent
   */
  async confirmStripePaymentIntent(
    paymentIntentId: string,
    paymentMethodId: string
  ): Promise<PaymentIntent> {
    try {
      if (!this.stripe) {
        throw new Error('Stripe is not configured');
      }

      const paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentMethodId
      });

      logger.info('Stripe payment intent confirmed', {
        paymentIntentId,
        status: paymentIntent.status,
        action: 'confirm_stripe_payment_intent'
      });

      return {
        id: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        metadata: paymentIntent.metadata
      };

    } catch (error) {
      logger.error('Failed to confirm Stripe payment intent', {
        paymentIntentId,
        paymentMethodId,
        error: error.message,
        action: 'confirm_stripe_payment_intent'
      });
      throw error;
    }
  }

  /**
   * Create PayPal payment
   */
  async createPayPalPayment(
    orderId: string,
    amount: number,
    currency: string = 'USD',
    returnUrl: string,
    cancelUrl: string
  ): Promise<{ id: string; approvalUrl: string }> {
    try {
      if (!this.paypalClientId || !this.paypalClientSecret) {
        throw new Error('PayPal is not configured');
      }

      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      // Get PayPal access token
      const accessToken = await this.getPayPalAccessToken();

      // Create payment
      const paymentData = {
        intent: 'sale',
        payer: {
          payment_method: 'paypal'
        },
        redirect_urls: {
          return_url: returnUrl,
          cancel_url: cancelUrl
        },
        transactions: [{
          amount: {
            total: amount.toFixed(2),
            currency
          },
          description: `Payment for order ${order.orderNumber}`,
          custom: orderId,
          item_list: {
            items: order.items.map(item => ({
              name: item.productName,
              sku: item.sku,
              price: item.price.toFixed(2),
              currency,
              quantity: item.quantity
            }))
          }
        }]
      };

      const response = await axios.post(
        `${this.getPayPalBaseUrl()}/v1/payments/payment`,
        paymentData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      const payment = response.data;
      const approvalUrl = payment.links.find((link: any) => link.rel === 'approval_url')?.href;

      if (!approvalUrl) {
        throw new Error('PayPal approval URL not found');
      }

      // Update order with payment ID
      order.paymentIntentId = payment.id;
      await order.save();

      logger.info('PayPal payment created', {
        orderId,
        paymentId: payment.id,
        approvalUrl,
        amount,
        currency,
        action: 'create_paypal_payment'
      });

      return {
        id: payment.id,
        approvalUrl
      };

    } catch (error) {
      logger.error('Failed to create PayPal payment', {
        orderId,
        amount,
        currency,
        error: error.message,
        action: 'create_paypal_payment'
      });
      throw error;
    }
  }

  /**
   * Execute PayPal payment
   */
  async executePayPalPayment(paymentId: string, payerId: string): Promise<any> {
    try {
      const accessToken = await this.getPayPalAccessToken();

      const response = await axios.post(
        `${this.getPayPalBaseUrl()}/v1/payments/payment/${paymentId}/execute`,
        { payer_id: payerId },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      const executedPayment = response.data;

      logger.info('PayPal payment executed', {
        paymentId,
        payerId,
        state: executedPayment.state,
        action: 'execute_paypal_payment'
      });

      return executedPayment;

    } catch (error) {
      logger.error('Failed to execute PayPal payment', {
        paymentId,
        payerId,
        error: error.message,
        action: 'execute_paypal_payment'
      });
      throw error;
    }
  }

  /**
   * Process cash on delivery payment
   */
  async processCashOnDeliveryPayment(orderId: string): Promise<void> {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      // For COD, we just confirm the order and set payment status to pending
      order.status = OrderStatus.CONFIRMED;
      order.paymentStatus = PaymentStatus.PENDING; // Will be paid on delivery
      await order.save();

      // Publish order confirmed event
      await kafkaService.publishOrderEvent({
        type: 'ORDER_CONFIRMED',
        orderId,
        userId: order.user.toString(),
        data: {
          orderNumber: order.orderNumber,
          paymentMethod: 'cash_on_delivery'
        },
        timestamp: new Date()
      });

      logger.info('Cash on delivery payment processed', {
        orderId,
        orderNumber: order.orderNumber,
        action: 'process_cod_payment'
      });

    } catch (error) {
      logger.error('Failed to process COD payment', {
        orderId,
        error: error.message,
        action: 'process_cod_payment'
      });
      throw error;
    }
  }

  /**
   * Create refund
   */
  async createRefund(
    orderId: string,
    refundRequest: RefundRequest
  ): Promise<{ id: string; amount: number; status: string }> {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      if (!order.paymentIntentId) {
        throw new Error('No payment intent found for this order');
      }

      const refundAmount = refundRequest.amount || order.total;

      let refund;
      if (order.paymentMethod === 'stripe') {
        refund = await this.createStripeRefund(order.paymentIntentId, refundAmount, refundRequest);
      } else if (order.paymentMethod === 'paypal') {
        refund = await this.createPayPalRefund(order.paymentIntentId, refundAmount, refundRequest);
      } else {
        throw new Error(`Refunds not supported for payment method: ${order.paymentMethod}`);
      }

      // Update order with refund info
      order.refunds.push({
        amount: refundAmount,
        reason: refundRequest.reason,
        refundId: refund.id,
        processedAt: new Date()
      });

      // Update order status if fully refunded
      if (refundAmount >= order.total) {
        order.status = OrderStatus.REFUNDED;
      }

      await order.save();

      logger.info('Refund processed', {
        orderId,
        refundId: refund.id,
        amount: refundAmount,
        reason: refundRequest.reason,
        action: 'create_refund'
      });

      return refund;

    } catch (error) {
      logger.error('Failed to create refund', {
        orderId,
        refundRequest,
        error: error.message,
        action: 'create_refund'
      });
      throw error;
    }
  }

  /**
   * Handle Stripe webhook
   */
  async handleStripeWebhook(
    payload: string,
    signature: string
  ): Promise<void> {
    try {
      if (!this.stripe || !this.webhookSecrets.stripe) {
        throw new Error('Stripe webhook not configured');
      }

      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.webhookSecrets.stripe
      );

      logger.info('Stripe webhook received', {
        eventType: event.type,
        eventId: event.id,
        action: 'handle_stripe_webhook'
      });

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handleStripePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;

        case 'payment_intent.payment_failed':
          await this.handleStripePaymentFailed(event.data.object as Stripe.PaymentIntent);
          break;

        case 'payment_intent.canceled':
          await this.handleStripePaymentCanceled(event.data.object as Stripe.PaymentIntent);
          break;

        case 'charge.dispute.created':
          await this.handleStripeDisputeCreated(event.data.object as Stripe.Dispute);
          break;

        default:
          logger.info('Unhandled Stripe webhook event type', {
            eventType: event.type,
            eventId: event.id
          });
      }

    } catch (error) {
      logger.error('Failed to handle Stripe webhook', {
        error: error.message,
        action: 'handle_stripe_webhook'
      });
      throw error;
    }
  }

  /**
   * Handle PayPal webhook
   */
  async handlePayPalWebhook(
    payload: string,
    headers: Record<string, string>
  ): Promise<void> {
    try {
      // Verify PayPal webhook signature
      const isValid = await this.verifyPayPalWebhookSignature(payload, headers);
      if (!isValid) {
        throw new Error('Invalid PayPal webhook signature');
      }

      const event = JSON.parse(payload);

      logger.info('PayPal webhook received', {
        eventType: event.event_type,
        eventId: event.id,
        action: 'handle_paypal_webhook'
      });

      switch (event.event_type) {
        case 'PAYMENT.SALE.COMPLETED':
          await this.handlePayPalPaymentCompleted(event);
          break;

        case 'PAYMENT.SALE.DENIED':
          await this.handlePayPalPaymentDenied(event);
          break;

        case 'PAYMENT.SALE.REFUNDED':
          await this.handlePayPalPaymentRefunded(event);
          break;

        default:
          logger.info('Unhandled PayPal webhook event type', {
            eventType: event.event_type,
            eventId: event.id
          });
      }

    } catch (error) {
      logger.error('Failed to handle PayPal webhook', {
        error: error.message,
        action: 'handle_paypal_webhook'
      });
      throw error;
    }
  }

  // Private helper methods

  private async createStripeRefund(
    paymentIntentId: string,
    amount: number,
    refundRequest: RefundRequest
  ): Promise<{ id: string; amount: number; status: string }> {
    const refund = await this.stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: Math.round(amount * 100), // Convert to cents
      reason: 'requested_by_customer',
      metadata: refundRequest.metadata
    });

    return {
      id: refund.id,
      amount: refund.amount / 100,
      status: refund.status
    };
  }

  private async createPayPalRefund(
    paymentId: string,
    amount: number,
    refundRequest: RefundRequest
  ): Promise<{ id: string; amount: number; status: string }> {
    const accessToken = await this.getPayPalAccessToken();

    const response = await axios.post(
      `${this.getPayPalBaseUrl()}/v1/payments/sale/${paymentId}/refund`,
      {
        amount: {
          total: amount.toFixed(2),
          currency: 'USD'
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    const refund = response.data;

    return {
      id: refund.id,
      amount: parseFloat(refund.amount.total),
      status: refund.state
    };
  }

  private async getPayPalAccessToken(): Promise<string> {
    const response = await axios.post(
      `${this.getPayPalBaseUrl()}/v1/oauth2/token`,
      'grant_type=client_credentials',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${this.paypalClientId}:${this.paypalClientSecret}`).toString('base64')}`
        }
      }
    );

    return response.data.access_token;
  }

  private getPayPalBaseUrl(): string {
    return process.env.NODE_ENV === 'production'
      ? 'https://api.paypal.com'
      : 'https://api.sandbox.paypal.com';
  }

  private async verifyPayPalWebhookSignature(
    payload: string,
    headers: Record<string, string>
  ): Promise<boolean> {
    // PayPal webhook signature verification
    // This is a simplified version - in production, you'd implement proper verification
    return true;
  }

  // Stripe webhook handlers

  private async handleStripePaymentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    try {
      const orderId = paymentIntent.metadata?.orderId;
      if (!orderId) {
        logger.warn('No order ID in payment intent metadata', {
          paymentIntentId: paymentIntent.id
        });
        return;
      }

      await orderService.handlePaymentCompleted(orderId, {
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency
      });

    } catch (error) {
      logger.error('Error handling Stripe payment succeeded', {
        paymentIntentId: paymentIntent.id,
        error: error.message
      });
    }
  }

  private async handleStripePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    try {
      const orderId = paymentIntent.metadata?.orderId;
      if (!orderId) {
        return;
      }

      await orderService.handlePaymentFailed(orderId, {
        paymentIntentId: paymentIntent.id,
        error: paymentIntent.last_payment_error
      });

    } catch (error) {
      logger.error('Error handling Stripe payment failed', {
        paymentIntentId: paymentIntent.id,
        error: error.message
      });
    }
  }

  private async handleStripePaymentCanceled(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    try {
      const orderId = paymentIntent.metadata?.orderId;
      if (!orderId) {
        return;
      }

      await orderService.handlePaymentFailed(orderId, {
        paymentIntentId: paymentIntent.id,
        error: 'Payment was canceled'
      });

    } catch (error) {
      logger.error('Error handling Stripe payment canceled', {
        paymentIntentId: paymentIntent.id,
        error: error.message
      });
    }
  }

  private async handleStripeDisputeCreated(dispute: Stripe.Dispute): Promise<void> {
    try {
      const chargeId = dispute.charge as string;
      // Handle dispute - notify admin, update order status, etc.

      logger.warn('Stripe dispute created', {
        disputeId: dispute.id,
        chargeId,
        amount: dispute.amount / 100,
        reason: dispute.reason
      });

    } catch (error) {
      logger.error('Error handling Stripe dispute created', {
        disputeId: dispute.id,
        error: error.message
      });
    }
  }

  // PayPal webhook handlers

  private async handlePayPalPaymentCompleted(event: any): Promise<void> {
    try {
      const resource = event.resource;
      const orderId = resource.custom; // We stored the order ID in custom field

      if (!orderId) {
        logger.warn('No order ID in PayPal payment resource', {
          paymentId: resource.id
        });
        return;
      }

      await orderService.handlePaymentCompleted(orderId, {
        paymentIntentId: resource.parent_payment,
        amount: parseFloat(resource.amount.total),
        currency: resource.amount.currency
      });

    } catch (error) {
      logger.error('Error handling PayPal payment completed', {
        eventId: event.id,
        error: error.message
      });
    }
  }

  private async handlePayPalPaymentDenied(event: any): Promise<void> {
    try {
      const resource = event.resource;
      const orderId = resource.custom;

      if (!orderId) {
        return;
      }

      await orderService.handlePaymentFailed(orderId, {
        paymentIntentId: resource.parent_payment,
        error: 'PayPal payment was denied'
      });

    } catch (error) {
      logger.error('Error handling PayPal payment denied', {
        eventId: event.id,
        error: error.message
      });
    }
  }

  private async handlePayPalPaymentRefunded(event: any): Promise<void> {
    try {
      const resource = event.resource;
      const saleId = resource.sale_id;

      // Find the order by payment intent ID
      const order = await Order.findOne({ paymentIntentId: saleId });
      if (!order) {
        logger.warn('Order not found for PayPal refund', { saleId });
        return;
      }

      await orderService.handlePaymentRefunded(order._id, {
        refundId: resource.id,
        amount: parseFloat(resource.amount.total),
        reason: 'PayPal refund processed'
      });

    } catch (error) {
      logger.error('Error handling PayPal payment refunded', {
        eventId: event.id,
        error: error.message
      });
    }
  }
}

export const paymentService = new PaymentService();
