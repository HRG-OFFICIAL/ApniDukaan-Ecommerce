import mongoose from 'mongoose';
import { logger } from '@apnidukaan/shared';

export const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://userservice-dev:OELp6t3K63rHhKgJ@cluster0.0ezsixh.mongodb.net/apnidukaan_users?retryWrites=true&w=majority&appName=Cluster0';
    
    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
    });

    logger.info('Connected to MongoDB', {
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      database: mongoose.connection.name
    });

    // MongoDB event listeners
    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    throw error;
  }
};
