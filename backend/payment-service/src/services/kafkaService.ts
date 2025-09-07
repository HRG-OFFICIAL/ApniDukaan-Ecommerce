import { Kafka, Producer, Consumer, EachMessagePayload } from 'kafkajs';
import { logger } from '@shared/utils';

export interface PaymentEvent {
  type: string;
  data: Record<string, any>;
  timestamp: Date;
  source: string;
}

export class KafkaService {
  private kafka: Kafka;
  private producer: Producer;
  private consumer: Consumer;
  private isConnected = false;

  constructor() {
    this.kafka = new Kafka({
      clientId: 'payment-service',
      brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
      retry: {
        retries: 5,
        initialRetryTime: 100,
        maxRetryTime: 30000
      }
    });

    this.producer = this.kafka.producer({
      transactionTimeout: 30000,
      idempotent: true
    });

    this.consumer = this.kafka.consumer({
      groupId: 'payment-service-group',
      sessionTimeout: 30000,
      heartbeatInterval: 3000
    });
  }

  async connect(): Promise<void> {
    try {
      await this.producer.connect();
      await this.consumer.connect();
      this.isConnected = true;
      logger.info('Kafka service connected successfully');
    } catch (error) {
      logger.error('Failed to connect to Kafka', { error: error.message });
      throw new Error(`Kafka connection failed: ${error.message}`);
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.producer.disconnect();
      await this.consumer.disconnect();
      this.isConnected = false;
      logger.info('Kafka service disconnected');
    } catch (error) {
      logger.error('Error disconnecting from Kafka', { error: error.message });
    }
  }

  async publishPaymentEvent(eventType: string, data: Record<string, any>): Promise<void> {
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      const event: PaymentEvent = {
        type: eventType,
        data,
        timestamp: new Date(),
        source: 'payment-service'
      };

      await this.producer.send({
        topic: 'payment-events',
        messages: [
          {
            key: data.paymentId || data.orderId || null,
            value: JSON.stringify(event),
            headers: {
              eventType,
              source: 'payment-service',
              timestamp: new Date().toISOString()
            }
          }
        ]
      });

      logger.info('Payment event published', {
        eventType,
        paymentId: data.paymentId,
        orderId: data.orderId
      });
    } catch (error) {
      logger.error('Failed to publish payment event', {
        eventType,
        error: error.message,
        data
      });
      throw new Error(`Failed to publish payment event: ${error.message}`);
    }
  }

  async subscribeToOrderEvents(): Promise<void> {
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      await this.consumer.subscribe({
        topics: ['order-events', 'user-events'],
        fromBeginning: false
      });

      await this.consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          await this.handleIncomingMessage(payload);
        }
      });

      logger.info('Subscribed to order and user events');
    } catch (error) {
      logger.error('Failed to subscribe to events', { error: error.message });
      throw new Error(`Failed to subscribe to events: ${error.message}`);
    }
  }

  private async handleIncomingMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, partition, message } = payload;

    try {
      const eventData = JSON.parse(message.value?.toString() || '{}');
      const eventType = message.headers?.eventType?.toString() || eventData.type;

      logger.info('Received event', {
        topic,
        partition,
        eventType,
        key: message.key?.toString()
      });

      switch (topic) {
        case 'order-events':
          await this.handleOrderEvent(eventType, eventData);
          break;
        case 'user-events':
          await this.handleUserEvent(eventType, eventData);
          break;
        default:
          logger.warn('Unhandled topic', { topic });
      }
    } catch (error) {
      logger.error('Failed to process incoming message', {
        topic,
        error: error.message,
        messageKey: message.key?.toString()
      });
    }
  }

  private async handleOrderEvent(eventType: string, eventData: any): Promise<void> {
    try {
      switch (eventType) {
        case 'order.created':
          await this.handleOrderCreated(eventData.data);
          break;
        
        case 'order.cancelled':
          await this.handleOrderCancelled(eventData.data);
          break;

        case 'order.updated':
          await this.handleOrderUpdated(eventData.data);
          break;

        default:
          logger.info('Unhandled order event', { eventType });
      }
    } catch (error) {
      logger.error('Failed to handle order event', {
        eventType,
        error: error.message,
        eventData
      });
    }
  }

  private async handleUserEvent(eventType: string, eventData: any): Promise<void> {
    try {
      switch (eventType) {
        case 'user.updated':
          await this.handleUserUpdated(eventData.data);
          break;

        case 'user.deleted':
          await this.handleUserDeleted(eventData.data);
          break;

        default:
          logger.info('Unhandled user event', { eventType });
      }
    } catch (error) {
      logger.error('Failed to handle user event', {
        eventType,
        error: error.message,
        eventData
      });
    }
  }

  private async handleOrderCreated(orderData: any): Promise<void> {
    logger.info('Order created event received', {
      orderId: orderData.orderId,
      userId: orderData.userId,
      amount: orderData.totalAmount
    });

    // Can be used to pre-validate payment requirements or prepare for payment
    // For example, check user payment history, apply fraud detection, etc.
  }

  private async handleOrderCancelled(orderData: any): Promise<void> {
    logger.info('Order cancelled event received', {
      orderId: orderData.orderId,
      userId: orderData.userId
    });

    // Handle any pending payments for this order
    try {
      const { Payment } = await import('../models/Payment');
      const pendingPayments = await Payment.find({
        orderId: orderData.orderId,
        status: { $in: ['pending', 'processing'] }
      });

      for (const payment of pendingPayments) {
        await payment.updateStatus('cancelled', {
          cancelReason: 'Order cancelled',
          cancelledAt: new Date()
        });

        // Publish payment cancellation event
        await this.publishPaymentEvent('payment.cancelled', {
          paymentId: payment._id.toString(),
          orderId: payment.orderId.toString(),
          reason: 'Order cancelled',
          cancelledAmount: payment.amount
        });
      }

      if (pendingPayments.length > 0) {
        logger.info('Cancelled pending payments for cancelled order', {
          orderId: orderData.orderId,
          paymentsCount: pendingPayments.length
        });
      }
    } catch (error) {
      logger.error('Failed to cancel payments for cancelled order', {
        orderId: orderData.orderId,
        error: error.message
      });
    }
  }

  private async handleOrderUpdated(orderData: any): Promise<void> {
    logger.info('Order updated event received', {
      orderId: orderData.orderId,
      userId: orderData.userId,
      changes: orderData.changes
    });

    // Handle payment amount changes if total amount was updated
    if (orderData.changes?.totalAmount) {
      logger.info('Order amount changed, may need payment adjustment', {
        orderId: orderData.orderId,
        oldAmount: orderData.changes.totalAmount.old,
        newAmount: orderData.changes.totalAmount.new
      });
    }
  }

  private async handleUserUpdated(userData: any): Promise<void> {
    logger.info('User updated event received', {
      userId: userData.userId,
      changes: userData.changes
    });

    // Update customer information in payment gateway if needed
    if (userData.changes?.email || userData.changes?.name) {
      logger.info('User contact info updated, may need payment gateway customer update', {
        userId: userData.userId
      });
    }
  }

  private async handleUserDeleted(userData: any): Promise<void> {
    logger.info('User deleted event received', {
      userId: userData.userId
    });

    // Handle cleanup of payment-related data if required by privacy regulations
    // This is a sensitive operation and should be handled carefully
    logger.warn('User deletion may require payment data cleanup', {
      userId: userData.userId
    });
  }

  // Health check method
  async healthCheck(): Promise<{ status: string; connected: boolean }> {
    try {
      // Simple ping to check if Kafka is responsive
      const admin = this.kafka.admin();
      await admin.connect();
      await admin.listTopics();
      await admin.disconnect();

      return {
        status: 'healthy',
        connected: this.isConnected
      };
    } catch (error) {
      logger.error('Kafka health check failed', { error: error.message });
      return {
        status: 'unhealthy',
        connected: false
      };
    }
  }

  // Method to publish batch payment events for better performance
  async publishPaymentEventBatch(events: Array<{ eventType: string; data: Record<string, any> }>): Promise<void> {
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      const messages = events.map(({ eventType, data }) => ({
        key: data.paymentId || data.orderId || null,
        value: JSON.stringify({
          type: eventType,
          data,
          timestamp: new Date(),
          source: 'payment-service'
        }),
        headers: {
          eventType,
          source: 'payment-service',
          timestamp: new Date().toISOString()
        }
      }));

      await this.producer.send({
        topic: 'payment-events',
        messages
      });

      logger.info('Payment event batch published', {
        eventsCount: events.length
      });
    } catch (error) {
      logger.error('Failed to publish payment event batch', {
        error: error.message,
        eventsCount: events.length
      });
      throw new Error(`Failed to publish payment event batch: ${error.message}`);
    }
  }
}
