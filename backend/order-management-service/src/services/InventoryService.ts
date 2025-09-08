import { createClient, RedisClientType } from 'redis';
import { IOrderItem, IInventoryReservation, IOrder } from '../types/order.types';

// Inventory interfaces
interface IInventoryItem {
  productId: string;
  variantId?: string;
  sku: string;
  quantityAvailable: number;
  quantityReserved: number;
  quantityOnOrder: number;
  reorderPoint: number;
  maxStock: number;
  location: string;
  lastUpdated: Date;
}

interface IInventoryUpdate {
  productId: string;
  variantId?: string;
  quantity: number;
  operation: 'add' | 'subtract' | 'set' | 'reserve' | 'release';
  reason: string;
  orderId?: string;
  userId?: string;
  timestamp: Date;
}

interface IStockCheck {
  productId: string;
  variantId?: string;
  available: number;
  reserved: number;
  onOrder: number;
  inStock: boolean;
  lowStock: boolean;
  canBackorder: boolean;
}

interface IReservationRequest {
  orderId: string;
  customerId: string;
  items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
  }>;
  expiresIn?: number; // minutes, default 30
}

interface IReservationResponse {
  success: boolean;
  reservationId?: string;
  expiresAt?: Date;
  partialReservation?: boolean;
  unavailableItems?: Array<{
    productId: string;
    variantId?: string;
    requested: number;
    available: number;
  }>;
  error?: string;
}

interface IInventoryConfig {
  reservationTimeout: number; // minutes
  lowStockThreshold: number; // percentage
  allowBackorders: boolean;
  autoReorderEnabled: boolean;
  warehouseLocations: string[];
  redisKeyPrefix: string;
  catalogServiceUrl: string;
}

class InventoryService {
  private redisClient: RedisClientType;
  private config: IInventoryConfig;
  private reservationCleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Initialize Redis client for inventory caching and reservations
    this.redisClient = createClient({
      url: process.env.REDIS_URI || 'redis://localhost:6379'
    });

    this.redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    this.config = {
      reservationTimeout: parseInt(process.env.INVENTORY_RESERVATION_TIMEOUT || '30'),
      lowStockThreshold: parseInt(process.env.INVENTORY_LOW_STOCK_THRESHOLD || '20'),
      allowBackorders: process.env.INVENTORY_ALLOW_BACKORDERS === 'true',
      autoReorderEnabled: process.env.INVENTORY_AUTO_REORDER === 'true',
      warehouseLocations: (process.env.WAREHOUSE_LOCATIONS || 'MAIN,WEST,EAST').split(','),
      redisKeyPrefix: 'inventory:',
      catalogServiceUrl: process.env.CATALOG_SERVICE_URL || 'http://localhost:3001'
    };

    this.startReservationCleanup();
  }

  async connect(): Promise<void> {
    if (!this.redisClient.isReady) {
      await this.redisClient.connect();
    }
  }

  async disconnect(): Promise<void> {
    if (this.reservationCleanupInterval) {
      clearInterval(this.reservationCleanupInterval);
    }
    if (this.redisClient.isReady) {
      await this.redisClient.disconnect();
    }
  }

  // ==================== STOCK CHECKING ====================

  /**
   * Check stock availability for a single product
   */
  async checkStock(productId: string, variantId?: string, location?: string): Promise<IStockCheck> {
    try {
      const key = this.getInventoryKey(productId, variantId, location);
      
      // Try to get from cache first
      const cachedInventory = await this.redisClient.hGetAll(key);
      
      let inventory: IInventoryItem;
      
      if (Object.keys(cachedInventory).length > 0) {
        inventory = {
          productId,
          variantId,
          sku: cachedInventory.sku || '',
          quantityAvailable: parseInt(cachedInventory.quantityAvailable || '0'),
          quantityReserved: parseInt(cachedInventory.quantityReserved || '0'),
          quantityOnOrder: parseInt(cachedInventory.quantityOnOrder || '0'),
          reorderPoint: parseInt(cachedInventory.reorderPoint || '10'),
          maxStock: parseInt(cachedInventory.maxStock || '100'),
          location: cachedInventory.location || 'MAIN',
          lastUpdated: new Date(cachedInventory.lastUpdated || Date.now())
        };
      } else {
        // Fetch from catalog service if not in cache
        inventory = await this.fetchInventoryFromCatalog(productId, variantId, location);
        
        // Cache the result
        await this.cacheInventory(inventory);
      }

      const lowStockThreshold = Math.max(1, Math.floor(inventory.maxStock * this.config.lowStockThreshold / 100));

      return {
        productId,
        variantId,
        available: inventory.quantityAvailable,
        reserved: inventory.quantityReserved,
        onOrder: inventory.quantityOnOrder,
        inStock: inventory.quantityAvailable > 0,
        lowStock: inventory.quantityAvailable <= lowStockThreshold,
        canBackorder: this.config.allowBackorders && inventory.quantityOnOrder > 0
      };

    } catch (error) {
      console.error('Error checking stock:', error);
      
      // Return safe defaults on error
      return {
        productId,
        variantId,
        available: 0,
        reserved: 0,
        onOrder: 0,
        inStock: false,
        lowStock: true,
        canBackorder: false
      };
    }
  }

  /**
   * Check stock for multiple items
   */
  async checkMultipleStock(items: Array<{ productId: string; variantId?: string; quantity: number }>): Promise<{
    allInStock: boolean;
    stockChecks: IStockCheck[];
    unavailableItems: Array<{
      productId: string;
      variantId?: string;
      requested: number;
      available: number;
    }>;
  }> {
    try {
      const stockChecks = await Promise.all(
        items.map(item => this.checkStock(item.productId, item.variantId))
      );

      const unavailableItems = items
        .map((item, index) => ({
          ...item,
          stockCheck: stockChecks[index]
        }))
        .filter(({ quantity, stockCheck }) => 
          stockCheck.available < quantity && !stockCheck.canBackorder
        )
        .map(({ productId, variantId, quantity, stockCheck }) => ({
          productId,
          variantId,
          requested: quantity,
          available: stockCheck.available
        }));

      return {
        allInStock: unavailableItems.length === 0,
        stockChecks,
        unavailableItems
      };

    } catch (error) {
      console.error('Error checking multiple stock:', error);
      return {
        allInStock: false,
        stockChecks: [],
        unavailableItems: items.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          requested: item.quantity,
          available: 0
        }))
      };
    }
  }

  // ==================== INVENTORY RESERVATIONS ====================

  /**
   * Reserve inventory for an order
   */
  async reserveInventory(request: IReservationRequest): Promise<IReservationResponse> {
    try {
      // Check availability first
      const stockCheck = await this.checkMultipleStock(request.items);
      
      if (!stockCheck.allInStock && !this.config.allowBackorders) {
        return {
          success: false,
          error: 'Insufficient inventory',
          unavailableItems: stockCheck.unavailableItems
        };
      }

      const reservationId = `reservation:${request.orderId}:${Date.now()}`;
      const expiresIn = request.expiresIn || this.config.reservationTimeout;
      const expiresAt = new Date(Date.now() + expiresIn * 60 * 1000);

      // Create reservation record
      const reservation: IInventoryReservation = {
        orderId: request.orderId,
        items: request.items.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          reservedAt: new Date(),
          expiresAt
        }))
      };

      // Reserve items
      const reservationPromises = request.items.map(item =>
        this.reserveItem(item.productId, item.quantity, reservationId, expiresAt, item.variantId)
      );

      const reservationResults = await Promise.allSettled(reservationPromises);
      
      // Check if any reservations failed
      const failedReservations = reservationResults.filter(result => result.status === 'rejected');
      
      if (failedReservations.length > 0) {
        // Rollback successful reservations
        const successfulIndexes = reservationResults
          .map((result, index) => result.status === 'fulfilled' ? index : -1)
          .filter(index => index !== -1);

        await Promise.all(
          successfulIndexes.map(index => {
            const item = request.items[index];
            return this.releaseReservation(item.productId, item.quantity, reservationId, item.variantId);
          })
        );

        return {
          success: false,
          error: 'Failed to reserve inventory',
          unavailableItems: stockCheck.unavailableItems
        };
      }

      // Store reservation in Redis with expiration
      await this.redisClient.setEx(
        `${this.config.redisKeyPrefix}reservation:${reservationId}`,
        expiresIn * 60,
        JSON.stringify(reservation)
      );

      // Track reservation by order ID
      await this.redisClient.setEx(
        `${this.config.redisKeyPrefix}order:${request.orderId}:reservation`,
        expiresIn * 60,
        reservationId
      );

      return {
        success: true,
        reservationId,
        expiresAt,
        partialReservation: stockCheck.unavailableItems.length > 0
      };

    } catch (error) {
      console.error('Error reserving inventory:', error);
      return {
        success: false,
        error: 'Inventory reservation failed'
      };
    }
  }

  /**
   * Release inventory reservation
   */
  async releaseReservation(
    productId: string, 
    quantity: number, 
    reservationId: string, 
    variantId?: string
  ): Promise<boolean> {
    try {
      const key = this.getInventoryKey(productId, variantId);
      
      // Use Lua script to atomically update inventory
      const luaScript = `
        local key = KEYS[1]
        local quantity = tonumber(ARGV[1])
        local reserved = redis.call('HGET', key, 'quantityReserved')
        
        if reserved then
          local newReserved = math.max(0, reserved - quantity)
          local newAvailable = redis.call('HGET', key, 'quantityAvailable') + quantity
          
          redis.call('HSET', key, 'quantityReserved', newReserved)
          redis.call('HSET', key, 'quantityAvailable', newAvailable)
          redis.call('HSET', key, 'lastUpdated', ARGV[2])
          
          return 1
        end
        
        return 0
      `;

      const result = await this.redisClient.eval(luaScript, {
        keys: [key],
        arguments: [quantity.toString(), new Date().toISOString()]
      });

      // Log the inventory update
      await this.logInventoryUpdate({
        productId,
        variantId,
        quantity,
        operation: 'release',
        reason: `Reservation ${reservationId} released`,
        timestamp: new Date()
      });

      return result === 1;

    } catch (error) {
      console.error('Error releasing reservation:', error);
      return false;
    }
  }

  /**
   * Confirm inventory reservation (convert to actual reduction)
   */
  async confirmReservation(orderId: string): Promise<boolean> {
    try {
      // Get reservation by order ID
      const reservationId = await this.redisClient.get(
        `${this.config.redisKeyPrefix}order:${orderId}:reservation`
      );

      if (!reservationId) {
        console.error('No reservation found for order:', orderId);
        return false;
      }

      const reservationData = await this.redisClient.get(
        `${this.config.redisKeyPrefix}reservation:${reservationId}`
      );

      if (!reservationData) {
        console.error('Reservation data not found:', reservationId);
        return false;
      }

      const reservation: IInventoryReservation = JSON.parse(reservationData);

      // Convert reservations to actual inventory reductions
      const confirmPromises = reservation.items.map(item =>
        this.confirmItemReservation(
          item.productId,
          item.quantity,
          orderId,
          item.variantId
        )
      );

      const results = await Promise.allSettled(confirmPromises);
      const allConfirmed = results.every(result => result.status === 'fulfilled' && result.value);

      if (allConfirmed) {
        // Clean up reservation records
        await this.redisClient.del(`${this.config.redisKeyPrefix}reservation:${reservationId}`);
        await this.redisClient.del(`${this.config.redisKeyPrefix}order:${orderId}:reservation`);
      }

      return allConfirmed;

    } catch (error) {
      console.error('Error confirming reservation:', error);
      return false;
    }
  }

  /**
   * Cancel inventory reservation
   */
  async cancelReservation(orderId: string): Promise<boolean> {
    try {
      // Get reservation by order ID
      const reservationId = await this.redisClient.get(
        `${this.config.redisKeyPrefix}order:${orderId}:reservation`
      );

      if (!reservationId) {
        return true; // No reservation to cancel
      }

      const reservationData = await this.redisClient.get(
        `${this.config.redisKeyPrefix}reservation:${reservationId}`
      );

      if (!reservationData) {
        return true; // Reservation already expired
      }

      const reservation: IInventoryReservation = JSON.parse(reservationData);

      // Release all reserved items
      const releasePromises = reservation.items.map(item =>
        this.releaseReservation(
          item.productId,
          item.quantity,
          reservationId,
          item.variantId
        )
      );

      await Promise.all(releasePromises);

      // Clean up reservation records
      await this.redisClient.del(`${this.config.redisKeyPrefix}reservation:${reservationId}`);
      await this.redisClient.del(`${this.config.redisKeyPrefix}order:${orderId}:reservation`);

      return true;

    } catch (error) {
      console.error('Error cancelling reservation:', error);
      return false;
    }
  }

  // ==================== INVENTORY UPDATES ====================

  /**
   * Update inventory levels
   */
  async updateInventory(
    productId: string,
    quantity: number,
    operation: 'add' | 'subtract' | 'set',
    reason: string,
    variantId?: string,
    userId?: string
  ): Promise<boolean> {
    try {
      const key = this.getInventoryKey(productId, variantId);

      // Use Lua script for atomic updates
      let luaScript = '';
      
      switch (operation) {
        case 'add':
          luaScript = `
            local key = KEYS[1]
            local quantity = tonumber(ARGV[1])
            local available = tonumber(redis.call('HGET', key, 'quantityAvailable') or 0)
            
            redis.call('HSET', key, 'quantityAvailable', available + quantity)
            redis.call('HSET', key, 'lastUpdated', ARGV[2])
            
            return available + quantity
          `;
          break;
          
        case 'subtract':
          luaScript = `
            local key = KEYS[1]
            local quantity = tonumber(ARGV[1])
            local available = tonumber(redis.call('HGET', key, 'quantityAvailable') or 0)
            local newAvailable = math.max(0, available - quantity)
            
            redis.call('HSET', key, 'quantityAvailable', newAvailable)
            redis.call('HSET', key, 'lastUpdated', ARGV[2])
            
            return newAvailable
          `;
          break;
          
        case 'set':
          luaScript = `
            local key = KEYS[1]
            local quantity = tonumber(ARGV[1])
            
            redis.call('HSET', key, 'quantityAvailable', quantity)
            redis.call('HSET', key, 'lastUpdated', ARGV[2])
            
            return quantity
          `;
          break;
      }

      await this.redisClient.eval(luaScript, {
        keys: [key],
        arguments: [quantity.toString(), new Date().toISOString()]
      });

      // Log the inventory update
      await this.logInventoryUpdate({
        productId,
        variantId,
        quantity,
        operation,
        reason,
        userId,
        timestamp: new Date()
      });

      // Check for low stock and trigger reorder if needed
      const stockCheck = await this.checkStock(productId, variantId);
      if (stockCheck.lowStock && this.config.autoReorderEnabled) {
        await this.triggerReorder(productId, variantId);
      }

      return true;

    } catch (error) {
      console.error('Error updating inventory:', error);
      return false;
    }
  }

  // ==================== PRIVATE METHODS ====================

  /**
   * Reserve a single item
   */
  private async reserveItem(
    productId: string,
    quantity: number,
    reservationId: string,
    expiresAt: Date,
    variantId?: string
  ): Promise<boolean> {
    const key = this.getInventoryKey(productId, variantId);
    
    // Use Lua script to atomically check and reserve
    const luaScript = `
      local key = KEYS[1]
      local quantity = tonumber(ARGV[1])
      local available = tonumber(redis.call('HGET', key, 'quantityAvailable') or 0)
      local reserved = tonumber(redis.call('HGET', key, 'quantityReserved') or 0)
      
      if available >= quantity then
        redis.call('HSET', key, 'quantityAvailable', available - quantity)
        redis.call('HSET', key, 'quantityReserved', reserved + quantity)
        redis.call('HSET', key, 'lastUpdated', ARGV[2])
        return 1
      end
      
      return 0
    `;

    const result = await this.redisClient.eval(luaScript, {
      keys: [key],
      arguments: [quantity.toString(), new Date().toISOString()]
    });

    if (result === 1) {
      // Log the reservation
      await this.logInventoryUpdate({
        productId,
        variantId,
        quantity,
        operation: 'reserve',
        reason: `Reservation ${reservationId}`,
        timestamp: new Date()
      });

      return true;
    }

    return false;
  }

  /**
   * Confirm a single item reservation
   */
  private async confirmItemReservation(
    productId: string,
    quantity: number,
    orderId: string,
    variantId?: string
  ): Promise<boolean> {
    const key = this.getInventoryKey(productId, variantId);
    
    // Use Lua script to move from reserved to confirmed reduction
    const luaScript = `
      local key = KEYS[1]
      local quantity = tonumber(ARGV[1])
      local reserved = tonumber(redis.call('HGET', key, 'quantityReserved') or 0)
      
      if reserved >= quantity then
        redis.call('HSET', key, 'quantityReserved', reserved - quantity)
        redis.call('HSET', key, 'lastUpdated', ARGV[2])
        return 1
      end
      
      return 0
    `;

    const result = await this.redisClient.eval(luaScript, {
      keys: [key],
      arguments: [quantity.toString(), new Date().toISOString()]
    });

    if (result === 1) {
      // Log the confirmation
      await this.logInventoryUpdate({
        productId,
        variantId,
        quantity,
        operation: 'subtract',
        reason: `Order ${orderId} confirmed`,
        orderId,
        timestamp: new Date()
      });

      return true;
    }

    return false;
  }

  /**
   * Fetch inventory from catalog service
   */
  private async fetchInventoryFromCatalog(
    productId: string,
    variantId?: string,
    location?: string
  ): Promise<IInventoryItem> {
    try {
      // Mock implementation - in production this would call the actual catalog service
      const mockInventory: IInventoryItem = {
        productId,
        variantId,
        sku: `SKU-${productId}${variantId ? `-${variantId}` : ''}`,
        quantityAvailable: Math.floor(Math.random() * 100) + 10,
        quantityReserved: Math.floor(Math.random() * 5),
        quantityOnOrder: Math.floor(Math.random() * 20),
        reorderPoint: 10,
        maxStock: 200,
        location: location || this.config.warehouseLocations[0],
        lastUpdated: new Date()
      };

      return mockInventory;

    } catch (error) {
      console.error('Error fetching inventory from catalog:', error);
      
      // Return safe defaults
      return {
        productId,
        variantId,
        sku: 'UNKNOWN',
        quantityAvailable: 0,
        quantityReserved: 0,
        quantityOnOrder: 0,
        reorderPoint: 10,
        maxStock: 100,
        location: 'MAIN',
        lastUpdated: new Date()
      };
    }
  }

  /**
   * Cache inventory in Redis
   */
  private async cacheInventory(inventory: IInventoryItem): Promise<void> {
    const key = this.getInventoryKey(inventory.productId, inventory.variantId, inventory.location);
    
    await this.redisClient.hSet(key, {
      sku: inventory.sku,
      quantityAvailable: inventory.quantityAvailable.toString(),
      quantityReserved: inventory.quantityReserved.toString(),
      quantityOnOrder: inventory.quantityOnOrder.toString(),
      reorderPoint: inventory.reorderPoint.toString(),
      maxStock: inventory.maxStock.toString(),
      location: inventory.location,
      lastUpdated: inventory.lastUpdated.toISOString()
    });

    // Set TTL for cache entry (1 hour)
    await this.redisClient.expire(key, 3600);
  }

  /**
   * Get inventory cache key
   */
  private getInventoryKey(productId: string, variantId?: string, location?: string): string {
    let key = `${this.config.redisKeyPrefix}${productId}`;
    if (variantId) key += `:${variantId}`;
    if (location) key += `:${location}`;
    return key;
  }

  /**
   * Log inventory update
   */
  private async logInventoryUpdate(update: IInventoryUpdate): Promise<void> {
    try {
      const logKey = `${this.config.redisKeyPrefix}updates:${update.productId}`;
      
      await this.redisClient.lPush(logKey, JSON.stringify(update));
      
      // Keep only last 100 updates
      await this.redisClient.lTrim(logKey, 0, 99);

    } catch (error) {
      console.error('Error logging inventory update:', error);
    }
  }

  /**
   * Trigger reorder for low stock items
   */
  private async triggerReorder(productId: string, variantId?: string): Promise<void> {
    try {
      // Mock implementation - in production this would integrate with procurement systems
      console.log(`Triggering reorder for ${productId}${variantId ? `:${variantId}` : ''}`);
      
      // Add to reorder queue
      const reorderKey = `${this.config.redisKeyPrefix}reorder:queue`;
      await this.redisClient.sAdd(reorderKey, `${productId}${variantId ? `:${variantId}` : ''}`);

    } catch (error) {
      console.error('Error triggering reorder:', error);
    }
  }

  /**
   * Start reservation cleanup process
   */
  private startReservationCleanup(): void {
    // Clean up expired reservations every 5 minutes
    this.reservationCleanupInterval = setInterval(async () => {
      try {
        await this.cleanupExpiredReservations();
      } catch (error) {
        console.error('Error in reservation cleanup:', error);
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Clean up expired reservations
   */
  private async cleanupExpiredReservations(): Promise<void> {
    try {
      const reservationKeys = await this.redisClient.keys(`${this.config.redisKeyPrefix}reservation:*`);
      
      for (const key of reservationKeys) {
        const ttl = await this.redisClient.ttl(key);
        
        // If key has expired or will expire soon (within 1 minute)
        if (ttl <= 60) {
          const reservationData = await this.redisClient.get(key);
          if (reservationData) {
            const reservation: IInventoryReservation = JSON.parse(reservationData);
            
            // Release all reserved items
            const releasePromises = reservation.items.map(item =>
              this.releaseReservation(
                item.productId,
                item.quantity,
                key.split(':').pop() || '',
                item.variantId
              )
            );

            await Promise.all(releasePromises);
            console.log(`Cleaned up expired reservation: ${key}`);
          }
        }
      }

    } catch (error) {
      console.error('Error cleaning up expired reservations:', error);
    }
  }
}

export default InventoryService;
