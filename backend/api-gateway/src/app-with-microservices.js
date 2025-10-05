// Microservices-integrated API Gateway
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 4000;

// Service URLs
const CATALOG_SERVICE_URL = process.env.CATALOG_SERVICE_URL || 'http://catalog-service:4001';
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:4002';
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://order-service:4003';
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://payment-service:4004';
const CART_SERVICE_URL = process.env.CART_SERVICE_URL || 'http://cart-service:4005';
const SEARCH_SERVICE_URL = process.env.SEARCH_SERVICE_URL || 'http://search-service:4006';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:4007';
const ORDER_MANAGEMENT_SERVICE_URL = process.env.ORDER_MANAGEMENT_SERVICE_URL || 'http://order-management-service:4008';

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

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'ApniDukaan API Gateway',
    version: '1.0.0',
    microservices: {
      catalog: CATALOG_SERVICE_URL,
      user: USER_SERVICE_URL,
      order: ORDER_SERVICE_URL,
      payment: PAYMENT_SERVICE_URL,
      cart: CART_SERVICE_URL,
      search: SEARCH_SERVICE_URL,
      notification: NOTIFICATION_SERVICE_URL,
      orderManagement: ORDER_MANAGEMENT_SERVICE_URL
    }
  });
});

// API status
app.get('/api/status', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    services: {
      catalog: CATALOG_SERVICE_URL,
      user: USER_SERVICE_URL,
      order: ORDER_SERVICE_URL,
      payment: PAYMENT_SERVICE_URL,
      cart: CART_SERVICE_URL,
      search: SEARCH_SERVICE_URL,
      notification: NOTIFICATION_SERVICE_URL,
      orderManagement: ORDER_MANAGEMENT_SERVICE_URL
    }
  });
});

// Proxy middleware configuration
const createProxyOptions = (target, pathRewrite = {}) => ({
  target,
  changeOrigin: true,
  pathRewrite,
  onError: (err, req, res) => {
    console.error(`Proxy error for ${target}:`, err.message);
    res.status(502).json({
      success: false,
      error: 'Service temporarily unavailable',
      service: target
    });
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`Proxying ${req.method} ${req.url} to ${target}`);
  }
});

// Catalog Service Routes
app.use('/api/catalog', createProxyMiddleware(createProxyOptions(CATALOG_SERVICE_URL, {
  '^/api/catalog': '/api'
})));

// User Service Routes
app.use('/api/users', createProxyMiddleware(createProxyOptions(USER_SERVICE_URL, {
  '^/api/users': '/api'
})));

app.use('/api/auth', createProxyMiddleware(createProxyOptions(USER_SERVICE_URL, {
  '^/api/auth': '/api'
})));

// Order Service Routes
app.use('/api/orders', createProxyMiddleware(createProxyOptions(ORDER_SERVICE_URL, {
  '^/api/orders': '/api'
})));

// Payment Service Routes
app.use('/api/payments', createProxyMiddleware(createProxyOptions(PAYMENT_SERVICE_URL, {
  '^/api/payments': '/api'
})));

// Cart Service Routes
app.use('/api/cart', createProxyMiddleware(createProxyOptions(CART_SERVICE_URL, {
  '^/api/cart': '/api'
})));

// Search Service Routes
app.use('/api/search', createProxyMiddleware(createProxyOptions(SEARCH_SERVICE_URL, {
  '^/api/search': '/api'
})));

// Notification Service Routes
app.use('/api/notifications', createProxyMiddleware(createProxyOptions(NOTIFICATION_SERVICE_URL, {
  '^/api/notifications': '/api'
})));

// Order Management Service Routes
app.use('/api/order-management', createProxyMiddleware(createProxyOptions(ORDER_MANAGEMENT_SERVICE_URL, {
  '^/api/order-management': '/api'
})));

// GraphQL placeholder - redirect to catalog service
app.get('/graphql', (req, res) => {
  res.json({
    message: 'GraphQL endpoint not implemented',
    suggestion: 'Use REST API endpoints instead',
    availableEndpoints: [
      'GET /api/catalog/products',
      'GET /api/catalog/categories',
      'GET /api/search/products',
      'POST /api/auth/login',
      'POST /api/auth/register',
      'GET /api/orders',
      'POST /api/orders',
      'GET /api/cart',
      'POST /api/cart',
      'POST /api/payments/razorpay/create-order'
    ]
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    availableEndpoints: [
      '/health',
      '/api/status',
      '/api/catalog/*',
      '/api/users/*',
      '/api/auth/*',
      '/api/orders/*',
      '/api/payments/*',
      '/api/cart/*',
      '/api/search/*',
      '/api/notifications/*',
      '/api/order-management/*'
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('API Gateway Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 ApniDukaan API Gateway running on port ${PORT}`);
  console.log(`🏥 Health: http://localhost:${PORT}/health`);
  console.log(`📈 Status: http://localhost:${PORT}/api/status`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`📦 Services:`);
  console.log(`   - Catalog: ${CATALOG_SERVICE_URL}`);
  console.log(`   - User: ${USER_SERVICE_URL}`);
  console.log(`   - Order: ${ORDER_SERVICE_URL}`);
  console.log(`   - Payment: ${PAYMENT_SERVICE_URL}`);
  console.log(`   - Cart: ${CART_SERVICE_URL}`);
  console.log(`   - Search: ${SEARCH_SERVICE_URL}`);
  console.log(`   - Notification: ${NOTIFICATION_SERVICE_URL}`);
  console.log(`   - Order Management: ${ORDER_MANAGEMENT_SERVICE_URL}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});
