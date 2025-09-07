import * as paypal from '@paypal/checkout-server-sdk';
import { Payment, IPayment } from '../models/Payment';
import { logger } from '@shared/utils';
import { KafkaService } from './kafkaService';

export interface CreatePayPalOrderData {
  amount: number;
  currency: string;
  orderId: string;
  userId: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface CapturePayPalOrderData {
  paypalOrderId: string;
  metadata?: Record<string, any>;
}

export class PayPalService {
  private client: paypal.core.PayPalHttpClient;
  private kafkaService: KafkaService;

  constructor() {
    const environment = process.env.PAYPAL_MODE === 'production' 
      ? new paypal.core.LiveEnvironment(
          process.env.PAYPAL_CLIENT_ID!,
          process.env.PAYPAL_CLIENT_SECRET!
        )
      : new paypal.core.SandboxEnvironment(
          process.env.PAYPAL_CLIENT_ID!,
          process.env.PAYPAL_CLIENT_SECRET!
        );

    this.client = new paypal.core.PayPalHttpClient(environment);
    this.kafkaService = new KafkaService();

    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      throw new Error('PayPal credentials are required');
    }
  }

  async createOrder(data: CreatePayPalOrderData): Promise<IPayment> {
    try {
      const { amount, currency, orderId, userId, description, metadata } = data;

      // Create PayPal order
      const request = new paypal.orders.OrdersCreateRequest();
      request.prefer('return=representation');
      request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: orderId,
          description: description || `Order ${orderId}`,
          amount: {
            currency_code: currency.toUpperCase(),
            value: amount.toFixed(2)
          },
          custom_id: orderId
        }],
        application_context: {
          brand_name: 'ShopSphere',
          landing_page: 'NO_PREFERENCE',
          user_action: 'PAY_NOW',
          return_url: `${process.env.FRONTEND_URL}/payment/success`,
          cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`
        }
      });

      const response = await this.client.execute(request);
      const paypalOrder = response.result;

      // Create payment record in database
      const payment = new Payment({
        orderId,
        userId,
        amount,
        currency: currency.toUpperCase(),
        paymentMethod: 'paypal',
        paymentProvider: 'paypal',
        paymentIntentId: paypalOrder.id,
        status: 'pending',
        metadata: {
          paypalOrderId: paypalOrder.id,
          description,
          ...metadata
        },
        gatewayResponse: {
          paypalOrder: {
            id: paypalOrder.id,
            status: paypalOrder.status,
            links: paypalOrder.links
          }
        }
      });

      await payment.save();

      logger.info('PayPal order created', {
        paymentId: payment._id,
        paypalOrderId: paypalOrder.id,
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
        paymentMethod: 'paypal',
        paymentIntentId: paypalOrder.id
      });

      return payment;
    } catch (error) {
      logger.error('Failed to create PayPal order', { error: error.message, data });
      throw new Error(`Failed to create PayPal order: ${error.message}`);
    }
  }

  async captureOrder(data: CapturePayPalOrderData): Promise<IPayment> {
    try {
      const { paypalOrderId, metadata } = data;

      const payment = await Payment.findOne({ paymentIntentId: paypalOrderId });
      if (!payment) {
        throw new Error('Payment not found');
      }

      // Update payment status to processing
      await payment.updateStatus('processing');

      // Capture PayPal order
      const request = new paypal.orders.OrdersCaptureRequest(paypalOrderId);
      request.requestBody({});

      const response = await this.client.execute(request);
      const capturedOrder = response.result;

      // Update payment with capture details
      payment.gatewayResponse = {
        ...payment.gatewayResponse,
        capturedOrder
      };

      // Extract transaction details
      const capture = capturedOrder.purchase_units?.[0]?.payments?.captures?.[0];
      
      if (capture && capture.status === 'COMPLETED') {
        await payment.updateStatus('completed', {
          transactionId: capture.id,
          completedAt: new Date(),
          captureDetails: capture,
          ...metadata
        });
        payment.transactionId = capture.id;

        logger.info('PayPal order captured', {
          paymentId: payment._id,
          paypalOrderId,
          captureId: capture.id,
          amount: capture.amount.value
        });

        // Publish completion event
        await this.kafkaService.publishPaymentEvent('payment.completed', {
          paymentId: payment._id.toString(),
          orderId: payment.orderId.toString(),
          userId: payment.userId.toString(),
          amount: payment.amount,
          transactionId: capture.id
        });
      } else {
        await payment.updateStatus('failed', { 
          failureReason: 'Capture failed or incomplete',
          captureStatus: capture?.status 
        });

        // Publish failure event
        await this.kafkaService.publishPaymentEvent('payment.failed', {
          paymentId: payment._id.toString(),
          orderId: payment.orderId.toString(),
          error: 'Capture failed or incomplete'
        });
      }

      await payment.save();
      return payment;
    } catch (error) {
      const payment = await Payment.findOne({ paymentIntentId: data.paypalOrderId });
      if (payment) {
        await payment.updateStatus('failed', { failureReason: error.message });
        await this.kafkaService.publishPaymentEvent('payment.failed', {
          paymentId: payment._id.toString(),
          orderId: payment.orderId.toString(),
          error: error.message
        });
      }

      logger.error('Failed to capture PayPal order', { error: error.message, data });
      throw new Error(`Failed to capture PayPal order: ${error.message}`);
    }
  }

  async refundCapture(captureId: string, amount?: number, metadata?: Record<string, any>): Promise<IPayment> {
    try {
      const payment = await Payment.findOne({ transactionId: captureId });
      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== 'completed') {
        throw new Error('Payment must be completed to process refund');
      }

      // Create refund request
      const request = new paypal.payments.CapturesRefundRequest(captureId);
      const refundData: any = {
        note_to_payer: 'Refund processed by ShopSphere'
      };

      if (amount) {
        refundData.amount = {
          currency_code: payment.currency,
          value: amount.toFixed(2)
        };
      }

      request.requestBody(refundData);

      const response = await this.client.execute(request);
      const refund = response.result;

      // Add refund to payment record
      await payment.addRefund({
        refundId: refund.id,
        amount: parseFloat(refund.amount?.value || payment.amount.toString()),
        reason: 'requested_by_customer',
        status: refund.status === 'COMPLETED' ? 'completed' : 'pending',
        processedAt: refund.status === 'COMPLETED' ? new Date() : undefined,
        metadata: {
          paypalRefundId: refund.id,
          paypalStatus: refund.status,
          ...metadata
        }
      });

      // Update payment status if fully refunded
      const refundAmount = parseFloat(refund.amount?.value || payment.amount.toString());
      const totalRefunded = payment.totalRefundedAmount + refundAmount;
      
      if (totalRefunded >= payment.amount) {
        await payment.updateStatus('refunded');
      }

      logger.info('PayPal capture refunded', {
        paymentId: payment._id,
        captureId,
        refundId: refund.id,
        amount: refundAmount
      });

      // Publish refund event
      await this.kafkaService.publishPaymentEvent('payment.refunded', {
        paymentId: payment._id.toString(),
        orderId: payment.orderId.toString(),
        refundId: refund.id,
        refundAmount,
        totalRefunded
      });

      return payment;
    } catch (error) {
      logger.error('Failed to process PayPal refund', { error: error.message, captureId });
      throw new Error(`Failed to process refund: ${error.message}`);
    }
  }

  async handleWebhook(headers: Record<string, string>, body: any): Promise<void> {
    try {
      // Verify webhook signature (simplified - in production, implement full verification)
      const eventType = body.event_type;
      const resource = body.resource;

      logger.info('Received PayPal webhook', {
        eventId: body.id,
        eventType,
        resourceId: resource?.id
      });

      await this.processWebhookEvent(body);
    } catch (error) {
      logger.error('Failed to process PayPal webhook', { error: error.message });
      throw error;
    }
  }

  private async processWebhookEvent(event: any): Promise<void> {
    const { id: eventId, event_type: eventType, resource } = event;

    try {
      switch (eventType) {
        case 'CHECKOUT.ORDER.APPROVED':
          await this.handleOrderApproved(resource, eventId);
          break;

        case 'PAYMENT.CAPTURE.COMPLETED':
          await this.handleCaptureCompleted(resource, eventId);
          break;

        case 'PAYMENT.CAPTURE.DENIED':
          await this.handleCaptureDenied(resource, eventId);
          break;

        case 'CUSTOMER.DISPUTE.CREATED':
          await this.handleDisputeCreated(resource, eventId);
          break;

        default:
          logger.info('Unhandled PayPal webhook event type', { eventType, eventId });
      }
    } catch (error) {
      logger.error('Failed to process PayPal webhook event', {
        eventType,
        eventId,
        error: error.message
      });
      throw error;
    }
  }

  private async handleOrderApproved(resource: any, eventId: string): Promise<void> {
    const payment = await Payment.findOne({ paymentIntentId: resource.id });
    
    if (payment) {
      await payment.addWebhookEvent({
        eventId,
        eventType: 'CHECKOUT.ORDER.APPROVED',
        provider: 'paypal',
        data: resource
      });

      await payment.updateStatus('processing', {
        approvedAt: new Date(),
        webhookProcessed: true
      });
    }
  }

  private async handleCaptureCompleted(resource: any, eventId: string): Promise<void> {
    const payment = await Payment.findOne({ transactionId: resource.id });
    
    if (payment) {
      await payment.addWebhookEvent({
        eventId,
        eventType: 'PAYMENT.CAPTURE.COMPLETED',
        provider: 'paypal',
        data: resource
      });

      if (payment.status !== 'completed') {
        await payment.updateStatus('completed', {
          webhookProcessed: true,
          captureCompletedAt: new Date()
        });

        // Publish completion event
        await this.kafkaService.publishPaymentEvent('payment.completed', {
          paymentId: payment._id.toString(),
          orderId: payment.orderId.toString(),
          userId: payment.userId.toString(),
          amount: payment.amount,
          transactionId: resource.id,
          source: 'webhook'
        });
      }
    }
  }

  private async handleCaptureDenied(resource: any, eventId: string): Promise<void> {
    const payment = await Payment.findOne({ transactionId: resource.id });
    
    if (payment) {
      await payment.addWebhookEvent({
        eventId,
        eventType: 'PAYMENT.CAPTURE.DENIED',
        provider: 'paypal',
        data: resource
      });

      const failureReason = resource.status_details?.reason || 'Capture denied';
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

  private async handleDisputeCreated(resource: any, eventId: string): Promise<void> {
    // Find payment by transaction ID from disputed transactions
    const disputedTransactionId = resource.disputed_transactions?.[0]?.seller_transaction_id;
    const payment = await Payment.findOne({ transactionId: disputedTransactionId });
    
    if (payment) {
      await payment.addWebhookEvent({
        eventId,
        eventType: 'CUSTOMER.DISPUTE.CREATED',
        provider: 'paypal',
        data: resource
      });

      // Publish dispute event
      await this.kafkaService.publishPaymentEvent('payment.disputed', {
        paymentId: payment._id.toString(),
        orderId: payment.orderId.toString(),
        disputeId: resource.dispute_id,
        disputeAmount: parseFloat(resource.dispute_amount?.value || '0'),
        disputeReason: resource.reason
      });
    }
  }

  async getOrder(orderId: string): Promise<any> {
    try {
      const request = new paypal.orders.OrdersGetRequest(orderId);
      const response = await this.client.execute(request);
      return response.result;
    } catch (error) {
      logger.error('Failed to retrieve PayPal order', { error: error.message, orderId });
      throw new Error(`Failed to retrieve PayPal order: ${error.message}`);
    }
  }

  async getCapture(captureId: string): Promise<any> {
    try {
      const request = new paypal.payments.CapturesGetRequest(captureId);
      const response = await this.client.execute(request);
      return response.result;
    } catch (error) {
      logger.error('Failed to retrieve PayPal capture', { error: error.message, captureId });
      throw new Error(`Failed to retrieve PayPal capture: ${error.message}`);
    }
  }
}
