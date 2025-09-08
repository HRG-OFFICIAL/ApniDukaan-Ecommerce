"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateDiscount = exports.calculateTax = exports.formatPrice = exports.isDateInPast = exports.addDays = exports.formatDate = exports.sanitizeSearchTerm = exports.isValidMongoId = exports.isValidPassword = exports.isValidEmail = exports.createPaginationResponse = exports.createErrorResponse = exports.createSuccessResponse = exports.CONSTANTS = exports.InternalServerError = exports.ConflictError = exports.ForbiddenError = exports.UnauthorizedError = exports.NotFoundError = exports.ValidationError = exports.RefundReason = exports.RefundStatus = exports.PaymentTransactionStatus = exports.PaymentProvider = exports.PaymentMethod = exports.DiscountType = exports.FulfillmentStatus = exports.PaymentStatus = exports.OrderStatus = exports.ProductOptionType = exports.ProductVisibility = exports.ProductStatus = exports.AddressType = exports.Gender = exports.UserRole = void 0;
__exportStar(require("./types/user"), exports);
__exportStar(require("./types/product"), exports);
__exportStar(require("./types/order"), exports);
__exportStar(require("./types/payment"), exports);
__exportStar(require("./utils/database"), exports);
__exportStar(require("./utils/redis"), exports);
__exportStar(require("./utils/logger"), exports);
__exportStar(require("./utils/jwt"), exports);
__exportStar(require("./middleware/auth"), exports);
var user_1 = require("./types/user");
Object.defineProperty(exports, "UserRole", { enumerable: true, get: function () { return user_1.UserRole; } });
Object.defineProperty(exports, "Gender", { enumerable: true, get: function () { return user_1.Gender; } });
Object.defineProperty(exports, "AddressType", { enumerable: true, get: function () { return user_1.AddressType; } });
var product_1 = require("./types/product");
Object.defineProperty(exports, "ProductStatus", { enumerable: true, get: function () { return product_1.ProductStatus; } });
Object.defineProperty(exports, "ProductVisibility", { enumerable: true, get: function () { return product_1.ProductVisibility; } });
Object.defineProperty(exports, "ProductOptionType", { enumerable: true, get: function () { return product_1.ProductOptionType; } });
var order_1 = require("./types/order");
Object.defineProperty(exports, "OrderStatus", { enumerable: true, get: function () { return order_1.OrderStatus; } });
Object.defineProperty(exports, "PaymentStatus", { enumerable: true, get: function () { return order_1.PaymentStatus; } });
Object.defineProperty(exports, "FulfillmentStatus", { enumerable: true, get: function () { return order_1.FulfillmentStatus; } });
Object.defineProperty(exports, "DiscountType", { enumerable: true, get: function () { return order_1.DiscountType; } });
var payment_1 = require("./types/payment");
Object.defineProperty(exports, "PaymentMethod", { enumerable: true, get: function () { return payment_1.PaymentMethod; } });
Object.defineProperty(exports, "PaymentProvider", { enumerable: true, get: function () { return payment_1.PaymentProvider; } });
Object.defineProperty(exports, "PaymentTransactionStatus", { enumerable: true, get: function () { return payment_1.PaymentStatus; } });
Object.defineProperty(exports, "RefundStatus", { enumerable: true, get: function () { return payment_1.RefundStatus; } });
Object.defineProperty(exports, "RefundReason", { enumerable: true, get: function () { return payment_1.RefundReason; } });
class ValidationError extends Error {
    constructor(message, field) {
        super(message);
        this.field = field;
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
class NotFoundError extends Error {
    constructor(resource, identifier) {
        super(`${resource}${identifier ? ` with id ${identifier}` : ''} not found`);
        this.name = 'NotFoundError';
    }
}
exports.NotFoundError = NotFoundError;
class UnauthorizedError extends Error {
    constructor(message = 'Unauthorized access') {
        super(message);
        this.name = 'UnauthorizedError';
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends Error {
    constructor(message = 'Forbidden access') {
        super(message);
        this.name = 'ForbiddenError';
    }
}
exports.ForbiddenError = ForbiddenError;
class ConflictError extends Error {
    constructor(message = 'Resource conflict') {
        super(message);
        this.name = 'ConflictError';
    }
}
exports.ConflictError = ConflictError;
class InternalServerError extends Error {
    constructor(message = 'Internal server error') {
        super(message);
        this.name = 'InternalServerError';
    }
}
exports.InternalServerError = InternalServerError;
exports.CONSTANTS = {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
    DEFAULT_CACHE_TTL: 3600,
    JWT_ACCESS_TOKEN_EXPIRY: '15m',
    JWT_REFRESH_TOKEN_EXPIRY: '7d',
    PASSWORD_RESET_TOKEN_EXPIRY: '1h',
    EMAIL_VERIFICATION_TOKEN_EXPIRY: '24h',
    SESSION_TIMEOUT: 86400,
    MAX_LOGIN_ATTEMPTS: 5,
    RATE_LIMIT_WINDOW: 900000,
    SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
    MAX_IMAGE_SIZE: 5242880,
    DEFAULT_CURRENCY: 'USD',
    MIN_PASSWORD_LENGTH: 8,
    MAX_SEARCH_RESULTS: 1000
};
const createSuccessResponse = (data, message) => ({
    success: true,
    data,
    message
});
exports.createSuccessResponse = createSuccessResponse;
const createErrorResponse = (error, code, details) => ({
    success: false,
    error,
    code,
    details
});
exports.createErrorResponse = createErrorResponse;
const createPaginationResponse = (items, page, limit, total, message) => ({
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
exports.createPaginationResponse = createPaginationResponse;
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
exports.isValidEmail = isValidEmail;
const isValidPassword = (password) => {
    return password.length >= exports.CONSTANTS.MIN_PASSWORD_LENGTH;
};
exports.isValidPassword = isValidPassword;
const isValidMongoId = (id) => {
    return /^[0-9a-fA-F]{24}$/.test(id);
};
exports.isValidMongoId = isValidMongoId;
const sanitizeSearchTerm = (term) => {
    return term.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};
exports.sanitizeSearchTerm = sanitizeSearchTerm;
const formatDate = (date) => {
    return date.toISOString();
};
exports.formatDate = formatDate;
const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};
exports.addDays = addDays;
const isDateInPast = (date) => {
    return date < new Date();
};
exports.isDateInPast = isDateInPast;
const formatPrice = (amount, currency = exports.CONSTANTS.DEFAULT_CURRENCY) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency
    }).format(amount / 100);
};
exports.formatPrice = formatPrice;
const calculateTax = (amount, taxRate) => {
    return Math.round(amount * taxRate);
};
exports.calculateTax = calculateTax;
const calculateDiscount = (amount, discountPercent) => {
    return Math.round(amount * (discountPercent / 100));
};
exports.calculateDiscount = calculateDiscount;
//# sourceMappingURL=index.js.map