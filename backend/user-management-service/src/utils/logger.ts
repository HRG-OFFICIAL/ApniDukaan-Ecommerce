import winston from 'winston';

// Create logger configuration
const createLogger = () => {
  const logLevel = process.env.LOG_LEVEL || 'info';
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const formats = [
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ];

  if (isDevelopment) {
    formats.push(
      winston.format.colorize(),
      winston.format.simple()
    );
  }

  const logger = winston.createLogger({
    level: logLevel,
    format: winston.format.combine(...formats),
    defaultMeta: { 
      service: 'user-management',
      environment: process.env.NODE_ENV || 'development'
    },
    transports: [
      new winston.transports.Console({
        format: isDevelopment 
          ? winston.format.combine(
              winston.format.colorize(),
              winston.format.simple()
            )
          : winston.format.json()
      })
    ]
  });

  // Add file transports for production
  if (!isDevelopment) {
    logger.add(new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }));
    logger.add(new winston.transports.File({ 
      filename: 'logs/combined.log' 
    }));
  }

  return logger;
};

export const logger = createLogger();

// Utility functions
export const validateEnv = (requiredVars: string[]) => {
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    logger.error(`Missing required environment variables: ${missing.join(', ')}`);
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return process.env as Record<string, string>;
};

export const gracefulShutdown = (server: any, serviceName: string) => {
  return () => {
    logger.info(`${serviceName} received shutdown signal, closing server...`);
    
    server.close(() => {
      logger.info(`${serviceName} server closed successfully`);
      process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
      logger.error(`${serviceName} forced shutdown after timeout`);
      process.exit(1);
    }, 10000);
  };
};
