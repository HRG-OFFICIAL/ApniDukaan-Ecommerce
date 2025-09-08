import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import winston from 'winston';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Service URLs
const services = {
  user: process.env.USER_SERVICE_URL || 'http://localhost:4002',
  catalog: process.env.CATALOG_SERVICE_URL || 'http://localhost:4001',
  order: process.env.ORDER_SERVICE_URL || 'http://localhost:4003'
};

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Rate limiting - more generous for gateway
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 500 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});
app.use(limiter);

// Body parsing for logging
app.use(express.json({ limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
  });
  
  next();
});

// Proxy configurations
const proxyOptions = {
  changeOrigin: true,
  logLevel: 'warn' as const,
  onError: (err: any, req: express.Request, res: express.Response) => {
    logger.error('Proxy error:', {
      error: err.message,
      url: req.url,
      method: req.method
    });
    
    res.status(503).json({
      success: false,
      message: 'Service temporarily unavailable',
      code: 'SERVICE_UNAVAILABLE'
    });
  },
  onProxyRes: (proxyRes: any, req: express.Request, res: express.Response) => {
    // Add some headers
    res.setHeader('X-Powered-By', 'ShopSphere API Gateway');
  }
};

// Route proxies
app.use('/api/auth', createProxyMiddleware({
  target: services.user,
  ...proxyOptions,
  pathRewrite: {
    '^/api/auth': '/api/auth'
  }
}));

app.use('/api/products', createProxyMiddleware({
  target: services.catalog,
  ...proxyOptions,
  pathRewrite: {
    '^/api/products': '/api/products'
  }
}));

app.use('/api/orders', createProxyMiddleware({
  target: services.order,
  ...proxyOptions,
  pathRewrite: {
    '^/api/orders': '/api/orders'
  }
}));

// Health check endpoint
app.get('/health', async (req, res) => {
  const healthChecks = await Promise.allSettled([
    fetch(`${services.user}/health`).then(r => r.json()),
    fetch(`${services.catalog}/health`).then(r => r.json())
  ]);

  const userService = healthChecks[0].status === 'fulfilled' ? 'healthy' : 'unhealthy';
  const catalogService = healthChecks[1].status === 'fulfilled' ? 'healthy' : 'unhealthy';

  const overallHealth = userService === 'healthy' && catalogService === 'healthy' ? 'healthy' : 'degraded';

  res.status(overallHealth === 'healthy' ? 200 : 503).json({
    success: true,
    service: 'simple-api-gateway',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    status: overallHealth,
    services: {
      user: userService,
      catalog: catalogService,
      order: 'not implemented'
    }
  });
});

// Gateway info endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'ShopSphere API Gateway',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth/*',
      products: '/api/products/*',
      orders: '/api/orders/* (coming soon)'
    },
    documentation: 'https://github.com/shopsphere/api-docs',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    availableEndpoints: ['/api/auth', '/api/products', '/api/orders', '/health']
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Gateway error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  });
  
  res.status(500).json({
    success: false,
    message: 'Internal gateway error',
    code: 'GATEWAY_ERROR'
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`ShopSphere API Gateway running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info('Service mappings:', services);
});

export default app;
