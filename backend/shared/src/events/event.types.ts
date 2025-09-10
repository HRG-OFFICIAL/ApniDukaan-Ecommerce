export enum EventType {
  // User Events
  USER_REGISTERED = 'user.registered',
  USER_LOGIN = 'user.login',
  USER_LOGOUT = 'user.logout',
  USER_PROFILE_UPDATED = 'user.profile.updated',
  USER_PASSWORD_CHANGED = 'user.password.changed',
  USER_EMAIL_VERIFIED = 'user.email.verified',
  USER_DELETED = 'user.deleted',

  // Product Events
  PRODUCT_CREATED = 'product.created',
  PRODUCT_UPDATED = 'product.updated',
  PRODUCT_DELETED = 'product.deleted',
  PRODUCT_IMAGE_UPLOADED = 'product.image.uploaded',
  PRODUCT_IMAGE_DELETED = 'product.image.deleted',
  PRODUCT_INVENTORY_UPDATED = 'product.inventory.updated',
  PRODUCT_REVIEW_ADDED = 'product.review.added',
  PRODUCT_REVIEW_UPDATED = 'product.review.updated',
  PRODUCT_REVIEW_DELETED = 'product.review.deleted',

  // Category Events
  CATEGORY_CREATED = 'category.created',
  CATEGORY_UPDATED = 'category.updated',
  CATEGORY_DELETED = 'category.deleted',

  // Cart Events
  CART_ITEM_ADDED = 'cart.item.added',
  CART_ITEM_UPDATED = 'cart.item.updated',
  CART_ITEM_REMOVED = 'cart.item.removed',
  CART_CLEARED = 'cart.cleared',
  CART_ABANDONED = 'cart.abandoned',

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

  // Notification Events
  NOTIFICATION_SENT = 'notification.sent',
  NOTIFICATION_DELIVERED = 'notification.delivered',
  NOTIFICATION_FAILED = 'notification.failed',

  // System Events
  SYSTEM_ERROR = 'system.error',
  SYSTEM_WARNING = 'system.warning',
  SYSTEM_MAINTENANCE = 'system.maintenance',
}

export enum EventStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface EventMetadata {
  [key: string]: any;
  publishedAt?: string;
  publisher?: string;
  correlationId?: string;
  traceId?: string;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface Event {
  id: string;
  type: EventType;
  status: EventStatus;
  source: string;
  version: string;
  timestamp: string;
  data: any;
  metadata: EventMetadata;
}

export interface EventHandler {
  handle(event: Event): Promise<void>;
}

export interface EventSubscription {
  eventType: EventType;
  handler: EventHandler;
  priority?: number;
}

// Event data interfaces
export interface UserEventData {
  userId: string;
  email: string;
  role?: string;
  profile?: any;
}

export interface ProductEventData {
  productId: string;
  name: string;
  sku: string;
  category?: string;
  brand?: string;
  price?: number;
  inventory?: {
    quantity: number;
    lowStockThreshold: number;
  };
}

export interface CartEventData {
  userId: string;
  cartId: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  total: number;
}

export interface OrderEventData {
  orderId: string;
  userId: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  status: string;
  shippingAddress?: any;
  billingAddress?: any;
}

export interface PaymentEventData {
  paymentId: string;
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  transactionId?: string;
}

export interface NotificationEventData {
  notificationId: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  channel: string;
  status: string;
}

// Event factory functions
export const createEvent = (
  type: EventType,
  data: any,
  metadata: EventMetadata = {}
): Event => ({
  id: generateEventId(),
  type,
  status: EventStatus.PENDING,
  source: process.env.SERVICE_NAME || 'unknown',
  version: '1.0.0',
  timestamp: new Date().toISOString(),
  data,
  metadata: {
    ...metadata,
    publishedAt: new Date().toISOString(),
    publisher: process.env.SERVICE_NAME || 'unknown',
  },
});

export const generateEventId = (): string => {
  return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Event validation
export const isValidEvent = (event: any): event is Event => {
  return (
    event &&
    typeof event.id === 'string' &&
    Object.values(EventType).includes(event.type) &&
    Object.values(EventStatus).includes(event.status) &&
    typeof event.source === 'string' &&
    typeof event.version === 'string' &&
    typeof event.timestamp === 'string' &&
    typeof event.data === 'object' &&
    typeof event.metadata === 'object'
  );
};

// Event filtering
export const filterEventsByType = (events: Event[], type: EventType): Event[] => {
  return events.filter(event => event.type === type);
};

export const filterEventsByStatus = (events: Event[], status: EventStatus): Event[] => {
  return events.filter(event => event.status === status);
};

export const filterEventsByUser = (events: Event[], userId: string): Event[] => {
  return events.filter(event => event.metadata.userId === userId);
};

// Event sorting
export const sortEventsByTimestamp = (events: Event[], ascending: boolean = true): Event[] => {
  return events.sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return ascending ? timeA - timeB : timeB - timeA;
  });
};

// Event aggregation
export const groupEventsByType = (events: Event[]): Map<EventType, Event[]> => {
  const grouped = new Map<EventType, Event[]>();
  
  events.forEach(event => {
    if (!grouped.has(event.type)) {
      grouped.set(event.type, []);
    }
    grouped.get(event.type)!.push(event);
  });
  
  return grouped;
};

export const getEventCounts = (events: Event[]): Map<EventType, number> => {
  const counts = new Map<EventType, number>();
  
  events.forEach(event => {
    const current = counts.get(event.type) || 0;
    counts.set(event.type, current + 1);
  });
  
  return counts;
};
