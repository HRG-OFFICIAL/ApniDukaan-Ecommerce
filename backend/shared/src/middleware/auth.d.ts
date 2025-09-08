import { Request, Response, NextFunction } from 'express';
import { JWTPayload } from '../utils/jwt';
import { UserRole } from '../types/user';
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
export declare const authenticate: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Optional authentication middleware - doesn't fail if no token
 */
export declare const optionalAuthenticate: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware to authorize based on user roles
 */
export declare const authorize: (...allowedRoles: UserRole[]) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware to ensure user can only access their own resources
 */
export declare const authorizeOwnership: (userIdParam?: string) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware to verify API keys for service-to-service communication
 */
export declare const authenticateService: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Rate limiting middleware for authentication endpoints
 */
export declare const authRateLimit: (windowMs?: number, maxAttempts?: number) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware to handle refresh tokens
 */
export declare const handleRefreshToken: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.d.ts.map