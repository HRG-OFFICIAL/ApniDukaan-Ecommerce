import winston from 'winston';
import path from 'path';

// Custom log levels
const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    verbose: 4,
    debug: 5,
    silly: 6
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    verbose: 'cyan',
    debug: 'blue',
    silly: 'grey'
  }
};

// Add colors to winston
winston.addColors(customLevels.colors);

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, service, ...metadata }) => {
    let msg = `[${timestamp}] [${service || 'APP'}] ${level}: ${message}`;
    
    // Add metadata if present
    const metadataKeys = Object.keys(metadata);
    if (metadataKeys.length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    
    return msg;
  })
);

// Custom format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logger instance
const createLogger = (serviceName: string = 'APP') => {
  const logLevel = process.env.LOG_LEVEL || 'info';
  const logDir = process.env.LOG_DIR || 'logs';

  const transports: winston.transport[] = [
    // Console transport
    new winston.transports.Console({
      level: logLevel,
      format: consoleFormat
    })
  ];

  // Add file transports in production
  if (process.env.NODE_ENV === 'production') {
    transports.push(
      // Combined log file
      new winston.transports.File({
        filename: path.join(logDir, 'combined.log'),
        level: 'info',
        format: fileFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5
      }),
      
      // Error log file
      new winston.transports.File({
        filename: path.join(logDir, 'error.log'),
        level: 'error',
        format: fileFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5
      })
    );
  }

  return winston.createLogger({
    levels: customLevels.levels,
    level: logLevel,
    defaultMeta: { service: serviceName },
    transports,
    exitOnError: false
  });
};

// Default logger instance
export const logger = createLogger();

// Logger factory for different services
export const createServiceLogger = (serviceName: string) => {
  return createLogger(serviceName);
};

// Request logging middleware for Express
export const requestLogger = (serviceName?: string) => {
  const requestLog = serviceName ? createServiceLogger(serviceName) : logger;
  
  return (req: any, res: any, next: any) => {
    const start = Date.now();
    const { method, url, ip, headers } = req;
    
    // Log request
    requestLog.http('Incoming request', {
      method,
      url,
      ip: ip || headers['x-forwarded-for'] || 'unknown',
      userAgent: headers['user-agent']
    });

    // Override res.end to capture response
    const originalEnd = res.end;
    res.end = function(chunk: any, encoding: any) {
      res.end = originalEnd;
      res.end(chunk, encoding);
      
      const duration = Date.now() - start;
      const { statusCode } = res;
      
      // Log response
      requestLog.http('Request completed', {
        method,
        url,
        statusCode,
        duration: `${duration}ms`,
        contentLength: res.get('content-length') || 0
      });
    };
    
    next();
  };
};

// Error logging helper
export const logError = (error: Error, context?: any) => {
  logger.error('Error occurred', {
    message: error.message,
    stack: error.stack,
    context
  });
};

// Database operation logging
export const logDatabaseOperation = (operation: string, collection: string, query?: any, duration?: number) => {
  logger.debug('Database operation', {
    operation,
    collection,
    query: query ? JSON.stringify(query) : undefined,
    duration: duration ? `${duration}ms` : undefined
  });
};

// External API call logging
export const logApiCall = (method: string, url: string, statusCode?: number, duration?: number, error?: Error) => {
  const logData = {
    method,
    url,
    statusCode,
    duration: duration ? `${duration}ms` : undefined
  };

  if (error) {
    logger.warn('External API call failed', {
      ...logData,
      error: error.message
    });
  } else {
    logger.info('External API call completed', logData);
  }
};

// Performance logging
export const logPerformance = (operation: string, duration: number, metadata?: any) => {
  logger.info('Performance metric', {
    operation,
    duration: `${duration}ms`,
    ...metadata
  });
};

// User action logging
export const logUserAction = (userId: string, action: string, details?: any) => {
  logger.info('User action', {
    userId,
    action,
    details
  });
};

// Security event logging
export const logSecurityEvent = (event: string, details: any, severity: 'low' | 'medium' | 'high' = 'medium') => {
  logger.warn('Security event', {
    event,
    severity,
    details,
    timestamp: new Date().toISOString()
  });
};

// Business logic logging
export const logBusinessEvent = (event: string, details: any) => {
  logger.info('Business event', {
    event,
    details,
    timestamp: new Date().toISOString()
  });
};

// Utility function to create child loggers with additional context
export const createChildLogger = (parentLogger: winston.Logger, context: any) => {
  return parentLogger.child(context);
};

// Stream for Morgan HTTP request logging
export const stream = {
  write: (message: string) => {
    logger.http(message.trim());
  }
};

// Health check logging
export const logHealthCheck = (serviceName: string, status: 'healthy' | 'unhealthy', details?: any) => {
  const logLevel = status === 'healthy' ? 'info' : 'error';
  logger.log(logLevel, 'Health check', {
    service: serviceName,
    status,
    details
  });
};

// Configuration logging (be careful not to log sensitive data)
export const logConfiguration = (config: any, serviceName?: string) => {
  // Remove sensitive keys
  const sensitiveKeys = ['password', 'secret', 'key', 'token', 'api_key', 'private'];
  const sanitizedConfig = { ...config };
  
  const sanitizeObject = (obj: any) => {
    Object.keys(obj).forEach(key => {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        obj[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeObject(obj[key]);
      }
    });
  };
  
  sanitizeObject(sanitizedConfig);
  
  logger.info('Service configuration', {
    service: serviceName,
    config: sanitizedConfig
  });
};
