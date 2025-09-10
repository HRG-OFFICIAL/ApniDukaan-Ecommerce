  import express from 'express';
  import cors from 'cors';
  import helmet from 'helmet';
  import rateLimit from 'express-rate-limit';
  import { logger, connectDatabase } from '@apnidukaan/shared';

  async function startServer() {
    const app = express();
const PORT = process.env.PORT || 4007;

    try {
      // Connect to MongoDB Atlas
      await connectDatabase({
        uri: process.env.MONGODB_URI || 'mongodb+srv://userservice-dev:OELp6t3K63rHhKgJ@cluster0.0ezsixh.mongodb.net/apnidukaan_notifications?retryWrites=true&w=majority&appName=Cluster0',
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

      // Basic notification endpoint
      app.post('/api/notifications/send', (req, res) => {
        try {
          const { type, recipient, _message, _data } = req.body;
          
          logger.info('Notification request received', {
            type,
            recipient,
            action: 'notification_request'
          });

          // Mock notification sending
          res.status(200).json({
            success: true,
            message: 'Notification sent successfully',
            notificationId: `notif_${Date.now()}`
          });
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