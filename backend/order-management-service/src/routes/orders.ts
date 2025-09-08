import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import multer from 'multer';
import OrderService from '../services/OrderService';
import PaymentService from '../services/PaymentService';
import ShippingService from '../services/ShippingService';
import InventoryService from '../services/InventoryService';
import {
  ICreateOrderRequest,
  IUpdateOrderRequest,
  IPaymentRequest,
  IRefundRequest,
  IShippingUpdateRequest,
  OrderStatus,
  PaymentMethod,
  ShippingMethod,
  RefundReason,
  IOrderSearchQuery
} from '../types/order.types';
import { logger } from '@shopsphere/shared';

const router = express.Router();

// Initialize services
const orderService = new OrderService();
const paymentService = new PaymentService();
const shippingService = new ShippingService();
const inventoryService = new InventoryService();

// Configure file upload for receipts/documents
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Authentication middleware (mock)
const authenticate = (req: any, res: any, next: any) => {
  const userId = req.headers['x-user-id'] as string;
  const userRole = req.headers['x-user-role'] as string || 'customer';
  
  if (!userId) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      code: 'AUTHENTICATION_REQUIRED'
    });
  }
  
  req.userId = userId;
  req.userRole = userRole;
  next();
};

// Authorization middleware
const authorize = (roles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }
    next();
  };
};

// ==================== ORDER CRUD OPERATIONS ====================

/**
 * @route POST /orders
 * @desc Create a new order
 * @access Private
 */
router.post('/',
  authenticate,
  [
    body('customerEmail').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('items').isArray({ min: 1 }).withMessage('Order must contain at least one item'),
    body('items.*.productId').isMongoId().withMessage('Valid product ID is required'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Valid quantity is required'),
    body('items.*.unitPrice').isFloat({ min: 0 }).withMessage('Valid unit price is required'),
    body('shippingAddress.firstName').trim().isLength({ min: 1 }).withMessage('First name is required'),
    body('shippingAddress.lastName').trim().isLength({ min: 1 }).withMessage('Last name is required'),
    body('shippingAddress.addressLine1').trim().isLength({ min: 1 }).withMessage('Address line 1 is required'),
    body('shippingAddress.city').trim().isLength({ min: 1 }).withMessage('City is required'),
    body('shippingAddress.state').trim().isLength({ min: 1 }).withMessage('State is required'),
    body('shippingAddress.postalCode').trim().isLength({ min: 1 }).withMessage('Postal code is required'),
    body('shippingAddress.country').trim().isLength({ min: 1 }).withMessage('Country is required'),
    body('billingAddress.firstName').trim().isLength({ min: 1 }).withMessage('Billing first name is required'),
    body('shippingMethod').isIn(Object.values(ShippingMethod)).withMessage('Valid shipping method is required'),
    body('paymentMethod').isIn(Object.values(PaymentMethod)).withMessage('Valid payment method is required')
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

      const orderData: ICreateOrderRequest = {
        customerId: req.userId,
        customerEmail: req.body.customerEmail,
        items: req.body.items,
        shippingAddress: req.body.shippingAddress,
        billingAddress: req.body.billingAddress || req.body.shippingAddress,
        shippingMethod: req.body.shippingMethod,
        paymentMethod: req.body.paymentMethod,
        paymentData: req.body.paymentData,
        discountCodes: req.body.discountCodes,
        customerNotes: req.body.customerNotes,
        source: req.body.source || 'api',
        metadata: req.body.metadata
      };

      const result = await orderService.createOrder(orderData);
      
      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(201).json(result);

    } catch (error) {
      logger.error('Error creating order:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * @route GET /orders/:orderId
 * @desc Get order by ID
 * @access Private
 */
router.get('/:orderId',
  authenticate,
  param('orderId').isMongoId().withMessage('Valid order ID is required'),
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

      const result = await orderService.getOrder(req.params.orderId);
      
      if (!result.success) {
        const statusCode = result.code === 'ORDER_NOT_FOUND' ? 404 : 500;
        return res.status(statusCode).json(result);
      }

      // Check if user can access this order
      const order = result.data!.order;
      if (req.userRole !== 'admin' && order.customerId !== req.userId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          code: 'ACCESS_DENIED'
        });
      }

      res.json(result);

    } catch (error) {
      logger.error('Error retrieving order:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * @route GET /orders/number/:orderNumber
 * @desc Get order by order number
 * @access Private
 */
router.get('/number/:orderNumber',
  authenticate,
  param('orderNumber').trim().isLength({ min: 1 }).withMessage('Valid order number is required'),
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

      const result = await orderService.getOrderByNumber(req.params.orderNumber);
      
      if (!result.success) {
        const statusCode = result.code === 'ORDER_NOT_FOUND' ? 404 : 500;
        return res.status(statusCode).json(result);
      }

      // Check if user can access this order
      const order = result.data!.order;
      if (req.userRole !== 'admin' && order.customerId !== req.userId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          code: 'ACCESS_DENIED'
        });
      }

      res.json(result);

    } catch (error) {
      logger.error('Error retrieving order by number:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * @route GET /orders
 * @desc Get orders with filtering and pagination
 * @access Private
 */
router.get('/',
  authenticate,
  [
    query('page').optional().isInt({ min: 1 }).toInt().withMessage('Valid page number is required'),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt().withMessage('Valid limit is required'),
    query('status').optional().isIn(Object.values(OrderStatus)).withMessage('Valid order status is required'),
    query('startDate').optional().isISO8601().toDate().withMessage('Valid start date is required'),
    query('endDate').optional().isISO8601().toDate().withMessage('Valid end date is required')
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

      const query: IOrderSearchQuery = {
        page: req.query.page as number || 1,
        limit: req.query.limit as number || 20,
        sort: {
          field: (req.query.sortBy as string) || 'createdAt',
          direction: (req.query.sortOrder as 'asc' | 'desc') || 'desc'
        },
        filters: {}
      };

      // Apply role-based filtering
      if (req.userRole !== 'admin') {
        query.filters!.customerId = req.userId;
      } else {
        // Admin can filter by customer
        if (req.query.customerId) {
          query.filters!.customerId = req.query.customerId as string;
        }
        if (req.query.customerEmail) {
          query.filters!.customerEmail = req.query.customerEmail as string;
        }
      }

      if (req.query.status) {
        query.filters!.status = req.query.status as OrderStatus;
      }

      if (req.query.startDate && req.query.endDate) {
        query.filters!.dateRange = {
          start: req.query.startDate as Date,
          end: req.query.endDate as Date
        };
      }

      if (req.query.search) {
        query.filters!.search = req.query.search as string;
      }

      const result = await orderService.getOrders(query);
      res.json(result);

    } catch (error) {
      logger.error('Error retrieving orders:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * @route PUT /orders/:orderId
 * @desc Update order
 * @access Private (Admin only for most fields)
 */
router.put('/:orderId',
  authenticate,
  param('orderId').isMongoId().withMessage('Valid order ID is required'),
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

      // Check order ownership
      const orderResult = await orderService.getOrder(req.params.orderId);
      if (!orderResult.success) {
        return res.status(404).json(orderResult);
      }

      const order = orderResult.data!.order;
      if (req.userRole !== 'admin' && order.customerId !== req.userId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          code: 'ACCESS_DENIED'
        });
      }

      // Customers can only update certain fields
      const updateData: IUpdateOrderRequest = {};
      
      if (req.userRole === 'admin') {
        // Admin can update any field
        Object.assign(updateData, req.body);
      } else {
        // Customers can only update notes and some address fields
        if (req.body.customerNotes) {
          updateData.customerNotes = req.body.customerNotes;
        }
        if (req.body.shippingAddress && ['draft', 'pending'].includes(order.status)) {
          updateData.shippingAddress = req.body.shippingAddress;
        }
      }

      const result = await orderService.updateOrder(req.params.orderId, updateData);
      
      if (!result.success) {
        const statusCode = result.code === 'ORDER_NOT_FOUND' ? 404 : 400;
        return res.status(statusCode).json(result);
      }

      res.json(result);

    } catch (error) {
      logger.error('Error updating order:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * @route POST /orders/:orderId/cancel
 * @desc Cancel order
 * @access Private
 */
router.post('/:orderId/cancel',
  authenticate,
  [
    param('orderId').isMongoId().withMessage('Valid order ID is required'),
    body('reason').optional().trim().isLength({ max: 500 }).withMessage('Cancellation reason must be less than 500 characters')
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

      // Check order ownership
      const orderResult = await orderService.getOrder(req.params.orderId);
      if (!orderResult.success) {
        return res.status(404).json(orderResult);
      }

      const order = orderResult.data!.order;
      if (req.userRole !== 'admin' && order.customerId !== req.userId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          code: 'ACCESS_DENIED'
        });
      }

      const result = await orderService.cancelOrder(req.params.orderId, req.body.reason);
      
      if (!result.success) {
        const statusCode = result.code === 'ORDER_NOT_FOUND' ? 404 : 400;
        return res.status(statusCode).json(result);
      }

      res.json(result);

    } catch (error) {
      logger.error('Error cancelling order:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

// ==================== PAYMENT OPERATIONS ====================

/**
 * @route POST /orders/:orderId/payments
 * @desc Process payment for order
 * @access Private
 */
router.post('/:orderId/payments',
  authenticate,
  [
    param('orderId').isMongoId().withMessage('Valid order ID is required'),
    body('method').isIn(Object.values(PaymentMethod)).withMessage('Valid payment method is required'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Valid payment amount is required'),
    body('currency').isLength({ min: 3, max: 3 }).withMessage('Valid currency code is required')
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

      // Check order ownership
      const orderResult = await orderService.getOrder(req.params.orderId);
      if (!orderResult.success) {
        return res.status(404).json(orderResult);
      }

      const order = orderResult.data!.order;
      if (order.customerId !== req.userId && req.userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          code: 'ACCESS_DENIED'
        });
      }

      const paymentData = {
        orderId: req.params.orderId,
        method: req.body.method,
        amount: req.body.amount,
        currency: req.body.currency,
        paymentData: req.body.paymentData,
        savePaymentMethod: req.body.savePaymentMethod,
        metadata: req.body.metadata
      };

      const result = await orderService.processPayment(req.params.orderId, paymentData);
      
      if (!result.success) {
        const statusCode = result.code === 'ORDER_NOT_FOUND' ? 404 : 400;
        return res.status(statusCode).json(result);
      }

      res.json(result);

    } catch (error) {
      logger.error('Error processing payment:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * @route POST /orders/:orderId/refunds
 * @desc Process refund for order
 * @access Private (Admin only)
 */
router.post('/:orderId/refunds',
  authenticate,
  authorize(['admin']),
  [
    param('orderId').isMongoId().withMessage('Valid order ID is required'),
    body('paymentId').isMongoId().withMessage('Valid payment ID is required'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Valid refund amount is required'),
    body('reason').isIn(Object.values(RefundReason)).withMessage('Valid refund reason is required'),
    body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must be less than 500 characters')
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

      const refundRequest: IRefundRequest = {
        orderId: req.params.orderId,
        paymentId: req.body.paymentId,
        amount: req.body.amount,
        reason: req.body.reason,
        description: req.body.description,
        metadata: req.body.metadata
      };

      const result = await paymentService.processRefund(refundRequest);
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
          code: 'REFUND_FAILED'
        });
      }

      res.json({
        success: true,
        message: 'Refund processed successfully',
        data: { refund: result.refund }
      });

    } catch (error) {
      logger.error('Error processing refund:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

// ==================== SHIPPING OPERATIONS ====================

/**
 * @route GET /orders/:orderId/shipping/rates
 * @desc Get shipping rates for order
 * @access Private
 */
router.get('/:orderId/shipping/rates',
  authenticate,
  param('orderId').isMongoId().withMessage('Valid order ID is required'),
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

      // Check order ownership
      const orderResult = await orderService.getOrder(req.params.orderId);
      if (!orderResult.success) {
        return res.status(404).json(orderResult);
      }

      const order = orderResult.data!.order;
      if (order.customerId !== req.userId && req.userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          code: 'ACCESS_DENIED'
        });
      }

      // Mock warehouse address
      const fromAddress = {
        firstName: 'ShopSphere',
        lastName: 'Warehouse',
        company: 'ShopSphere Inc',
        addressLine1: '123 Warehouse Blvd',
        city: 'Commerce',
        state: 'CA',
        postalCode: '90040',
        country: 'US'
      };

      const rates = await shippingService.calculateShippingRates(
        order.items,
        fromAddress,
        order.shippingAddress,
        {
          includeFree: true,
          includeInsurance: order.totals.total > 100,
          includeSignature: order.totals.total > 500
        }
      );

      res.json({
        success: true,
        data: { rates }
      });

    } catch (error) {
      logger.error('Error getting shipping rates:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * @route POST /orders/:orderId/shipping/label
 * @desc Generate shipping label for order
 * @access Private (Admin only)
 */
router.post('/:orderId/shipping/label',
  authenticate,
  authorize(['admin']),
  param('orderId').isMongoId().withMessage('Valid order ID is required'),
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

      const orderResult = await orderService.getOrder(req.params.orderId);
      if (!orderResult.success) {
        return res.status(404).json(orderResult);
      }

      const order = orderResult.data!.order;
      const label = await shippingService.createShipment(order);

      res.json({
        success: true,
        message: 'Shipping label generated successfully',
        data: { label }
      });

    } catch (error) {
      logger.error('Error generating shipping label:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * @route GET /orders/:orderId/tracking
 * @desc Get order tracking information
 * @access Private
 */
router.get('/:orderId/tracking',
  authenticate,
  param('orderId').isMongoId().withMessage('Valid order ID is required'),
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

      // Check order ownership
      const orderResult = await orderService.getOrder(req.params.orderId);
      if (!orderResult.success) {
        return res.status(404).json(orderResult);
      }

      const order = orderResult.data!.order;
      if (order.customerId !== req.userId && req.userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          code: 'ACCESS_DENIED'
        });
      }

      if (!order.shipping.trackingNumber) {
        return res.status(404).json({
          success: false,
          error: 'Tracking information not available',
          code: 'TRACKING_NOT_AVAILABLE'
        });
      }

      const tracking = await shippingService.trackShipment(
        order.shipping.trackingNumber,
        order.shipping.carrier
      );

      res.json({
        success: true,
        data: { tracking }
      });

    } catch (error) {
      logger.error('Error getting tracking information:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * @route PUT /orders/:orderId/shipping/status
 * @desc Update shipping status
 * @access Private (Admin only)
 */
router.put('/:orderId/shipping/status',
  authenticate,
  authorize(['admin']),
  [
    param('orderId').isMongoId().withMessage('Valid order ID is required'),
    body('status').isIn(['pending', 'processing', 'shipped', 'in_transit', 'out_for_delivery', 'delivered', 'failed_delivery', 'returned']).withMessage('Valid shipping status is required'),
    body('message').optional().trim().isLength({ max: 200 }).withMessage('Message must be less than 200 characters')
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

      const updateRequest: IShippingUpdateRequest = {
        orderId: req.params.orderId,
        status: req.body.status,
        trackingNumber: req.body.trackingNumber,
        carrier: req.body.carrier,
        message: req.body.message || `Status updated to ${req.body.status}`,
        location: req.body.location,
        estimatedDelivery: req.body.estimatedDelivery
      };

      const result = await shippingService.updateShippingStatus(updateRequest);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
          code: 'SHIPPING_UPDATE_FAILED'
        });
      }

      res.json({
        success: true,
        message: 'Shipping status updated successfully'
      });

    } catch (error) {
      logger.error('Error updating shipping status:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

// ==================== INVENTORY OPERATIONS ====================

/**
 * @route POST /orders/:orderId/inventory/reserve
 * @desc Reserve inventory for order
 * @access Private (Admin only)
 */
router.post('/:orderId/inventory/reserve',
  authenticate,
  authorize(['admin']),
  param('orderId').isMongoId().withMessage('Valid order ID is required'),
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

      const orderResult = await orderService.getOrder(req.params.orderId);
      if (!orderResult.success) {
        return res.status(404).json(orderResult);
      }

      const order = orderResult.data!.order;
      const reservation = await inventoryService.reserveInventory({
        orderId: req.params.orderId,
        customerId: order.customerId,
        items: order.items.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity
        })),
        expiresIn: req.body.expiresIn
      });

      if (!reservation.success) {
        return res.status(400).json({
          success: false,
          error: reservation.error,
          unavailableItems: reservation.unavailableItems
        });
      }

      res.json({
        success: true,
        message: 'Inventory reserved successfully',
        data: {
          reservationId: reservation.reservationId,
          expiresAt: reservation.expiresAt
        }
      });

    } catch (error) {
      logger.error('Error reserving inventory:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * @route POST /orders/:orderId/inventory/confirm
 * @desc Confirm inventory reservation
 * @access Private (Admin only)
 */
router.post('/:orderId/inventory/confirm',
  authenticate,
  authorize(['admin']),
  param('orderId').isMongoId().withMessage('Valid order ID is required'),
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

      const confirmed = await inventoryService.confirmReservation(req.params.orderId);

      if (!confirmed) {
        return res.status(400).json({
          success: false,
          error: 'Failed to confirm inventory reservation',
          code: 'INVENTORY_CONFIRMATION_FAILED'
        });
      }

      res.json({
        success: true,
        message: 'Inventory reservation confirmed successfully'
      });

    } catch (error) {
      logger.error('Error confirming inventory reservation:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

// ==================== WEBHOOK ENDPOINTS ====================

/**
 * @route POST /webhooks/stripe
 * @desc Handle Stripe webhooks
 * @access Public (webhook signature verification)
 */
router.post('/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    try {
      const signature = req.headers['stripe-signature'] as string;
      const payload = req.body;

      const result = await paymentService.handleStripeWebhook(payload, signature);

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.json({ received: true });

    } catch (error) {
      logger.error('Error handling Stripe webhook:', error);
      res.status(400).json({ error: 'Webhook handling failed' });
    }
  }
);

/**
 * @route POST /webhooks/paypal
 * @desc Handle PayPal webhooks
 * @access Public (webhook signature verification)
 */
router.post('/webhooks/paypal',
  async (req, res) => {
    try {
      const result = await paymentService.handlePayPalWebhook(req.body);

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.json({ received: true });

    } catch (error) {
      logger.error('Error handling PayPal webhook:', error);
      res.status(400).json({ error: 'Webhook handling failed' });
    }
  }
);

// ==================== ADMIN ROUTES ====================

/**
 * @route GET /admin/orders/analytics
 * @desc Get order analytics
 * @access Private (Admin only)
 */
router.get('/admin/orders/analytics',
  authenticate,
  authorize(['admin']),
  [
    query('startDate').optional().isISO8601().toDate().withMessage('Valid start date is required'),
    query('endDate').optional().isISO8601().toDate().withMessage('Valid end date is required')
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

      // Mock analytics data (in production, this would query the database)
      const analytics = {
        totalOrders: 1250,
        totalRevenue: 125000.50,
        averageOrderValue: 100.00,
        ordersByStatus: {
          pending: 45,
          confirmed: 120,
          processing: 85,
          shipped: 150,
          delivered: 820,
          cancelled: 30
        },
        ordersByPaymentMethod: {
          credit_card: 850,
          debit_card: 200,
          paypal: 150,
          cash_on_delivery: 50
        },
        topProducts: [
          { productId: 'prod1', name: 'Product 1', quantity: 500, revenue: 25000 },
          { productId: 'prod2', name: 'Product 2', quantity: 350, revenue: 17500 }
        ],
        customerMetrics: {
          newCustomers: 200,
          returningCustomers: 400,
          guestOrders: 150
        }
      };

      res.json({
        success: true,
        data: { analytics }
      });

    } catch (error) {
      logger.error('Error getting order analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

// ==================== UTILITY ROUTES ====================

/**
 * @route GET /health
 * @desc Health check endpoint
 * @access Public
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'order-management-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
      total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100
    }
  });
});

// Error handling middleware
router.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Order router error:', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    body: req.body
  });

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large',
        code: 'FILE_TOO_LARGE'
      });
    }
  }

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
});

export default router;
