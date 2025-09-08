import mongoose from 'mongoose';
import { timestampPlugin } from '@shopsphere/shared';

export interface ICategory extends mongoose.Document {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  icon?: string;
  parentCategory?: mongoose.Types.ObjectId;
  subcategories: mongoose.Types.ObjectId[];
  level: number;
  path: string; // e.g., "electronics/smartphones/android"
  isActive: boolean;
  sortOrder: number;
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    keywords: string[];
  };
  productCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new mongoose.Schema<ICategory>({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [100, 'Category name cannot exceed 100 characters']
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
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  image: {
    type: String
  },
  icon: {
    type: String
  },
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  subcategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  level: {
    type: Number,
    default: 0,
    min: [0, 'Level cannot be negative']
  },
  path: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
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
  productCount: {
    type: Number,
    default: 0,
    min: [0, 'Product count cannot be negative']
  }
});

// Apply timestamp plugin
CategorySchema.plugin(timestampPlugin);

// Indexes
CategorySchema.index({ slug: 1 }, { unique: true });
CategorySchema.index({ parentCategory: 1, isActive: 1 });
CategorySchema.index({ level: 1, sortOrder: 1 });
CategorySchema.index({ path: 1 });
CategorySchema.index({ name: 'text', description: 'text' });

// Virtual for checking if category has subcategories
CategorySchema.virtual('hasSubcategories').get(function(this: ICategory) {
  return this.subcategories && this.subcategories.length > 0;
});

// Virtual for checking if category is root
CategorySchema.virtual('isRoot').get(function(this: ICategory) {
  return !this.parentCategory;
});

// Middleware to auto-generate slug and path
CategorySchema.pre('save', async function(this: ICategory) {
  // Generate slug if not provided
  if (!this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  // Generate path
  if (this.parentCategory) {
    const parent = await this.constructor.findById(this.parentCategory) as ICategory;
    if (parent) {
      this.path = `${parent.path}/${this.slug}`;
      this.level = parent.level + 1;
    }
  } else {
    this.path = this.slug;
    this.level = 0;
  }
});

// Middleware to update parent's subcategories array
CategorySchema.post('save', async function(this: ICategory) {
  if (this.parentCategory) {
    await this.constructor.findByIdAndUpdate(
      this.parentCategory,
      { $addToSet: { subcategories: this._id } }
    );
  }
});

// Middleware to remove from parent's subcategories when deleted
CategorySchema.post('findOneAndDelete', async function(doc: ICategory) {
  if (doc && doc.parentCategory) {
    await doc.constructor.findByIdAndUpdate(
      doc.parentCategory,
      { $pull: { subcategories: doc._id } }
    );
  }
});

// Static method to get category tree
CategorySchema.statics.getCategoryTree = async function() {
  const categories = await this.find({ isActive: true })
    .populate('subcategories', 'name slug image icon productCount')
    .sort({ level: 1, sortOrder: 1 })
    .lean();

  const categoryMap = new Map();
  const rootCategories: any[] = [];

  // First pass: create map of all categories
  categories.forEach((category: any) => {
    categoryMap.set(category._id.toString(), { ...category, children: [] });
  });

  // Second pass: build tree structure
  categories.forEach((category: any) => {
    const categoryWithChildren = categoryMap.get(category._id.toString());
    
    if (category.parentCategory) {
      const parent = categoryMap.get(category.parentCategory.toString());
      if (parent) {
        parent.children.push(categoryWithChildren);
      }
    } else {
      rootCategories.push(categoryWithChildren);
    }
  });

  return rootCategories;
};

// Static method to get breadcrumb for a category
CategorySchema.statics.getBreadcrumb = async function(categoryId: string) {
  const category = await this.findById(categoryId).lean();
  if (!category) return [];

  const breadcrumb = [];
  const pathParts = category.path.split('/');
  
  for (let i = 0; i < pathParts.length; i++) {
    const partialPath = pathParts.slice(0, i + 1).join('/');
    const cat = await this.findOne({ path: partialPath }).select('name slug path').lean();
    if (cat) {
      breadcrumb.push(cat);
    }
  }

  return breadcrumb;
};

// Static method to update product counts
CategorySchema.statics.updateProductCounts = async function() {
  const Product = mongoose.model('Product');
  
  const productCounts = await Product.aggregate([
    { $match: { status: 'active' } },
    { $group: { _id: '$category', count: { $sum: 1 } } }
  ]);

  // Reset all counts to 0
  await this.updateMany({}, { productCount: 0 });

  // Update counts
  for (const { _id: categoryId, count } of productCounts) {
    await this.findByIdAndUpdate(categoryId, { productCount: count });
  }
};

const Category = mongoose.model<ICategory>('Category', CategorySchema);

export default Category;
export { CategorySchema };

import mongoose, { Schema, Document } from 'mongoose';
import { ICategory, timestampPlugin } from '@shopsphere/shared';

export interface ICategoryDocument extends ICategory, Document {
  getFullPath(): string;
  getChildren(): Promise<ICategoryDocument[]>;
  getProductCount(): Promise<number>;
}

const categorySchema = new Schema<ICategoryDocument>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
    index: true
  },
  description: {
    type: String,
    maxlength: 500
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  parent: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    default: null,
    index: true
  },
  level: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
    index: true
  },
  path: {
    type: String,
    default: '',
    index: true
  },
  image: {
    url: String,
    alt: String
  },
  icon: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  isFeatured: {
    type: Boolean,
    default: false,
    index: true
  },
  sortOrder: {
    type: Number,
    default: 0,
    index: true
  },
  seo: {
    title: String,
    description: String,
    keywords: [String]
  },
  productCount: {
    type: Number,
    default: 0,
    min: 0
  }
});

// Add timestamp plugin
categorySchema.plugin(timestampPlugin);

// Indexes
categorySchema.index({ parent: 1, sortOrder: 1 });
categorySchema.index({ level: 1, isActive: 1 });
categorySchema.index({ isFeatured: 1, isActive: 1 });
categorySchema.index({ path: 1, isActive: 1 });

// Pre-save middleware
categorySchema.pre('save', async function(this: ICategoryDocument) {
  // Generate slug if not provided
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Calculate level and path based on parent
  if (this.parent) {
    const parent = await mongoose.model('Category').findById(this.parent);
    if (parent) {
      this.level = parent.level + 1;
      this.path = parent.path ? `${parent.path}/${parent._id}` : `${parent._id}`;
    }
  } else {
    this.level = 0;
    this.path = '';
  }
});

// Instance method to get full path
categorySchema.methods.getFullPath = function(this: ICategoryDocument): string {
  return this.path ? `${this.path}/${this._id}` : `${this._id}`;
};

// Instance method to get children
categorySchema.methods.getChildren = async function(this: ICategoryDocument): Promise<ICategoryDocument[]> {
  return await mongoose.model('Category').find({ 
    parent: this._id, 
    isActive: true 
  }).sort({ sortOrder: 1, name: 1 });
};

// Instance method to get product count
categorySchema.methods.getProductCount = async function(this: ICategoryDocument): Promise<number> {
  const Product = mongoose.model('Product');
  return await Product.countDocuments({ 
    category: this._id,
    status: 'active'
  });
};

// Static methods
categorySchema.statics.findBySlug = function(slug: string) {
  return this.findOne({ slug, isActive: true });
};

categorySchema.statics.findRootCategories = function() {
  return this.find({ 
    parent: null, 
    isActive: true 
  }).sort({ sortOrder: 1, name: 1 });
};

categorySchema.statics.findFeatured = function(limit: number = 10) {
  return this.find({ 
    isFeatured: true, 
    isActive: true 
  })
  .limit(limit)
  .sort({ sortOrder: 1, name: 1 });
};

categorySchema.statics.buildTree = async function(parentId: string | null = null): Promise<any[]> {
  const categories = await this.find({ 
    parent: parentId, 
    isActive: true 
  }).sort({ sortOrder: 1, name: 1 });

  const tree = [];
  for (const category of categories) {
    const children = await this.buildTree(category._id);
    tree.push({
      ...category.toObject(),
      children
    });
  }

  return tree;
};

// Transform output
categorySchema.methods.toJSON = function(this: ICategoryDocument) {
  const category = this.toObject();
  delete category.__v;
  return category;
};

// Create and export the model
export const Category = mongoose.model<ICategoryDocument>('Category', categorySchema);

// Export the schema for testing
export { categorySchema };
