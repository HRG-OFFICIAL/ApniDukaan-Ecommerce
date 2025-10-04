const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://apnidukaan-api-gateway.onrender.com';

// Import Product type from graphql/types
import { Product } from '../graphql/types';

interface ProductResponse {
  success: boolean;
  data: {
    products: Product[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  error?: string;
}

interface Category {
  id: string;
  name: string;
  count?: number;
  image?: string;
}

interface CategoryResponse {
  success: boolean;
  data: Category[];
  error?: string;
}

class ProductService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  async getProducts(params: {
    page?: number;
    limit?: number;
    category?: string;
    sortField?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
  } = {}): Promise<ProductResponse> {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.category) searchParams.set('category', params.category);
    if (params.sortField) searchParams.set('sortField', params.sortField);
    if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);
    if (params.search) searchParams.set('search', params.search);

    const queryString = searchParams.toString();
    const endpoint = `/api/catalog/products${queryString ? `?${queryString}` : ''}`;
    
    return this.request<ProductResponse>(endpoint);
  }

  async getProduct(id: string): Promise<{ success: boolean; data: Product; error?: string }> {
    return this.request<{ success: boolean; data: Product; error?: string }>(`/api/catalog/products/${id}`);
  }

  async getCategories(): Promise<CategoryResponse> {
    return this.request<CategoryResponse>('/api/catalog/categories');
  }

  async searchProducts(query: string, params: {
    page?: number;
    limit?: number;
    category?: string;
  } = {}): Promise<ProductResponse> {
    return this.getProducts({
      ...params,
      search: query,
    });
  }

  async getProductsByCategory(category: string, params: {
    page?: number;
    limit?: number;
    sortField?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<ProductResponse> {
    return this.getProducts({
      ...params,
      category,
    });
  }

  async getFeaturedProducts(limit: number = 8): Promise<ProductResponse> {
    return this.getProducts({
      page: 1,
      limit,
      sortField: 'rating',
      sortOrder: 'desc',
    });
  }

  async getNewArrivals(limit: number = 12): Promise<ProductResponse> {
    return this.getProducts({
      page: 1,
      limit,
      sortField: 'createdAt',
      sortOrder: 'desc',
    });
  }

  async getDeals(limit: number = 12): Promise<ProductResponse> {
    return this.getProducts({
      page: 1,
      limit,
      sortField: 'discount',
      sortOrder: 'desc',
    });
  }
}

export const productService = new ProductService();
export default productService;

// Export types for use in components
export type { Product, Category, ProductResponse, CategoryResponse };
