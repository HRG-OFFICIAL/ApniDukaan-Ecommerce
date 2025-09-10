import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { connectDatabase, logger, kafkaProducerService } from '@apnidukaan/shared';

// Import routes
import productRoutes from './routes/products';
import categoryRoutes from './routes/categories';
import reviewRoutes from './routes/reviews';
import imageRoutes from './routes/image.routes';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 4001;

  try {
    // Connect to MongoDB Atlas
    await connectDatabase({
      uri: process.env.MONGODB_URI || 'mongodb+srv://userservice-dev:OELp6t3K63rHhKgJ@cluster0.0ezsixh.mongodb.net/apnidukaan_catalog?retryWrites=true&w=majority&appName=Cluster0',
      dbName: 'catalog_db'
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

    // Mock data endpoints for beautiful frontend
    app.get('/api/products', (req, res) => {
      res.json({
        success: true,
        data: [
          {
            id: '1',
            name: 'Premium Wireless Headphones',
            slug: 'premium-wireless-headphones',
            description: 'High-quality wireless headphones with noise cancellation and 30-hour battery life.',
            shortDescription: 'Premium wireless headphones with noise cancellation',
            price: 299.99,
            originalPrice: 399.99,
            currency: 'USD',
            images: [
              'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
              'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500'
            ],
            thumbnailImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300',
            category: { id: '1', name: 'Electronics', slug: 'electronics' },
            brand: 'TechSound',
            tags: ['wireless', 'headphones', 'premium', 'noise-cancellation'],
            inventory: { quantity: 50, lowStockThreshold: 5 },
            rating: { average: 4.8, count: 1247 },
            sales: { totalSold: 8923, revenue: 2676900 },
            isOnSale: true,
            featured: true,
            status: 'published',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '2',
            name: 'Smart Fitness Watch',
            slug: 'smart-fitness-watch',
            description: 'Advanced fitness tracking watch with heart rate monitoring, GPS, and 7-day battery life.',
            shortDescription: 'Advanced fitness tracking watch with GPS',
            price: 199.99,
            originalPrice: 249.99,
            currency: 'USD',
            images: [
              'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
              'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=500'
            ],
            thumbnailImage: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300',
            category: { id: '1', name: 'Electronics', slug: 'electronics' },
            brand: 'FitTech',
            tags: ['fitness', 'watch', 'smart', 'gps'],
            inventory: { quantity: 75, lowStockThreshold: 10 },
            rating: { average: 4.6, count: 892 },
            sales: { totalSold: 4567, revenue: 913400 },
            isOnSale: true,
            featured: true,
            status: 'published',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '3',
            name: 'Organic Cotton T-Shirt',
            slug: 'organic-cotton-t-shirt',
            description: 'Comfortable organic cotton t-shirt made from sustainable materials. Available in multiple colors.',
            shortDescription: 'Comfortable organic cotton t-shirt',
            price: 29.99,
            originalPrice: 39.99,
            currency: 'USD',
            images: [
              'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
              'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=500'
            ],
            thumbnailImage: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300',
            category: { id: '2', name: 'Clothing', slug: 'clothing' },
            brand: 'EcoWear',
            tags: ['organic', 'cotton', 'sustainable', 'comfortable'],
            inventory: { quantity: 200, lowStockThreshold: 20 },
            rating: { average: 4.4, count: 567 },
            sales: { totalSold: 2341, revenue: 70230 },
            isOnSale: true,
            featured: false,
            status: 'published',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '4',
            name: 'Professional Camera Lens',
            slug: 'professional-camera-lens',
            description: 'High-quality 85mm f/1.4 professional camera lens perfect for portrait photography.',
            shortDescription: 'Professional 85mm f/1.4 camera lens',
            price: 1299.99,
            originalPrice: 1499.99,
            currency: 'USD',
            images: [
              'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=500',
              'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=500'
            ],
            thumbnailImage: 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=300',
            category: { id: '3', name: 'Photography', slug: 'photography' },
            brand: 'PhotoPro',
            tags: ['camera', 'lens', 'professional', 'portrait'],
            inventory: { quantity: 15, lowStockThreshold: 3 },
            rating: { average: 4.9, count: 234 },
            sales: { totalSold: 456, revenue: 592800 },
            isOnSale: true,
            featured: true,
            status: 'published',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '5',
            name: 'Ergonomic Office Chair',
            slug: 'ergonomic-office-chair',
            description: 'Comfortable ergonomic office chair with lumbar support and adjustable height.',
            shortDescription: 'Comfortable ergonomic office chair',
            price: 449.99,
            originalPrice: 599.99,
            currency: 'USD',
            images: [
              'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500',
              'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=500'
            ],
            thumbnailImage: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300',
            category: { id: '4', name: 'Furniture', slug: 'furniture' },
            brand: 'ComfortSeat',
            tags: ['ergonomic', 'office', 'chair', 'comfortable'],
            inventory: { quantity: 30, lowStockThreshold: 5 },
            rating: { average: 4.7, count: 445 },
            sales: { totalSold: 1234, revenue: 555600 },
            isOnSale: true,
            featured: false,
            status: 'published',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '6',
            name: 'Bluetooth Speaker',
            slug: 'bluetooth-speaker',
            description: 'Portable Bluetooth speaker with 360-degree sound and waterproof design.',
            shortDescription: 'Portable waterproof Bluetooth speaker',
            price: 89.99,
            originalPrice: 119.99,
            currency: 'USD',
            images: [
              'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500',
              'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=500'
            ],
            thumbnailImage: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=300',
            category: { id: '1', name: 'Electronics', slug: 'electronics' },
            brand: 'SoundWave',
            tags: ['bluetooth', 'speaker', 'portable', 'waterproof'],
            inventory: { quantity: 100, lowStockThreshold: 15 },
            rating: { average: 4.5, count: 678 },
            sales: { totalSold: 3456, revenue: 311040 },
            isOnSale: true,
            featured: true,
            status: 'published',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 6,
          pages: 1
        }
      });
    });

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