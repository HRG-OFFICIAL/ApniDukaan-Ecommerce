import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { createClient } from 'redis';
import RedisStore from 'connect-redis';
import session from 'express-session';

// Import routes
import userRoutes from './routes/users';
import adminRoutes from './routes/admin';

// Import middleware
import { errorHandler } from './middleware/error.middleware';
import { requestLogger } from './middleware/logging.middleware';
import { corsOptions } from './middleware/cors.middleware';
import { rateLimitConfig } from './middleware/rate-limit.middleware';

// Import shared utilities
import { logger, validateEnv, gracefulShutdown } from './utils/logger';
import { connectDB } from './config/database';
import { initializeRedis } from './config/redis';

// Validate environment variables
const config = validateEnv([
  'NODE_ENV',
  'PORT',
  'MONGODB_URI',
  'REDIS_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'EMAIL_SERVICE_API_KEY',
  'SESSION_SECRET'
]);

const app = express();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Health check endpoint (before middleware)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'user-management',
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS configuration
app.use(cors(corsOptions));

// Compression middleware
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6,
  threshold: 1024,
}));

// Rate limiting
const limiter = rateLimit(rateLimitConfig);
app.use('/api/', limiter);

// Request logging
if (config.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));
}

// Body parsing middleware
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    // Store raw body for webhook verification if needed
    (req as any).rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Session configuration
let sessionStore: RedisStore | undefined;

const initializeSession = async () => {
  try {
    // Initialize Redis client for sessions
    const redisClient = createClient({
      url: config.REDIS_URL,
      socket: {
        connectTimeout: 60000,
      }
    });

    redisClient.on('error', (err) => {
      logger.error('Redis session store error:', err);
    });

    redisClient.on('connect', () => {
      logger.info('Redis session store connected');
    });

    await redisClient.connect();
    
    sessionStore = new RedisStore({
      client: redisClient,
      prefix: 'sess:user-mgmt:'
    });

    // Session configuration
    app.use(session({
      store: sessionStore,
      secret: config.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      name: 'shopsphere.sid',
      cookie: {
        secure: config.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'strict'
      },
      rolling: true // Reset expiration on activity
    }));

    logger.info('Session middleware initialized');
    
  } catch (error) {
    logger.error('Failed to initialize session store:', error);
    throw error;
  }
};

// Custom middleware for request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
});

// API routes
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

// API documentation route
app.get('/api/docs', (req, res) => {
  res.json({
    service: 'User Management Service',
    version: process.env.npm_package_version || '1.0.0',
    endpoints: {
      users: '/api/users',
      admin: '/api/admin',
      health: '/health',
      metrics: '/metrics'
    },
    documentation: 'https://docs.shopsphere.com/api/user-management'
  });
});

// Metrics endpoint (for monitoring)
app.get('/metrics', (req, res) => {
  // Basic metrics - in production, use Prometheus metrics
  const metrics = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    version: process.env.npm_package_version || '1.0.0'
  };

  res.json(metrics);
});

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Global error handling middleware
app.use(errorHandler);

// Initialize databases and start server
const startServer = async () => {
  try {
    // Initialize database connections
    logger.info('Connecting to databases...');
    
    await Promise.all([
      connectDB(),
      initializeRedis()
    ]);

    // Initialize session store
    await initializeSession();

    logger.info('All database connections established');

    // Start HTTP server
    const PORT = parseInt(config.PORT) || 3001;
    const server = app.listen(PORT, () => {
      logger.info(`🚀 User Management Service started on port ${PORT}`);
      logger.info(`Environment: ${config.NODE_ENV}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
    });

    // Handle server errors
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.syscall !== 'listen') {
        throw error;
      }

      switch (error.code) {
        case 'EACCES':
          logger.error(`Port ${PORT} requires elevated privileges`);
          process.exit(1);
        case 'EADDRINUSE':
          logger.error(`Port ${PORT} is already in use`);
          process.exit(1);
        default:
          throw error;
      }
    });

    // Graceful shutdown handling
    const shutdown = gracefulShutdown(server, 'User Management Service');
    
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      shutdown();
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      shutdown();
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Export app for testing
export default app;

// Start server if this file is run directly
if (require.main === module) {
  startServer();
}
