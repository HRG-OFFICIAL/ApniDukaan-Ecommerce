import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { ApolloServer } from 'apollo-server-express';
import { typeDefs } from './graphql/schema';
import { resolvers } from './graphql/resolvers';
import { logger } from '@apnidukaan/shared';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 4000;

  // Initialize Apollo GraphQL Server
  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {
      const token = req.headers.authorization;
      return { token };
    },
    introspection: true,
  });

  await apolloServer.start();

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
      allowedHeaders: ['Content-Type', 'Authorization', 'x-apollo-tracing']
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // limit each IP to 1000 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false
    });
    app.use(limiter);

    // Body parsing middleware
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));

    // Apply GraphQL middleware
    apolloServer.applyMiddleware({ 
      app: app as any, 
      path: '/graphql',
      cors: false // Already handled above
    });

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        service: 'api-gateway',
        timestamp: new Date().toISOString(),
        services: {
          catalog: 'http://localhost:4001',
          user: 'http://localhost:4002',
          order: 'http://localhost:4003',
          payment: 'http://localhost:4004'
        }
      });
    });

    // Proxy to catalog service
    app.use('/api/catalog', createProxyMiddleware({
      target: 'http://localhost:4001',
      changeOrigin: true,
      pathRewrite: {
        '^/api/catalog': '/api'
      },
      onError: (err, req, res) => {
        logger.error('Catalog service proxy error', {
          error: err.message,
          url: req.url,
          action: 'proxy_error'
        });
        res.status(503).json({ error: 'Catalog service unavailable' });
      }
    }));

    // Proxy to user service
    app.use('/api/users', createProxyMiddleware({
      target: 'http://localhost:4002',
      changeOrigin: true,
      pathRewrite: {
        '^/api/users': '/api'
      },
      onError: (err, req, res) => {
        logger.error('User service proxy error', {
          error: err.message,
          url: req.url,
          action: 'proxy_error'
        });
        res.status(503).json({ error: 'User service unavailable' });
      }
    }));

    // Proxy to order service
    app.use('/api/orders', createProxyMiddleware({
      target: 'http://localhost:4003',
      changeOrigin: true,
      pathRewrite: {
        '^/api/orders': '/api'
      },
      onError: (err, req, res) => {
        logger.error('Order service proxy error', {
          error: err.message,
          url: req.url,
          action: 'proxy_error'
        });
        res.status(503).json({ error: 'Order service unavailable' });
      }
    }));

    // Proxy to payment service
    app.use('/api/payments', createProxyMiddleware({
      target: 'http://localhost:4004',
      changeOrigin: true,
      pathRewrite: {
        '^/api/payments': '/api'
      },
      onError: (err, req, res) => {
        logger.error('Payment service proxy error', {
          error: err.message,
          url: req.url,
          action: 'proxy_error'
        });
        res.status(503).json({ error: 'Payment service unavailable' });
      }
    }));

    // Global error handler
    app.use((error: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
      logger.error('Unhandled error in API Gateway', {
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
      logger.info('API Gateway started successfully', {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        action: 'server_start'
      });
      
      console.log(`🚀 API Gateway ready at http://localhost:${PORT}`);
      console.log(`🎯 GraphQL endpoint: http://localhost:${PORT}${apolloServer.graphqlPath}`);
      console.log(`🎮 GraphQL Playground: http://localhost:${PORT}${apolloServer.graphqlPath}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🛍️  Catalog API: http://localhost:${PORT}/api/catalog`);
      console.log(`👤 User API: http://localhost:${PORT}/api/users`);
      console.log(`📦 Order API: http://localhost:${PORT}/api/orders`);
      console.log(`💳 Payment API: http://localhost:${PORT}/api/payments`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down API Gateway gracefully');
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down API Gateway gracefully');
      process.exit(0);
    });

  } catch (error: any) {
    logger.error('Failed to start API Gateway', {
      error: error.message,
      stack: error.stack,
      action: 'server_start_error'
    });
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection in API Gateway', {
    reason,
    promise,
    action: 'unhandled_rejection'
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: any) => {
  logger.error('Uncaught Exception in API Gateway', {
    error: error.message,
    stack: error.stack,
    action: 'uncaught_exception'
  });
  process.exit(1);
});

startServer();