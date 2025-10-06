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

// Product Category Interface
export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
}

// Product Brand Interface
export interface ProductBrand {
  id: string;
  name: string;
  slug: string;
  logo?: string;
}

// Product Inventory Interface
export interface ProductInventory {
  quantity: number;
  lowStockThreshold: number;
  trackQuantity: boolean;
  allowBackorder: boolean;
  sku: string;
  barcode?: string;
  weight?: number;
  dimensions?: ProductDimensions;
}

// Product Sales Interface
export interface ProductSales {
  totalSold: number;
  revenue: number;
  lastSoldAt?: string;
  conversionRate?: number;
}

// Product Analytics Interface
export interface ProductAnalytics {
  views: number;
  clicks: number;
  addToCart: number;
  wishlist: number;
  share: number;
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
  
  // Pricing
  price: number;
  originalPrice?: number;
  currency: string;
  costPrice?: number;
  margin?: number;
  
  // Media
  images: string[];
  thumbnailImage?: string;
  videos?: string[];
  documents?: string[];
  
  // Categorization
  category: ProductCategory;
  subcategory?: ProductCategory;
  brand?: ProductBrand;
  tags: string[];
  
  // Inventory
  inventory: ProductInventory;
  
  // Variants
  variants?: ProductVariant[];
  hasVariants: boolean;
  
  // Specifications
  specifications?: Array<{
    name: string;
    value: string;
    unit?: string;
    category: 'general' | 'technical' | 'dimensions' | 'warranty' | 'other';
  }>;
  
  // Reviews and ratings
  reviews: Array<{
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    rating: number;
    title: string;
    comment: string;
    verified: boolean;
    helpful: number;
    images?: string[];
    createdAt: string;
    updatedAt: string;
  }>;
  rating: ProductRating;
  
  // Sales data
  sales: ProductSales;
  
  // Status and visibility
  isOnSale: boolean;
  featured: boolean;
  status: 'draft' | 'published' | 'archived' | 'out_of_stock';
  visibility: 'public' | 'private' | 'password_protected';
  password?: string;
  
  // SEO
  seo?: ProductSEO;
  
  // Shipping
  shipping?: {
    weight: number;
    dimensions: ProductDimensions;
    freeShipping: boolean;
    shippingClass?: string;
    estimatedDelivery?: {
      min: number;
      max: number;
      unit: 'days' | 'weeks';
    };
  };
  
  // FAQ
  faq?: Array<{
    question: string;
    answer: string;
    category: string;
    order: number;
  }>;
  
  // Vendor information
  vendor?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  
  // Digital product specific
  isDigital: boolean;
  downloadLimit?: number;
  downloadExpiry?: number;
  
  // Subscription product specific
  isSubscription: boolean;
  subscriptionInterval?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  subscriptionPrice?: number;
  
  // Bundle product specific
  isBundle: boolean;
  bundleItems?: Array<{
    productId: string;
    quantity: number;
    discount?: number;
  }>;
  
  // Related products
  relatedProducts?: string[];
  crossSellProducts?: string[];
  upSellProducts?: string[];
  
  // Analytics
  analytics: ProductAnalytics;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  archivedAt?: string;
  
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
  subcategory?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  featured?: boolean;
  status?: 'draft' | 'published' | 'archived' | 'out_of_stock';
  visibility?: 'public' | 'private' | 'password_protected';
  tags?: string[];
  search?: string;
  sortBy?: 'name' | 'price' | 'createdAt' | 'sales' | 'rating';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  isOnSale?: boolean;
  isDigital?: boolean;
  isSubscription?: boolean;
  isBundle?: boolean;
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
