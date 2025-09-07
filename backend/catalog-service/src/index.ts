import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildFederatedSchema } from '@apollo/federation';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { connectDatabase, connectRedis, logger } from '@shopsphere/shared';
import { catalogTypeDefs } from './schemas/catalogSchema';
import { catalogResolvers } from './resolvers/catalogResolver';
import { GraphQLScalarType } from 'graphql';
import { Kind } from 'graphql/language';

// Custom DateTime scalar
const DateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  description: 'DateTime custom scalar type',
  serialize(value: any) {
    return value instanceof Date ? value.toISOString() : null;
  },
  parseValue(value: any) {
    return new Date(value);
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value);
    }
    return null;
  }
});

// Merge resolvers with DateTime scalar
const resolvers = {
  ...catalogResolvers,
  DateTime: DateTimeScalar
};

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 4001;

  try {
    // Connect to databases
    await connectDatabase(process.env.MONGODB_URI!, 'catalog_db');
    await connectRedis(process.env.REDIS_URL!);

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

    // Create Apollo Server with Federation
    const server = new ApolloServer({
      schema: buildFederatedSchema([{
        typeDefs: catalogTypeDefs,
        resolvers
      }]),
      context: ({ req }) => {
        // Extract user from headers (set by API Gateway)
        const userId = req.headers['x-user-id'] as string;
        const userRole = req.headers['x-user-role'] as string;
        
        let user = null;
        if (userId && userRole) {
          user = {
            userId,
            role: userRole
          };
        }

        return {
          req,
          user
        };
      },
      introspection: process.env.NODE_ENV !== 'production',
      playground: process.env.NODE_ENV !== 'production',
      formatError: (error) => {
        logger.error('GraphQL Error in Catalog Service', {
          message: error.message,
          path: error.path,
          source: error.source?.body,
          action: 'graphql_error'
        });

        // Don't expose internal errors in production
        if (process.env.NODE_ENV === 'production' && error.message.includes('Internal')) {
          return new Error('Internal server error');
        }

        return error;
      },
      formatResponse: (response, { request }) => {
        logger.info('GraphQL Request in Catalog Service', {
          query: request.query,
          variables: request.variables,
          operationName: request.operationName,
          action: 'graphql_request'
        });
        return response;
      }
    });

    await server.start();
    server.applyMiddleware({ 
      app, 
      path: '/graphql',
      cors: false // We handle CORS above
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
        graphqlPath: server.graphqlPath,
        environment: process.env.NODE_ENV || 'development',
        action: 'server_start'
      });
      
      console.log(`🚀 Catalog Service ready at http://localhost:${PORT}`);
      console.log(`📊 GraphQL endpoint: http://localhost:${PORT}${server.graphqlPath}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down Catalog Service gracefully');
      await server.stop();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down Catalog Service gracefully');
      await server.stop();
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
