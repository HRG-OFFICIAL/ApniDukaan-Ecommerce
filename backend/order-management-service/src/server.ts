#!/usr/bin/env node

/**
 * ShopSphere E-commerce Platform
 * Order Management Service
 * Server Entry Point
 */

import OrderManagementApp from './app';
import { logger } from '@shopsphere/shared';

// Handle uncaught exceptions before starting the application
process.on('uncaughtException', (error: Error) => {
  logger.fatal('Uncaught Exception - Server startup failed:', {
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });
  process.exit(1);
});

// Handle unhandled promise rejections before starting the application
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.fatal('Unhandled Rejection - Server startup failed:', {
    reason,
    promise,
    timestamp: new Date().toISOString()
  });
  process.exit(1);
});

// Log startup information
logger.info('Starting ShopSphere Order Management Service...', {
  nodeVersion: process.version,
  platform: process.platform,
  arch: process.arch,
  environment: process.env.NODE_ENV || 'development',
  pid: process.pid,
  timestamp: new Date().toISOString()
});

// Validate required environment variables
const requiredEnvVars = [
  'MONGODB_URI',
  'REDIS_URL',
  'JWT_SECRET',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'PAYPAL_CLIENT_ID',
  'PAYPAL_CLIENT_SECRET'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  logger.fatal('Missing required environment variables:', {
    missing: missingEnvVars,
    timestamp: new Date().toISOString()
  });
  process.exit(1);
}

// Log non-sensitive configuration
logger.info('Service configuration:', {
  port: process.env.PORT || 3002,
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  rateLimitWindow: process.env.RATE_LIMIT_WINDOW_MS || '900000',
  rateLimitMax: process.env.RATE_LIMIT_MAX_REQUESTS || '100',
  timestamp: new Date().toISOString()
});

// Initialize and start the application
async function startServer() {
  try {
    const app = new OrderManagementApp();
    await app.start();
  } catch (error: any) {
    logger.fatal('Failed to start Order Management Service:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    process.exit(1);
  }
}

// Start the server
startServer();
