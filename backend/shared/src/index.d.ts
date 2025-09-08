export * from './types/user';
export * from './types/product';
export * from './types/order';
export * from './types/payment';
export * from './utils/database';
export * from './utils/redis';
export * from './utils/logger';
export * from './utils/jwt';
export * from './middleware/auth';
export type { IUser, IProfile, IAddress, IWishlist, CreateUserInput, LoginInput, AuthPayload } from './types/user';
export { UserRole, Gender, AddressType } from './types/user';
export type { IProduct, ICategory, IReview, CreateProductInput, ProductFilters } from './types/product';
export { ProductStatus, ProductVisibility, ProductOptionType } from './types/product';
export type { IOrder, ICart, IOrderItem, ICartItem, CreateOrderInput, AddToCartInput } from './types/order';
export { OrderStatus, PaymentStatus, FulfillmentStatus, DiscountType } from './types/order';
export type { IPayment, IPaymentMethod, ITransaction, CreatePaymentInput, ProcessRefundInput } from './types/payment';
export { PaymentMethod, PaymentProvider, PaymentStatus as PaymentTransactionStatus, RefundStatus, RefundReason } from './types/payment';
export declare class ValidationError extends Error {
    field?: string | undefined;
    constructor(message: string, field?: string | undefined);
}
export declare class NotFoundError extends Error {
    constructor(resource: string, identifier?: string);
}
export declare class UnauthorizedError extends Error {
    constructor(message?: string);
}
export declare class ForbiddenError extends Error {
    constructor(message?: string);
}
export declare class ConflictError extends Error {
    constructor(message?: string);
}
export declare class InternalServerError extends Error {
    constructor(message?: string);
}
export declare const CONSTANTS: {
    readonly DEFAULT_PAGE_SIZE: 20;
    readonly MAX_PAGE_SIZE: 100;
    readonly DEFAULT_CACHE_TTL: 3600;
    readonly JWT_ACCESS_TOKEN_EXPIRY: "15m";
    readonly JWT_REFRESH_TOKEN_EXPIRY: "7d";
    readonly PASSWORD_RESET_TOKEN_EXPIRY: "1h";
    readonly EMAIL_VERIFICATION_TOKEN_EXPIRY: "24h";
    readonly SESSION_TIMEOUT: 86400;
    readonly MAX_LOGIN_ATTEMPTS: 5;
    readonly RATE_LIMIT_WINDOW: 900000;
    readonly SUPPORTED_IMAGE_TYPES: readonly ["image/jpeg", "image/png", "image/webp"];
    readonly MAX_IMAGE_SIZE: 5242880;
    readonly DEFAULT_CURRENCY: "USD";
    readonly MIN_PASSWORD_LENGTH: 8;
    readonly MAX_SEARCH_RESULTS: 1000;
};
export declare const createSuccessResponse: <T = any>(data: T, message?: string) => {
    success: boolean;
    data: T;
    message: string | undefined;
};
export declare const createErrorResponse: (error: string, code?: string, details?: any) => {
    success: boolean;
    error: string;
    code: string | undefined;
    details: any;
};
export declare const createPaginationResponse: <T = any>(items: T[], page: number, limit: number, total: number, message?: string) => {
    success: boolean;
    data: {
        items: T[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
    };
    message: string | undefined;
};
export declare const isValidEmail: (email: string) => boolean;
export declare const isValidPassword: (password: string) => boolean;
export declare const isValidMongoId: (id: string) => boolean;
export declare const sanitizeSearchTerm: (term: string) => string;
export declare const formatDate: (date: Date) => string;
export declare const addDays: (date: Date, days: number) => Date;
export declare const isDateInPast: (date: Date) => boolean;
export declare const formatPrice: (amount: number, currency?: string) => string;
export declare const calculateTax: (amount: number, taxRate: number) => number;
export declare const calculateDiscount: (amount: number, discountPercent: number) => number;
//# sourceMappingURL=index.d.ts.map