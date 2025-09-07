import mongoose, { Schema, Document } from 'mongoose';
import { IProduct, ProductStatus, timestampPlugin } from '@shopsphere/shared';

export interface IProductDocument extends IProduct, Document {
  updateInventory(quantity: number): Promise<IProductDocument>;
  incrementViews(): Promise<void>;
  updateRating(newRating: number): Promise<void>;
}

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
