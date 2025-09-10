import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import CartService from '../services/CartService';
import { ICartMergeOptions } from '../types/cart.types';
import { logger } from '@apnidukaan/shared';

// Extend Express Request interface to include custom properties
interface CustomRequest extends express.Request {
  userId?: string;
  sessionId?: string;
}

const router = express.Router();
const cartService = new CartService();

// Middleware to get user ID from headers or session
const getUserContext = (req: CustomRequest, res: express.Response, next: express.NextFunction) => {
  // In a real application, this would extract user ID from JWT token
  req.userId = req.headers['x-user-id'] as string || undefined;
  req.sessionId = req.headers['x-session-id'] as string || req.sessionID || uuidv4();
  next();
};

// Validation rules
const addToCartValidation = [
  body('productId')
    .isMongoId()
    .withMessage('Product ID must be a valid MongoDB ObjectId'),
  body('variantId')
    .optional()
    .isMongoId()
    .withMessage('Variant ID must be a valid MongoDB ObjectId'),
  body('quantity')
    .isInt({ min: 1, max: 999 })
    .withMessage('Quantity must be between 1 and 999'),
  body('attributes')
    .optional()
    .isObject()
    .withMessage('Attributes must be an object')
];

const updateCartItemValidation = [
  param('productId')
    .isMongoId()
    .withMessage('Product ID must be a valid MongoDB ObjectId'),
  param('variantId')
    .optional()
    .custom((value) => {
      if (value && value !== 'undefined' && !value.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Variant ID must be a valid MongoDB ObjectId');
      }
      return true;
    }),
  body('quantity')
    .isInt({ min: 0, max: 999 })
    .withMessage('Quantity must be between 0 and 999')
];

const applyDiscountValidation = [
  body('code')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Discount code is required and must be less than 50 characters')
];

const mergeCartsValidation = [
  body('strategy')
    .optional()
    .isIn(['guest_priority', 'user_priority', 'combine_quantities'])
    .withMessage('Invalid merge strategy'),
  body('keepGuestCart')
    .optional()
    .isBoolean()
    .withMessage('keepGuestCart must be a boolean')
];

/**
 * @route GET /cart
 * @desc Get current cart
 * @access Public (uses session) / Private (uses user ID)
 */
router.get('/', getUserContext, async (req: CustomRequest, res: express.Response) => {
  try {
    const cart = await cartService.getCart(req.userId, req.sessionId);

    if (!cart) {
      return res.status(404).json({
        success: false,
        error: 'Cart not found',
        code: 'CART_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: { cart }
    });

  } catch (error: any) {
    logger.error('Error getting cart:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve cart',
      code: 'GET_CART_ERROR'
    });
  }
});

/**
 * @route GET /cart/summary
 * @desc Get cart summary (item count, total, etc.)
 * @access Public (uses session) / Private (uses user ID)
 */
router.get('/summary', getUserContext, async (req: CustomRequest, res: express.Response) => {
  try {
    const summary = await cartService.getCartSummary(req.userId, req.sessionId);

    res.json({
      success: true,
      data: { summary }
    });

  } catch (error: any) {
    logger.error('Error getting cart summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve cart summary',
      code: 'GET_CART_SUMMARY_ERROR'
    });
  }
});

/**
 * @route POST /cart/items
 * @desc Add item to cart
 * @access Public (uses session) / Private (uses user ID)
 */
router.post('/items',
  getUserContext,
  addToCartValidation,
  async (req: CustomRequest, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const result = await cartService.addToCart(req.body, req.userId, req.sessionId);

      res.status(201).json({
        success: true,
        message: result.message,
        data: { cart: result.cart }
      });

    } catch (error: any) {
      logger.error('Error adding to cart:', error);
      
      // Handle specific error cases
      if (error.message.includes('out of stock')) {
        return res.status(409).json({
          success: false,
          error: error.message,
          code: 'PRODUCT_OUT_OF_STOCK'
        });
      }

      if (error.message.includes('not available')) {
        return res.status(404).json({
          success: false,
          error: error.message,
          code: 'PRODUCT_NOT_AVAILABLE'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to add item to cart',
        code: 'ADD_TO_CART_ERROR'
      });
    }
  }
);

/**
 * @route PUT /cart/items/:productId/:variantId?
 * @desc Update cart item quantity
 * @access Public (uses session) / Private (uses user ID)
 */
router.put('/items/:productId/:variantId?',
  getUserContext,
  updateCartItemValidation,
  async (req: CustomRequest, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { productId, variantId } = req.params;
      const { quantity } = req.body;

      const result = await cartService.updateCartItem(
        productId,
        variantId === 'undefined' ? undefined : variantId,
        quantity,
        req.userId,
        req.sessionId
      );

      res.json({
        success: true,
        message: result.message,
        data: { cart: result.cart }
      });

    } catch (error: any) {
      logger.error('Error updating cart item:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: error.message,
          code: 'CART_ITEM_NOT_FOUND'
        });
      }

      if (error.message.includes('out of stock')) {
        return res.status(409).json({
          success: false,
          error: error.message,
          code: 'INSUFFICIENT_STOCK'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to update cart item',
        code: 'UPDATE_CART_ITEM_ERROR'
      });
    }
  }
);

/**
 * @route DELETE /cart/items/:productId/:variantId?
 * @desc Remove item from cart
 * @access Public (uses session) / Private (uses user ID)
 */
router.delete('/items/:productId/:variantId?',
  getUserContext,
  [
    param('productId').isMongoId().withMessage('Product ID must be valid'),
    param('variantId').optional().isMongoId().withMessage('Variant ID must be valid')
  ],
  async (req: CustomRequest, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { productId, variantId } = req.params;

      const result = await cartService.removeFromCart(
        productId,
        variantId === 'undefined' ? undefined : variantId,
        req.userId,
        req.sessionId
      );

      res.json({
        success: true,
        message: result.message,
        data: { cart: result.cart }
      });

    } catch (error: any) {
      logger.error('Error removing from cart:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: error.message,
          code: 'CART_ITEM_NOT_FOUND'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to remove item from cart',
        code: 'REMOVE_FROM_CART_ERROR'
      });
    }
  }
);

/**
 * @route DELETE /cart
 * @desc Clear entire cart
 * @access Public (uses session) / Private (uses user ID)
 */
router.delete('/', getUserContext, async (req: CustomRequest, res: express.Response) => {
  try {
    const result = await cartService.clearCart(req.userId, req.sessionId);

    res.json({
      success: true,
      message: result.message,
      data: { cart: result.cart }
    });

  } catch (error: any) {
    logger.error('Error clearing cart:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear cart',
      code: 'CLEAR_CART_ERROR'
    });
  }
});

/**
 * @route POST /cart/discount
 * @desc Apply discount code to cart
 * @access Public (uses session) / Private (uses user ID)
 */
router.post('/discount',
  getUserContext,
  applyDiscountValidation,
  async (req: CustomRequest, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { code } = req.body;
      const result = await cartService.applyDiscount(code, req.userId, req.sessionId);

      res.json({
        success: true,
        message: result.message,
        data: { cart: result.cart }
      });

    } catch (error: any) {
      logger.error('Error applying discount:', error);
      
      if (error.message.includes('not found') || error.message.includes('invalid')) {
        return res.status(404).json({
          success: false,
          error: 'Invalid discount code',
          code: 'INVALID_DISCOUNT_CODE'
        });
      }

      if (error.message.includes('minimum')) {
        return res.status(400).json({
          success: false,
          error: error.message,
          code: 'MINIMUM_ORDER_NOT_MET'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to apply discount',
        code: 'APPLY_DISCOUNT_ERROR'
      });
    }
  }
);

/**
 * @route DELETE /cart/discount
 * @desc Remove discount from cart
 * @access Public (uses session) / Private (uses user ID)
 */
router.delete('/discount', getUserContext, async (req: CustomRequest, res: express.Response) => {
  try {
    const result = await cartService.removeDiscount(req.userId, req.sessionId);

    res.json({
      success: true,
      message: result.message,
      data: { cart: result.cart }
    });

  } catch (error: any) {
    logger.error('Error removing discount:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove discount',
      code: 'REMOVE_DISCOUNT_ERROR'
    });
  }
});

/**
 * @route POST /cart/validate
 * @desc Validate cart items (check availability, prices)
 * @access Public (uses session) / Private (uses user ID)
 */
router.post('/validate', getUserContext, async (req: CustomRequest, res: express.Response) => {
  try {
    const validation = await cartService.validateCart(req.userId, req.sessionId);

    res.json({
      success: true,
      data: {
        isValid: validation.isValid,
        errors: validation.errors,
        updatedCart: validation.updatedCart
      }
    });

  } catch (error: any) {
    logger.error('Error validating cart:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate cart',
      code: 'VALIDATE_CART_ERROR'
    });
  }
});

/**
 * @route POST /cart/merge
 * @desc Merge guest cart with user cart (authenticated users only)
 * @access Private
 */
router.post('/merge',
  mergeCartsValidation,
  async (req: CustomRequest, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const userId = req.headers['x-user-id'] as string;
      const sessionId = req.headers['x-session-id'] as string;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User authentication required',
          code: 'AUTHENTICATION_REQUIRED'
        });
      }

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: 'Session ID required for cart merge',
          code: 'SESSION_ID_REQUIRED'
        });
      }

      const options: ICartMergeOptions = {
        strategy: req.body.strategy || 'combine_quantities',
        keepGuestCart: req.body.keepGuestCart || false
      };

      const result = await cartService.mergeCarts(userId, sessionId, options);

      res.json({
        success: true,
        message: result.message,
        data: { cart: result.cart }
      });

    } catch (error: any) {
      logger.error('Error merging carts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to merge carts',
        code: 'MERGE_CARTS_ERROR'
      });
    }
  }
);

/**
 * @route GET /cart/abandoned
 * @desc Get abandoned carts (admin only)
 * @access Private (Admin)
 */
router.get('/abandoned',
  [
    query('hours').optional().isInt({ min: 1, max: 168 }).withMessage('Hours must be between 1 and 168')
  ],
  async (req: CustomRequest, res: express.Response) => {
    try {
      // In a real application, this would check for admin role
      const userRole = req.headers['x-user-role'] as string;
      if (userRole !== 'admin' && userRole !== 'moderator') {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          code: 'ACCESS_DENIED'
        });
      }

      const hours = parseInt(req.query.hours as string) || 24;
      const abandonedCarts = await cartService.getAbandonedCarts(hours);

      res.json({
        success: true,
        data: {
          carts: abandonedCarts,
          count: abandonedCarts.length,
          hoursAgo: hours
        }
      });

    } catch (error: any) {
      logger.error('Error getting abandoned carts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve abandoned carts',
        code: 'GET_ABANDONED_CARTS_ERROR'
      });
    }
  }
);

/**
 * @route POST /cart/cleanup
 * @desc Clean up expired carts (admin only)
 * @access Private (Admin)
 */
router.post('/cleanup', async (req: express.Request, res: express.Response) => {
  try {
    // In a real application, this would check for admin role
    const userRole = req.headers['x-user-role'] as string;
    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    const deletedCount = await cartService.cleanupExpiredCarts();

    res.json({
      success: true,
      message: `Cleaned up ${deletedCount} expired carts`,
      data: { deletedCount }
    });

  } catch (error: any) {
    logger.error('Error cleaning up expired carts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup expired carts',
      code: 'CLEANUP_CARTS_ERROR'
    });
  }
});

/**
 * @route PATCH /cart/:cartId/status
 * @desc Update cart status (admin only)
 * @access Private (Admin)
 */
router.patch('/:cartId/status',
  [
    param('cartId').isMongoId().withMessage('Cart ID must be valid'),
    body('status').isIn(['abandoned', 'converted', 'expired']).withMessage('Invalid status')
  ],
  async (req: CustomRequest, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      // In a real application, this would check for admin role
      const userRole = req.headers['x-user-role'] as string;
      if (userRole !== 'admin' && userRole !== 'moderator') {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          code: 'ACCESS_DENIED'
        });
      }

      const { cartId } = req.params;
      const { status } = req.body;

      if (status === 'abandoned') {
        await cartService.markCartAbandoned(cartId);
      } else if (status === 'converted') {
        await cartService.markCartConverted(cartId);
      }

      res.json({
        success: true,
        message: `Cart status updated to ${status}`,
        data: { cartId, status }
      });

    } catch (error: any) {
      logger.error('Error updating cart status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update cart status',
        code: 'UPDATE_CART_STATUS_ERROR'
      });
    }
  }
);

/**
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'cart-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware for this router
router.use((error: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Cart router error:', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    body: req.body
  });

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
});

export default router;
