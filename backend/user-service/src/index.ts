import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { logger, connectDatabase } from '@apnidukaan/shared';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 4002;

  try {
    // Connect to MongoDB Atlas
    await connectDatabase(
                  process.env.MONGODB_URI || 'mongodb+srv://userservice-dev:OELp6t3K63rHhKgJ@cluster0.0ezsixh.mongodb.net/apnidukaan_users?retryWrites=true&w=majority&appName=Cluster0',
      'user_db'
    );

    // Security middleware
    app.use(helmet({
      contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false
    }));

    // CORS configuration
    app.use(cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false
    });
    app.use('/api', limiter);

    // Body parsing middleware
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'healthy',
        service: 'user-service',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });

    // API routes
    app.get('/api/users', (req, res) => {
      res.json({
        success: true,
        data: [
          { id: 1, email: 'user1@example.com', name: 'John Doe' },
          { id: 2, email: 'user2@example.com', name: 'Jane Smith' }
        ]
      });
    });

    app.get('/api/users/:id', (req, res) => {
      const { id } = req.params;
      res.json({
        success: true,
        data: { id: parseInt(id), email: 'user@example.com', name: 'User Name' }
      });
    });

    app.post('/api/auth/login', (req, res) => {
      const { email, password } = req.body;
      // Mock authentication
      res.json({
        success: true,
        data: {
          token: 'mock-jwt-token',
          user: { id: 1, email, name: 'User Name' }
        }
      });
    });

    app.post('/api/auth/register', (req, res) => {
      const { email, password, name } = req.body;
      // Mock registration
      res.json({
        success: true,
        data: {
          token: 'mock-jwt-token',
          user: { id: 1, email, name }
        }
      });
    });

    // Global error handler
    app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('Unhandled error', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        action: 'unhandled_error'
      });

      res.status(500).json({
        error: process.env.NODE_ENV === 'production' 
          ? 'Internal server error' 
          : error.message
      });
    });

    // 404 handler
    app.use('*', (req, res) => {
      res.status(404).json({ error: 'Route not found' });
    });

    // Start server
    app.listen(PORT, () => {
      logger.info('User Service started successfully', {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        action: 'server_start'
      });
      
      console.log(`🚀 User Service ready at http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`👤 API endpoints: http://localhost:${PORT}/api`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      process.exit(0);
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      process.exit(0);
    });

  } catch (error: any) {
    logger.error('Failed to start User Service', {
      error: error.message,
      stack: error.stack,
      action: 'server_start_error'
    });
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', {
    reason,
    promise,
    action: 'unhandled_rejection'
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack,
    action: 'uncaught_exception'
  });
  process.exit(1);
});

startServer();
