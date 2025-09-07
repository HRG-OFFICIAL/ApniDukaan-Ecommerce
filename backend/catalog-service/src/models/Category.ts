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
