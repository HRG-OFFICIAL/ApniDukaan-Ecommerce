/**
 * API Configuration and Client
 * Handles all API calls to the backend services
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  message?: string;
  error?: string;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  sku: string;
  price: number;
  originalPrice?: number;
  currency: string;
  images: string[];
  thumbnailImage?: string;
  category: {
    _id: string;
    name: string;
    slug: string;
  };
  subcategory?: {
    _id: string;
    name: string;
    slug: string;
  };
  brand?: string;
  tags: string[];
  attributes: Array<{
    name: string;
    value: string;
  }>;
  inventory: {
    quantity: number;
    lowStockThreshold: number;
    trackQuantity: boolean;
    allowBackorder: boolean;
  };
  shipping: {
    weight: number;
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
    freeShipping: boolean;
    shippingClass?: string;
  };
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  status: 'draft' | 'published' | 'archived';
  featured: boolean;
  visibility: 'public' | 'private' | 'password';
  rating: {
    average: number;
    count: number;
  };
  sales: {
    totalSold: number;
    revenue: number;
  };
  isOnSale: boolean;
  saleStartDate?: string;
  saleEndDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent?: string;
  children?: string[];
  isActive: boolean;
  sortOrder: number;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilters {
  category?: string;
  subcategory?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
  status?: 'draft' | 'published' | 'archived';
  featured?: boolean;
  search?: string;
}

export interface ProductSort {
  field: 'name' | 'price' | 'rating' | 'createdAt' | 'sales';
  order: 'asc' | 'desc';
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      // Suppress noisy console errors; rethrow for caller handling
      throw error;
    }
  }

  // Products API
  async getProducts(
    filters: ProductFilters = {},
    sort: ProductSort = { field: 'createdAt', order: 'desc' },
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<Product[]>> {
    const params = new URLSearchParams();
    
    // Add filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          params.append(key, value.join(','));
        } else {
          params.append(key, String(value));
        }
      }
    });

    // Add pagination
    params.append('page', String(page));
    params.append('limit', String(limit));

    // Add sorting
    params.append('sortField', sort.field);
    params.append('sortOrder', sort.order);

    const response = await this.request<any>(`/api/catalog/products?${params.toString()}`);
    
    // Be robust to both gateway and service shapes
    // Possible shapes:
    // 1) { success, data: { products: Product[], pagination: {...} } }
    // 2) { success, data: Product[], pagination: {...} }
    // 3) { success, products: Product[], pagination: {...} }
    let products: Product[] = [];
    let pagination: any = undefined;
    const d = (response as any)?.data;
    const top = response as any;
    if (d && Array.isArray(d.products)) {
      products = d.products;
      pagination = d.pagination ?? top.pagination;
    } else if (Array.isArray(d)) {
      products = d;
      pagination = top.pagination;
    } else if (Array.isArray(top?.products)) {
      products = top.products;
      pagination = top.pagination;
    }

    return {
      success: !!response?.success,
      data: products,
      pagination,
      message: response?.message,
      error: response?.error
    };
  }

  async getProduct(id: string): Promise<ApiResponse<Product>> {
    return this.request<Product>(`/api/catalog/products/${id}`);
  }

  async getProductBySlug(slug: string): Promise<ApiResponse<Product>> {
    return this.request<Product>(`/api/catalog/products/slug/${slug}`);
  }

  async searchProducts(
    query: string,
    filters: ProductFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<Product[]>> {
    const response = await this.getProducts(
      { ...filters, search: query },
      { field: 'createdAt', order: 'desc' },
      page,
      limit
    );
    return response;
  }

  async getProductsBySkus(skus: string[]): Promise<ApiResponse<Product[]>> {
    const params = new URLSearchParams({ skus: skus.join(',') });
    return this.request<Product[]>(`/api/catalog/products/by-skus?${params.toString()}`);
  }

  async getProductsByIds(ids: string[]): Promise<ApiResponse<Product[]>> {
    const params = new URLSearchParams({ ids: ids.join(',') });
    return this.request<Product[]>(`/api/catalog/products/by-ids?${params.toString()}`);
  }

  // Categories API
  async getCategories(): Promise<ApiResponse<Category[]>> {
    return this.request<Category[]>('/api/catalog/categories');
  }

  async getCategory(id: string): Promise<ApiResponse<Category>> {
    return this.request<Category>(`/api/catalog/categories/${id}`);
  }

  async getCategoryBySlug(slug: string): Promise<ApiResponse<Category>> {
    return this.request<Category>(`/api/catalog/categories/slug/${slug}`);
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<{ status: string; services: any }>> {
    return this.request<{ status: string; services: any }>('/health');
  }
}

// Create API client instance
export const apiClient = new ApiClient(API_BASE_URL);

// Export individual API functions for convenience
export const productsApi = {
  getAll: (filters?: ProductFilters, sort?: ProductSort, page?: number, limit?: number) =>
    apiClient.getProducts(filters, sort, page, limit),
  getById: (id: string) => apiClient.getProduct(id),
  getBySlug: (slug: string) => apiClient.getProductBySlug(slug),
  getBySkus: async (skus: string[]): Promise<ApiResponse<Product[]>> => {
    return apiClient.getProductsBySkus(skus)
  },
  getByIds: async (ids: string[]): Promise<ApiResponse<Product[]>> => {
    return apiClient.getProductsByIds(ids)
  },
  search: (query: string, filters?: ProductFilters, page?: number, limit?: number) =>
    apiClient.searchProducts(query, filters, page, limit),
};

export const categoriesApi = {
  getAll: () => apiClient.getCategories(),
  getById: (id: string) => apiClient.getCategory(id),
  getBySlug: (slug: string) => apiClient.getCategoryBySlug(slug),
};

export const healthApi = {
  check: () => apiClient.healthCheck(),
};

// Additional interfaces for admin dashboard
export interface DashboardStats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  recentOrders: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalCategories: number;
  totalBrands: number;
  averageOrderValue: number;
  conversionRate: number;
  topSellingProducts: Array<{
    product: Product;
    totalSold: number;
    revenue: number;
  }>;
  recentUsers: User[];
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
  }>;
}

export interface OrderResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Order {
  _id: string;
  orderNumber: string;
  user: User;
  items: Array<{
    product: Product;
    quantity: number;
    price: number;
    total: number;
  }>;
  shippingAddress: Address;
  billingAddress: Address;
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  orderStatus: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  totalAmount: number;
  shippingCost: number;
  taxAmount: number;
  discountAmount: number;
  finalAmount: number;
  notes?: string;
  trackingNumber?: string;
  estimatedDelivery?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  _id: string;
  type: 'home' | 'work' | 'other' | 'shipping';
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
  landmark?: string;
  phone?: string;
}

export interface User {
  _id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  role: 'user' | 'admin' | 'moderator';
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isActive: boolean;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    currency: string;
    newsletter: boolean;
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
  };
  addresses: Address[];
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface UpdateProfileInput {
  name?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
    language?: string;
    currency?: string;
    newsletter?: boolean;
    notifications?: {
      email?: boolean;
      sms?: boolean;
      push?: boolean;
    };
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
  landmark?: string;
  phone?: string;
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

export interface CartItem {
  _id: string;
  product: Product;
  quantity: number;
  price: number;
  addedAt: Date;
}

export interface Cart {
  _id: string;
  userId: string;
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WishlistItem {
  id: string;
  product: {
    id: string;
    name: string;
    price: number;
    originalPrice?: number | null;
    images: string[];
    rating: number;
    reviewCount: number;
    stock: number;
    isOnSale: boolean;
  };
  createdAt: string;
}