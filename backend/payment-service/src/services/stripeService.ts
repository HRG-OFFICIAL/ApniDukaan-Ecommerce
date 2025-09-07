import Stripe from 'stripe';
import { Payment, IPayment } from '../models/Payment';
import { logger } from '@shared/utils';
import { KafkaService } from './kafkaService';

export interface CreatePaymentIntentData {
  amount: number;
  currency: string;
  orderId: string;
  userId: string;
  customerId?: string;
  paymentMethodId?: string;
  metadata?: Record<string, any>;
  automaticPaymentMethods?: boolean;
}

export interface RefundPaymentData {
  paymentIntentId: string;
  amount?: number;
  reason?: string;
  metadata?: Record<string, any>;
}

export class StripeService {
  private stripe: Stripe;
  private kafkaService: KafkaService;

  constructor() {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is required');
    }

    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16'
    });

    this.kafkaService = new KafkaService();
  }

  async createPaymentIntent(data: CreatePaymentIntentData): Promise<IPayment> {
    try {
      const { amount, currency, orderId, userId, customerId, paymentMethodId, metadata, automaticPaymentMethods } = data;

      // Create Stripe PaymentIntent
      const paymentIntentData: Stripe.PaymentIntentCreateParams = {
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        customer: customerId,
        payment_method: paymentMethodId,
        metadata: {
          orderId,
          userId,
          ...metadata
        },
        automatic_payment_methods: automaticPaymentMethods ? { enabled: true } : undefined,
        confirmation_method: 'manual',
        confirm: false
      };

      const paymentIntent = await this.stripe.paymentIntents.create(paymentIntentData);

      // Create payment record in database
      const payment = new Payment({
        orderId,
        userId,
        amount,
        currency: currency.toUpperCase(),
        paymentMethod: 'stripe',
        paymentProvider: 'stripe',
        paymentIntentId: paymentIntent.id,
        status: 'pending',
        metadata: {
          stripeCustomerId: customerId,
          stripePaymentMethodId: paymentMethodId,
          ...metadata
        },
        gatewayResponse: {
          paymentIntent: {
            id: paymentIntent.id,
            client_secret: paymentIntent.client_secret,
            status: paymentIntent.status
          }
        }
      });

      await payment.save();

      logger.info('Payment intent created', {
        paymentId: payment._id,
        paymentIntentId: paymentIntent.id,
        orderId,
        amount
      });

      // Publish event
      await this.kafkaService.publishPaymentEvent('payment.intent.created', {
        paymentId: payment._id.toString(),
        orderId,
        userId,
        amount,
        currency,
        paymentMethod: 'stripe',
        paymentIntentId: paymentIntent.id
      });

      return payment;
    } catch (error) {
      logger.error('Failed to create payment intent', { error: error.message, data });
      throw new Error(`Failed to create payment intent: ${error.message}`);
    }
  }

  async confirmPaymentIntent(paymentIntentId: string, paymentMethodId?: string): Promise<IPayment> {
    try {
      const payment = await Payment.findOne({ paymentIntentId });
      if (!payment) {
        throw new Error('Payment not found');
      }

      // Update payment status to processing
      await payment.updateStatus('processing');

      const confirmData: Stripe.PaymentIntentConfirmParams = {
        payment_method: paymentMethodId,
        return_url: `${process.env.FRONTEND_URL}/payment/return`
      };

      const paymentIntent = await this.stripe.paymentIntents.confirm(
        paymentIntentId,
        confirmData
      );

      // Update payment with gateway response
      payment.gatewayResponse = {
        ...payment.gatewayResponse,
        confirmedPaymentIntent: paymentIntent
      };

      // Update status based on payment intent status
      if (paymentIntent.status === 'succeeded') {
        await payment.updateStatus('completed', {
          transactionId: paymentIntent.charges.data[0]?.id,
          completedAt: new Date()
        });
        payment.transactionId = paymentIntent.charges.data[0]?.id || '';
      } else if (paymentIntent.status === 'requires_action') {
        await payment.updateStatus('processing', {
          requiresAction: true,
          nextAction: paymentIntent.next_action
        });
      } else if (paymentIntent.status === 'canceled') {
        await payment.updateStatus('cancelled');
      }

      await payment.save();

      logger.info('Payment intent confirmed', {
        paymentId: payment._id,
        paymentIntentId,
        status: paymentIntent.status
      });

      // Publish event based on status
      if (paymentIntent.status === 'succeeded') {
        await this.kafkaService.publishPaymentEvent('payment.completed', {
          paymentId: payment._id.toString(),
          orderId: payment.orderId.toString(),
          userId: payment.userId.toString(),
          amount: payment.amount,
          transactionId: payment.transactionId
        });
      }

      return payment;
    } catch (error) {
      const payment = await Payment.findOne({ paymentIntentId });
      if (payment) {
        await payment.updateStatus('failed', { failureReason: error.message });
        await this.kafkaService.publishPaymentEvent('payment.failed', {
          paymentId: payment._id.toString(),
          orderId: payment.orderId.toString(),
          error: error.message
        });
      }

      logger.error('Failed to confirm payment intent', { error: error.message, paymentIntentId });
      throw new Error(`Failed to confirm payment intent: ${error.message}`);
    }
  }

  async refundPayment(data: RefundPaymentData): Promise<IPayment> {
    try {
      const { paymentIntentId, amount, reason = 'requested_by_customer', metadata } = data;

      const payment = await Payment.findOne({ paymentIntentId });
      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== 'completed') {
        throw new Error('Payment must be completed to process refund');
      }

      // Get the charge ID from the payment intent
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      const chargeId = paymentIntent.charges.data[0]?.id;

      if (!chargeId) {
        throw new Error('No charge found for this payment');
      }

      // Create refund in Stripe
      const refundData: Stripe.RefundCreateParams = {
        charge: chargeId,
        amount: amount ? Math.round(amount * 100) : undefined, // Convert to cents or full refund
        reason: reason as Stripe.RefundCreateParams.Reason,
        metadata: {
          orderId: payment.orderId.toString(),
          userId: payment.userId.toString(),
          ...metadata
        }
      };

      const refund = await this.stripe.refunds.create(refundData);

      // Add refund to payment record
      await payment.addRefund({
        refundId: refund.id,
        amount: refund.amount / 100, // Convert back to dollars
        reason,
        status: refund.status === 'succeeded' ? 'completed' : 'pending',
        processedAt: refund.status === 'succeeded' ? new Date() : undefined,
        metadata: {
          stripeRefundId: refund.id,
          ...metadata
        }
      });

      // Update payment status if fully refunded
      const totalRefunded = payment.totalRefundedAmount + (refund.amount / 100);
      if (totalRefunded >= payment.amount) {
        await payment.updateStatus('refunded');
      }

      logger.info('Payment refunded', {
        paymentId: payment._id,
        refundId: refund.id,
        amount: refund.amount / 100
      });

      // Publish refund event
      await this.kafkaService.publishPaymentEvent('payment.refunded', {
        paymentId: payment._id.toString(),
        orderId: payment.orderId.toString(),
        refundId: refund.id,
        refundAmount: refund.amount / 100,
        totalRefunded
      });

      return payment;
    } catch (error) {
      logger.error('Failed to process refund', { error: error.message, data });
      throw new Error(`Failed to process refund: ${error.message}`);
    }
  }

  async handleWebhook(payload: string | Buffer, signature: string): Promise<void> {
    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!webhookSecret) {
        throw new Error('STRIPE_WEBHOOK_SECRET not configured');
      }

      const event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);

      logger.info('Received Stripe webhook', {
        eventId: event.id,
        eventType: event.type
      });

      await this.processWebhookEvent(event);
    } catch (error) {
      logger.error('Failed to process Stripe webhook', { error: error.message });
      throw error;
    }
  }

  private async processWebhookEvent(event: Stripe.Event): Promise<void> {
    const { id: eventId, type: eventType, data } = event;

    try {
      switch (eventType) {
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(data.object as Stripe.PaymentIntent, eventId);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(data.object as Stripe.PaymentIntent, eventId);
          break;

        case 'charge.dispute.created':
          await this.handleChargeDispute(data.object as Stripe.Dispute, eventId);
          break;

        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSucceeded(data.object as Stripe.Invoice, eventId);
          break;

        default:
          logger.info('Unhandled webhook event type', { eventType, eventId });
      }
    } catch (error) {
      logger.error('Failed to process webhook event', {
        eventType,
        eventId,
        error: error.message
      });
      throw error;
    }
  }

  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent, eventId: string): Promise<void> {
    const payment = await Payment.findOne({ paymentIntentId: paymentIntent.id });
    
    if (payment) {
      await payment.addWebhookEvent({
        eventId,
        eventType: 'payment_intent.succeeded',
        provider: 'stripe',
        data: paymentIntent
      });

      if (payment.status !== 'completed') {
        const chargeId = paymentIntent.charges.data[0]?.id || '';
        await payment.updateStatus('completed', {
          transactionId: chargeId,
          webhookProcessed: true
        });
        
        payment.transactionId = chargeId;
        await payment.save();

        // Publish completion event
        await this.kafkaService.publishPaymentEvent('payment.completed', {
          paymentId: payment._id.toString(),
          orderId: payment.orderId.toString(),
          userId: payment.userId.toString(),
          amount: payment.amount,
          transactionId: chargeId,
          source: 'webhook'
        });
      }
    }
  }

  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent, eventId: string): Promise<void> {
    const payment = await Payment.findOne({ paymentIntentId: paymentIntent.id });
    
    if (payment) {
      await payment.addWebhookEvent({
        eventId,
        eventType: 'payment_intent.payment_failed',
        provider: 'stripe',
        data: paymentIntent
      });

      const failureReason = paymentIntent.last_payment_error?.message || 'Payment failed';
      await payment.updateStatus('failed', {
        failureReason,
        webhookProcessed: true
      });

      // Publish failure event
      await this.kafkaService.publishPaymentEvent('payment.failed', {
        paymentId: payment._id.toString(),
        orderId: payment.orderId.toString(),
        error: failureReason,
        source: 'webhook'
      });
    }
  }

  private async handleChargeDispute(dispute: Stripe.Dispute, eventId: string): Promise<void> {
    const payment = await Payment.findOne({ transactionId: dispute.charge });
    
    if (payment) {
      await payment.addWebhookEvent({
        eventId,
        eventType: 'charge.dispute.created',
        provider: 'stripe',
        data: dispute
      });

      // Publish dispute event
      await this.kafkaService.publishPaymentEvent('payment.disputed', {
        paymentId: payment._id.toString(),
        orderId: payment.orderId.toString(),
        disputeId: dispute.id,
        disputeAmount: dispute.amount / 100,
        disputeReason: dispute.reason
      });
    }
  }

  private async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice, eventId: string): Promise<void> {
    // Handle subscription payments if applicable
    logger.info('Invoice payment succeeded', {
      invoiceId: invoice.id,
      customerId: invoice.customer,
      eventId
    });
  }

  async getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      return await this.stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      logger.error('Failed to retrieve payment intent', { error: error.message, paymentIntentId });
      throw new Error(`Failed to retrieve payment intent: ${error.message}`);
    }
  }

  async createCustomer(customerData: {
    email: string;
    name?: string;
    metadata?: Record<string, any>;
  }): Promise<Stripe.Customer> {
    try {
      return await this.stripe.customers.create(customerData);
    } catch (error) {
      logger.error('Failed to create Stripe customer', { error: error.message, customerData });
      throw new Error(`Failed to create customer: ${error.message}`);
    }
  }

  async createSetupIntent(customerId: string): Promise<Stripe.SetupIntent> {
    try {
      return await this.stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
        usage: 'off_session'
      });
    } catch (error) {
      logger.error('Failed to create setup intent', { error: error.message, customerId });
      throw new Error(`Failed to create setup intent: ${error.message}`);
    }
  }
}
