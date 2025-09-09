import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import { config } from 'dotenv';
import profileRoutes from './routes/profile';
import { logger, errorHandler, notFoundHandler, requestLogger } from '@apnidukaan/shared';

// Load environment variables
config();

const app = express();

// Environment variables with defaults
const PORT = process.env.PORT || 3004;
const NODE_ENV = process.env.NODE_ENV || 'development';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shopsphere_profiles';
const REDIS_URI = process.env.REDIS_URI || 'redis://localhost:6379';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const CORS_ORIGINS = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'];
const MAX_REQUEST_SIZE = process.env.MAX_REQUEST_SIZE || '10mb';
const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW || '900000'); // 15 minutes
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || '100'); // 100 requests per window

// Global rate limiter
const globalLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW,
  max: RATE_LIMIT_MAX,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/profile/health';
  }
});

// Strict rate limiter for auth-sensitive operations
const strictLimiter = rateLimit({
  windowMs: 900000, // 15 minutes
  max: 20, // 20 requests per window
  message: {
    success: false,
    error: 'Too many sensitive requests from this IP, please try again later',
    code: 'STRICT_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https:", "data:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    if (CORS_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    
    return callback(new Error('Not allowed by CORS policy'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-User-Id',
    'X-User-Role',
    'X-Session-Id'
  ],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// General middleware
app.use(compression());
app.use(express.json({ limit: MAX_REQUEST_SIZE }));
app.use(express.urlencoded({ extended: true, limit: MAX_REQUEST_SIZE }));

// Request logging
app.use(requestLogger);

// Rate limiting
app.use(globalLimiter);

// Apply strict rate limiting to sensitive endpoints
app.use('/profile', (req, res, next) => {
  const sensitiveEndpoints = ['/profile/avatar', '/profile/settings'];
  if (sensitiveEndpoints.some(endpoint => req.path.startsWith(endpoint))) {
    return strictLimiter(req, res, next);
  }
  next();
});

// Health check endpoint (before authentication)
app.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'user-profile-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
    memory: {
      used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
      total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100
    }
  });
});

// API routes
app.use('/profile', profileRoutes);

// Catch 404 errors
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Database connections
let mongoConnection: typeof mongoose;
let redisClient: ReturnType<typeof createClient>;

// MongoDB connection
const connectMongoDB = async (): Promise<typeof mongoose> => {
  try {
    const connection = await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      bufferMaxEntries: 0,
    });

    logger.info('Connected to MongoDB', {
      host: connection.connection.host,
      port: connection.connection.port,
      database: connection.connection.name
    });

    // MongoDB event listeners
    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    return connection;

  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    throw error;
  }
};

// Redis connection
const connectRedis = async (): Promise<ReturnType<typeof createClient>> => {
  try {
    const client = createClient({
      url: REDIS_URI,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 1000),
        connectTimeout: 5000,
        lazyConnect: true
      }
    });

    // Redis event listeners
    client.on('error', (error) => {
      logger.error('Redis connection error:', error);
    });

    client.on('connect', () => {
      logger.info('Connected to Redis', {
        url: REDIS_URI.split('@')[1] || REDIS_URI // Hide credentials if present
      });
    });

    client.on('disconnect', () => {
      logger.warn('Redis disconnected');
    });

    client.on('reconnecting', () => {
      logger.info('Redis reconnecting...');
    });

    await client.connect();
    
    // Test Redis connection
    const pong = await client.ping();
    if (pong !== 'PONG') {
      throw new Error('Redis ping failed');
    }

    return client;

  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    throw error;
  }
};

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  const server = app.listen(PORT);

  // Set a timeout for graceful shutdown
  const shutdownTimeout = setTimeout(() => {
    logger.error('Graceful shutdown timeout. Forcing exit...');
    process.exit(1);
  }, 10000);

  try {
    // Stop accepting new connections
    server.close(async () => {
      logger.info('HTTP server closed');

      try {
        // Close database connections
        if (mongoConnection) {
          await mongoConnection.disconnect();
          logger.info('MongoDB connection closed');
        }

        if (redisClient && redisClient.isReady) {
          await redisClient.quit();
          logger.info('Redis connection closed');
        }

        clearTimeout(shutdownTimeout);
        logger.info('Graceful shutdown completed');
        process.exit(0);

      } catch (error) {
        logger.error('Error during graceful shutdown:', error);
        clearTimeout(shutdownTimeout);
        process.exit(1);
      }
    });

  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    clearTimeout(shutdownTimeout);
    process.exit(1);
  }
};

// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start server
const startServer = async () => {
  try {
    // Connect to databases
    mongoConnection = await connectMongoDB();
    redisClient = await connectRedis();

    // Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info(`User Profile Service started`, {
        port: PORT,
        environment: NODE_ENV,
        nodeVersion: process.version,
        pid: process.pid
      });
    });

    // Server error handling
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use`);
      } else {
        logger.error('Server error:', error);
      }
      process.exit(1);
    });

    // Keep track of active connections for graceful shutdown
    const connections = new Set();
    server.on('connection', (connection) => {
      connections.add(connection);
      connection.on('close', () => connections.delete(connection));
    });

    // Extend graceful shutdown to close active connections
    const originalGracefulShutdown = gracefulShutdown;
    // @ts-ignore
    gracefulShutdown = (signal: string) => {
      // Close all active connections
      connections.forEach((connection: any) => connection.end());
      setTimeout(() => {
        connections.forEach((connection: any) => connection.destroy());
      }, 1000);
      
      originalGracefulShutdown(signal);
    };

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
if (require.main === module) {
  startServer();
}

export { app, connectMongoDB, connectRedis, startServer };
