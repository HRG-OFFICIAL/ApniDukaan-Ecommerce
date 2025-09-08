import { Review, IReview } from '../models/Review';
import { Product } from '../models/Product';
import { logger } from '@shopsphere/shared';

export interface ReviewFilters {
  product?: string;
  user?: string;
  rating?: number;
  status?: string;
  isVerified?: boolean;
}

export class ReviewService {
  async createReview(reviewData: Partial<IReview>): Promise<IReview> {
    try {
      // Check if user already reviewed this product
      const existingReview = await Review.findOne({
        product: reviewData.product,
        user: reviewData.user
      });

      if (existingReview) {
        throw new Error('User has already reviewed this product');
      }

      const review = new Review(reviewData);
      await review.save();

      // Update product rating
      await this.updateProductRating(review.product.toString());

      logger.info('Review created successfully', {
        reviewId: review._id,
        productId: review.product,
        userId: review.user,
        action: 'review_created'
      });

      return review;
    } catch (error: any) {
      logger.error('Failed to create review', {
        error: error.message,
        reviewData,
        action: 'review_creation_failed'
      });
      throw error;
    }
  }

  async getReviewById(id: string): Promise<IReview | null> {
    try {
      const review = await Review.findById(id)
        .populate('product', 'name slug')
        .populate('user', 'name email');

      return review;
    } catch (error: any) {
      logger.error('Failed to get review by ID', {
        error: error.message,
        reviewId: id,
        action: 'get_review_failed'
      });
      throw error;
    }
  }

  async getReviews(
    filters: ReviewFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{ reviews: IReview[]; total: number; pages: number }> {
    try {
      const query: any = {};

      // Apply filters
      if (filters.product) {
        query.product = filters.product;
      }
      if (filters.user) {
        query.user = filters.user;
      }
      if (filters.rating) {
        query.rating = filters.rating;
      }
      if (filters.status) {
        query.status = filters.status;
      }
      if (filters.isVerified !== undefined) {
        query.isVerified = filters.isVerified;
      }

      // Execute query
      const skip = (page - 1) * limit;
      const [reviews, total] = await Promise.all([
        Review.find(query)
          .populate('product', 'name slug')
          .populate('user', 'name email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Review.countDocuments(query)
      ]);

      const pages = Math.ceil(total / limit);

      return { reviews, total, pages };
    } catch (error: any) {
      logger.error('Failed to get reviews', {
        error: error.message,
        filters,
        page,
        limit,
        action: 'get_reviews_failed'
      });
      throw error;
    }
  }

  async getProductReviews(
    productId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ reviews: IReview[]; total: number; pages: number; averageRating: number }> {
    try {
      const skip = (page - 1) * limit;
      const [reviews, total, ratingStats] = await Promise.all([
        Review.find({ product: productId, status: 'approved' })
          .populate('user', 'name email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Review.countDocuments({ product: productId, status: 'approved' }),
        Review.aggregate([
          { $match: { product: productId, status: 'approved' } },
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
        ])
      ]);

      const pages = Math.ceil(total / limit);
      const averageRating = ratingStats.length > 0 ? ratingStats[0].averageRating : 0;

      return { reviews, total, pages, averageRating };
    } catch (error: any) {
      logger.error('Failed to get product reviews', {
        error: error.message,
        productId,
        page,
        limit,
        action: 'get_product_reviews_failed'
      });
      throw error;
    }
  }

  async updateReview(id: string, updateData: Partial<IReview>): Promise<IReview | null> {
    try {
      const review = await Review.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).populate('product', 'name slug')
       .populate('user', 'name email');

      if (review) {
        // Update product rating if rating changed
        if (updateData.rating || updateData.status) {
          await this.updateProductRating(review.product.toString());
        }

        logger.info('Review updated successfully', {
          reviewId: id,
          action: 'review_updated'
        });
      }

      return review;
    } catch (error: any) {
      logger.error('Failed to update review', {
        error: error.message,
        reviewId: id,
        updateData,
        action: 'review_update_failed'
      });
      throw error;
    }
  }

  async deleteReview(id: string): Promise<boolean> {
    try {
      const review = await Review.findById(id);
      if (!review) return false;

      const productId = review.product.toString();
      await Review.findByIdAndDelete(id);

      // Update product rating
      await this.updateProductRating(productId);

      logger.info('Review deleted successfully', {
        reviewId: id,
        action: 'review_deleted'
      });

      return true;
    } catch (error: any) {
      logger.error('Failed to delete review', {
        error: error.message,
        reviewId: id,
        action: 'review_deletion_failed'
      });
      throw error;
    }
  }

  async approveReview(id: string): Promise<IReview | null> {
    try {
      const review = await Review.findByIdAndUpdate(
        id,
        { status: 'approved' },
        { new: true }
      ).populate('product', 'name slug')
       .populate('user', 'name email');

      if (review) {
        // Update product rating
        await this.updateProductRating(review.product.toString());

        logger.info('Review approved successfully', {
          reviewId: id,
          action: 'review_approved'
        });
      }

      return review;
    } catch (error: any) {
      logger.error('Failed to approve review', {
        error: error.message,
        reviewId: id,
        action: 'review_approval_failed'
      });
      throw error;
    }
  }

  async rejectReview(id: string): Promise<IReview | null> {
    try {
      const review = await Review.findByIdAndUpdate(
        id,
        { status: 'rejected' },
        { new: true }
      ).populate('product', 'name slug')
       .populate('user', 'name email');

      if (review) {
        logger.info('Review rejected successfully', {
          reviewId: id,
          action: 'review_rejected'
        });
      }

      return review;
    } catch (error: any) {
      logger.error('Failed to reject review', {
        error: error.message,
        reviewId: id,
        action: 'review_rejection_failed'
      });
      throw error;
    }
  }

  async markReviewHelpful(reviewId: string, helpful: boolean): Promise<IReview | null> {
    try {
      const updateField = helpful ? 'helpful.yes' : 'helpful.no';
      const review = await Review.findByIdAndUpdate(
        reviewId,
        { $inc: { [updateField]: 1 } },
        { new: true }
      );

      if (review) {
        logger.info('Review helpfulness updated', {
          reviewId,
          helpful,
          action: 'review_helpfulness_updated'
        });
      }

      return review;
    } catch (error: any) {
      logger.error('Failed to update review helpfulness', {
        error: error.message,
        reviewId,
        helpful,
        action: 'review_helpfulness_update_failed'
      });
      throw error;
    }
  }

  async getReviewStats(productId: string): Promise<any> {
    try {
      const stats = await Review.aggregate([
        { $match: { product: productId, status: 'approved' } },
        {
          $group: {
            _id: null,
            totalReviews: { $sum: 1 },
            averageRating: { $avg: '$rating' },
            ratingDistribution: {
              $push: '$rating'
            }
          }
        }
      ]);

      if (stats.length === 0) {
        return {
          totalReviews: 0,
          averageRating: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        };
      }

      const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      stats[0].ratingDistribution.forEach((rating: number) => {
        ratingDistribution[rating as keyof typeof ratingDistribution]++;
      });

      return {
        totalReviews: stats[0].totalReviews,
        averageRating: Math.round(stats[0].averageRating * 10) / 10,
        ratingDistribution
      };
    } catch (error: any) {
      logger.error('Failed to get review stats', {
        error: error.message,
        productId,
        action: 'get_review_stats_failed'
      });
      throw error;
    }
  }

  private async updateProductRating(productId: string): Promise<void> {
    try {
      const reviews = await Review.find({
        product: productId,
        status: 'approved'
      });

      if (reviews.length === 0) {
        await Product.findByIdAndUpdate(productId, {
          'rating.average': 0,
          'rating.count': 0
        });
        return;
      }

      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / reviews.length;

      await Product.findByIdAndUpdate(productId, {
        'rating.average': Math.round(averageRating * 10) / 10,
        'rating.count': reviews.length
      });

      logger.info('Product rating updated', {
        productId,
        averageRating,
        reviewCount: reviews.length,
        action: 'product_rating_updated'
      });
    } catch (error: any) {
      logger.error('Failed to update product rating', {
        error: error.message,
        productId,
        action: 'product_rating_update_failed'
      });
      throw error;
    }
  }
}
