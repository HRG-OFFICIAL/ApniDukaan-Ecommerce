// GraphQL types removed - using REST API instead
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  description: string;
  images: string[];
  category: string;
  brand: string;
  rating: number;
  reviewCount: number;
  stock: number;
  isNew?: boolean;
  isBestseller?: boolean;
  deliveryInfo?: {
    freeShipping: boolean;
    estimatedDays: number;
    expressAvailable: boolean;
    codAvailable: boolean;
  };
}

export interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  items: any[];
  createdAt: string;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface WishlistItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  addedAt: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export interface UpdateProfileInput {
  name?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  preferences?: {
    newsletter?: boolean;
    notifications?: boolean;
    theme?: string;
    language?: string;
    currency?: string;
  };
}

export interface AddressInput {
  type: 'home' | 'work' | 'other' | 'shipping';
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault?: boolean;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  currency: string;
  newsletter: boolean;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}

export interface Address {
  id: string;
  type: 'home' | 'work' | 'other' | 'shipping';
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

export interface DashboardStats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
}

export interface OrderResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
