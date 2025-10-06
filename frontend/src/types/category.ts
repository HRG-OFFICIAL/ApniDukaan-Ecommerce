export interface SubCategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent?: string;
  children: string[];
  level: number;
  path: string;
  isActive: boolean;
  sortOrder: number;
  seo: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
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
  children: string[];
  level: number;
  path: string;
  isActive: boolean;
  sortOrder: number;
  seo: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  createdAt: string;
  updatedAt: string;
  productCount?: number; // Virtual field
}

export interface CategoryResponse {
  categories: Category[];
  total: number;
  page: number;
  limit: number;
}
