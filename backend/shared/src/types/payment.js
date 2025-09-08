"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefundReason = exports.RefundStatus = exports.TransactionStatus = exports.TransactionType = exports.PaymentMethodType = exports.PaymentProvider = exports.PaymentMethod = exports.PaymentStatus = void 0;
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["PROCESSING"] = "processing";
    PaymentStatus["SUCCEEDED"] = "succeeded";
    PaymentStatus["FAILED"] = "failed";
    PaymentStatus["CANCELLED"] = "cancelled";
    PaymentStatus["REQUIRES_ACTION"] = "requires_action";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["CARD"] = "card";
    PaymentMethod["PAYPAL"] = "paypal";
    PaymentMethod["BANK_TRANSFER"] = "bank_transfer";
    PaymentMethod["APPLE_PAY"] = "apple_pay";
    PaymentMethod["GOOGLE_PAY"] = "google_pay";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
var PaymentProvider;
(function (PaymentProvider) {
    PaymentProvider["STRIPE"] = "stripe";
    PaymentProvider["PAYPAL"] = "paypal";
})(PaymentProvider || (exports.PaymentProvider = PaymentProvider = {}));
var PaymentMethodType;
(function (PaymentMethodType) {
    PaymentMethodType["CARD"] = "card";
    PaymentMethodType["PAYPAL"] = "paypal";
    PaymentMethodType["BANK_ACCOUNT"] = "bank_account";
})(PaymentMethodType || (exports.PaymentMethodType = PaymentMethodType = {}));
var TransactionType;
(function (TransactionType) {
    TransactionType["PAYMENT"] = "payment";
    TransactionType["REFUND"] = "refund";
    TransactionType["CHARGEBACK"] = "chargeback";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
var TransactionStatus;
(function (TransactionStatus) {
    TransactionStatus["PENDING"] = "pending";
    TransactionStatus["SUCCEEDED"] = "succeeded";
    TransactionStatus["FAILED"] = "failed";
})(TransactionStatus || (exports.TransactionStatus = TransactionStatus = {}));
var RefundStatus;
(function (RefundStatus) {
    RefundStatus["PENDING"] = "pending";
    RefundStatus["SUCCEEDED"] = "succeeded";
    RefundStatus["FAILED"] = "failed";
    RefundStatus["CANCELLED"] = "cancelled";
})(RefundStatus || (exports.RefundStatus = RefundStatus = {}));
var RefundReason;
(function (RefundReason) {
    RefundReason["REQUESTED_BY_CUSTOMER"] = "requested_by_customer";
    RefundReason["FRAUDULENT"] = "fraudulent";
    RefundReason["DUPLICATE"] = "duplicate";
    RefundReason["ORDER_CANCELLED"] = "order_cancelled";
    RefundReason["PRODUCT_NOT_RECEIVED"] = "product_not_received";
    RefundReason["PRODUCT_UNACCEPTABLE"] = "product_unacceptable";
    RefundReason["OTHER"] = "other";
})(RefundReason || (exports.RefundReason = RefundReason = {}));
//# sourceMappingURL=payment.js.map