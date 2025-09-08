import { RedisClientType } from 'redis';
interface CacheOptions {
    ttl?: number;
    prefix?: string;
    serialize?: boolean;
}
export declare class RedisCache {
    private static instance;
    private client;
    private isConnected;
    private defaultTTL;
    private keyPrefix;
    private constructor();
    static getInstance(): RedisCache;
    private setupEventListeners;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    isRedisConnected(): boolean;
    private buildKey;
    get<T = any>(key: string, options?: CacheOptions): Promise<T | null>;
    set<T = any>(key: string, value: T, options?: CacheOptions): Promise<boolean>;
    del(key: string, options?: CacheOptions): Promise<boolean>;
    exists(key: string, options?: CacheOptions): Promise<boolean>;
    cacheProduct(productId: string, product: any, ttl?: number): Promise<boolean>;
    getCachedProduct<T>(productId: string): Promise<T | null>;
    cacheUserCart(userId: string, cart: any, ttl?: number): Promise<boolean>;
    getCachedUserCart<T>(userId: string): Promise<T | null>;
    cacheSession(sessionId: string, sessionData: any, ttl?: number): Promise<boolean>;
    getCachedSession<T>(sessionId: string): Promise<T | null>;
    healthCheck(): Promise<{
        status: string;
        latency: number;
    }>;
    getClient(): RedisClientType;
}
declare const redisCache: RedisCache;
export declare const connectRedis: () => Promise<void>;
export declare const disconnectRedis: () => Promise<void>;
export declare const isRedisConnected: () => boolean;
export declare const cache: {
    get: <T = any>(key: string, options?: CacheOptions) => Promise<T | null>;
    set: <T = any>(key: string, value: T, options?: CacheOptions) => Promise<boolean>;
    del: (key: string, options?: CacheOptions) => Promise<boolean>;
    exists: (key: string, options?: CacheOptions) => Promise<boolean>;
};
export default redisCache;
//# sourceMappingURL=redis.d.ts.map