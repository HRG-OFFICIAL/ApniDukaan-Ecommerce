import Redis, { RedisOptions } from 'ioredis';
import { logger } from './logger';

// Redis configuration interface
export interface RedisConfig {
  url?: string;
  host?: string;
  port?: number;
  password?: string;
  database?: number;
  retryDelayOnFailover?: number;
  maxRetriesPerRequest?: number;
  lazyConnect?: boolean;
  keepAlive?: number;
  family?: number;
  connectTimeout?: number;
  commandTimeout?: number;
  retryDelayOnClusterDown?: number;
  enableOfflineQueue?: boolean;
  maxLoadingTimeout?: number;
  enableReadyCheck?: boolean;
  enableAutoPipelining?: boolean;
  maxMemoryPolicy?: string;
  maxMemorySamples?: number;
  maxMemoryEvictionPolicy?: string;
}

// Cache options interface
export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  nx?: boolean; // Only set if key doesn't exist
  xx?: boolean; // Only set if key exists
  ex?: number; // Set expiry in seconds
  px?: number; // Set expiry in milliseconds
  exat?: number; // Set expiry at Unix timestamp
  pxat?: number; // Set expiry at Unix timestamp in milliseconds
  keepttl?: boolean; // Retain the time to live
}

// Redis service class
export class RedisService {
  private client: Redis | null = null;
  private config: RedisConfig;
  private isConnected: boolean = false;

  constructor(config: RedisConfig = {}) {
    this.config = {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      database: parseInt(process.env.REDIS_DB || '0'),
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      keepAlive: 30000,
      family: 4,
      connectTimeout: 10000,
      commandTimeout: 5000,
      enableOfflineQueue: false,
      maxLoadingTimeout: 5000,
      enableReadyCheck: true,
      enableAutoPipelining: true,
      ...config
    };
  }

  /**
   * Connect to Redis
   */
  async connect(): Promise<Redis> {
    try {
      if (this.client && this.isConnected) {
        return this.client;
      }

      const clientOptions: RedisOptions = {
        host: this.config.host,
        port: this.config.port,
        password: this.config.password,
        db: this.config.database,
        maxRetriesPerRequest: this.config.maxRetriesPerRequest,
        lazyConnect: this.config.lazyConnect,
        keepAlive: this.config.keepAlive,
        family: this.config.family,
        connectTimeout: this.config.connectTimeout,
        commandTimeout: this.config.commandTimeout,
        enableOfflineQueue: this.config.enableOfflineQueue,
        enableReadyCheck: this.config.enableReadyCheck,
        enableAutoPipelining: this.config.enableAutoPipelining
      };

      this.client = new Redis(clientOptions);

      // Set up event listeners
      this.client.on('error', (err: any) => {
        logger.error('Redis client error', {
          error: err.message,
          action: 'redis_error'
        });
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('Redis client connecting', {
          action: 'redis_connecting'
        });
      });

      this.client.on('ready', () => {
        logger.info('Redis client ready', {
          action: 'redis_ready'
        });
        this.isConnected = true;
      });

      this.client.on('end', () => {
        logger.info('Redis client disconnected', {
          action: 'redis_disconnected'
        });
        this.isConnected = false;
      });

      this.client.on('reconnecting', () => {
        logger.info('Redis client reconnecting', {
          action: 'redis_reconnecting'
        });
      });

      if (this.config.lazyConnect) {
        this.isConnected = true;
      } else {
        await this.client.connect();
        this.isConnected = true;
      }
      return this.client;
    } catch (error: any) {
      logger.error('Redis connection failed', {
        error: error.message,
        config: {
          host: this.config.host,
          port: this.config.port,
          database: this.config.database
        },
        action: 'redis_connect_error'
      });
      throw error;
    }
  }

  /**
   * Get Redis client
   */
  getClient(): Redis | null {
    return this.client;
  }

  /**
   * Check if connected
   */
  isClientConnected(): boolean {
    return this.isConnected && this.client?.status === 'ready';
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    try {
      if (this.client && this.isConnected) {
        this.client.disconnect();
        this.client = null;
        this.isConnected = false;
        logger.info('Redis client disconnected', {
          action: 'redis_disconnect'
        });
      }
    } catch (error: any) {
      logger.error('Redis disconnection failed', {
        error: error.message,
        action: 'redis_disconnect_error'
      });
      throw error;
    }
  }

  /**
   * Ping Redis server
   */
  async ping(): Promise<string> {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client not connected');
    }
    return await this.client.ping();
  }

  /**
   * Set key-value pair
   */
  async set(key: string, value: string | number | object, options?: CacheOptions): Promise<string | null> {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client not connected');
    }

    try {
      const serializedValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      const result = await this.client.set(key, serializedValue, options as any);
      
      logger.debug('Redis SET operation', {
        key,
        ttl: options?.ttl,
        action: 'redis_set'
      });

      return result;
    } catch (error: any) {
      logger.error('Redis SET operation failed', {
        key,
        error: error.message,
        action: 'redis_set_error'
      });
      throw error;
    }
  }

  /**
   * Get value by key
   */
  async get(key: string): Promise<string | null> {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client not connected');
    }

    try {
      const result = await this.client.get(key);
      
      logger.debug('Redis GET operation', {
        key,
        found: result !== null,
        action: 'redis_get'
      });

      return result;
    } catch (error: any) {
      logger.error('Redis GET operation failed', {
        key,
        error: error.message,
        action: 'redis_get_error'
      });
      throw error;
    }
  }

  /**
   * Get and parse JSON value
   */
  async getJson<T = any>(key: string): Promise<T | null> {
    try {
      const value = await this.get(key);
      if (value === null) {
        return null;
      }
      return JSON.parse(value) as T;
    } catch (error: any) {
      logger.error('Redis GET JSON operation failed', {
        key,
        error: error.message,
        action: 'redis_get_json_error'
      });
      throw error;
    }
  }

  /**
   * Delete key(s)
   */
  async del(...keys: string[]): Promise<number> {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client not connected');
    }

    try {
      const result = await this.client.del(keys);
      
      logger.debug('Redis DEL operation', {
        keys,
        deletedCount: result,
        action: 'redis_del'
      });

      return result;
    } catch (error: any) {
      logger.error('Redis DEL operation failed', {
        keys,
        error: error.message,
        action: 'redis_del_error'
      });
      throw error;
    }
  }

  /**
   * Check if key exists
   */
  async exists(...keys: string[]): Promise<number> {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client not connected');
    }

    try {
      const result = await this.client.exists(keys);
      
      logger.debug('Redis EXISTS operation', {
        keys,
        count: result,
        action: 'redis_exists'
      });

      return result;
    } catch (error: any) {
      logger.error('Redis EXISTS operation failed', {
        keys,
        error: error.message,
        action: 'redis_exists_error'
      });
      throw error;
    }
  }

  /**
   * Set expiration for key
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client not connected');
    }

    try {
      const result = await this.client.expire(key, seconds);
      
      logger.debug('Redis EXPIRE operation', {
        key,
        seconds,
        success: result,
        action: 'redis_expire'
      });

      return result as any;
    } catch (error: any) {
      logger.error('Redis EXPIRE operation failed', {
        key,
        seconds,
        error: error.message,
        action: 'redis_expire_error'
      });
      throw error;
    }
  }

  /**
   * Get TTL for key
   */
  async ttl(key: string): Promise<number> {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client not connected');
    }

    try {
      const result = await this.client.ttl(key);
      
      logger.debug('Redis TTL operation', {
        key,
        ttl: result,
        action: 'redis_ttl'
      });

      return result;
    } catch (error: any) {
      logger.error('Redis TTL operation failed', {
        key,
        error: error.message,
        action: 'redis_ttl_error'
      });
      throw error;
    }
  }

  /**
   * Increment key value
   */
  async incr(key: string): Promise<number> {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client not connected');
    }

    try {
      const result = await this.client.incr(key);
      
      logger.debug('Redis INCR operation', {
        key,
        value: result,
        action: 'redis_incr'
      });

      return result;
    } catch (error: any) {
      logger.error('Redis INCR operation failed', {
        key,
        error: error.message,
        action: 'redis_incr_error'
      });
      throw error;
    }
  }

  /**
   * Decrement key value
   */
  async decr(key: string): Promise<number> {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client not connected');
    }

    try {
      const result = await this.client.decr(key);
      
      logger.debug('Redis DECR operation', {
        key,
        value: result,
        action: 'redis_decr'
      });

      return result;
    } catch (error: any) {
      logger.error('Redis DECR operation failed', {
        key,
        error: error.message,
        action: 'redis_decr_error'
      });
      throw error;
    }
  }

  /**
   * Get all keys matching pattern
   */
  async keys(pattern: string): Promise<string[]> {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client not connected');
    }

    try {
      const result = await this.client.keys(pattern);
      
      logger.debug('Redis KEYS operation', {
        pattern,
        count: result.length,
        action: 'redis_keys'
      });

      return result;
    } catch (error: any) {
      logger.error('Redis KEYS operation failed', {
        pattern,
        error: error.message,
        action: 'redis_keys_error'
      });
      throw error;
    }
  }

  /**
   * Flush all databases
   */
  async flushAll(): Promise<string> {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client not connected');
    }

    try {
      const result = await this.client.flushall();
      
      logger.warn('Redis FLUSHALL operation', {
        action: 'redis_flushall'
      });

      return result;
    } catch (error: any) {
      logger.error('Redis FLUSHALL operation failed', {
        error: error.message,
        action: 'redis_flushall_error'
      });
      throw error;
    }
  }

  /**
   * Get Redis info
   */
  async info(section?: string): Promise<string> {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client not connected');
    }

    try {
      const result = await this.client.info(section || '');
      
      logger.debug('Redis INFO operation', {
        section,
        action: 'redis_info'
      });

      return result;
    } catch (error: any) {
      logger.error('Redis INFO operation failed', {
        section,
        error: error.message,
        action: 'redis_info_error'
      });
      throw error;
    }
  }

  /**
   * Get Redis memory usage
   */
  async memoryUsage(key: string): Promise<number> {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client not connected');
    }

    try {
      const result = await (this.client as any).memoryUsage(key);
      
      logger.debug('Redis MEMORY USAGE operation', {
        key,
        bytes: result,
        action: 'redis_memory_usage'
      });

      return result;
    } catch (error: any) {
      logger.error('Redis MEMORY USAGE operation failed', {
        key,
        error: error.message,
        action: 'redis_memory_usage_error'
      });
      throw error;
    }
  }

  /**
   * Cache with automatic JSON serialization/deserialization
   */
  async cache<T = any>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 3600
  ): Promise<T> {
    try {
      // Try to get from cache first
      const cached = await this.getJson<T>(key);
      if (cached !== null) {
        logger.debug('Cache hit', {
          key,
          action: 'redis_cache_hit'
        });
        return cached;
      }

      // Fetch fresh data
      logger.debug('Cache miss, fetching fresh data', {
        key,
        action: 'redis_cache_miss'
      });
      const data = await fetcher();

      // Store in cache
      await this.set(key, data as any, { ttl });
      
      logger.debug('Data cached', {
        key,
        ttl,
        action: 'redis_cache_store'
      });

      return data;
    } catch (error: any) {
      logger.error('Cache operation failed', {
        key,
        error: error.message,
        action: 'redis_cache_error'
      });
      throw error;
    }
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidatePattern(pattern: string): Promise<number> {
    try {
      const keys = await this.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }

      const deletedCount = await this.del(...keys);
      
      logger.info('Cache invalidated by pattern', {
        pattern,
        deletedCount,
        action: 'redis_cache_invalidate_pattern'
      });

      return deletedCount;
    } catch (error: any) {
      logger.error('Cache invalidation failed', {
        pattern,
        error: error.message,
        action: 'redis_cache_invalidate_error'
      });
      throw error;
    }
  }
}

// Create singleton instance
export const redisService = new RedisService();

// Legacy functions for backward compatibility
export const connectRedis = async (): Promise<Redis> => {
  return await redisService.connect();
};

export const getRedisClient = (): Redis | null => {
  return redisService.getClient();
};

export const disconnectRedis = async (): Promise<void> => {
  return await redisService.disconnect();
};

// Export the service as default
export default redisService;