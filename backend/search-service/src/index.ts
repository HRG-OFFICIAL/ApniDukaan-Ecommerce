import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { body, query, validationResult } from 'express-validator';
import { logger, connectDatabase } from '@apnidukaan/shared';
import SearchService from './services/SearchService';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 4006;

  try {
    // Connect to MongoDB
    await connectDatabase({
      uri: process.env.MONGODB_URI || 'mongodb+srv://userservice-dev:OELp6t3K63rHhKgJ@cluster0.0ezsixh.mongodb.net/apnidukaan_search?retryWrites=true&w=majority&appName=Cluster0',
      dbName: 'search_db'
    });

    // Security middleware
    app.use(helmet({
      contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false
    }));

    // CORS configuration
    app.use(cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 200, // limit each IP to 200 requests per windowMs
      message: 'Too many requests from this IP, please try again later.'
    });
    app.use('/api', limiter);

    // Body parsing middleware
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'healthy',
        service: 'search-service',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });

    // Initialize search service
    const searchService = new SearchService();

    // Validation middleware
    const handleValidationErrors = (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }
      next();
    };

    // Search products endpoint
    app.get('/api/search/products', [
      query('q').notEmpty().withMessage('Search query is required'),
      query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
      query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
      query('category').optional().isString().withMessage('Category must be a string'),
      query('minPrice').optional().isFloat({ min: 0 }).withMessage('Min price must be a positive number'),
      query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Max price must be a positive number'),
      query('sortBy').optional().isIn(['relevance', 'price_asc', 'price_desc', 'rating', 'newest']).withMessage('Invalid sort option'),
      handleValidationErrors
    ], async (req, res) => {
      try {
        const {
          q,
          page = 1,
          limit = 20,
          category,
          minPrice,
          maxPrice,
          sortBy = 'relevance'
        } = req.query;

        const searchResults = await searchService.searchProducts({
          query: q as string,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          filters: {
            category: category as string,
            minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
            maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined
          },
          sortBy: sortBy as string
        });

        res.json({
          success: true,
          data: searchResults.products,
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total: searchResults.total,
            pages: Math.ceil(searchResults.total / parseInt(limit as string))
          },
          suggestions: searchResults.suggestions,
          facets: searchResults.facets
        });
      } catch (error: any) {
        logger.error('Product search failed', {
          error: error.message,
          query: req.query,
          action: 'product_search_failed'
        });
        res.status(500).json({
          success: false,
          message: 'Search failed',
          error: error.message
        });
      }
    });

    // Search suggestions endpoint
    app.get('/api/search/suggestions', [
      query('q').notEmpty().withMessage('Search query is required'),
      query('limit').optional().isInt({ min: 1, max: 10 }).withMessage('Limit must be between 1 and 10'),
      handleValidationErrors
    ], async (req, res) => {
      try {
        const { q, limit = 5 } = req.query;
        const suggestions = await searchService.getSearchSuggestions(q as string, parseInt(limit as string));

        res.json({
          success: true,
          data: suggestions
        });
      } catch (error: any) {
        logger.error('Search suggestions failed', {
          error: error.message,
          query: req.query,
          action: 'search_suggestions_failed'
        });
        res.status(500).json({
          success: false,
          message: 'Failed to get suggestions',
          error: error.message
        });
      }
    });

    // Index product endpoint (for catalog service to call)
    app.post('/api/search/index/product', [
      body('productId').notEmpty().withMessage('Product ID is required'),
      body('productData').isObject().withMessage('Product data is required'),
      handleValidationErrors
    ], async (req, res) => {
      try {
        const { productId, productData } = req.body;
        await searchService.indexProduct(productId, productData);

        res.json({
          success: true,
          message: 'Product indexed successfully'
        });
      } catch (error: any) {
        logger.error('Product indexing failed', {
          error: error.message,
          productId: req.body.productId,
          action: 'product_indexing_failed'
        });
        res.status(500).json({
          success: false,
          message: 'Failed to index product',
          error: error.message
        });
      }
    });

    // Remove product from index endpoint
    app.delete('/api/search/index/product/:productId', async (req, res) => {
      try {
        const { productId } = req.params;
        await searchService.removeProduct(productId);

        res.json({
          success: true,
          message: 'Product removed from index successfully'
        });
      } catch (error: any) {
        logger.error('Product removal from index failed', {
          error: error.message,
          productId: req.params.productId,
          action: 'product_removal_failed'
        });
        res.status(500).json({
          success: false,
          message: 'Failed to remove product from index',
          error: error.message
        });
      }
    });

    // Popular searches endpoint
    app.get('/api/search/popular', async (req, res) => {
      try {
        const popularSearches = await searchService.getPopularSearches();
        res.json({
          success: true,
          data: popularSearches
        });
      } catch (error: any) {
        logger.error('Popular searches failed', {
          error: error.message,
          action: 'popular_searches_failed'
        });
        res.status(500).json({
          success: false,
          message: 'Failed to get popular searches',
          error: error.message
        });
      }
    });

    // 404 handler
    app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Route not found',
        code: 'ROUTE_NOT_FOUND'
      });
    });

    // Global error handler
    app.use((error: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
      logger.error('Unhandled error in Search Service', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        action: 'unhandled_error'
      });

      res.status(error.status || 500).json({
        success: false,
        error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
      });
    });

    // Start server
    app.listen(PORT, () => {
      logger.info('Search Service started successfully', {
        service: 'search-service',
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0',
        port: PORT,
        action: 'server_start'
      });
      
      console.log(`🔍 Search Service ready at http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔎 Search API: http://localhost:${PORT}/api/search`);
    });

  } catch (error: any) {
    logger.error('Failed to start Search Service', {
      error: error.message,
      action: 'server_start_error'
    });
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error: any) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack,
    action: 'uncaught_exception'
  });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Rejection', {
    reason: reason?.message || reason,
    promise: promise.toString(),
    action: 'unhandled_rejection'
  });
  process.exit(1);
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

startServer();
