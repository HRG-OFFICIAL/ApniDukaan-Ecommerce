export interface IOrder {
    _id: string;
    orderNumber: string;
    userId: string;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    fulfillmentStatus: FulfillmentStatus;
    items: IOrderItem[];
    shippingAddress: IOrderAddress;
    billingAddress: IOrderAddress;
    subtotal: number;
    shippingCost: number;
    taxAmount: number;
    discountAmount: number;
    totalAmount: number;
    currency: string;
    paymentMethod?: string;
    paymentId?: string;
    shippingMethod?: string;
    trackingNumber?: string;
    estimatedDelivery?: Date;
    actualDelivery?: Date;
    notes?: string;
    cancelReason?: string;
    refundAmount?: number;
    refundReason?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface IOrderItem {
    _id: string;
    productId: string;
    variantId?: string;
    name: string;
    sku: string;
    price: number;
    quantity: number;
    total: number;
    image?: string;
    productOptions?: {
        [key: string]: string;
    };
}
export interface IOrderAddress {
    firstName: string;
    lastName: string;
    company?: string;
    street: string;
    street2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone?: string;
}
export interface ICart {
    _id: string;
    userId?: string;
    sessionId?: string;
    items: ICartItem[];
    subtotal: number;
    totalItems: number;
    expiresAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface ICartItem {
    _id: string;
    productId: string;
    variantId?: string;
    name: string;
    sku: string;
    price: number;
    quantity: number;
    total: number;
    image?: string;
    productOptions?: {
        [key: string]: string;
    };
    addedAt: Date;
}
export interface IShippingRate {
    _id: string;
    name: string;
    description?: string;
    rate: number;
    estimatedDays: number;
    carrier?: string;
    isActive: boolean;
}
export interface IDiscount {
    _id: string;
    code: string;
    type: DiscountType;
    value: number;
    minimumAmount?: number;
    maximumDiscount?: number;
    usageLimit?: number;
    usageCount: number;
    userLimit?: number;
    startDate?: Date;
    endDate?: Date;
    isActive: boolean;
    applicableProducts?: string[];
    applicableCategories?: string[];
    createdAt: Date;
    updatedAt: Date;
}
export declare enum OrderStatus {
    PENDING = "pending",
    CONFIRMED = "confirmed",
    PROCESSING = "processing",
    SHIPPED = "shipped",
    DELIVERED = "delivered",
    CANCELLED = "cancelled",
    RETURNED = "returned",
    REFUNDED = "refunded"
}
export declare enum PaymentStatus {
    PENDING = "pending",
    PAID = "paid",
    FAILED = "failed",
    REFUNDED = "refunded",
    PARTIALLY_REFUNDED = "partially_refunded"
}
export declare enum FulfillmentStatus {
    UNFULFILLED = "unfulfilled",
    PARTIALLY_FULFILLED = "partially_fulfilled",
    FULFILLED = "fulfilled",
    RESTOCKED = "restocked"
}
export declare enum DiscountType {
    PERCENTAGE = "percentage",
    FIXED_AMOUNT = "fixed_amount",
    FREE_SHIPPING = "free_shipping"
}
export interface CreateOrderInput {
    items: CreateOrderItemInput[];
    shippingAddress: CreateOrderAddressInput;
    billingAddress: CreateOrderAddressInput;
    shippingMethodId?: string;
    discountCode?: string;
    paymentMethodId: string;
    notes?: string;
}
export interface CreateOrderItemInput {
    productId: string;
    variantId?: string;
    quantity: number;
    productOptions?: {
        [key: string]: string;
    };
}
export interface CreateOrderAddressInput {
    firstName: string;
    lastName: string;
    company?: string;
    street: string;
    street2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone?: string;
}
export interface AddToCartInput {
    productId: string;
    variantId?: string;
    quantity: number;
    productOptions?: {
        [key: string]: string;
    };
}
export interface UpdateCartItemInput {
    itemId: string;
    quantity: number;
}
export interface ApplyDiscountInput {
    code: string;
}
export interface OrderFilters {
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    fulfillmentStatus?: FulfillmentStatus;
    userId?: string;
    dateFrom?: Date;
    dateTo?: Date;
}
export interface OrderSummary {
    subtotal: number;
    shippingCost: number;
    taxAmount: number;
    discountAmount: number;
    totalAmount: number;
}
//# sourceMappingURL=order.d.ts.map