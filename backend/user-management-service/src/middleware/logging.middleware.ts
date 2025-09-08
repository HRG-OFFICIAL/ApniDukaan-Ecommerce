import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

// Extended request interface
interface ExtendedRequest extends Request {
  startTime?: number;
  requestId?: string;
  user?: {
    id: string;
    email: string;
    roles: string[];
  };
}

// Configuration
const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

// Sensitive fields to exclude from logging
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'secret',
  'key',
  'authorization',
  'cookie',
  'session',
  'mfaToken',
  'backupCode'
];

// Headers to exclude from logging
const EXCLUDED_HEADERS = [
  'authorization',
  'cookie',
  'x-api-key',
  'x-auth-token'
];

// Utility function to sanitize sensitive data
const sanitizeObject = (obj: any, depth: number = 3): any => {
  if (depth <= 0 || obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return obj.length > 500 ? `${obj.substring(0, 500)}...` : obj;
  }

  if (Array.isArray(obj)) {
    return obj.slice(0, 10).map(item => sanitizeObject(item, depth - 1));
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      
      if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeObject(value, depth - 1);
      }
    }
    
    return sanitized;
  }

  return obj;
};

// Sanitize headers
const sanitizeHeaders = (headers: any): any => {
  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();
    
    if (EXCLUDED_HEADERS.includes(lowerKey)) {
      sanitized[key] = '[REDACTED]';
    } else if (lowerKey.includes('auth') || lowerKey.includes('token')) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

// Generate request correlation ID
const generateRequestId = (): string => {
  return uuidv4();
};

// Get client IP address
const getClientIp = (req: Request): string => {
  return (
    req.ip ||
    req.connection.remoteAddress ||
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    (req.headers['x-real-ip'] as string) ||
    (req.socket.remoteAddress) ||
    'unknown'
  );
};

// Get user agent info
const getUserAgent = (req: Request): string => {
  return req.get('User-Agent') || 'unknown';
};

// Determine log level based on status code
const getLogLevel = (statusCode: number): string => {
  if (statusCode >= 500) return 'error';
  if (statusCode >= 400) return 'warn';
  if (statusCode >= 300) return 'info';
  return 'info';
};

// Skip logging for certain paths
const shouldSkipLogging = (req: Request): boolean => {
  const skipPaths = ['/health', '/metrics'];
  const path = req.path.toLowerCase();
  
  // Skip health checks and metrics in production
  if (!isDevelopment && skipPaths.some(skipPath => path.includes(skipPath))) {
    return true;
  }
  
  // Skip in test environment unless explicitly enabled
  if (isTest && !process.env.LOG_REQUESTS) {
    return true;
  }
  
  return false;
};

// Request logging middleware
export const requestLogger = (req: ExtendedRequest, res: Response, next: NextFunction): void => {
  // Skip logging for certain requests
  if (shouldSkipLogging(req)) {
    return next();
  }

  // Generate request ID and start time
  req.requestId = req.get('X-Request-ID') || generateRequestId();
  req.startTime = Date.now();

  // Set request ID in response header
  res.set('X-Request-ID', req.requestId);

  // Log incoming request
  const requestLog = {
    type: 'incoming_request',
    requestId: req.requestId,
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    path: req.path,
    query: sanitizeObject(req.query, 2),
    headers: sanitizeHeaders(req.headers),
    body: req.method !== 'GET' ? sanitizeObject(req.body, 2) : undefined,
    params: sanitizeObject(req.params),
    ip: getClientIp(req),
    userAgent: getUserAgent(req),
    protocol: req.protocol,
    host: req.get('Host'),
    contentLength: req.get('Content-Length'),
    contentType: req.get('Content-Type'),
    user: req.user ? {
      id: req.user.id,
      email: req.user.email,
      roles: req.user.roles
    } : undefined
  };

  if (isDevelopment) {
    logger.debug('Incoming Request:', requestLog);
  } else {
    logger.info('Request:', {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      ip: getClientIp(req),
      userAgent: getUserAgent(req),
      userId: req.user?.id,
      timestamp: new Date().toISOString()
    });
  }

  // Capture response data
  const originalSend = res.send;
  const originalJson = res.json;
  let responseBody: any;

  // Override res.send to capture response
  res.send = function(data: any): Response {
    responseBody = data;
    return originalSend.call(this, data);
  };

  // Override res.json to capture response
  res.json = function(data: any): Response {
    responseBody = data;
    return originalJson.call(this, data);
  };

  // Log response when request finishes
  res.on('finish', () => {
    const duration = req.startTime ? Date.now() - req.startTime : 0;
    const logLevel = getLogLevel(res.statusCode);

    const responseLog = {
      type: 'outgoing_response',
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      statusMessage: res.statusMessage,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length'),
      contentType: res.get('Content-Type'),
      ip: getClientIp(req),
      userAgent: getUserAgent(req),
      user: req.user ? {
        id: req.user.id,
        email: req.user.email
      } : undefined,
      responseBody: isDevelopment && responseBody ? sanitizeObject(responseBody, 1) : undefined
    };

    if (isDevelopment) {
      logger[logLevel as keyof typeof logger]('Outgoing Response:', responseLog);
    } else {
      logger[logLevel as keyof typeof logger]('Response:', {
        requestId: req.requestId,
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        ip: getClientIp(req),
        userId: req.user?.id,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Log when connection closes unexpectedly
  res.on('close', () => {
    if (!res.headersSent) {
      const duration = req.startTime ? Date.now() - req.startTime : 0;
      
      logger.warn('Connection Closed:', {
        requestId: req.requestId,
        method: req.method,
        url: req.originalUrl,
        duration: `${duration}ms`,
        ip: getClientIp(req),
        userId: req.user?.id,
        timestamp: new Date().toISOString()
      });
    }
  });

  next();
};

// Error logging middleware
export const errorLogger = (err: any, req: ExtendedRequest, res: Response, next: NextFunction): void => {
  const duration = req.startTime ? Date.now() - req.startTime : 0;

  const errorLog = {
    type: 'request_error',
    requestId: req.requestId,
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    error: {
      name: err.name,
      message: err.message,
      code: err.code,
      statusCode: err.statusCode,
      stack: isDevelopment ? err.stack : undefined
    },
    duration: `${duration}ms`,
    ip: getClientIp(req),
    userAgent: getUserAgent(req),
    user: req.user ? {
      id: req.user.id,
      email: req.user.email,
      roles: req.user.roles
    } : undefined,
    body: sanitizeObject(req.body, 1),
    query: sanitizeObject(req.query, 1),
    params: sanitizeObject(req.params)
  };

  logger.error('Request Error:', errorLog);
  next(err);
};

// Performance logging middleware
export const performanceLogger = (req: ExtendedRequest, res: Response, next: NextFunction): void => {
  req.startTime = Date.now();
  
  res.on('finish', () => {
    const duration = req.startTime ? Date.now() - req.startTime : 0;
    
    // Log slow requests
    const slowThreshold = parseInt(process.env.SLOW_REQUEST_THRESHOLD || '1000');
    if (duration > slowThreshold) {
      logger.warn('Slow Request:', {
        requestId: req.requestId,
        method: req.method,
        url: req.originalUrl,
        duration: `${duration}ms`,
        threshold: `${slowThreshold}ms`,
        statusCode: res.statusCode,
        ip: getClientIp(req),
        userId: req.user?.id,
        timestamp: new Date().toISOString()
      });
    }
  });
  
  next();
};

// Security event logger
export const securityLogger = {
  logAuthAttempt: (req: Request, success: boolean, userId?: string, reason?: string) => {
    logger.info('Authentication Attempt:', {
      type: 'auth_attempt',
      success,
      userId,
      reason,
      ip: getClientIp(req),
      userAgent: getUserAgent(req),
      timestamp: new Date().toISOString(),
      requestId: (req as ExtendedRequest).requestId
    });
  },

  logSecurityEvent: (req: Request, event: string, details: any) => {
    logger.warn('Security Event:', {
      type: 'security_event',
      event,
      details: sanitizeObject(details),
      ip: getClientIp(req),
      userAgent: getUserAgent(req),
      timestamp: new Date().toISOString(),
      requestId: (req as ExtendedRequest).requestId,
      userId: (req as any).user?.id
    });
  },

  logPrivilegeEscalation: (req: Request, action: string, targetUserId?: string) => {
    logger.warn('Privilege Escalation Attempt:', {
      type: 'privilege_escalation',
      action,
      targetUserId,
      actorId: (req as any).user?.id,
      ip: getClientIp(req),
      timestamp: new Date().toISOString(),
      requestId: (req as ExtendedRequest).requestId
    });
  }
};

// Audit logger for user actions
export const auditLogger = {
  logUserAction: (req: Request, action: string, targetResource: string, details: any = {}) => {
    logger.info('User Action:', {
      type: 'user_action',
      action,
      targetResource,
      details: sanitizeObject(details),
      userId: (req as any).user?.id,
      ip: getClientIp(req),
      userAgent: getUserAgent(req),
      timestamp: new Date().toISOString(),
      requestId: (req as ExtendedRequest).requestId
    });
  },

  logDataModification: (req: Request, operation: string, collection: string, documentId: string, changes: any = {}) => {
    logger.info('Data Modification:', {
      type: 'data_modification',
      operation,
      collection,
      documentId,
      changes: sanitizeObject(changes),
      userId: (req as any).user?.id,
      ip: getClientIp(req),
      timestamp: new Date().toISOString(),
      requestId: (req as ExtendedRequest).requestId
    });
  }
};
