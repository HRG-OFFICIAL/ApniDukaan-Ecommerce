import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { orderService } from '../services/orderService';
import { orderStatusService } from '../services/orderStatusService';
import { authenticate, authorize, requireOwnership } from '@shopsphere/shared';
import { OrderStatus, PaymentStatus, logger } from '@shopsphere/shared';

const router = express.Router();

// Validation rules
const createOrderValidation = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Order must contain at least one item'),
  body('items.*.product')
    .isMongoId()
    .withMessage('Product ID must be valid'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  body('items.*.price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('shippingAddress.firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and must be less than 50 characters'),
  body('shippingAddress.lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and must be less than 50 characters'),
  body('shippingAddress.address1')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Address is required and must be less than 100 characters'),
  body('shippingAddress.city')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('City is required and must be less than 50 characters'),
  body('shippingAddress.state')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('State is required and must be less than 50 characters'),
  body('shippingAddress.postalCode')
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('Postal code is required and must be less than 20 characters'),
  body('shippingAddress.country')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Country is required and must be less than 50 characters'),
  body('billingAddress')
    .optional()
    .custom((value, { req }) => {
      if (!value) return true; // Optional field
      // Same validation as shipping address
      return true;
    }),
  body('paymentMethod')
    .isIn(['stripe', 'paypal', 'cash_on_delivery'])
    .withMessage('Invalid payment method'),
  body('shippingMethod.name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Shipping method name is required'),
  body('shippingMethod.cost')
    .isFloat({ min: 0 })
    .withMessage('Shipping cost must be a positive number'),
  body('couponCode')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Coupon code must be less than 20 characters')
];

const updateStatusValidation = [
  param('id')
    .isMongoId()
    .withMessage('Order ID must be valid'),
  body('status')
    .isIn(Object.values(OrderStatus))
    .withMessage('Invalid order status'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason must be less than 500 characters')
];

const trackingValidation = [
  param('id')
    .isMongoId()
    .withMessage('Order ID must be valid'),
  body('trackingNumber')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Tracking number is required and must be less than 100 characters'),
  body('carrier')
    .trim()
    .isIn(['ups', 'fedex', 'usps', 'dhl'])
    .withMessage('Invalid carrier')
];

const cancelOrderValidation = [
  param('id')
    .isMongoId()
    .withMessage('Order ID must be valid'),
  body('reason')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Cancellation reason is required and must be less than 500 characters')
];

const paginationValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('skip')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Skip must be a non-negative integer')
];

/**
 * @route POST /orders
 * @desc Create a new order
 * @access Private (User)
 */
router.post('/', 
  authenticate,
  authorize({ roles: ['user', 'admin'] }),
  createOrderValidation,
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { items, shippingAddress, billingAddress, paymentMethod, shippingMethod, couponCode } = req.body;

      // Use billing address as shipping address if not provided
      const finalBillingAddress = billingAddress || shippingAddress;

      const orderData = {
        items,
        shippingAddress,
        billingAddress: finalBillingAddress,
        paymentMethod,
        shippingMethod,
        couponCode
      };

      const order = await orderService.createOrder(orderData, req.user!.userId, req.user!.email);

      logger.info('Order created via API', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        userId: req.user!.userId,
        total: order.total,
        action: 'create_order_api'
      });

      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: { order }
      });

    } catch (error) {
      logger.error('Failed to create order via API', {
        userId: req.user?.userId,
        error: error.message,
        action: 'create_order_api'
      });

      res.status(500).json({
        success: false,
        error: 'Failed to create order',
        code: 'ORDER_CREATION_FAILED'
      });
    }
  }
);

/**
 * @route GET /orders
 * @desc Get user's orders (paginated)
 * @access Private (User)
 */
router.get('/',
  authenticate,
  authorize({ roles: ['user', 'admin', 'moderator'] }),
  paginationValidation,
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const limit = parseInt(req.query.limit as string) || 20;
      const skip = parseInt(req.query.skip as string) || 0;

      let orders;
      if (req.user!.role === 'user') {
        orders = await orderService.getUserOrders(req.user!.userId, limit, skip);
      } else {
        // Admin/moderator can see all orders
        orders = await orderService.getAllOrders(limit, skip);
      }

      res.json({
        success: true,
        data: {
          orders,
          pagination: {
            limit,
            skip,
            total: orders.length
          }
        }
      });

    } catch (error) {
      logger.error('Failed to get orders via API', {
        userId: req.user?.userId,
        error: error.message,
        action: 'get_orders_api'
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get orders',
        code: 'GET_ORDERS_FAILED'
      });
    }
  }
);

/**
 * @route GET /orders/:id
 * @desc Get order by ID
 * @access Private (Owner/Admin/Moderator)
 */
router.get('/:id',
  authenticate,
  authorize({ roles: ['user', 'admin', 'moderator'] }),
  param('id').isMongoId().withMessage('Order ID must be valid'),
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const orderId = req.params.id;
      const userId = req.user!.role === 'user' ? req.user!.userId : undefined;

      const order = await orderService.getOrderById(orderId, userId);
      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Order not found',
          code: 'ORDER_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        data: { order }
      });

    } catch (error) {
      logger.error('Failed to get order by ID via API', {
        orderId: req.params.id,
        userId: req.user?.userId,
        error: error.message,
        action: 'get_order_by_id_api'
      });

      if (error.message.includes('Access denied')) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          code: 'ACCESS_DENIED'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to get order',
        code: 'GET_ORDER_FAILED'
      });
    }
  }
);

/**
 * @route GET /orders/number/:orderNumber
 * @desc Get order by order number
 * @access Private (Owner/Admin/Moderator)
 */
router.get('/number/:orderNumber',
  authenticate,
  authorize({ roles: ['user', 'admin', 'moderator'] }),
  param('orderNumber').notEmpty().withMessage('Order number is required'),
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const orderNumber = req.params.orderNumber;
      const userId = req.user!.role === 'user' ? req.user!.userId : undefined;

      const order = await orderService.getOrderByNumber(orderNumber, userId);
      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Order not found',
          code: 'ORDER_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        data: { order }
      });

    } catch (error) {
      logger.error('Failed to get order by number via API', {
        orderNumber: req.params.orderNumber,
        userId: req.user?.userId,
        error: error.message,
        action: 'get_order_by_number_api'
      });

      if (error.message.includes('Access denied')) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          code: 'ACCESS_DENIED'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to get order',
        code: 'GET_ORDER_FAILED'
      });
    }
  }
);

/**
 * @route PATCH /orders/:id/status
 * @desc Update order status
 * @access Private (Admin/Moderator)
 */
router.patch('/:id/status',
  authenticate,
  authorize({ roles: ['admin', 'moderator'] }),
  updateStatusValidation,
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const orderId = req.params.id;
      const { status, reason } = req.body;

      const order = await orderStatusService.transitionOrderStatus(
        orderId,
        status,
        req.user!.userId,
        req.user!.role,
        reason,
        undefined,
        req.ip,
        req.get('User-Agent')
      );

      res.json({
        success: true,
        message: 'Order status updated successfully',
        data: { order }
      });

    } catch (error) {
      logger.error('Failed to update order status via API', {
        orderId: req.params.id,
        status: req.body.status,
        userId: req.user?.userId,
        error: error.message,
        action: 'update_order_status_api'
      });

      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'Order not found',
          code: 'ORDER_NOT_FOUND'
        });
      }

      if (error.message.includes('Invalid status transition')) {
        return res.status(400).json({
          success: false,
          error: error.message,
          code: 'INVALID_STATUS_TRANSITION'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to update order status',
        code: 'UPDATE_STATUS_FAILED'
      });
    }
  }
);

/**
 * @route GET /orders/:id/transitions
 * @desc Get valid status transitions for an order
 * @access Private (Admin/Moderator)
 */
router.get('/:id/transitions',
  authenticate,
  authorize({ roles: ['admin', 'moderator'] }),
  param('id').isMongoId().withMessage('Order ID must be valid'),
  async (req, res) => {
    try {
      const orderId = req.params.id;
      const transitions = await orderStatusService.getValidTransitions(orderId, req.user!.role);

      res.json({
        success: true,
        data: { transitions }
      });

    } catch (error) {
      logger.error('Failed to get order transitions via API', {
        orderId: req.params.id,
        userId: req.user?.userId,
        error: error.message,
        action: 'get_order_transitions_api'
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get order transitions',
        code: 'GET_TRANSITIONS_FAILED'
      });
    }
  }
);

/**
 * @route POST /orders/:id/cancel
 * @desc Cancel an order
 * @access Private (Owner/Admin/Moderator)
 */
router.post('/:id/cancel',
  authenticate,
  authorize({ roles: ['user', 'admin', 'moderator'] }),
  cancelOrderValidation,
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const orderId = req.params.id;
      const { reason } = req.body;
      const isAdmin = ['admin', 'moderator'].includes(req.user!.role);

      const order = await orderService.cancelOrder(orderId, reason, req.user!.userId, isAdmin);

      res.json({
        success: true,
        message: 'Order cancelled successfully',
        data: { order }
      });

    } catch (error) {
      logger.error('Failed to cancel order via API', {
        orderId: req.params.id,
        userId: req.user?.userId,
        error: error.message,
        action: 'cancel_order_api'
      });

      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'Order not found',
          code: 'ORDER_NOT_FOUND'
        });
      }

      if (error.message.includes('Access denied')) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          code: 'ACCESS_DENIED'
        });
      }

      if (error.message.includes('cannot be cancelled')) {
        return res.status(400).json({
          success: false,
          error: error.message,
          code: 'CANNOT_CANCEL_ORDER'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to cancel order',
        code: 'CANCEL_ORDER_FAILED'
      });
    }
  }
);

/**
 * @route POST /orders/:id/tracking
 * @desc Add tracking information to an order
 * @access Private (Admin/Moderator)
 */
router.post('/:id/tracking',
  authenticate,
  authorize({ roles: ['admin', 'moderator'] }),
  trackingValidation,
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const orderId = req.params.id;
      const { trackingNumber, carrier } = req.body;

      const order = await orderService.addTrackingInfo(orderId, trackingNumber, carrier, req.user!.userId);

      res.json({
        success: true,
        message: 'Tracking information added successfully',
        data: { order }
      });

    } catch (error) {
      logger.error('Failed to add tracking info via API', {
        orderId: req.params.id,
        userId: req.user?.userId,
        error: error.message,
        action: 'add_tracking_info_api'
      });

      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'Order not found',
          code: 'ORDER_NOT_FOUND'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to add tracking information',
        code: 'ADD_TRACKING_FAILED'
      });
    }
  }
);

/**
 * @route GET /orders/:id/history
 * @desc Get order status history
 * @access Private (Owner/Admin/Moderator)
 */
router.get('/:id/history',
  authenticate,
  authorize({ roles: ['user', 'admin', 'moderator'] }),
  param('id').isMongoId().withMessage('Order ID must be valid'),
  async (req, res) => {
    try {
      const orderId = req.params.id;
      
      // Verify user can access this order
      const userId = req.user!.role === 'user' ? req.user!.userId : undefined;
      const order = await orderService.getOrderById(orderId, userId);
      
      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Order not found',
          code: 'ORDER_NOT_FOUND'
        });
      }

      const history = await orderStatusService.getOrderStatusHistory(orderId);

      res.json({
        success: true,
        data: { history }
      });

    } catch (error) {
      logger.error('Failed to get order history via API', {
        orderId: req.params.id,
        userId: req.user?.userId,
        error: error.message,
        action: 'get_order_history_api'
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get order history',
        code: 'GET_HISTORY_FAILED'
      });
    }
  }
);

/**
 * @route GET /orders/:id/audit
 * @desc Get order audit trail
 * @access Private (Admin/Moderator)
 */
router.get('/:id/audit',
  authenticate,
  authorize({ roles: ['admin', 'moderator'] }),
  param('id').isMongoId().withMessage('Order ID must be valid'),
  async (req, res) => {
    try {
      const orderId = req.params.id;
      const auditTrail = await orderStatusService.getOrderAuditTrail(orderId);

      res.json({
        success: true,
        data: { auditTrail }
      });

    } catch (error) {
      logger.error('Failed to get order audit trail via API', {
        orderId: req.params.id,
        userId: req.user?.userId,
        error: error.message,
        action: 'get_order_audit_api'
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get order audit trail',
        code: 'GET_AUDIT_FAILED'
      });
    }
  }
);

/**
 * @route GET /orders/stats/status
 * @desc Get order status statistics
 * @access Private (Admin/Moderator)
 */
router.get('/stats/status',
  authenticate,
  authorize({ roles: ['admin', 'moderator'] }),
  [
    query('startDate').optional().isISO8601().withMessage('Start date must be valid ISO8601 format'),
    query('endDate').optional().isISO8601().withMessage('End date must be valid ISO8601 format')
  ],
  async (req, res) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const stats = await orderStatusService.getOrderStatusStats(startDate, endDate);

      res.json({
        success: true,
        data: { stats }
      });

    } catch (error) {
      logger.error('Failed to get order status stats via API', {
        userId: req.user?.userId,
        error: error.message,
        action: 'get_order_stats_api'
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get order statistics',
        code: 'GET_STATS_FAILED'
      });
    }
  }
);

export default router;
