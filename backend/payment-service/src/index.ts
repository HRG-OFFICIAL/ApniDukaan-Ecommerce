import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { logger } from '@apnidukaan/shared';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 4004;

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
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 50, // limit each IP to 50 requests per windowMs (lower for payment)
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false
    });
    app.use('/api', limiter);

    // Body parsing middleware
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'healthy',
        service: 'payment-service',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });

    // Razorpay endpoints
    app.post('/api/payments/razorpay/create-order', (req, res) => {
      try {
        const { amount, currency = 'INR', receipt, notes } = req.body;
        
        if (!amount || !receipt) {
          return res.status(400).json({
            success: false,
            error: 'Amount and receipt are required'
          });
        }

        // Generate mock Razorpay order
        const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        res.json({
          success: true,
          data: {
            orderId,
            amount: Math.round(amount * 100), // Convert to paise
            currency,
            receipt,
            status: 'created',
            keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_RPTmqUYFOHsjfL',
            notes: notes || {}
          }
        });
      } catch (error: any) {
        logger.error('Razorpay order creation error', {
          error: error.message,
          action: 'razorpay_create_order'
        });
        
        res.status(500).json({
          success: false,
          error: 'Failed to create Razorpay order'
        });
      }
    });

    app.post('/api/payments/razorpay/verify', (req, res) => {
      try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
          return res.status(400).json({
            success: false,
            error: 'Missing required verification parameters'
          });
        }

        // Mock verification - in production, you'd verify the signature
        const isValid = Math.random() > 0.1; // 90% success rate for testing
        
        if (!isValid) {
          return res.status(400).json({
            success: false,
            error: 'Invalid payment signature'
          });
        }

        res.json({
          success: true,
          data: {
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id,
            status: 'verified',
            verifiedAt: new Date().toISOString()
          }
        });
      } catch (error: any) {
        logger.error('Razorpay payment verification error', {
          error: error.message,
          action: 'razorpay_verify'
        });
        
        res.status(500).json({
          success: false,
          error: 'Payment verification failed'
        });
      }
    });

    // API routes
    app.post('/api/payments/create', (req, res) => {
      const { amount, currency, orderId, paymentMethod } = req.body;
      
      // Mock payment processing
      const paymentId = Math.floor(Math.random() * 10000);
      const status = Math.random() > 0.1 ? 'succeeded' : 'failed'; // 90% success rate
      
      res.json({
        success: true,
        data: {
          id: paymentId,
          orderId,
          amount,
          currency: currency || 'USD',
          status,
          paymentMethod,
          transactionId: `txn_${paymentId}`,
          createdAt: new Date().toISOString()
        }
      });
    });

    app.get('/api/payments/:id', (req, res) => {
      const { id } = req.params;
      res.json({
        success: true,
        data: {
          id: parseInt(id),
          orderId: 123,
          amount: 99.99,
          currency: 'USD',
          status: 'succeeded',
          paymentMethod: 'card',
          transactionId: `txn_${id}`,
          createdAt: new Date().toISOString()
        }
      });
    });

    app.post('/api/payments/:id/refund', (req, res) => {
      const { id } = req.params;
      const { amount } = req.body;
      
      res.json({
        success: true,
        data: {
          id: parseInt(id),
          refundId: Math.floor(Math.random() * 10000),
          amount: amount || 99.99,
          status: 'succeeded',
          createdAt: new Date().toISOString()
        }
      });
    });

    // Stripe webhook endpoint (mock)
    app.post('/api/webhooks/stripe', (req, res) => {
      res.json({ received: true });
    });

    // PayPal webhook endpoint (mock)
    app.post('/api/webhooks/paypal', (req, res) => {
      res.json({ received: true });
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
      logger.info('Payment Service started successfully', {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        action: 'server_start'
      });
      
      console.log(`🚀 Payment Service ready at http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`💳 API endpoints: http://localhost:${PORT}/api`);
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

  } catch (error: any) {
    logger.error('Failed to start Payment Service', {
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
process.on('uncaughtException', (error: any) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack,
    action: 'uncaught_exception'
  });
  process.exit(1);
});

startServer();
