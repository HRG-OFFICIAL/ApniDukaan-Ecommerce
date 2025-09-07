import { Request, Response, NextFunction } from 'express';
import { jwtService, JWTPayload } from '../utils/jwt';
import { logger, logSecurityEvent } from '../utils/logger';
import { UserRole } from '../types/user';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      userId?: string;
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: JWTPayload;
  userId: string;
}

/**
 * Middleware to authenticate JWT tokens
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const token = extractTokenFromRequest(req);

    if (!token) {
      logSecurityEvent('MISSING_AUTH_TOKEN', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.originalUrl
      });
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'NO_TOKEN'
      });
      return;
    }

    try {
      const payload = jwtService.verifyAccessToken(token);
      req.user = payload;
      req.userId = payload.userId;
      
      logger.debug('User authenticated successfully', {
        userId: payload.userId,
        email: payload.email,
        role: payload.role
      });
      
      next();
    } catch (tokenError) {
      logSecurityEvent('INVALID_AUTH_TOKEN', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.originalUrl,
        error: tokenError.message
      });

      const errorCode = tokenError.message.includes('expired') ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN';
      res.status(401).json({
        success: false,
        error: tokenError.message,
        code: errorCode
      });
      return;
    }
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'AUTH_ERROR'
    });
    return;
  }
};

/**
 * Optional authentication middleware - doesn't fail if no token
 */
export const optionalAuthenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const token = extractTokenFromRequest(req);

    if (!token) {
      // No token provided, continue without authentication
      next();
      return;
    }

    try {
      const payload = jwtService.verifyAccessToken(token);
      req.user = payload;
      req.userId = payload.userId;
    } catch (tokenError) {
      // Invalid token, but continue without authentication
      logger.debug('Optional auth failed, continuing without authentication:', tokenError.message);
    }

    next();
  } catch (error) {
    logger.error('Optional authentication middleware error:', error);
    next(); // Continue even if there's an error
  }
};

/**
 * Middleware to authorize based on user roles
 */
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      logSecurityEvent('AUTHORIZATION_WITHOUT_AUTH', {
        ip: req.ip,
        url: req.originalUrl
      });
      res.status(401).json({
        success: false,
        error: 'Authentication required for this action',
        code: 'NOT_AUTHENTICATED'
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      logSecurityEvent('INSUFFICIENT_PERMISSIONS', {
        userId: req.user.userId,
        userRole: req.user.role,
        requiredRoles: allowedRoles,
        ip: req.ip,
        url: req.originalUrl
      });
      
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        code: 'FORBIDDEN'
      });
      return;
    }

    logger.debug('User authorized successfully', {
      userId: req.user.userId,
      role: req.user.role,
      allowedRoles
    });

    next();
  };
};

/**
 * Middleware to ensure user can only access their own resources
 */
export const authorizeOwnership = (userIdParam: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'NOT_AUTHENTICATED'
      });
      return;
    }

    const targetUserId = req.params[userIdParam] || req.body[userIdParam];
    
    // Admins can access any user's resources
    if (req.user.role === UserRole.ADMIN) {
      next();
      return;
    }

    if (req.user.userId !== targetUserId) {
      logSecurityEvent('UNAUTHORIZED_ACCESS_ATTEMPT', {
        userId: req.user.userId,
        attemptedUserId: targetUserId,
        ip: req.ip,
        url: req.originalUrl
      });

      res.status(403).json({
        success: false,
        error: 'Can only access your own resources',
        code: 'OWNERSHIP_REQUIRED'
      });
      return;
    }

    next();
  };
};

/**
 * Middleware to verify API keys for service-to-service communication
 */
export const authenticateService = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      logSecurityEvent('MISSING_API_KEY', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.originalUrl
      });
      res.status(401).json({
        success: false,
        error: 'API key required',
        code: 'NO_API_KEY'
      });
      return;
    }

    try {
      const payload = jwtService.verifyApiKey(apiKey);
      req.user = {
        userId: payload.serviceId,
        email: `${payload.serviceId}@service.local`,
        role: UserRole.ADMIN // Services have admin privileges
      } as JWTPayload;

      logger.debug('Service authenticated successfully', {
        serviceId: payload.serviceId,
        permissions: payload.permissions
      });

      next();
    } catch (keyError) {
      logSecurityEvent('INVALID_API_KEY', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.originalUrl,
        error: keyError.message
      });

      res.status(401).json({
        success: false,
        error: 'Invalid API key',
        code: 'INVALID_API_KEY'
      });
      return;
    }
  } catch (error) {
    logger.error('Service authentication middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'SERVICE_AUTH_ERROR'
    });
    return;
  }
};

/**
 * Rate limiting middleware for authentication endpoints
 */
export const authRateLimit = (windowMs: number = 15 * 60 * 1000, maxAttempts: number = 5) => {
  const attempts = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const clientId = req.ip || 'unknown';
    const now = Date.now();
    
    const clientAttempts = attempts.get(clientId);
    
    if (!clientAttempts || now > clientAttempts.resetTime) {
      // First attempt or window expired
      attempts.set(clientId, { count: 1, resetTime: now + windowMs });
      next();
      return;
    }

    if (clientAttempts.count >= maxAttempts) {
      logSecurityEvent('AUTH_RATE_LIMIT_EXCEEDED', {
        ip: req.ip,
        attempts: clientAttempts.count,
        url: req.originalUrl
      }, 'high');

      res.status(429).json({
        success: false,
        error: 'Too many authentication attempts',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((clientAttempts.resetTime - now) / 1000)
      });
      return;
    }

    // Increment attempts
    clientAttempts.count++;
    next();
  };
};

/**
 * Extract JWT token from request headers or cookies
 */
function extractTokenFromRequest(req: Request): string | null {
  // Check Authorization header (Bearer token)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check cookies (for browser requests)
  if (req.cookies && req.cookies.accessToken) {
    return req.cookies.accessToken;
  }

  // Check custom header
  if (req.headers['x-access-token']) {
    return req.headers['x-access-token'] as string;
  }

  return null;
}

/**
 * Middleware to handle refresh tokens
 */
export const handleRefreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      res.status(401).json({
        success: false,
        error: 'Refresh token required',
        code: 'NO_REFRESH_TOKEN'
      });
      return;
    }

    try {
      const payload = jwtService.verifyRefreshToken(refreshToken);
      req.body.refreshTokenPayload = payload;
      next();
    } catch (error) {
      logSecurityEvent('INVALID_REFRESH_TOKEN', {
        ip: req.ip,
        error: error.message
      });

      res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
      return;
    }
  } catch (error) {
    logger.error('Refresh token middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'REFRESH_TOKEN_ERROR'
    });
    return;
  }
};

/**
 * Clean expired rate limit entries periodically
 */
setInterval(() => {
  // This would be implemented per service instance
  // In a real app, you'd use Redis for distributed rate limiting
}, 60 * 60 * 1000); // Clean every hour
