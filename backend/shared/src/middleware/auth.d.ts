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
export declare const authenticate: (req: Request, res: Response, next: NextFunction) => void;
export declare const optionalAuthenticate: (req: Request, res: Response, next: NextFunction) => void;
export declare const authorize: (...allowedRoles: UserRole[]) => (req: Request, res: Response, next: NextFunction) => void;
export declare const authorizeOwnership: (userIdParam?: string) => (req: Request, res: Response, next: NextFunction) => void;
export declare const authenticateService: (req: Request, res: Response, next: NextFunction) => void;
export declare const authRateLimit: (windowMs?: number, maxAttempts?: number) => (req: Request, res: Response, next: NextFunction) => void;
export declare const handleRefreshToken: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.d.ts.map