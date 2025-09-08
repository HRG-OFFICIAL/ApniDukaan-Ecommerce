"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractUserId = exports.isExpired = exports.verifyRefreshToken = exports.verifyToken = exports.generateTokens = exports.jwtService = exports.JWTService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = require("./logger");
class JWTService {
    constructor() {
        this.accessTokenSecret = process.env.JWT_ACCESS_SECRET || 'access_secret_key_change_in_production';
        this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET || 'refresh_secret_key_change_in_production';
        this.accessTokenExpiry = (process.env.JWT_ACCESS_EXPIRY || '15m');
        this.refreshTokenExpiry = (process.env.JWT_REFRESH_EXPIRY || '7d');
        if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
            logger_1.logger.warn('JWT secrets not set in environment variables. Using defaults (not secure for production)');
        }
    }
    /**
     * Generate access token from user data
     */
    generateAccessToken(user) {
        const payload = {
            userId: 'userId' in user ? user.userId : user._id?.toString() || user.id,
            email: user.email,
            role: user.role
        };
        try {
            const options = {
                expiresIn: this.accessTokenExpiry,
                issuer: 'shopsphere',
                audience: 'shopsphere-client'
            };
            return jsonwebtoken_1.default.sign(payload, this.accessTokenSecret, options);
        }
        catch (error) {
            logger_1.logger.error('Error generating access token:', error);
            throw new Error('Failed to generate access token');
        }
    }
    /**
     * Generate refresh token
     */
    generateRefreshToken(userId, tokenVersion = 0) {
        const payload = {
            userId,
            tokenVersion
        };
        try {
            const options = {
                expiresIn: this.refreshTokenExpiry,
                issuer: 'shopsphere',
                audience: 'shopsphere-refresh'
            };
            return jsonwebtoken_1.default.sign(payload, this.refreshTokenSecret, options);
        }
        catch (error) {
            logger_1.logger.error('Error generating refresh token:', error);
            throw new Error('Failed to generate refresh token');
        }
    }
    /**
     * Generate both access and refresh tokens
     */
    generateTokenPair(user, tokenVersion = 0) {
        const userId = 'userId' in user ? user.userId : user._id?.toString() || user.id;
        return {
            accessToken: this.generateAccessToken(user),
            refreshToken: this.generateRefreshToken(userId, tokenVersion)
        };
    }
    /**
     * Verify access token and return payload
     */
    verifyAccessToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, this.accessTokenSecret, {
                issuer: 'shopsphere',
                audience: 'shopsphere-client'
            });
            return decoded;
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                throw new Error('Access token expired');
            }
            else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                throw new Error('Invalid access token');
            }
            else {
                logger_1.logger.error('Error verifying access token:', error);
                throw new Error('Token verification failed');
            }
        }
    }
    /**
     * Verify refresh token and return payload
     */
    verifyRefreshToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, this.refreshTokenSecret, {
                issuer: 'shopsphere',
                audience: 'shopsphere-refresh'
            });
            return decoded;
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                throw new Error('Refresh token expired');
            }
            else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                throw new Error('Invalid refresh token');
            }
            else {
                logger_1.logger.error('Error verifying refresh token:', error);
                throw new Error('Token verification failed');
            }
        }
    }
    /**
     * Decode token without verification (useful for expired tokens)
     */
    decodeToken(token) {
        try {
            return jsonwebtoken_1.default.decode(token);
        }
        catch (error) {
            logger_1.logger.error('Error decoding token:', error);
            return null;
        }
    }
    /**
     * Check if token is expired without verification
     */
    isTokenExpired(token) {
        try {
            const decoded = this.decodeToken(token);
            if (!decoded || !decoded.exp) {
                return true;
            }
            const currentTime = Math.floor(Date.now() / 1000);
            return decoded.exp < currentTime;
        }
        catch (error) {
            return true;
        }
    }
    /**
     * Get token expiration date
     */
    getTokenExpiration(token) {
        try {
            const decoded = this.decodeToken(token);
            if (!decoded || !decoded.exp) {
                return null;
            }
            return new Date(decoded.exp * 1000);
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Get remaining token lifetime in seconds
     */
    getTokenRemainingLife(token) {
        try {
            const decoded = this.decodeToken(token);
            if (!decoded || !decoded.exp) {
                return 0;
            }
            const currentTime = Math.floor(Date.now() / 1000);
            const remainingTime = decoded.exp - currentTime;
            return Math.max(0, remainingTime);
        }
        catch (error) {
            return 0;
        }
    }
    /**
     * Extract user ID from token without full verification
     */
    extractUserIdFromToken(token) {
        try {
            const decoded = this.decodeToken(token);
            return decoded?.userId || null;
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Generate API key for service-to-service communication
     */
    generateApiKey(serviceId, permissions = []) {
        const payload = {
            serviceId,
            permissions,
            type: 'api_key'
        };
        try {
            return jsonwebtoken_1.default.sign(payload, this.accessTokenSecret, {
                expiresIn: '1y', // Long-lived for API keys
                issuer: 'shopsphere',
                audience: 'shopsphere-services'
            });
        }
        catch (error) {
            logger_1.logger.error('Error generating API key:', error);
            throw new Error('Failed to generate API key');
        }
    }
    /**
     * Verify API key for service-to-service communication
     */
    verifyApiKey(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, this.accessTokenSecret, {
                issuer: 'shopsphere',
                audience: 'shopsphere-services'
            });
            return decoded;
        }
        catch (error) {
            logger_1.logger.error('Error verifying API key:', error);
            throw new Error('Invalid API key');
        }
    }
    /**
     * Generate password reset token
     */
    generatePasswordResetToken(userId, currentPassword) {
        const payload = {
            userId,
            type: 'password_reset',
            // Include hash of current password to invalidate token if password changes
            passwordHash: require('crypto').createHash('sha256').update(currentPassword).digest('hex').substring(0, 8)
        };
        try {
            return jsonwebtoken_1.default.sign(payload, this.accessTokenSecret, {
                expiresIn: '1h', // Short-lived for security
                issuer: 'shopsphere',
                audience: 'shopsphere-password-reset'
            });
        }
        catch (error) {
            logger_1.logger.error('Error generating password reset token:', error);
            throw new Error('Failed to generate password reset token');
        }
    }
    /**
     * Verify password reset token
     */
    verifyPasswordResetToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, this.accessTokenSecret, {
                issuer: 'shopsphere',
                audience: 'shopsphere-password-reset'
            });
            return decoded;
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                throw new Error('Password reset token expired');
            }
            else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                throw new Error('Invalid password reset token');
            }
            else {
                logger_1.logger.error('Error verifying password reset token:', error);
                throw new Error('Token verification failed');
            }
        }
    }
    /**
     * Generate email verification token
     */
    generateEmailVerificationToken(userId, email) {
        const payload = {
            userId,
            email,
            type: 'email_verification'
        };
        try {
            return jsonwebtoken_1.default.sign(payload, this.accessTokenSecret, {
                expiresIn: '24h',
                issuer: 'shopsphere',
                audience: 'shopsphere-email-verification'
            });
        }
        catch (error) {
            logger_1.logger.error('Error generating email verification token:', error);
            throw new Error('Failed to generate email verification token');
        }
    }
    /**
     * Verify email verification token
     */
    verifyEmailVerificationToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, this.accessTokenSecret, {
                issuer: 'shopsphere',
                audience: 'shopsphere-email-verification'
            });
            return decoded;
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                throw new Error('Email verification token expired');
            }
            else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                throw new Error('Invalid email verification token');
            }
            else {
                logger_1.logger.error('Error verifying email verification token:', error);
                throw new Error('Token verification failed');
            }
        }
    }
}
exports.JWTService = JWTService;
// Export singleton instance
exports.jwtService = new JWTService();
// Utility functions
const generateTokens = (user, tokenVersion) => {
    return exports.jwtService.generateTokenPair(user, tokenVersion);
};
exports.generateTokens = generateTokens;
const verifyToken = (token) => {
    return exports.jwtService.verifyAccessToken(token);
};
exports.verifyToken = verifyToken;
const verifyRefreshToken = (token) => {
    return exports.jwtService.verifyRefreshToken(token);
};
exports.verifyRefreshToken = verifyRefreshToken;
const isExpired = (token) => {
    return exports.jwtService.isTokenExpired(token);
};
exports.isExpired = isExpired;
const extractUserId = (token) => {
    return exports.jwtService.extractUserIdFromToken(token);
};
exports.extractUserId = extractUserId;
//# sourceMappingURL=jwt.js.map