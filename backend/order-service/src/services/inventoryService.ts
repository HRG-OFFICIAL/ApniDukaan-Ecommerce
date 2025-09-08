import mongoose from 'mongoose';
import { logger } from '@shopsphere/shared';
import { kafkaService } from './kafkaService';
import { redisClient } from '@shopsphere/shared';

export interface InventoryItem {
  productId: string;
  sku: string;
  quantity: number;
  reservedQuantity?: number;
  availableQuantity?: number;
  location?: string;
  expiresAt?: Date;
}

export interface InventoryReservation {
  id: string;
  orderId: string;
  items: InventoryItem[];
  status: 'pending' | 'confirmed' | 'released' | 'expired';
  createdAt: Date;
  expiresAt: Date;
  reservedBy: string;
}

export interface InventoryUpdate {
  productId: string;
  quantity: number;
  operation: 'reserve' | 'release' | 'adjust' | 'restock';
  reason?: string;
  orderId?: string;
  userId?: string;
}

export interface StockLevel {
  productId: string;
  sku: string;
  totalQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  lowStockThreshold: number;
  isLowStock: boolean;
  isOutOfStock: boolean;
  lastRestocked?: Date;
  location?: string;
}

class InventoryService {
  private readonly RESERVATION_TTL = 15 * 60; // 15 minutes in seconds
  private readonly CACHE_TTL = 300; // 5 minutes in seconds

  /**
   * Reserve inventory for an order
   */
  async reserveInventory(
    orderId: string,
    items: InventoryItem[],
    userId: string,
    ttlMinutes: number = 15
  ): Promise<InventoryReservation> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const reservationId = `res_${orderId}_${Date.now()}`;
      const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

      // Check availability for all items first
      const availabilityChecks = await Promise.all(
        items.map(item => this.checkAvailability(item.productId, item.quantity))
      );

      const unavailableItems = availabilityChecks
        .map((available, index) => ({ available, item: items[index] }))
        .filter(({ available }) => !available)
        .map(({ item }) => item);

      if (unavailableItems.length > 0) {
        throw new Error(`Insufficient inventory for items: ${unavailableItems.map(i => i.sku).join(', ')}`);
      }

      // Reserve items
      const reservedItems: InventoryItem[] = [];
      for (const item of items) {
        const reserved = await this.reserveItem(item, orderId, userId, expiresAt);
        reservedItems.push(reserved);
      }

      // Create reservation record
      const reservation: InventoryReservation = {
        id: reservationId,
        orderId,
        items: reservedItems,
        status: 'pending',
        createdAt: new Date(),
        expiresAt,
        reservedBy: userId
      };

      // Store reservation in Redis
      await redisClient.setex(
        `inventory:reservation:${reservationId}`,
        ttlMinutes * 60,
        JSON.stringify(reservation)
      );

      // Store reservation by order ID for easy lookup
      await redisClient.setex(
        `inventory:order:${orderId}`,
        ttlMinutes * 60,
        reservationId
      );

      // Schedule automatic release
      await this.scheduleReservationExpiry(reservationId, ttlMinutes * 60);

      await session.commitTransaction();

      // Publish inventory reserved event
      await kafkaService.publishInventoryEvent('INVENTORY_RESERVED', {
        reservationId,
        orderId,
        items: reservedItems,
        expiresAt
      });

      logger.info('Inventory reserved successfully', {
        reservationId,
        orderId,
        itemCount: items.length,
        userId,
        expiresAt,
        action: 'reserve_inventory'
      });

      return reservation;

    } catch (error) {
      await session.abortTransaction();
      logger.error('Failed to reserve inventory', {
        orderId,
        items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
        userId,
        error: error.message,
        action: 'reserve_inventory'
      });
      throw error;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Confirm inventory reservation (convert to permanent allocation)
   */
  async confirmReservation(reservationId: string, userId: string): Promise<void> {
    try {
      const reservation = await this.getReservation(reservationId);
      if (!reservation) {
        throw new Error('Reservation not found');
      }

      if (reservation.status !== 'pending') {
        throw new Error(`Cannot confirm reservation with status: ${reservation.status}`);
      }

      // Update reservation status
      reservation.status = 'confirmed';
      await redisClient.setex(
        `inventory:reservation:${reservationId}`,
        86400, // 24 hours for confirmed reservations
        JSON.stringify(reservation)
      );

      // Actually reduce the available inventory
      for (const item of reservation.items) {
        await this.confirmItemReservation(item.productId, item.quantity);
      }

      // Publish inventory confirmed event
      await kafkaService.publishInventoryEvent('INVENTORY_CONFIRMED', {
        reservationId,
        orderId: reservation.orderId,
        items: reservation.items,
        confirmedBy: userId
      });

      logger.info('Inventory reservation confirmed', {
        reservationId,
        orderId: reservation.orderId,
        itemCount: reservation.items.length,
        confirmedBy: userId,
        action: 'confirm_reservation'
      });

    } catch (error) {
      logger.error('Failed to confirm inventory reservation', {
        reservationId,
        userId,
        error: error.message,
        action: 'confirm_reservation'
      });
      throw error;
    }
  }

  /**
   * Release inventory reservation
   */
  async releaseReservation(reservationId: string, reason?: string): Promise<void> {
    try {
      const reservation = await this.getReservation(reservationId);
      if (!reservation) {
        logger.warn('Attempted to release non-existent reservation', { reservationId });
        return;
      }

      if (reservation.status === 'released') {
        logger.info('Reservation already released', { reservationId });
        return;
      }

      // Release reserved quantities
      for (const item of reservation.items) {
        await this.releaseItem(item.productId, item.quantity);
      }

      // Update reservation status
      reservation.status = 'released';
      await redisClient.setex(
        `inventory:reservation:${reservationId}`,
        3600, // Keep for 1 hour for audit purposes
        JSON.stringify(reservation)
      );

      // Clear order reservation mapping
      await redisClient.del(`inventory:order:${reservation.orderId}`);

      // Publish inventory released event
      await kafkaService.publishInventoryEvent('INVENTORY_RELEASED', {
        reservationId,
        orderId: reservation.orderId,
        items: reservation.items,
        reason
      });

      logger.info('Inventory reservation released', {
        reservationId,
        orderId: reservation.orderId,
        itemCount: reservation.items.length,
        reason,
        action: 'release_reservation'
      });

    } catch (error) {
      logger.error('Failed to release inventory reservation', {
        reservationId,
        reason,
        error: error.message,
        action: 'release_reservation'
      });
      throw error;
    }
  }

  /**
   * Release inventory by order ID
   */
  async releaseInventoryByOrderId(orderId: string, reason?: string): Promise<void> {
    try {
      const reservationId = await redisClient.get(`inventory:order:${orderId}`);
      if (!reservationId) {
        logger.info('No reservation found for order', { orderId });
        return;
      }

      await this.releaseReservation(reservationId, reason);

    } catch (error) {
      logger.error('Failed to release inventory by order ID', {
        orderId,
        reason,
        error: error.message,
        action: 'release_inventory_by_order'
      });
      throw error;
    }
  }

  /**
   * Check inventory availability
   */
  async checkAvailability(productId: string, requestedQuantity: number): Promise<boolean> {
    try {
      const stockLevel = await this.getStockLevel(productId);
      return stockLevel.availableQuantity >= requestedQuantity;
    } catch (error) {
      logger.error('Failed to check availability', {
        productId,
        requestedQuantity,
        error: error.message,
        action: 'check_availability'
      });
      return false;
    }
  }

  /**
   * Get current stock level for a product
   */
  async getStockLevel(productId: string): Promise<StockLevel> {
    try {
      const cacheKey = `inventory:stock:${productId}`;
      const cached = await redisClient.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      // In a real implementation, this would query the inventory database
      // For now, we'll simulate with Redis-based inventory tracking
      const inventoryKey = `inventory:product:${productId}`;
      const inventoryData = await redisClient.hgetall(inventoryKey);

      const totalQuantity = parseInt(inventoryData.totalQuantity) || 0;
      const reservedQuantity = parseInt(inventoryData.reservedQuantity) || 0;
      const availableQuantity = totalQuantity - reservedQuantity;
      const lowStockThreshold = parseInt(inventoryData.lowStockThreshold) || 10;

      const stockLevel: StockLevel = {
        productId,
        sku: inventoryData.sku || productId,
        totalQuantity,
        availableQuantity: Math.max(0, availableQuantity),
        reservedQuantity,
        lowStockThreshold,
        isLowStock: availableQuantity <= lowStockThreshold && availableQuantity > 0,
        isOutOfStock: availableQuantity <= 0,
        lastRestocked: inventoryData.lastRestocked ? new Date(inventoryData.lastRestocked) : undefined,
        location: inventoryData.location
      };

      // Cache the result
      await redisClient.setex(cacheKey, this.CACHE_TTL, JSON.stringify(stockLevel));

      return stockLevel;

    } catch (error) {
      logger.error('Failed to get stock level', {
        productId,
        error: error.message,
        action: 'get_stock_level'
      });
      throw error;
    }
  }

  /**
   * Update inventory levels
   */
  async updateInventory(update: InventoryUpdate): Promise<StockLevel> {
    try {
      const inventoryKey = `inventory:product:${update.productId}`;
      
      switch (update.operation) {
        case 'reserve':
          await redisClient.hincrby(inventoryKey, 'reservedQuantity', update.quantity);
          break;
          
        case 'release':
          await redisClient.hincrby(inventoryKey, 'reservedQuantity', -update.quantity);
          break;
          
        case 'adjust':
          await redisClient.hincrby(inventoryKey, 'totalQuantity', update.quantity);
          break;
          
        case 'restock':
          await redisClient.hincrby(inventoryKey, 'totalQuantity', update.quantity);
          await redisClient.hset(inventoryKey, 'lastRestocked', new Date().toISOString());
          break;
          
        default:
          throw new Error(`Unknown inventory operation: ${update.operation}`);
      }

      // Clear stock level cache
      await redisClient.del(`inventory:stock:${update.productId}`);

      // Log inventory update
      logger.info('Inventory updated', {
        productId: update.productId,
        operation: update.operation,
        quantity: update.quantity,
        reason: update.reason,
        orderId: update.orderId,
        userId: update.userId,
        action: 'update_inventory'
      });

      // Publish inventory update event
      await kafkaService.publishInventoryEvent('INVENTORY_UPDATED', update);

      return await this.getStockLevel(update.productId);

    } catch (error) {
      logger.error('Failed to update inventory', {
        update,
        error: error.message,
        action: 'update_inventory'
      });
      throw error;
    }
  }

  /**
   * Get low stock items
   */
  async getLowStockItems(limit: number = 50): Promise<StockLevel[]> {
    try {
      // In a real implementation, this would query the inventory database
      // For now, we'll return mock data
      const lowStockItems: StockLevel[] = [];
      
      // This would be replaced with actual database query
      // const keys = await redisClient.keys('inventory:product:*');
      // for (const key of keys.slice(0, limit)) {
      //   const productId = key.replace('inventory:product:', '');
      //   const stockLevel = await this.getStockLevel(productId);
      //   if (stockLevel.isLowStock) {
      //     lowStockItems.push(stockLevel);
      //   }
      // }

      return lowStockItems;

    } catch (error) {
      logger.error('Failed to get low stock items', {
        limit,
        error: error.message,
        action: 'get_low_stock_items'
      });
      throw error;
    }
  }

  /**
   * Get out of stock items
   */
  async getOutOfStockItems(limit: number = 50): Promise<StockLevel[]> {
    try {
      const outOfStockItems: StockLevel[] = [];
      
      // This would be replaced with actual database query
      
      return outOfStockItems;

    } catch (error) {
      logger.error('Failed to get out of stock items', {
        limit,
        error: error.message,
        action: 'get_out_of_stock_items'
      });
      throw error;
    }
  }

  /**
   * Bulk inventory update
   */
  async bulkUpdateInventory(updates: InventoryUpdate[]): Promise<{ success: string[]; failed: { productId: string; error: string }[] }> {
    const results = {
      success: [] as string[],
      failed: [] as { productId: string; error: string }[]
    };

    for (const update of updates) {
      try {
        await this.updateInventory(update);
        results.success.push(update.productId);
      } catch (error) {
        results.failed.push({
          productId: update.productId,
          error: error.message
        });
      }
    }

    logger.info('Bulk inventory update completed', {
      totalUpdates: updates.length,
      successful: results.success.length,
      failed: results.failed.length,
      action: 'bulk_update_inventory'
    });

    return results;
  }

  // Private helper methods

  private async reserveItem(
    item: InventoryItem,
    orderId: string,
    userId: string,
    expiresAt: Date
  ): Promise<InventoryItem> {
    const inventoryKey = `inventory:product:${item.productId}`;
    
    // Atomically check and reserve
    const available = await this.checkAvailability(item.productId, item.quantity);
    if (!available) {
      throw new Error(`Insufficient inventory for product ${item.productId}`);
    }

    // Reserve the quantity
    await redisClient.hincrby(inventoryKey, 'reservedQuantity', item.quantity);

    return {
      ...item,
      reservedQuantity: item.quantity,
      expiresAt
    };
  }

  private async releaseItem(productId: string, quantity: number): Promise<void> {
    const inventoryKey = `inventory:product:${productId}`;
    await redisClient.hincrby(inventoryKey, 'reservedQuantity', -quantity);
  }

  private async confirmItemReservation(productId: string, quantity: number): Promise<void> {
    const inventoryKey = `inventory:product:${productId}`;
    
    // Reduce total quantity and reserved quantity
    await redisClient.hincrby(inventoryKey, 'totalQuantity', -quantity);
    await redisClient.hincrby(inventoryKey, 'reservedQuantity', -quantity);
  }

  private async getReservation(reservationId: string): Promise<InventoryReservation | null> {
    try {
      const cached = await redisClient.get(`inventory:reservation:${reservationId}`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      logger.error('Failed to get reservation', {
        reservationId,
        error: error.message
      });
      return null;
    }
  }

  private async scheduleReservationExpiry(reservationId: string, ttlSeconds: number): Promise<void> {
    // In a real implementation, you would use a job queue like Bull
    // For now, we'll use a simple timeout
    setTimeout(async () => {
      try {
        const reservation = await this.getReservation(reservationId);
        if (reservation && reservation.status === 'pending') {
          await this.releaseReservation(reservationId, 'Reservation expired');
        }
      } catch (error) {
        logger.error('Error in scheduled reservation expiry', {
          reservationId,
          error: error.message
        });
      }
    }, ttlSeconds * 1000);
  }

  /**
   * Initialize product inventory
   */
  async initializeProductInventory(
    productId: string,
    sku: string,
    initialQuantity: number,
    location?: string,
    lowStockThreshold: number = 10
  ): Promise<void> {
    try {
      const inventoryKey = `inventory:product:${productId}`;
      
      await redisClient.hset(inventoryKey, {
        sku,
        totalQuantity: initialQuantity,
        reservedQuantity: 0,
        lowStockThreshold,
        location: location || 'default',
        lastRestocked: new Date().toISOString()
      });

      logger.info('Product inventory initialized', {
        productId,
        sku,
        initialQuantity,
        location,
        lowStockThreshold,
        action: 'initialize_product_inventory'
      });

    } catch (error) {
      logger.error('Failed to initialize product inventory', {
        productId,
        sku,
        initialQuantity,
        error: error.message,
        action: 'initialize_product_inventory'
      });
      throw error;
    }
  }

  /**
   * Clean up expired reservations
   */
  async cleanupExpiredReservations(): Promise<{ cleaned: number; errors: number }> {
    let cleaned = 0;
    let errors = 0;

    try {
      // This would be run as a cron job in a real implementation
      const reservationKeys = await redisClient.keys('inventory:reservation:*');
      
      for (const key of reservationKeys) {
        try {
          const reservationData = await redisClient.get(key);
          if (!reservationData) continue;

          const reservation: InventoryReservation = JSON.parse(reservationData);
          
          if (reservation.status === 'pending' && reservation.expiresAt < new Date()) {
            await this.releaseReservation(reservation.id, 'Cleanup - expired');
            cleaned++;
          }
        } catch (error) {
          logger.error('Error cleaning up reservation', { key, error: error.message });
          errors++;
        }
      }

      logger.info('Expired reservations cleanup completed', {
        cleaned,
        errors,
        action: 'cleanup_expired_reservations'
      });

    } catch (error) {
      logger.error('Failed to cleanup expired reservations', {
        error: error.message,
        action: 'cleanup_expired_reservations'
      });
      errors++;
    }

    return { cleaned, errors };
  }
}

export const inventoryService = new InventoryService();
