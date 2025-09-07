// Export all types
export * from './types/user';
export * from './types/product';
export * from './types/order';
export * from './types/payment';

// Export utilities
export * from './utils/database';
export * from './utils/redis';
export * from './utils/logger';
export * from './utils/jwt';

// Export middleware
export * from './middleware/auth';

// Re-export commonly used interfaces and enums for convenience
export type {
  IUser,
  IProfile,
  IAddress,
  IWishlist,
  CreateUserInput,
  LoginInput,
  AuthPayload
} from './types/user';

export {
  UserRole,
  Gender,
  AddressType
} from './types/user';

export type {
  IProduct,
  ICategory,
  IReview,
  CreateProductInput,
  ProductFilters
} from './types/product';

export {
  ProductStatus,
  ProductVisibility,
  ProductOptionType
} from './types/product';

export type {
  IOrder,
  ICart,
  IOrderItem,
  ICartItem,
  CreateOrderInput,
  AddToCartInput
} from './types/order';

export {
  OrderStatus,
  PaymentStatus,
  FulfillmentStatus,
  DiscountType
} from './types/order';

export type {
  IPayment,
  IPaymentMethod,
  ITransaction,
  CreatePaymentInput,
  ProcessRefundInput
} from './types/payment';

export {
  PaymentMethod,
  PaymentProvider,
  PaymentStatus as PaymentTransactionStatus,
  RefundStatus,
  RefundReason
} from './types/payment';

// Common error classes
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(resource: string, identifier?: string) {
    super(`${resource}${identifier ? ` with id ${identifier}` : ''} not found`);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string = 'Unauthorized access') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor(message: string = 'Forbidden access') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends Error {
  constructor(message: string = 'Resource conflict') {
    super(message);
    this.name = 'ConflictError';
  }
}

export class InternalServerError extends Error {
  constructor(message: string = 'Internal server error') {
    super(message);
    this.name = 'InternalServerError';
  }
}

// Common constants
export const CONSTANTS = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEFAULT_CACHE_TTL: 3600, // 1 hour in seconds
  JWT_ACCESS_TOKEN_EXPIRY: '15m',
  JWT_REFRESH_TOKEN_EXPIRY: '7d',
  PASSWORD_RESET_TOKEN_EXPIRY: '1h',
  EMAIL_VERIFICATION_TOKEN_EXPIRY: '24h',
  SESSION_TIMEOUT: 86400, // 24 hours in seconds
  MAX_LOGIN_ATTEMPTS: 5,
  RATE_LIMIT_WINDOW: 900000, // 15 minutes in ms
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  MAX_IMAGE_SIZE: 5242880, // 5MB in bytes
  DEFAULT_CURRENCY: 'USD',
  MIN_PASSWORD_LENGTH: 8,
  MAX_SEARCH_RESULTS: 1000
} as const;

// Helper functions
export const createSuccessResponse = <T = any>(data: T, message?: string) => ({
  success: true,
  data,
  message
});

export const createErrorResponse = (error: string, code?: string, details?: any) => ({
  success: false,
  error,
  code,
  details
});

export const createPaginationResponse = <T = any>(
  items: T[],
  page: number,
  limit: number,
  total: number,
  message?: string
) => ({
  success: true,
  data: {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    }
  },
  message
});

// Validation helpers
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPassword = (password: string): boolean => {
  return password.length >= CONSTANTS.MIN_PASSWORD_LENGTH;
};

export const isValidMongoId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

export const sanitizeSearchTerm = (term: string): string => {
  return term.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Date helpers
export const formatDate = (date: Date): string => {
  return date.toISOString();
};

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const isDateInPast = (date: Date): boolean => {
  return date < new Date();
};

// Price helpers
export const formatPrice = (amount: number, currency: string = CONSTANTS.DEFAULT_CURRENCY): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount / 100); // Assuming prices are stored in cents
};

export const calculateTax = (amount: number, taxRate: number): number => {
  return Math.round(amount * taxRate);
};

export const calculateDiscount = (amount: number, discountPercent: number): number => {
  return Math.round(amount * (discountPercent / 100));
};
