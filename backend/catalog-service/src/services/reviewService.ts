import { Review, IReviewDocument } from '../models/Review';
import { Product } from '../models/Product';
import { ReviewStatus, logger, ValidationError, NotFoundError, ForbiddenError } from '@shopsphere/shared';

class ReviewService {
  async getProductReviews(
    productId: string,
    status: ReviewStatus = ReviewStatus.APPROVED,
    limit: number = 20,
    offset: number = 0
  ): Promise<IReviewDocument[]> {
    try {
      const reviews = await Review.findByProduct(productId, status, limit, offset);

      logger.info('Product reviews retrieved', {
        productId,
        status,
        count: reviews.length,
        action: 'get_product_reviews'
      });

      return reviews;
    } catch (error) {
      logger.error('Failed to get product reviews', {
        productId,
        error: error.message,
        action: 'get_product_reviews'
      });
      throw error;
    }
  }

  async getUserReviews(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<IReviewDocument[]> {
    try {
      const reviews = await Review.findByUser(userId, limit, offset);

      logger.info('User reviews retrieved', {
        userId,
        count: reviews.length,
        action: 'get_user_reviews'
      });

      return reviews;
    } catch (error) {
      logger.error('Failed to get user reviews', {
        userId,
        error: error.message,
        action: 'get_user_reviews'
      });
      throw error;
    }
  }

  async getReviewById(id: string): Promise<IReviewDocument | null> {
    try {
      const review = await Review.findById(id)
        .populate('product', 'name images')
        .exec();

      return review;
    } catch (error) {
      logger.error('Failed to get review by ID', {
        reviewId: id,
        error: error.message,
        action: 'get_review_by_id'
      });
      throw error;
    }
  }

  async getProductRatingStats(productId: string): Promise<any> {
    try {
      const stats = await Review.getProductRatingStats(productId);

      logger.info('Product rating stats retrieved', {
        productId,
        stats,
        action: 'get_product_rating_stats'
      });

      return {
        ...stats,
        ratingDistribution: {
          five: stats.ratingDistribution[5] || 0,
          four: stats.ratingDistribution[4] || 0,
          three: stats.ratingDistribution[3] || 0,
          two: stats.ratingDistribution[2] || 0,
          one: stats.ratingDistribution[1] || 0
        }
      };
    } catch (error) {
      logger.error('Failed to get product rating stats', {
        productId,
        error: error.message,
        action: 'get_product_rating_stats'
      });
      throw error;
    }
  }

  async createReview(reviewData: any, userId: string, userName: string): Promise<IReviewDocument> {
    try {
      // Validate product exists
      const product = await Product.findById(reviewData.product);
      if (!product) {
        throw new ValidationError('Product not found');
      }

      // Check if user already reviewed this product
      const existingReview = await Review.findOne({
        product: reviewData.product,
        user: userId
      });

      if (existingReview) {
        throw new ValidationError('You have already reviewed this product');
      }

      // Create review
      const review = new Review({
        ...reviewData,
        user: userId,
        userName,
        status: ReviewStatus.PENDING
      });

      await review.save();

      // Update product rating
      await product.updateRating(reviewData.rating);

      logger.info('Review created successfully', {
        reviewId: review._id,
        productId: reviewData.product,
        userId,
        rating: reviewData.rating,
        action: 'create_review'
      });

      return review;
    } catch (error) {
      logger.error('Failed to create review', {
        reviewData,
        userId,
        error: error.message,
        action: 'create_review'
      });
      throw error;
    }
  }

  async updateReviewStatus(
    id: string,
    status: ReviewStatus,
    moderatorId: string
  ): Promise<IReviewDocument> {
    try {
      const review = await Review.findById(id);
      if (!review) {
        throw new NotFoundError('Review not found');
      }

      review.status = status;
      review.moderatedBy = moderatorId;
      review.moderatedAt = new Date();
      await review.save();

      // If approved, update product rating
      if (status === ReviewStatus.APPROVED) {
        const product = await Product.findById(review.product);
        if (product) {
          await product.updateRating(review.rating);
        }
      }

      logger.info('Review status updated', {
        reviewId: id,
        status,
        moderatorId,
        action: 'update_review_status'
      });

      return review;
    } catch (error) {
      logger.error('Failed to update review status', {
        reviewId: id,
        status,
        moderatorId,
        error: error.message,
        action: 'update_review_status'
      });
      throw error;
    }
  }

  async markReviewHelpful(id: string, userId: string): Promise<IReviewDocument> {
    try {
      const review = await Review.findById(id);
      if (!review) {
        throw new NotFoundError('Review not found');
      }

      await review.markAsHelpful(userId);

      logger.info('Review marked as helpful', {
        reviewId: id,
        userId,
        action: 'mark_review_helpful'
      });

      return await Review.findById(id);
    } catch (error) {
      logger.error('Failed to mark review as helpful', {
        reviewId: id,
        userId,
        error: error.message,
        action: 'mark_review_helpful'
      });
      throw error;
    }
  }

  async markReviewUnhelpful(id: string, userId: string): Promise<IReviewDocument> {
    try {
      const review = await Review.findById(id);
      if (!review) {
        throw new NotFoundError('Review not found');
      }

      await review.markAsUnhelpful(userId);

      logger.info('Review marked as unhelpful', {
        reviewId: id,
        userId,
        action: 'mark_review_unhelpful'
      });

      return await Review.findById(id);
    } catch (error) {
      logger.error('Failed to mark review as unhelpful', {
        reviewId: id,
        userId,
        error: error.message,
        action: 'mark_review_unhelpful'
      });
      throw error;
    }
  }

  async deleteReview(id: string, userId: string, isAdmin: boolean = false): Promise<boolean> {
    try {
      const review = await Review.findById(id);
      if (!review) {
        throw new NotFoundError('Review not found');
      }

      // Check permissions
      if (!isAdmin && review.user.toString() !== userId) {
        throw new ForbiddenError('You can only delete your own reviews');
      }

      await Review.findByIdAndDelete(id);

      logger.info('Review deleted successfully', {
        reviewId: id,
        userId,
        isAdmin,
        action: 'delete_review'
      });

      return true;
    } catch (error) {
      logger.error('Failed to delete review', {
        reviewId: id,
        userId,
        error: error.message,
        action: 'delete_review'
      });
      throw error;
    }
  }
}

export const reviewService = new ReviewService();
