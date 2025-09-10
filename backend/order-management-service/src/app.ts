import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import morgan from 'morgan';
import { createClient } from 'redis';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Import routes
import orderRoutes from './routes/orders';

// Import middleware
import { logger } from '@apnidukaan/shared';

// Load environment variables
dotenv.config();

class OrderManagementApp {
  public app: Application;
  private redisClient: any;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS configuration
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN?.split(',') || [
        'http://localhost:3000',
        'http://localhost:3001',
        'https://shopsphere.com'
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-User-Id',
        'X-User-Role',
        'X-API-Key',
        'stripe-signature'
      ]
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
      message: {
        success: false,
        error: 'Too many requests from this IP, please try again later.',
        code: 'RATE_LIMIT_EXCEEDED'
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api/orders', limiter);

    // Body parsing middleware
    this.app.use(express.json({ 
      limit: '10mb',
      verify: (req: any, _res, buf) => {
        // Store raw body for webhook signature verification
        if (req.originalUrl.includes('/webhooks/')) {
          req.rawBody = buf;
        }
      }
    }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Compression middleware
    this.app.use(compression({
      threshold: 1024, // Only compress responses larger than 1KB
      filter: (req, res) => {
        // Don't compress responses with this request header
        if (req.headers['x-no-compression']) {
          return false;
        }
        // Fallback to standard filter function
        return compression.filter(req, res);
      }
    }));

    // Data sanitization against NoSQL injection attacks
    this.app.use(mongoSanitize({
      replaceWith: '_',
      onSanitize: ({ req, key }) => {
        logger.warn(`Sanitized key "${key}" in request`, {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path
        });
      }
    }));

    // HTTP request logger
    const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
    this.app.use(morgan(morganFormat, {
      stream: {
        write: (message: string) => {
          logger.info(message.trim(), { component: 'http' });
        }
      },
      skip: (req: Request) => {
        // Skip logging for health check and metrics endpoints
        return req.url === '/health' || req.url === '/metrics';
      }
    }));

    // Add request ID middleware for tracing
    this.app.use((req: any, res: Response, next: NextFunction) => {
      req.requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      res.setHeader('X-Request-Id', req.requestId);
      next();
    });

    // Add request timing middleware
    this.app.use((req: any, res: Response, next: NextFunction) => {
      req.startTime = Date.now();
      
      // Override res.end to calculate response time
      const originalEnd = res.end;
      (res as any).end = function(...args: any[]) {
        const responseTime = Date.now() - req.startTime;
        res.setHeader('X-Response-Time', `${responseTime}ms`);
        
        if (responseTime > 5000) { // Log slow requests (>5s)
          logger.warn('Slow request detected', {
            method: req.method,
            url: req.url,
            responseTime: `${responseTime}ms`,
            requestId: req.requestId,
            ip: req.ip
          });
        }
        
        (originalEnd as any).apply(res, args);
      };
      
      next();
    });
  }

  private initializeRoutes(): void {
    // Health check route
    this.app.get('/health', (_req: Request, res: Response) => {
      res.status(200).json({
        success: true,
        service: 'order-management-service',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: {
          used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
          total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
          external: Math.round((process.memoryUsage().external / 1024 / 1024) * 100) / 100
        },
        database: {
          mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
          redis: this.redisClient?.isReady ? 'connected' : 'disconnected'
        }
      });
    });

    // Readiness probe for Kubernetes
    this.app.get('/ready', (_req: Request, res: Response) => {
      const isReady = mongoose.connection.readyState === 1 && 
                     (this.redisClient?.isReady || false);
      
      if (isReady) {
        res.status(200).json({
          success: true,
          message: 'Service is ready',
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(503).json({
          success: false,
          message: 'Service is not ready',
          timestamp: new Date().toISOString(),
          checks: {
            mongodb: mongoose.connection.readyState === 1,
            redis: this.redisClient?.isReady || false
          }
        });
      }
    });

    // Liveness probe for Kubernetes
    this.app.get('/live', (_req: Request, res: Response) => {
      res.status(200).json({
        success: true,
        message: 'Service is alive',
        timestamp: new Date().toISOString()
      });
    });

    // API routes
    this.app.use('/api/orders', orderRoutes);

    // Root route
    this.app.get('/', (_req: Request, res: Response) => {
      res.json({
        success: true,
        message: 'ShopSphere Order Management Service API',
        version: process.env.npm_package_version || '1.0.0',
        documentation: '/api/docs',
        health: '/health',
        timestamp: new Date().toISOString()
      });
    });

    // Handle 404 routes
    this.app.use('*', (req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        error: 'Route not found',
        code: 'ROUTE_NOT_FOUND',
        path: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString()
      });
    });
  }

  private initializeErrorHandling(): void {
    // Global error handler
    this.app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
      // Log the error
      logger.error('Unhandled error in request:', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        body: req.body,
        params: req.params,
        query: req.query,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        requestId: (req as any).requestId
      });

      // Handle specific error types
      let statusCode = 500;
      let errorMessage = 'Internal server error';
      let errorCode = 'INTERNAL_ERROR';

      if (err.name === 'ValidationError') {
        statusCode = 400;
        errorMessage = 'Validation failed';
        errorCode = 'VALIDATION_ERROR';
      } else if (err.name === 'CastError') {
        statusCode = 400;
        errorMessage = 'Invalid ID format';
        errorCode = 'INVALID_ID';
      } else if (err.code === 11000) {
        statusCode = 409;
        errorMessage = 'Duplicate key error';
        errorCode = 'DUPLICATE_KEY';
      } else if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        errorMessage = 'Invalid token';
        errorCode = 'INVALID_TOKEN';
      } else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        errorMessage = 'Token expired';
        errorCode = 'TOKEN_EXPIRED';
      } else if (err.type === 'entity.parse.failed') {
        statusCode = 400;
        errorMessage = 'Invalid JSON payload';
        errorCode = 'INVALID_JSON';
      }

      // Don't leak error details in production
      const errorResponse: any = {
        success: false,
        error: errorMessage,
        code: errorCode,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
      };

      if (process.env.NODE_ENV === 'development') {
        errorResponse.details = {
          message: err.message,
          stack: err.stack,
          requestId: (req as any).requestId
        };
      }

      res.status(statusCode).json(errorResponse);
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err: Error) => {
      logger.error('Uncaught Exception:', err);
      // Give server time to finish pending requests
      setTimeout(() => {
        process.exit(1);
      }, 5000);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      // Give server time to finish pending requests
      setTimeout(() => {
        process.exit(1);
      }, 5000);
    });
  }

  public async initializeDatabase(): Promise<void> {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/shopsphere-orders';
      
      await mongoose.connect(mongoUri, {
        maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10'),
        serverSelectionTimeoutMS: parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT || '5000'),
        socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT || '45000'),
        // bufferMaxEntries: 0, // Deprecated option
        retryWrites: true,
        w: 'majority'
      });

      logger.info('Connected to MongoDB successfully', {
        uri: mongoUri.replace(/\/\/.*@/, '//***:***@'), // Hide credentials in logs
        database: mongoose.connection.db?.databaseName || 'unknown'
      });

      // Handle MongoDB connection events
      mongoose.connection.on('error', (err) => {
        logger.error('MongoDB connection error:', err);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected');
      });

    } catch (error) {
      logger.error('Failed to connect to MongoDB:', error);
      process.exit(1);
    }
  }

  public async initializeRedis(): Promise<void> {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      this.redisClient = createClient({
        url: redisUrl,
        socket: {
          connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT || '5000'),
          // lazyConnect: true, // Deprecated option
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              return new Error('Redis connection retry limit exceeded');
            }
            return Math.min(retries * 50, 1000);
          }
        }
      });

      this.redisClient.on('error', (err: any) => {
        logger.error('Redis client error:', err);
      });

      this.redisClient.on('connect', () => {
        logger.info('Connected to Redis successfully');
      });

      this.redisClient.on('ready', () => {
        logger.info('Redis client ready');
      });

      this.redisClient.on('end', () => {
        logger.warn('Redis connection ended');
      });

      await this.redisClient.connect();

    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      // Redis is not critical for the service to start, so we don't exit
      this.redisClient = null;
    }
  }

  public async start(): Promise<void> {
    const port = process.env.PORT || 3002;
    
    // Initialize database connections
    await this.initializeDatabase();
    await this.initializeRedis();

    // Start the server
    this.app.listen(port, () => {
      logger.info(`Order Management Service started successfully`, {
        port,
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
      });
    });

    // Graceful shutdown handling
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);
      
      // Stop accepting new connections
      const server = this.app.listen();
      server.close(async () => {
        try {
          // Close database connections
          await mongoose.connection.close();
          if (this.redisClient) {
            await this.redisClient.quit();
          }
          
          logger.info('Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during graceful shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after timeout
      setTimeout(() => {
        logger.error('Forced shutdown due to timeout');
        process.exit(1);
      }, parseInt(process.env.SHUTDOWN_TIMEOUT || '10000'));
    };

    // Listen for shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  }

  public getRedisClient() {
    return this.redisClient;
  }
}

export default OrderManagementApp;
