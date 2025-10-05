// Product Variant Interface
export interface ProductVariant {
  name: string;
  options: string[];
  selected?: string;
}

// Product Rating Interface
export interface ProductRating {
  average: number;
  count: number;
  breakdown: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

// Product Dimensions Interface
export interface ProductDimensions {
  length?: number;
  width?: number;
  height?: number;
  weight?: number;
  unit?: string;
}

// Product SEO Interface
export interface ProductSEO {
  title?: string;
  description?: string;
  keywords?: string[];
}

// Product Shipping Info Interface
export interface ProductShippingInfo {
  weight?: number;
  dimensions?: ProductDimensions;
  shippingClass?: string;
}

// Main Product Interface
export interface Product {
  _id: string;
  
  // Basic Info
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  sku: string;
  barcode?: string;
  brand?: string;
  model?: string;
  
  // Pricing
  price: number;
  originalPrice?: number;
  costPrice?: number;
  currency: string;
  
  // Inventory
  stock: number;
  minStock?: number;
  maxStock?: number;
  trackInventory: boolean;
  
  // Categories
  category: string; // Category ID or category name if not mapped
  categoryName?: string; // Resolved category display name (from backend)
  subCategory?: string;
  tags?: string[];
  
  // Media
  images: string[];
  thumbnail?: string;
  videos?: string[];
  
  // Specifications
  specifications?: Record<string, any>;
  dimensions?: ProductDimensions;
  
  // SEO
  seo?: ProductSEO;
  
  // Status & Visibility
  isActive: boolean;
  isFeatured: boolean;
  isDigital: boolean;
  requiresShipping: boolean;
  
  // Variants
  variants?: ProductVariant[];
  
  // Reviews & Ratings
  rating?: ProductRating;
  
  // Analytics
  views?: number;
  sales?: number;
  wishlistCount?: number;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  
  // Additional Fields
  warranty?: string;
  returnPolicy?: string;
  shippingInfo?: ProductShippingInfo;
  
  // Digital Product Fields
  digitalFile?: string;
  downloadLimit?: number;
  
  // Bundle Products
  isBundle?: boolean;
  bundleItems?: string[];
  
  // Related Products
  relatedProducts?: string[];
  crossSells?: string[];
  upSells?: string[];
  
  // Virtual Fields (computed)
  discountPercentage?: number;
  stockStatus?: 'in-stock' | 'low-stock' | 'out-of-stock';
}

// Product List Response Interface
export interface ProductListResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Product Filter Interface
export interface ProductFilters {
  category?: string;
  subCategory?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  isFeatured?: boolean;
  isActive?: boolean;
  tags?: string[];
  search?: string;
  sortBy?: 'name' | 'price' | 'createdAt' | 'sales' | 'rating';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Product Create/Update Interface
export interface ProductInput {
  name: string;
  description: string;
  shortDescription?: string;
  sku: string;
  barcode?: string;
  brand?: string;
  model?: string;
  price: number;
  originalPrice?: number;
  costPrice?: number;
  currency?: string;
  stock: number;
  minStock?: number;
  maxStock?: number;
  trackInventory?: boolean;
  category: string;
  subCategory?: string;
  tags?: string[];
  images: string[];
  thumbnail?: string;
  videos?: string[];
  specifications?: Record<string, any>;
  dimensions?: ProductDimensions;
  seo?: ProductSEO;
  isActive?: boolean;
  isFeatured?: boolean;
  isDigital?: boolean;
  requiresShipping?: boolean;
  variants?: ProductVariant[];
  warranty?: string;
  returnPolicy?: string;
  shippingInfo?: ProductShippingInfo;
  digitalFile?: string;
  downloadLimit?: number;
  isBundle?: boolean;
  bundleItems?: string[];
  relatedProducts?: string[];
  crossSells?: string[];
  upSells?: string[];
}

// Product Search Interface
export interface ProductSearchParams {
  q?: string;
  category?: string;
  subCategory?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  isFeatured?: boolean;
  tags?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Product Review Interface
export interface ProductReview {
  _id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  isVerified: boolean;
  helpful: number;
  createdAt: string;
  updatedAt: string;
}

// Product Comparison Interface
export interface ProductComparison {
  products: Product[];
  features: string[];
}

// Product Wishlist Interface
export interface ProductWishlist {
  _id: string;
  userId: string;
  productId: string;
  product: Product;
  createdAt: string;
}

// Product Cart Item Interface
export interface CartItem {
  _id: string;
  productId: string;
  product: Product;
  quantity: number;
  selectedVariants?: Record<string, string>;
  price: number;
  total: number;
}

// Product Bundle Interface
export interface ProductBundle {
  _id: string;
  name: string;
  description: string;
  products: Product[];
  bundlePrice: number;
  savings: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
