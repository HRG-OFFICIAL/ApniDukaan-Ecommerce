import { Event, EventType, EventStatus } from '../events/event.types';
import { logger } from '../utils/logger';
import { connectDatabase } from '../utils/database';

export interface EventStore {
  id: string;
  eventType: EventType;
  eventData: Event;
  status: EventStatus;
  timestamp: string;
  source: string;
  version: string;
  correlationId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export class EventSourcingService {
  private db: any;
  private isConnected: boolean = false;

  constructor() {
    this.initializeDatabase();
  }

  private async initializeDatabase(): Promise<void> {
    try {
      this.db = await connectDatabase(
        process.env.MONGODB_URI || 'mongodb+srv://userservice-dev:OELp6t3K63rHhKgJ@cluster0.0ezsixh.mongodb.net/apnidukaan_events?retryWrites=true&w=majority&appName=Cluster0',
        'event_store'
      );
      this.isConnected = true;
      logger.info('Event sourcing service connected to database', {
        action: 'event_sourcing_connect'
      });
    } catch (error) {
      logger.error('Failed to connect event sourcing service to database', {
        error: (error as any).message,
        action: 'event_sourcing_connect_error'
      });
      throw error;
    }
  }

  async storeEvent(event: Event): Promise<void> {
    try {
      if (!this.isConnected) {
        await this.initializeDatabase();
      }

      const eventStore: EventStore = {
        id: event.id,
        eventType: event.type,
        eventData: event,
        status: event.status,
        timestamp: event.timestamp,
        source: event.source,
        version: event.version,
        correlationId: event.correlationId,
        metadata: event.metadata,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await this.db.collection('events').insertOne(eventStore);

      logger.info('Event stored successfully', {
        eventId: event.id,
        eventType: event.type,
        source: event.source,
        action: 'event_stored'
      });

    } catch (error) {
      logger.error('Failed to store event', {
        eventId: event.id,
        eventType: event.type,
        error: (error as any).message,
        action: 'event_store_error'
      });
      throw error;
    }
  }

  async storeEvents(events: Event[]): Promise<void> {
    try {
      if (!this.isConnected) {
        await this.initializeDatabase();
      }

      if (events.length === 0) {
        return;
      }

      const eventStores: EventStore[] = events.map(event => ({
        id: event.id,
        eventType: event.type,
        eventData: event,
        status: event.status,
        timestamp: event.timestamp,
        source: event.source,
        version: event.version,
        correlationId: event.correlationId,
        metadata: event.metadata,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      await this.db.collection('events').insertMany(eventStores);

      logger.info('Events stored successfully', {
        eventCount: events.length,
        action: 'events_stored'
      });

    } catch (error) {
      logger.error('Failed to store events', {
        eventCount: events.length,
        error: (error as any).message,
        action: 'events_store_error'
      });
      throw error;
    }
  }

  async getEventsByType(eventType: EventType, limit: number = 100, offset: number = 0): Promise<EventStore[]> {
    try {
      if (!this.isConnected) {
        await this.initializeDatabase();
      }

      const events = await this.db.collection('events')
        .find({ eventType })
        .sort({ timestamp: -1 })
        .limit(limit)
        .skip(offset)
        .toArray();

      logger.info('Events retrieved by type', {
        eventType,
        count: events.length,
        limit,
        offset,
        action: 'events_retrieved_by_type'
      });

      return events;

    } catch (error) {
      logger.error('Failed to get events by type', {
        eventType,
        error: (error as any).message,
        action: 'events_retrieve_by_type_error'
      });
      throw error;
    }
  }

  async getEventsBySource(source: string, limit: number = 100, offset: number = 0): Promise<EventStore[]> {
    try {
      if (!this.isConnected) {
        await this.initializeDatabase();
      }

      const events = await this.db.collection('events')
        .find({ source })
        .sort({ timestamp: -1 })
        .limit(limit)
        .skip(offset)
        .toArray();

      logger.info('Events retrieved by source', {
        source,
        count: events.length,
        limit,
        offset,
        action: 'events_retrieved_by_source'
      });

      return events;

    } catch (error) {
      logger.error('Failed to get events by source', {
        source,
        error: (error as any).message,
        action: 'events_retrieve_by_source_error'
      });
      throw error;
    }
  }

  async getEventsByCorrelationId(correlationId: string): Promise<EventStore[]> {
    try {
      if (!this.isConnected) {
        await this.initializeDatabase();
      }

      const events = await this.db.collection('events')
        .find({ correlationId })
        .sort({ timestamp: 1 })
        .toArray();

      logger.info('Events retrieved by correlation ID', {
        correlationId,
        count: events.length,
        action: 'events_retrieved_by_correlation_id'
      });

      return events;

    } catch (error) {
      logger.error('Failed to get events by correlation ID', {
        correlationId,
        error: (error as any).message,
        action: 'events_retrieve_by_correlation_id_error'
      });
      throw error;
    }
  }

  async getEventsByDateRange(startDate: Date, endDate: Date, limit: number = 100, offset: number = 0): Promise<EventStore[]> {
    try {
      if (!this.isConnected) {
        await this.initializeDatabase();
      }

      const events = await this.db.collection('events')
        .find({
          timestamp: {
            $gte: startDate.toISOString(),
            $lte: endDate.toISOString()
          }
        })
        .sort({ timestamp: -1 })
        .limit(limit)
        .skip(offset)
        .toArray();

      logger.info('Events retrieved by date range', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        count: events.length,
        limit,
        offset,
        action: 'events_retrieved_by_date_range'
      });

      return events;

    } catch (error) {
      logger.error('Failed to get events by date range', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        error: (error as any).message,
        action: 'events_retrieve_by_date_range_error'
      });
      throw error;
    }
  }

  async getEventById(eventId: string): Promise<EventStore | null> {
    try {
      if (!this.isConnected) {
        await this.initializeDatabase();
      }

      const event = await this.db.collection('events').findOne({ id: eventId });

      if (event) {
        logger.info('Event retrieved by ID', {
          eventId,
          eventType: event.eventType,
          action: 'event_retrieved_by_id'
        });
      }

      return event;

    } catch (error) {
      logger.error('Failed to get event by ID', {
        eventId,
        error: (error as any).message,
        action: 'event_retrieve_by_id_error'
      });
      throw error;
    }
  }

  async updateEventStatus(eventId: string, status: EventStatus): Promise<void> {
    try {
      if (!this.isConnected) {
        await this.initializeDatabase();
      }

      await this.db.collection('events').updateOne(
        { id: eventId },
        { 
          $set: { 
            status,
            updatedAt: new Date()
          } 
        }
      );

      logger.info('Event status updated', {
        eventId,
        status,
        action: 'event_status_updated'
      });

    } catch (error) {
      logger.error('Failed to update event status', {
        eventId,
        status,
        error: (error as any).message,
        action: 'event_status_update_error'
      });
      throw error;
    }
  }

  async getEventStatistics(startDate?: Date, endDate?: Date): Promise<{
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsBySource: Record<string, number>;
    eventsByStatus: Record<string, number>;
  }> {
    try {
      if (!this.isConnected) {
        await this.initializeDatabase();
      }

      const matchStage: any = {};
      if (startDate && endDate) {
        matchStage.timestamp = {
          $gte: startDate.toISOString(),
          $lte: endDate.toISOString()
        };
      }

      const pipeline = [
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalEvents: { $sum: 1 },
            eventsByType: {
              $push: {
                type: '$eventType',
                count: 1
              }
            },
            eventsBySource: {
              $push: {
                source: '$source',
                count: 1
              }
            },
            eventsByStatus: {
              $push: {
                status: '$status',
                count: 1
              }
            }
          }
        }
      ];

      const result = await this.db.collection('events').aggregate(pipeline).toArray();
      
      if (result.length === 0) {
        return {
          totalEvents: 0,
          eventsByType: {},
          eventsBySource: {},
          eventsByStatus: {}
        };
      }

      const stats = result[0];
      
      // Process the grouped data
      const eventsByType: Record<string, number> = {};
      const eventsBySource: Record<string, number> = {};
      const eventsByStatus: Record<string, number> = {};

      stats.eventsByType.forEach((item: any) => {
        eventsByType[item.type] = (eventsByType[item.type] || 0) + item.count;
      });

      stats.eventsBySource.forEach((item: any) => {
        eventsBySource[item.source] = (eventsBySource[item.source] || 0) + item.count;
      });

      stats.eventsByStatus.forEach((item: any) => {
        eventsByStatus[item.status] = (eventsByStatus[item.status] || 0) + item.count;
      });

      logger.info('Event statistics retrieved', {
        totalEvents: stats.totalEvents,
        action: 'event_statistics_retrieved'
      });

      return {
        totalEvents: stats.totalEvents,
        eventsByType,
        eventsBySource,
        eventsByStatus
      };

    } catch (error) {
      logger.error('Failed to get event statistics', {
        error: (error as any).message,
        action: 'event_statistics_error'
      });
      throw error;
    }
  }

  async cleanupOldEvents(retentionDays: number = 90): Promise<number> {
    try {
      if (!this.isConnected) {
        await this.initializeDatabase();
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const result = await this.db.collection('events').deleteMany({
        createdAt: { $lt: cutoffDate }
      });

      logger.info('Old events cleaned up', {
        deletedCount: result.deletedCount,
        retentionDays,
        cutoffDate: cutoffDate.toISOString(),
        action: 'old_events_cleaned_up'
      });

      return result.deletedCount;

    } catch (error) {
      logger.error('Failed to cleanup old events', {
        retentionDays,
        error: (error as any).message,
        action: 'old_events_cleanup_error'
      });
      throw error;
    }
  }

  isHealthy(): boolean {
    return this.isConnected;
  }
}

export const eventSourcingService = new EventSourcingService();
