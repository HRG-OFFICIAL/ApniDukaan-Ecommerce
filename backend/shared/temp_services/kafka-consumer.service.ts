import { Kafka, Consumer, EachMessagePayload, KafkaMessage } from 'kafkajs';
import { Event, EventType, EventHandler } from '../events/event.types';
import { logger } from '../utils/logger';

export class KafkaConsumerService {
  private consumer: Consumer;
  private kafka: Kafka;
  private isConnected: boolean = false;
  private handlers: Map<EventType, EventHandler[]> = new Map();
  private isConsuming: boolean = false;

  constructor() {
    this.kafka = new Kafka({
      clientId: process.env.KAFKA_CLIENT_ID || 'apnidukaan-consumer',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
      retry: {
        initialRetryTime: 100,
        retries: 8,
        maxRetryTime: 30000,
      },
      connectionTimeout: 30000,
      requestTimeout: 30000,
    });

    this.consumer = this.kafka.consumer({
      groupId: process.env.KAFKA_GROUP_ID || 'apnidukaan-consumer-group',
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
      maxWaitTimeInMs: 5000,
      allowAutoTopicCreation: true,
    });
  }

  async connect(): Promise<void> {
    try {
      if (!this.isConnected) {
        await this.consumer.connect();
        this.isConnected = true;
        logger.info('Kafka consumer connected successfully', {
          action: 'kafka_consumer_connect',
          brokers: process.env.KAFKA_BROKERS || 'localhost:9092',
          groupId: process.env.KAFKA_GROUP_ID || 'apnidukaan-consumer-group'
        });
      }
    } catch (error) {
      logger.error('Failed to connect Kafka consumer', {
        error: (error as any).message,
        action: 'kafka_consumer_connect_error'
      });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.isConnected) {
        await this.consumer.disconnect();
        this.isConnected = false;
        this.isConsuming = false;
        logger.info('Kafka consumer disconnected successfully', {
          action: 'kafka_consumer_disconnect'
        });
      }
    } catch (error) {
      logger.error('Failed to disconnect Kafka consumer', {
        error: (error as any).message,
        action: 'kafka_consumer_disconnect_error'
      });
      throw error;
    }
  }

  async subscribe(eventType: EventType, handler: EventHandler): Promise<void> {
    try {
      if (!this.handlers.has(eventType)) {
        this.handlers.set(eventType, []);
      }
      
      this.handlers.get(eventType)!.push(handler);
      
      logger.info('Event handler subscribed', {
        eventType,
        handlerCount: this.handlers.get(eventType)!.length,
        action: 'event_handler_subscribed'
      });
    } catch (error) {
      logger.error('Failed to subscribe event handler', {
        eventType,
        error: (error as any).message,
        action: 'event_handler_subscribe_error'
      });
      throw error;
    }
  }

  async unsubscribe(eventType: EventType, handler: EventHandler): Promise<void> {
    try {
      if (this.handlers.has(eventType)) {
        const handlers = this.handlers.get(eventType)!;
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
        
        if (handlers.length === 0) {
          this.handlers.delete(eventType);
        }
        
        logger.info('Event handler unsubscribed', {
          eventType,
          handlerCount: handlers.length,
          action: 'event_handler_unsubscribed'
        });
      }
    } catch (error) {
      logger.error('Failed to unsubscribe event handler', {
        eventType,
        error: (error as any).message,
        action: 'event_handler_unsubscribe_error'
      });
      throw error;
    }
  }

  async startConsuming(): Promise<void> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      if (this.isConsuming) {
        logger.warn('Consumer is already running', {
          action: 'consumer_already_running'
        });
        return;
      }

      // Subscribe to all topics that have handlers
      const topics = this.getTopicsForHandlers();
      if (topics.length === 0) {
        logger.warn('No topics to subscribe to', {
          action: 'no_topics_to_subscribe'
        });
        return;
      }

      await this.consumer.subscribe({ topics });

      await this.consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          await this.handleMessage(payload);
        },
      });

      this.isConsuming = true;
      logger.info('Kafka consumer started successfully', {
        topics,
        action: 'kafka_consumer_started'
      });

    } catch (error) {
      logger.error('Failed to start Kafka consumer', {
        error: (error as any).message,
        action: 'kafka_consumer_start_error'
      });
      throw error;
    }
  }

  async stopConsuming(): Promise<void> {
    try {
      if (this.isConsuming) {
        await this.consumer.stop();
        this.isConsuming = false;
        logger.info('Kafka consumer stopped successfully', {
          action: 'kafka_consumer_stopped'
        });
      }
    } catch (error) {
      logger.error('Failed to stop Kafka consumer', {
        error: (error as any).message,
        action: 'kafka_consumer_stop_error'
      });
      throw error;
    }
  }

  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, partition, message } = payload;
    
    try {
      // Parse the event from the message
      const eventData = JSON.parse(message.value?.toString() || '{}');
      const eventType = message.headers?.eventType?.toString() as EventType;
      
      if (!eventType) {
        logger.warn('Received message without event type', {
          topic,
          partition,
          offset: message.offset,
          action: 'message_without_event_type'
        });
        return;
      }

      // Get handlers for this event type
      const handlers = this.handlers.get(eventType) || [];
      
      if (handlers.length === 0) {
        logger.warn('No handlers found for event type', {
          eventType,
          topic,
          partition,
          offset: message.offset,
          action: 'no_handlers_for_event_type'
        });
        return;
      }

      // Process event with all handlers
      const handlerPromises = handlers.map(async (handler) => {
        try {
          await handler.handle(eventData);
          logger.debug('Event handled successfully', {
            eventId: eventData.id,
            eventType,
            handler: handler.constructor.name,
            topic,
            partition,
            offset: message.offset,
            action: 'event_handled'
          });
        } catch (error) {
          logger.error('Event handler failed', {
            eventId: eventData.id,
            eventType,
            handler: handler.constructor.name,
            error: (error as any).message,
            topic,
            partition,
            offset: message.offset,
            action: 'event_handler_failed'
          });
          // Don't throw here to allow other handlers to process
        }
      });

      await Promise.allSettled(handlerPromises);

      logger.info('Message processed successfully', {
        eventId: eventData.id,
        eventType,
        handlerCount: handlers.length,
        topic,
        partition,
        offset: message.offset,
        action: 'message_processed'
      });

    } catch (error) {
      logger.error('Failed to process message', {
        topic,
        partition,
        offset: message.offset,
        error: (error as any).message,
        action: 'message_process_error'
      });
      // In a production system, you might want to send failed messages to a DLQ
    }
  }

  private getTopicsForHandlers(): string[] {
    const topicPrefix = process.env.KAFKA_TOPIC_PREFIX || 'apnidukaan';
    const topics = new Set<string>();

    for (const eventType of this.handlers.keys()) {
      const topic = this.getTopicForEventType(eventType);
      topics.add(topic);
    }

    return Array.from(topics);
  }

  private getTopicForEventType(eventType: EventType): string {
    const topicPrefix = process.env.KAFKA_TOPIC_PREFIX || 'apnidukaan';
    
    switch (eventType) {
      case EventType.ORDER_CREATED:
      case EventType.ORDER_UPDATED:
      case EventType.ORDER_CANCELLED:
      case EventType.ORDER_SHIPPED:
      case EventType.ORDER_DELIVERED:
      case EventType.ORDER_REFUNDED:
        return `${topicPrefix}.orders`;
      
      case EventType.PAYMENT_INITIATED:
      case EventType.PAYMENT_COMPLETED:
      case EventType.PAYMENT_FAILED:
      case EventType.PAYMENT_REFUNDED:
        return `${topicPrefix}.payments`;
      
      case EventType.USER_REGISTERED:
      case EventType.USER_LOGIN:
      case EventType.USER_LOGOUT:
      case EventType.USER_PROFILE_UPDATED:
      case EventType.USER_PASSWORD_CHANGED:
        return `${topicPrefix}.users`;
      
      case EventType.PRODUCT_CREATED:
      case EventType.PRODUCT_UPDATED:
      case EventType.PRODUCT_DELETED:
      case EventType.PRODUCT_STOCK_LOW:
      case EventType.PRODUCT_STOCK_OUT:
        return `${topicPrefix}.products`;
      
      case EventType.CART_ITEM_ADDED:
      case EventType.CART_ITEM_REMOVED:
      case EventType.CART_ABANDONED:
        return `${topicPrefix}.cart`;
      
      case EventType.EMAIL_SENT:
      case EventType.SMS_SENT:
      case EventType.PUSH_SENT:
        return `${topicPrefix}.notifications`;
      
      case EventType.SYSTEM_ERROR:
      case EventType.SYSTEM_WARNING:
      case EventType.SYSTEM_INFO:
        return `${topicPrefix}.system`;
      
      default:
        return `${topicPrefix}.general`;
    }
  }

  isHealthy(): boolean {
    return this.isConnected && this.isConsuming;
  }

  getHandlerCount(): number {
    let total = 0;
    for (const handlers of this.handlers.values()) {
      total += handlers.length;
    }
    return total;
  }

  getSubscribedEventTypes(): EventType[] {
    return Array.from(this.handlers.keys());
  }
}

export const kafkaConsumerService = new KafkaConsumerService();
