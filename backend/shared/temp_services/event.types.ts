// Event Types for ApniDukaan E-commerce Platform
export enum EventType {
  // Order Events
  ORDER_CREATED = 'order.created',
  ORDER_UPDATED = 'order.updated',
  ORDER_CANCELLED = 'order.cancelled',
  ORDER_SHIPPED = 'order.shipped',
  ORDER_DELIVERED = 'order.delivered',
  ORDER_REFUNDED = 'order.refunded',
  
  // Payment Events
  PAYMENT_INITIATED = 'payment.initiated',
  PAYMENT_COMPLETED = 'payment.completed',
  PAYMENT_FAILED = 'payment.failed',
  PAYMENT_REFUNDED = 'payment.refunded',
  
  // User Events
  USER_REGISTERED = 'user.registered',
  USER_LOGIN = 'user.login',
  USER_LOGOUT = 'user.logout',
  USER_PROFILE_UPDATED = 'user.profile.updated',
  USER_PASSWORD_CHANGED = 'user.password.changed',
  
  // Product Events
  PRODUCT_CREATED = 'product.created',
  PRODUCT_UPDATED = 'product.updated',
  PRODUCT_DELETED = 'product.deleted',
  PRODUCT_STOCK_LOW = 'product.stock.low',
  PRODUCT_STOCK_OUT = 'product.stock.out',
  
  // Cart Events
  CART_ITEM_ADDED = 'cart.item.added',
  CART_ITEM_REMOVED = 'cart.item.removed',
  CART_ABANDONED = 'cart.abandoned',
  
  // Notification Events
  EMAIL_SENT = 'notification.email.sent',
  SMS_SENT = 'notification.sms.sent',
  PUSH_SENT = 'notification.push.sent',
  
  // System Events
  SYSTEM_ERROR = 'system.error',
  SYSTEM_WARNING = 'system.warning',
  SYSTEM_INFO = 'system.info'
}

export enum EventStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  RETRY = 'retry'
}

export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in_app',
  WEBHOOK = 'webhook'
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

// Base Event Interface
export interface BaseEvent {
  id: string;
  type: EventType;
  status: EventStatus;
  timestamp: string;
  source: string;
  version: string;
  correlationId?: string;
  metadata?: Record<string, any>;
}

// Order Events
export interface OrderCreatedEvent extends BaseEvent {
  type: EventType.ORDER_CREATED;
  data: {
    orderId: string;
    orderNumber: string;
    customerId: string;
    customerEmail: string;
    customerName: string;
    total: number;
    currency: string;
    items: Array<{
      productId: string;
      productName: string;
      quantity: number;
      price: number;
    }>;
    shippingAddress: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    billingAddress?: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
  };
}

export interface OrderUpdatedEvent extends BaseEvent {
  type: EventType.ORDER_UPDATED;
  data: {
    orderId: string;
    orderNumber: string;
    previousStatus: string;
    newStatus: string;
    updatedBy: string;
    reason?: string;
  };
}

export interface OrderCancelledEvent extends BaseEvent {
  type: EventType.ORDER_CANCELLED;
  data: {
    orderId: string;
    orderNumber: string;
    customerId: string;
    reason: string;
    refundAmount?: number;
    cancelledBy: string;
  };
}

export interface OrderShippedEvent extends BaseEvent {
  type: EventType.ORDER_SHIPPED;
  data: {
    orderId: string;
    orderNumber: string;
    customerId: string;
    trackingNumber: string;
    carrier: string;
    estimatedDelivery: string;
    shippingAddress: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
  };
}

export interface OrderDeliveredEvent extends BaseEvent {
  type: EventType.ORDER_DELIVERED;
  data: {
    orderId: string;
    orderNumber: string;
    customerId: string;
    deliveredAt: string;
    deliveredTo: string;
    signature?: string;
  };
}

// Payment Events
export interface PaymentInitiatedEvent extends BaseEvent {
  type: EventType.PAYMENT_INITIATED;
  data: {
    paymentId: string;
    orderId: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    customerId: string;
  };
}

export interface PaymentCompletedEvent extends BaseEvent {
  type: EventType.PAYMENT_COMPLETED;
  data: {
    paymentId: string;
    orderId: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    transactionId: string;
    customerId: string;
    processedAt: string;
  };
}

export interface PaymentFailedEvent extends BaseEvent {
  type: EventType.PAYMENT_FAILED;
  data: {
    paymentId: string;
    orderId: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    customerId: string;
    errorCode: string;
    errorMessage: string;
    failedAt: string;
  };
}

// User Events
export interface UserRegisteredEvent extends BaseEvent {
  type: EventType.USER_REGISTERED;
  data: {
    userId: string;
    email: string;
    name: string;
    registrationMethod: string;
    ipAddress: string;
    userAgent: string;
  };
}

export interface UserLoginEvent extends BaseEvent {
  type: EventType.USER_LOGIN;
  data: {
    userId: string;
    email: string;
    loginMethod: string;
    ipAddress: string;
    userAgent: string;
    loginAt: string;
  };
}

// Product Events
export interface ProductCreatedEvent extends BaseEvent {
  type: EventType.PRODUCT_CREATED;
  data: {
    productId: string;
    name: string;
    sku: string;
    price: number;
    categoryId: string;
    createdBy: string;
  };
}

export interface ProductStockLowEvent extends BaseEvent {
  type: EventType.PRODUCT_STOCK_LOW;
  data: {
    productId: string;
    productName: string;
    sku: string;
    currentStock: number;
    lowStockThreshold: number;
    categoryId: string;
  };
}

// Cart Events
export interface CartItemAddedEvent extends BaseEvent {
  type: EventType.CART_ITEM_ADDED;
  data: {
    userId: string;
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    cartTotal: number;
  };
}

export interface CartAbandonedEvent extends BaseEvent {
  type: EventType.CART_ABANDONED;
  data: {
    userId: string;
    cartId: string;
    items: Array<{
      productId: string;
      productName: string;
      quantity: number;
      price: number;
    }>;
    totalValue: number;
    abandonedAt: string;
  };
}

// Notification Events
export interface EmailSentEvent extends BaseEvent {
  type: EventType.EMAIL_SENT;
  data: {
    to: string;
    subject: string;
    template: string;
    messageId: string;
    sentAt: string;
    status: 'sent' | 'delivered' | 'failed';
  };
}

export interface SMSSentEvent extends BaseEvent {
  type: EventType.SMS_SENT;
  data: {
    to: string;
    message: string;
    messageId: string;
    sentAt: string;
    status: 'sent' | 'delivered' | 'failed';
  };
}

// Union type for all events
export type Event = 
  | OrderCreatedEvent
  | OrderUpdatedEvent
  | OrderCancelledEvent
  | OrderShippedEvent
  | OrderDeliveredEvent
  | PaymentInitiatedEvent
  | PaymentCompletedEvent
  | PaymentFailedEvent
  | UserRegisteredEvent
  | UserLoginEvent
  | ProductCreatedEvent
  | ProductStockLowEvent
  | CartItemAddedEvent
  | CartAbandonedEvent
  | EmailSentEvent
  | SMSSentEvent;

// Event Handler Interface
export interface EventHandler<T extends Event = Event> {
  handle(event: T): Promise<void>;
  canHandle(eventType: EventType): boolean;
}

// Event Publisher Interface
export interface EventPublisher {
  publish(event: Event): Promise<void>;
  publishBatch(events: Event[]): Promise<void>;
}

// Event Subscriber Interface
export interface EventSubscriber {
  subscribe(eventType: EventType, handler: EventHandler): Promise<void>;
  unsubscribe(eventType: EventType, handler: EventHandler): Promise<void>;
}
