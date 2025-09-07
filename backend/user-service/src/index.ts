import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildFederatedSchema } from '@apollo/federation';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import passport from 'passport';
import { connectDatabase, connectRedis, logger } from '@shopsphere/shared';
import { userTypeDefs } from './schemas/userSchema';
import { userResolvers } from './resolvers/userResolver';
import authRoutes from './routes/authRoutes';
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
  ...userResolvers,
  DateTime: DateTimeScalar
};

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 4002;

  try {
    // Connect to databases
    await connectDatabase(process.env.MONGODB_URI!, 'users_db');
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
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false
    });
    app.use('/auth', limiter);

    // Body parsing middleware
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));

    // Session configuration for OAuth
    app.use(session({
      secret: process.env.SESSION_SECRET || 'your-session-secret',
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        touchAfter: 24 * 3600 // lazy session update
      }),
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      }
    }));

    // Passport middleware
    app.use(passport.initialize());
    app.use(passport.session());

    // REST routes (for OAuth and health checks)
    app.use('/auth', authRoutes);

    // Create Apollo Server with Federation
    const server = new ApolloServer({
      schema: buildFederatedSchema([{
        typeDefs: userTypeDefs,
        resolvers
      }]),
      context: ({ req }) => {
        return {
          req,
          user: req.user || null
        };
      },
      introspection: process.env.NODE_ENV !== 'production',
      playground: process.env.NODE_ENV !== 'production',
      formatError: (error) => {
        logger.error('GraphQL Error', {
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
        logger.info('GraphQL Request', {
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
        graphqlPath: server.graphqlPath,
        environment: process.env.NODE_ENV || 'development',
        action: 'server_start'
      });
      
      console.log(`🚀 User Service ready at http://localhost:${PORT}`);
      console.log(`📊 GraphQL endpoint: http://localhost:${PORT}${server.graphqlPath}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully');
      await server.stop();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down gracefully');
      await server.stop();
      process.exit(0);
    });

  } catch (error) {
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
