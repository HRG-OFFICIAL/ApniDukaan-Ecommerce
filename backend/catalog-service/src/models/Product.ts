import mongoose from 'mongoose';
import { timestampPlugin } from '@shopsphere/shared';

export interface IProduct extends mongoose.Document {
  _id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  sku: string;
  price: number;
  originalPrice?: number;
  currency: string;
  images: string[];
  thumbnailImage?: string;
  category: mongoose.Types.ObjectId;
  subcategory?: mongoose.Types.ObjectId;
  brand?: string;
  tags: string[];
  attributes: Array<{
    name: string;
    value: string;
    type: 'text' | 'number' | 'color' | 'size' | 'material';
  }>;
  inventory: {
    stock: number;
    lowStockThreshold: number;
    inStock: boolean;
    trackInventory: boolean;
  };
  shipping: {
    weight: number;
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
    shippingClass?: string;
    freeShipping: boolean;
  };
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    keywords: string[];
  };
  status: 'draft' | 'active' | 'inactive' | 'archived';
  featured: boolean;
  visibility: 'public' | 'private' | 'password_protected';
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
  sales: {
    totalSold: number;
    totalRevenue: number;
  };
  isOnSale: boolean;
  saleStartDate?: Date;
  saleEndDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  updateReviewStats(): Promise<void>;
}

const ProductSchema = new mongoose.Schema<IProduct>({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters']
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
    required: [true, 'Product description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  shortDescription: {
    type: String,
    maxlength: [500, 'Short description cannot exceed 500 characters']
  },
  sku: {
    type: String,
    required: [true, 'SKU is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  originalPrice: {
    type: Number,
    min: [0, 'Original price cannot be negative']
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true,
    maxlength: 3
  },
  images: [{
    type: String,
    required: true
  }],
  thumbnailImage: {
    type: String
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  subcategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  brand: {
    type: String,
    trim: true,
    maxlength: [100, 'Brand name cannot exceed 100 characters']
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  attributes: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    value: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['text', 'number', 'color', 'size', 'material'],
      default: 'text'
    }
  }],
  inventory: {
    stock: {
      type: Number,
      required: true,
      min: [0, 'Stock cannot be negative'],
      default: 0
    },
    lowStockThreshold: {
      type: Number,
      default: 5,
      min: [0, 'Low stock threshold cannot be negative']
    },
    inStock: {
      type: Boolean,
      default: true
    },
    trackInventory: {
      type: Boolean,
      default: true
    }
  },
  shipping: {
    weight: {
      type: Number,
      required: true,
      min: [0, 'Weight cannot be negative']
    },
    dimensions: {
      length: {
        type: Number,
        required: true,
        min: [0, 'Length cannot be negative']
      },
      width: {
        type: Number,
        required: true,
        min: [0, 'Width cannot be negative']
      },
      height: {
        type: Number,
        required: true,
        min: [0, 'Height cannot be negative']
      }
    },
    shippingClass: {
      type: String,
      trim: true
    },
    freeShipping: {
      type: Boolean,
      default: false
    }
  },
  seo: {
    metaTitle: {
      type: String,
      maxlength: [160, 'Meta title cannot exceed 160 characters']
    },
    metaDescription: {
      type: String,
      maxlength: [320, 'Meta description cannot exceed 320 characters']
    },
    keywords: [{
      type: String,
      trim: true,
      lowercase: true
    }]
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'inactive', 'archived'],
    default: 'draft'
  },
  featured: {
    type: Boolean,
    default: false
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'password_protected'],
    default: 'public'
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be negative'],
      max: [5, 'Rating cannot exceed 5']
    },
    count: {
      type: Number,
      default: 0,
      min: [0, 'Rating count cannot be negative']
    },
    distribution: {
      1: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      5: { type: Number, default: 0 }
    }
  },
  sales: {
    totalSold: {
      type: Number,
      default: 0,
      min: [0, 'Total sold cannot be negative']
    },
    totalRevenue: {
      type: Number,
      default: 0,
      min: [0, 'Total revenue cannot be negative']
    }
  },
  isOnSale: {
    type: Boolean,
    default: false
  },
  saleStartDate: {
    type: Date
  },
  saleEndDate: {
    type: Date
  }
});

// Apply timestamp plugin
ProductSchema.plugin(timestampPlugin);

// Indexes for better query performance
ProductSchema.index({ name: 'text', description: 'text', tags: 'text' }); // Text search
ProductSchema.index({ category: 1, status: 1, visibility: 1 }); // Category filtering
ProductSchema.index({ price: 1 }); // Price sorting
ProductSchema.index({ 'rating.average': -1 }); // Rating sorting
ProductSchema.index({ featured: -1, status: 1 }); // Featured products
ProductSchema.index({ slug: 1 }, { unique: true }); // Unique slug
ProductSchema.index({ sku: 1 }, { unique: true }); // Unique SKU
ProductSchema.index({ createdAt: -1 }); // Newest first
ProductSchema.index({ 'sales.totalSold': -1 }); // Best sellers
ProductSchema.index({ tags: 1 }); // Tag filtering
ProductSchema.index({ brand: 1 }); // Brand filtering

// Virtual for calculating discount percentage
ProductSchema.virtual('discountPercentage').get(function(this: IProduct) {
  if (this.originalPrice && this.originalPrice > this.price) {
    return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
  }
  return 0;
});

// Virtual for checking if product is new (created within last 30 days)
ProductSchema.virtual('isNew').get(function(this: IProduct) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return this.createdAt > thirtyDaysAgo;
});

// Virtual for checking if product is bestseller (>100 sold)
ProductSchema.virtual('isBestseller').get(function(this: IProduct) {
  return this.sales.totalSold > 100;
});

// Virtual for checking low stock
ProductSchema.virtual('isLowStock').get(function(this: IProduct) {
  return this.inventory.trackInventory && 
         this.inventory.stock <= this.inventory.lowStockThreshold;
});

// Virtual for checking out of stock
ProductSchema.virtual('isOutOfStock').get(function(this: IProduct) {
  return this.inventory.trackInventory && this.inventory.stock === 0;
});

// Middleware to update inventory status
ProductSchema.pre('save', function(this: IProduct) {
  if (this.inventory.trackInventory) {
    this.inventory.inStock = this.inventory.stock > 0;
  }
  
  // Auto-generate slug from name if not provided
  if (!this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
});

// Static method to find products by category
ProductSchema.statics.findByCategory = function(categoryId: string) {
  return this.find({ 
    category: categoryId, 
    status: 'active', 
    visibility: 'public' 
  });
};

// Static method to find featured products
ProductSchema.statics.findFeatured = function(limit: number = 10) {
  return this.find({ 
    featured: true, 
    status: 'active', 
    visibility: 'public' 
  }).limit(limit);
};

// Static method to search products
ProductSchema.statics.searchProducts = function(
  query: string, 
  filters: any = {}, 
  sort: any = { createdAt: -1 }, 
  skip: number = 0, 
  limit: number = 20
) {
  const searchCriteria: any = {
    status: 'active',
    visibility: 'public',
    ...filters
  };

  if (query) {
    searchCriteria.$text = { $search: query };
  }

  return this.find(searchCriteria)
    .populate('category', 'name slug')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

// Instance method to update review statistics
ProductSchema.methods.updateReviewStats = async function(this: IProduct) {
  const ReviewModel = mongoose.model('Review');
  
  // Get all approved reviews for this product
  const reviews = await ReviewModel.find({
    product: this._id,
    status: 'approved'
  });
  
  if (reviews.length === 0) {
    this.rating = {
      average: 0,
      count: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
  } else {
    // Calculate statistics
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalRating = 0;
    
    reviews.forEach((review: any) => {
      totalRating += review.rating;
      distribution[review.rating as keyof typeof distribution]++;
    });
    
    const average = parseFloat((totalRating / reviews.length).toFixed(1));
    
    this.rating = {
      average,
      count: reviews.length,
      distribution
    };
  }
  
  await this.save();
};

const Product = mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
export { ProductSchema };
export const ProductModel = Product;

const productSchema = new Schema<IProductDocument>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
    index: 'text'
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000,
    index: 'text'
  },
  shortDescription: {
    type: String,
    maxlength: 500
  },
  price: {
    type: Number,
    required: true,
    min: 0,
    index: 1
  },
  comparePrice: {
    type: Number,
    min: 0,
    validate: {
      validator: function(this: IProductDocument, value: number) {
        return !value || value >= this.price;
      },
      message: 'Compare price must be greater than or equal to price'
    }
  },
  costPrice: {
    type: Number,
    min: 0
  },
  sku: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  barcode: {
    type: String,
    sparse: true,
    index: true
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
    index: true
  },
  subcategory: {
    type: Schema.Types.ObjectId,
    ref: 'Category'
  },
  brand: {
    type: String,
    trim: true,
    index: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  images: [{
    url: {
      type: String,
      required: true
    },
    alt: {
      type: String,
      default: ''
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  variants: [{
    name: {
      type: String,
      required: true
    },
    options: [{
      name: String,
      value: String,
      priceModifier: {
        type: Number,
        default: 0
      }
    }]
  }],
  specifications: [{
    name: {
      type: String,
      required: true
    },
    value: {
      type: String,
      required: true
    }
  }],
  inventory: {
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    reserved: {
      type: Number,
      default: 0,
      min: 0
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
      min: 0
    },
    trackInventory: {
      type: Boolean,
      default: true
    }
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    weight: Number,
    unit: {
      type: String,
      enum: ['cm', 'in', 'mm'],
      default: 'cm'
    },
    weightUnit: {
      type: String,
      enum: ['kg', 'lb', 'g'],
      default: 'kg'
    }
  },
  seo: {
    title: String,
    description: String,
    keywords: [String],
    slug: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true
    }
  },
  status: {
    type: String,
    enum: Object.values(ProductStatus),
    default: ProductStatus.DRAFT,
    index: true
  },
  featured: {
    type: Boolean,
    default: false,
    index: true
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  views: {
    type: Number,
    default: 0,
    min: 0
  },
  salesCount: {
    type: Number,
    default: 0,
    min: 0
  },
  publishedAt: {
    type: Date,
    default: null
  }
});

// Add timestamp plugin
productSchema.plugin(timestampPlugin);

// Indexes for performance
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ price: 1, status: 1 });
productSchema.index({ featured: 1, status: 1 });
productSchema.index({ 'rating.average': -1, status: 1 });
productSchema.index({ views: -1, status: 1 });
productSchema.index({ salesCount: -1, status: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ 'seo.slug': 1 });

// Virtual for available inventory
productSchema.virtual('availableInventory').get(function(this: IProductDocument) {
  return Math.max(0, this.inventory.quantity - this.inventory.reserved);
});

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function(this: IProductDocument) {
  if (!this.comparePrice || this.comparePrice <= this.price) return 0;
  return Math.round(((this.comparePrice - this.price) / this.comparePrice) * 100);
});

// Virtual for low stock status
productSchema.virtual('isLowStock').get(function(this: IProductDocument) {
  if (!this.inventory.trackInventory) return false;
  return this.availableInventory <= this.inventory.lowStockThreshold;
});

// Virtual for out of stock status
productSchema.virtual('isOutOfStock').get(function(this: IProductDocument) {
  if (!this.inventory.trackInventory) return false;
  return this.availableInventory <= 0;
});

// Pre-save middleware
productSchema.pre('save', function(this: IProductDocument) {
  // Generate slug if not provided
  if (!this.seo.slug && this.name) {
    this.seo.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Set published date when status changes to active
  if (this.isModified('status') && this.status === ProductStatus.ACTIVE && !this.publishedAt) {
    this.publishedAt = new Date();
  }

  // Ensure only one primary image
  if (this.images && this.images.length > 0) {
    let hasPrimary = false;
    this.images.forEach((image, index) => {
      if (image.isPrimary && !hasPrimary) {
        hasPrimary = true;
      } else if (image.isPrimary && hasPrimary) {
        this.images[index].isPrimary = false;
      }
    });

    // If no primary image, set first as primary
    if (!hasPrimary && this.images.length > 0) {
      this.images[0].isPrimary = true;
    }
  }
});

// Instance method to update inventory
productSchema.methods.updateInventory = async function(
  this: IProductDocument,
  quantity: number
): Promise<IProductDocument> {
  this.inventory.quantity = Math.max(0, this.inventory.quantity + quantity);
  return await this.save();
};

// Instance method to increment views
productSchema.methods.incrementViews = async function(this: IProductDocument): Promise<void> {
  await this.updateOne({ $inc: { views: 1 } });
};

// Instance method to update rating
productSchema.methods.updateRating = async function(
  this: IProductDocument,
  newRating: number
): Promise<void> {
  const totalRating = this.rating.average * this.rating.count + newRating;
  const newCount = this.rating.count + 1;
  const newAverage = totalRating / newCount;

  await this.updateOne({
    $set: {
      'rating.average': Math.round(newAverage * 10) / 10,
      'rating.count': newCount
    }
  });
};

// Static methods
productSchema.statics.findBySlug = function(slug: string) {
  return this.findOne({ 'seo.slug': slug, status: ProductStatus.ACTIVE });
};

productSchema.statics.findBySku = function(sku: string) {
  return this.findOne({ sku: sku.toUpperCase() });
};

productSchema.statics.findFeatured = function(limit: number = 10) {
  return this.find({ 
    featured: true, 
    status: ProductStatus.ACTIVE 
  })
  .limit(limit)
  .sort({ 'rating.average': -1, views: -1 });
};

productSchema.statics.findByCategory = function(categoryId: string, limit: number = 20, skip: number = 0) {
  return this.find({ 
    category: categoryId, 
    status: ProductStatus.ACTIVE 
  })
  .limit(limit)
  .skip(skip)
  .sort({ 'rating.average': -1, views: -1 });
};

// Transform output
productSchema.methods.toJSON = function(this: IProductDocument) {
  const product = this.toObject({ virtuals: true });
  
  // Remove sensitive fields
  delete product.__v;
  delete product.costPrice;
  delete product.inventory.reserved;
  
  return product;
};

// Create and export the model
export const Product = mongoose.model<IProductDocument>('Product', productSchema);

// Export the schema for testing
export { productSchema };
