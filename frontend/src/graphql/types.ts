// GraphQL Input Types
export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface UpdateProfileInput {
  name?: string;
  phone?: string;
  avatar?: string;
  preferences?: {
    newsletter?: boolean;
    notifications?: boolean;
    language?: string;
    currency?: string;
  };
}

export interface AddressInput {
  type: 'shipping' | 'billing';
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault?: boolean;
}

export interface CreateOrderInput {
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  shippingAddressId: string;
  billingAddressId?: string;
  paymentMethod: PaymentMethod;
  couponCode?: string;
}

export interface CreateReviewInput {
  productId: string;
  rating: number;
  comment: string;
}

export interface UpdateReviewInput {
  rating?: number;
  comment?: string;
}

export interface CreateProductInput {
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: string;
  stock: number;
  specifications?: Record<string, string | number | boolean>;
  isActive?: boolean;
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  price?: number;
  originalPrice?: number;
  images?: string[];
  category?: string;
  stock?: number;
  specifications?: Record<string, string | number | boolean>;
  isActive?: boolean;
}

// Filter and Sort Types
export interface ProductFilter {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  inStock?: boolean;
  isOnSale?: boolean;
  isBestseller?: boolean;
  isNew?: boolean;
}

export interface ProductSort {
  field: 'name' | 'price' | 'rating' | 'createdAt' | 'updatedAt';
  direction: 'ASC' | 'DESC';
}

export interface OrderFilter {
  status?: OrderStatus;
  dateFrom?: string;
  dateTo?: string;
  customerId?: string;
}

export interface OrderSort {
  field: 'createdAt' | 'updatedAt' | 'total' | 'status';
  direction: 'ASC' | 'DESC';
}

export interface UserFilter {
  role?: UserRole;
  isActive?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

export interface UserSort {
  field: 'name' | 'email' | 'createdAt' | 'lastLoginAt';
  direction: 'ASC' | 'DESC';
}

// Enum Types
export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  PAYPAL = 'PAYPAL',
  APPLE_PAY = 'APPLE_PAY',
  GOOGLE_PAY = 'GOOGLE_PAY',
  CASH_ON_DELIVERY = 'CASH_ON_DELIVERY'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  USER = 'USER',
  GUEST = 'GUEST'
}

export enum NotificationType {
  ORDER_UPDATE = 'ORDER_UPDATE',
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  SHIPMENT_UPDATE = 'SHIPMENT_UPDATE',
  PROMOTION = 'PROMOTION',
  SYSTEM = 'SYSTEM'
}

// Response Types
export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export interface CartResponse {
  id: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  itemCount: number;
}

export interface OrderResponse {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  items: OrderItem[];
  customer?: {
    id: string;
    name: string;
    email: string;
  };
  shippingAddress: Address;
  billingAddress?: Address;
  payment: Payment;
  tracking?: Tracking;
  createdAt: string;
  updatedAt: string;
}

// Entity Types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  addresses: Address[];
  preferences: UserPreferences;
  createdAt: string;
  lastLoginAt?: string;
}

export interface Address {
  id: string;
  type: 'shipping' | 'billing';
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

export interface UserPreferences {
  newsletter?: boolean;
  notifications?: boolean;
  language?: string;
  currency?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: string;
  subcategory?: string;
  rating: number;
  reviewCount: number;
  stock: number;
  sku?: string;
  isNew?: boolean;
  isBestseller?: boolean;
  isOnSale?: boolean;
  isFeatured?: boolean;
  isActive?: boolean;
  brand?: { name: string };
  tags?: string[];
  colors?: string[];
  sizes?: string[];
  inStock?: boolean;
  specifications?: Record<string, string | number | boolean>;
  reviews: Review[];
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  rating: number;
  comment: string;
  user: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt?: string;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  price: number;
}

export interface OrderItem {
  id: string;
  product: {
    id: string;
    name: string;
    images: string[];
  };
  quantity: number;
  price: number;
}

export interface Payment {
  method: PaymentMethod;
  status: string;
  transactionId?: string;
}

export interface Tracking {
  status: string;
  carrier: string;
  trackingNumber: string;
  estimatedDelivery?: string;
}

export interface WishlistItem {
  id: string;
  product: Product;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, string | number | boolean>;
  isRead: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalUsers: number;
  totalProducts: number;
  recentOrders: OrderResponse[];
  topProducts: Array<{
    id: string;
    name: string;
    sales: number;
    revenue: number;
  }>;
}

// Pagination Types
export interface PaginationInput {
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  hasMore: boolean;
  limit: number;
  offset: number;
}
