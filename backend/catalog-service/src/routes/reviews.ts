import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authenticate, authorize } from '@shopsphere/shared';
import { ReviewModel } from '../models/Review';
import { ProductModel } from '../models/Product';
import { logger } from '@shopsphere/shared';

const router = express.Router();

// Validation rules
const createReviewValidation = [
  body('product')
    .isMongoId()
    .withMessage('Product ID must be valid'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Review title is required and must be less than 200 characters'),
  body('comment')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Review comment must be between 10 and 2000 characters'),
  body('pros')
    .optional()
    .isArray()
    .withMessage('Pros must be an array'),
  body('pros.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Each pro must be less than 100 characters'),
  body('cons')
    .optional()
    .isArray()
    .withMessage('Cons must be an array'),
  body('cons.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Each con must be less than 100 characters')
];

const updateReviewValidation = [
  param('id')
    .isMongoId()
    .withMessage('Review ID must be valid'),
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Review title must be less than 200 characters'),
  body('comment')
    .optional()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Review comment must be between 10 and 2000 characters')
];

const reviewQueryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  query('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating filter must be between 1 and 5')
];

/**
 * @route GET /reviews
 * @desc Get reviews with filtering and pagination
 * @access Public
 */
router.get('/',
  reviewQueryValidation,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      // Build filter query
      const filter: any = { status: 'approved' };

      if (req.query.product) {
        filter.product = req.query.product;
      }

      if (req.query.user) {
        filter.user = req.query.user;
      }

      if (req.query.rating) {
        filter.rating = parseInt(req.query.rating as string);
      }

      if (req.query.verified) {
        filter.verified = req.query.verified === 'true';
      }

      // Build sort query
      let sort: any = { createdAt: -1 }; // default sort

      switch (req.query.sort) {
        case 'rating_desc':
          sort = { rating: -1, createdAt: -1 };
          break;
        case 'rating_asc':
          sort = { rating: 1, createdAt: -1 };
          break;
        case 'helpful_desc':
          sort = { helpfulVotes: -1, createdAt: -1 };
          break;
        case 'newest':
          sort = { createdAt: -1 };
          break;
        case 'oldest':
          sort = { createdAt: 1 };
          break;
      }

      // Execute query
      const [reviews, total] = await Promise.all([
        ReviewModel.find(filter)
          .populate('user', 'firstName lastName avatar')
          .populate('product', 'name slug images')
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        ReviewModel.countDocuments(filter)
      ]);

      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        data: {
          reviews,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        }
      });

    } catch (error) {
      logger.error('Error fetching reviews:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch reviews',
        code: 'FETCH_REVIEWS_ERROR'
      });
    }
  }
);

/**
 * @route GET /reviews/:id
 * @desc Get single review by ID
 * @access Public
 */
router.get('/:id',
  param('id').isMongoId().withMessage('Review ID must be valid'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const review = await ReviewModel.findById(req.params.id)
        .populate('user', 'firstName lastName avatar')
        .populate('product', 'name slug images')
        .populate('replies.user', 'firstName lastName avatar')
        .lean();

      if (!review) {
        return res.status(404).json({
          success: false,
          error: 'Review not found',
          code: 'REVIEW_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        data: { review }
      });

    } catch (error) {
      logger.error('Error fetching review:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch review',
        code: 'FETCH_REVIEW_ERROR'
      });
    }
  }
);

/**
 * @route POST /reviews
 * @desc Create new review
 * @access Authenticated User
 */
router.post('/',
  authenticate,
  authorize({ roles: ['user', 'admin', 'moderator'] }),
  createReviewValidation,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      // Check if product exists
      const product = await ProductModel.findById(req.body.product);
      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Product not found',
          code: 'PRODUCT_NOT_FOUND'
        });
      }

      // Check if user has already reviewed this product
      const existingReview = await ReviewModel.findOne({
        product: req.body.product,
        user: req.user!.userId
      });

      if (existingReview) {
        return res.status(409).json({
          success: false,
          error: 'You have already reviewed this product',
          code: 'REVIEW_EXISTS'
        });
      }

      // Create review
      const review = new ReviewModel({
        ...req.body,
        user: req.user!.userId,
        userEmail: req.user!.email,
        status: 'pending' // Reviews need moderation
      });

      await review.save();

      // Update product review statistics
      await product.updateReviewStats();

      logger.info('Review created', {
        reviewId: review._id,
        productId: req.body.product,
        userId: req.user!.userId,
        rating: req.body.rating,
        action: 'create_review'
      });

      res.status(201).json({
        success: true,
        message: 'Review created successfully and is pending moderation',
        data: { review }
      });

    } catch (error) {
      logger.error('Error creating review:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create review',
        code: 'CREATE_REVIEW_ERROR'
      });
    }
  }
);

/**
 * @route PUT /reviews/:id
 * @desc Update review
 * @access Review Owner/Admin/Moderator
 */
router.put('/:id',
  authenticate,
  updateReviewValidation,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const review = await ReviewModel.findById(req.params.id);
      if (!review) {
        return res.status(404).json({
          success: false,
          error: 'Review not found',
          code: 'REVIEW_NOT_FOUND'
        });
      }

      // Check permissions
      const isOwner = review.user.toString() === req.user!.userId;
      const isAdmin = ['admin', 'moderator'].includes(req.user!.role);

      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          code: 'ACCESS_DENIED'
        });
      }

      // Update review
      Object.assign(review, {
        ...req.body,
        updatedAt: new Date()
      });

      // If user is updating their own review, set status to pending for re-moderation
      if (isOwner && !isAdmin) {
        review.status = 'pending';
      }

      await review.save();

      // Update product review statistics if rating changed
      if (req.body.rating && req.body.rating !== review.rating) {
        const product = await ProductModel.findById(review.product);
        if (product) {
          await product.updateReviewStats();
        }
      }

      logger.info('Review updated', {
        reviewId: review._id,
        updatedBy: req.user!.userId,
        isOwner,
        action: 'update_review'
      });

      res.json({
        success: true,
        message: 'Review updated successfully',
        data: { review }
      });

    } catch (error) {
      logger.error('Error updating review:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update review',
        code: 'UPDATE_REVIEW_ERROR'
      });
    }
  }
);

/**
 * @route DELETE /reviews/:id
 * @desc Delete review
 * @access Review Owner/Admin/Moderator
 */
router.delete('/:id',
  authenticate,
  param('id').isMongoId().withMessage('Review ID must be valid'),
  async (req, res) => {
    try {
      const review = await ReviewModel.findById(req.params.id);
      if (!review) {
        return res.status(404).json({
          success: false,
          error: 'Review not found',
          code: 'REVIEW_NOT_FOUND'
        });
      }

      // Check permissions
      const isOwner = review.user.toString() === req.user!.userId;
      const isAdmin = ['admin', 'moderator'].includes(req.user!.role);

      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          code: 'ACCESS_DENIED'
        });
      }

      await review.deleteOne();

      // Update product review statistics
      const product = await ProductModel.findById(review.product);
      if (product) {
        await product.updateReviewStats();
      }

      logger.info('Review deleted', {
        reviewId: review._id,
        deletedBy: req.user!.userId,
        isOwner,
        action: 'delete_review'
      });

      res.json({
        success: true,
        message: 'Review deleted successfully'
      });

    } catch (error) {
      logger.error('Error deleting review:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete review',
        code: 'DELETE_REVIEW_ERROR'
      });
    }
  }
);

/**
 * @route POST /reviews/:id/helpful
 * @desc Mark review as helpful
 * @access Authenticated User
 */
router.post('/:id/helpful',
  authenticate,
  param('id').isMongoId().withMessage('Review ID must be valid'),
  async (req, res) => {
    try {
      const review = await ReviewModel.findById(req.params.id);
      if (!review) {
        return res.status(404).json({
          success: false,
          error: 'Review not found',
          code: 'REVIEW_NOT_FOUND'
        });
      }

      const userId = req.user!.userId;

      // Check if user already voted
      const existingVote = review.helpfulBy.includes(userId);

      if (existingVote) {
        return res.status(400).json({
          success: false,
          error: 'You have already marked this review as helpful',
          code: 'ALREADY_VOTED'
        });
      }

      // Add vote
      review.helpfulBy.push(userId);
      review.helpfulVotes = review.helpfulBy.length;
      await review.save();

      logger.info('Review marked as helpful', {
        reviewId: review._id,
        userId,
        action: 'mark_helpful'
      });

      res.json({
        success: true,
        message: 'Review marked as helpful',
        data: { 
          helpfulVotes: review.helpfulVotes,
          userVoted: true
        }
      });

    } catch (error) {
      logger.error('Error marking review as helpful:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to mark review as helpful',
        code: 'MARK_HELPFUL_ERROR'
      });
    }
  }
);

/**
 * @route DELETE /reviews/:id/helpful
 * @desc Remove helpful mark from review
 * @access Authenticated User
 */
router.delete('/:id/helpful',
  authenticate,
  param('id').isMongoId().withMessage('Review ID must be valid'),
  async (req, res) => {
    try {
      const review = await ReviewModel.findById(req.params.id);
      if (!review) {
        return res.status(404).json({
          success: false,
          error: 'Review not found',
          code: 'REVIEW_NOT_FOUND'
        });
      }

      const userId = req.user!.userId;

      // Check if user has voted
      const voteIndex = review.helpfulBy.indexOf(userId);
      if (voteIndex === -1) {
        return res.status(400).json({
          success: false,
          error: 'You have not marked this review as helpful',
          code: 'NOT_VOTED'
        });
      }

      // Remove vote
      review.helpfulBy.splice(voteIndex, 1);
      review.helpfulVotes = review.helpfulBy.length;
      await review.save();

      logger.info('Helpful mark removed from review', {
        reviewId: review._id,
        userId,
        action: 'remove_helpful'
      });

      res.json({
        success: true,
        message: 'Helpful mark removed',
        data: { 
          helpfulVotes: review.helpfulVotes,
          userVoted: false
        }
      });

    } catch (error) {
      logger.error('Error removing helpful mark:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to remove helpful mark',
        code: 'REMOVE_HELPFUL_ERROR'
      });
    }
  }
);

/**
 * @route POST /reviews/:id/reply
 * @desc Reply to a review
 * @access Admin/Moderator
 */
router.post('/:id/reply',
  authenticate,
  authorize({ roles: ['admin', 'moderator'] }),
  [
    param('id').isMongoId().withMessage('Review ID must be valid'),
    body('comment')
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('Reply comment is required and must be less than 1000 characters')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const review = await ReviewModel.findById(req.params.id);
      if (!review) {
        return res.status(404).json({
          success: false,
          error: 'Review not found',
          code: 'REVIEW_NOT_FOUND'
        });
      }

      // Add reply
      const reply = {
        user: req.user!.userId,
        comment: req.body.comment,
        createdAt: new Date()
      };

      review.replies.push(reply);
      await review.save();

      // Populate the reply user data
      await review.populate('replies.user', 'firstName lastName avatar');

      logger.info('Review reply added', {
        reviewId: review._id,
        replyBy: req.user!.userId,
        action: 'add_reply'
      });

      res.status(201).json({
        success: true,
        message: 'Reply added successfully',
        data: { 
          reply: review.replies[review.replies.length - 1]
        }
      });

    } catch (error) {
      logger.error('Error adding review reply:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add reply',
        code: 'ADD_REPLY_ERROR'
      });
    }
  }
);

/**
 * @route PATCH /reviews/:id/status
 * @desc Update review status (moderate)
 * @access Admin/Moderator
 */
router.patch('/:id/status',
  authenticate,
  authorize({ roles: ['admin', 'moderator'] }),
  [
    param('id').isMongoId().withMessage('Review ID must be valid'),
    body('status').isIn(['pending', 'approved', 'rejected']).withMessage('Invalid status'),
    body('moderationNote').optional().trim().isLength({ max: 500 }).withMessage('Moderation note must be less than 500 characters')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const review = await ReviewModel.findByIdAndUpdate(
        req.params.id,
        {
          status: req.body.status,
          moderatedBy: req.user!.userId,
          moderatedAt: new Date(),
          moderationNote: req.body.moderationNote,
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!review) {
        return res.status(404).json({
          success: false,
          error: 'Review not found',
          code: 'REVIEW_NOT_FOUND'
        });
      }

      // Update product review statistics if approved/rejected
      if (req.body.status === 'approved' || req.body.status === 'rejected') {
        const product = await ProductModel.findById(review.product);
        if (product) {
          await product.updateReviewStats();
        }
      }

      logger.info('Review status updated', {
        reviewId: review._id,
        status: req.body.status,
        moderatedBy: req.user!.userId,
        action: 'moderate_review'
      });

      res.json({
        success: true,
        message: 'Review status updated successfully',
        data: { review }
      });

    } catch (error) {
      logger.error('Error updating review status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update review status',
        code: 'UPDATE_STATUS_ERROR'
      });
    }
  }
);

/**
 * @route GET /reviews/product/:productId/summary
 * @desc Get review summary for a product
 * @access Public
 */
router.get('/product/:productId/summary',
  param('productId').isMongoId().withMessage('Product ID must be valid'),
  async (req, res) => {
    try {
      const product = await ProductModel.findById(req.params.productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Product not found',
          code: 'PRODUCT_NOT_FOUND'
        });
      }

      const summary = await ReviewModel.getReviewSummary(req.params.productId);

      res.json({
        success: true,
        data: { summary }
      });

    } catch (error) {
      logger.error('Error fetching review summary:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch review summary',
        code: 'FETCH_SUMMARY_ERROR'
      });
    }
  }
);

export default router;
