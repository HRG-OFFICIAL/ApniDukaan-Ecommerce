import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { logger } from '@apnidukaan/shared';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 4003;

  try {
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
        service: 'order-service',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });

    // API routes
    app.get('/api/orders', (req, res) => {
      res.json({
        success: true,
        data: [
          { id: 1, userId: 1, total: 99.99, status: 'completed', items: [] },
          { id: 2, userId: 2, total: 149.99, status: 'pending', items: [] }
        ]
      });
    });

    app.get('/api/orders/:id', (req, res) => {
      const { id } = req.params;
      res.json({
        success: true,
        data: { 
          id: parseInt(id), 
          userId: 1, 
          total: 99.99, 
          status: 'completed',
          items: [],
          createdAt: new Date().toISOString()
        }
      });
    });

    app.post('/api/orders', (req, res) => {
      const { userId, items, total } = req.body;
      // Mock order creation
      res.json({
        success: true,
        data: {
          id: Math.floor(Math.random() * 1000),
          userId,
          items,
          total,
          status: 'pending',
          createdAt: new Date().toISOString()
        }
      });
    });

    app.put('/api/orders/:id/status', (req, res) => {
      const { id } = req.params;
      const { status } = req.body;
      res.json({
        success: true,
        data: { id: parseInt(id), status, updatedAt: new Date().toISOString() }
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
      logger.info('Order Service started successfully', {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        action: 'server_start'
      });
      
      console.log(`🚀 Order Service ready at http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`📦 API endpoints: http://localhost:${PORT}/api`);
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
    logger.error('Failed to start Order Service', {
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
process.on('uncaughtException', (error: any) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack,
    action: 'uncaught_exception'
  });
  process.exit(1);
});

startServer();