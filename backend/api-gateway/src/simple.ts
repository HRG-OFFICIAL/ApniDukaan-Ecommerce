import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Simple logger
const logger = {
  info: (message: string, ...args: any[]) => console.log(`[INFO] ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`[ERROR] ${message}`, ...args),
  warn: (message: string, ...args: any[]) => console.warn(`[WARN] ${message}`, ...args),
  debug: (message: string, ...args: any[]) => console.debug(`[DEBUG] ${message}`, ...args)
};

async function startSimpleServer() {
  const app = express();
  const PORT = process.env.PORT || 4000;

  // Middleware
  app.use(helmet());
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  });
  app.use(limiter);

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      service: 'ApniDukaan API Gateway',
      version: '1.0.0'
    });
  });

  // API status endpoint
  app.get('/api/status', (req, res) => {
    res.json({
      service: 'ApniDukaan API Gateway',
      status: 'running',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      endpoints: {
        health: '/health',
        status: '/api/status',
        graphql: '/graphql'
      }
    });
  });

  // Simple GraphQL endpoint (placeholder)
  app.get('/graphql', (req, res) => {
    res.json({
      message: 'GraphQL endpoint is available',
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  });

  // API routes placeholder
  app.get('/api/*', (req, res) => {
    res.json({
      message: 'API endpoint placeholder',
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  });

  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      message: 'Welcome to ApniDukaan API Gateway',
      version: '1.0.0',
      status: 'running',
      timestamp: new Date().toISOString(),
      endpoints: {
        health: '/health',
        status: '/api/status',
        graphql: '/graphql'
      }
    });
  });

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      error: 'Not Found',
      message: `Route ${req.originalUrl} not found`,
      timestamp: new Date().toISOString()
    });
  });

  // Error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error('Server error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Something went wrong',
      timestamp: new Date().toISOString()
    });
  });

  // Start server
  app.listen(PORT, () => {
    logger.info(`🚀 ApniDukaan API Gateway running on port ${PORT}`);
    logger.info(`🏥 Health check: http://localhost:${PORT}/health`);
    logger.info(`📈 API status: http://localhost:${PORT}/api/status`);
    logger.info(`🔗 GraphQL: http://localhost:${PORT}/graphql`);
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
}

// Start the server
startSimpleServer().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});

export default startSimpleServer;
