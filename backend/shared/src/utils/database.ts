import mongoose, { Connection, Model, Document, Schema, Types } from 'mongoose';
import { logger } from './logger';

// Database connection state
let connection: Connection | null = null;

// Connection options interface
export interface DatabaseConfig {
  uri: string;
  dbName: string;
  maxPoolSize?: number;
  serverSelectionTimeoutMS?: number;
  socketTimeoutMS?: number;
  retryWrites?: boolean;
  retryReads?: boolean;
  readPreference?: string;
  writeConcern?: any;
}

// Default configuration
const DEFAULT_CONFIG: Partial<DatabaseConfig> = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  retryWrites: true,
  retryReads: true,
  readPreference: 'primary'
};

/**
 * Connect to MongoDB database
 */
export const connectDatabase = async (config: DatabaseConfig): Promise<Connection> => {
  try {
    if (connection && connection.readyState === 1) {
      logger.info('Database already connected', {
        database: config.dbName,
        action: 'database_connect_existing'
      });
      return connection;
    }

    const connectionOptions = {
      ...DEFAULT_CONFIG,
      ...config,
      dbName: config.dbName,
      readPreference: config.readPreference as any
    };

    connection = await mongoose.createConnection(config.uri, {
      ...DEFAULT_CONFIG,
      dbName: config.dbName,
      readPreference: config.readPreference as any
    });

    // Set up connection event listeners
    connection.on('connected', () => {
      logger.info('Database connected successfully', {
        database: config.dbName,
        host: connection?.host,
        port: connection?.port,
        action: 'database_connect'
      });
    });

    connection.on('error', (error: any) => {
      logger.error('Database connection error', {
        database: config.dbName,
        error: error.message,
        action: 'database_connect_error'
      });
    });

    connection.on('disconnected', () => {
      logger.warn('Database disconnected', {
        database: config.dbName,
        action: 'database_disconnect'
      });
    });

    connection.on('reconnected', () => {
      logger.info('Database reconnected', {
        database: config.dbName,
        action: 'database_reconnect'
      });
    });

    return connection;
  } catch (error: any) {
    logger.error('Database connection failed', {
      database: config.dbName,
      error: error.message,
      stack: error.stack,
      action: 'database_connect_error'
    });
    throw error;
  }
};

/**
 * Get the current database connection
 */
export const getConnection = (): Connection | null => {
  return connection;
};

/**
 * Check if database is connected
 */
export const isConnected = (): boolean => {
  return connection ? connection.readyState === 1 : false;
};

/**
 * Disconnect from database
 */
export const disconnectDatabase = async (): Promise<void> => {
  try {
    if (connection) {
      await connection.close();
      connection = null;
      logger.info('Database disconnected successfully', {
        action: 'database_disconnect'
      });
    }
  } catch (error: any) {
    logger.error('Database disconnection failed', {
      error: error.message,
      action: 'database_disconnect_error'
    });
    throw error;
  }
};

/**
 * Graceful shutdown
 */
export const gracefulShutdown = async (): Promise<void> => {
  try {
    await disconnectDatabase();
    logger.info('Database graceful shutdown completed', {
      action: 'database_graceful_shutdown'
    });
  } catch (error: any) {
    logger.error('Database graceful shutdown failed', {
      error: error.message,
      action: 'database_graceful_shutdown_error'
    });
    throw error;
  }
};

/**
 * Create a model with connection validation
 */
export const createModel = <T extends Document>(
  name: string,
  schema: Schema<T>
): Model<T> => {
  if (!connection) {
    throw new Error('Database not connected. Call connectDatabase() first.');
  }
  return connection.model<T>(name, schema);
};

/**
 * Get collection statistics
 */
export const getCollectionStats = async (collectionName: string): Promise<any> => {
  if (!connection) {
    throw new Error('Database not connected');
  }

  try {
    const stats = await (connection.db?.collection(collectionName) as any).stats();
    logger.info('Collection stats retrieved', {
      collection: collectionName,
      stats,
      action: 'database_collection_stats'
    });
    return stats;
  } catch (error: any) {
    logger.error('Failed to get collection stats', {
      collection: collectionName,
      error: error.message,
      action: 'database_collection_stats_error'
    });
    throw error;
  }
};

/**
 * Create indexes for a collection
 */
export const createIndexes = async (
  collectionName: string,
  indexes: any[]
): Promise<void> => {
  if (!connection) {
    throw new Error('Database not connected');
  }

  try {
    const collection = connection.db?.collection(collectionName);
    if (collection) {
      await collection.createIndexes(indexes);
      logger.info('Indexes created successfully', {
        collection: collectionName,
        indexCount: indexes.length,
        action: 'database_create_indexes'
      });
    }
  } catch (error: any) {
    logger.error('Failed to create indexes', {
      collection: collectionName,
      error: error.message,
      action: 'database_create_indexes_error'
    });
    throw error;
  }
};

/**
 * Drop collection
 */
export const dropCollection = async (collectionName: string): Promise<void> => {
  if (!connection) {
    throw new Error('Database not connected');
  }

  try {
    await connection.db?.collection(collectionName).drop();
    logger.info('Collection dropped successfully', {
      collection: collectionName,
      action: 'database_drop_collection'
    });
  } catch (error: any) {
    logger.error('Failed to drop collection', {
      collection: collectionName,
      error: error.message,
      action: 'database_drop_collection_error'
    });
    throw error;
  }
};

/**
 * Get database health status
 */
export const getDatabaseHealth = async (): Promise<{
  connected: boolean;
  readyState: number;
  host?: string;
  port?: number;
  name?: string;
}> => {
  if (!connection) {
    return {
      connected: false,
      readyState: 0
    };
  }

  return {
    connected: connection.readyState === 1,
    readyState: connection.readyState,
    host: connection.host,
    port: connection.port,
    name: connection.name
  };
};

/**
 * Transaction helper
 */
export const withTransaction = async <T>(
  operations: (session: mongoose.ClientSession) => Promise<T>
): Promise<T> => {
  if (!connection) {
    throw new Error('Database not connected');
  }

  const session = await connection.startSession();
  
  try {
    let result: T;
    await session.withTransaction(async () => {
      result = await operations(session);
    });
    return result!;
  } catch (error: any) {
    logger.error('Transaction failed', {
      error: error.message,
      action: 'database_transaction_error'
    });
    throw error;
  } finally {
    await session.endSession();
  }
};

/**
 * Utility to convert string to ObjectId
 */
export const toObjectId = (id: string | Types.ObjectId): Types.ObjectId => {
  if (Types.ObjectId.isValid(id)) {
    return new Types.ObjectId(id);
  }
  throw new Error(`Invalid ObjectId: ${id}`);
};

/**
 * Utility to check if string is valid ObjectId
 */
export const isValidObjectId = (id: string): boolean => {
  return Types.ObjectId.isValid(id);
};

/**
 * Utility to generate new ObjectId
 */
export const newObjectId = (): Types.ObjectId => {
  return new Types.ObjectId();
};