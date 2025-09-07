import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { ApolloGateway, IntrospectAndCompose, RemoteGraphQLDataSource } from '@apollo/gateway';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { logger } from '@shopsphere/shared';

class AuthenticatedDataSource extends RemoteGraphQLDataSource {
  willSendRequest({ request, context }: any) {
    // Forward authentication headers to subgraphs
    if (context.req?.headers?.authorization) {
      request.http?.headers.set('authorization', context.req.headers.authorization);
    }
    
    // Forward user context
    if (context.user) {
      request.http?.headers.set('x-user-id', context.user.userId);
      request.http?.headers.set('x-user-role', context.user.role);
    }
  }
}

async function startGateway() {
  const app = express();
  const PORT = process.env.PORT || 4000;

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

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        service: 'api-gateway',
        timestamp: new Date().toISOString()
      });
    });

    // Create Apollo Gateway
    const gateway = new ApolloGateway({
      supergraphSdl: new IntrospectAndCompose({
        subgraphs: [
          {
            name: 'users',
            url: process.env.USER_SERVICE_URL || 'http://localhost:4002/graphql'
          },
          {
            name: 'catalog',
            url: process.env.CATALOG_SERVICE_URL || 'http://localhost:4001/graphql'
          },
          {
            name: 'orders',
            url: process.env.ORDER_SERVICE_URL || 'http://localhost:4003/graphql'
          },
          {
            name: 'payments',
            url: process.env.PAYMENT_SERVICE_URL || 'http://localhost:4004/graphql'
          }
        ],
        pollIntervalInMs: 30000 // Poll for schema changes every 30 seconds
      }),
      buildService({ url }) {
        return new AuthenticatedDataSource({ url });
      },
      debug: process.env.NODE_ENV !== 'production'
    });

    // Create Apollo Server
    const server = new ApolloServer({
      gateway,
      subscriptions: false, // Disable subscriptions for gateway
      context: async ({ req }) => {
        // Extract user from JWT token if present
        let user = null;
        
        try {
          const authHeader = req.headers.authorization;
          if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            
            // Validate token with user service
            const response = await fetch(`${process.env.USER_SERVICE_URL || 'http://localhost:4002'}/auth/validate-token`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ token })
            });

            if (response.ok) {
              const data = await response.json();
              if (data.valid) {
                user = data.user;
              }
            }
          }
        } catch (error) {
          logger.warn('Token validation failed', {
            error: error.message,
            action: 'token_validation'
          });
        }

        return {
          req,
          user
        };
      },
      introspection: process.env.NODE_ENV !== 'production',
      playground: process.env.NODE_ENV !== 'production',
      formatError: (error) => {
        logger.error('GraphQL Gateway Error', {
          message: error.message,
          path: error.path,
          source: error.source?.body,
          action: 'graphql_gateway_error'
        });

        // Don't expose internal errors in production
        if (process.env.NODE_ENV === 'production' && error.message.includes('Internal')) {
          return new Error('Internal server error');
        }

        return error;
      },
      formatResponse: (response, { request }) => {
        logger.info('GraphQL Gateway Request', {
          query: request.query,
          variables: request.variables,
          operationName: request.operationName,
          action: 'graphql_gateway_request'
        });
        return response;
      },
      plugins: [
        {
          requestDidStart() {
            return {
              willSendResponse(requestContext) {
                // Log response metrics
                const { response, request } = requestContext;
                logger.info('GraphQL Response', {
                  operationName: request.operationName,
                  hasErrors: !!response.errors,
                  errorCount: response.errors?.length || 0,
                  action: 'graphql_response'
                });
              }
            };
          }
        }
      ]
    });

    await server.start();
    server.applyMiddleware({ 
      app, 
      path: '/graphql',
      cors: false // We handle CORS above
    });

    // Service discovery endpoint
    app.get('/services', async (req, res) => {
      try {
        const services = [
          {
            name: 'users',
            url: process.env.USER_SERVICE_URL || 'http://localhost:4002/graphql',
            health: await checkServiceHealth(process.env.USER_SERVICE_URL || 'http://localhost:4002')
          },
          {
            name: 'catalog',
            url: process.env.CATALOG_SERVICE_URL || 'http://localhost:4001/graphql',
            health: await checkServiceHealth(process.env.CATALOG_SERVICE_URL || 'http://localhost:4001')
          },
          {
            name: 'orders',
            url: process.env.ORDER_SERVICE_URL || 'http://localhost:4003/graphql',
            health: await checkServiceHealth(process.env.ORDER_SERVICE_URL || 'http://localhost:4003')
          },
          {
            name: 'payments',
            url: process.env.PAYMENT_SERVICE_URL || 'http://localhost:4004/graphql',
            health: await checkServiceHealth(process.env.PAYMENT_SERVICE_URL || 'http://localhost:4004')
          }
        ];

        res.json({ services });
      } catch (error) {
        logger.error('Service discovery failed', {
          error: error.message,
          action: 'service_discovery'
        });
        res.status(500).json({ error: 'Service discovery failed' });
      }
    });

    // Global error handler
    app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
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
        graphqlPath: server.graphqlPath,
        environment: process.env.NODE_ENV || 'development',
        action: 'gateway_start'
      });
      
      console.log(`🚀 API Gateway ready at http://localhost:${PORT}`);
      console.log(`📊 GraphQL endpoint: http://localhost:${PORT}${server.graphqlPath}`);
      console.log(`🔍 Service discovery: http://localhost:${PORT}/services`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down API Gateway gracefully');
      await server.stop();
      await gateway.stop();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down API Gateway gracefully');
      await server.stop();
      await gateway.stop();
      process.exit(0);
    });

  } catch (error) {
    logger.error('Failed to start API Gateway', {
      error: error.message,
      stack: error.stack,
      action: 'gateway_start_error'
    });
    process.exit(1);
  }
}

async function checkServiceHealth(baseUrl: string): Promise<string> {
  try {
    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      timeout: 5000
    });
    
    if (response.ok) {
      return 'healthy';
    } else {
      return 'unhealthy';
    }
  } catch (error) {
    return 'unreachable';
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
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception in API Gateway', {
    error: error.message,
    stack: error.stack,
    action: 'uncaught_exception'
  });
  process.exit(1);
});

startGateway();
