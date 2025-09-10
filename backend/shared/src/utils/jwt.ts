import jwt, { JwtPayload as BaseJwtPayload, SignOptions, VerifyOptions, DecodeOptions } from 'jsonwebtoken';
import { logger } from './logger';

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production';
const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const JWT_ISSUER = process.env.JWT_ISSUER || 'apnidukaan-api';
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'apnidukaan-client';

// Token types
export enum TokenType {
  ACCESS = 'access',
  REFRESH = 'refresh',
  RESET_PASSWORD = 'reset_password',
  EMAIL_VERIFICATION = 'email_verification',
  API_KEY = 'api_key'
}

// Extended JWT payload interface
export interface JwtPayload extends BaseJwtPayload {
  id: string;
  email: string;
  role: string;
  type: TokenType;
  sessionId?: string;
  permissions?: string[];
  isActive?: boolean;
  lastLogin?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
}

// Token generation options
export type TokenOptions = SignOptions;


// Token verification result
export interface TokenVerificationResult {
  valid: boolean;
  payload?: JwtPayload;
  error?: string;
  expired?: boolean;
  malformed?: boolean;
}

// Token pair interface
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

// JWT Service class
export class JWTService {
  private accessSecret: string;
  private refreshSecret: string;
  private defaultOptions: SignOptions;

  constructor() {
    this.accessSecret = JWT_SECRET;
    this.refreshSecret = JWT_REFRESH_SECRET;
    this.defaultOptions = {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      algorithm: 'HS256' as any
    };
  }

  /**
   * Generate access token
   */
  generateAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp' | 'type'>, options?: TokenOptions): string {
    try {
      const tokenPayload: JwtPayload = {
        ...payload,
        type: TokenType.ACCESS,
        iat: Math.floor(Date.now() / 1000)
      } as JwtPayload;

      const signOptions: SignOptions = {
        ...this.defaultOptions,
        expiresIn: (options?.expiresIn || JWT_ACCESS_EXPIRES_IN) as any,
        ...options
      };

      const token = jwt.sign(tokenPayload, this.accessSecret, signOptions);
      
      logger.debug('Access token generated', {
        userId: payload.id,
        email: payload.email,
        role: payload.role,
        action: 'jwt_access_token_generated'
      });

      return token;
    } catch (error: any) {
      logger.error('Failed to generate access token', {
        error: error.message,
        userId: payload.id,
        action: 'jwt_access_token_generation_error'
      });
      throw error;
    }
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(payload: Omit<JwtPayload, 'iat' | 'exp' | 'type'>, options?: TokenOptions): string {
    try {
      const tokenPayload: JwtPayload = {
        ...payload,
        type: TokenType.REFRESH,
        iat: Math.floor(Date.now() / 1000)
      } as JwtPayload;

      const signOptions: SignOptions = {
        ...this.defaultOptions,
        expiresIn: (options?.expiresIn || JWT_REFRESH_EXPIRES_IN) as any,
        ...options
      };

      const token = jwt.sign(tokenPayload, this.refreshSecret, signOptions);
      
      logger.debug('Refresh token generated', {
        userId: payload.id,
        email: payload.email,
        action: 'jwt_refresh_token_generated'
      });

      return token;
    } catch (error: any) {
      logger.error('Failed to generate refresh token', {
        error: error.message,
        userId: payload.id,
        action: 'jwt_refresh_token_generation_error'
      });
      throw error;
    }
  }

  /**
   * Generate token pair (access + refresh)
   */
  generateTokenPair(payload: Omit<JwtPayload, 'iat' | 'exp' | 'type'>, options?: TokenOptions): TokenPair {
    try {
      const accessToken = this.generateAccessToken(payload, options);
      const refreshToken = this.generateRefreshToken(payload, options);
      
      // Calculate expiration time
      const decoded = this.decodeToken(accessToken);
      const expiresIn = decoded ? (decoded.exp! - decoded.iat!) : 900; // Default 15 minutes

      logger.info('Token pair generated', {
        userId: payload.id,
        email: payload.email,
        role: payload.role,
        action: 'jwt_token_pair_generated'
      });

      return {
        accessToken,
        refreshToken,
        expiresIn,
        tokenType: 'Bearer'
      };
    } catch (error: any) {
      logger.error('Failed to generate token pair', {
        error: error.message,
        userId: payload.id,
        action: 'jwt_token_pair_generation_error'
      });
      throw error;
    }
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token: string, options?: VerifyOptions): TokenVerificationResult {
    try {
      const verifyOptions: VerifyOptions = {
        ...this.defaultOptions,
        ...options,
        audience: this.defaultOptions.audience as any
      };

      const payload = jwt.verify(token, this.accessSecret, verifyOptions) as JwtPayload;
      
      if (payload.type !== TokenType.ACCESS) {
        return {
          valid: false,
          error: 'Invalid token type',
          malformed: true
        };
      }

      logger.debug('Access token verified', {
        userId: payload.id,
        email: payload.email,
        action: 'jwt_access_token_verified'
      });

      return {
        valid: true,
        payload
      };
    } catch (error: any) {
      logger.warn('Access token verification failed', {
        error: error.message,
        action: 'jwt_access_token_verification_failed'
      });

      if (error.name === 'TokenExpiredError') {
        return {
          valid: false,
          error: 'Token expired',
          expired: true
        };
      }

      if (error.name === 'JsonWebTokenError') {
        return {
          valid: false,
          error: 'Invalid token',
          malformed: true
        };
      }

      return {
        valid: false,
        error: error.message
      };
    }
  }

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token: string, options?: VerifyOptions): TokenVerificationResult {
    try {
      const verifyOptions: VerifyOptions = {
        ...this.defaultOptions,
        ...options,
        audience: this.defaultOptions.audience as any
      };

      const payload = jwt.verify(token, this.refreshSecret, verifyOptions) as JwtPayload;
      
      if (payload.type !== TokenType.REFRESH) {
        return {
          valid: false,
          error: 'Invalid token type',
          malformed: true
        };
      }

      logger.debug('Refresh token verified', {
        userId: payload.id,
        email: payload.email,
        action: 'jwt_refresh_token_verified'
      });

      return {
        valid: true,
        payload
      };
    } catch (error: any) {
      logger.warn('Refresh token verification failed', {
        error: error.message,
        action: 'jwt_refresh_token_verification_failed'
      });

      if (error.name === 'TokenExpiredError') {
        return {
          valid: false,
          error: 'Token expired',
          expired: true
        };
      }

      if (error.name === 'JsonWebTokenError') {
        return {
          valid: false,
          error: 'Invalid token',
          malformed: true
        };
      }

      return {
        valid: false,
        error: error.message
      };
    }
  }

  /**
   * Verify any token (auto-detect type)
   */
  verifyToken(token: string, options?: VerifyOptions): TokenVerificationResult {
    try {
      // Try access token first
      const accessResult = this.verifyAccessToken(token, options);
      if (accessResult.valid) {
        return accessResult;
      }

      // Try refresh token
      const refreshResult = this.verifyRefreshToken(token, options);
      if (refreshResult.valid) {
        return refreshResult;
      }

      return {
        valid: false,
        error: 'Token verification failed'
      };
    } catch (error: any) {
      logger.error('Token verification error', {
        error: error.message,
        action: 'jwt_token_verification_error'
      });

      return {
        valid: false,
        error: error.message
      };
    }
  }

  /**
   * Decode token without verification
   */
  decodeToken(token: string, options?: DecodeOptions): JwtPayload | null {
    try {
      const payload = jwt.decode(token, options) as JwtPayload;
      return payload;
    } catch (error: any) {
      logger.warn('Token decode failed', {
        error: error.message,
        action: 'jwt_token_decode_failed'
      });
      return null;
    }
  }

  /**
   * Get token expiration time
   */
  getTokenExpiration(token: string): Date | null {
    try {
      const payload = this.decodeToken(token);
      if (payload && payload.exp) {
        return new Date(payload.exp * 1000);
      }
      return null;
    } catch (error: any) {
      logger.warn('Failed to get token expiration', {
        error: error.message,
        action: 'jwt_token_expiration_error'
      });
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token: string): boolean {
    try {
      const expiration = this.getTokenExpiration(token);
      if (!expiration) {
        return true;
      }
      return expiration < new Date();
    } catch (error: any) {
      logger.warn('Failed to check token expiration', {
        error: error.message,
        action: 'jwt_token_expiration_check_error'
      });
      return true;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  refreshAccessToken(refreshToken: string, options?: TokenOptions): TokenPair | null {
    try {
      const refreshResult = this.verifyRefreshToken(refreshToken);
      
      if (!refreshResult.valid || !refreshResult.payload) {
        logger.warn('Invalid refresh token provided', {
          action: 'jwt_refresh_access_token_invalid_refresh'
        });
        return null;
      }

      const { id, email, role, sessionId, permissions, isActive, lastLogin, ipAddress, userAgent, deviceId } = refreshResult.payload;
      
      const newTokenPair = this.generateTokenPair({
        id,
        email,
        role,
        sessionId,
        permissions,
        isActive,
        lastLogin,
        ipAddress,
        userAgent,
        deviceId
      }, options);

      logger.info('Access token refreshed', {
        userId: id,
        email,
        action: 'jwt_access_token_refreshed'
      });

      return newTokenPair;
    } catch (error: any) {
      logger.error('Failed to refresh access token', {
        error: error.message,
        action: 'jwt_refresh_access_token_error'
      });
      return null;
    }
  }

  /**
   * Blacklist token (in a real implementation, you'd store this in Redis)
   */
  blacklistToken(token: string, reason: string = 'logout'): void {
    try {
      const payload = this.decodeToken(token);
      if (payload) {
        logger.info('Token blacklisted', {
          userId: payload.id,
          reason,
          action: 'jwt_token_blacklisted'
        });
        // In a real implementation, you would store the token in a blacklist (Redis)
        // and check against it during verification
      }
    } catch (error: any) {
      logger.error('Failed to blacklist token', {
        error: error.message,
        action: 'jwt_token_blacklist_error'
      });
    }
  }
}

// Create singleton instance
export const jwtService = new JWTService();

// Legacy functions for backward compatibility
export const generateAccessToken = (payload: Omit<JwtPayload, 'iat' | 'exp' | 'type'>): string => {
  return jwtService.generateAccessToken(payload);
};

export const generateRefreshToken = (payload: Omit<JwtPayload, 'iat' | 'exp' | 'type'>): string => {
  return jwtService.generateRefreshToken(payload);
};

export const verifyToken = (token: string): JwtPayload => {
  const result = jwtService.verifyToken(token);
  if (!result.valid || !result.payload) {
    throw new Error(result.error || 'Token verification failed');
  }
  return result.payload;
};

export const decodeToken = (token: string): JwtPayload | null => {
  return jwtService.decodeToken(token);
};

// Export the service as default
export default jwtService;
