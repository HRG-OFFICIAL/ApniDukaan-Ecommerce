import { startSession, ClientSession } from 'mongoose';
import Decimal from 'decimal.js';
import { createClient, RedisClientType } from 'redis';
import { Order, IOrderDocument } from '../models/Order';
import {
  IOrder,
  ICreateOrderRequest,
  IUpdateOrderRequest,
  IOrderResponse,
  IOrderListResponse,
  IOrderFilters,
  IOrderSearchQuery,
  IOrderItem,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  ShippingStatus,
  RefundReason,
  IOrderEvent,
  IShippingCalculation,
  IOrderValidation,
  IRefund
} from '../types/order.types';
import { orderConfig } from '../config/order.config';
import { 
  OrderError, 
  // OrderNotFoundError, // Not used currently
  OrderValidationError, 
  InventoryInsufficientError, 
  // PaymentProcessingError, // Not used currently
  // OrderStateError // Not used currently 
} from '../errors/OrderErrors';
import { IdempotencyService } from './IdempotencyService';

// Mock external service interfaces
interface ICatalogService {
  getProduct(productId: string): Promise<any>;
  validateProduct(productId: string, variantId?: string): Promise<boolean>;
  updateInventory(productId: string, quantity: number, operation: 'reserve' | 'release' | 'reduce'): Promise<boolean>;
  checkStock(productId: string, variantId?: string): Promise<{ available: number; reserved: number }>;
}

interface IPaymentService {
  processPayment(paymentData: any): Promise<{ success: boolean; transactionId?: string; error?: string }>;
  refundPayment(transactionId: string, amount: number): Promise<{ success: boolean; refundId?: string; error?: string }>;
  validatePaymentMethod(method: PaymentMethod, data: any): Promise<boolean>;
}

interface IShippingService {
  calculateShipping(items: IOrderItem[], address: any, method: string): Promise<IShippingCalculation>;
  createShipment(order: IOrder): Promise<{ trackingNumber: string; labelUrl: string }>;
  trackShipment(trackingNumber: string): Promise<any>;
}

interface INotificationService {
  sendOrderConfirmation(order: IOrder): Promise<void>;
  sendOrderUpdate(order: IOrder, status: OrderStatus): Promise<void>;
  sendShippingUpdate(order: IOrder, trackingInfo: any): Promise<void>;
}

interface ITaxService {
  calculateTax(items: IOrderItem[], shippingAddress: any): Promise<{ taxAmount: number; taxes: any[] }>;
}

interface IEventBus {
  emit(eventType: string, data: any): Promise<void>;
  on(eventType: string, handler: (data: any) => void): void;
}

export class OrderService {
  private redisClient: RedisClientType<any, any>;
  private idempotencyService: IdempotencyService;
  
  // External services injected via constructor
  private catalogService: ICatalogService;
  private paymentService: IPaymentService;
  private shippingService: IShippingService;
  private notificationService: INotificationService;
  private taxService: ITaxService;
  private eventBus: IEventBus;

  constructor(
    catalogService: ICatalogService,
    paymentService: IPaymentService,
    shippingService: IShippingService,
    notificationService: INotificationService,
    taxService: ITaxService,
    eventBus: IEventBus,
    redisClient?: RedisClientType
  ) {
    // Initialize Redis client
    this.redisClient = redisClient || createClient({
      url: orderConfig.redis.uri
    });
    
    this.redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    // Initialize idempotency service
    this.idempotencyService = new IdempotencyService(this.redisClient as RedisClientType);

    // Set injected services
    this.catalogService = catalogService;
    this.paymentService = paymentService;
    this.shippingService = shippingService;
    this.notificationService = notificationService;
    this.taxService = taxService;
    this.eventBus = eventBus;
  }

  // Static factory method for creating OrderService with mock services (for testing/development)
  static createWithMockServices(redisClient?: RedisClientType): OrderService {
    const mockCatalogService: ICatalogService = {
      getProduct: async (productId: string) => ({
        id: productId,
        name: 'Sample Product',
        price: 29.99,
        sku: 'SAMPLE-001',
        weight: 1.5,
        inStock: true,
        stockLevel: 100
      }),
      
      validateProduct: async (_productId: string, _variantId?: string) => true,
      
      updateInventory: async (_productId: string, _quantity: number, _operation: 'reserve' | 'release' | 'reduce') => true,
      
      checkStock: async (_productId: string, _variantId?: string) => ({
        available: 100,
        reserved: 5
      })
    };

    const mockPaymentService: IPaymentService = {
      processPayment: async (_paymentData: any) => ({
        success: true,
        transactionId: `txn_${Date.now()}`
      }),
      
      refundPayment: async (_transactionId: string, _amount: number) => ({
        success: true,
        refundId: `ref_${Date.now()}`
      }),
      
      validatePaymentMethod: async (_method: PaymentMethod, _data: any) => true
    };

    const mockShippingService: IShippingService = {
      calculateShipping: async (_items: IOrderItem[], _address: any, method: string) => ({
        method: method as any,
        carrier: 'UPS',
        service: 'Ground',
        cost: 9.99,
        estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        transitTime: '7-10 business days'
      }),
      
      createShipment: async (_order: IOrder) => ({
        trackingNumber: `1Z${Date.now()}`,
        labelUrl: 'https://example.com/shipping-label.pdf'
      }),
      
      trackShipment: async (_trackingNumber: string) => ({
        status: 'in_transit',
        location: 'New York, NY',
        estimatedDelivery: new Date()
      })
    };

    const mockNotificationService: INotificationService = {
      sendOrderConfirmation: async (order: IOrder) => {
        console.log(`Order confirmation sent for ${order.orderNumber}`);
      },
      
      sendOrderUpdate: async (order: IOrder, status: OrderStatus) => {
        console.log(`Order ${order.orderNumber} status updated to ${status}`);
      },
      
      sendShippingUpdate: async (order: IOrder, _trackingInfo: any) => {
        console.log(`Shipping update sent for ${order.orderNumber}`);
      }
    };

    const mockTaxService: ITaxService = {
      calculateTax: async (items: IOrderItem[], shippingAddress: any) => {
        const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
        const taxRate = 0.08; // 8% tax rate
        const taxAmount = new Decimal(subtotal).mul(taxRate).toNumber();
        
        return {
          taxAmount,
          taxes: [{
            type: 'sales',
            name: 'Sales Tax',
            rate: taxRate,
            amount: taxAmount,
            jurisdiction: shippingAddress.state
          }]
        };
      }
    };

    const mockEventBus: IEventBus = {
      emit: async (eventType: string, data: any) => {
        console.log(`Event emitted: ${eventType}`, data);
      },
      
      on: (_eventType: string, _handler: (data: any) => void) => {
        // Mock event listener registration
      }
    };

    return new OrderService(
      mockCatalogService,
      mockPaymentService,
      mockShippingService,
      mockNotificationService,
      mockTaxService,
      mockEventBus,
      redisClient
    );
  }

  async connect(): Promise<void> {
    if (!this.redisClient.isReady) {
      await this.redisClient.connect();
    }
  }

  // ==================== CORE ORDER OPERATIONS ====================

  /**
   * Create a new order with transaction support
   */
  async createOrder(orderData: ICreateOrderRequest, idempotencyKey?: string): Promise<IOrderResponse> {
    const session = await startSession();
    
    try {
      // Check idempotency if key provided
      if (idempotencyKey) {
        const existingResult = await this.idempotencyService.getProcessedResult(idempotencyKey);
        if (existingResult) {
          return existingResult;
        }
      }

      session.startTransaction();

      // Validate order data
      const validation = await this.validateOrderData(orderData);
      if (!validation.isValid) {
        throw new OrderValidationError('Order validation failed', { errors: validation.errors });
      }

      // Check inventory availability
      const inventoryCheck = await this.checkInventoryAvailability(orderData.items);
      if (!inventoryCheck.available) {
        throw new InventoryInsufficientError(
          'unknown',
          0,
          0
        );
      }

      // Process items first to ensure they have totalPrice
      const processedItems = await this.processOrderItems(orderData.items);

      // Calculate shipping
      const shippingCalculation = await this.shippingService.calculateShipping(
        processedItems,
        orderData.shippingAddress,
        orderData.shippingMethod
      );

      // Calculate taxes
      const taxCalculation = await this.taxService.calculateTax(
        processedItems,
        orderData.shippingAddress
      );

      // Create order instance
      const order = new Order({
        customerId: orderData.customerId || 'guest',
        customerEmail: orderData.customerEmail,
        status: OrderStatus.DRAFT,
        items: processedItems,
        currency: orderConfig.currency,
        customer: {
          id: orderData.customerId || 'guest',
          email: orderData.customerEmail,
          firstName: orderData.shippingAddress.firstName,
          lastName: orderData.shippingAddress.lastName,
          phone: orderData.shippingAddress.phone,
          isGuest: !orderData.customerId
        },
        shippingAddress: orderData.shippingAddress,
        billingAddress: orderData.billingAddress,
        shipping: {
          method: shippingCalculation.method,
          carrier: shippingCalculation.carrier,
          service: shippingCalculation.service,
          cost: shippingCalculation.cost,
          estimatedDeliveryDate: shippingCalculation.estimatedDelivery,
          status: ShippingStatus.PENDING,
          address: orderData.shippingAddress,
          updates: []
        },
        payments: [],
        discounts: [],
        notes: [],
        customerNotes: orderData.customerNotes,
        source: orderData.source || 'web',
        fulfillmentStatus: 'pending',
        inventoryReserved: false,
        placedAt: new Date(),
        childOrderIds: [],
        relatedOrderIds: [],
        tags: [],
        metadata: orderData.metadata || {},
        totals: {
          subtotal: 0,
          discountAmount: 0,
          taxAmount: taxCalculation.taxAmount,
          shippingAmount: shippingCalculation.cost,
          total: 0,
          currency: orderConfig.currency
        }
      });

      // Calculate totals
      order.totals = await order.calculateTotals();

      // Save order within transaction
      const savedOrder = await order.save({ session });

      // Reserve inventory within transaction
      await this.reserveInventory(savedOrder, session);

      // Commit transaction
      await session.commitTransaction();

      // Cache order (non-transactional)
      await this.cacheOrder(savedOrder);

      // Emit order created event (non-transactional)
      await this.emitOrderEvent('order.created', savedOrder);

      const result = {
        success: true,
        message: 'Order created successfully',
        data: { order: savedOrder }
      };

      // Store result for idempotency if key provided
      if (idempotencyKey) {
        await this.idempotencyService.markAsProcessed(idempotencyKey, result);
      }

      return result;

    } catch (error) {
      await session.abortTransaction();
      
      if (error instanceof OrderError) {
        return {
          success: false,
          error: error.message,
          code: error.code,
          message: error.message
        };
      }

      console.error('Error creating order:', error);
      return {
        success: false,
        error: 'Failed to create order',
        code: 'ORDER_CREATION_FAILED',
        message: 'Failed to create order'
      };
    } finally {
      session.endSession();
    }
  }

  /**
   * Get order by ID
   */
  async getOrder(orderId: string): Promise<IOrderResponse> {
    try {
      // Check cache first
      const cachedOrder = await this.getCachedOrder(orderId);
      if (cachedOrder) {
        return {
          success: true,
          message: 'Order retrieved successfully',
          data: { order: cachedOrder }
        };
      }

      // Get from database
      const order = await Order.findById(orderId);
      if (!order) {
        return {
          success: false,
          error: 'Order not found',
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found'
        };
      }

      // Cache for future requests
      await this.cacheOrder(order);

      return {
        success: true,
        message: 'Order retrieved successfully',
        data: { order }
      };

    } catch (error) {
      console.error('Error retrieving order:', error);
      return {
        success: false,
        error: 'Failed to retrieve order',
        code: 'ORDER_RETRIEVAL_FAILED',
        message: 'Failed to retrieve order'
      };
    }
  }

  /**
   * Get order by order number
   */
  async getOrderByNumber(orderNumber: string): Promise<IOrderResponse> {
    try {
      const order = await Order.findOne({ orderNumber });
      if (!order) {
        return {
          success: false,
          error: 'Order not found',
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found'
        };
      }

      return {
        success: true,
        message: 'Order retrieved successfully',
        data: { order }
      };

    } catch (error) {
      console.error('Error retrieving order by number:', error);
      return {
        success: false,
        error: 'Failed to retrieve order',
        code: 'ORDER_RETRIEVAL_FAILED',
        message: 'Failed to retrieve order'
      };
    }
  }

  /**
   * Update order
   */
  async updateOrder(orderId: string, updateData: IUpdateOrderRequest): Promise<IOrderResponse> {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        return {
          success: false,
          error: 'Order not found',
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found'
        };
      }

      // Check if order can be updated
      if (!this.canUpdateOrder(order)) {
        return {
          success: false,
          error: 'Order cannot be updated in current status',
          code: 'ORDER_NOT_UPDATABLE',
          message: 'Order cannot be updated in current status'
        };
      }

      // Update order fields
      if (updateData.items) {
        const processedItems = await this.processOrderItems(updateData.items);
        order.items = processedItems as any; // Type assertion for DocumentArray
        order.totals = await order.calculateTotals();
      }

      if (updateData.shippingAddress) {
        Object.assign(order.shippingAddress, updateData.shippingAddress);
      }

      if (updateData.billingAddress) {
        Object.assign(order.billingAddress, updateData.billingAddress);
      }

      if (updateData.customerNotes) {
        order.customerNotes = updateData.customerNotes;
      }

      if (updateData.metadata) {
        Object.assign(order.metadata, updateData.metadata);
      }

      if (updateData.status && updateData.status !== order.status) {
        await order.updateStatus(updateData.status, 'Order updated via API');
      }

      // Save updated order
      const updatedOrder = await order.save();

      // Update cache
      await this.cacheOrder(updatedOrder);

      // Emit order updated event
      await this.emitOrderEvent('order.updated', updatedOrder);

      return {
        success: true,
        message: 'Order updated successfully',
        data: { order: updatedOrder }
      };

    } catch (error) {
      console.error('Error updating order:', error);
      return {
        success: false,
        error: 'Failed to update order',
        code: 'ORDER_UPDATE_FAILED',
        message: 'Failed to update order'
      };
    }
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId: string, reason?: string): Promise<IOrderResponse> {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        return {
          success: false,
          error: 'Order not found',
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found'
        };
      }

      // Check if order can be cancelled
      if (!order.canCancel()) {
        return {
          success: false,
          error: 'Order cannot be cancelled in current status',
          code: 'ORDER_NOT_CANCELLABLE',
          message: 'Order cannot be cancelled in current status'
        };
      }

      // Process refunds if payments exist
      const refundPromises = order.payments
        .filter(payment => payment.status === PaymentStatus.COMPLETED)
        .map(payment => this.processRefund(orderId, payment._id!.toString(), payment.amount, RefundReason.ORDER_CANCELLED));

      await Promise.all(refundPromises);

      // Release inventory
      await this.releaseInventory(order);

      // Update order status
      await order.updateStatus(OrderStatus.CANCELLED, reason || 'Order cancelled');
      order.cancelledAt = new Date();
      order.fulfillmentStatus = 'cancelled';

      const cancelledOrder = await order.save();

      // Update cache
      await this.cacheOrder(cancelledOrder);

      // Send notifications
      await this.notificationService.sendOrderUpdate(cancelledOrder, OrderStatus.CANCELLED);

      // Emit order cancelled event
      await this.emitOrderEvent('order.cancelled', cancelledOrder);

      return {
        success: true,
        message: 'Order cancelled successfully',
        data: { order: cancelledOrder }
      };

    } catch (error) {
      console.error('Error cancelling order:', error);
      return {
        success: false,
        error: 'Failed to cancel order',
        code: 'ORDER_CANCELLATION_FAILED',
        message: 'Failed to cancel order'
      };
    }
  }

  /**
   * Get orders with filters
   */
  async getOrders(query: IOrderSearchQuery): Promise<IOrderListResponse> {
    try {
      const {
        filters = {},
        sort = { field: 'createdAt', direction: 'desc' },
        page = 1,
        limit = 20
      } = query;

      // Build MongoDB query
      const mongoQuery = this.buildMongoQuery(filters);

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute query
      const [orders, total] = await Promise.all([
        Order.find(mongoQuery)
          .sort({ [sort.field]: sort.direction === 'asc' ? 1 : -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Order.countDocuments(mongoQuery)
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        data: {
          orders: orders.map(order => order.toObject()) as IOrder[],
          total,
          page,
          limit,
          totalPages
        }
      };

    } catch (error) {
      console.error('Error retrieving orders:', error);
      return {
        success: false,
        error: 'Failed to retrieve orders',
        code: 'ORDERS_RETRIEVAL_FAILED'
      };
    }
  }

  /**
   * Get orders by customer
   */
  async getCustomerOrders(customerId: string, page = 1, limit = 20): Promise<IOrderListResponse> {
    try {
      const skip = (page - 1) * limit;

      const [orders, total] = await Promise.all([
        Order.findByCustomer(customerId, { skip, limit }),
        Order.countDocuments({ customerId })
      ]);

      return {
        success: true,
        data: {
          orders,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };

    } catch (error) {
      console.error('Error retrieving customer orders:', error);
      return {
        success: false,
        error: 'Failed to retrieve customer orders',
        code: 'CUSTOMER_ORDERS_RETRIEVAL_FAILED'
      };
    }
  }

  // ==================== PAYMENT OPERATIONS ====================

  /**
   * Process payment for order
   */
  async processPayment(orderId: string, paymentData: any): Promise<IOrderResponse> {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        return {
          success: false,
          error: 'Order not found',
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found'
        };
      }

      // Validate payment method
      const isValidPayment = await this.paymentService.validatePaymentMethod(
        paymentData.method,
        paymentData
      );

      if (!isValidPayment) {
        return {
          success: false,
          error: 'Invalid payment method',
          code: 'INVALID_PAYMENT_METHOD',
          message: 'Invalid payment method'
        };
      }

      // Process payment through payment service
      const paymentResult = await this.paymentService.processPayment(paymentData);

      if (!paymentResult.success) {
        // Add failed payment record
        await order.addPayment({
          method: paymentData.method,
          provider: paymentData.provider || 'unknown',
          amount: paymentData.amount,
          currency: paymentData.currency || 'USD',
          status: PaymentStatus.FAILED,
          ...(paymentResult.error && { failureReason: paymentResult.error }),
          metadata: paymentData.metadata || {}
        });

        return {
          success: false,
          error: paymentResult.error || 'Payment processing failed',
          code: 'PAYMENT_FAILED',
          message: paymentResult.error || 'Payment processing failed'
        };
      }

      // Add successful payment record
      await order.addPayment({
        method: paymentData.method,
        provider: paymentData.provider || 'unknown',
        ...(paymentResult.transactionId && { transactionId: paymentResult.transactionId }),
        amount: paymentData.amount,
        currency: paymentData.currency || 'USD',
        status: PaymentStatus.COMPLETED,
        paidAt: new Date(),
        metadata: paymentData.metadata || {},
        gateway: paymentData.gateway || {}
      });

      // Update order status if fully paid
      const totalPaid = order.payments
        .filter(p => p.status === PaymentStatus.COMPLETED)
        .reduce((sum, p) => sum + p.amount, 0);

      if (totalPaid >= order.totals.total) {
        await order.updateStatus(OrderStatus.CONFIRMED, 'Payment completed');
        order.confirmedAt = new Date();
      }

      const updatedOrder = await order.save();

      // Send order confirmation if status changed to confirmed
      if (updatedOrder.status === OrderStatus.CONFIRMED) {
        await this.notificationService.sendOrderConfirmation(updatedOrder);
      }

      // Emit payment completed event
      await this.emitOrderEvent('payment.completed', updatedOrder);

      return {
        success: true,
        message: 'Payment processed successfully',
        data: { order: updatedOrder }
      };

    } catch (error) {
      console.error('Error processing payment:', error);
      return {
        success: false,
        error: 'Failed to process payment',
        code: 'PAYMENT_PROCESSING_FAILED',
        message: 'Failed to process payment'
      };
    }
  }

  /**
   * Process refund
   */
  async processRefund(
    orderId: string, 
    paymentId: string, 
    amount: number, 
    reason: RefundReason
  ): Promise<IRefund> {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    const payment = order.payments.id(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    // Process refund through payment service
    const refundResult = await this.paymentService.refundPayment(
      payment.transactionId!,
      amount
    );

    if (!refundResult.success) {
      throw new Error(refundResult.error || 'Refund processing failed');
    }

    // Create refund record
    const refund = await order.processRefund(paymentId, amount, reason);
    refund.refundId = refundResult.refundId || '';
    refund.status = 'completed';
    refund.processedAt = new Date();

    await order.save();

    return refund;
  }

  // ==================== INVENTORY OPERATIONS ====================

  /**
   * Reserve inventory for order
   */
  private async reserveInventory(order: IOrderDocument, session?: ClientSession): Promise<boolean> {
    try {
      const reservationPromises = order.items.map(item =>
        this.catalogService.updateInventory(item.productId, item.quantity, 'reserve')
      );

      const results = await Promise.all(reservationPromises);
      const allReserved = results.every(result => result === true);

      if (allReserved) {
        order.inventoryReserved = true;
        order.reservationExpiresAt = new Date(Date.now() + orderConfig.inventory.reservationExpiryMs);
        await order.save({ session: session || null });

        // Emit inventory reserved event (non-transactional)
        if (!session) {
          await this.emitOrderEvent('inventory.reserved', order);
        }
      }

      return allReserved;

    } catch (error) {
      console.error('Error reserving inventory:', error);
      return false;
    }
  }

  /**
   * Release inventory for order
   */
  private async releaseInventory(order: IOrder): Promise<void> {
    try {
      if (order.inventoryReserved) {
        const releasePromises = order.items.map(item =>
          this.catalogService.updateInventory(item.productId, item.quantity, 'release')
        );

        await Promise.all(releasePromises);
        await order.releaseInventory();
      }

    } catch (error) {
      console.error('Error releasing inventory:', error);
    }
  }

  /**
   * Check inventory availability
   */
  private async checkInventoryAvailability(items: Partial<IOrderItem>[]): Promise<{ available: boolean; issues: string[] }> {
    const issues: string[] = [];

    try {
      for (const item of items) {
        const stock = await this.catalogService.checkStock(item.productId!, item.variantId);
        
        if (stock.available < item.quantity!) {
          issues.push(`Insufficient stock for ${item.name}: available ${stock.available}, requested ${item.quantity}`);
        }
      }

      return {
        available: issues.length === 0,
        issues
      };

    } catch (error) {
      console.error('Error checking inventory availability:', error);
      return {
        available: false,
        issues: ['Failed to check inventory availability']
      };
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Validate order data
   */
  private async validateOrderData(orderData: ICreateOrderRequest): Promise<IOrderValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (!orderData.customerEmail) {
      errors.push('Customer email is required');
    }

    if (!orderData.items || orderData.items.length === 0) {
      errors.push('Order must contain at least one item');
    }

    if (!orderData.shippingAddress) {
      errors.push('Shipping address is required');
    }

    if (!orderData.billingAddress) {
      errors.push('Billing address is required');
    }

    // Validate items
    if (orderData.items) {
      for (let i = 0; i < orderData.items.length; i++) {
        const item = orderData.items[i];
        
        if (!item || !item.productId) {
          errors.push(`Item ${i + 1}: Product ID is required`);
        }
        
        if (!item || !item.quantity || item.quantity <= 0) {
          errors.push(`Item ${i + 1}: Valid quantity is required`);
        }
        
        if (!item || !item.unitPrice || item.unitPrice < 0) {
          errors.push(`Item ${i + 1}: Valid unit price is required`);
        }

        // Check if product exists
        try {
          if (item) {
            const productExists = await this.catalogService.validateProduct(item.productId, item.variantId);
            if (!productExists) {
              errors.push(`Item ${i + 1}: Product not found`);
            }
          }
        } catch (error) {
          warnings.push(`Item ${i + 1}: Could not validate product`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Process order items
   */
  private async processOrderItems(items: Partial<IOrderItem>[]): Promise<IOrderItem[]> {
    const processedItems: IOrderItem[] = [];

    for (const item of items) {
      if (!item || !item.productId) {
        throw new Error('Product ID is required for all items');
      }

      try {
        // Get product details from catalog
        const product = await this.catalogService.getProduct(item.productId);
        
        const processedItem: IOrderItem = {
          productId: item.productId,
          variantId: item.variantId || '',
          name: item.name || product.name,
          description: item.description || product.description,
          sku: item.sku || product.sku,
          quantity: item.quantity!,
          unitPrice: item.unitPrice || product.price,
          totalPrice: new Decimal(item.unitPrice || product.price).mul(item.quantity!).toNumber(),
          discountAmount: item.discountAmount || 0,
          taxAmount: item.taxAmount || 0,
          weight: item.weight || product.weight,
          dimensions: item.dimensions || product.dimensions,
          imageUrl: item.imageUrl || product.imageUrl,
          category: item.category || product.category,
          brand: item.brand || product.brand,
          customizations: item.customizations || {},
          metadata: item.metadata || {}
        };

        processedItems.push(processedItem);

      } catch (error) {
        console.error(`Error processing item ${item.productId}:`, error);
        // Use provided data as fallback
        const fallbackItem: IOrderItem = {
          productId: item.productId,
          variantId: item.variantId || '',
          name: item.name || 'Unknown Product',
          sku: item.sku || 'UNKNOWN',
          quantity: item.quantity!,
          unitPrice: item.unitPrice!,
          totalPrice: new Decimal(item.unitPrice!).mul(item.quantity!).toNumber(),
          discountAmount: item.discountAmount || 0,
          taxAmount: item.taxAmount || 0
        };

        processedItems.push(fallbackItem);
      }
    }

    return processedItems;
  }

  /**
   * Check if order can be updated
   */
  private canUpdateOrder(order: IOrder): boolean {
    const updatableStatuses = [
      OrderStatus.DRAFT,
      OrderStatus.PENDING,
      OrderStatus.CONFIRMED
    ];
    return updatableStatuses.includes(order.status);
  }

  /**
   * Build MongoDB query from filters
   */
  private buildMongoQuery(filters: IOrderFilters): any {
    const query: any = {};

    if (filters.customerId) {
      query.customerId = filters.customerId;
    }

    if (filters.customerEmail) {
      query.customerEmail = new RegExp(filters.customerEmail, 'i');
    }

    if (filters.status) {
      query.status = Array.isArray(filters.status) ? { $in: filters.status } : filters.status;
    }

    if (filters.dateRange) {
      query.placedAt = {
        $gte: filters.dateRange.start,
        $lte: filters.dateRange.end
      };
    }

    if (filters.amountRange) {
      query['totals.total'] = {
        $gte: filters.amountRange.min,
        $lte: filters.amountRange.max
      };
    }

    if (filters.source) {
      query.source = filters.source;
    }

    if (filters.tags && filters.tags.length > 0) {
      query.tags = { $in: filters.tags };
    }

    if (filters.search) {
      query.$text = { $search: filters.search };
    }

    return query;
  }

  /**
   * Cache order in Redis
   */
  private async cacheOrder(order: IOrderDocument): Promise<void> {
    try {
      await this.redisClient.setEx(
        `order:${order._id}`,
        orderConfig.cache.orderTtlSeconds,
        JSON.stringify(order.toObject())
      );
    } catch (error) {
      console.error('Error caching order:', error);
    }
  }

  /**
   * Get cached order from Redis
   */
  private async getCachedOrder(orderId: string): Promise<IOrder | null> {
    try {
      const cachedOrder = await this.redisClient.get(`order:${orderId}`);
      return cachedOrder ? JSON.parse(cachedOrder) : null;
    } catch (error) {
      console.error('Error retrieving cached order:', error);
      return null;
    }
  }

  /**
   * Clear order cache
   */
  // private async clearOrderCache(orderId: string): Promise<void> { // Not used currently
  //   try {
  //     await this.redisClient.del(`order:${orderId}`);
  //   } catch (error) {
  //     console.error('Error clearing order cache:', error);
  //   }
  // }

  /**
   * Emit order event
   */
  private async emitOrderEvent(eventType: string, order: IOrder): Promise<void> {
    try {
      const event: IOrderEvent = {
        type: eventType as any,
        orderId: (order._id as any).toString(),
        customerId: order.customerId,
        data: order,
        timestamp: new Date(),
        metadata: {}
      };

      await this.eventBus.emit(eventType, event);
    } catch (error) {
      console.error('Error emitting order event:', error);
    }
  }
}

export default OrderService;
