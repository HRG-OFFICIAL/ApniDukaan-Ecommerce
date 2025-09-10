import mongoose, { Document, Schema, Types } from 'mongoose';

// Product variants interface
export interface IProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  attributes: Record<string, string>;
  images?: string[];
  isActive: boolean;
}

// Product specifications interface
export interface IProductSpecification {
  name: string;
  value: string;
  unit?: string;
  category: 'general' | 'technical' | 'dimensions' | 'warranty' | 'other';
}

// Product review interface
export interface IProductReview {
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
  createdAt: Date;
  updatedAt: Date;
}

// Product FAQ interface
export interface IProductFAQ {
  question: string;
  answer: string;
  category: string;
  order: number;
}

// SEO interface
export interface IProductSEO {
  title?: string;
  description?: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
}

// Shipping interface
export interface IProductShipping {
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
    unit: 'cm' | 'in';
  };
  freeShipping: boolean;
  shippingClass?: string;
  estimatedDelivery?: {
    min: number;
    max: number;
    unit: 'days' | 'weeks';
  };
}

// Extended product interface
export interface IProduct extends Document {
  // Basic information
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
  category: {
    id: string;
    name: string;
    slug: string;
    parentId?: string;
  };
  subcategory?: {
    id: string;
    name: string;
    slug: string;
  };
  brand?: {
    id: string;
    name: string;
    slug: string;
    logo?: string;
  };
  tags: string[];
  
  // Inventory
  inventory: {
    quantity: number;
    lowStockThreshold: number;
    trackQuantity: boolean;
    allowBackorder: boolean;
    sku: string;
    barcode?: string;
    weight?: number;
    dimensions?: {
      length: number;
      width: number;
      height: number;
      unit: 'cm' | 'in';
    };
  };
  
  // Variants
  variants?: IProductVariant[];
  hasVariants: boolean;
  
  // Specifications
  specifications?: IProductSpecification[];
  
  // Reviews and ratings
  reviews: IProductReview[];
  rating: {
    average: number;
    count: number;
    distribution: {
      1: number;
      2: number;
      3: number;
      4: number;
      5: number;
    };
  };
  
  // Sales data
  sales: {
    totalSold: number;
    revenue: number;
    lastSoldAt?: Date;
    conversionRate?: number;
  };
  
  // Status and visibility
  isOnSale: boolean;
  featured: boolean;
  status: 'draft' | 'published' | 'archived' | 'out_of_stock';
  visibility: 'public' | 'private' | 'password_protected';
  password?: string;
  
  // SEO
  seo?: IProductSEO;
  
  // Shipping
  shipping?: IProductShipping;
  
  // FAQ
  faq?: IProductFAQ[];
  
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
  downloadExpiry?: number; // in days
  
  // Subscription product specific
  isSubscription: boolean;
  subscriptionInterval?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  subscriptionPrice?: number;
  
  // Bundle product specific
  isBundle: boolean;
  bundleItems?: {
    productId: string;
    quantity: number;
    discount?: number;
  }[];
  
  // Related products
  relatedProducts?: string[];
  crossSellProducts?: string[];
  upSellProducts?: string[];
  
  // Analytics
  analytics: {
    views: number;
    clicks: number;
    addToCart: number;
    wishlist: number;
    share: number;
  };
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  archivedAt?: Date;
}

const ProductVariantSchema = new Schema<IProductVariant>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  sku: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  originalPrice: { type: Number, min: 0 },
  quantity: { type: Number, required: true, min: 0 },
  attributes: { type: Map, of: String },
  images: [{ type: String }],
  isActive: { type: Boolean, default: true }
}, { _id: false });

const ProductSpecificationSchema = new Schema<IProductSpecification>({
  name: { type: String, required: true },
  value: { type: String, required: true },
  unit: { type: String },
  category: { 
    type: String, 
    enum: ['general', 'technical', 'dimensions', 'warranty', 'other'],
    default: 'general'
  }
}, { _id: false });

const ProductReviewSchema = new Schema<IProductReview>({
  id: { type: String, required: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, required: true },
  comment: { type: String, required: true },
  verified: { type: Boolean, default: false },
  helpful: { type: Number, default: 0 },
  images: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { _id: false });

const ProductFAQSchema = new Schema<IProductFAQ>({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  category: { type: String, required: true },
  order: { type: Number, default: 0 }
}, { _id: false });

const ProductSEOSchema = new Schema<IProductSEO>({
  title: { type: String },
  description: { type: String },
  keywords: [{ type: String }],
  canonicalUrl: { type: String },
  ogImage: { type: String }
}, { _id: false });

const ProductShippingSchema = new Schema<IProductShipping>({
  weight: { type: Number, required: true, min: 0 },
  dimensions: {
    length: { type: Number, required: true, min: 0 },
    width: { type: Number, required: true, min: 0 },
    height: { type: Number, required: true, min: 0 },
    unit: { type: String, enum: ['cm', 'in'], default: 'cm' }
  },
  freeShipping: { type: Boolean, default: false },
  shippingClass: { type: String },
  estimatedDelivery: {
    min: { type: Number, min: 0 },
    max: { type: Number, min: 0 },
    unit: { type: String, enum: ['days', 'weeks'], default: 'days' }
  }
}, { _id: false });

const ProductSchema = new Schema<IProduct>({
  // Basic information
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 5000
  },
  shortDescription: {
    type: String,
    maxlength: 500
  },
  sku: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  
  // Pricing
  price: {
    type: Number,
    required: true,
    min: 0
  },
  originalPrice: {
    type: Number,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true
  },
  costPrice: {
    type: Number,
    min: 0
  },
  margin: {
    type: Number,
    min: 0,
    max: 100
  },
  
  // Media
  images: [{
    type: String,
    required: true
  }],
  thumbnailImage: {
    type: String
  },
  videos: [{
    type: String
  }],
  documents: [{
    type: String
  }],
  
  // Categorization
  category: {
    id: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    slug: {
      type: String,
      required: true
    },
    parentId: {
      type: String
    }
  },
  subcategory: {
    id: { type: String },
    name: { type: String },
    slug: { type: String }
  },
  brand: {
    id: { type: String },
    name: { type: String },
    slug: { type: String },
    logo: { type: String }
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  // Inventory
  inventory: {
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    lowStockThreshold: {
      type: Number,
      required: true,
      min: 0,
      default: 5
    },
    trackQuantity: {
      type: Boolean,
      default: true
    },
    allowBackorder: {
      type: Boolean,
      default: false
    },
    sku: {
      type: String,
      required: true
    },
    barcode: {
      type: String
    },
    weight: {
      type: Number,
      min: 0
    },
    dimensions: {
      length: { type: Number, min: 0 },
      width: { type: Number, min: 0 },
      height: { type: Number, min: 0 },
      unit: { type: String, enum: ['cm', 'in'], default: 'cm' }
    }
  },
  
  // Variants
  variants: [ProductVariantSchema],
  hasVariants: {
    type: Boolean,
    default: false
  },
  
  // Specifications
  specifications: [ProductSpecificationSchema],
  
  // Reviews and ratings
  reviews: [ProductReviewSchema],
  rating: {
    average: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    count: {
      type: Number,
      min: 0,
      default: 0
    },
    distribution: {
      1: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      5: { type: Number, default: 0 }
    }
  },
  
  // Sales data
  sales: {
    totalSold: {
      type: Number,
      min: 0,
      default: 0
    },
    revenue: {
      type: Number,
      min: 0,
      default: 0
    },
    lastSoldAt: {
      type: Date
    },
    conversionRate: {
      type: Number,
      min: 0,
      max: 100
    }
  },
  
  // Status and visibility
  isOnSale: {
    type: Boolean,
    default: false
  },
  featured: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived', 'out_of_stock'],
    default: 'draft'
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'password_protected'],
    default: 'public'
  },
  password: {
    type: String
  },
  
  // SEO
  seo: ProductSEOSchema,
  
  // Shipping
  shipping: ProductShippingSchema,
  
  // FAQ
  faq: [ProductFAQSchema],
  
  // Vendor information
  vendor: {
    id: { type: String },
    name: { type: String },
    email: { type: String },
    phone: { type: String }
  },
  
  // Digital product specific
  isDigital: {
    type: Boolean,
    default: false
  },
  downloadLimit: {
    type: Number,
    min: 0
  },
  downloadExpiry: {
    type: Number,
    min: 0
  },
  
  // Subscription product specific
  isSubscription: {
    type: Boolean,
    default: false
  },
  subscriptionInterval: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly']
  },
  subscriptionPrice: {
    type: Number,
    min: 0
  },
  
  // Bundle product specific
  isBundle: {
    type: Boolean,
    default: false
  },
  bundleItems: [{
    productId: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    discount: { type: Number, min: 0, max: 100 }
  }],
  
  // Related products
  relatedProducts: [{
    type: String
  }],
  crossSellProducts: [{
    type: String
  }],
  upSellProducts: [{
    type: String
  }],
  
  // Analytics
  analytics: {
    views: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    addToCart: { type: Number, default: 0 },
    wishlist: { type: Number, default: 0 },
    share: { type: Number, default: 0 }
  },
  
  // Timestamps
  publishedAt: {
    type: Date
  },
  archivedAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
ProductSchema.index({ name: 'text', description: 'text', tags: 'text', 'shortDescription': 'text' });
ProductSchema.index({ slug: 1 }, { unique: true });
ProductSchema.index({ sku: 1 }, { unique: true });
ProductSchema.index({ 'category.id': 1 });
ProductSchema.index({ 'category.slug': 1 });
ProductSchema.index({ 'subcategory.id': 1 });
ProductSchema.index({ 'brand.id': 1 });
ProductSchema.index({ 'brand.slug': 1 });
ProductSchema.index({ status: 1 });
ProductSchema.index({ visibility: 1 });
ProductSchema.index({ featured: 1 });
ProductSchema.index({ isOnSale: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ 'rating.average': -1 });
ProductSchema.index({ 'rating.count': -1 });
ProductSchema.index({ 'sales.totalSold': -1 });
ProductSchema.index({ 'sales.revenue': -1 });
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ updatedAt: -1 });
ProductSchema.index({ publishedAt: -1 });
ProductSchema.index({ isDigital: 1 });
ProductSchema.index({ isSubscription: 1 });
ProductSchema.index({ isBundle: 1 });
ProductSchema.index({ 'vendor.id': 1 });
ProductSchema.index({ 'inventory.quantity': 1 });
ProductSchema.index({ 'inventory.sku': 1 });
ProductSchema.index({ 'inventory.barcode': 1 });
ProductSchema.index({ 'analytics.views': -1 });
ProductSchema.index({ 'analytics.addToCart': -1 });

// Compound indexes
ProductSchema.index({ status: 1, visibility: 1 });
ProductSchema.index({ category: 1, status: 1 });
ProductSchema.index({ brand: 1, status: 1 });
ProductSchema.index({ featured: 1, status: 1 });
ProductSchema.index({ isOnSale: 1, status: 1 });
ProductSchema.index({ price: 1, status: 1 });
ProductSchema.index({ 'rating.average': -1, status: 1 });
ProductSchema.index({ 'sales.totalSold': -1, status: 1 });

// Virtual fields
ProductSchema.virtual('discountPercentage').get(function() {
  if (this.originalPrice && this.originalPrice > this.price) {
    return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
  }
  return 0;
});

ProductSchema.virtual('isInStock').get(function() {
  if (!this.inventory.trackQuantity) {
    return true;
  }
  return this.inventory.quantity > 0;
});

ProductSchema.virtual('isLowStock').get(function() {
  if (!this.inventory.trackQuantity) {
    return false;
  }
  return this.inventory.quantity <= this.inventory.lowStockThreshold && this.inventory.quantity > 0;
});

ProductSchema.virtual('isOutOfStock').get(function() {
  if (!this.inventory.trackQuantity) {
    return false;
  }
  return this.inventory.quantity === 0;
});

ProductSchema.virtual('averageRating').get(function() {
  return this.rating.average;
});

ProductSchema.virtual('totalReviews').get(function() {
  return this.rating.count;
});

ProductSchema.virtual('totalSold').get(function() {
  return this.sales.totalSold;
});

ProductSchema.virtual('revenue').get(function() {
  return this.sales.revenue;
});

// Pre-save middleware
ProductSchema.pre('save', function(next) {
  // Auto-generate slug if not provided
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  // Set publishedAt when status changes to published
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }

  // Set archivedAt when status changes to archived
  if (this.isModified('status') && this.status === 'archived' && !this.archivedAt) {
    this.archivedAt = new Date();
  }

  // Calculate margin if costPrice is provided
  if (this.costPrice && this.price) {
    this.margin = ((this.price - this.costPrice) / this.costPrice) * 100;
  }

  // Update status to out_of_stock if quantity is 0 and trackQuantity is true
  if (this.inventory.trackQuantity && this.inventory.quantity === 0 && this.status !== 'archived') {
    this.status = 'out_of_stock';
  }

  next();
});

// Instance methods
ProductSchema.methods.updateRating = function(review: IProductReview) {
  const reviews = this.reviews || [];
  const existingReviewIndex = reviews.findIndex((r: IProductReview) => r.id === review.id);
  
  if (existingReviewIndex >= 0) {
    // Update existing review
    reviews[existingReviewIndex] = review;
  } else {
    // Add new review
    reviews.push(review);
  }
  
  this.reviews = reviews;
  
  // Recalculate rating
  if (reviews.length > 0) {
    const totalRating = reviews.reduce((sum: number, r: IProductReview) => sum + r.rating, 0);
    this.rating.average = Math.round((totalRating / reviews.length) * 10) / 10;
    this.rating.count = reviews.length;
    
    // Update rating distribution
    this.rating.distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r: IProductReview) => {
      this.rating.distribution[r.rating as keyof typeof this.rating.distribution]++;
    });
  }
  
  return this.save();
};

ProductSchema.methods.removeReview = function(reviewId: string) {
  this.reviews = this.reviews.filter((r: IProductReview) => r.id !== reviewId);
  
  // Recalculate rating
  if (this.reviews.length > 0) {
    const totalRating = this.reviews.reduce((sum: number, r: IProductReview) => sum + r.rating, 0);
    this.rating.average = Math.round((totalRating / this.reviews.length) * 10) / 10;
    this.rating.count = this.reviews.length;
    
    // Update rating distribution
    this.rating.distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    this.reviews.forEach((r: IProductReview) => {
      this.rating.distribution[r.rating as keyof typeof this.rating.distribution]++;
    });
  } else {
    this.rating.average = 0;
    this.rating.count = 0;
    this.rating.distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  }
  
  return this.save();
};

ProductSchema.methods.updateInventory = function(quantity: number, operation: 'add' | 'subtract' | 'set' = 'set') {
  if (!this.inventory.trackQuantity) {
    return this;
  }
  
  switch (operation) {
    case 'add':
      this.inventory.quantity += quantity;
      break;
    case 'subtract':
      this.inventory.quantity = Math.max(0, this.inventory.quantity - quantity);
      break;
    case 'set':
    default:
      this.inventory.quantity = Math.max(0, quantity);
      break;
  }
  
  // Update status based on inventory
  if (this.inventory.quantity === 0 && this.status !== 'archived') {
    this.status = 'out_of_stock';
  } else if (this.inventory.quantity > 0 && this.status === 'out_of_stock') {
    this.status = 'published';
  }
  
  return this.save();
};

ProductSchema.methods.recordSale = function(quantity: number, price: number) {
  this.sales.totalSold += quantity;
  this.sales.revenue += price * quantity;
  this.sales.lastSoldAt = new Date();
  
  // Update inventory
  this.updateInventory(quantity, 'subtract');
  
  return this.save();
};

ProductSchema.methods.incrementAnalytics = function(field: keyof IProduct['analytics']) {
  this.analytics[field]++;
  return this.save();
};

// Static methods
ProductSchema.statics.findByCategory = function(categoryId: string, options: any = {}) {
  return this.find({ 'category.id': categoryId, ...options });
};

ProductSchema.statics.findByBrand = function(brandId: string, options: any = {}) {
  return this.find({ 'brand.id': brandId, ...options });
};

ProductSchema.statics.findFeatured = function(options: any = {}) {
  return this.find({ featured: true, status: 'published', ...options });
};

ProductSchema.statics.findOnSale = function(options: any = {}) {
  return this.find({ isOnSale: true, status: 'published', ...options });
};

ProductSchema.statics.findInStock = function(options: any = {}) {
  return this.find({
    $or: [
      { 'inventory.trackQuantity': false },
      { 'inventory.quantity': { $gt: 0 } }
    ],
    status: 'published',
    ...options
  });
};

ProductSchema.statics.findLowStock = function(options: any = {}) {
  return this.find({
    'inventory.trackQuantity': true,
    'inventory.quantity': { $gt: 0, $lte: '$inventory.lowStockThreshold' },
    status: 'published',
    ...options
  });
};

ProductSchema.statics.findOutOfStock = function(options: any = {}) {
  return this.find({
    'inventory.trackQuantity': true,
    'inventory.quantity': 0,
    status: 'published',
    ...options
  });
};

ProductSchema.statics.searchProducts = function(query: string, options: any = {}) {
  return this.find({
    $text: { $search: query },
    status: 'published',
    ...options
  }, {
    score: { $meta: 'textScore' }
  }).sort({ score: { $meta: 'textScore' } });
};

ProductSchema.statics.getTopSelling = function(limit: number = 10, options: any = {}) {
  return this.find({
    status: 'published',
    ...options
  }).sort({ 'sales.totalSold': -1 }).limit(limit);
};

ProductSchema.statics.getTopRated = function(limit: number = 10, options: any = {}) {
  return this.find({
    status: 'published',
    'rating.count': { $gte: 5 }, // At least 5 reviews
    ...options
  }).sort({ 'rating.average': -1 }).limit(limit);
};

ProductSchema.statics.getRecentlyAdded = function(limit: number = 10, options: any = {}) {
  return this.find({
    status: 'published',
    ...options
  }).sort({ createdAt: -1 }).limit(limit);
};

export const Product = mongoose.model<IProduct>('Product', ProductSchema);