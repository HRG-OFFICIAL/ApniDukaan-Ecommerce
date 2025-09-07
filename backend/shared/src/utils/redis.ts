import Redis from 'redis';
import { logger } from './logger';

export class RedisConnection {
  private static instance: RedisConnection;
  private client: Redis.RedisClientType | null = null;
  private isConnected = false;

  public static getInstance(): RedisConnection {
    if (!RedisConnection.instance) {
      RedisConnection.instance = new RedisConnection();
    }
    return RedisConnection.instance;
  }

  public async connect(url: string, password?: string): Promise<void> {
    if (this.isConnected && this.client) {
      logger.info('Redis already connected');
      return;
    }

    try {
      this.client = Redis.createClient({
        url,
        password,
        retry_delay_on_failover: 100,
        max_attempts: 3,
        connect_timeout: 60000,
        lazyConnect: true
      });

      this.client.on('error', (error) => {
        logger.error('Redis connection error:', error);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('Redis connected');
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        logger.warn('Redis disconnected');
        this.isConnected = false;
      });

      this.client.on('reconnecting', () => {
        logger.info('Redis reconnecting...');
      });

      await this.client.connect();
      logger.info('Redis connection established successfully');

    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.client) {
      return;
    }

    try {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
      logger.info('Redis disconnected successfully');
    } catch (error) {
      logger.error('Error disconnecting from Redis:', error);
      throw error;
    }
  }

  public getClient(): Redis.RedisClientType {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client is not connected');
    }
    return this.client;
  }

  public isClientConnected(): boolean {
    return this.isConnected && this.client !== null;
  }
}

// Convenience functions
export const connectRedis = async (url: string, password?: string): Promise<void> => {
  const redis = RedisConnection.getInstance();
  await redis.connect(url, password);
};

export const disconnectRedis = async (): Promise<void> => {
  const redis = RedisConnection.getInstance();
  await redis.disconnect();
};

export const getRedisClient = (): Redis.RedisClientType => {
  const redis = RedisConnection.getInstance();
  return redis.getClient();
};

// Cache utility class
export class CacheService {
  private redis: Redis.RedisClientType;

  constructor() {
    this.redis = getRedisClient();
  }

  async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      if (!value) return null;
      return JSON.parse(value);
    } catch (error) {
      logger.error(`Error getting cache key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.redis.setEx(key, ttlSeconds, serialized);
      } else {
        await this.redis.set(key, serialized);
      }
      return true;
    } catch (error) {
      logger.error(`Error setting cache key ${key}:`, error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      logger.error(`Error deleting cache key ${key}:`, error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Error checking cache key ${key}:`, error);
      return false;
    }
  }

  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    try {
      await this.redis.expire(key, ttlSeconds);
      return true;
    } catch (error) {
      logger.error(`Error setting TTL for cache key ${key}:`, error);
      return false;
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      return await this.redis.ttl(key);
    } catch (error) {
      logger.error(`Error getting TTL for cache key ${key}:`, error);
      return -1;
    }
  }

  async flush(): Promise<boolean> {
    try {
      await this.redis.flushDb();
      return true;
    } catch (error) {
      logger.error('Error flushing cache:', error);
      return false;
    }
  }

  // Hash operations
  async hGet(key: string, field: string): Promise<string | null> {
    try {
      return await this.redis.hGet(key, field);
    } catch (error) {
      logger.error(`Error getting hash field ${field} from ${key}:`, error);
      return null;
    }
  }

  async hSet(key: string, field: string, value: string): Promise<boolean> {
    try {
      await this.redis.hSet(key, field, value);
      return true;
    } catch (error) {
      logger.error(`Error setting hash field ${field} in ${key}:`, error);
      return false;
    }
  }

  async hGetAll(key: string): Promise<{ [field: string]: string } | null> {
    try {
      return await this.redis.hGetAll(key);
    } catch (error) {
      logger.error(`Error getting all hash fields from ${key}:`, error);
      return null;
    }
  }

  // List operations
  async lPush(key: string, ...values: string[]): Promise<number> {
    try {
      return await this.redis.lPush(key, values);
    } catch (error) {
      logger.error(`Error pushing to list ${key}:`, error);
      return 0;
    }
  }

  async rPop(key: string): Promise<string | null> {
    try {
      return await this.redis.rPop(key);
    } catch (error) {
      logger.error(`Error popping from list ${key}:`, error);
      return null;
    }
  }

  async lRange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      return await this.redis.lRange(key, start, stop);
    } catch (error) {
      logger.error(`Error getting range from list ${key}:`, error);
      return [];
    }
  }

  // Set operations
  async sAdd(key: string, ...members: string[]): Promise<number> {
    try {
      return await this.redis.sAdd(key, members);
    } catch (error) {
      logger.error(`Error adding to set ${key}:`, error);
      return 0;
    }
  }

  async sMembers(key: string): Promise<string[]> {
    try {
      return await this.redis.sMembers(key);
    } catch (error) {
      logger.error(`Error getting set members from ${key}:`, error);
      return [];
    }
  }

  async sIsMember(key: string, member: string): Promise<boolean> {
    try {
      return await this.redis.sIsMember(key, member);
    } catch (error) {
      logger.error(`Error checking set membership in ${key}:`, error);
      return false;
    }
  }
}

// Session management utilities
export class SessionManager {
  private cache: CacheService;
  private sessionTTL: number;

  constructor(sessionTTLSeconds: number = 86400) { // 24 hours default
    this.cache = new CacheService();
    this.sessionTTL = sessionTTLSeconds;
  }

  private getSessionKey(sessionId: string): string {
    return `session:${sessionId}`;
  }

  async createSession(sessionId: string, data: any): Promise<boolean> {
    const key = this.getSessionKey(sessionId);
    return await this.cache.set(key, data, this.sessionTTL);
  }

  async getSession<T = any>(sessionId: string): Promise<T | null> {
    const key = this.getSessionKey(sessionId);
    return await this.cache.get<T>(key);
  }

  async updateSession(sessionId: string, data: any): Promise<boolean> {
    const key = this.getSessionKey(sessionId);
    return await this.cache.set(key, data, this.sessionTTL);
  }

  async destroySession(sessionId: string): Promise<boolean> {
    const key = this.getSessionKey(sessionId);
    return await this.cache.del(key);
  }

  async refreshSession(sessionId: string): Promise<boolean> {
    const key = this.getSessionKey(sessionId);
    return await this.cache.expire(key, this.sessionTTL);
  }
}
