/**
 * Enhanced API Configuration with Retry Logic and Cold Start Handling
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

export interface ProductFilters {
  category?: string;
  subcategory?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  tags?: string[];
  search?: string;
}

export interface ProductSort {
  field: string;
  order: 'asc' | 'desc';
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
    reserved: number;
    available: number;
  };
  isActive: boolean;
  isFeatured: boolean;
  rating?: {
    average: number;
    count: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
  image?: string;
  parent?: string;
  isActive: boolean;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

class EnhancedApiClient {
  private baseURL: string;
  private retryConfig = {
    maxRetries: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 10000, // 10 seconds
    retryCondition: (error: any) => {
      // Retry on network errors, timeouts, and 5xx errors
      return (
        !error.response ||
        error.response.status >= 500 ||
        error.code === 'NETWORK_ERROR' ||
        error.code === 'TIMEOUT'
      );
    }
  };

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private calculateDelay(attempt: number): number {
    // Exponential backoff with jitter
    const exponentialDelay = this.retryConfig.baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 1000; // Add up to 1 second of jitter
    return Math.min(exponentialDelay + jitter, this.retryConfig.maxDelay);
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    let lastError: any;

    for (let attempt = 1; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        console.log(`[API] Attempt ${attempt}/${this.retryConfig.maxRetries} - ${endpoint}`);
        
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        const response = await fetch(url, {
          ...config,
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const error = new Error(`HTTP error! status: ${response.status}`);
          (error as any).response = response;
          (error as any).status = response.status;
          throw error;
        }

        const data = await response.json();
        console.log(`[API] Success on attempt ${attempt} - ${endpoint}`);
        return data;
      } catch (error: any) {
        lastError = error;
        console.error(`[API] Attempt ${attempt} failed:`, error);
        
        // Check if we should retry
        if (attempt === this.retryConfig.maxRetries || !this.retryConfig.retryCondition(error)) {
          console.error('API request failed after all retries:', error);
          break;
        }
        
        // Wait before retrying
        const delay = this.calculateDelay(attempt);
        console.log(`[API] Retrying in ${delay}ms...`);
        await this.sleep(delay);
      }
    }

    // If we get here, all retries failed
    throw lastError || new Error('API request failed');
  }

  // Products API with enhanced error handling
  async getProducts(
    filters: ProductFilters = {},
    sort: ProductSort = { field: 'createdAt', order: 'desc' },
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<Product[]>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortField: sort.field,
      sortOrder: sort.order,
      ...Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== undefined)
      )
    });

    return this.request<Product[]>(`/api/catalog/products?${params}`);
  }

  async getProductById(id: string): Promise<ApiResponse<Product>> {
    return this.request<Product>(`/api/catalog/products/${id}`);
  }

  async getProductsByIds(ids: string[]): Promise<ApiResponse<Product[]>> {
    const params = new URLSearchParams({
      ids: ids.join(',')
    });

    return this.request<Product[]>(`/api/catalog/products/by-ids?${params}`);
  }

  async getFeaturedProducts(limit: number = 10): Promise<ApiResponse<Product[]>> {
    return this.request<Product[]>(`/api/catalog/products/featured?limit=${limit}`);
  }

  async getRelatedProducts(productId: string, limit: number = 5): Promise<ApiResponse<Product[]>> {
    return this.request<Product[]>(`/api/catalog/products/${productId}/related?limit=${limit}`);
  }

  // Categories API
  async getCategories(): Promise<ApiResponse<Category[]>> {
    return this.request<Category[]>('/api/catalog/categories');
  }

  async getCategoryById(id: string): Promise<ApiResponse<Category>> {
    return this.request<Category>(`/api/catalog/categories/${id}`);
  }

  async getCategoryBySlug(slug: string): Promise<ApiResponse<Category>> {
    return this.request<Category>(`/api/catalog/categories/slug/${slug}`);
  }

  // Search API
  async searchProducts(query: string, filters: ProductFilters = {}): Promise<ApiResponse<Product[]>> {
    const params = new URLSearchParams({
      q: query,
      ...Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== undefined)
      )
    });

    return this.request<Product[]>(`/api/catalog/search?${params}`);
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return this.request<{ status: string; timestamp: string }>('/health');
  }

  // Cart API
  async getCart(userId?: string): Promise<ApiResponse<any>> {
    const params = userId ? `?userId=${userId}` : '';
    return this.request<any>(`/api/cart${params}`);
  }

  async addToCart(item: any): Promise<ApiResponse<any>> {
    return this.request<any>('/api/cart/add', {
      method: 'POST',
      body: JSON.stringify(item)
    });
  }

  async updateCartItem(itemId: string, quantity: number): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/cart/update/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity })
    });
  }

  async removeFromCart(itemId: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/cart/remove/${itemId}`, {
      method: 'DELETE'
    });
  }

  async clearCart(): Promise<ApiResponse<any>> {
    return this.request<any>('/api/cart/clear', {
      method: 'DELETE'
    });
  }

  // Orders API
  async createOrder(orderData: any): Promise<ApiResponse<any>> {
    return this.request<any>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  }

  async getOrder(orderId: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/orders/${orderId}`);
  }

  async getUserOrders(userId: string): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`/api/orders/user/${userId}`);
  }

  // Payment API
  async createPaymentIntent(amount: number, currency: string = 'INR'): Promise<ApiResponse<any>> {
    return this.request<any>('/api/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify({ amount, currency })
    });
  }

  async confirmPayment(paymentId: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/payments/confirm/${paymentId}`, {
      method: 'POST'
    });
  }
}

// Export singleton instance
export const apiClient = new EnhancedApiClient(API_BASE_URL);

// Export individual API modules for convenience
export const productsApi = {
  getProducts: (filters?: ProductFilters, sort?: ProductSort, page?: number, limit?: number) =>
    apiClient.getProducts(filters, sort, page, limit),
  getProductById: (id: string) => apiClient.getProductById(id),
  getProductsByIds: (ids: string[]) => apiClient.getProductsByIds(ids),
  getFeaturedProducts: (limit?: number) => apiClient.getFeaturedProducts(limit),
  getRelatedProducts: (productId: string, limit?: number) => apiClient.getRelatedProducts(productId, limit),
  searchProducts: (query: string, filters?: ProductFilters) => apiClient.searchProducts(query, filters)
};

export const categoriesApi = {
  getCategories: () => apiClient.getCategories(),
  getCategoryById: (id: string) => apiClient.getCategoryById(id),
  getCategoryBySlug: (slug: string) => apiClient.getCategoryBySlug(slug)
};

export const cartApi = {
  getCart: (userId?: string) => apiClient.getCart(userId),
  addToCart: (item: any) => apiClient.addToCart(item),
  updateCartItem: (itemId: string, quantity: number) => apiClient.updateCartItem(itemId, quantity),
  removeFromCart: (itemId: string) => apiClient.removeFromCart(itemId),
  clearCart: () => apiClient.clearCart()
};

export const ordersApi = {
  createOrder: (orderData: any) => apiClient.createOrder(orderData),
  getOrder: (orderId: string) => apiClient.getOrder(orderId),
  getUserOrders: (userId: string) => apiClient.getUserOrders(userId)
};

export const paymentsApi = {
  createPaymentIntent: (amount: number, currency?: string) => apiClient.createPaymentIntent(amount, currency),
  confirmPayment: (paymentId: string) => apiClient.confirmPayment(paymentId)
};

export default apiClient;
