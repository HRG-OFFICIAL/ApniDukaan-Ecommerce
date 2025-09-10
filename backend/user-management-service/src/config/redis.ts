import { createClient } from 'redis';
import { logger } from '@apnidukaan/shared';

let redisClient: ReturnType<typeof createClient> | null = null;

export const initializeRedis = async (): Promise<ReturnType<typeof createClient>> => {
  try {
    const redisUri = process.env.REDIS_URI || 'redis://localhost:6379';
    
    redisClient = createClient({
      url: redisUri,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 1000),
        connectTimeout: 5000,
      }
    });

    // Redis event listeners
    redisClient.on('error', (error) => {
      logger.error('Redis connection error:', error);
    });

    redisClient.on('connect', () => {
      logger.info('Connected to Redis', {
        url: redisUri.split('@')[1] || redisUri // Hide credentials if present
      });
    });

    redisClient.on('disconnect', () => {
      logger.warn('Redis disconnected');
    });

    redisClient.on('reconnecting', () => {
      logger.info('Redis reconnecting...');
    });

    await redisClient.connect();
    
    // Test Redis connection
    const pong = await redisClient.ping();
    if (pong !== 'PONG') {
      throw new Error('Redis ping failed');
    }

    return redisClient;

  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    throw error;
  }
};

export const getRedisClient = (): ReturnType<typeof createClient> | null => {
  return redisClient;
};
