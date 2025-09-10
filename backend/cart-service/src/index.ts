import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import RedisStore from 'connect-redis';
import { createClient } from 'redis';
import mongoose from 'mongoose';
import { connectDatabase, logger } from '@apnidukaan/shared';

// Import routes
import cartRoutes from './routes/cart';

// Import services
import CartService from './services/CartService';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 4003;

  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://userservice-dev:OELp6t3K63rHhKgJ@cluster0.0ezsixh.mongodb.net/apnidukaan_cart?retryWrites=true&w=majority&appName=Cluster0';
    await connectDatabase({
      uri: mongoUri,
      dbName: 'cart_db'
    });

    // Connect to Redis (optional)
    let redisClient = null;
    try {
      redisClient = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      });

      redisClient.on('error', (err) => {
        logger.error('Redis Client Error:', err);
      });

      await redisClient.connect();
      logger.info('Connected to Redis');
    } catch (redisError) {
      logger.warn('Failed to connect to Redis, continuing without Redis support', {
        error: (redisError as any).message
      });
      redisClient = null;
    }

    // Security middleware
    app.use(helmet({
      contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false
    }));

    // CORS configuration
    app.use(cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'X-User-ID', 
        'X-Session-ID', 
        'X-User-Role',
        'X-Request-ID'
      ]
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // limit each IP to 1000 requests per windowMs (higher for cart operations)
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => {
        // Skip rate limiting for health checks
        return req.path === '/health' || req.path === '/cart/health';
      }
    });
    app.use(limiter);

    // Compression middleware
    app.use(compression());

    // Body parsing middleware
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Session configuration for guest carts
    const sessionConfig: any = {
      secret: process.env.SESSION_SECRET || 'cart-service-secret-key',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      },
      name: 'cart.sid'
    };

    // Use Redis store if available, otherwise use memory store
    if (redisClient) {
      sessionConfig.store = new RedisStore({
        client: redisClient,
        prefix: 'cart_session:'
      });
    }

    app.use(session(sessionConfig));

    // Request logging middleware
    app.use((req, res, next) => {
      const startTime = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        logger.info('HTTP Request', {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration: `${duration}ms`,
          userAgent: req.get('User-Agent'),
          userId: req.headers['x-user-id'],
          sessionId: req.headers['x-session-id'] || req.sessionID,
          requestId: req.headers['x-request-id']
        });
      });
      
      next();
    });

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        service: 'cart-service',
        version: process.env.npm_package_version || '1.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        redis: redisClient ? (redisClient.isReady ? 'connected' : 'disconnected') : 'not_configured'
      });
    });

    // API routes
    app.use('/api/cart', cartRoutes);
    app.use('/cart', cartRoutes); // Alternative path

    // Initialize cart service and set up event listeners
    const cartService = new CartService();
    
    // Set up cart event listeners for analytics/notifications
    cartService.on('cart:created', (event) => {
      logger.info('Cart created', event);
      // Here you could emit to analytics service, etc.
    });

    cartService.on('cart:item_added', (event) => {
      logger.info('Item added to cart', event);
      // Here you could update product popularity metrics, etc.
    });

    cartService.on('cart:abandoned', (event) => {
      logger.info('Cart abandoned', event);
      // Here you could trigger abandoned cart email campaign
    });

    cartService.on('cart:converted', (event) => {
      logger.info('Cart converted', event);
      // Here you could update conversion analytics
    });

    // Set up periodic cleanup job
    const cleanupInterval = parseInt(process.env.CLEANUP_INTERVAL_HOURS || '6') * 60 * 60 * 1000;
    setInterval(async () => {
      try {
        const deletedCount = await cartService.cleanupExpiredCarts();
        if (deletedCount > 0) {
          logger.info(`Cleaned up ${deletedCount} expired carts`);
        }
      } catch (error: any) {
        logger.error('Error in cleanup job:', error);
      }
    }, cleanupInterval);

    // 404 handler
    app.use('*', (req, res) => {
      res.status(404).json({ 
        success: false,
        error: 'Route not found',
        code: 'ROUTE_NOT_FOUND'
      });
    });

    // Global error handler
    app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('Unhandled error in Cart Service', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        body: req.body,
        userId: req.headers['x-user-id'],
        sessionId: req.headers['x-session-id'],
        action: 'unhandled_error'
      });

      // Don't expose internal errors in production
      const message = process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message;

      res.status(error.status || 500).json({
        success: false,
        error: message,
        code: 'INTERNAL_ERROR'
      });
    });

    // Start server
    const server = app.listen(PORT, () => {
      logger.info('Cart Service started successfully', {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        mongodb: process.env.MONGODB_URI ? 'configured' : 'using default',
        redis: process.env.REDIS_URL ? 'configured' : 'using default',
        action: 'server_start'
      });
      
      console.log(`🛒 Cart Service ready at http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🛍️ Cart API: http://localhost:${PORT}/api/cart`);
    });

    // Graceful shutdown handlers
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}, starting graceful shutdown`);
      
      // Stop accepting new connections
      server.close(async () => {
        logger.info('HTTP server closed');
        
        try {
          // Close database connections
          await mongoose.connection.close();
          logger.info('MongoDB connection closed');
          
          // Close Redis connection if available
          if (redisClient) {
            await redisClient.quit();
            logger.info('Redis connection closed');
          }
          
          logger.info('Graceful shutdown completed');
          process.exit(0);
        } catch (error: any) {
          logger.error('Error during graceful shutdown:', error);
          process.exit(1);
        }
      });
      
      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error: any) {
    logger.error('Failed to start Cart Service', {
      error: error.message,
      stack: error.stack,
      action: 'server_start_error'
    });
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection in Cart Service', {
    reason,
    promise,
    action: 'unhandled_rejection'
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception in Cart Service', {
    error: error.message,
    stack: error.stack,
    action: 'uncaught_exception'
  });
  process.exit(1);
});

startServer();
