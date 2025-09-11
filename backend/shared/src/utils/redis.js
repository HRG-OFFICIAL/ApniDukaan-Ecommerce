"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cache = exports.isRedisConnected = exports.disconnectRedis = exports.connectRedis = exports.RedisCache = void 0;
const redis_1 = require("redis");
const logger_1 = require("./logger");
class RedisCache {
    constructor() {
        this.isConnected = false;
        this.defaultTTL = 3600; // 1 hour
        this.keyPrefix = 'ApniDukaan:';
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        this.client = (0, redis_1.createClient)({
            url: redisUrl,
            socket: {
                connectTimeout: parseInt(process.env.REDIS_CONNECTION_TIMEOUT || '5000'),
                reconnectStrategy: (retries) => {
                    const maxRetries = parseInt(process.env.REDIS_RETRY_ATTEMPTS || '3');
                    if (retries >= maxRetries) {
                        logger_1.logger.error('Redis max reconnection attempts reached');
                        return false;
                    }
                    const delay = Math.min(retries * 100, 3000);
                    logger_1.logger.info(`Attempting Redis reconnection ${retries + 1}/${maxRetries} in ${delay}ms`);
                    return delay;
                }
            }
        });
        this.setupEventListeners();
    }
    static getInstance() {
        if (!RedisCache.instance) {
            RedisCache.instance = new RedisCache();
        }
        return RedisCache.instance;
    }
    setupEventListeners() {
        this.client.on('connect', () => {
            logger_1.logger.info('Redis client connecting...');
        });
        this.client.on('ready', () => {
            this.isConnected = true;
            logger_1.logger.info('Redis client connected and ready');
        });
        this.client.on('error', (error) => {
            logger_1.logger.error('Redis client error:', error);
            this.isConnected = false;
        });
        this.client.on('end', () => {
            this.isConnected = false;
            logger_1.logger.info('Redis client disconnected');
        });
        this.client.on('reconnecting', () => {
            logger_1.logger.info('Redis client reconnecting...');
        });
    }
    async connect() {
        if (this.isConnected) {
            return;
        }
        try {
            await this.client.connect();
        }
        catch (error) {
            logger_1.logger.error('Failed to connect to Redis:', error);
            throw error;
        }
    }
    async disconnect() {
        if (!this.isConnected) {
            return;
        }
        try {
            await this.client.disconnect();
            this.isConnected = false;
            logger_1.logger.info('Redis client disconnected successfully');
        }
        catch (error) {
            logger_1.logger.error('Error disconnecting from Redis:', error);
            throw error;
        }
    }
    isRedisConnected() {
        return this.isConnected;
    }
    buildKey(key, prefix) {
        const keyPrefix = prefix || this.keyPrefix;
        const fullKey = `${keyPrefix}${key}`;
        return {
            key,
            prefix: keyPrefix,
            fullKey
        };
    }
    // Basic cache operations
    async get(key, options = {}) {
        if (!this.isConnected) {
            logger_1.logger.warn('Redis not connected, skipping cache get');
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
                    return JSON.parse(value);
                }
                catch {
                    return value;
                }
            }
            return value;
        }
        catch (error) {
            logger_1.logger.error(`Redis get error for key ${key}:`, error);
            return null;
        }
    }
    async set(key, value, options = {}) {
        if (!this.isConnected) {
            logger_1.logger.warn('Redis not connected, skipping cache set');
            return false;
        }
        try {
            const cacheKey = this.buildKey(key, options.prefix);
            const ttl = options.ttl || this.defaultTTL;
            let serializedValue;
            if (options.serialize !== false) {
                serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
            }
            else {
                serializedValue = value;
            }
            const result = await this.client.setEx(cacheKey.fullKey, ttl, serializedValue);
            return result === 'OK';
        }
        catch (error) {
            logger_1.logger.error(`Redis set error for key ${key}:`, error);
            return false;
        }
    }
    async del(key, options = {}) {
        if (!this.isConnected) {
            logger_1.logger.warn('Redis not connected, skipping cache delete');
            return false;
        }
        try {
            const cacheKey = this.buildKey(key, options.prefix);
            const result = await this.client.del(cacheKey.fullKey);
            return result > 0;
        }
        catch (error) {
            logger_1.logger.error(`Redis delete error for key ${key}:`, error);
            return false;
        }
    }
    async exists(key, options = {}) {
        if (!this.isConnected) {
            return false;
        }
        try {
            const cacheKey = this.buildKey(key, options.prefix);
            const result = await this.client.exists(cacheKey.fullKey);
            return result > 0;
        }
        catch (error) {
            logger_1.logger.error(`Redis exists error for key ${key}:`, error);
            return false;
        }
    }
    // Specialized cache methods
    async cacheProduct(productId, product, ttl = 3600) {
        return this.set(`product:${productId}`, product, { ttl, prefix: 'catalog:' });
    }
    async getCachedProduct(productId) {
        return this.get(`product:${productId}`, { prefix: 'catalog:' });
    }
    async cacheUserCart(userId, cart, ttl = 86400) {
        return this.set(`cart:${userId}`, cart, { ttl, prefix: 'user:' });
    }
    async getCachedUserCart(userId) {
        return this.get(`cart:${userId}`, { prefix: 'user:' });
    }
    async cacheSession(sessionId, sessionData, ttl = 86400) {
        return this.set(`session:${sessionId}`, sessionData, { ttl, prefix: 'auth:' });
    }
    async getCachedSession(sessionId) {
        return this.get(`session:${sessionId}`, { prefix: 'auth:' });
    }
    // Health check
    async healthCheck() {
        if (!this.isConnected) {
            return { status: 'disconnected', latency: -1 };
        }
        try {
            const start = Date.now();
            await this.client.ping();
            const latency = Date.now() - start;
            return { status: 'healthy', latency };
        }
        catch (error) {
            return { status: 'error', latency: -1 };
        }
    }
    // Get client for advanced operations
    getClient() {
        return this.client;
    }
}
exports.RedisCache = RedisCache;
// Singleton instance
const redisCache = RedisCache.getInstance();
// Export convenience functions
const connectRedis = () => redisCache.connect();
exports.connectRedis = connectRedis;
const disconnectRedis = () => redisCache.disconnect();
exports.disconnectRedis = disconnectRedis;
const isRedisConnected = () => redisCache.isRedisConnected();
exports.isRedisConnected = isRedisConnected;
// Export cache operations
exports.cache = {
    get: (key, options) => redisCache.get(key, options),
    set: (key, value, options) => redisCache.set(key, value, options),
    del: (key, options) => redisCache.del(key, options),
    exists: (key, options) => redisCache.exists(key, options)
};
exports.default = redisCache;
//# sourceMappingURL=redis.js.map