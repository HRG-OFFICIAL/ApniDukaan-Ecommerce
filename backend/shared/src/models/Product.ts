import { Schema, model } from 'mongoose';

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

// Product Interface
export interface IProduct {
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
  category: Schema.Types.ObjectId;
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
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  
  // Additional Fields
  warranty?: string;
  returnPolicy?: string;
  shippingInfo?: ProductShippingInfo;
  
  // Digital Product Fields
  digitalFile?: string;
  downloadLimit?: number;
  
  // Bundle Products
  isBundle?: boolean;
  bundleItems?: Schema.Types.ObjectId[];
  
  // Related Products
  relatedProducts?: Schema.Types.ObjectId[];
  crossSells?: Schema.Types.ObjectId[];
  upSells?: Schema.Types.ObjectId[];
}

// Product Schema
const ProductSchema = new Schema<IProduct>({
  // Basic Info
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters']
  },
  slug: {
    type: String,
    required: [true, 'Product slug is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  shortDescription: {
    type: String,
    maxlength: [500, 'Short description cannot exceed 500 characters']
  },
  sku: {
    type: String,
    required: [true, 'Product SKU is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  barcode: {
    type: String,
    unique: true,
    sparse: true
  },
  brand: {
    type: String,
    trim: true
  },
  model: {
    type: String,
    trim: true
  },
  
  // Pricing
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative']
  },
  originalPrice: {
    type: Number,
    min: [0, 'Original price cannot be negative']
  },
  costPrice: {
    type: Number,
    min: [0, 'Cost price cannot be negative']
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true
  },
  
  // Inventory
  stock: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  minStock: {
    type: Number,
    min: [0, 'Minimum stock cannot be negative'],
    default: 0
  },
  maxStock: {
    type: Number,
    min: [0, 'Maximum stock cannot be negative']
  },
  trackInventory: {
    type: Boolean,
    default: true
  },
  
  // Categories
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Product category is required']
  },
  subCategory: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  
  // Media
  images: {
    type: [String],
    required: [true, 'At least one product image is required'],
    validate: {
      validator: function(images: string[]) {
        return images.length > 0;
      },
      message: 'At least one product image is required'
    }
  },
  thumbnail: {
    type: String
  },
  videos: [{
    type: String
  }],
  
  // Specifications
  specifications: {
    type: Schema.Types.Mixed
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    weight: Number,
    unit: {
      type: String,
      default: 'cm'
    }
  },
  
  // SEO
  seo: {
    title: String,
    description: String,
    keywords: [String]
  },
  
  // Status & Visibility
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isDigital: {
    type: Boolean,
    default: false
  },
  requiresShipping: {
    type: Boolean,
    default: true
  },
  
  // Variants
  variants: [{
    name: {
      type: String,
      required: true
    },
    options: [{
      type: String,
      required: true
    }],
    selected: String
  }],
  
  // Reviews & Ratings
  rating: {
    average: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    },
    breakdown: {
      5: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      1: { type: Number, default: 0 }
    }
  },
  
  // Analytics
  views: {
    type: Number,
    default: 0
  },
  sales: {
    type: Number,
    default: 0
  },
  wishlistCount: {
    type: Number,
    default: 0
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  publishedAt: {
    type: Date
  },
  
  // Additional Fields
  warranty: String,
  returnPolicy: String,
  shippingInfo: {
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      weight: Number,
      unit: String
    },
    shippingClass: String
  },
  
  // Digital Product Fields
  digitalFile: String,
  downloadLimit: {
    type: Number,
    min: 1
  },
  
  // Bundle Products
  isBundle: {
    type: Boolean,
    default: false
  },
  bundleItems: [{
    type: Schema.Types.ObjectId,
    ref: 'Product'
  }],
  
  // Related Products
  relatedProducts: [{
    type: Schema.Types.ObjectId,
    ref: 'Product'
  }],
  crossSells: [{
    type: Schema.Types.ObjectId,
    ref: 'Product'
  }],
  upSells: [{
    type: Schema.Types.ObjectId,
    ref: 'Product'
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
ProductSchema.index({ name: 'text', description: 'text', tags: 'text' });
ProductSchema.index({ category: 1, isActive: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ stock: 1 });
ProductSchema.index({ isFeatured: 1, isActive: 1 });
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ sales: -1 });
ProductSchema.index({ rating: -1 });

// Virtual for discount percentage
ProductSchema.virtual('discountPercentage').get(function() {
  if (this.originalPrice && this.originalPrice > this.price) {
    return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
  }
  return 0;
});

// Virtual for stock status
ProductSchema.virtual('stockStatus').get(function(this: any) {
  if (this.stock === 0) return 'out-of-stock';
  if (typeof this.minStock === 'number' && this.stock <= this.minStock) return 'low-stock';
  return 'in-stock';
});

// Pre-save middleware to update slug if name changes
ProductSchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Pre-save middleware to set thumbnail
ProductSchema.pre('save', function(next) {
  if (this.images && this.images.length > 0 && !this.thumbnail) {
    this.thumbnail = this.images[0];
  }
  next();
});

export const Product = model<IProduct>('Product', ProductSchema);
