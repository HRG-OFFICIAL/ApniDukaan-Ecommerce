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
export declare class JWTService {
    private accessTokenSecret;
    private refreshTokenSecret;
    private accessTokenExpiry;
    private refreshTokenExpiry;
    constructor();
    /**
     * Generate access token from user data
     */
    generateAccessToken(user: IUser | JWTPayload): string;
    /**
     * Generate refresh token
     */
    generateRefreshToken(userId: string, tokenVersion?: number): string;
    /**
     * Generate both access and refresh tokens
     */
    generateTokenPair(user: IUser | JWTPayload, tokenVersion?: number): TokenPair;
    /**
     * Verify access token and return payload
     */
    verifyAccessToken(token: string): JWTPayload;
    /**
     * Verify refresh token and return payload
     */
    verifyRefreshToken(token: string): RefreshTokenPayload;
    /**
     * Decode token without verification (useful for expired tokens)
     */
    decodeToken(token: string): any;
    /**
     * Check if token is expired without verification
     */
    isTokenExpired(token: string): boolean;
    /**
     * Get token expiration date
     */
    getTokenExpiration(token: string): Date | null;
    /**
     * Get remaining token lifetime in seconds
     */
    getTokenRemainingLife(token: string): number;
    /**
     * Extract user ID from token without full verification
     */
    extractUserIdFromToken(token: string): string | null;
    /**
     * Generate API key for service-to-service communication
     */
    generateApiKey(serviceId: string, permissions?: string[]): string;
    /**
     * Verify API key for service-to-service communication
     */
    verifyApiKey(token: string): any;
    /**
     * Generate password reset token
     */
    generatePasswordResetToken(userId: string, currentPassword: string): string;
    /**
     * Verify password reset token
     */
    verifyPasswordResetToken(token: string): any;
    /**
     * Generate email verification token
     */
    generateEmailVerificationToken(userId: string, email: string): string;
    /**
     * Verify email verification token
     */
    verifyEmailVerificationToken(token: string): any;
}
export declare const jwtService: JWTService;
export declare const generateTokens: (user: IUser, tokenVersion?: number) => TokenPair;
export declare const verifyToken: (token: string) => JWTPayload;
export declare const verifyRefreshToken: (token: string) => RefreshTokenPayload;
export declare const isExpired: (token: string) => boolean;
export declare const extractUserId: (token: string) => string | null;
//# sourceMappingURL=jwt.d.ts.map