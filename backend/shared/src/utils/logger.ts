import winston, { Logger, format, transports } from 'winston';
import path from 'path';
import fs from 'fs';

// Log levels
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  HTTP = 'http',
  VERBOSE = 'verbose',
  DEBUG = 'debug',
  SILLY = 'silly'
}

// Log context interface
export interface LogContext {
  [key: string]: any;
  action?: string;
  userId?: string;
  requestId?: string;
  correlationId?: string;
  service?: string;
  version?: string;
  environment?: string;
  timestamp?: string;
  duration?: number;
  statusCode?: number;
  method?: string;
  url?: string;
  userAgent?: string;
  ip?: string;
  error?: any;
  stack?: string;
}

// Custom log format
const customFormat = format.combine(
  format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  format.errors({ stack: true }),
  format.json(),
  format.printf(({ timestamp, level, message, ...meta }) => {
    const logEntry = {
      timestamp,
      level,
      message,
      ...meta
    };
    return JSON.stringify(logEntry);
  })
);

// Console format for development
const consoleFormat = format.combine(
  format.timestamp({
    format: 'HH:mm:ss.SSS'
  }),
  format.colorize(),
  format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Logger configuration
const loggerConfig = {
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  format: customFormat,
  defaultMeta: {
    service: process.env.SERVICE_NAME || 'apnidukaan-service',
    environment: process.env.NODE_ENV || 'development',
    version: process.env.SERVICE_VERSION || '1.0.0'
  },
  transports: [
    new transports.Console({
      format: consoleFormat,
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
    })
  ]
};

// Create the logger
export const logger: Logger = winston.createLogger(loggerConfig);

// Add file transports for production
if (process.env.NODE_ENV === 'production') {
  // Error log file
  logger.add(new transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    format: customFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    tailable: true
  }));

  // Combined log file
  logger.add(new transports.File({
    filename: path.join(logsDir, 'combined.log'),
    format: customFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    tailable: true
  }));

  // Access log file for HTTP requests
  logger.add(new transports.File({
    filename: path.join(logsDir, 'access.log'),
    level: 'http',
    format: customFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 10,
    tailable: true
  }));
}

// Enhanced logging methods
export class EnhancedLogger {
  private logger: Logger;
  private defaultContext: LogContext;

  constructor(logger: Logger, defaultContext: LogContext = {}) {
    this.logger = logger;
    this.defaultContext = defaultContext;
  }

  private mergeContext(context: LogContext = {}): LogContext {
    return {
      ...this.defaultContext,
      ...context,
      timestamp: new Date().toISOString()
    };
  }

  error(message: string, context: LogContext = {}): void {
    this.logger.error(message, this.mergeContext(context));
  }

  warn(message: string, context: LogContext = {}): void {
    this.logger.warn(message, this.mergeContext(context));
  }

  info(message: string, context: LogContext = {}): void {
    this.logger.info(message, this.mergeContext(context));
  }

  http(message: string, context: LogContext = {}): void {
    this.logger.http(message, this.mergeContext(context));
  }

  verbose(message: string, context: LogContext = {}): void {
    this.logger.verbose(message, this.mergeContext(context));
  }

  debug(message: string, context: LogContext = {}): void {
    this.logger.debug(message, this.mergeContext(context));
  }

  silly(message: string, context: LogContext = {}): void {
    this.logger.silly(message, this.mergeContext(context));
  }

  // Specialized logging methods
  logRequest(method: string, url: string, statusCode: number, duration: number, context: LogContext = {}): void {
    this.http('HTTP Request', {
      method,
      url,
      statusCode,
      duration,
      action: 'http_request',
      ...context
    });
  }

  logError(error: Error, context: LogContext = {}): void {
    this.error('Error occurred', {
      error: error.message,
      stack: error.stack,
      action: 'error_occurred',
      ...context
    });
  }

  logDatabaseOperation(operation: string, collection: string, duration: number, context: LogContext = {}): void {
    this.info('Database operation', {
      operation,
      collection,
      duration,
      action: 'database_operation',
      ...context
    });
  }

  logAuthEvent(event: string, userId?: string, context: LogContext = {}): void {
    this.info('Authentication event', {
      event,
      userId,
      action: 'auth_event',
      ...context
    });
  }

  logBusinessEvent(event: string, entityType: string, entityId: string, context: LogContext = {}): void {
    this.info('Business event', {
      event,
      entityType,
      entityId,
      action: 'business_event',
      ...context
    });
  }

  logPerformance(operation: string, duration: number, context: LogContext = {}): void {
    this.info('Performance metric', {
      operation,
      duration,
      action: 'performance_metric',
      ...context
    });
  }

  logSecurity(event: string, severity: 'low' | 'medium' | 'high' | 'critical', context: LogContext = {}): void {
    const level = severity === 'critical' || severity === 'high' ? 'error' : 'warn';
    this.logger[level]('Security event', {
      event,
      severity,
      action: 'security_event',
      ...this.mergeContext(context)
    });
  }
}

// Create enhanced logger instance
export const enhancedLogger = new EnhancedLogger(logger);

// Utility functions
export const createChildLogger = (defaultContext: LogContext): EnhancedLogger => {
  return new EnhancedLogger(logger, defaultContext);
};

export const setLogLevel = (level: LogLevel): void => {
  logger.level = level;
};

export const getLogLevel = (): string => {
  return logger.level;
};

// Log rotation utility
export const rotateLogs = async (): Promise<void> => {
  try {
    // This would typically be handled by winston's built-in rotation
    // or external tools like logrotate
    logger.info('Log rotation requested', {
      action: 'log_rotation'
    });
  } catch (error: any) {
    logger.error('Log rotation failed', {
      error: error.message,
      action: 'log_rotation_error'
    });
    throw error;
  }
};

// Log cleanup utility
export const cleanupOldLogs = async (daysToKeep: number = 30): Promise<void> => {
  try {
    const files = fs.readdirSync(logsDir);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    for (const file of files) {
      const filePath = path.join(logsDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isFile() && stats.mtime < cutoffDate) {
        fs.unlinkSync(filePath);
        logger.info('Old log file deleted', {
          file,
          action: 'log_cleanup'
        });
      }
    }
  } catch (error: any) {
    logger.error('Log cleanup failed', {
      error: error.message,
      action: 'log_cleanup_error'
    });
    throw error;
  }
};

// Export the default logger as well
export default logger;