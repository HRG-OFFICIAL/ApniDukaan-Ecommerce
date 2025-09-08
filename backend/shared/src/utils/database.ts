import mongoose from 'mongoose';
import { logger } from './logger';

export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private isConnected = false;

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public async connect(uri: string, dbName?: string): Promise<void> {
    if (this.isConnected) {
      logger.info('Database already connected');
      return;
    }

    try {
      await mongoose.connect(uri, {
        dbName,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false
      });

      this.isConnected = true;
      logger.info(`Database connected successfully to ${dbName || 'default'}`);

      mongoose.connection.on('error', (error) => {
        logger.error('Database connection error:', error);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('Database disconnected');
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('Database reconnected');
        this.isConnected = true;
      });

    } catch (error) {
      logger.error('Database connection failed:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      logger.info('Database disconnected successfully');
    } catch (error) {
      logger.error('Error disconnecting from database:', error);
      throw error;
    }
  }

  public isConnectedToDB(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  public getConnection() {
    return mongoose.connection;
  }
}

export const connectDatabase = async (uri: string, dbName?: string): Promise<void> => {
  const db = DatabaseConnection.getInstance();
  await db.connect(uri, dbName);
};

export const disconnectDatabase = async (): Promise<void> => {
  const db = DatabaseConnection.getInstance();
  await db.disconnect();
};

export const isDatabaseConnected = (): boolean => {
  const db = DatabaseConnection.getInstance();
  return db.isConnectedToDB();
};

// Mongoose plugin for adding timestamps and common methods
export const timestampPlugin = (schema: mongoose.Schema) => {
  schema.add({
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  });

  schema.pre('save', function(this: any) {
    this.updatedAt = new Date();
  });

  schema.pre(['updateOne', 'updateMany', 'findOneAndUpdate'], function(this: any) {
    this.set({ updatedAt: new Date() });
  });
};

// Common aggregation pipelines
export const paginationPipeline = (page: number = 1, limit: number = 20) => {
  const skip = (page - 1) * limit;
  return [
    { $skip: skip },
    { $limit: limit }
  ];
};

export const searchPipeline = (searchTerm: string, fields: string[]) => {
  if (!searchTerm) return [];
  
  return [
    {
      $match: {
        $or: fields.map(field => ({
          [field]: { $regex: searchTerm, $options: 'i' }
        }))
      }
    }
  ];
};

export const sortPipeline = (sortBy: string = 'createdAt', sortOrder: 'asc' | 'desc' = 'desc') => {
  return [
    { $sort: { [sortBy]: sortOrder === 'asc' ? 1 : -1 } }
  ];
};

// Transaction helper
export const withTransaction = async <T>(
  callback: (session: mongoose.ClientSession) => Promise<T>
): Promise<T> => {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    const result = await callback(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};
