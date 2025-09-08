"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleRefreshToken = exports.authRateLimit = exports.authenticateService = exports.authorizeOwnership = exports.authorize = exports.optionalAuthenticate = exports.authenticate = void 0;
const jwt_1 = require("../utils/jwt");
const logger_1 = require("../utils/logger");
const user_1 = require("../types/user");
const authenticate = (req, res, next) => {
    try {
        const token = extractTokenFromRequest(req);
        if (!token) {
            (0, logger_1.logSecurityEvent)('MISSING_AUTH_TOKEN', {
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
            const payload = jwt_1.jwtService.verifyAccessToken(token);
            req.user = payload;
            req.userId = payload.userId;
            logger_1.logger.debug('User authenticated successfully', {
                userId: payload.userId,
                email: payload.email,
                role: payload.role
            });
            next();
        }
        catch (tokenError) {
            (0, logger_1.logSecurityEvent)('INVALID_AUTH_TOKEN', {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                url: req.originalUrl,
                error: tokenError?.message || 'Unknown token error'
            });
            const errorCode = tokenError?.message?.includes('expired') ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN';
            res.status(401).json({
                success: false,
                error: tokenError?.message || 'Authentication failed',
                code: errorCode
            });
            return;
        }
    }
    catch (error) {
        logger_1.logger.error('Authentication middleware error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            code: 'AUTH_ERROR'
        });
        return;
    }
};
exports.authenticate = authenticate;
const optionalAuthenticate = (req, res, next) => {
    try {
        const token = extractTokenFromRequest(req);
        if (!token) {
            next();
            return;
        }
        try {
            const payload = jwt_1.jwtService.verifyAccessToken(token);
            req.user = payload;
            req.userId = payload.userId;
        }
        catch (tokenError) {
            logger_1.logger.debug('Optional auth failed, continuing without authentication:', tokenError?.message || 'Unknown error');
        }
        next();
    }
    catch (error) {
        logger_1.logger.error('Optional authentication middleware error:', error);
        next();
    }
};
exports.optionalAuthenticate = optionalAuthenticate;
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            (0, logger_1.logSecurityEvent)('AUTHORIZATION_WITHOUT_AUTH', {
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
            (0, logger_1.logSecurityEvent)('INSUFFICIENT_PERMISSIONS', {
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
        logger_1.logger.debug('User authorized successfully', {
            userId: req.user.userId,
            role: req.user.role,
            allowedRoles
        });
        next();
    };
};
exports.authorize = authorize;
const authorizeOwnership = (userIdParam = 'userId') => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Authentication required',
                code: 'NOT_AUTHENTICATED'
            });
            return;
        }
        const targetUserId = req.params[userIdParam] || req.body[userIdParam];
        if (req.user.role === user_1.UserRole.ADMIN) {
            next();
            return;
        }
        if (req.user.userId !== targetUserId) {
            (0, logger_1.logSecurityEvent)('UNAUTHORIZED_ACCESS_ATTEMPT', {
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
exports.authorizeOwnership = authorizeOwnership;
const authenticateService = (req, res, next) => {
    try {
        const apiKey = req.headers['x-api-key'];
        if (!apiKey) {
            (0, logger_1.logSecurityEvent)('MISSING_API_KEY', {
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
            const payload = jwt_1.jwtService.verifyApiKey(apiKey);
            req.user = {
                userId: payload.serviceId,
                email: `${payload.serviceId}@service.local`,
                role: user_1.UserRole.ADMIN
            };
            logger_1.logger.debug('Service authenticated successfully', {
                serviceId: payload.serviceId,
                permissions: payload.permissions
            });
            next();
        }
        catch (keyError) {
            (0, logger_1.logSecurityEvent)('INVALID_API_KEY', {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                url: req.originalUrl,
                error: keyError?.message || 'API key verification failed'
            });
            res.status(401).json({
                success: false,
                error: 'Invalid API key',
                code: 'INVALID_API_KEY'
            });
            return;
        }
    }
    catch (error) {
        logger_1.logger.error('Service authentication middleware error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            code: 'SERVICE_AUTH_ERROR'
        });
        return;
    }
};
exports.authenticateService = authenticateService;
const authRateLimit = (windowMs = 15 * 60 * 1000, maxAttempts = 5) => {
    const attempts = new Map();
    return (req, res, next) => {
        const clientId = req.ip || 'unknown';
        const now = Date.now();
        const clientAttempts = attempts.get(clientId);
        if (!clientAttempts || now > clientAttempts.resetTime) {
            attempts.set(clientId, { count: 1, resetTime: now + windowMs });
            next();
            return;
        }
        if (clientAttempts.count >= maxAttempts) {
            (0, logger_1.logSecurityEvent)('AUTH_RATE_LIMIT_EXCEEDED', {
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
        clientAttempts.count++;
        next();
    };
};
exports.authRateLimit = authRateLimit;
function extractTokenFromRequest(req) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }
    if (req.cookies && req.cookies.accessToken) {
        return req.cookies.accessToken;
    }
    if (req.headers['x-access-token']) {
        return req.headers['x-access-token'];
    }
    return null;
}
const handleRefreshToken = async (req, res, next) => {
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
            const payload = jwt_1.jwtService.verifyRefreshToken(refreshToken);
            req.body.refreshTokenPayload = payload;
            next();
        }
        catch (error) {
            (0, logger_1.logSecurityEvent)('INVALID_REFRESH_TOKEN', {
                ip: req.ip,
                error: error?.message || 'Refresh token verification failed'
            });
            res.status(401).json({
                success: false,
                error: 'Invalid refresh token',
                code: 'INVALID_REFRESH_TOKEN'
            });
            return;
        }
    }
    catch (error) {
        logger_1.logger.error('Refresh token middleware error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            code: 'REFRESH_TOKEN_ERROR'
        });
        return;
    }
};
exports.handleRefreshToken = handleRefreshToken;
setInterval(() => {
}, 60 * 60 * 1000);
//# sourceMappingURL=auth.js.map