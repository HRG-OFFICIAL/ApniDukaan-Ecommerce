import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  brand: string;
  images: string[];
  inStock: boolean;
  stockQuantity: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  originalPrice: {
    type: Number,
    min: 0
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  brand: {
    type: String,
    required: true,
    trim: true
  },
  images: [{
    type: String,
    required: true
  }],
  inStock: {
    type: Boolean,
    default: true
  },
  stockQuantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for search
ProductSchema.index({ name: 'text', description: 'text', category: 'text', brand: 'text' });
ProductSchema.index({ category: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ createdAt: -1 });

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
