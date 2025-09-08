import mongoose from 'mongoose';
import { timestampPlugin } from '@shopsphere/shared';

export interface IReview extends mongoose.Document {
  _id: string;
  product: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  rating: number;
  title: string;
  comment: string;
  pros?: string[];
  cons?: string[];
  images?: string[];
  isVerifiedPurchase: boolean;
  isHelpful: {
    yes: number;
    no: number;
  };
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  moderatorNote?: string;
  replies: Array<{
    user: mongoose.Types.ObjectId;
    message: string;
    isFromSeller: boolean;
    createdAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new mongoose.Schema<IReview>({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product reference is required']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required']
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  title: {
    type: String,
    required: [true, 'Review title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  comment: {
    type: String,
    required: [true, 'Review comment is required'],
    trim: true,
    maxlength: [2000, 'Comment cannot exceed 2000 characters']
  },
  pros: [{
    type: String,
    trim: true,
    maxlength: [200, 'Pro cannot exceed 200 characters']
  }],
  cons: [{
    type: String,
    trim: true,
    maxlength: [200, 'Con cannot exceed 200 characters']
  }],
  images: [{
    type: String
  }],
  isVerifiedPurchase: {
    type: Boolean,
    default: false
  },
  isHelpful: {
    yes: {
      type: Number,
      default: 0,
      min: [0, 'Helpful count cannot be negative']
    },
    no: {
      type: Number,
      default: 0,
      min: [0, 'Helpful count cannot be negative']
    }
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'flagged'],
    default: 'pending'
  },
  moderatorNote: {
    type: String,
    maxlength: [500, 'Moderator note cannot exceed 500 characters']
  },
  replies: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: [1000, 'Reply cannot exceed 1000 characters']
    },
    isFromSeller: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
});

// Apply timestamp plugin
ReviewSchema.plugin(timestampPlugin);

// Indexes
ReviewSchema.index({ product: 1, status: 1 });
ReviewSchema.index({ user: 1 });
ReviewSchema.index({ rating: -1 });
ReviewSchema.index({ createdAt: -1 });
ReviewSchema.index({ isVerifiedPurchase: -1 });
ReviewSchema.index({ 'isHelpful.yes': -1 });
ReviewSchema.index({ product: 1, user: 1 }, { unique: true }); // One review per user per product

// Virtual for helpful score (yes - no)
ReviewSchema.virtual('helpfulScore').get(function(this: IReview) {
  return this.isHelpful.yes - this.isHelpful.no;
});

// Virtual for total helpful votes
ReviewSchema.virtual('totalHelpfulVotes').get(function(this: IReview) {
  return this.isHelpful.yes + this.isHelpful.no;
});

// Virtual for checking if review has images
ReviewSchema.virtual('hasImages').get(function(this: IReview) {
  return this.images && this.images.length > 0;
});

// Virtual for checking if review has replies
ReviewSchema.virtual('hasReplies').get(function(this: IReview) {
  return this.replies && this.replies.length > 0;
});

// Static method to get review statistics for a product
ReviewSchema.statics.getProductReviewStats = async function(productId: string) {
  const stats = await this.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId), status: 'approved' } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: '$rating'
        }
      }
    }
  ]);

  if (!stats.length) {
    return {
      averageRating: 0,
      totalReviews: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
  }

  const result = stats[0];
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  
  result.ratingDistribution.forEach((rating: number) => {
    distribution[rating as keyof typeof distribution]++;
  });

  return {
    averageRating: Math.round(result.averageRating * 10) / 10, // Round to 1 decimal
    totalReviews: result.totalReviews,
    distribution
  };
};

// Static method to update product rating after review changes
ReviewSchema.statics.updateProductRating = async function(productId: string) {
  const Product = mongoose.model('Product');
  const stats = await this.getProductReviewStats(productId);
  
  await Product.findByIdAndUpdate(productId, {
    'rating.average': stats.averageRating,
    'rating.count': stats.totalReviews,
    'rating.distribution': stats.distribution
  });
};

// Middleware to update product rating after save
ReviewSchema.post('save', async function(this: IReview) {
  await this.constructor.updateProductRating(this.product.toString());
});

// Middleware to update product rating after delete
ReviewSchema.post('findOneAndDelete', async function(doc: IReview) {
  if (doc) {
    await doc.constructor.updateProductRating(doc.product.toString());
  }
});

// Middleware to update product rating after update
ReviewSchema.post('findOneAndUpdate', async function(doc: IReview) {
  if (doc) {
    await doc.constructor.updateProductRating(doc.product.toString());
  }
});

// Instance method to add a reply
ReviewSchema.methods.addReply = function(
  userId: string,
  message: string,
  isFromSeller: boolean = false
) {
  this.replies.push({
    user: new mongoose.Types.ObjectId(userId),
    message,
    isFromSeller,
    createdAt: new Date()
  });
  return this.save();
};

// Instance method to mark as helpful
ReviewSchema.methods.markHelpful = function(isHelpful: boolean) {
  if (isHelpful) {
    this.isHelpful.yes += 1;
  } else {
    this.isHelpful.no += 1;
  }
  return this.save();
};

// Static method to get reviews with pagination and filtering
ReviewSchema.statics.getReviews = function(
  productId: string,
  options: {
    page?: number;
    limit?: number;
    rating?: number;
    sortBy?: 'newest' | 'oldest' | 'helpful' | 'rating_high' | 'rating_low';
    verifiedOnly?: boolean;
  } = {}
) {
  const {
    page = 1,
    limit = 10,
    rating,
    sortBy = 'newest',
    verifiedOnly = false
  } = options;

  const skip = (page - 1) * limit;
  const query: any = {
    product: productId,
    status: 'approved'
  };

  if (rating) {
    query.rating = rating;
  }

  if (verifiedOnly) {
    query.isVerifiedPurchase = true;
  }

  let sort: any = { createdAt: -1 }; // Default: newest first
  
  switch (sortBy) {
    case 'oldest':
      sort = { createdAt: 1 };
      break;
    case 'helpful':
      sort = { 'isHelpful.yes': -1, createdAt: -1 };
      break;
    case 'rating_high':
      sort = { rating: -1, createdAt: -1 };
      break;
    case 'rating_low':
      sort = { rating: 1, createdAt: -1 };
      break;
  }

  return this.find(query)
    .populate('user', 'name avatar')
    .populate('replies.user', 'name avatar')
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();
};

// Static method to get review summary for a product
ReviewSchema.statics.getReviewSummary = async function(productId: string) {
  const pipeline = [
    {
      $match: {
        product: new mongoose.Types.ObjectId(productId),
        status: 'approved'
      }
    },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        averageRating: { $avg: '$rating' },
        ratingDistribution: {
          $push: '$rating'
        },
        verifiedReviews: {
          $sum: { $cond: ['$isVerifiedPurchase', 1, 0] }
        }
      }
    }
  ];

  const result = await this.aggregate(pipeline);
  
  if (!result || result.length === 0) {
    return {
      totalReviews: 0,
      averageRating: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      verifiedReviews: 0,
      recommendationPercentage: 0
    };
  }

  const summary = result[0];
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  
  // Count rating distribution
  summary.ratingDistribution.forEach((rating: number) => {
    distribution[rating as keyof typeof distribution]++;
  });
  
  // Calculate recommendation percentage (4 and 5 stars)
  const positiveReviews = distribution[4] + distribution[5];
  const recommendationPercentage = summary.totalReviews > 0 
    ? Math.round((positiveReviews / summary.totalReviews) * 100)
    : 0;
  
  return {
    totalReviews: summary.totalReviews,
    averageRating: parseFloat(summary.averageRating.toFixed(1)),
    ratingDistribution: distribution,
    verifiedReviews: summary.verifiedReviews,
    recommendationPercentage
  };
};

const Review = mongoose.model<IReview>('Review', ReviewSchema);

export default Review;
export { ReviewSchema };

import mongoose, { Schema, Document } from 'mongoose';
import { IReview, ReviewStatus, timestampPlugin } from '@shopsphere/shared';

export interface IReviewDocument extends IReview, Document {
  markAsHelpful(userId: string): Promise<void>;
  markAsUnhelpful(userId: string): Promise<void>;
  updateStatus(status: ReviewStatus): Promise<void>;
}

const reviewSchema = new Schema<IReviewDocument>({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  user: {
    type: Schema.Types.ObjectId,
    required: true,
    index: true
  },
  userName: {
    type: String,
    required: true,
    trim: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    alt: {
      type: String,
      default: ''
    }
  }],
  verified: {
    type: Boolean,
    default: false,
    index: true
  },
  status: {
    type: String,
    enum: Object.values(ReviewStatus),
    default: ReviewStatus.PENDING,
    index: true
  },
  helpfulVotes: {
    count: {
      type: Number,
      default: 0,
      min: 0
    },
    users: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  unhelpfulVotes: {
    count: {
      type: Number,
      default: 0,
      min: 0
    },
    users: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  moderatorNotes: {
    type: String,
    default: null
  },
  moderatedBy: {
    type: Schema.Types.ObjectId,
    default: null
  },
  moderatedAt: {
    type: Date,
    default: null
  }
});

// Add timestamp plugin
reviewSchema.plugin(timestampPlugin);

// Indexes
reviewSchema.index({ product: 1, status: 1, createdAt: -1 });
reviewSchema.index({ user: 1, createdAt: -1 });
reviewSchema.index({ rating: 1, status: 1 });
reviewSchema.index({ verified: 1, status: 1 });
reviewSchema.index({ 'helpfulVotes.count': -1, status: 1 });

// Compound index to prevent duplicate reviews
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

// Virtual for helpfulness ratio
reviewSchema.virtual('helpfulnessRatio').get(function(this: IReviewDocument) {
  const total = this.helpfulVotes.count + this.unhelpfulVotes.count;
  if (total === 0) return 0;
  return this.helpfulVotes.count / total;
});

// Instance method to mark as helpful
reviewSchema.methods.markAsHelpful = async function(
  this: IReviewDocument,
  userId: string
): Promise<void> {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  
  // Remove from unhelpful if exists
  await this.updateOne({
    $pull: { 'unhelpfulVotes.users': userObjectId }
  });
  
  // Add to helpful if not already there
  const isAlreadyHelpful = this.helpfulVotes.users.some(id => id.equals(userObjectId));
  if (!isAlreadyHelpful) {
    await this.updateOne({
      $addToSet: { 'helpfulVotes.users': userObjectId },
      $inc: { 'helpfulVotes.count': 1 }
    });
  }
  
  // Recalculate unhelpful count
  await this.updateOne({
    $set: { 'unhelpfulVotes.count': this.unhelpfulVotes.users.length }
  });
};

// Instance method to mark as unhelpful
reviewSchema.methods.markAsUnhelpful = async function(
  this: IReviewDocument,
  userId: string
): Promise<void> {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  
  // Remove from helpful if exists
  await this.updateOne({
    $pull: { 'helpfulVotes.users': userObjectId }
  });
  
  // Add to unhelpful if not already there
  const isAlreadyUnhelpful = this.unhelpfulVotes.users.some(id => id.equals(userObjectId));
  if (!isAlreadyUnhelpful) {
    await this.updateOne({
      $addToSet: { 'unhelpfulVotes.users': userObjectId },
      $inc: { 'unhelpfulVotes.count': 1 }
    });
  }
  
  // Recalculate helpful count
  await this.updateOne({
    $set: { 'helpfulVotes.count': this.helpfulVotes.users.length }
  });
};

// Instance method to update status
reviewSchema.methods.updateStatus = async function(
  this: IReviewDocument,
  status: ReviewStatus
): Promise<void> {
  await this.updateOne({
    $set: {
      status,
      moderatedAt: new Date()
    }
  });
};

// Static methods
reviewSchema.statics.findByProduct = function(
  productId: string,
  status: ReviewStatus = ReviewStatus.APPROVED,
  limit: number = 20,
  skip: number = 0
) {
  return this.find({ 
    product: productId, 
    status 
  })
  .sort({ 'helpfulVotes.count': -1, createdAt: -1 })
  .limit(limit)
  .skip(skip);
};

reviewSchema.statics.findByUser = function(
  userId: string,
  limit: number = 20,
  skip: number = 0
) {
  return this.find({ user: userId })
  .sort({ createdAt: -1 })
  .limit(limit)
  .skip(skip)
  .populate('product', 'name images');
};

reviewSchema.statics.getProductRatingStats = async function(productId: string) {
  const stats = await this.aggregate([
    {
      $match: {
        product: new mongoose.Types.ObjectId(productId),
        status: ReviewStatus.APPROVED
      }
    },
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: -1 }
    }
  ]);

  const ratingDistribution = {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0
  };

  let totalReviews = 0;
  let totalRating = 0;

  stats.forEach(stat => {
    ratingDistribution[stat._id] = stat.count;
    totalReviews += stat.count;
    totalRating += stat._id * stat.count;
  });

  const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;

  return {
    averageRating: Math.round(averageRating * 10) / 10,
    totalReviews,
    ratingDistribution
  };
};

// Transform output
reviewSchema.methods.toJSON = function(this: IReviewDocument) {
  const review = this.toObject({ virtuals: true });
  
  // Remove sensitive fields
  delete review.__v;
  delete review.helpfulVotes.users;
  delete review.unhelpfulVotes.users;
  delete review.moderatorNotes;
  delete review.moderatedBy;
  delete review.moderatedAt;
  
  return review;
};

// Create and export the model
export const Review = mongoose.model<IReviewDocument>('Review', reviewSchema);

// Export the schema for testing
export { reviewSchema };
