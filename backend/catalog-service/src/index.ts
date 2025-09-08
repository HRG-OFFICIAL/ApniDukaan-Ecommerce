import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { connectDatabase, logger } from '@shopsphere/shared';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 4001;

  try {
    // Connect to database
    await connectDatabase(process.env.MONGODB_URI || 'mongodb://localhost:27017', 'catalog_db');

    // Security middleware
    app.use(helmet({
      contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false
    }));

    // CORS configuration
    app.use(cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-apollo-tracing']
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 200, // limit each IP to 200 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false
    });
    app.use(limiter);

    // Body parsing middleware
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        service: 'catalog-service',
        timestamp: new Date().toISOString()
      });
    });

    // Simple products endpoint
    app.get('/api/products', (req, res) => {
      res.json({
        success: true,
        data: {
          products: [
            {
              id: '1',
              name: 'Sample Product 1',
              description: 'This is a sample product for testing',
              price: 29.99,
              image: 'https://via.placeholder.com/300x300',
              category: 'Electronics'
            },
            {
              id: '2',
              name: 'Sample Product 2',
              description: 'Another sample product for testing',
              price: 49.99,
              image: 'https://via.placeholder.com/300x300',
              category: 'Clothing'
            }
          ],
          pagination: {
            page: 1,
            limit: 20,
            total: 2,
            totalPages: 1,
            hasNext: false,
            hasPrev: false
          }
        }
      });
    });

    // Simple categories endpoint
    app.get('/api/categories', (req, res) => {
      res.json({
        success: true,
        data: {
          categories: [
            {
              id: '1',
              name: 'Electronics',
              slug: 'electronics',
              description: 'Electronic devices and gadgets',
              productCount: 1
            },
            {
              id: '2',
              name: 'Clothing',
              slug: 'clothing',
              description: 'Fashion and apparel',
              productCount: 1
            }
          ]
        }
      });
    });

    // Global error handler
    app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('Unhandled error in Catalog Service', {
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
      logger.info('Catalog Service started successfully', {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        action: 'server_start'
      });
      
      console.log(`🚀 Catalog Service ready at http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down Catalog Service gracefully');
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down Catalog Service gracefully');
      process.exit(0);
    });

  } catch (error) {
    logger.error('Failed to start Catalog Service', {
      error: error.message,
      stack: error.stack,
      action: 'server_start_error'
    });
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection in Catalog Service', {
    reason,
    promise,
    action: 'unhandled_rejection'
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception in Catalog Service', {
    error: error.message,
    stack: error.stack,
    action: 'uncaught_exception'
  });
  process.exit(1);
});

startServer();