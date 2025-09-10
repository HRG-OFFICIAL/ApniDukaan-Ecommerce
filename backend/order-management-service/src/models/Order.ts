import mongoose, { Schema, Model, Document, Types } from 'mongoose';
// import { v4 as uuidv4 } from 'uuid'; // Not used currently
import ShortUniqueId from 'short-unique-id';
import Decimal from 'decimal.js';
import {
  IOrder,
  IOrderItem,
  IShippingAddress,
  IBillingAddress,
  IShipping,
  IShippingUpdate,
  IPayment,
  IRefund,
  IDiscount,
  ITax,
  IOrderTotals,
  IOrderNote,
  IOrderStatusHistory,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  ShippingStatus,
  ShippingMethod,
  RefundReason,
  DiscountType
} from '../types/order.types';

// ==================== DOCUMENT INTERFACE ====================

export interface IOrderDocument extends IOrder, Document {
  // Instance methods
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
  
  // Virtual properties
  customerFullName: string;
  orderAge: number;
  isCancellable: boolean;
  isRefundable: boolean;
  totalQuantity: number;
  paymentStatus: string;
  
  // Subdocument arrays with proper typing
  payments: Types.DocumentArray<IPayment & Document>;
  items: Types.DocumentArray<IOrderItem & Document>;
  notes: Types.DocumentArray<IOrderNote & Document>;
  discounts: Types.DocumentArray<IDiscount & Document>;
  statusHistory: Types.DocumentArray<IOrderStatusHistory & Document>;
}

// Static methods interface
export interface IOrderModel extends Model<IOrderDocument> {
  findByCustomer(customerId: string, options?: any): Promise<IOrderDocument[]>;
  searchOrders(query: string): Promise<IOrderDocument[]>;
  findByStatus(status: OrderStatus | OrderStatus[]): Promise<IOrderDocument[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<IOrderDocument[]>;
}

const uid = new ShortUniqueId({ length: 10 });

// ==================== SUBDOCUMENT SCHEMAS ====================

// Order Item Schema
const OrderItemSchema = new Schema<IOrderItem>({
  productId: {
    type: String,
    required: [true, 'Product ID is required'],
    trim: true
  },
  variantId: {
    type: String,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  sku: {
    type: String,
    required: [true, 'SKU is required'],
    trim: true,
    uppercase: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
    validate: {
      validator: Number.isInteger,
      message: 'Quantity must be an integer'
    }
  },
  unitPrice: {
    type: Number,
    required: [true, 'Unit price is required'],
    min: [0, 'Unit price cannot be negative'],
    validate: {
      validator: function(value: number) {
        return new Decimal(value).decimalPlaces() <= 2;
      },
      message: 'Unit price cannot have more than 2 decimal places'
    }
  },
  totalPrice: {
    type: Number,
    required: [true, 'Total price is required'],
    min: [0, 'Total price cannot be negative']
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: [0, 'Discount amount cannot be negative']
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: [0, 'Tax amount cannot be negative']
  },
  weight: {
    type: Number,
    min: [0, 'Weight cannot be negative']
  },
  dimensions: {
    length: { type: Number, min: 0 },
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 }
  },
  imageUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function(url: string) {
        return !url || /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/i.test(url);
      },
      message: 'Invalid image URL format'
    }
  },
  category: {
    type: String,
    trim: true
  },
  brand: {
    type: String,
    trim: true
  },
  customizations: {
    type: Schema.Types.Mixed,
    default: {}
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  _id: true,
  timestamps: true
});

// Address Schemas
const AddressSchema = new Schema<IShippingAddress>({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  company: {
    type: String,
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  addressLine1: {
    type: String,
    required: [true, 'Address line 1 is required'],
    trim: true,
    maxlength: [200, 'Address line 1 cannot exceed 200 characters']
  },
  addressLine2: {
    type: String,
    trim: true,
    maxlength: [200, 'Address line 2 cannot exceed 200 characters']
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true,
    maxlength: [100, 'City cannot exceed 100 characters']
  },
  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true,
    maxlength: [100, 'State cannot exceed 100 characters']
  },
  postalCode: {
    type: String,
    required: [true, 'Postal code is required'],
    trim: true,
    maxlength: [20, 'Postal code cannot exceed 20 characters']
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    trim: true,
    maxlength: [100, 'Country cannot exceed 100 characters']
  },
  phone: {
    type: String,
    trim: true,
    validate: {
      validator: function(phone: string) {
        return !phone || /^\+?[\d\s\-\(\)]{10,}$/.test(phone);
      },
      message: 'Please enter a valid phone number'
    }
  },
  instructions: {
    type: String,
    trim: true,
    maxlength: [500, 'Instructions cannot exceed 500 characters']
  }
});

const BillingAddressSchema = new Schema<IBillingAddress>({
  ...AddressSchema.obj,
  isDefault: {
    type: Boolean,
    default: false
  }
});

// Shipping Update Schema
const ShippingUpdateSchema = new Schema<IShippingUpdate>({
  status: {
    type: String,
    enum: Object.values(ShippingStatus),
    required: [true, 'Shipping status is required']
  },
  message: {
    type: String,
    required: [true, 'Update message is required'],
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  timestamp: {
    type: Date,
    required: [true, 'Timestamp is required'],
    default: Date.now
  },
  carrier: {
    type: String,
    trim: true
  }
}, { _id: false });

// Shipping Schema
const ShippingSchema = new Schema<IShipping>({
  method: {
    type: String,
    enum: Object.values(ShippingMethod),
    required: [true, 'Shipping method is required']
  },
  carrier: {
    type: String,
    trim: true
  },
  service: {
    type: String,
    trim: true
  },
  cost: {
    type: Number,
    required: [true, 'Shipping cost is required'],
    min: [0, 'Shipping cost cannot be negative']
  },
  estimatedDeliveryDate: {
    type: Date
  },
  actualDeliveryDate: {
    type: Date
  },
  trackingNumber: {
    type: String,
    trim: true,
    uppercase: true
  },
  trackingUrl: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: Object.values(ShippingStatus),
    required: [true, 'Shipping status is required'],
    default: ShippingStatus.PENDING
  },
  address: {
    type: AddressSchema,
    required: [true, 'Shipping address is required']
  },
  weight: {
    type: Number,
    min: [0, 'Weight cannot be negative']
  },
  dimensions: {
    length: { type: Number, min: 0 },
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 }
  },
  insurance: {
    provider: { type: String, trim: true },
    amount: { type: Number, min: 0 },
    policyNumber: { type: String, trim: true }
  },
  signature: {
    required: { type: Boolean, default: false },
    name: { type: String, trim: true },
    timestamp: { type: Date }
  },
  updates: [ShippingUpdateSchema]
});

// Refund Schema
const RefundSchema = new Schema<IRefund>({
  amount: {
    type: Number,
    required: [true, 'Refund amount is required'],
    min: [0.01, 'Refund amount must be greater than 0']
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    uppercase: true,
    length: [3, 'Currency must be 3 characters']
  },
  reason: {
    type: String,
    enum: Object.values(RefundReason),
    required: [true, 'Refund reason is required']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  refundId: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    required: [true, 'Refund status is required'],
    default: 'pending'
  },
  processedAt: {
    type: Date
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  _id: true,
  timestamps: true
});

// Payment Schema
const PaymentSchema = new Schema<IPayment>({
  method: {
    type: String,
    enum: Object.values(PaymentMethod),
    required: [true, 'Payment method is required']
  },
  provider: {
    type: String,
    required: [true, 'Payment provider is required'],
    trim: true
  },
  transactionId: {
    type: String,
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Payment amount is required'],
    min: [0.01, 'Payment amount must be greater than 0']
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    uppercase: true,
    length: [3, 'Currency must be 3 characters']
  },
  status: {
    type: String,
    enum: Object.values(PaymentStatus),
    required: [true, 'Payment status is required'],
    default: PaymentStatus.PENDING
  },
  paidAt: {
    type: Date
  },
  failureReason: {
    type: String,
    trim: true
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  gateway: {
    paymentIntentId: { type: String, trim: true },
    chargeId: { type: String, trim: true },
    customerId: { type: String, trim: true },
    paymentMethodId: { type: String, trim: true }
  },
  card: {
    last4: {
      type: String,
      length: [4, 'Last 4 digits must be exactly 4 characters'],
      validate: /^\d{4}$/
    },
    brand: { type: String, trim: true },
    expiryMonth: {
      type: Number,
      min: [1, 'Expiry month must be between 1 and 12'],
      max: [12, 'Expiry month must be between 1 and 12']
    },
    expiryYear: {
      type: Number,
      min: [new Date().getFullYear(), 'Expiry year cannot be in the past']
    },
    fingerprint: { type: String, trim: true }
  },
  billing: BillingAddressSchema,
  refunds: [RefundSchema]
}, {
  _id: true,
  timestamps: true
});

// Tax Schema
const TaxSchema = new Schema<ITax>({
  type: {
    type: String,
    required: [true, 'Tax type is required'],
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Tax name is required'],
    trim: true
  },
  rate: {
    type: Number,
    required: [true, 'Tax rate is required'],
    min: [0, 'Tax rate cannot be negative'],
    max: [1, 'Tax rate cannot exceed 100%']
  },
  amount: {
    type: Number,
    required: [true, 'Tax amount is required'],
    min: [0, 'Tax amount cannot be negative']
  },
  jurisdiction: {
    type: String,
    trim: true
  },
  taxId: {
    type: String,
    trim: true
  }
}, { _id: false });

// Discount Schema
const DiscountSchema = new Schema<IDiscount>({
  type: {
    type: String,
    enum: Object.values(DiscountType),
    required: [true, 'Discount type is required']
  },
  code: {
    type: String,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: [true, 'Discount name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Discount amount is required'],
    min: [0, 'Discount amount cannot be negative']
  },
  percentage: {
    type: Number,
    min: [0, 'Percentage cannot be negative'],
    max: [100, 'Percentage cannot exceed 100%']
  },
  minimumAmount: {
    type: Number,
    min: [0, 'Minimum amount cannot be negative']
  },
  maximumAmount: {
    type: Number,
    min: [0, 'Maximum amount cannot be negative']
  },
  validFrom: {
    type: Date
  },
  validUntil: {
    type: Date
  },
  usageCount: {
    type: Number,
    default: 0,
    min: [0, 'Usage count cannot be negative']
  },
  maxUsage: {
    type: Number,
    min: [1, 'Max usage must be at least 1']
  }
}, { _id: true });

// Order Totals Schema
const OrderTotalsSchema = new Schema<IOrderTotals>({
  subtotal: {
    type: Number,
    required: [true, 'Subtotal is required'],
    min: [0, 'Subtotal cannot be negative']
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: [0, 'Discount amount cannot be negative']
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: [0, 'Tax amount cannot be negative']
  },
  shippingAmount: {
    type: Number,
    default: 0,
    min: [0, 'Shipping amount cannot be negative']
  },
  total: {
    type: Number,
    required: [true, 'Total is required'],
    min: [0, 'Total cannot be negative']
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    uppercase: true,
    length: [3, 'Currency must be 3 characters']
  },
  breakdown: {
    itemsTotal: { type: Number, min: 0 },
    taxes: [TaxSchema],
    discounts: [DiscountSchema],
    shipping: { type: Number, min: 0 },
    handling: { type: Number, min: 0 },
    insurance: { type: Number, min: 0 }
  }
}, { _id: false });

// Order Note Schema
const OrderNoteSchema = new Schema<IOrderNote>({
  type: {
    type: String,
    enum: ['customer', 'admin', 'system'],
    required: [true, 'Note type is required']
  },
  message: {
    type: String,
    required: [true, 'Note message is required'],
    trim: true,
    maxlength: [2000, 'Note message cannot exceed 2000 characters']
  },
  author: {
    type: String,
    trim: true
  },
  isPrivate: {
    type: Boolean,
    required: [true, 'Privacy setting is required'],
    default: false
  },
  attachments: [{
    type: String,
    trim: true
  }]
}, {
  _id: true,
  timestamps: true
});

// Order Status History Schema
const OrderStatusHistorySchema = new Schema<IOrderStatusHistory>({
  status: {
    type: String,
    enum: Object.values(OrderStatus),
    required: [true, 'Status is required']
  },
  reason: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  timestamp: {
    type: Date,
    required: [true, 'Timestamp is required'],
    default: Date.now
  },
  updatedBy: {
    type: String,
    trim: true
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, { _id: false });

// ==================== MAIN ORDER SCHEMA ====================

const OrderSchema = new Schema<IOrderDocument>({
  // Basic Order Info
  orderNumber: {
    type: String,
    required: [true, 'Order number is required'],
    trim: true,
    uppercase: true,
    default: () => `ORD-${uid.randomUUID()}`
  },
  customerId: {
    type: String,
    required: [true, 'Customer ID is required'],
    trim: true
  },
  customerEmail: {
    type: String,
    required: [true, 'Customer email is required'],
    trim: true,
    lowercase: true,
    validate: {
      validator: function(email: string) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      },
      message: 'Please enter a valid email address'
    }
  },
  status: {
    type: String,
    enum: Object.values(OrderStatus),
    required: [true, 'Order status is required'],
    default: OrderStatus.DRAFT
  },

  // Order Items
  items: {
    type: [OrderItemSchema],
    required: [true, 'Order items are required'],
    validate: {
      validator: function(items: IOrderItem[]) {
        return items.length > 0;
      },
      message: 'Order must contain at least one item'
    }
  },

  // Pricing & Totals
  totals: {
    type: OrderTotalsSchema,
    required: [true, 'Order totals are required']
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    uppercase: true,
    length: [3, 'Currency must be 3 characters'],
    default: 'USD'
  },

  // Customer Information
  customer: {
    id: {
      type: String,
      required: [true, 'Customer ID is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Customer email is required'],
      trim: true,
      lowercase: true
    },
    firstName: {
      type: String,
      required: [true, 'Customer first name is required'],
      trim: true
    },
    lastName: {
      type: String,
      required: [true, 'Customer last name is required'],
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    isGuest: {
      type: Boolean,
      required: [true, 'Guest status is required'],
      default: false
    }
  },

  // Addresses
  shippingAddress: {
    type: AddressSchema,
    required: [true, 'Shipping address is required']
  },
  billingAddress: {
    type: BillingAddressSchema,
    required: [true, 'Billing address is required']
  },

  // Payment Information
  payments: [PaymentSchema],

  // Shipping Information
  shipping: {
    type: ShippingSchema,
    required: [true, 'Shipping information is required']
  },

  // Discounts & Coupons
  discounts: [DiscountSchema],

  // Order Lifecycle
  statusHistory: {
    type: [OrderStatusHistorySchema],
    default: []
  },

  // Notes & Communication
  notes: [OrderNoteSchema],
  customerNotes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Customer notes cannot exceed 1000 characters']
  },

  // Metadata
  source: {
    type: String,
    required: [true, 'Order source is required'],
    trim: true,
    lowercase: true,
    default: 'web'
  },
  referrer: {
    type: String,
    trim: true
  },
  ipAddress: {
    type: String,
    trim: true,
    validate: {
      validator: function(ip: string) {
        return !ip || /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip);
      },
      message: 'Please enter a valid IP address'
    }
  },
  userAgent: {
    type: String,
    trim: true
  },

  // Inventory & Fulfillment
  fulfillmentStatus: {
    type: String,
    enum: ['pending', 'processing', 'partial', 'fulfilled', 'cancelled'],
    required: [true, 'Fulfillment status is required'],
    default: 'pending'
  },
  inventoryReserved: {
    type: Boolean,
    required: [true, 'Inventory reservation status is required'],
    default: false
  },
  reservationExpiresAt: {
    type: Date
  },

  // Timestamps
  placedAt: {
    type: Date,
    required: [true, 'Placed at timestamp is required'],
    default: Date.now
  },
  confirmedAt: {
    type: Date
  },
  shippedAt: {
    type: Date
  },
  deliveredAt: {
    type: Date
  },
  cancelledAt: {
    type: Date
  },

  // Relations
  parentOrderId: {
    type: String,
    trim: true
  },
  childOrderIds: [{
    type: String,
    trim: true
  }],
  relatedOrderIds: [{
    type: String,
    trim: true
  }],

  // Analytics & Reporting
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ==================== INDEXES ====================

OrderSchema.index({ customerId: 1, createdAt: -1 });
OrderSchema.index({ customerEmail: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ placedAt: -1 });
OrderSchema.index({ 'totals.total': -1 });
OrderSchema.index({ orderNumber: 1 }, { unique: true });
OrderSchema.index({ 'payments.transactionId': 1 }, { sparse: true });
OrderSchema.index({ 'shipping.trackingNumber': 1 }, { sparse: true });
OrderSchema.index({ source: 1, createdAt: -1 });
OrderSchema.index({ tags: 1 });

// Text search index
OrderSchema.index({
  orderNumber: 'text',
  customerEmail: 'text',
  'customer.firstName': 'text',
  'customer.lastName': 'text',
  'items.name': 'text',
  'items.sku': 'text'
});

// ==================== VIRTUALS ====================

// Full customer name
OrderSchema.virtual('customerFullName').get(function() {
  return `${this.customer.firstName} ${this.customer.lastName}`;
});

// Order age in days
OrderSchema.virtual('orderAge').get(function() {
  const now = new Date();
  const placed = new Date(this.placedAt);
  return Math.floor((now.getTime() - placed.getTime()) / (1000 * 60 * 60 * 24));
});

// Is order cancellable
OrderSchema.virtual('isCancellable').get(function() {
  return this.canCancel();
});

// Is order refundable
OrderSchema.virtual('isRefundable').get(function() {
  return this.canRefund();
});

// Total quantity
OrderSchema.virtual('totalQuantity').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Payment status
OrderSchema.virtual('paymentStatus').get(function() {
  if (this.payments.length === 0) return PaymentStatus.PENDING;
  
  const totalPaid = this.payments
    .filter(p => p.status === PaymentStatus.COMPLETED)
    .reduce((sum, p) => sum + p.amount, 0);
  
  if (totalPaid >= this.totals.total) return PaymentStatus.COMPLETED;
  if (totalPaid > 0) return 'partially_paid';
  return PaymentStatus.PENDING;
});

// ==================== MIDDLEWARE ====================

// Pre-save middleware to calculate totals
OrderSchema.pre('save', async function() {
  if (this.isModified('items') || this.isModified('discounts') || this.isModified('shipping.cost')) {
    this.totals = await this.calculateTotals();
  }
  
  // Update status history if status changed
  if (this.isModified('status')) {
    await this.updateStatus(this.status, 'Status updated', 'system');
  }
});

// Pre-save middleware to update timestamps
OrderSchema.pre('save', function() {
  const now = new Date();
  
  if (this.isModified('status')) {
    switch (this.status) {
      case OrderStatus.CONFIRMED:
        if (!this.confirmedAt) this.confirmedAt = now;
        break;
      case OrderStatus.SHIPPED:
        if (!this.shippedAt) this.shippedAt = now;
        break;
      case OrderStatus.DELIVERED:
        if (!this.deliveredAt) this.deliveredAt = now;
        break;
      case OrderStatus.CANCELLED:
        if (!this.cancelledAt) this.cancelledAt = now;
        break;
    }
  }
});

// ==================== INSTANCE METHODS ====================

// Calculate order totals
OrderSchema.methods.calculateTotals = async function(): Promise<IOrderTotals> {
  const subtotal = this.items.reduce((total: number, item: IOrderItem) => {
    const itemTotal = new Decimal(item.unitPrice).mul(item.quantity);
    return new Decimal(total).plus(itemTotal).toNumber();
  }, 0);

  const discountAmount = this.discounts.reduce((total: number, discount: IDiscount) => {
    return new Decimal(total).plus(discount.amount).toNumber();
  }, 0);

  const taxAmount = this.items.reduce((total: number, item: IOrderItem) => {
    return new Decimal(total).plus(item.taxAmount || 0).toNumber();
  }, 0);

  const shippingAmount = this.shipping?.cost || 0;

  const total = new Decimal(subtotal)
    .minus(discountAmount)
    .plus(taxAmount)
    .plus(shippingAmount)
    .toNumber();

  return {
    subtotal,
    discountAmount,
    taxAmount,
    shippingAmount,
    total: Math.max(0, total),
    currency: this.currency,
    breakdown: {
      itemsTotal: subtotal,
      taxes: [], // Will be populated by tax calculation service
      discounts: this.discounts,
      shipping: shippingAmount
    }
  };
};

// Add item to order
OrderSchema.methods.addItem = async function(item: Partial<IOrderItem>): Promise<void> {
  const newItem = {
    ...item,
    _id: new mongoose.Types.ObjectId(),
    totalPrice: new Decimal(item.unitPrice!).mul(item.quantity!).toNumber()
  } as IOrderItem;

  this.items.push(newItem);
  await this.save();
};

// Update order item
OrderSchema.methods.updateItem = async function(itemId: string, updates: Partial<IOrderItem>): Promise<void> {
  const item = this.items.id(itemId);
  if (!item) {
    throw new Error('Order item not found');
  }

  Object.assign(item, updates);
  
  if (updates.quantity || updates.unitPrice) {
    item.totalPrice = new Decimal(item.unitPrice).mul(item.quantity).toNumber();
  }

  await this.save();
};

// Remove item from order
OrderSchema.methods.removeItem = async function(itemId: string): Promise<void> {
  const item = this.items.id(itemId);
  if (!item) {
    throw new Error('Order item not found');
  }

  this.items.pull(itemId);
  await this.save();
};

// Update order status
OrderSchema.methods.updateStatus = async function(
  status: OrderStatus, 
  reason?: string, 
  updatedBy?: string
): Promise<void> {
  const historyEntry: IOrderStatusHistory = {
    status,
    reason: reason || '',
    timestamp: new Date(),
    updatedBy: updatedBy || '',
    metadata: {}
  };

  this.statusHistory.push(historyEntry);
  this.status = status;
};

// Add payment
OrderSchema.methods.addPayment = async function(payment: Partial<IPayment>): Promise<void> {
  const newPayment = {
    ...payment,
    _id: new mongoose.Types.ObjectId(),
    refunds: []
  } as IPayment;

  this.payments.push(newPayment);
  await this.save();
};

// Process refund
OrderSchema.methods.processRefund = async function(
  paymentId: string, 
  amount: number, 
  reason: RefundReason
): Promise<IRefund> {
  const payment = this.payments.id(paymentId);
  if (!payment) {
    throw new Error('Payment not found');
  }

  const refund: IRefund = {
    _id: new mongoose.Types.ObjectId(),
    amount,
    currency: payment.currency,
    reason,
    status: 'pending'
  };

  payment.refunds.push(refund);
  await this.save();

  return refund;
};

// Add order note
OrderSchema.methods.addNote = async function(note: Partial<IOrderNote>): Promise<void> {
  const newNote = {
    ...note,
    _id: new mongoose.Types.ObjectId(),
    createdAt: new Date()
  } as IOrderNote;

  this.notes.push(newNote);
  await this.save();
};

// Reserve inventory
OrderSchema.methods.reserveInventory = async function(): Promise<boolean> {
  // This would integrate with inventory service
  // For now, just mark as reserved
  this.inventoryReserved = true;
  this.reservationExpiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  await this.save();
  return true;
};

// Release inventory
OrderSchema.methods.releaseInventory = async function(): Promise<void> {
  this.inventoryReserved = false;
  this.reservationExpiresAt = undefined;
  await this.save();
};

// Generate invoice (placeholder)
OrderSchema.methods.generateInvoice = async function(): Promise<Buffer> {
  // This would generate a PDF invoice using pdf-lib
  return Buffer.from('Invoice placeholder');
};

// Check if order can be cancelled
OrderSchema.methods.canCancel = function(): boolean {
  const cancellableStatuses = [
    OrderStatus.DRAFT,
    OrderStatus.PENDING,
    OrderStatus.CONFIRMED,
    OrderStatus.PROCESSING
  ];
  return cancellableStatuses.includes(this.status);
};

// Check if order can be refunded
OrderSchema.methods.canRefund = function(): boolean {
  const refundableStatuses = [
    OrderStatus.CONFIRMED,
    OrderStatus.PROCESSING,
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED
  ];
  return refundableStatuses.includes(this.status) && 
         this.payments.some((p: any) => p.status === PaymentStatus.COMPLETED);
};

// Get shipping label (placeholder)
OrderSchema.methods.getShippingLabel = async function(): Promise<Buffer> {
  // This would generate a shipping label
  return Buffer.from('Shipping label placeholder');
};

// ==================== STATIC METHODS ====================

// Find orders by customer
OrderSchema.statics.findByCustomer = function(customerId: string, options: any = {}) {
  return this.find({ customerId })
    .sort({ createdAt: -1 })
    .limit(options.limit || 50)
    .skip(options.skip || 0);
};

// Search orders
OrderSchema.statics.searchOrders = function(query: string) {
  return this.find({
    $text: { $search: query }
  }, {
    score: { $meta: 'textScore' }
  }).sort({
    score: { $meta: 'textScore' }
  });
};

// Get orders by status
OrderSchema.statics.findByStatus = function(status: OrderStatus | OrderStatus[]) {
  const statusFilter = Array.isArray(status) ? { $in: status } : status;
  return this.find({ status: statusFilter }).sort({ createdAt: -1 });
};

// Get orders by date range
OrderSchema.statics.findByDateRange = function(startDate: Date, endDate: Date) {
  return this.find({
    placedAt: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ placedAt: -1 });
};

// ==================== MODEL CREATION ====================

export const Order: IOrderModel = mongoose.model<IOrderDocument, IOrderModel>('Order', OrderSchema);

export default Order;
