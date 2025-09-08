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
    generateAccessToken(user: IUser | JWTPayload): string;
    generateRefreshToken(userId: string, tokenVersion?: number): string;
    generateTokenPair(user: IUser | JWTPayload, tokenVersion?: number): TokenPair;
    verifyAccessToken(token: string): JWTPayload;
    verifyRefreshToken(token: string): RefreshTokenPayload;
    decodeToken(token: string): any;
    isTokenExpired(token: string): boolean;
    getTokenExpiration(token: string): Date | null;
    getTokenRemainingLife(token: string): number;
    extractUserIdFromToken(token: string): string | null;
    generateApiKey(serviceId: string, permissions?: string[]): string;
    verifyApiKey(token: string): any;
    generatePasswordResetToken(userId: string, currentPassword: string): string;
    verifyPasswordResetToken(token: string): any;
    generateEmailVerificationToken(userId: string, email: string): string;
    verifyEmailVerificationToken(token: string): any;
}
export declare const jwtService: JWTService;
export declare const generateTokens: (user: IUser, tokenVersion?: number) => TokenPair;
export declare const verifyToken: (token: string) => JWTPayload;
export declare const verifyRefreshToken: (token: string) => RefreshTokenPayload;
export declare const isExpired: (token: string) => boolean;
export declare const extractUserId: (token: string) => string | null;
//# sourceMappingURL=jwt.d.ts.map