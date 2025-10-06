  import express from 'express';
  import cors from 'cors';
  import helmet from 'helmet';
  import rateLimit from 'express-rate-limit';
  import { body, validationResult } from 'express-validator';
  import { logger, connectDatabase } from '@apnidukaan/shared';
  import NotificationService from './services/NotificationService';

  async function startServer() {
    const app = express();
const PORT = process.env.PORT || 4007;

    try {
      // Connect to MongoDB Atlas
      await connectDatabase({
        uri: process.env.MONGODB_URI || 'mongodb+srv://userservice-dev:eKtnLTAnmTlPVM9H@cluster0.0ezsixh.mongodb.net/apnidukaan?retryWrites=true&w=majority&appName=Cluster0',
        dbName: 'notification_db'
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
        max: 100, // limit each IP to 100 requests per windowMs
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
          service: 'notification-service',
          timestamp: new Date().toISOString(),
          uptime: process.uptime()
        });
      });

      // Initialize notification service
      const notificationService = new NotificationService();

      // Validation middleware
      const handleValidationErrors: express.RequestHandler = (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
          });
          return;
        }
        next();
      };

      // Send notification endpoint
      app.post('/api/notifications/send', [
        body('type').isIn(['email', 'sms', 'push', 'in_app']).withMessage('Type must be email, sms, push, or in_app'),
        body('recipient').notEmpty().withMessage('Recipient is required'),
        body('template').notEmpty().withMessage('Template is required'),
        body('data').isObject().withMessage('Data must be an object'),
        handleValidationErrors
      ], async (req: express.Request, res: express.Response) => {
        try {
          const { type, recipient, template, data, priority = 'normal' } = req.body;
          
          const success = await notificationService.sendNotification({
            type,
            recipient,
            template,
            data,
            priority
          });

          if (success) {
            res.status(200).json({
              success: true,
              message: 'Notification queued successfully',
              notificationId: `notif_${Date.now()}`
            });
          } else {
            res.status(500).json({
              success: false,
              message: 'Failed to queue notification'
            });
          }
        } catch (error: any) {
          logger.error('Notification sending failed', {
            error: error.message,
            action: 'notification_error'
          });
          res.status(500).json({
            success: false,
            message: 'Failed to send notification'
          });
        }
      });

      // Convenience endpoints
      app.post('/api/notifications/welcome-email', [
        body('email').isEmail().withMessage('Valid email is required'),
        body('userName').notEmpty().withMessage('User name is required'),
        handleValidationErrors
      ], async (req: express.Request, res: express.Response) => {
        try {
          const { email, userName } = req.body;
          const success = await notificationService.sendWelcomeEmail(email, userName);
          
          res.status(200).json({
            success,
            message: success ? 'Welcome email sent' : 'Failed to send welcome email'
          });
        } catch (error: any) {
          res.status(500).json({
            success: false,
            message: 'Failed to send welcome email'
          });
        }
      });

      app.post('/api/notifications/order-confirmation', [
        body('email').isEmail().withMessage('Valid email is required'),
        body('orderData').isObject().withMessage('Order data is required'),
        handleValidationErrors
      ], async (req: express.Request, res: express.Response) => {
        try {
          const { email, orderData } = req.body;
          const success = await notificationService.sendOrderConfirmation(email, orderData);
          
          res.status(200).json({
            success,
            message: success ? 'Order confirmation sent' : 'Failed to send order confirmation'
          });
        } catch (error: any) {
          res.status(500).json({
            success: false,
            message: 'Failed to send order confirmation'
          });
        }
      });

      app.post('/api/notifications/password-reset', [
        body('email').isEmail().withMessage('Valid email is required'),
        body('resetToken').notEmpty().withMessage('Reset token is required'),
        body('userName').notEmpty().withMessage('User name is required'),
        handleValidationErrors
      ], async (req: express.Request, res: express.Response) => {
        try {
          const { email, resetToken, userName } = req.body;
          const success = await notificationService.sendPasswordResetEmail(email, resetToken, userName);
          
          res.status(200).json({
            success,
            message: success ? 'Password reset email sent' : 'Failed to send password reset email'
          });
        } catch (error: any) {
          res.status(500).json({
            success: false,
            message: 'Failed to send password reset email'
          });
        }
      });

      app.post('/api/notifications/sms/otp', [
        body('phoneNumber').isMobilePhone('any').withMessage('Valid phone number is required'),
        body('otp').isLength({ min: 4, max: 6 }).withMessage('OTP must be 4-6 digits'),
        handleValidationErrors
      ], async (req: express.Request, res: express.Response) => {
        try {
          const { phoneNumber, otp } = req.body;
          const success = await notificationService.sendOTP(phoneNumber, otp);
          
          res.status(200).json({
            success,
            message: success ? 'OTP sent' : 'Failed to send OTP'
          });
        } catch (error: any) {
          res.status(500).json({
            success: false,
            message: 'Failed to send OTP'
          });
        }
      });

      // Start server
      app.listen(PORT, () => {
        logger.info('Notification Service started successfully', {
          service: 'apnidukaan-service',
          environment: process.env.NODE_ENV || 'development',
          version: '1.0.0',
          port: PORT,
          action: 'server_start'
        });
        
        console.log(`🚀 Notification Service ready at http://localhost:${PORT}`);
        console.log(`📊 Health check: http://localhost:${PORT}/health`);
        console.log(`📧 API endpoints: http://localhost:${PORT}/api`);
      });

    } catch (error: any) {
      logger.error('Failed to start Notification Service', {
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