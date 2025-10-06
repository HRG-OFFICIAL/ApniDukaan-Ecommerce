import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { logger, kafkaProducerService } from '@apnidukaan/shared';

// Import routes
import productRoutes from './routes/products';
import categoryRoutes from './routes/categories';
import reviewRoutes from './routes/reviews';
import imageRoutes from './routes/image.routes';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 4001;

  try {
    // Connect to MongoDB Atlas using default mongoose connection
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://userservice-dev:eKtnLTAnmTlPVM9H@cluster0.0ezsixh.mongodb.net/apnidukaan?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(mongoUri, {
      dbName: 'apnidukaan'
    });
    
    logger.info('Database connected successfully', {
      service: 'apnidukaan-service',
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      database: 'apnidukaan',
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      action: 'database_connect'
    });

    // Initialize Kafka Producer
    try {
      await kafkaProducerService.connect();
      logger.info('Kafka producer initialized for Catalog Service', {
        action: 'kafka_producer_initialized'
      });
    } catch (kafkaError) {
      logger.warn('Failed to initialize Kafka producer', {
        error: (kafkaError as any).message,
        action: 'kafka_producer_init_warning'
      });
      // Continue without Kafka if it fails
    }

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

    // API info endpoint
    app.get('/api', (req, res) => {
      res.json({
        success: true,
        message: 'Catalog Service API',
        version: '1.0.0',
        endpoints: {
          health: '/health',
          products: '/api/products',
          categories: '/api/categories',
          reviews: '/api/reviews',
          images: '/api/images'
        }
      });
    });

    // Mock route removed - now using real MongoDB data from mounted routes below

    app.get('/api/categories', (req, res) => {
      res.json({
        success: true,
        data: [
          {
            id: '1',
            name: 'Electronics',
            slug: 'electronics',
            description: 'Latest electronic devices and gadgets',
            image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400',
            productCount: 3,
            isActive: true
          },
          {
            id: '2',
            name: 'Clothing',
            slug: 'clothing',
            description: 'Fashion and apparel for all seasons',
            image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
            productCount: 1,
            isActive: true
          },
          {
            id: '3',
            name: 'Photography',
            slug: 'photography',
            description: 'Professional photography equipment',
            image: 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=400',
            productCount: 1,
            isActive: true
          },
          {
            id: '4',
            name: 'Furniture',
            slug: 'furniture',
            description: 'Modern and comfortable furniture',
            image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400',
            productCount: 1,
            isActive: true
          }
        ]
      });
    });

    // Mount route handlers
    app.use('/api/products', productRoutes);
    app.use('/api/categories', categoryRoutes);
    app.use('/api/reviews', reviewRoutes);
    app.use('/api/images', imageRoutes);

    // Global error handler
    app.use((error: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
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
      try {
        await kafkaProducerService.disconnect();
      } catch (error) {
        logger.error('Error disconnecting Kafka producer during shutdown', {
          error: (error as any).message,
          action: 'kafka_producer_shutdown_error'
        });
      }
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down Catalog Service gracefully');
      try {
        await kafkaProducerService.disconnect();
      } catch (error) {
        logger.error('Error disconnecting Kafka producer during shutdown', {
          error: (error as any).message,
          action: 'kafka_producer_shutdown_error'
        });
      }
      process.exit(0);
    });

  } catch (error: any) {
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
process.on('uncaughtException', (error: any) => {
  logger.error('Uncaught Exception in Catalog Service', {
    error: error.message,
    stack: error.stack,
    action: 'uncaught_exception'
  });
  process.exit(1);
});

startServer();