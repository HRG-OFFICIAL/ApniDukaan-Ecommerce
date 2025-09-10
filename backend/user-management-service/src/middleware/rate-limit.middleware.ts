import rateLimit, { RateLimitRequestHandler, Options } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';
import { logger } from '../utils/logger';

// Environment configuration
const isDevelopment = process.env.NODE_ENV === 'development';
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Redis client for rate limiting
let redisClient: any;

const initializeRedisClient = async () => {
  try {
    redisClient = createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 10000,
      }
    });

    redisClient.on('error', (err: Error) => {
      logger.error('Rate limit Redis client error:', err);
    });

    redisClient.on('connect', () => {
      logger.debug('Rate limit Redis client connected');
    });

    await redisClient.connect();
  } catch (error) {
    logger.warn('Failed to connect to Redis for rate limiting, using memory store:', error);
  }
};

// Initialize Redis client
initializeRedisClient();

// Custom key generator based on IP and user ID
const keyGenerator = (req: any): string => {
  const userId = req.user?.id || 'anonymous';
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  return `${ip}:${userId}`;
};

// Custom skip function for trusted IPs or specific conditions
const skipFunction = (req: any): boolean => {
  // Skip rate limiting for health checks
  if (req.path === '/health' || req.path === '/metrics') {
    return true;
  }

  // Skip for trusted IPs in development
  if (isDevelopment && (req.ip === '127.0.0.1' || req.ip === '::1')) {
    return false; // Still apply rate limiting in development for testing
  }

  // Skip for specific user agents (monitoring tools)
  const userAgent = req.get('User-Agent') || '';
  const monitoringAgents = ['StatusCake', 'Pingdom', 'UptimeRobot', 'GoogleHC'];
  
  if (monitoringAgents.some(agent => userAgent.includes(agent))) {
    return true;
  }

  return false;
};

// Custom handler for rate limit exceeded
const rateLimitHandler = (req: any, res: any) => {
  logger.warn('Rate limit exceeded:', {
    ip: req.ip,
    userId: req.user?.id,
    path: req.path,
    method: req.method,
    userAgent: req.get('User-Agent')
  });

  res.status(429).json({
    success: false,
    error: 'Too many requests, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: Math.round(req.rateLimit?.resetTime / 1000) || 60,
    limit: req.rateLimit?.limit,
    remaining: req.rateLimit?.remaining,
    timestamp: new Date().toISOString()
  });
};

// Default rate limit configuration
export const rateLimitConfig: Partial<Options> = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 1000 : 100, // More generous in development
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  skip: skipFunction,
  handler: rateLimitHandler,
  store: redisClient ? new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
    prefix: 'rl:general:'
  }) : undefined,
};

// Stricter rate limiting for authentication endpoints
export const authRateLimitConfig: Partial<Options> = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 50 : 5, // Very strict for auth endpoints
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  skip: skipFunction,
  handler: rateLimitHandler,
  store: redisClient ? new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
    prefix: 'rl:auth:'
  }) : undefined,
};

// Rate limiting for password reset requests
export const passwordResetRateLimitConfig: Partial<Options> = {
  windowMs: 60 * 60 * 1000, // 1 hour
  max: isDevelopment ? 10 : 3, // Very few password reset attempts
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => {
    // Use email for password reset rate limiting
    const email = req.body?.email || req.query?.email || 'unknown';
    const ip = req.ip || 'unknown';
    return `${ip}:${email}`;
  },
  skip: skipFunction,
  handler: rateLimitHandler,
  store: redisClient ? new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
    prefix: 'rl:pwd_reset:'
  }) : undefined,
};

// Admin endpoint rate limiting
export const adminRateLimitConfig: Partial<Options> = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 500 : 200, // Higher limit for admin operations
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  skip: skipFunction,
  handler: rateLimitHandler,
  store: redisClient ? new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
    prefix: 'rl:admin:'
  }) : undefined,
};

// File upload rate limiting
export const uploadRateLimitConfig: Partial<Options> = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 50 : 10, // Fewer uploads allowed
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  skip: skipFunction,
  handler: rateLimitHandler,
  store: redisClient ? new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
    prefix: 'rl:upload:'
  }) : undefined,
};

// Create rate limiters
export const generalRateLimit: RateLimitRequestHandler = rateLimit(rateLimitConfig);
export const authRateLimit: RateLimitRequestHandler = rateLimit(authRateLimitConfig);
export const passwordResetRateLimit: RateLimitRequestHandler = rateLimit(passwordResetRateLimitConfig);
export const adminRateLimit: RateLimitRequestHandler = rateLimit(adminRateLimitConfig);
export const uploadRateLimit: RateLimitRequestHandler = rateLimit(uploadRateLimitConfig);

// Middleware to add rate limit info to response headers
export const addRateLimitHeaders = (req: any, res: any, next: any) => {
  if (req.rateLimit) {
    res.set({
      'X-RateLimit-Limit': req.rateLimit.limit,
      'X-RateLimit-Remaining': req.rateLimit.remaining,
      'X-RateLimit-Reset': new Date(req.rateLimit.resetTime).toISOString()
    });
  }
  next();
};

// Utility function to check if an IP is rate limited
export const checkRateLimit = async (key: string, windowMs: number, maxRequests: number): Promise<boolean> => {
  if (!redisClient) {
    return false; // Cannot check without Redis
  }

  try {
    const current = await redisClient.incr(key);
    if (current === 1) {
      await redisClient.expire(key, Math.ceil(windowMs / 1000));
    }
    return current > maxRequests;
  } catch (error) {
    logger.error('Error checking rate limit:', error);
    return false;
  }
};

// Graceful shutdown for Redis client
export const shutdownRateLimitRedis = async (): Promise<void> => {
  if (redisClient) {
    try {
      await redisClient.quit();
      logger.info('Rate limit Redis client disconnected');
    } catch (error) {
      logger.error('Error disconnecting rate limit Redis client:', error);
    }
  }
};

// Development logging
if (isDevelopment) {
  logger.info('Rate limiting configuration loaded:', {
    general: { windowMs: rateLimitConfig.windowMs, max: rateLimitConfig.max },
    auth: { windowMs: authRateLimitConfig.windowMs, max: authRateLimitConfig.max },
    passwordReset: { windowMs: passwordResetRateLimitConfig.windowMs, max: passwordResetRateLimitConfig.max },
    admin: { windowMs: adminRateLimitConfig.windowMs, max: adminRateLimitConfig.max },
    upload: { windowMs: uploadRateLimitConfig.windowMs, max: uploadRateLimitConfig.max },
    redisEnabled: !!redisClient
  });
}
