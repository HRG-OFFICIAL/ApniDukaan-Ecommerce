import { Types, Document } from 'mongoose';

// ==================== ENUMS ====================

export enum OrderStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  RETURNED = 'returned'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded'
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  PAYPAL = 'paypal',
  STRIPE = 'stripe',
  BANK_TRANSFER = 'bank_transfer',
  APPLE_PAY = 'apple_pay',
  GOOGLE_PAY = 'google_pay',
  CRYPTOCURRENCY = 'cryptocurrency',
  CASH_ON_DELIVERY = 'cash_on_delivery'
}

export enum ShippingStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  IN_TRANSIT = 'in_transit',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  FAILED_DELIVERY = 'failed_delivery',
  RETURNED = 'returned'
}

export enum ShippingMethod {
  STANDARD = 'standard',
  EXPRESS = 'express',
  OVERNIGHT = 'overnight',
  SAME_DAY = 'same_day',
  PICKUP = 'pickup',
  FREE = 'free'
}

export enum RefundReason {
  CUSTOMER_REQUEST = 'customer_request',
  DAMAGED_ITEM = 'damaged_item',
  WRONG_ITEM = 'wrong_item',
  NOT_AS_DESCRIBED = 'not_as_described',
  DEFECTIVE = 'defective',
  ORDER_CANCELLED = 'order_cancelled',
  PAYMENT_FAILED = 'payment_failed'
}

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount',
  SHIPPING_DISCOUNT = 'shipping_discount',
  BUY_ONE_GET_ONE = 'buy_one_get_one'
}

// ==================== INTERFACES ====================

export interface IOrderItem {
  _id?: Types.ObjectId;
  productId: string;
  variantId?: string;
  name: string;
  description?: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discountAmount?: number;
  taxAmount?: number;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  imageUrl?: string;
  category?: string;
  brand?: string;
  customizations?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface IShippingAddress {
  firstName: string;
  lastName: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  instructions?: string;
}

export interface IBillingAddress extends IShippingAddress {
  isDefault?: boolean;
}

export interface IShipping {
  method: ShippingMethod;
  carrier?: string;
  service?: string;
  cost: number;
  estimatedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  trackingNumber?: string;
  trackingUrl?: string;
  status: ShippingStatus;
  address: IShippingAddress;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  insurance?: {
    provider: string;
    amount: number;
    policyNumber: string;
  };
  signature?: {
    required: boolean;
    name?: string;
    timestamp?: Date;
  };
  updates: IShippingUpdate[];
}

export interface IShippingUpdate {
  status: ShippingStatus;
  message: string;
  location?: string;
  timestamp: Date;
  carrier?: string;
}

export interface IPayment {
  _id?: Types.ObjectId;
  method: PaymentMethod;
  provider: string;
  transactionId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paidAt?: Date;
  failureReason?: string;
  metadata?: Record<string, any>;
  gateway?: {
    paymentIntentId?: string;
    chargeId?: string;
    customerId?: string;
    paymentMethodId?: string;
  };
  card?: {
    last4: string;
    brand: string;
    expiryMonth: number;
    expiryYear: number;
    fingerprint?: string;
  };
  billing?: IBillingAddress;
  refunds: IRefund[];
}

export interface IRefund {
  _id?: Types.ObjectId;
  amount: number;
  currency: string;
  reason: RefundReason;
  description?: string;
  refundId?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  processedAt?: Date;
  metadata?: Record<string, any>;
}

export interface IDiscount {
  _id?: Types.ObjectId;
  type: DiscountType;
  code?: string;
  name: string;
  description?: string;
  amount: number;
  percentage?: number;
  minimumAmount?: number;
  maximumAmount?: number;
  validFrom?: Date;
  validUntil?: Date;
  usageCount?: number;
  maxUsage?: number;
}

export interface ITax {
  type: string;
  name: string;
  rate: number;
  amount: number;
  jurisdiction?: string;
  taxId?: string;
}

export interface IOrderTotals {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  shippingAmount: number;
  total: number;
  currency: string;
  breakdown?: {
    itemsTotal: number;
    taxes: ITax[];
    discounts: IDiscount[];
    shipping: number;
    handling?: number;
    insurance?: number;
  };
}

export interface IOrderNote {
  _id?: Types.ObjectId;
  type: 'customer' | 'admin' | 'system';
  message: string;
  author?: string;
  isPrivate: boolean;
  createdAt: Date;
  attachments?: string[];
}

export interface IOrderStatusHistory {
  status: OrderStatus;
  reason?: string;
  notes?: string;
  timestamp: Date;
  updatedBy?: string;
  metadata?: Record<string, any>;
}

export interface IOrder extends Document {
  // Basic Order Info
  orderNumber: string;
  customerId: string;
  customerEmail: string;
  status: OrderStatus;
  
  // Order Items
  items: IOrderItem[];
  
  // Pricing & Totals
  totals: IOrderTotals;
  currency: string;
  
  // Customer Information
  customer: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    isGuest: boolean;
  };
  
  // Addresses
  shippingAddress: IShippingAddress;
  billingAddress: IBillingAddress;
  
  // Payment Information
  payments: IPayment[];
  
  // Shipping Information
  shipping: IShipping;
  
  // Discounts & Coupons
  discounts: IDiscount[];
  
  // Order Lifecycle
  statusHistory: IOrderStatusHistory[];
  
  // Notes & Communication
  notes: IOrderNote[];
  customerNotes?: string;
  
  // Metadata
  source: string; // web, mobile, api, admin
  referrer?: string;
  ipAddress?: string;
  userAgent?: string;
  
  // Inventory & Fulfillment
  fulfillmentStatus: 'pending' | 'processing' | 'partial' | 'fulfilled' | 'cancelled';
  inventoryReserved: boolean;
  reservationExpiresAt?: Date;
  
  // Timestamps
  placedAt: Date;
  confirmedAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  parentOrderId?: string; // For split orders
  childOrderIds: string[]; // For order splits
  relatedOrderIds: string[]; // For exchanges, returns
  
  // Analytics & Reporting
  tags: string[];
  metadata: Record<string, any>;
  
  // Methods
  calculateTotals(): Promise<IOrderTotals>;
  addItem(item: Partial<IOrderItem>): Promise<void>;
  updateItem(itemId: string, updates: Partial<IOrderItem>): Promise<void>;
  removeItem(itemId: string): Promise<void>;
  updateStatus(status: OrderStatus, reason?: string, updatedBy?: string): Promise<void>;
  addPayment(payment: Partial<IPayment>): Promise<void>;
  processRefund(paymentId: string, amount: number, reason: RefundReason): Promise<IRefund>;
  addNote(note: Partial<IOrderNote>): Promise<void>;
  reserveInventory(): Promise<boolean>;
  releaseInventory(): Promise<void>;
  generateInvoice(): Promise<Buffer>;
  canCancel(): boolean;
  canRefund(): boolean;
  getShippingLabel(): Promise<Buffer>;
}

// ==================== REQUEST/RESPONSE INTERFACES ====================

export interface ICreateOrderRequest {
  customerId?: string;
  customerEmail: string;
  items: Omit<IOrderItem, '_id' | 'totalPrice'>[];
  shippingAddress: IShippingAddress;
  billingAddress: IBillingAddress;
  shippingMethod: ShippingMethod;
  paymentMethod: PaymentMethod;
  paymentData?: any;
  discountCodes?: string[];
  customerNotes?: string;
  source?: string;
  metadata?: Record<string, any>;
}

export interface IUpdateOrderRequest {
  status?: OrderStatus;
  items?: Partial<IOrderItem>[];
  shippingAddress?: Partial<IShippingAddress>;
  billingAddress?: Partial<IBillingAddress>;
  customerNotes?: string;
  metadata?: Record<string, any>;
}

export interface IOrderResponse {
  success: boolean;
  message: string;
  data?: {
    order: IOrder;
  };
  error?: string;
  code?: string;
}

export interface IOrderListResponse {
  success: boolean;
  data?: {
    orders: IOrder[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  error?: string;
  code?: string;
}

export interface IPaymentRequest {
  orderId: string;
  method: PaymentMethod;
  amount: number;
  currency: string;
  paymentData: any;
  savePaymentMethod?: boolean;
  metadata?: Record<string, any>;
}

export interface IPaymentResponse {
  success: boolean;
  message: string;
  data?: {
    payment: IPayment;
    clientSecret?: string; // For Stripe
    redirectUrl?: string;   // For PayPal
  };
  error?: string;
  code?: string;
}

export interface IRefundRequest {
  orderId: string;
  paymentId: string;
  amount: number;
  reason: RefundReason;
  description?: string;
  metadata?: Record<string, any>;
}

export interface IShippingUpdateRequest {
  orderId: string;
  status: ShippingStatus;
  trackingNumber?: string;
  carrier?: string;
  message?: string;
  location?: string;
  estimatedDelivery?: Date;
}

// ==================== FILTER & SEARCH INTERFACES ====================

export interface IOrderFilters {
  customerId?: string;
  customerEmail?: string;
  status?: OrderStatus | OrderStatus[];
  paymentStatus?: PaymentStatus | PaymentStatus[];
  shippingStatus?: ShippingStatus | ShippingStatus[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  amountRange?: {
    min: number;
    max: number;
  };
  source?: string;
  tags?: string[];
  search?: string;
}

export interface IOrderSortOptions {
  field: 'createdAt' | 'updatedAt' | 'placedAt' | 'total' | 'orderNumber';
  direction: 'asc' | 'desc';
}

export interface IOrderSearchQuery {
  filters?: IOrderFilters;
  sort?: IOrderSortOptions;
  page?: number;
  limit?: number;
  includeCustomer?: boolean;
  includeItems?: boolean;
  includePayments?: boolean;
  includeShipping?: boolean;
}

// ==================== ANALYTICS INTERFACES ====================

export interface IOrderAnalytics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  ordersByStatus: Record<OrderStatus, number>;
  ordersByPaymentMethod: Record<PaymentMethod, number>;
  ordersByShippingMethod: Record<ShippingMethod, number>;
  topProducts: Array<{
    productId: string;
    name: string;
    quantity: number;
    revenue: number;
  }>;
  customerMetrics: {
    newCustomers: number;
    returningCustomers: number;
    guestOrders: number;
  };
  geographicDistribution: Record<string, number>;
  timeSeriesData: Array<{
    date: Date;
    orders: number;
    revenue: number;
  }>;
}

// ==================== EVENT INTERFACES ====================

export interface IOrderEvent {
  type: 'order.created' | 'order.updated' | 'order.cancelled' | 'order.completed' |
        'payment.completed' | 'payment.failed' | 'shipping.updated' | 'inventory.reserved';
  orderId: string;
  customerId?: string;
  data: any;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// ==================== SERVICE INTERFACES ====================

export interface IInventoryReservation {
  orderId: string;
  items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
    reservedAt: Date;
    expiresAt: Date;
  }>;
}

export interface IShippingCalculation {
  method: ShippingMethod;
  carrier: string;
  service: string;
  cost: number;
  estimatedDelivery: Date;
  transitTime: string;
}

export interface IOrderConfiguration {
  paymentGateways: {
    stripe: {
      enabled: boolean;
      publishableKey: string;
      webhookSecret: string;
    };
    paypal: {
      enabled: boolean;
      clientId: string;
      sandbox: boolean;
    };
  };
  shipping: {
    carriers: string[];
    defaultMethod: ShippingMethod;
    freeShippingThreshold: number;
  };
  inventory: {
    reservationTimeout: number; // minutes
    allowBackorders: boolean;
    lowStockThreshold: number;
  };
  taxes: {
    enabled: boolean;
    defaultRate: number;
    taxIncluded: boolean;
  };
  notifications: {
    email: boolean;
    sms: boolean;
    webhook: boolean;
  };
}

// ==================== UTILITY TYPES ====================

export type OrderEventHandler = (event: IOrderEvent) => Promise<void>;

export type PaymentProvider = 'stripe' | 'paypal' | 'square' | 'braintree';

export type ShippingCarrier = 'ups' | 'fedex' | 'usps' | 'dhl' | 'local';

export interface IOrderValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface IOrderSummary {
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  currency: string;
  itemCount: number;
  placedAt: Date;
  customerEmail: string;
}
