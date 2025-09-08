import mongoose, { Document, Schema } from 'mongoose';

export interface IReview extends Document {
  product: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  rating: number;
  title?: string;
  comment?: string;
  isVerified: boolean;
  helpful: {
    yes: number;
    no: number;
  };
  images?: string[];
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: {
    type: String,
    trim: true,
    maxlength: 200
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  helpful: {
    yes: {
      type: Number,
      default: 0,
      min: 0
    },
    no: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  images: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for helpful percentage
ReviewSchema.virtual('helpfulPercentage').get(function() {
  const total = this.helpful.yes + this.helpful.no;
  if (total === 0) return 0;
  return Math.round((this.helpful.yes / total) * 100);
});

// Indexes
ReviewSchema.index({ product: 1, status: 1 });
ReviewSchema.index({ user: 1, product: 1 }, { unique: true });
ReviewSchema.index({ rating: 1, status: 1 });
ReviewSchema.index({ createdAt: -1 });

export const Review = mongoose.model<IReview>('Review', ReviewSchema);
