import jwt from 'jsonwebtoken';
import { logger } from './logger';
import { IUser, UserRole } from '../types/user';

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenVersion: number;
  iat?: number;
  exp?: number;
}

export class JWTService {
  private accessTokenSecret: string;
  private refreshTokenSecret: string;
  private accessTokenExpiry: string;
  private refreshTokenExpiry: string;

  constructor() {
    this.accessTokenSecret = process.env.JWT_ACCESS_SECRET || 'access_secret_key_change_in_production';
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET || 'refresh_secret_key_change_in_production';
    this.accessTokenExpiry = process.env.JWT_ACCESS_EXPIRY || '15m';
    this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRY || '7d';

    if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
      logger.warn('JWT secrets not set in environment variables. Using defaults (not secure for production)');
    }
  }

  /**
   * Generate access token from user data
   */
  generateAccessToken(user: IUser | JWTPayload): string {
    const payload: JWTPayload = {
      userId: user._id || user.userId,
      email: user.email,
      role: user.role
    };

    try {
      return jwt.sign(payload, this.accessTokenSecret, {
        expiresIn: this.accessTokenExpiry,
        issuer: 'shopsphere',
        audience: 'shopsphere-client'
      });
    } catch (error) {
      logger.error('Error generating access token:', error);
      throw new Error('Failed to generate access token');
    }
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(userId: string, tokenVersion: number = 0): string {
    const payload: RefreshTokenPayload = {
      userId,
      tokenVersion
    };

    try {
      return jwt.sign(payload, this.refreshTokenSecret, {
        expiresIn: this.refreshTokenExpiry,
        issuer: 'shopsphere',
        audience: 'shopsphere-refresh'
      });
    } catch (error) {
      logger.error('Error generating refresh token:', error);
      throw new Error('Failed to generate refresh token');
    }
  }

  /**
   * Generate both access and refresh tokens
   */
  generateTokenPair(user: IUser, tokenVersion: number = 0): TokenPair {
    return {
      accessToken: this.generateAccessToken(user),
      refreshToken: this.generateRefreshToken(user._id, tokenVersion)
    };
  }

  /**
   * Verify access token and return payload
   */
  verifyAccessToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret, {
        issuer: 'shopsphere',
        audience: 'shopsphere-client'
      }) as JWTPayload;

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Access token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid access token');
      } else {
        logger.error('Error verifying access token:', error);
        throw new Error('Token verification failed');
      }
    }
  }

  /**
   * Verify refresh token and return payload
   */
  verifyRefreshToken(token: string): RefreshTokenPayload {
    try {
      const decoded = jwt.verify(token, this.refreshTokenSecret, {
        issuer: 'shopsphere',
        audience: 'shopsphere-refresh'
      }) as RefreshTokenPayload;

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Refresh token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid refresh token');
      } else {
        logger.error('Error verifying refresh token:', error);
        throw new Error('Token verification failed');
      }
    }
  }

  /**
   * Decode token without verification (useful for expired tokens)
   */
  decodeToken(token: string): any {
    try {
      return jwt.decode(token);
    } catch (error) {
      logger.error('Error decoding token:', error);
      return null;
    }
  }

  /**
   * Check if token is expired without verification
   */
  isTokenExpired(token: string): boolean {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) {
        return true;
      }

      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  /**
   * Get token expiration date
   */
  getTokenExpiration(token: string): Date | null {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) {
        return null;
      }

      return new Date(decoded.exp * 1000);
    } catch (error) {
      return null;
    }
  }

  /**
   * Get remaining token lifetime in seconds
   */
  getTokenRemainingLife(token: string): number {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) {
        return 0;
      }

      const currentTime = Math.floor(Date.now() / 1000);
      const remainingTime = decoded.exp - currentTime;
      return Math.max(0, remainingTime);
    } catch (error) {
      return 0;
    }
  }

  /**
   * Extract user ID from token without full verification
   */
  extractUserIdFromToken(token: string): string | null {
    try {
      const decoded = this.decodeToken(token);
      return decoded?.userId || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Generate API key for service-to-service communication
   */
  generateApiKey(serviceId: string, permissions: string[] = []): string {
    const payload = {
      serviceId,
      permissions,
      type: 'api_key'
    };

    try {
      return jwt.sign(payload, this.accessTokenSecret, {
        expiresIn: '1y', // Long-lived for API keys
        issuer: 'shopsphere',
        audience: 'shopsphere-services'
      });
    } catch (error) {
      logger.error('Error generating API key:', error);
      throw new Error('Failed to generate API key');
    }
  }

  /**
   * Verify API key for service-to-service communication
   */
  verifyApiKey(token: string): any {
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret, {
        issuer: 'shopsphere',
        audience: 'shopsphere-services'
      });

      return decoded;
    } catch (error) {
      logger.error('Error verifying API key:', error);
      throw new Error('Invalid API key');
    }
  }

  /**
   * Generate password reset token
   */
  generatePasswordResetToken(userId: string, currentPassword: string): string {
    const payload = {
      userId,
      type: 'password_reset',
      // Include hash of current password to invalidate token if password changes
      passwordHash: require('crypto').createHash('sha256').update(currentPassword).digest('hex').substring(0, 8)
    };

    try {
      return jwt.sign(payload, this.accessTokenSecret, {
        expiresIn: '1h', // Short-lived for security
        issuer: 'shopsphere',
        audience: 'shopsphere-password-reset'
      });
    } catch (error) {
      logger.error('Error generating password reset token:', error);
      throw new Error('Failed to generate password reset token');
    }
  }

  /**
   * Verify password reset token
   */
  verifyPasswordResetToken(token: string): any {
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret, {
        issuer: 'shopsphere',
        audience: 'shopsphere-password-reset'
      });

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Password reset token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid password reset token');
      } else {
        logger.error('Error verifying password reset token:', error);
        throw new Error('Token verification failed');
      }
    }
  }

  /**
   * Generate email verification token
   */
  generateEmailVerificationToken(userId: string, email: string): string {
    const payload = {
      userId,
      email,
      type: 'email_verification'
    };

    try {
      return jwt.sign(payload, this.accessTokenSecret, {
        expiresIn: '24h',
        issuer: 'shopsphere',
        audience: 'shopsphere-email-verification'
      });
    } catch (error) {
      logger.error('Error generating email verification token:', error);
      throw new Error('Failed to generate email verification token');
    }
  }

  /**
   * Verify email verification token
   */
  verifyEmailVerificationToken(token: string): any {
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret, {
        issuer: 'shopsphere',
        audience: 'shopsphere-email-verification'
      });

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Email verification token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid email verification token');
      } else {
        logger.error('Error verifying email verification token:', error);
        throw new Error('Token verification failed');
      }
    }
  }
}

// Export singleton instance
export const jwtService = new JWTService();

// Utility functions
export const generateTokens = (user: IUser, tokenVersion?: number): TokenPair => {
  return jwtService.generateTokenPair(user, tokenVersion);
};

export const verifyToken = (token: string): JWTPayload => {
  return jwtService.verifyAccessToken(token);
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  return jwtService.verifyRefreshToken(token);
};

export const isExpired = (token: string): boolean => {
  return jwtService.isTokenExpired(token);
};

export const extractUserId = (token: string): string | null => {
  return jwtService.extractUserIdFromToken(token);
};
