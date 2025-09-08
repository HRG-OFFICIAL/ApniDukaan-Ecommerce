import mongoose from 'mongoose';
import { Order, IOrderDocument } from '../models/Order';
import { OrderStatus, PaymentStatus, logger } from '@shopsphere/shared';
import { kafkaService } from './kafkaService';
import { redisClient } from '@shopsphere/shared';

export interface OrderStatusTransition {
  orderId: string;
  fromStatus: OrderStatus;
  toStatus: OrderStatus;
  reason?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
  userId: string;
  userRole: string;
}

export interface OrderStatusRule {
  from: OrderStatus;
  to: OrderStatus[];
  requiredRole?: string[];
  conditions?: (order: IOrderDocument) => boolean;
  preActions?: (order: IOrderDocument, metadata?: any) => Promise<void>;
  postActions?: (order: IOrderDocument, metadata?: any) => Promise<void>;
}

export interface OrderAuditLog {
  orderId: string;
  orderNumber: string;
  action: string;
  details: Record<string, any>;
  userId: string;
  userRole: string;
  timestamp: Date;
  ip?: string;
  userAgent?: string;
}

class OrderStatusService {
  private readonly statusTransitionRules: OrderStatusRule[] = [
    // From PENDING
    {
      from: OrderStatus.PENDING,
      to: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      requiredRole: ['user', 'admin', 'moderator'],
      conditions: (order) => order.paymentStatus !== PaymentStatus.FAILED,
      preActions: async (order, metadata) => {
        if (metadata?.toStatus === OrderStatus.CONFIRMED) {
          await this.validateInventoryAvailability(order);
        }
      }
    },
    
    // From CONFIRMED
    {
      from: OrderStatus.CONFIRMED,
      to: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      requiredRole: ['admin', 'moderator'],
      preActions: async (order, metadata) => {
        if (metadata?.toStatus === OrderStatus.PROCESSING) {
          await this.reserveInventory(order);
        }
      }
    },
    
    // From PROCESSING
    {
      from: OrderStatus.PROCESSING,
      to: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      requiredRole: ['admin', 'moderator'],
      conditions: (order) => order.paymentStatus === PaymentStatus.PAID,
      preActions: async (order, metadata) => {
        if (metadata?.toStatus === OrderStatus.SHIPPED) {
          await this.validateShippingInfo(order);
        }
      }
    },
    
    // From SHIPPED
    {
      from: OrderStatus.SHIPPED,
      to: [OrderStatus.DELIVERED, OrderStatus.RETURNED],
      requiredRole: ['admin', 'moderator', 'system'],
      preActions: async (order, metadata) => {
        if (metadata?.toStatus === OrderStatus.DELIVERED) {
          await this.notifyCustomerDelivery(order);
        }
      }
    },
    
    // From DELIVERED
    {
      from: OrderStatus.DELIVERED,
      to: [OrderStatus.RETURNED, OrderStatus.REFUNDED],
      requiredRole: ['admin', 'moderator'],
      conditions: (order) => {
        // Can only return/refund within 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return order.deliveredAt ? order.deliveredAt > thirtyDaysAgo : false;
      }
    },
    
    // From any status to CANCELLED (with restrictions)
    {
      from: OrderStatus.PENDING,
      to: [OrderStatus.CANCELLED],
      requiredRole: ['user', 'admin', 'moderator'],
      conditions: (order) => order.canBeCancelled()
    },
    {
      from: OrderStatus.CONFIRMED,
      to: [OrderStatus.CANCELLED],
      requiredRole: ['user', 'admin', 'moderator'],
      conditions: (order) => order.canBeCancelled()
    },
    {
      from: OrderStatus.PROCESSING,
      to: [OrderStatus.CANCELLED],
      requiredRole: ['admin', 'moderator'],
      preActions: async (order) => {
        await this.releaseInventory(order);
      }
    }
  ];

  /**
   * Transition order status with validation and audit trail
   */
  async transitionOrderStatus(
    orderId: string,
    toStatus: OrderStatus,
    userId: string,
    userRole: string,
    reason?: string,
    metadata?: Record<string, any>,
    ip?: string,
    userAgent?: string
  ): Promise<IOrderDocument> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Find the order
      const order = await Order.findById(orderId).session(session);
      if (!order) {
        throw new Error(`Order ${orderId} not found`);
      }

      const fromStatus = order.status;

      // Validate transition
      const isValidTransition = await this.validateStatusTransition(
        order,
        fromStatus,
        toStatus,
        userRole
      );

      if (!isValidTransition) {
        throw new Error(
          `Invalid status transition from ${fromStatus} to ${toStatus} for role ${userRole}`
        );
      }

      // Get transition rule
      const rule = this.getTransitionRule(fromStatus, toStatus);

      // Execute pre-actions
      if (rule?.preActions) {
        await rule.preActions(order, { toStatus, ...metadata });
      }

      // Update order status
      const oldValues = {
        status: order.status,
        paymentStatus: order.paymentStatus,
        updatedAt: order.updatedAt
      };

      await order.updateStatus(toStatus);

      // Log the transition
      const transition: OrderStatusTransition = {
        orderId,
        fromStatus,
        toStatus,
        reason,
        metadata,
        timestamp: new Date(),
        userId,
        userRole
      };

      await this.logStatusTransition(transition);

      // Create audit log
      const auditLog: OrderAuditLog = {
        orderId,
        orderNumber: order.orderNumber,
        action: 'STATUS_CHANGE',
        details: {
          fromStatus,
          toStatus,
          reason,
          metadata,
          oldValues,
          newValues: {
            status: order.status,
            paymentStatus: order.paymentStatus,
            updatedAt: order.updatedAt
          }
        },
        userId,
        userRole,
        timestamp: new Date(),
        ip,
        userAgent
      };

      await this.createAuditLog(auditLog);

      // Execute post-actions
      if (rule?.postActions) {
        await rule.postActions(order, { fromStatus, toStatus, ...metadata });
      }

      // Publish status change event
      await kafkaService.publishOrderEvent({
        type: 'ORDER_STATUS_CHANGED',
        orderId,
        userId: order.user.toString(),
        data: {
          orderNumber: order.orderNumber,
          fromStatus,
          toStatus,
          reason,
          changedBy: userId
        },
        timestamp: new Date()
      });

      // Clear cache
      await redisClient.del(`order:${orderId}`);
      await redisClient.del(`order:status:${orderId}`);

      await session.commitTransaction();

      logger.info('Order status transitioned successfully', {
        orderId,
        orderNumber: order.orderNumber,
        fromStatus,
        toStatus,
        userId,
        userRole,
        reason,
        action: 'transition_order_status'
      });

      return order;

    } catch (error) {
      await session.abortTransaction();
      logger.error('Failed to transition order status', {
        orderId,
        toStatus,
        userId,
        userRole,
        error: error.message,
        action: 'transition_order_status'
      });
      throw error;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Get valid next statuses for an order
   */
  async getValidTransitions(
    orderId: string,
    userRole: string
  ): Promise<{ status: OrderStatus; label: string; description: string }[]> {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error(`Order ${orderId} not found`);
      }

      const validTransitions = [];
      const currentStatus = order.status;

      for (const rule of this.statusTransitionRules) {
        if (rule.from === currentStatus) {
          for (const toStatus of rule.to) {
            // Check role permission
            if (rule.requiredRole && !rule.requiredRole.includes(userRole)) {
              continue;
            }

            // Check conditions
            if (rule.conditions && !rule.conditions(order)) {
              continue;
            }

            validTransitions.push({
              status: toStatus,
              label: this.getStatusLabel(toStatus),
              description: this.getStatusDescription(currentStatus, toStatus)
            });
          }
        }
      }

      return validTransitions;
    } catch (error) {
      logger.error('Failed to get valid transitions', {
        orderId,
        userRole,
        error: error.message,
        action: 'get_valid_transitions'
      });
      throw error;
    }
  }

  /**
   * Get order status history
   */
  async getOrderStatusHistory(orderId: string): Promise<OrderStatusTransition[]> {
    try {
      const cacheKey = `order:status:history:${orderId}`;
      const cached = await redisClient.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      // In a real implementation, this would query a status transitions collection
      // For now, we'll return a mock history
      const history: OrderStatusTransition[] = [];
      
      await redisClient.setex(cacheKey, 3600, JSON.stringify(history)); // 1 hour cache
      
      return history;
    } catch (error) {
      logger.error('Failed to get order status history', {
        orderId,
        error: error.message,
        action: 'get_order_status_history'
      });
      throw error;
    }
  }

  /**
   * Get order audit trail
   */
  async getOrderAuditTrail(orderId: string): Promise<OrderAuditLog[]> {
    try {
      const cacheKey = `order:audit:${orderId}`;
      const cached = await redisClient.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      // In a real implementation, this would query an audit logs collection
      const auditLogs: OrderAuditLog[] = [];
      
      await redisClient.setex(cacheKey, 3600, JSON.stringify(auditLogs)); // 1 hour cache
      
      return auditLogs;
    } catch (error) {
      logger.error('Failed to get order audit trail', {
        orderId,
        error: error.message,
        action: 'get_order_audit_trail'
      });
      throw error;
    }
  }

  /**
   * Bulk status update for multiple orders
   */
  async bulkUpdateStatus(
    orderIds: string[],
    toStatus: OrderStatus,
    userId: string,
    userRole: string,
    reason?: string
  ): Promise<{ success: string[]; failed: { orderId: string; error: string }[] }> {
    const results = {
      success: [] as string[],
      failed: [] as { orderId: string; error: string }[]
    };

    for (const orderId of orderIds) {
      try {
        await this.transitionOrderStatus(orderId, toStatus, userId, userRole, reason);
        results.success.push(orderId);
      } catch (error) {
        results.failed.push({
          orderId,
          error: error.message
        });
      }
    }

    logger.info('Bulk status update completed', {
      totalOrders: orderIds.length,
      successful: results.success.length,
      failed: results.failed.length,
      toStatus,
      userId,
      action: 'bulk_update_status'
    });

    return results;
  }

  /**
   * Validate status transition
   */
  private async validateStatusTransition(
    order: IOrderDocument,
    fromStatus: OrderStatus,
    toStatus: OrderStatus,
    userRole: string
  ): Promise<boolean> {
    // Find matching rule
    const rule = this.getTransitionRule(fromStatus, toStatus);
    if (!rule) {
      return false;
    }

    // Check role permission
    if (rule.requiredRole && !rule.requiredRole.includes(userRole)) {
      return false;
    }

    // Check conditions
    if (rule.conditions && !rule.conditions(order)) {
      return false;
    }

    return true;
  }

  /**
   * Get transition rule
   */
  private getTransitionRule(fromStatus: OrderStatus, toStatus: OrderStatus): OrderStatusRule | undefined {
    return this.statusTransitionRules.find(rule => 
      rule.from === fromStatus && rule.to.includes(toStatus)
    );
  }

  /**
   * Log status transition
   */
  private async logStatusTransition(transition: OrderStatusTransition): Promise<void> {
    // In a real implementation, this would save to a transitions collection
    const key = `order:transitions:${transition.orderId}`;
    const existing = await redisClient.get(key);
    const transitions = existing ? JSON.parse(existing) : [];
    transitions.push(transition);
    await redisClient.setex(key, 86400, JSON.stringify(transitions)); // 24 hours
  }

  /**
   * Create audit log entry
   */
  private async createAuditLog(auditLog: OrderAuditLog): Promise<void> {
    // In a real implementation, this would save to an audit logs collection
    const key = `order:audit:${auditLog.orderId}`;
    const existing = await redisClient.get(key);
    const logs = existing ? JSON.parse(existing) : [];
    logs.push(auditLog);
    await redisClient.setex(key, 86400, JSON.stringify(logs)); // 24 hours
  }

  /**
   * Get status label for display
   */
  private getStatusLabel(status: OrderStatus): string {
    const labels: Record<OrderStatus, string> = {
      [OrderStatus.PENDING]: 'Pending',
      [OrderStatus.CONFIRMED]: 'Confirmed',
      [OrderStatus.PROCESSING]: 'Processing',
      [OrderStatus.SHIPPED]: 'Shipped',
      [OrderStatus.DELIVERED]: 'Delivered',
      [OrderStatus.CANCELLED]: 'Cancelled',
      [OrderStatus.RETURNED]: 'Returned',
      [OrderStatus.REFUNDED]: 'Refunded'
    };
    return labels[status] || status;
  }

  /**
   * Get status transition description
   */
  private getStatusDescription(fromStatus: OrderStatus, toStatus: OrderStatus): string {
    const descriptions: Record<string, string> = {
      [`${OrderStatus.PENDING}-${OrderStatus.CONFIRMED}`]: 'Confirm order and begin processing',
      [`${OrderStatus.CONFIRMED}-${OrderStatus.PROCESSING}`]: 'Start preparing order for shipment',
      [`${OrderStatus.PROCESSING}-${OrderStatus.SHIPPED}`]: 'Mark order as shipped with tracking',
      [`${OrderStatus.SHIPPED}-${OrderStatus.DELIVERED}`]: 'Confirm order delivery',
      [`${OrderStatus.DELIVERED}-${OrderStatus.RETURNED}`]: 'Process return request',
      [`${OrderStatus.DELIVERED}-${OrderStatus.REFUNDED}`]: 'Process refund request',
      [`${OrderStatus.PENDING}-${OrderStatus.CANCELLED}`]: 'Cancel pending order',
      [`${OrderStatus.CONFIRMED}-${OrderStatus.CANCELLED}`]: 'Cancel confirmed order',
      [`${OrderStatus.PROCESSING}-${OrderStatus.CANCELLED}`]: 'Cancel order in processing'
    };
    return descriptions[`${fromStatus}-${toStatus}`] || `Change status from ${fromStatus} to ${toStatus}`;
  }

  // Helper methods for pre/post actions
  private async validateInventoryAvailability(order: IOrderDocument): Promise<void> {
    // Validate inventory availability before confirming
    for (const item of order.items) {
      await kafkaService.publishInventoryEvent(
        item.product.toString(),
        item.quantity,
        'VALIDATE_AVAILABILITY'
      );
    }
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

  private async validateShippingInfo(order: IOrderDocument): Promise<void> {
    if (!order.shippingAddress || !order.shippingMethod) {
      throw new Error('Shipping information is required before shipping');
    }
  }

  private async notifyCustomerDelivery(order: IOrderDocument): Promise<void> {
    await kafkaService.publishNotificationEvent(
      order.user.toString(),
      'ORDER_DELIVERED',
      {
        orderNumber: order.orderNumber,
        deliveredAt: new Date()
      }
    );
  }

  /**
   * Get order status statistics
   */
  async getOrderStatusStats(startDate?: Date, endDate?: Date): Promise<Record<OrderStatus, number>> {
    try {
      const matchStage: any = {};
      
      if (startDate || endDate) {
        matchStage.createdAt = {};
        if (startDate) matchStage.createdAt.$gte = startDate;
        if (endDate) matchStage.createdAt.$lte = endDate;
      }

      const stats = await Order.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const statusCounts: Record<OrderStatus, number> = {
        [OrderStatus.PENDING]: 0,
        [OrderStatus.CONFIRMED]: 0,
        [OrderStatus.PROCESSING]: 0,
        [OrderStatus.SHIPPED]: 0,
        [OrderStatus.DELIVERED]: 0,
        [OrderStatus.CANCELLED]: 0,
        [OrderStatus.RETURNED]: 0,
        [OrderStatus.REFUNDED]: 0
      };

      stats.forEach(stat => {
        if (statusCounts.hasOwnProperty(stat._id)) {
          statusCounts[stat._id as OrderStatus] = stat.count;
        }
      });

      return statusCounts;
    } catch (error) {
      logger.error('Failed to get order status statistics', {
        error: error.message,
        action: 'get_order_status_stats'
      });
      throw error;
    }
  }
}

export const orderStatusService = new OrderStatusService();
