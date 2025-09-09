import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { ReviewService } from '../services/reviewService';
import { logger } from '@apnidukaan/shared';

const router = express.Router();
const reviewService = new ReviewService();

// Validation middleware
const handleValidationErrors = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// GET /api/reviews - Get all reviews
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('product').optional().isMongoId().withMessage('Product must be a valid MongoDB ID'),
  query('user').optional().isMongoId().withMessage('User must be a valid MongoDB ID'),
  query('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  query('status').optional().isIn(['pending', 'approved', 'rejected']).withMessage('Invalid status'),
  query('isVerified').optional().isBoolean().withMessage('IsVerified must be a boolean'),
  handleValidationErrors
], async (req: express.Request, res: express.Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      product,
      user,
      rating,
      status,
      isVerified
    } = req.query;

    const filters = {
      product: product as string,
      user: user as string,
      rating: rating ? parseInt(rating as string) : undefined,
      status: status as string,
      isVerified: isVerified ? isVerified === 'true' : undefined
    };

    const result = await reviewService.getReviews(
      filters,
      parseInt(page as string),
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: result.reviews,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: result.total,
        pages: result.pages
      }
    });
  } catch (error: any) {
    logger.error('Failed to get reviews', {
      error: error.message,
      query: req.query,
      action: 'get_reviews_api_failed'
    });
    res.status(500).json({
      success: false,
      message: 'Failed to get reviews',
      error: error.message
    });
  }
});

// GET /api/reviews/product/:productId - Get product reviews
router.get('/product/:productId', [
  param('productId').isMongoId().withMessage('Product ID must be a valid MongoDB ID'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  handleValidationErrors
], async (req: express.Request, res: express.Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await reviewService.getProductReviews(
      req.params.productId,
      page,
      limit
    );

    res.json({
      success: true,
      data: {
        reviews: result.reviews,
        averageRating: result.averageRating,
        pagination: {
          page,
          limit,
          total: result.total,
          pages: result.pages
        }
      }
    });
  } catch (error: any) {
    logger.error('Failed to get product reviews', {
      error: error.message,
      productId: req.params.productId,
      query: req.query,
      action: 'get_product_reviews_api_failed'
    });
    res.status(500).json({
      success: false,
      message: 'Failed to get product reviews',
      error: error.message
    });
  }
});

// GET /api/reviews/stats/:productId - Get review statistics
router.get('/stats/:productId', [
  param('productId').isMongoId().withMessage('Product ID must be a valid MongoDB ID'),
  handleValidationErrors
], async (req: express.Request, res: express.Response) => {
  try {
    const stats = await reviewService.getReviewStats(req.params.productId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    logger.error('Failed to get review stats', {
      error: error.message,
      productId: req.params.productId,
      action: 'get_review_stats_api_failed'
    });
    res.status(500).json({
      success: false,
      message: 'Failed to get review statistics',
      error: error.message
    });
  }
});

// GET /api/reviews/:id - Get review by ID
router.get('/:id', [
  param('id').isMongoId().withMessage('Review ID must be a valid MongoDB ID'),
  handleValidationErrors
], async (req: express.Request, res: express.Response) => {
  try {
    const review = await reviewService.getReviewById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.json({
      success: true,
      data: review
    });
  } catch (error: any) {
    logger.error('Failed to get review by ID', {
      error: error.message,
      reviewId: req.params.id,
      action: 'get_review_by_id_api_failed'
    });
    res.status(500).json({
      success: false,
      message: 'Failed to get review',
      error: error.message
    });
  }
});

// POST /api/reviews - Create new review
router.post('/', [
  body('product').isMongoId().withMessage('Product must be a valid MongoDB ID'),
  body('user').isMongoId().withMessage('User must be a valid MongoDB ID'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('title').optional().isString().withMessage('Title must be a string'),
  body('comment').optional().isString().withMessage('Comment must be a string'),
  body('images').optional().isArray().withMessage('Images must be an array'),
  handleValidationErrors
], async (req: express.Request, res: express.Response) => {
  try {
    const review = await reviewService.createReview(req.body);

    res.status(201).json({
      success: true,
      data: review,
      message: 'Review created successfully'
    });
  } catch (error: any) {
    logger.error('Failed to create review', {
      error: error.message,
      reviewData: req.body,
      action: 'create_review_api_failed'
    });
    
    const statusCode = error.message.includes('already reviewed') ? 400 : 500;
    
    res.status(statusCode).json({
      success: false,
      message: 'Failed to create review',
      error: error.message
    });
  }
});

// PUT /api/reviews/:id - Update review
router.put('/:id', [
  param('id').isMongoId().withMessage('Review ID must be a valid MongoDB ID'),
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('title').optional().isString().withMessage('Title must be a string'),
  body('comment').optional().isString().withMessage('Comment must be a string'),
  body('images').optional().isArray().withMessage('Images must be an array'),
  handleValidationErrors
], async (req: express.Request, res: express.Response) => {
  try {
    const review = await reviewService.updateReview(req.params.id, req.body);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.json({
      success: true,
      data: review,
      message: 'Review updated successfully'
    });
  } catch (error: any) {
    logger.error('Failed to update review', {
      error: error.message,
      reviewId: req.params.id,
      updateData: req.body,
      action: 'update_review_api_failed'
    });
    res.status(500).json({
      success: false,
      message: 'Failed to update review',
      error: error.message
    });
  }
});

// DELETE /api/reviews/:id - Delete review
router.delete('/:id', [
  param('id').isMongoId().withMessage('Review ID must be a valid MongoDB ID'),
  handleValidationErrors
], async (req: express.Request, res: express.Response) => {
  try {
    const deleted = await reviewService.deleteReview(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error: any) {
    logger.error('Failed to delete review', {
      error: error.message,
      reviewId: req.params.id,
      action: 'delete_review_api_failed'
    });
    res.status(500).json({
      success: false,
      message: 'Failed to delete review',
      error: error.message
    });
  }
});

// PUT /api/reviews/:id/approve - Approve review
router.put('/:id/approve', [
  param('id').isMongoId().withMessage('Review ID must be a valid MongoDB ID'),
  handleValidationErrors
], async (req: express.Request, res: express.Response) => {
  try {
    const review = await reviewService.approveReview(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.json({
      success: true,
      data: review,
      message: 'Review approved successfully'
    });
  } catch (error: any) {
    logger.error('Failed to approve review', {
      error: error.message,
      reviewId: req.params.id,
      action: 'approve_review_api_failed'
    });
    res.status(500).json({
      success: false,
      message: 'Failed to approve review',
      error: error.message
    });
  }
});

// PUT /api/reviews/:id/reject - Reject review
router.put('/:id/reject', [
  param('id').isMongoId().withMessage('Review ID must be a valid MongoDB ID'),
  handleValidationErrors
], async (req: express.Request, res: express.Response) => {
  try {
    const review = await reviewService.rejectReview(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.json({
      success: true,
      data: review,
      message: 'Review rejected successfully'
    });
  } catch (error: any) {
    logger.error('Failed to reject review', {
      error: error.message,
      reviewId: req.params.id,
      action: 'reject_review_api_failed'
    });
    res.status(500).json({
      success: false,
      message: 'Failed to reject review',
      error: error.message
    });
  }
});

// PUT /api/reviews/:id/helpful - Mark review as helpful
router.put('/:id/helpful', [
  param('id').isMongoId().withMessage('Review ID must be a valid MongoDB ID'),
  body('helpful').isBoolean().withMessage('Helpful must be a boolean'),
  handleValidationErrors
], async (req: express.Request, res: express.Response) => {
  try {
    const review = await reviewService.markReviewHelpful(req.params.id, req.body.helpful);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.json({
      success: true,
      data: review,
      message: 'Review helpfulness updated successfully'
    });
  } catch (error: any) {
    logger.error('Failed to update review helpfulness', {
      error: error.message,
      reviewId: req.params.id,
      helpful: req.body.helpful,
      action: 'update_review_helpfulness_api_failed'
    });
    res.status(500).json({
      success: false,
      message: 'Failed to update review helpfulness',
      error: error.message
    });
  }
});

export default router;
