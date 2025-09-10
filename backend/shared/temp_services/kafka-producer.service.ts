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
      if (!this.isConnected) {
        await this.producer.connect();
        this.isConnected = true;
        logger.info('Kafka producer connected successfully', {
          action: 'kafka_producer_connect',
          brokers: process.env.KAFKA_BROKERS || 'localhost:9092'
        });
      }
    } catch (error) {
      logger.error('Failed to connect Kafka producer', {
        error: (error as any).message,
        action: 'kafka_producer_connect_error'
      });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.isConnected) {
        await this.producer.disconnect();
        this.isConnected = false;
        logger.info('Kafka producer disconnected successfully', {
          action: 'kafka_producer_disconnect'
        });
      }
    } catch (error) {
      logger.error('Failed to disconnect Kafka producer', {
        error: (error as any).message,
        action: 'kafka_producer_disconnect_error'
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

      // Group events by topic
      const eventsByTopic = new Map<string, Event[]>();
      
      for (const event of events) {
        const topic = this.getTopicForEventType(event.type);
        if (!eventsByTopic.has(topic)) {
          eventsByTopic.set(topic, []);
        }
        eventsByTopic.get(topic)!.push(event);
      }

      // Publish events for each topic
      const publishPromises = Array.from(eventsByTopic.entries()).map(
        async ([topic, topicEvents]) => {
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

          const messages = enrichedEvents.map(event => ({
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
          }));

          const record: ProducerRecord = {
            topic,
            messages,
            compression: CompressionTypes.GZIP,
          };

          return this.producer.send(record);
        }
      );

      const results = await Promise.all(publishPromises);

      logger.info('Batch events published successfully', {
        totalEvents: events.length,
        topics: Array.from(eventsByTopic.keys()),
        action: 'batch_events_published'
      });

    } catch (error) {
      logger.error('Failed to publish batch events', {
        eventCount: events.length,
        error: (error as any).message,
        action: 'batch_events_publish_error'
      });
      throw error;
    }
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

  private getPartitionForEvent(event: Event): number {
    // Use event ID hash for consistent partitioning
    const hash = this.hashCode(event.id || uuidv4());
    return Math.abs(hash) % (parseInt(process.env.KAFKA_PARTITIONS || '3'));
  }

  private hashCode(str: string): number {
    let hash = 0;
    if (str.length === 0) return hash;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  async getMetadata(): Promise<any> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }
      return await this.producer.describeCluster();
    } catch (error) {
      logger.error('Failed to get Kafka metadata', {
        error: (error as any).message,
        action: 'kafka_metadata_error'
      });
      throw error;
    }
  }

  isHealthy(): boolean {
    return this.isConnected;
  }
}

export const kafkaProducerService = new KafkaProducerService();
