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

export interface CategoryResponse {
  categories: Category[];
  total: number;
  page: number;
  limit: number;
}
