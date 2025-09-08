import { Request, Response, NextFunction } from 'express';
import { ValidationError } from 'express-validator';
import { MongoError } from 'mongodb';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import multer from 'multer';

import { logger } from '../utils/logger';

// Custom error types
export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;
  public details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationAppError extends AppError {
  constructor(message: string, details?: ValidationError[]) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 409, 'CONFLICT', details);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

// Error response interface
interface ErrorResponse {
  success: false;
  error: string;
  code: string;
  details?: any;
  stack?: string;
  timestamp: string;
  requestId?: string;
  path?: string;
  method?: string;
}

// Development vs Production error details
const isDevelopment = process.env.NODE_ENV === 'development';

// Format error response
const formatErrorResponse = (
  err: any,
  req: Request,
  includeStack: boolean = false
): ErrorResponse => {
  const response: ErrorResponse = {
    success: false,
    error: err.message || 'Internal server error',
    code: err.code || 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id'] as string,
    path: req.path,
    method: req.method
  };

  if (err.details) {
    response.details = err.details;
  }

  if (includeStack && err.stack) {
    response.stack = err.stack;
  }

  return response;
};

// Handle different types of errors
const handleCastError = (err: any): AppError => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400, 'INVALID_ID');
};

const handleDuplicateFieldsDB = (err: MongoError): AppError => {
  const value = err.message.match(/(["'])(\\?.)*?\1/)?.[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new ConflictError(message, { field: value });
};

const handleValidationErrorDB = (err: any): AppError => {
  const errors = Object.values(err.errors).map((el: any) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new ValidationAppError(message, errors);
};

const handleJWTError = (): AppError => {
  return new AuthenticationError('Invalid token. Please log in again!');
};

const handleJWTExpiredError = (): AppError => {
  return new AuthenticationError('Your token has expired! Please log in again.');
};

const handleMulterError = (err: multer.MulterError): AppError => {
  switch (err.code) {
    case 'LIMIT_FILE_SIZE':
      return new AppError('File too large', 413, 'FILE_TOO_LARGE');
    case 'LIMIT_UNEXPECTED_FILE':
      return new AppError('Unexpected file field', 400, 'UNEXPECTED_FILE');
    case 'LIMIT_PART_COUNT':
      return new AppError('Too many parts', 400, 'TOO_MANY_PARTS');
    case 'LIMIT_FILE_COUNT':
      return new AppError('Too many files', 400, 'TOO_MANY_FILES');
    case 'LIMIT_FIELD_KEY':
      return new AppError('Field name too long', 400, 'FIELD_NAME_TOO_LONG');
    case 'LIMIT_FIELD_VALUE':
      return new AppError('Field value too long', 400, 'FIELD_VALUE_TOO_LONG');
    case 'LIMIT_FIELD_COUNT':
      return new AppError('Too many fields', 400, 'TOO_MANY_FIELDS');
    default:
      return new AppError('File upload error', 400, 'UPLOAD_ERROR');
  }
};

// Send error response to client
const sendErrorDev = (err: AppError, req: Request, res: Response) => {
  const errorResponse = formatErrorResponse(err, req, true);
  
  logger.error('Development Error:', {
    error: err,
    request: {
      method: req.method,
      url: req.originalUrl,
      headers: req.headers,
      body: req.body,
      params: req.params,
      query: req.query
    }
  });

  res.status(err.statusCode).json(errorResponse);
};

const sendErrorProd = (err: AppError, req: Request, res: Response) => {
  const errorResponse = formatErrorResponse(err, req);

  // Log error for monitoring
  logger.error('Production Error:', {
    message: err.message,
    code: err.code,
    statusCode: err.statusCode,
    path: req.path,
    method: req.method,
    userId: (req as any).user?.id,
    requestId: req.headers['x-request-id'],
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });

  // Only send error details to client if it's an operational error
  if (err.isOperational) {
    res.status(err.statusCode).json(errorResponse);
  } else {
    // Programming or other unknown error: don't leak error details
    logger.error('Unknown Error:', err);
    
    res.status(500).json({
      success: false,
      error: 'Something went wrong!',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string
    });
  }
};

// Main error handling middleware
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Set default error properties
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (isDevelopment) {
    sendErrorDev(err, req, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    // Handle specific error types
    if (err.name === 'CastError') error = handleCastError(error);
    if (err.code === 11000) error = handleDuplicateFieldsDB(error);
    if (err.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (err instanceof JsonWebTokenError) error = handleJWTError();
    if (err instanceof TokenExpiredError) error = handleJWTExpiredError();
    if (err instanceof multer.MulterError) error = handleMulterError(err);

    sendErrorProd(error, req, res);
  }
};

// Async error wrapper for route handlers
export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Global unhandled rejection handler
export const handleUnhandledRejection = () => {
  process.on('unhandledRejection', (err: Error, promise: Promise<any>) => {
    logger.error('Unhandled Rejection:', {
      error: err,
      promise: promise
    });
    
    // Close server & exit process
    process.exit(1);
  });
};

// Global uncaught exception handler
export const handleUncaughtException = () => {
  process.on('uncaughtException', (err: Error) => {
    logger.error('Uncaught Exception:', err);
    
    // Close server & exit process
    process.exit(1);
  });
};

// 404 handler for undefined routes
export const handleNotFound = (req: Request, res: Response, next: NextFunction) => {
  const err = new NotFoundError(`Can't find ${req.originalUrl} on this server!`);
  next(err);
};

// Request timeout handler
export const handleTimeout = (timeoutMs: number = 30000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const timeout = setTimeout(() => {
      const err = new AppError('Request timeout', 408, 'REQUEST_TIMEOUT');
      next(err);
    }, timeoutMs);

    res.on('finish', () => clearTimeout(timeout));
    res.on('close', () => clearTimeout(timeout));

    next();
  };
};

// Error logging middleware
export const logErrors = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log structured error information
  const errorInfo = {
    timestamp: new Date().toISOString(),
    level: 'error',
    message: err.message,
    stack: err.stack,
    statusCode: err.statusCode,
    code: err.code,
    request: {
      method: req.method,
      url: req.originalUrl,
      headers: {
        'user-agent': req.get('User-Agent'),
        'x-forwarded-for': req.get('X-Forwarded-For'),
        'x-real-ip': req.get('X-Real-IP'),
        authorization: req.get('Authorization') ? '[REDACTED]' : undefined
      },
      body: req.body,
      params: req.params,
      query: req.query,
      ip: req.ip
    },
    user: (req as any).user ? {
      id: (req as any).user.id,
      email: (req as any).user.email,
      roles: (req as any).user.roles
    } : undefined
  };

  logger.error('Request Error:', errorInfo);
  next(err);
};

// Initialize error handling
export const initializeErrorHandling = () => {
  handleUnhandledRejection();
  handleUncaughtException();
  
  logger.info('Error handling initialized');
};
