const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface SearchOptions {
  query?: string;
  page?: number;
  limit?: number;
  filters?: {
    categories?: string[];
    brands?: string[];
    priceRange?: [number, number];
    rating?: number;
    availability?: 'all' | 'in-stock' | 'out-of-stock';
  };
  sortBy?: 'relevance' | 'price-asc' | 'price-desc' | 'rating' | 'newest';
}

export interface SearchResult {
  products: any[];
  total: number;
  suggestions: string[];
  facets: {
    categories: Array<{ name: string; count: number }>;
    brands: Array<{ name: string; count: number }>;
    priceRanges: Array<{ min: number; max: number; count: number }>;
  };
}

export interface SearchSuggestion {
  id: string;
  text: string;
  type: 'product' | 'category' | 'brand';
  count?: number;
}

class SearchService {
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
      console.error(`Search API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  async searchProducts(options: SearchOptions = {}): Promise<SearchResult> {
    const {
      query = '',
      page = 1,
      limit = 12,
      filters = {},
      sortBy = 'relevance'
    } = options;

    const searchParams = new URLSearchParams();
    if (query) searchParams.set('query', query);
    if (page) searchParams.set('page', page.toString());
    if (limit) searchParams.set('limit', limit.toString());
    if (sortBy) searchParams.set('sortBy', sortBy);
    
    // Add filters
    if (filters.categories?.length) {
      searchParams.set('categories', filters.categories.join(','));
    }
    if (filters.brands?.length) {
      searchParams.set('brands', filters.brands.join(','));
    }
    if (filters.priceRange) {
      searchParams.set('minPrice', filters.priceRange[0].toString());
      searchParams.set('maxPrice', filters.priceRange[1].toString());
    }
    if (filters.rating) {
      searchParams.set('rating', filters.rating.toString());
    }
    if (filters.availability) {
      searchParams.set('availability', filters.availability);
    }

    const queryString = searchParams.toString();
    const endpoint = `/api/search/products${queryString ? `?${queryString}` : ''}`;
    
    return this.request<SearchResult>(endpoint);
  }

  async getSearchSuggestions(query: string): Promise<SearchSuggestion[]> {
    if (!query || query.length < 2) return [];
    
    try {
      const response = await this.request<{ suggestions: SearchSuggestion[] }>(
        `/api/search/suggestions?query=${encodeURIComponent(query)}`
      );
      return response.suggestions || [];
    } catch (error) {
      console.error('Failed to get search suggestions:', error);
      return [];
    }
  }

  async getTrendingSearches(): Promise<string[]> {
    try {
      const response = await this.request<{ trending: string[] }>(
        '/api/search/trending'
      );
      return response.trending || [];
    } catch (error) {
      console.error('Failed to get trending searches:', error);
      return [];
    }
  }

  async getSearchHistory(): Promise<string[]> {
    try {
      const response = await this.request<{ history: string[] }>(
        '/api/search/history'
      );
      return response.history || [];
    } catch (error) {
      console.error('Failed to get search history:', error);
      return [];
    }
  }

  async saveSearchQuery(query: string): Promise<void> {
    try {
      await this.request('/api/search/history', {
        method: 'POST',
        body: JSON.stringify({ query })
      });
    } catch (error) {
      console.error('Failed to save search query:', error);
    }
  }

  async getPopularCategories(): Promise<Array<{ name: string; count: number; slug: string }>> {
    try {
      const response = await this.request<{ categories: Array<{ name: string; count: number; slug: string }> }>(
        '/api/search/categories/popular'
      );
      return response.categories || [];
    } catch (error) {
      console.error('Failed to get popular categories:', error);
      return [];
    }
  }

  async getPopularBrands(): Promise<Array<{ name: string; count: number; logo?: string }>> {
    try {
      const response = await this.request<{ brands: Array<{ name: string; count: number; logo?: string }> }>(
        '/api/search/brands/popular'
      );
      return response.brands || [];
    } catch (error) {
      console.error('Failed to get popular brands:', error);
      return [];
    }
  }
}

export const searchService = new SearchService();
export default searchService;
