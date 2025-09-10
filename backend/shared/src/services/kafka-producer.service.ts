import { Kafka, Producer, ProducerRecord, CompressionTypes } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';
import { Event, EventType, EventStatus } from '../events/event.types';
import { logger } from '../utils/logger';

export class KafkaProducerService {
  private producer: Producer;
  private kafka: Kafka;
  private isConnected: boolean = false;

  constructor() {
    this.kafka = new Kafka({
      clientId: process.env.KAFKA_CLIENT_ID || 'apnidukaan-producer',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
      retry: {
        initialRetryTime: 100,
        retries: 8,
        maxRetryTime: 30000,
      },
      connectionTimeout: 30000,
      requestTimeout: 30000,
    });

    this.producer = this.kafka.producer({
      maxInFlightRequests: 1,
      idempotent: true,
      transactionTimeout: 30000,
    });
  }

  async connect(): Promise<void> {
    try {
      if (this.isConnected) {
        return;
      }

      await this.producer.connect();
      this.isConnected = true;

      logger.info('Kafka producer connected', {
        action: 'kafka_producer_connected'
      });
    } catch (error) {
      logger.error('Failed to connect Kafka producer', {
        error: (error as any).message,
        action: 'kafka_producer_connection_error'
      });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (!this.isConnected) {
        return;
      }

      await this.producer.disconnect();
      this.isConnected = false;

      logger.info('Kafka producer disconnected', {
        action: 'kafka_producer_disconnected'
      });
    } catch (error) {
      logger.error('Failed to disconnect Kafka producer', {
        error: (error as any).message,
        action: 'kafka_producer_disconnection_error'
      });
      throw error;
    }
  }

  async publish(event: Event): Promise<void> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      // Add metadata to event
      const enrichedEvent = {
        ...event,
        id: event.id || uuidv4(),
        timestamp: event.timestamp || new Date().toISOString(),
        status: event.status || EventStatus.PENDING,
        source: event.source || process.env.SERVICE_NAME || 'unknown',
        version: event.version || '1.0.0',
        metadata: {
          ...event.metadata,
          publishedAt: new Date().toISOString(),
          publisher: process.env.SERVICE_NAME || 'unknown',
        }
      };

      const topic = this.getTopicForEventType(event.type);
      const partition = this.getPartitionForEvent(event);

      const record: ProducerRecord = {
        topic,
        messages: [{
          key: enrichedEvent.id,
          value: JSON.stringify(enrichedEvent),
          partition,
          headers: {
            eventType: enrichedEvent.type,
            eventId: enrichedEvent.id,
            timestamp: enrichedEvent.timestamp,
            source: enrichedEvent.source,
            version: enrichedEvent.version,
          },
        }],
        compression: CompressionTypes.GZIP,
      };

      const result = await this.producer.send(record);

      logger.info('Event published successfully', {
        eventId: enrichedEvent.id,
        eventType: enrichedEvent.type,
        topic,
        partition: result[0].partition,
        offset: result[0].baseOffset,
        action: 'event_published'
      });

    } catch (error) {
      logger.error('Failed to publish event', {
        eventId: event.id,
        eventType: event.type,
        error: (error as any).message,
        action: 'event_publish_error'
      });
      throw error;
    }
  }

  async publishBatch(events: Event[]): Promise<void> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      if (events.length === 0) {
        return;
      }

      // Group events by topic for efficient batching
      const eventsByTopic = new Map<string, Event[]>();
      
      events.forEach(event => {
        const topic = this.getTopicForEventType(event.type);
        if (!eventsByTopic.has(topic)) {
          eventsByTopic.set(topic, []);
        }
        eventsByTopic.get(topic)!.push(event);
      });

      // Publish events for each topic
      const publishPromises = Array.from(eventsByTopic.entries()).map(async ([topic, topicEvents]) => {
        const enrichedEvents = topicEvents.map(event => ({
          ...event,
          id: event.id || uuidv4(),
          timestamp: event.timestamp || new Date().toISOString(),
          status: event.status || EventStatus.PENDING,
          source: event.source || process.env.SERVICE_NAME || 'unknown',
          version: event.version || '1.0.0',
          metadata: {
            ...event.metadata,
            publishedAt: new Date().toISOString(),
            publisher: process.env.SERVICE_NAME || 'unknown',
          }
        }));

        const record: ProducerRecord = {
          topic,
          messages: enrichedEvents.map(event => ({
            key: event.id,
            value: JSON.stringify(event),
            partition: this.getPartitionForEvent(event),
            headers: {
              eventType: event.type,
              eventId: event.id,
              timestamp: event.timestamp,
              source: event.source,
              version: event.version,
            },
          })),
          compression: CompressionTypes.GZIP,
        };

        return this.producer.send(record);
      });

      const results = await Promise.all(publishPromises);

      logger.info('Events published in batch', {
        totalEvents: events.length,
        topics: Array.from(eventsByTopic.keys()),
        results: results.map(result => ({
          partition: result[0].partition,
          offset: result[0].baseOffset,
        })),
        action: 'events_published_batch'
      });

    } catch (error) {
      logger.error('Failed to publish events in batch', {
        eventCount: events.length,
        error: (error as any).message,
        action: 'events_publish_batch_error'
      });
      throw error;
    }
  }

  private getTopicForEventType(eventType: EventType): string {
    // Map event types to topics
    const topicMap: Record<EventType, string> = {
      [EventType.USER_REGISTERED]: 'user-events',
      [EventType.USER_LOGIN]: 'user-events',
      [EventType.USER_LOGOUT]: 'user-events',
      [EventType.USER_PROFILE_UPDATED]: 'user-events',
      [EventType.USER_PASSWORD_CHANGED]: 'user-events',
      [EventType.USER_EMAIL_VERIFIED]: 'user-events',
      [EventType.USER_DELETED]: 'user-events',

      [EventType.PRODUCT_CREATED]: 'product-events',
      [EventType.PRODUCT_UPDATED]: 'product-events',
      [EventType.PRODUCT_DELETED]: 'product-events',
      [EventType.PRODUCT_IMAGE_UPLOADED]: 'product-events',
      [EventType.PRODUCT_IMAGE_DELETED]: 'product-events',
      [EventType.PRODUCT_INVENTORY_UPDATED]: 'product-events',
      [EventType.PRODUCT_REVIEW_ADDED]: 'product-events',
      [EventType.PRODUCT_REVIEW_UPDATED]: 'product-events',
      [EventType.PRODUCT_REVIEW_DELETED]: 'product-events',

      [EventType.CATEGORY_CREATED]: 'catalog-events',
      [EventType.CATEGORY_UPDATED]: 'catalog-events',
      [EventType.CATEGORY_DELETED]: 'catalog-events',

      [EventType.CART_ITEM_ADDED]: 'cart-events',
      [EventType.CART_ITEM_UPDATED]: 'cart-events',
      [EventType.CART_ITEM_REMOVED]: 'cart-events',
      [EventType.CART_CLEARED]: 'cart-events',
      [EventType.CART_ABANDONED]: 'cart-events',

      [EventType.ORDER_CREATED]: 'order-events',
      [EventType.ORDER_UPDATED]: 'order-events',
      [EventType.ORDER_CANCELLED]: 'order-events',
      [EventType.ORDER_SHIPPED]: 'order-events',
      [EventType.ORDER_DELIVERED]: 'order-events',
      [EventType.ORDER_REFUNDED]: 'order-events',

      [EventType.PAYMENT_INITIATED]: 'payment-events',
      [EventType.PAYMENT_COMPLETED]: 'payment-events',
      [EventType.PAYMENT_FAILED]: 'payment-events',
      [EventType.PAYMENT_REFUNDED]: 'payment-events',

      [EventType.NOTIFICATION_SENT]: 'notification-events',
      [EventType.NOTIFICATION_DELIVERED]: 'notification-events',
      [EventType.NOTIFICATION_FAILED]: 'notification-events',

      [EventType.SYSTEM_ERROR]: 'system-events',
      [EventType.SYSTEM_WARNING]: 'system-events',
      [EventType.SYSTEM_MAINTENANCE]: 'system-events',
    };

    return topicMap[eventType] || 'default-events';
  }

  private getPartitionForEvent(event: Event): number {
    // Use event ID hash for consistent partitioning
    const hash = this.hashString(event.id);
    return Math.abs(hash) % 3; // Use 3 partitions by default
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  isHealthy(): boolean {
    return this.isConnected;
  }

  getConnectionStatus(): { connected: boolean; clientId: string; brokers: string[] } {
    return {
      connected: this.isConnected,
      clientId: 'kafka-producer',
      brokers: [],
    };
  }
}

export const kafkaProducerService = new KafkaProducerService();
