import { Document, Model } from 'mongoose';

export interface ICartItem {
  productId: string;
  variantId?: string;
  quantity: number;
  price: number;
  originalPrice: number;
  name: string;
  image?: string;
  sku: string;
  weight?: number;
  attributes?: {
    [key: string]: string;
  };
  addedAt: Date;
  updatedAt: Date;
}

export interface ICartDiscount {
  code: string;
  type: 'percentage' | 'fixed' | 'shipping';
  value: number;
  description: string;
  appliedAt: Date;
  minimumAmount?: number;
  maximumDiscount?: number;
}

export interface ICartTotals {
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
}

export interface ICart extends Document {
  _id: string;
  userId?: string;
  sessionId?: string;
  items: ICartItem[];
  totals: ICartTotals;
  discount?: ICartDiscount;
  currency: string;
  status: 'active' | 'abandoned' | 'converted' | 'expired';
  metadata?: {
    userAgent?: string;
    ipAddress?: string;
    referrer?: string;
    [key: string]: any;
  };
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  calculateTotals(): void;
  addItem(item: Omit<ICartItem, 'addedAt' | 'updatedAt'>): Promise<ICart>;
  updateItem(productId: string, variantId: string | undefined, quantity: number): Promise<ICart>;
  removeItem(productId: string, variantId?: string): Promise<ICart>;
  clear(): Promise<ICart>;
  applyDiscount(discount: ICartDiscount): Promise<ICart>;
  removeDiscount(): Promise<ICart>;
}

export interface ICartModel extends Model<ICart> {
  findActiveCart(userId?: string, sessionId?: string): Promise<ICart | null>;
  findAbandonedCarts(hoursAgo?: number): Promise<ICart[]>;
  cleanupExpiredCarts(): Promise<any>;
}

export interface ICartItemUpdate {
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface IAddToCartRequest {
  productId: string;
  variantId?: string;
  quantity: number;
  attributes?: {
    [key: string]: string;
  };
}

export interface IUpdateCartItemRequest {
  quantity: number;
}

export interface IApplyDiscountRequest {
  code: string;
}

export interface ICartResponse {
  cart: ICart;
  message?: string;
}

export interface ICartSummary {
  itemCount: number;
  totalItems: number;
  subtotal: number;
  total: number;
  currency: string;
  hasDiscount: boolean;
  discountAmount?: number;
}

export interface ICartValidationResult {
  isValid: boolean;
  errors: Array<{
    itemId: string;
    productId: string;
    error: string;
    code: string;
  }>;
  updatedCart?: ICart;
}

export interface ICartMergeOptions {
  strategy: 'guest_priority' | 'user_priority' | 'combine_quantities';
  keepGuestCart: boolean;
}

export interface IShippingCalculation {
  weight: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  destination: {
    country: string;
    state?: string;
    postalCode?: string;
  };
  method?: string;
}

export interface ICartAnalytics {
  cartId: string;
  userId?: string;
  sessionId?: string;
  event: 'created' | 'item_added' | 'item_removed' | 'item_updated' | 'discount_applied' | 'abandoned' | 'converted';
  productId?: string;
  quantity?: number;
  value?: number;
  timestamp: Date;
  metadata?: {
    [key: string]: any;
  };
}

export interface ICartServiceConfig {
  defaultCurrency: string;
  sessionTTL: number; // in seconds
  abandonedCartThreshold: number; // in hours
  maxItemsPerCart: number;
  taxRate: number;
  freeShippingThreshold: number;
  enableGuestCheckout: boolean;
  enableCartAnalytics: boolean;
}

export type CartEventType = 
  | 'cart:created'
  | 'cart:item_added'
  | 'cart:item_removed' 
  | 'cart:item_updated'
  | 'cart:discount_applied'
  | 'cart:discount_removed'
  | 'cart:abandoned'
  | 'cart:converted'
  | 'cart:merged';

export interface ICartEvent {
  type: CartEventType;
  cartId: string;
  userId?: string;
  sessionId?: string;
  data: {
    [key: string]: any;
  };
  timestamp: Date;
}
