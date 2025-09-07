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
