/**
 * API Configuration and Client
 * Handles all API calls to the backend services
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

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
      console.error('API request failed:', error);
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

    return this.request<Product[]>(`/api/catalog/products?${params.toString()}`);
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
    return this.getProducts(
      { ...filters, search: query },
      { field: 'createdAt', order: 'desc' },
      page,
      limit
    );
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
