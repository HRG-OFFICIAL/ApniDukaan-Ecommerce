import { Order, IOrderDocument } from '../models/Order';
import { Cart } from '../models/Cart';
import { OrderStatus, PaymentStatus, logger, ValidationError, NotFoundError, ForbiddenError } from '@shopsphere/shared';
import { kafkaService } from './kafkaService';
import { redisClient } from '@shopsphere/shared';

export interface CreateOrderData {
  items: Array<{
    product: string;
    quantity: number;
    price: number;
  }>;
  shippingAddress: any;
  billingAddress: any;
  paymentMethod: string;
  shippingMethod: any;
  couponCode?: string;
}

class OrderService {
  private readonly CACHE_TTL = 300; // 5 minutes

  async createOrder(orderData: CreateOrderData, userId: string, userEmail: string): Promise<IOrderDocument> {
    try {
      // Get user's cart
      const cart = await Cart.findByUser(userId);
      if (!cart || cart.items.length === 0) {
        throw new ValidationError('Cart is empty');
      }

      // Validate cart items against current prices
      await this.validateCartItems(cart);

      // Calculate totals
      const subtotal = cart.subtotal;
      const tax = this.calculateTax(subtotal, orderData.shippingAddress);
      const shipping = orderData.shippingMethod.cost;
      const discount = await this.calculateDiscount(subtotal, orderData.couponCode);
      const total = subtotal + tax + shipping - discount;

      // Create order
      const order = new Order({
        user: userId,
        email: userEmail,
        items: cart.items.map(item => ({
          product: item.product,
          productName: item.productName,
          productImage: item.productImage,
          sku: item.sku,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
          variant: item.variant
        })),
        subtotal,
        tax,
        shipping,
        discount,
        total,
        paymentMethod: orderData.paymentMethod,
        shippingAddress: orderData.shippingAddress,
        billingAddress: orderData.billingAddress,
        shippingMethod: orderData.shippingMethod,
        couponCode: orderData.couponCode,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING
      });

      await order.save();

      // Reserve inventory
      await this.reserveInventory(order);

      // Publish order created event
      await kafkaService.publishOrderEvent({
        type: 'ORDER_CREATED',
        orderId: order._id.toString(),
        userId,
        data: {
          orderNumber: order.orderNumber,
          total: order.total,
          items: order.items
        },
        timestamp: new Date()
      });

      // Clear user's cart
      await cart.clearCart();

      // Send notification
      await kafkaService.publishNotificationEvent(userId, 'ORDER_CREATED', {
        orderNumber: order.orderNumber,
        total: order.total
      });

      logger.info('Order created successfully', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        userId,
        total: order.total,
        action: 'create_order'
      });

      return order;
    } catch (error) {
      logger.error('Failed to create order', {
        userId,
        error: error.message,
        action: 'create_order'
      });
      throw error;
    }
  }

  async getOrderById(id: string, userId?: string): Promise<IOrderDocument | null> {
    try {
      const cacheKey = `order:${id}`;
      
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        const order = JSON.parse(cached);
        // Check user access if userId provided
        if (userId && order.user !== userId) {
          throw new ForbiddenError('Access denied');
        }
        return order;
      }

      const query: any = { _id: id };
      if (userId) {
        query.user = userId;
      }

      const order = await Order.findOne(query);
      
      if (order) {
        await redisClient.setex(cacheKey, this.CACHE_TTL, JSON.stringify(order));
      }

      return order;
    } catch (error) {
      logger.error('Failed to get order by ID', {
        orderId: id,
        userId,
        error: error.message,
        action: 'get_order_by_id'
      });
      throw error;
    }
  }

  async getOrderByNumber(orderNumber: string, userId?: string): Promise<IOrderDocument | null> {
    try {
      const query: any = { orderNumber };
      if (userId) {
        query.user = userId;
      }

      const order = await Order.findByOrderNumber(orderNumber);
      
      if (order && userId && order.user.toString() !== userId) {
        throw new ForbiddenError('Access denied');
      }

      return order;
    } catch (error) {
      logger.error('Failed to get order by number', {
        orderNumber,
        userId,
        error: error.message,
        action: 'get_order_by_number'
      });
      throw error;
    }
  }

  async getUserOrders(userId: string, limit: number = 20, skip: number = 0): Promise<IOrderDocument[]> {
    try {
      const orders = await Order.findByUser(userId, limit, skip);

      logger.info('User orders retrieved', {
        userId,
        count: orders.length,
        action: 'get_user_orders'
      });

      return orders;
    } catch (error) {
      logger.error('Failed to get user orders', {
        userId,
        error: error.message,
        action: 'get_user_orders'
      });
      throw error;
    }
  }

  async updateOrderStatus(id: string, status: OrderStatus, userId: string): Promise<IOrderDocument> {
    try {
      const order = await Order.findById(id);
      if (!order) {
        throw new NotFoundError('Order not found');
      }

      const oldStatus = order.status;
      await order.updateStatus(status);

      // Clear cache
      await redisClient.del(`order:${id}`);

      // Publish order updated event
      await kafkaService.publishOrderEvent({
        type: 'ORDER_UPDATED',
        orderId: id,
        userId: order.user.toString(),
        data: {
          orderNumber: order.orderNumber,
          oldStatus,
          newStatus: status
        },
        timestamp: new Date()
      });

      // Send notification to customer
      await kafkaService.publishNotificationEvent(order.user.toString(), 'ORDER_STATUS_UPDATED', {
        orderNumber: order.orderNumber,
        status
      });

      logger.info('Order status updated', {
        orderId: id,
        oldStatus,
        newStatus: status,
        updatedBy: userId,
        action: 'update_order_status'
      });

      return order;
    } catch (error) {
      logger.error('Failed to update order status', {
        orderId: id,
        status,
        userId,
        error: error.message,
        action: 'update_order_status'
      });
      throw error;
    }
  }

  async cancelOrder(id: string, reason: string, userId: string, isAdmin: boolean = false): Promise<IOrderDocument> {
    try {
      const order = await Order.findById(id);
      if (!order) {
        throw new NotFoundError('Order not found');
      }

      // Check permissions
      if (!isAdmin && order.user.toString() !== userId) {
        throw new ForbiddenError('Access denied');
      }

      // Check if order can be cancelled
      if (!order.canBeCancelled()) {
        throw new ValidationError('Order cannot be cancelled in current status');
      }

      order.status = OrderStatus.CANCELLED;
      order.cancelledAt = new Date();
      order.cancelReason = reason;
      await order.save();

      // Release reserved inventory
      await this.releaseInventory(order);

      // Clear cache
      await redisClient.del(`order:${id}`);

      // Publish order cancelled event
      await kafkaService.publishOrderEvent({
        type: 'ORDER_CANCELLED',
        orderId: id,
        userId: order.user.toString(),
        data: {
          orderNumber: order.orderNumber,
          reason,
          cancelledBy: userId
        },
        timestamp: new Date()
      });

      // Send notification
      await kafkaService.publishNotificationEvent(order.user.toString(), 'ORDER_CANCELLED', {
        orderNumber: order.orderNumber,
        reason
      });

      logger.info('Order cancelled', {
        orderId: id,
        reason,
        cancelledBy: userId,
        action: 'cancel_order'
      });

      return order;
    } catch (error) {
      logger.error('Failed to cancel order', {
        orderId: id,
        reason,
        userId,
        error: error.message,
        action: 'cancel_order'
      });
      throw error;
    }
  }

  async addTrackingInfo(id: string, trackingNumber: string, carrier: string, userId: string): Promise<IOrderDocument> {
    try {
      const order = await Order.findById(id);
      if (!order) {
        throw new NotFoundError('Order not found');
      }

      await order.addTrackingInfo(trackingNumber, carrier);

      // Clear cache
      await redisClient.del(`order:${id}`);

      // Send notification to customer
      await kafkaService.publishNotificationEvent(order.user.toString(), 'ORDER_SHIPPED', {
        orderNumber: order.orderNumber,
        trackingNumber,
        carrier
      });

      logger.info('Tracking info added to order', {
        orderId: id,
        trackingNumber,
        carrier,
        updatedBy: userId,
        action: 'add_tracking_info'
      });

      return order;
    } catch (error) {
      logger.error('Failed to add tracking info', {
        orderId: id,
        trackingNumber,
        carrier,
        userId,
        error: error.message,
        action: 'add_tracking_info'
      });
      throw error;
    }
  }

  // Kafka event handlers
  async handlePaymentCompleted(orderId: string, paymentData: any): Promise<void> {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        logger.error('Order not found for payment completion', { orderId });
        return;
      }

      order.paymentStatus = PaymentStatus.PAID;
      order.paymentIntentId = paymentData.paymentIntentId;
      
      if (order.status === OrderStatus.PENDING) {
        order.status = OrderStatus.CONFIRMED;
      }

      await order.save();

      // Clear cache
      await redisClient.del(`order:${orderId}`);

      logger.info('Payment completed for order', {
        orderId,
        paymentIntentId: paymentData.paymentIntentId,
        action: 'handle_payment_completed'
      });
    } catch (error) {
      logger.error('Failed to handle payment completion', {
        orderId,
        error: error.message,
        action: 'handle_payment_completed'
      });
    }
  }

  async handlePaymentFailed(orderId: string, errorData: any): Promise<void> {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        logger.error('Order not found for payment failure', { orderId });
        return;
      }

      order.paymentStatus = PaymentStatus.FAILED;
      await order.save();

      // Release inventory
      await this.releaseInventory(order);

      // Clear cache
      await redisClient.del(`order:${orderId}`);

      logger.info('Payment failed for order', {
        orderId,
        error: errorData,
        action: 'handle_payment_failed'
      });
    } catch (error) {
      logger.error('Failed to handle payment failure', {
        orderId,
        error: error.message,
        action: 'handle_payment_failed'
      });
    }
  }

  async handlePaymentRefunded(orderId: string, refundData: any): Promise<void> {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        logger.error('Order not found for payment refund', { orderId });
        return;
      }

      order.refunds.push({
        amount: refundData.amount,
        reason: refundData.reason,
        refundId: refundData.refundId,
        processedAt: new Date()
      });

      await order.save();

      // Clear cache
      await redisClient.del(`order:${orderId}`);

      logger.info('Payment refunded for order', {
        orderId,
        refundAmount: refundData.amount,
        action: 'handle_payment_refunded'
      });
    } catch (error) {
      logger.error('Failed to handle payment refund', {
        orderId,
        error: error.message,
        action: 'handle_payment_refunded'
      });
    }
  }

  async handleInventoryReserved(orderId: string, items: any[]): Promise<void> {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        logger.error('Order not found for inventory reservation', { orderId });
        return;
      }

      // Update order status if still pending
      if (order.status === OrderStatus.PENDING) {
        order.status = OrderStatus.CONFIRMED;
        await order.save();
      }

      logger.info('Inventory reserved for order', {
        orderId,
        items: items.length,
        action: 'handle_inventory_reserved'
      });
    } catch (error) {
      logger.error('Failed to handle inventory reservation', {
        orderId,
        error: error.message,
        action: 'handle_inventory_reserved'
      });
    }
  }

  async handleInventoryReservationFailed(orderId: string, failedItems: any[]): Promise<void> {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        logger.error('Order not found for inventory reservation failure', { orderId });
        return;
      }

      // Cancel the order due to insufficient inventory
      order.status = OrderStatus.CANCELLED;
      order.cancelReason = 'Insufficient inventory';
      order.cancelledAt = new Date();
      await order.save();

      // Send notification to customer
      await kafkaService.publishNotificationEvent(order.user.toString(), 'ORDER_CANCELLED', {
        orderNumber: order.orderNumber,
        reason: 'Some items are out of stock'
      });

      logger.info('Order cancelled due to inventory reservation failure', {
        orderId,
        failedItems: failedItems.length,
        action: 'handle_inventory_reservation_failed'
      });
    } catch (error) {
      logger.error('Failed to handle inventory reservation failure', {
        orderId,
        error: error.message,
        action: 'handle_inventory_reservation_failed'
      });
    }
  }

  async handleInventoryReleased(orderId: string, items: any[]): Promise<void> {
    logger.info('Inventory released for order', {
      orderId,
      items: items.length,
      action: 'handle_inventory_released'
    });
  }

  private async validateCartItems(cart: any): Promise<void> {
    // In a real implementation, this would validate against current product prices
    // and availability from the catalog service
  }

  private calculateTax(subtotal: number, shippingAddress: any): number {
    // Simple tax calculation - in reality this would be more complex
    const taxRate = 0.08; // 8% tax rate
    return Math.round(subtotal * taxRate * 100) / 100;
  }

  private async calculateDiscount(subtotal: number, couponCode?: string): Promise<number> {
    if (!couponCode) return 0;
    
    // Simple discount calculation - in reality this would validate against a coupon service
    const discountRate = 0.1; // 10% discount
    return Math.round(subtotal * discountRate * 100) / 100;
  }

  private async reserveInventory(order: IOrderDocument): Promise<void> {
    for (const item of order.items) {
      await kafkaService.publishInventoryEvent(
        item.product.toString(),
        item.quantity,
        'RESERVE'
      );
    }
  }

  private async releaseInventory(order: IOrderDocument): Promise<void> {
    for (const item of order.items) {
      await kafkaService.publishInventoryEvent(
        item.product.toString(),
        item.quantity,
        'RELEASE'
      );
    }
  }
}

export const orderService = new OrderService();
