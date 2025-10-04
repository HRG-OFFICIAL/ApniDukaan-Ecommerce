import { logger } from '@apnidukaan/shared';

export interface SearchFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  brand?: string;
  rating?: number;
  inStock?: boolean;
}

export interface SearchOptions {
  query: string;
  page: number;
  limit: number;
  filters?: SearchFilters;
  sortBy?: string;
}

export interface SearchResult {
  products: any[];
  total: number;
  suggestions: string[];
  facets: {
    categories: Array<{ name: string; count: number }>;
    priceRanges: Array<{ range: string; count: number }>;
    brands: Array<{ name: string; count: number }>;
  };
}

export class SearchService {
  private searchIndex: Map<string, any> = new Map();
  private searchHistory: Map<string, number> = new Map();

  constructor() {
    // Initialize with some mock data for development
    this.initializeMockData();
  }

  private initializeMockData(): void {
    const mockProducts = [
      {
        id: '1',
        name: 'Wireless Bluetooth Headphones',
        description: 'High-quality wireless headphones with noise cancellation',
        price: 2999,
        category: 'Electronics',
        brand: 'TechSound',
        rating: 4.5,
        inStock: true,
        tags: ['wireless', 'bluetooth', 'headphones', 'noise-cancellation']
      },
      {
        id: '2',
        name: 'Smartphone Case',
        description: 'Protective case for smartphones with shock absorption',
        price: 499,
        category: 'Electronics',
        brand: 'ProtectPro',
        rating: 4.2,
        inStock: true,
        tags: ['case', 'protection', 'smartphone', 'shock-absorption']
      },
      {
        id: '3',
        name: 'Cotton T-Shirt',
        description: 'Comfortable cotton t-shirt in various colors',
        price: 299,
        category: 'Clothing',
        brand: 'ComfortWear',
        rating: 4.0,
        inStock: true,
        tags: ['cotton', 't-shirt', 'comfortable', 'casual']
      },
      {
        id: '4',
        name: 'Digital Camera',
        description: 'Professional digital camera with 24MP sensor',
        price: 45999,
        category: 'Photography',
        brand: 'PhotoPro',
        rating: 4.8,
        inStock: true,
        tags: ['camera', 'digital', 'professional', '24mp']
      },
      {
        id: '5',
        name: 'Office Chair',
        description: 'Ergonomic office chair with lumbar support',
        price: 8999,
        category: 'Furniture',
        brand: 'ComfortSeat',
        rating: 4.3,
        inStock: true,
        tags: ['chair', 'office', 'ergonomic', 'lumbar-support']
      }
    ];

    // Index mock products
    mockProducts.forEach(product => {
      this.indexProduct(product.id, product);
    });
  }

  async searchProducts(options: SearchOptions): Promise<SearchResult> {
    try {
      const { query, page, limit, filters = {}, sortBy = 'relevance' } = options;
      
      // Track search query
      this.trackSearchQuery(query);

      // Get all products from index
      let products = Array.from(this.searchIndex.values());

      // Apply text search
      if (query) {
        products = this.performTextSearch(products, query);
      }

      // Apply filters
      products = this.applyFilters(products, filters);

      // Apply sorting
      products = this.applySorting(products, sortBy);

      // Get total count before pagination
      const total = products.length;

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      products = products.slice(startIndex, endIndex);

      // Generate suggestions
      const suggestions = this.generateSuggestions(query);

      // Generate facets
      const facets = this.generateFacets(Array.from(this.searchIndex.values()), filters);

      logger.info('Product search completed', {
        query,
        total,
        page,
        limit,
        filters,
        sortBy,
        action: 'product_search_completed'
      });

      return {
        products,
        total,
        suggestions,
        facets
      };
    } catch (error: any) {
      logger.error('Product search failed', {
        error: error.message,
        options,
        action: 'product_search_failed'
      });
      throw error;
    }
  }

  private performTextSearch(products: any[], query: string): any[] {
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
    
    return products.filter(product => {
      const searchableText = [
        product.name,
        product.description,
        product.category,
        product.brand,
        ...(product.tags || [])
      ].join(' ').toLowerCase();

      return searchTerms.some(term => searchableText.includes(term));
    });
  }

  private applyFilters(products: any[], filters: SearchFilters): any[] {
    return products.filter(product => {
      if (filters.category && product.category !== filters.category) {
        return false;
      }
      if (filters.minPrice && product.price < filters.minPrice) {
        return false;
      }
      if (filters.maxPrice && product.price > filters.maxPrice) {
        return false;
      }
      if (filters.brand && product.brand !== filters.brand) {
        return false;
      }
      if (filters.rating && product.rating < filters.rating) {
        return false;
      }
      if (filters.inStock !== undefined && product.inStock !== filters.inStock) {
        return false;
      }
      return true;
    });
  }

  private applySorting(products: any[], sortBy: string): any[] {
    switch (sortBy) {
      case 'price_asc':
        return products.sort((a, b) => a.price - b.price);
      case 'price_desc':
        return products.sort((a, b) => b.price - a.price);
      case 'rating':
        return products.sort((a, b) => b.rating - a.rating);
      case 'newest':
        return products.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      case 'relevance':
      default:
        // For relevance, we could implement a more sophisticated scoring algorithm
        return products;
    }
  }

  private generateSuggestions(query: string): string[] {
    const suggestions = new Set<string>();
    const searchTerms = query.toLowerCase().split(' ');

    // Get suggestions from product names and categories
    this.searchIndex.forEach(product => {
      const nameWords = product.name.toLowerCase().split(' ');
      const categoryWords = product.category.toLowerCase().split(' ');
      
      [...nameWords, ...categoryWords].forEach(word => {
        if (word.length > 2 && searchTerms.some(term => word.includes(term))) {
          suggestions.add(word);
        }
      });
    });

    return Array.from(suggestions).slice(0, 5);
  }

  private generateFacets(products: any[], appliedFilters: SearchFilters) {
    const categories = new Map<string, number>();
    const brands = new Map<string, number>();
    const priceRanges = new Map<string, number>();

    products.forEach(product => {
      // Count categories
      categories.set(product.category, (categories.get(product.category) || 0) + 1);
      
      // Count brands
      brands.set(product.brand, (brands.get(product.brand) || 0) + 1);
      
      // Count price ranges
      const priceRange = this.getPriceRange(product.price);
      priceRanges.set(priceRange, (priceRanges.get(priceRange) || 0) + 1);
    });

    return {
      categories: Array.from(categories.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      brands: Array.from(brands.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      priceRanges: Array.from(priceRanges.entries())
        .map(([range, count]) => ({ range, count }))
        .sort((a, b) => a.range.localeCompare(b.range))
    };
  }

  private getPriceRange(price: number): string {
    if (price < 500) return 'Under ₹500';
    if (price < 1000) return '₹500 - ₹1000';
    if (price < 5000) return '₹1000 - ₹5000';
    if (price < 10000) return '₹5000 - ₹10000';
    if (price < 25000) return '₹10000 - ₹25000';
    return 'Above ₹25000';
  }

  private trackSearchQuery(query: string): void {
    const normalizedQuery = query.toLowerCase().trim();
    if (normalizedQuery.length > 0) {
      this.searchHistory.set(normalizedQuery, (this.searchHistory.get(normalizedQuery) || 0) + 1);
    }
  }

  async getSearchSuggestions(query: string, limit: number = 5): Promise<string[]> {
    try {
      const suggestions = new Set<string>();
      const searchTerms = query.toLowerCase().split(' ');

      // Get suggestions from search history
      this.searchHistory.forEach((count, searchQuery) => {
        if (searchTerms.some(term => searchQuery.includes(term))) {
          suggestions.add(searchQuery);
        }
      });

      // Get suggestions from product data
      this.searchIndex.forEach(product => {
        const nameWords = product.name.toLowerCase().split(' ');
        const categoryWords = product.category.toLowerCase().split(' ');
        
        [...nameWords, ...categoryWords].forEach(word => {
          if (word.length > 2 && searchTerms.some(term => word.includes(term))) {
            suggestions.add(word);
          }
        });
      });

      return Array.from(suggestions).slice(0, limit);
    } catch (error: any) {
      logger.error('Failed to get search suggestions', {
        error: error.message,
        query,
        action: 'search_suggestions_failed'
      });
      return [];
    }
  }

  async indexProduct(productId: string, productData: any): Promise<void> {
    try {
      // Add searchable fields
      const indexedProduct = {
        ...productData,
        id: productId,
        searchableText: [
          productData.name,
          productData.description,
          productData.category,
          productData.brand,
          ...(productData.tags || [])
        ].join(' ').toLowerCase()
      };

      this.searchIndex.set(productId, indexedProduct);

      logger.info('Product indexed successfully', {
        productId,
        productName: productData.name,
        action: 'product_indexed'
      });
    } catch (error: any) {
      logger.error('Failed to index product', {
        error: error.message,
        productId,
        action: 'product_indexing_failed'
      });
      throw error;
    }
  }

  async removeProduct(productId: string): Promise<void> {
    try {
      this.searchIndex.delete(productId);

      logger.info('Product removed from index', {
        productId,
        action: 'product_removed_from_index'
      });
    } catch (error: any) {
      logger.error('Failed to remove product from index', {
        error: error.message,
        productId,
        action: 'product_removal_failed'
      });
      throw error;
    }
  }

  async getPopularSearches(limit: number = 10): Promise<Array<{ query: string; count: number }>> {
    try {
      return Array.from(this.searchHistory.entries())
        .map(([query, count]) => ({ query, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    } catch (error: any) {
      logger.error('Failed to get popular searches', {
        error: error.message,
        action: 'popular_searches_failed'
      });
      return [];
    }
  }
}

export default SearchService;
