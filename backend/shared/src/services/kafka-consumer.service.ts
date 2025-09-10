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
      if (this.isConnected) {
        return;
      }

      await this.consumer.connect();
      this.isConnected = true;

      logger.info('Kafka consumer connected', {
        action: 'kafka_consumer_connected'
      });
    } catch (error) {
      logger.error('Failed to connect Kafka consumer', {
        error: (error as any).message,
        action: 'kafka_consumer_connection_error'
      });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (!this.isConnected) {
        return;
      }

      await this.consumer.disconnect();
      this.isConnected = false;

      logger.info('Kafka consumer disconnected', {
        action: 'kafka_consumer_disconnected'
      });
    } catch (error) {
      logger.error('Failed to disconnect Kafka consumer', {
        error: (error as any).message,
        action: 'kafka_consumer_disconnection_error'
      });
      throw error;
    }
  }

  /**
   * Subscribe to a topic and start consuming messages
   */
  async subscribe(topics: string[]): Promise<void> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      await this.consumer.subscribe({ topics, fromBeginning: false });

      logger.info('Subscribed to topics', {
        topics,
        action: 'kafka_topics_subscribed'
      });
    } catch (error) {
      logger.error('Failed to subscribe to topics', {
        topics,
        error: (error as any).message,
        action: 'kafka_subscription_error'
      });
      throw error;
    }
  }

  /**
   * Start consuming messages
   */
  async startConsuming(): Promise<void> {
    try {
      if (this.isConsuming) {
        logger.warn('Consumer is already consuming messages', {
          action: 'kafka_consumer_already_consuming'
        });
        return;
      }

      await this.consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          await this.handleMessage(payload);
        },
      });

      this.isConsuming = true;

      logger.info('Started consuming messages', {
        action: 'kafka_consuming_started'
      });
    } catch (error) {
      logger.error('Failed to start consuming messages', {
        error: (error as any).message,
        action: 'kafka_consuming_start_error'
      });
      throw error;
    }
  }

  /**
   * Stop consuming messages
   */
  async stopConsuming(): Promise<void> {
    try {
      if (!this.isConsuming) {
        return;
      }

      await this.consumer.stop();
      this.isConsuming = false;

      logger.info('Stopped consuming messages', {
        action: 'kafka_consuming_stopped'
      });
    } catch (error) {
      logger.error('Failed to stop consuming messages', {
        error: (error as any).message,
        action: 'kafka_consuming_stop_error'
      });
      throw error;
    }
  }

  /**
   * Register an event handler
   */
  registerHandler(eventType: EventType, handler: EventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);

    logger.info('Event handler registered', {
      eventType,
      handlerName: handler.constructor.name,
      action: 'event_handler_registered'
    });
  }

  /**
   * Unregister an event handler
   */
  unregisterHandler(eventType: EventType, handler: EventHandler): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
        logger.info('Event handler unregistered', {
          eventType,
          handlerName: handler.constructor.name,
          action: 'event_handler_unregistered'
        });
      }
    }
  }

  /**
   * Get all registered handlers for an event type
   */
  getHandlers(eventType: EventType): EventHandler[] {
    return this.handlers.get(eventType) || [];
  }

  /**
   * Get all registered event types
   */
  getRegisteredEventTypes(): EventType[] {
    return Array.from(this.handlers.keys());
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
        topic,
        partition,
        offset: message.offset,
        handlerCount: handlers.length,
        action: 'message_processed'
      });

    } catch (error) {
      logger.error('Failed to process message', {
        topic,
        partition,
        offset: message.offset,
        error: (error as any).message,
        action: 'message_processing_error'
      });
      // Don't throw here to prevent consumer from stopping
    }
  }

  /**
   * Get consumer health status
   */
  isHealthy(): boolean {
    return this.isConnected && this.isConsuming;
  }

  /**
   * Get consumer status information
   */
  getStatus(): {
    connected: boolean;
    consuming: boolean;
    clientId: string;
    groupId: string;
    brokers: string[];
    registeredEventTypes: EventType[];
    handlerCount: number;
  } {
    return {
      connected: this.isConnected,
      consuming: this.isConsuming,
      clientId: 'kafka-consumer',
      groupId: 'apnidukaan-consumer-group',
      brokers: [],
      registeredEventTypes: this.getRegisteredEventTypes(),
      handlerCount: Array.from(this.handlers.values()).reduce((total, handlers) => total + handlers.length, 0),
    };
  }

  /**
   * Pause consuming for a specific topic
   */
  async pauseTopic(topic: string): Promise<void> {
    try {
      await this.consumer.pause([{ topic }]);
      logger.info('Topic paused', { topic, action: 'topic_paused' });
    } catch (error) {
      logger.error('Failed to pause topic', {
        topic,
        error: (error as any).message,
        action: 'topic_pause_error'
      });
      throw error;
    }
  }

  /**
   * Resume consuming for a specific topic
   */
  async resumeTopic(topic: string): Promise<void> {
    try {
      await this.consumer.resume([{ topic }]);
      logger.info('Topic resumed', { topic, action: 'topic_resumed' });
    } catch (error) {
      logger.error('Failed to resume topic', {
        topic,
        error: (error as any).message,
        action: 'topic_resume_error'
      });
      throw error;
    }
  }
}

export const kafkaConsumerService = new KafkaConsumerService();
