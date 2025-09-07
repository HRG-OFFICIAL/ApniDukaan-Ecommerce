import { Kafka, Producer, Consumer, EachMessagePayload } from 'kafkajs';
import { logger } from '@shopsphere/shared';

export interface OrderEvent {
  type: 'ORDER_CREATED' | 'ORDER_UPDATED' | 'ORDER_CANCELLED' | 'ORDER_FULFILLED' | 'PAYMENT_COMPLETED' | 'INVENTORY_RESERVED';
  orderId: string;
  userId: string;
  data: any;
  timestamp: Date;
}

class KafkaService {
  private kafka: Kafka;
  private producer: Producer;
  private consumer: Consumer;
  private isConnected: boolean = false;

  constructor() {
    this.kafka = new Kafka({
      clientId: 'order-service',
      brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
      retry: {
        initialRetryTime: 100,
        retries: 8
      }
    });

    this.producer = this.kafka.producer({
      maxInFlightRequests: 1,
      idempotent: true,
      transactionTimeout: 30000
    });

    this.consumer = this.kafka.consumer({
      groupId: 'order-service-group',
      sessionTimeout: 30000,
      heartbeatInterval: 3000
    });
  }

  async connect(): Promise<void> {
    try {
      await this.producer.connect();
      await this.consumer.connect();
      this.isConnected = true;

      logger.info('Kafka service connected successfully', {
        action: 'kafka_connect'
      });
    } catch (error) {
      logger.error('Failed to connect to Kafka', {
        error: error.message,
        action: 'kafka_connect'
      });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.producer.disconnect();
      await this.consumer.disconnect();
      this.isConnected = false;

      logger.info('Kafka service disconnected', {
        action: 'kafka_disconnect'
      });
    } catch (error) {
      logger.error('Failed to disconnect from Kafka', {
        error: error.message,
        action: 'kafka_disconnect'
      });
    }
  }

  async publishOrderEvent(event: OrderEvent): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Kafka service is not connected');
    }

    try {
      await this.producer.send({
        topic: 'order-events',
        messages: [{
          key: event.orderId,
          value: JSON.stringify(event),
          timestamp: event.timestamp.getTime().toString()
        }]
      });

      logger.info('Order event published', {
        eventType: event.type,
        orderId: event.orderId,
        userId: event.userId,
        action: 'publish_order_event'
      });
    } catch (error) {
      logger.error('Failed to publish order event', {
        eventType: event.type,
        orderId: event.orderId,
        error: error.message,
        action: 'publish_order_event'
      });
      throw error;
    }
  }

  async publishInventoryEvent(productId: string, quantity: number, operation: 'RESERVE' | 'RELEASE'): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Kafka service is not connected');
    }

    try {
      const event = {
        type: operation,
        productId,
        quantity,
        timestamp: new Date()
      };

      await this.producer.send({
        topic: 'inventory-events',
        messages: [{
          key: productId,
          value: JSON.stringify(event),
          timestamp: Date.now().toString()
        }]
      });

      logger.info('Inventory event published', {
        eventType: operation,
        productId,
        quantity,
        action: 'publish_inventory_event'
      });
    } catch (error) {
      logger.error('Failed to publish inventory event', {
        eventType: operation,
        productId,
        error: error.message,
        action: 'publish_inventory_event'
      });
      throw error;
    }
  }

  async subscribeToPaymentEvents(): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Kafka service is not connected');
    }

    try {
      await this.consumer.subscribe({ topic: 'payment-events' });

      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }: EachMessagePayload) => {
          try {
            const event = JSON.parse(message.value?.toString() || '{}');
            await this.handlePaymentEvent(event);
          } catch (error) {
            logger.error('Failed to process payment event', {
              topic,
              partition,
              offset: message.offset,
              error: error.message,
              action: 'process_payment_event'
            });
          }
        }
      });

      logger.info('Subscribed to payment events', {
        action: 'subscribe_payment_events'
      });
    } catch (error) {
      logger.error('Failed to subscribe to payment events', {
        error: error.message,
        action: 'subscribe_payment_events'
      });
      throw error;
    }
  }

  private async handlePaymentEvent(event: any): Promise<void> {
    const { orderService } = await import('./orderService');

    switch (event.type) {
      case 'PAYMENT_COMPLETED':
        await orderService.handlePaymentCompleted(event.orderId, event.paymentData);
        break;
      case 'PAYMENT_FAILED':
        await orderService.handlePaymentFailed(event.orderId, event.error);
        break;
      case 'PAYMENT_REFUNDED':
        await orderService.handlePaymentRefunded(event.orderId, event.refundData);
        break;
      default:
        logger.warn('Unknown payment event type', {
          eventType: event.type,
          orderId: event.orderId,
          action: 'handle_payment_event'
        });
    }
  }

  async subscribeToInventoryEvents(): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Kafka service is not connected');
    }

    try {
      await this.consumer.subscribe({ topic: 'inventory-responses' });

      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }: EachMessagePayload) => {
          try {
            const event = JSON.parse(message.value?.toString() || '{}');
            await this.handleInventoryEvent(event);
          } catch (error) {
            logger.error('Failed to process inventory event', {
              topic,
              partition,
              offset: message.offset,
              error: error.message,
              action: 'process_inventory_event'
            });
          }
        }
      });

      logger.info('Subscribed to inventory events', {
        action: 'subscribe_inventory_events'
      });
    } catch (error) {
      logger.error('Failed to subscribe to inventory events', {
        error: error.message,
        action: 'subscribe_inventory_events'
      });
      throw error;
    }
  }

  private async handleInventoryEvent(event: any): Promise<void> {
    const { orderService } = await import('./orderService');

    switch (event.type) {
      case 'INVENTORY_RESERVED':
        await orderService.handleInventoryReserved(event.orderId, event.items);
        break;
      case 'INVENTORY_RESERVATION_FAILED':
        await orderService.handleInventoryReservationFailed(event.orderId, event.failedItems);
        break;
      case 'INVENTORY_RELEASED':
        await orderService.handleInventoryReleased(event.orderId, event.items);
        break;
      default:
        logger.warn('Unknown inventory event type', {
          eventType: event.type,
          orderId: event.orderId,
          action: 'handle_inventory_event'
        });
    }
  }

  async publishNotificationEvent(userId: string, type: string, data: any): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Kafka service is not connected');
    }

    try {
      const event = {
        userId,
        type,
        data,
        timestamp: new Date()
      };

      await this.producer.send({
        topic: 'notification-events',
        messages: [{
          key: userId,
          value: JSON.stringify(event),
          timestamp: Date.now().toString()
        }]
      });

      logger.info('Notification event published', {
        userId,
        notificationType: type,
        action: 'publish_notification_event'
      });
    } catch (error) {
      logger.error('Failed to publish notification event', {
        userId,
        notificationType: type,
        error: error.message,
        action: 'publish_notification_event'
      });
      throw error;
    }
  }

  isHealthy(): boolean {
    return this.isConnected;
  }
}

export const kafkaService = new KafkaService();
