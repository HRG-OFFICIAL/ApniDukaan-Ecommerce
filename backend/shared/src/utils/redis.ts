import { createClient, RedisClientType } from 'redis';
import { logger } from './logger';

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
  serialize?: boolean;
}

interface CacheKey {
  key: string;
  prefix: string;
  fullKey: string;
}

export class RedisCache {
  private static instance: RedisCache;
  private client: RedisClientType;
  private isConnected = false;
  private defaultTTL = 3600; // 1 hour
  private keyPrefix = 'shopsphere:';

  private constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    this.client = createClient({
      url: redisUrl,
      socket: {
        connectTimeout: parseInt(process.env.REDIS_CONNECTION_TIMEOUT || '5000'),
        reconnectStrategy: (retries: number) => {
          const maxRetries = parseInt(process.env.REDIS_RETRY_ATTEMPTS || '3');
          if (retries >= maxRetries) {
            logger.error('Redis max reconnection attempts reached');
            return false;
          }
          const delay = Math.min(retries * 100, 3000);
          logger.info(`Attempting Redis reconnection ${retries + 1}/${maxRetries} in ${delay}ms`);
          return delay;
        }
      }
    });

    this.setupEventListeners();
  }

  public static getInstance(): RedisCache {
    if (!RedisCache.instance) {
      RedisCache.instance = new RedisCache();
    }
    return RedisCache.instance;
  }

  private setupEventListeners(): void {
    this.client.on('connect', () => {
      logger.info('Redis client connecting...');
    });

    this.client.on('ready', () => {
      this.isConnected = true;
      logger.info('Redis client connected and ready');
    });

    this.client.on('error', (error: Error) => {
      logger.error('Redis client error:', error);
      this.isConnected = false;
    });

    this.client.on('end', () => {
      this.isConnected = false;
      logger.info('Redis client disconnected');
    });

    this.client.on('reconnecting', () => {
      logger.info('Redis client reconnecting...');
    });
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      await this.client.connect();
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await this.client.disconnect();
      this.isConnected = false;
      logger.info('Redis client disconnected successfully');
    } catch (error) {
      logger.error('Error disconnecting from Redis:', error);
      throw error;
    }
  }

  public isRedisConnected(): boolean {
    return this.isConnected;
  }

  private buildKey(key: string, prefix?: string): CacheKey {
    const keyPrefix = prefix || this.keyPrefix;
    const fullKey = `${keyPrefix}${key}`;
    return {
      key,
      prefix: keyPrefix,
      fullKey
    };
  }

  // Basic cache operations
  public async get<T = any>(key: string, options: CacheOptions = {}): Promise<T | null> {
    if (!this.isConnected) {
      logger.warn('Redis not connected, skipping cache get');
      return null;
    }

    try {
      const cacheKey = this.buildKey(key, options.prefix);
      const value = await this.client.get(cacheKey.fullKey);
      
      if (value === null) {
        return null;
      }

      if (options.serialize !== false) {
        try {
          return JSON.parse(value) as T;
        } catch {
          return value as T;
        }
      }

      return value as T;
    } catch (error) {
      logger.error(`Redis get error for key ${key}:`, error);
      return null;
    }
  }

  public async set<T = any>(
    key: string, 
    value: T, 
    options: CacheOptions = {}
  ): Promise<boolean> {
    if (!this.isConnected) {
      logger.warn('Redis not connected, skipping cache set');
      return false;
    }

    try {
      const cacheKey = this.buildKey(key, options.prefix);
      const ttl = options.ttl || this.defaultTTL;
      
      let serializedValue: string;
      if (options.serialize !== false) {
        serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
      } else {
        serializedValue = value as string;
      }

      const result = await this.client.setEx(cacheKey.fullKey, ttl, serializedValue);
      return result === 'OK';
    } catch (error) {
      logger.error(`Redis set error for key ${key}:`, error);
      return false;
    }
  }

  public async del(key: string, options: CacheOptions = {}): Promise<boolean> {
    if (!this.isConnected) {
      logger.warn('Redis not connected, skipping cache delete');
      return false;
    }

    try {
      const cacheKey = this.buildKey(key, options.prefix);
      const result = await this.client.del(cacheKey.fullKey);
      return result > 0;
    } catch (error) {
      logger.error(`Redis delete error for key ${key}:`, error);
      return false;
    }
  }

  public async exists(key: string, options: CacheOptions = {}): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
      const cacheKey = this.buildKey(key, options.prefix);
      const result = await this.client.exists(cacheKey.fullKey);
      return result > 0;
    } catch (error) {
      logger.error(`Redis exists error for key ${key}:`, error);
      return false;
    }
  }

  // Specialized cache methods
  public async cacheProduct(productId: string, product: any, ttl: number = 3600): Promise<boolean> {
    return this.set(`product:${productId}`, product, { ttl, prefix: 'catalog:' });
  }

  public async getCachedProduct<T>(productId: string): Promise<T | null> {
    return this.get<T>(`product:${productId}`, { prefix: 'catalog:' });
  }

  public async cacheUserCart(userId: string, cart: any, ttl: number = 86400): Promise<boolean> {
    return this.set(`cart:${userId}`, cart, { ttl, prefix: 'user:' });
  }

  public async getCachedUserCart<T>(userId: string): Promise<T | null> {
    return this.get<T>(`cart:${userId}`, { prefix: 'user:' });
  }

  public async cacheSession(sessionId: string, sessionData: any, ttl: number = 86400): Promise<boolean> {
    return this.set(`session:${sessionId}`, sessionData, { ttl, prefix: 'auth:' });
  }

  public async getCachedSession<T>(sessionId: string): Promise<T | null> {
    return this.get<T>(`session:${sessionId}`, { prefix: 'auth:' });
  }

  // Health check
  public async healthCheck(): Promise<{ status: string; latency: number }> {
    if (!this.isConnected) {
      return { status: 'disconnected', latency: -1 };
    }

    try {
      const start = Date.now();
      await this.client.ping();
      const latency = Date.now() - start;
      
      return { status: 'healthy', latency };
    } catch (error) {
      return { status: 'error', latency: -1 };
    }
  }

  // Get client for advanced operations
  public getClient(): RedisClientType {
    return this.client;
  }
}

// Singleton instance
const redisCache = RedisCache.getInstance();

// Export convenience functions
export const connectRedis = () => redisCache.connect();
export const disconnectRedis = () => redisCache.disconnect();
export const isRedisConnected = () => redisCache.isRedisConnected();

// Export cache operations
export const cache = {
  get: <T = any>(key: string, options?: CacheOptions) => redisCache.get<T>(key, options),
  set: <T = any>(key: string, value: T, options?: CacheOptions) => redisCache.set(key, value, options),
  del: (key: string, options?: CacheOptions) => redisCache.del(key, options),
  exists: (key: string, options?: CacheOptions) => redisCache.exists(key, options)
};

export default redisCache;
