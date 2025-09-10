import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload, TokenType, jwtService } from '../utils/jwt';
import { logger } from '../utils/logger';

// Extended request interface with user data
export interface AuthRequest extends Request {
  user?: JwtPayload;
  sessionId?: string;
  permissions?: string[];
}

// Role-based access control
export enum UserRole {
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  CUSTOMER = 'customer',
  VENDOR = 'vendor',
  GUEST = 'guest'
}

// Permission levels
export enum Permission {
  // User permissions
  USER_READ = 'user:read',
  USER_WRITE = 'user:write',
  USER_DELETE = 'user:delete',
  
  // Product permissions
  PRODUCT_READ = 'product:read',
  PRODUCT_WRITE = 'product:write',
  PRODUCT_DELETE = 'product:delete',
  
  // Order permissions
  ORDER_READ = 'order:read',
  ORDER_WRITE = 'order:write',
  ORDER_DELETE = 'order:delete',
  
  // Admin permissions
  ADMIN_READ = 'admin:read',
  ADMIN_WRITE = 'admin:write',
  ADMIN_DELETE = 'admin:delete',
  
  // System permissions
  SYSTEM_READ = 'system:read',
  SYSTEM_WRITE = 'system:write',
  SYSTEM_DELETE = 'system:delete'
}

// Role to permissions mapping
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: Object.values(Permission),
  [UserRole.MODERATOR]: [
    Permission.USER_READ,
    Permission.PRODUCT_READ,
    Permission.PRODUCT_WRITE,
    Permission.ORDER_READ,
    Permission.ORDER_WRITE,
    Permission.ADMIN_READ
  ],
  [UserRole.VENDOR]: [
    Permission.PRODUCT_READ,
    Permission.PRODUCT_WRITE,
    Permission.ORDER_READ,
    Permission.USER_READ
  ],
  [UserRole.CUSTOMER]: [
    Permission.USER_READ,
    Permission.USER_WRITE,
    Permission.PRODUCT_READ,
    Permission.ORDER_READ,
    Permission.ORDER_WRITE
  ],
  [UserRole.GUEST]: [
    Permission.PRODUCT_READ
  ]
};

// Authentication middleware
export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Authentication failed: No token provided', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        action: 'auth_no_token'
      });
      
      res.status(401).json({
        success: false,
        error: 'Access token required',
        code: 'AUTH_TOKEN_REQUIRED'
      });
      return;
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      logger.warn('Authentication failed: Empty token', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        action: 'auth_empty_token'
      });
      
      res.status(401).json({
        success: false,
        error: 'Access token required',
        code: 'AUTH_TOKEN_REQUIRED'
      });
      return;
    }

    // Verify the token
    const verificationResult = jwtService.verifyAccessToken(token);
    
    if (!verificationResult.valid || !verificationResult.payload) {
      logger.warn('Authentication failed: Invalid token', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        error: verificationResult.error,
        action: 'auth_invalid_token'
      });
      
      res.status(401).json({
        success: false,
        error: verificationResult.error || 'Invalid token',
        code: 'AUTH_INVALID_TOKEN'
      });
      return;
    }

    const decoded = verificationResult.payload;
    
    // Check if user is active
    if (decoded.isActive === false) {
      logger.warn('Authentication failed: Inactive user', {
        userId: decoded.id,
        email: decoded.email,
        ip: req.ip,
        action: 'auth_inactive_user'
      });
      
      res.status(401).json({
        success: false,
        error: 'Account is inactive',
        code: 'AUTH_INACTIVE_USER'
      });
      return;
    }

    // Set user data on request
    req.user = decoded;
    req.sessionId = decoded.sessionId;
    req.permissions = decoded.permissions || ROLE_PERMISSIONS[decoded.role as UserRole] || [];

    logger.debug('Authentication successful', {
      userId: decoded.id,
      email: decoded.email,
      role: decoded.role,
      ip: req.ip,
      action: 'auth_success'
    });

    next();
  } catch (error: any) {
    logger.error('Authentication error', {
      error: error.message,
      stack: error.stack,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      action: 'auth_error'
    });

    res.status(500).json({
      success: false,
      error: 'Authentication service error',
      code: 'AUTH_SERVICE_ERROR'
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuthMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without authentication
      next();
      return;
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      // Empty token, continue without authentication
      next();
      return;
    }

    // Try to verify the token
    const verificationResult = jwtService.verifyAccessToken(token);
    
    if (verificationResult.valid && verificationResult.payload) {
      const decoded = verificationResult.payload;
      
      // Only set user data if token is valid and user is active
      if (decoded.isActive !== false) {
        req.user = decoded;
        req.sessionId = decoded.sessionId;
        req.permissions = decoded.permissions || ROLE_PERMISSIONS[decoded.role as UserRole] || [];
        
        logger.debug('Optional authentication successful', {
          userId: decoded.id,
          email: decoded.email,
          role: decoded.role,
          ip: req.ip,
          action: 'optional_auth_success'
        });
      }
    }

    next();
  } catch (error: any) {
    logger.warn('Optional authentication error', {
      error: error.message,
      ip: req.ip,
      action: 'optional_auth_error'
    });
    
    // Continue without authentication on error
    next();
  }
};

// Role-based authorization middleware
export const requireRole = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      logger.warn('Authorization failed: No user data', {
        ip: req.ip,
        action: 'auth_no_user_data'
      });
      
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
      return;
    }

    if (!roles.includes(req.user.role as UserRole)) {
      logger.warn('Authorization failed: Insufficient role', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
        ip: req.ip,
        action: 'auth_insufficient_role'
      });
      
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        code: 'AUTH_INSUFFICIENT_ROLE'
      });
      return;
    }

    next();
  };
};

// Permission-based authorization middleware
export const requirePermission = (...permissions: Permission[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      logger.warn('Authorization failed: No user data', {
        ip: req.ip,
        action: 'auth_no_user_data'
      });
      
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
      return;
    }

    const userPermissions = req.permissions || ROLE_PERMISSIONS[req.user.role as UserRole] || [];
    const hasPermission = permissions.every(permission => userPermissions.includes(permission));

    if (!hasPermission) {
      logger.warn('Authorization failed: Insufficient permissions', {
        userId: req.user.id,
        userRole: req.user.role,
        userPermissions,
        requiredPermissions: permissions,
        ip: req.ip,
        action: 'auth_insufficient_permissions'
      });
      
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        code: 'AUTH_INSUFFICIENT_PERMISSIONS'
      });
      return;
    }

    next();
  };
};

// Admin middleware (backward compatibility)
export const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  return requireRole(UserRole.ADMIN, UserRole.MODERATOR)(req, res, next);
};

// Resource ownership middleware
export const requireOwnership = (resourceIdParam: string = 'id') => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      logger.warn('Authorization failed: No user data', {
        ip: req.ip,
        action: 'auth_no_user_data'
      });
      
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
      return;
    }

    // Admin and moderator can access any resource
    if (req.user.role === UserRole.ADMIN || req.user.role === UserRole.MODERATOR) {
      next();
      return;
    }

    const resourceId = req.params[resourceIdParam];
    
    if (!resourceId) {
      logger.warn('Authorization failed: No resource ID', {
        userId: req.user.id,
        resourceIdParam,
        ip: req.ip,
        action: 'auth_no_resource_id'
      });
      
      res.status(400).json({
        success: false,
        error: 'Resource ID required',
        code: 'AUTH_RESOURCE_ID_REQUIRED'
      });
      return;
    }

    // Check if user owns the resource
    if (resourceId !== req.user.id) {
      logger.warn('Authorization failed: Resource ownership', {
        userId: req.user.id,
        resourceId,
        ip: req.ip,
        action: 'auth_resource_ownership'
      });
      
      res.status(403).json({
        success: false,
        error: 'Access denied: Resource ownership required',
        code: 'AUTH_RESOURCE_OWNERSHIP'
      });
      return;
    }

    next();
  };
};

// Rate limiting middleware (basic implementation)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export const rateLimitMiddleware = (maxRequests: number = 100, windowMs: number = 900000) => { // 15 minutes default
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const key = req.user ? `user:${req.user.id}` : `ip:${req.ip}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean up expired entries
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetTime < now) {
        rateLimitStore.delete(k);
      }
    }

    const current = rateLimitStore.get(key);
    
    if (!current) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      next();
      return;
    }

    if (current.resetTime < now) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      next();
      return;
    }

    if (current.count >= maxRequests) {
      logger.warn('Rate limit exceeded', {
        key,
        count: current.count,
        maxRequests,
        windowMs,
        ip: req.ip,
        action: 'rate_limit_exceeded'
      });
      
      res.status(429).json({
        success: false,
        error: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((current.resetTime - now) / 1000)
      });
      return;
    }

    current.count++;
    next();
  };
};

// Session validation middleware
export const validateSession = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user || !req.sessionId) {
    next();
    return;
  }

  // In a real implementation, you would check the session in Redis
  // For now, we'll just log the session validation
  logger.debug('Session validation', {
    userId: req.user.id,
    sessionId: req.sessionId,
    action: 'session_validation'
  });

  next();
};

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Strict transport security (HTTPS only)
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  // Content security policy
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  
  next();
};

// Request logging middleware
export const requestLogging = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.info('HTTP Request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      action: 'http_request'
    });
  });
  
  next();
};