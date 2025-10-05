import type { Category as CategoryType } from '@/types/category';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface SubCategory {
  name: string;
  slug: string;
  description: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  children: SubCategory[];
  isActive: boolean;
  sortOrder: number;
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export class CategoryService {
  private static instance: CategoryService;
  private categories: Category[] = [];
  private lastFetch: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  public static getInstance(): CategoryService {
    if (!CategoryService.instance) {
      CategoryService.instance = new CategoryService();
    }
    return CategoryService.instance;
  }

  public async getCategories(forceRefresh: boolean = false): Promise<Category[]> {
    const now = Date.now();
    
    // Return cached data if still fresh and not forcing refresh
    if (!forceRefresh && this.categories.length > 0 && (now - this.lastFetch) < this.CACHE_DURATION) {
      return this.categories;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/categories`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store', // Always fetch fresh data from server
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.statusText}`);
      }

      const data = await response.json();
      this.categories = data.categories || data; // Handle different response formats
      this.lastFetch = now;
      
      return this.categories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      
      // Return cached data if available, even if stale
      if (this.categories.length > 0) {
        console.warn('Using stale category data due to fetch error');
        return this.categories;
      }
      
      throw error;
    }
  }

  public async getCategoryBySlug(slug: string): Promise<Category | null> {
    const categories = await this.getCategories();
    return categories.find(cat => cat.slug === slug) || null;
  }

  public async getSubCategoryBySlug(categorySlug: string, subCategorySlug: string): Promise<SubCategory | null> {
    const category = await this.getCategoryBySlug(categorySlug);
    if (!category) return null;
    
    return category.children.find(child => child.slug === subCategorySlug) || null;
  }

  public getActiveCategories(): Category[] {
    return this.categories.filter(cat => cat.isActive);
  }

  public getCategoriesSorted(): Category[] {
    return this.categories
      .filter(cat => cat.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  public clearCache(): void {
    this.categories = [];
    this.lastFetch = 0;
  }
}

export default CategoryService;
