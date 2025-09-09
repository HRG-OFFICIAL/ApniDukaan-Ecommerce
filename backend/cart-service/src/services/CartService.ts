import { createClient } from 'redis';
import Cart from '../models/Cart';
import {
  ICart,
  ICartItem,
  ICartDiscount,
  IAddToCartRequest,
  ICartResponse,
  ICartSummary,
  ICartValidationResult,
  ICartMergeOptions,
  ICartEvent,
  CartEventType
} from '../types/cart.types';
import { EventEmitter } from 'events';
import { logger } from '@apnidukaan/shared';

// Product service integration (would be replaced with actual service call)
interface IProduct {
  _id: string;
  name: string;
  price: number;
  originalPrice?: number;
  sku: string;
  images: string[];
  inventory: {
    stock: number;
    inStock: boolean;
  };
  weight?: number;
  status: string;
}

class CartService extends EventEmitter {
  private redisClient: any;
  private readonly sessionPrefix = 'cart:session:';
  private readonly userCartPrefix = 'cart:user:';
  private readonly sessionTTL = 24 * 60 * 60; // 24 hours in seconds

  constructor() {
    super();
    this.initializeRedis();
  }

  private async initializeRedis() {
    try {
      this.redisClient = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      });
      
      this.redisClient.on('error', (err: Error) => {
        logger.error('Redis Client Error:', err);
      });

      await this.redisClient.connect();
      logger.info('Connected to Redis for cart session management');
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
    }
  }

  /**
   * Get cart for user or session
   */
  async getCart(userId?: string, sessionId?: string): Promise<ICart | null> {
    try {
      // Try to find persistent cart first
      let cart = await Cart.findActiveCart(userId, sessionId);

      if (!cart && sessionId && !userId) {
        // Try to get from Redis session storage
        const sessionData = await this.getSessionCart(sessionId);
        if (sessionData) {
          // Create a temporary cart object from session data
          cart = new Cart(sessionData);
        }
      }

      if (!cart) {
        // Create new cart
        cart = new Cart({
          userId,
          sessionId,
          items: [],
          totals: {
            subtotal: 0,
            discount: 0,
            tax: 0,
            shipping: 0,
            total: 0
          },
          currency: 'USD',
          status: 'active'
        });

        if (userId) {
          // Save to database for authenticated users
          await cart.save();
        } else if (sessionId) {
          // Save to Redis for guest users
          await this.saveSessionCart(sessionId, cart.toObject());
        }

        this.emitCartEvent('cart:created', cart);
      }

      return cart;
    } catch (error) {
      logger.error('Error getting cart:', error);
      throw new Error('Failed to retrieve cart');
    }
  }

  /**
   * Add item to cart
   */
  async addToCart(
    request: IAddToCartRequest,
    userId?: string,
    sessionId?: string
  ): Promise<ICartResponse> {
    try {
      // Validate product availability
      const product = await this.validateProduct(request.productId, request.quantity);
      
      const cart = await this.getCart(userId, sessionId);
      if (!cart) {
        throw new Error('Failed to create cart');
      }

      // Prepare cart item
      const cartItem: Omit<ICartItem, 'addedAt' | 'updatedAt'> = {
        productId: request.productId,
        variantId: request.variantId,
        quantity: request.quantity,
        price: product.price,
        originalPrice: product.originalPrice || product.price,
        name: product.name,
        image: product.images[0],
        sku: product.sku,
        weight: product.weight,
        attributes: request.attributes
      };

      // Add item to cart
      await cart.addItem(cartItem);

      // Save to appropriate storage
      if (userId) {
        await cart.save();
      } else if (sessionId) {
        await this.saveSessionCart(sessionId, cart.toObject());
      }

      this.emitCartEvent('cart:item_added', cart, {
        productId: request.productId,
        quantity: request.quantity,
        price: product.price
      });

      return {
        cart,
        message: 'Item added to cart successfully'
      };
    } catch (error) {
      logger.error('Error adding to cart:', error);
      throw error;
    }
  }

  /**
   * Update cart item quantity
   */
  async updateCartItem(
    productId: string,
    variantId: string | undefined,
    quantity: number,
    userId?: string,
    sessionId?: string
  ): Promise<ICartResponse> {
    try {
      if (quantity < 0) {
        throw new Error('Quantity cannot be negative');
      }

      if (quantity > 0) {
        // Validate product availability for the new quantity
        await this.validateProduct(productId, quantity);
      }

      const cart = await this.getCart(userId, sessionId);
      if (!cart) {
        throw new Error('Cart not found');
      }

      await cart.updateItem(productId, variantId, quantity);

      // Save to appropriate storage
      if (userId) {
        await cart.save();
      } else if (sessionId) {
        await this.saveSessionCart(sessionId, cart.toObject());
      }

      this.emitCartEvent('cart:item_updated', cart, {
        productId,
        variantId,
        quantity
      });

      return {
        cart,
        message: quantity === 0 ? 'Item removed from cart' : 'Cart updated successfully'
      };
    } catch (error) {
      logger.error('Error updating cart item:', error);
      throw error;
    }
  }

  /**
   * Remove item from cart
   */
  async removeFromCart(
    productId: string,
    variantId: string | undefined,
    userId?: string,
    sessionId?: string
  ): Promise<ICartResponse> {
    try {
      const cart = await this.getCart(userId, sessionId);
      if (!cart) {
        throw new Error('Cart not found');
      }

      await cart.removeItem(productId, variantId);

      // Save to appropriate storage
      if (userId) {
        await cart.save();
      } else if (sessionId) {
        await this.saveSessionCart(sessionId, cart.toObject());
      }

      this.emitCartEvent('cart:item_removed', cart, {
        productId,
        variantId
      });

      return {
        cart,
        message: 'Item removed from cart successfully'
      };
    } catch (error) {
      logger.error('Error removing from cart:', error);
      throw error;
    }
  }

  /**
   * Clear entire cart
   */
  async clearCart(userId?: string, sessionId?: string): Promise<ICartResponse> {
    try {
      const cart = await this.getCart(userId, sessionId);
      if (!cart) {
        throw new Error('Cart not found');
      }

      await cart.clear();

      // Save to appropriate storage
      if (userId) {
        await cart.save();
      } else if (sessionId) {
        await this.saveSessionCart(sessionId, cart.toObject());
      }

      return {
        cart,
        message: 'Cart cleared successfully'
      };
    } catch (error) {
      logger.error('Error clearing cart:', error);
      throw error;
    }
  }

  /**
   * Apply discount to cart
   */
  async applyDiscount(
    discountCode: string,
    userId?: string,
    sessionId?: string
  ): Promise<ICartResponse> {
    try {
      const cart = await this.getCart(userId, sessionId);
      if (!cart) {
        throw new Error('Cart not found');
      }

      // Validate discount code (would integrate with discount service)
      const discount = await this.validateDiscountCode(discountCode, cart);

      await cart.applyDiscount(discount);

      // Save to appropriate storage
      if (userId) {
        await cart.save();
      } else if (sessionId) {
        await this.saveSessionCart(sessionId, cart.toObject());
      }

      this.emitCartEvent('cart:discount_applied', cart, {
        discountCode,
        discountType: discount.type,
        discountValue: discount.value
      });

      return {
        cart,
        message: 'Discount applied successfully'
      };
    } catch (error) {
      logger.error('Error applying discount:', error);
      throw error;
    }
  }

  /**
   * Remove discount from cart
   */
  async removeDiscount(userId?: string, sessionId?: string): Promise<ICartResponse> {
    try {
      const cart = await this.getCart(userId, sessionId);
      if (!cart) {
        throw new Error('Cart not found');
      }

      await cart.removeDiscount();

      // Save to appropriate storage
      if (userId) {
        await cart.save();
      } else if (sessionId) {
        await this.saveSessionCart(sessionId, cart.toObject());
      }

      this.emitCartEvent('cart:discount_removed', cart);

      return {
        cart,
        message: 'Discount removed successfully'
      };
    } catch (error) {
      logger.error('Error removing discount:', error);
      throw error;
    }
  }

  /**
   * Get cart summary
   */
  async getCartSummary(userId?: string, sessionId?: string): Promise<ICartSummary> {
    try {
      const cart = await this.getCart(userId, sessionId);
      if (!cart) {
        return {
          itemCount: 0,
          totalItems: 0,
          subtotal: 0,
          total: 0,
          currency: 'USD',
          hasDiscount: false
        };
      }

      return {
        itemCount: cart.items.length,
        totalItems: cart.items.reduce((sum, item) => sum + item.quantity, 0),
        subtotal: cart.totals.subtotal,
        total: cart.totals.total,
        currency: cart.currency,
        hasDiscount: !!cart.discount,
        discountAmount: cart.totals.discount
      };
    } catch (error) {
      logger.error('Error getting cart summary:', error);
      throw error;
    }
  }

  /**
   * Validate cart items (check availability, prices, etc.)
   */
  async validateCart(userId?: string, sessionId?: string): Promise<ICartValidationResult> {
    try {
      const cart = await this.getCart(userId, sessionId);
      if (!cart) {
        return { isValid: true, errors: [] };
      }

      const errors: Array<{
        itemId: string;
        productId: string;
        error: string;
        code: string;
      }> = [];

      let hasChanges = false;

      // Validate each item
      for (let i = cart.items.length - 1; i >= 0; i--) {
        const item = cart.items[i];
        
        try {
          const product = await this.validateProduct(item.productId, item.quantity);
          
          // Check if price has changed
          if (product.price !== item.price) {
            item.price = product.price;
            hasChanges = true;
            
            errors.push({
              itemId: `${item.productId}-${item.variantId || 'default'}`,
              productId: item.productId,
              error: 'Product price has changed',
              code: 'PRICE_CHANGED'
            });
          }

        } catch (error) {
          // Product not available or other error
          cart.items.splice(i, 1);
          hasChanges = true;
          
          errors.push({
            itemId: `${item.productId}-${item.variantId || 'default'}`,
            productId: item.productId,
            error: error.message || 'Product not available',
            code: 'PRODUCT_UNAVAILABLE'
          });
        }
      }

      let updatedCart = cart;
      if (hasChanges) {
        // Save changes
        if (userId) {
          updatedCart = await cart.save();
        } else if (sessionId) {
          await this.saveSessionCart(sessionId, cart.toObject());
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        updatedCart: hasChanges ? updatedCart : undefined
      };
    } catch (error) {
      logger.error('Error validating cart:', error);
      throw error;
    }
  }

  /**
   * Merge guest cart with user cart upon authentication
   */
  async mergeCarts(
    userId: string,
    sessionId: string,
    options: ICartMergeOptions = {
      strategy: 'combine_quantities',
      keepGuestCart: false
    }
  ): Promise<ICartResponse> {
    try {
      // Get both carts
      const userCart = await Cart.findActiveCart(userId);
      const guestCartData = await this.getSessionCart(sessionId);

      if (!guestCartData || !guestCartData.items || guestCartData.items.length === 0) {
        // No guest cart to merge, return user cart or create one
        const cart = userCart || await this.getCart(userId);
        return {
          cart: cart!,
          message: 'No guest cart to merge'
        };
      }

      let finalCart: ICart;

      if (!userCart) {
        // Convert guest cart to user cart
        finalCart = new Cart({
          ...guestCartData,
          userId,
          sessionId: undefined
        });
        await finalCart.save();
      } else {
        // Merge carts based on strategy
        switch (options.strategy) {
          case 'user_priority':
            // Keep user cart, ignore guest cart
            finalCart = userCart;
            break;
            
          case 'guest_priority':
            // Replace user cart with guest cart
            userCart.items = guestCartData.items;
            if (guestCartData.discount) {
              userCart.discount = guestCartData.discount;
            }
            finalCart = await userCart.save();
            break;
            
          case 'combine_quantities':
          default:
            // Merge items, combining quantities for same products
            for (const guestItem of guestCartData.items) {
              const existingItemIndex = userCart.items.findIndex(
                item => item.productId === guestItem.productId && 
                        item.variantId === guestItem.variantId
              );

              if (existingItemIndex >= 0) {
                // Combine quantities
                userCart.items[existingItemIndex].quantity += guestItem.quantity;
                userCart.items[existingItemIndex].updatedAt = new Date();
              } else {
                // Add new item
                userCart.items.push(guestItem);
              }
            }

            // Apply guest cart discount if user cart doesn't have one
            if (!userCart.discount && guestCartData.discount) {
              userCart.discount = guestCartData.discount;
            }

            finalCart = await userCart.save();
            break;
        }
      }

      // Clean up guest cart unless keeping it
      if (!options.keepGuestCart) {
        await this.clearSessionCart(sessionId);
      }

      this.emitCartEvent('cart:merged', finalCart, {
        strategy: options.strategy,
        guestItemCount: guestCartData.items?.length || 0
      });

      return {
        cart: finalCart,
        message: 'Carts merged successfully'
      };
    } catch (error) {
      logger.error('Error merging carts:', error);
      throw error;
    }
  }

  /**
   * Mark cart as abandoned
   */
  async markCartAbandoned(cartId: string): Promise<void> {
    try {
      await Cart.findByIdAndUpdate(cartId, {
        status: 'abandoned',
        updatedAt: new Date()
      });

      this.emitCartEvent('cart:abandoned', { _id: cartId } as ICart);
    } catch (error) {
      logger.error('Error marking cart as abandoned:', error);
    }
  }

  /**
   * Mark cart as converted (order placed)
   */
  async markCartConverted(cartId: string): Promise<void> {
    try {
      await Cart.findByIdAndUpdate(cartId, {
        status: 'converted',
        updatedAt: new Date()
      });

      this.emitCartEvent('cart:converted', { _id: cartId } as ICart);
    } catch (error) {
      logger.error('Error marking cart as converted:', error);
    }
  }

  /**
   * Get abandoned carts for recovery campaigns
   */
  async getAbandonedCarts(hoursAgo: number = 24): Promise<ICart[]> {
    try {
      return await Cart.findAbandonedCarts(hoursAgo);
    } catch (error) {
      logger.error('Error getting abandoned carts:', error);
      return [];
    }
  }

  /**
   * Clean up expired carts
   */
  async cleanupExpiredCarts(): Promise<number> {
    try {
      const result = await Cart.cleanupExpiredCarts();
      logger.info(`Cleaned up ${result.deletedCount} expired carts`);
      return result.deletedCount || 0;
    } catch (error) {
      logger.error('Error cleaning up expired carts:', error);
      return 0;
    }
  }

  // Private helper methods

  private async getSessionCart(sessionId: string): Promise<any> {
    if (!this.redisClient) return null;
    
    try {
      const data = await this.redisClient.get(`${this.sessionPrefix}${sessionId}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Error getting session cart:', error);
      return null;
    }
  }

  private async saveSessionCart(sessionId: string, cartData: any): Promise<void> {
    if (!this.redisClient) return;
    
    try {
      await this.redisClient.setEx(
        `${this.sessionPrefix}${sessionId}`,
        this.sessionTTL,
        JSON.stringify(cartData)
      );
    } catch (error) {
      logger.error('Error saving session cart:', error);
    }
  }

  private async clearSessionCart(sessionId: string): Promise<void> {
    if (!this.redisClient) return;
    
    try {
      await this.redisClient.del(`${this.sessionPrefix}${sessionId}`);
    } catch (error) {
      logger.error('Error clearing session cart:', error);
    }
  }

  private async validateProduct(productId: string, quantity: number): Promise<IProduct> {
    // This would be replaced with actual product service call
    // For now, return mock data
    
    // Mock validation - in real implementation, this would call the catalog service
    const mockProduct: IProduct = {
      _id: productId,
      name: 'Sample Product',
      price: 19.99,
      originalPrice: 24.99,
      sku: 'SKU123',
      images: ['image1.jpg'],
      inventory: {
        stock: 100,
        inStock: true
      },
      weight: 0.5,
      status: 'active'
    };

    if (!mockProduct.inventory.inStock || mockProduct.inventory.stock < quantity) {
      throw new Error('Product is out of stock or insufficient quantity available');
    }

    if (mockProduct.status !== 'active') {
      throw new Error('Product is not available');
    }

    return mockProduct;
  }

  private async validateDiscountCode(code: string, cart: ICart): Promise<ICartDiscount> {
    // This would be replaced with actual discount service call
    // For now, return mock discount
    
    const mockDiscount: ICartDiscount = {
      code: code.toUpperCase(),
      type: 'percentage',
      value: 10,
      description: '10% off',
      appliedAt: new Date(),
      minimumAmount: 25
    };

    // Basic validation
    if (cart.totals.subtotal < (mockDiscount.minimumAmount || 0)) {
      throw new Error(`Minimum order amount of $${mockDiscount.minimumAmount} required`);
    }

    return mockDiscount;
  }

  private emitCartEvent(type: CartEventType, cart: ICart, data?: any): void {
    const event: ICartEvent = {
      type,
      cartId: cart._id,
      userId: cart.userId,
      sessionId: cart.sessionId,
      data: data || {},
      timestamp: new Date()
    };

    this.emit('cart:event', event);
    this.emit(type, event);

    // Log the event
    logger.info('Cart event emitted:', {
      type,
      cartId: cart._id,
      userId: cart.userId,
      sessionId: cart.sessionId
    });
  }
}

export default CartService;
