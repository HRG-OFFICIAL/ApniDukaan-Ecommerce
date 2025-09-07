import { Cart, ICartDocument } from '../models/Cart';
import { logger, ValidationError, NotFoundError } from '@shopsphere/shared';
import { redisClient } from '@shopsphere/shared';

export interface AddToCartData {
  productId: string;
  quantity: number;
  price: number;
  productData: {
    name: string;
    sku: string;
    images: Array<{ url: string }>;
    variant?: {
      name: string;
      value: string;
    };
  };
}

class CartService {
  private readonly CACHE_TTL = 1800; // 30 minutes

  async getCart(userId: string): Promise<ICartDocument> {
    try {
      const cacheKey = `cart:${userId}`;
      
      // Try cache first
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // Get from database or create new cart
      let cart = await Cart.findOrCreateForUser(userId);
      
      // Cache the cart
      await redisClient.setex(cacheKey, this.CACHE_TTL, JSON.stringify(cart));

      logger.info('Cart retrieved', {
        userId,
        itemCount: cart.itemCount,
        action: 'get_cart'
      });

      return cart;
    } catch (error) {
      logger.error('Failed to get cart', {
        userId,
        error: error.message,
        action: 'get_cart'
      });
      throw error;
    }
  }

  async addToCart(userId: string, data: AddToCartData): Promise<ICartDocument> {
    try {
      if (data.quantity <= 0) {
        throw new ValidationError('Quantity must be greater than 0');
      }

      if (data.quantity > 99) {
        throw new ValidationError('Quantity cannot exceed 99');
      }

      const cart = await Cart.findOrCreateForUser(userId);
      
      await cart.addItem(
        data.productId,
        data.quantity,
        data.price,
        data.productData
      );

      // Update cache
      await this.updateCartCache(userId, cart);

      logger.info('Item added to cart', {
        userId,
        productId: data.productId,
        quantity: data.quantity,
        action: 'add_to_cart'
      });

      return cart;
    } catch (error) {
      logger.error('Failed to add item to cart', {
        userId,
        productId: data.productId,
        error: error.message,
        action: 'add_to_cart'
      });
      throw error;
    }
  }

  async updateCartItem(userId: string, productId: string, quantity: number): Promise<ICartDocument> {
    try {
      if (quantity < 0) {
        throw new ValidationError('Quantity cannot be negative');
      }

      if (quantity > 99) {
        throw new ValidationError('Quantity cannot exceed 99');
      }

      const cart = await Cart.findByUser(userId);
      if (!cart) {
        throw new NotFoundError('Cart not found');
      }

      await cart.updateItemQuantity(productId, quantity);

      // Update cache
      await this.updateCartCache(userId, cart);

      logger.info('Cart item updated', {
        userId,
        productId,
        quantity,
        action: 'update_cart_item'
      });

      return cart;
    } catch (error) {
      logger.error('Failed to update cart item', {
        userId,
        productId,
        quantity,
        error: error.message,
        action: 'update_cart_item'
      });
      throw error;
    }
  }

  async removeFromCart(userId: string, productId: string): Promise<ICartDocument> {
    try {
      const cart = await Cart.findByUser(userId);
      if (!cart) {
        throw new NotFoundError('Cart not found');
      }

      await cart.removeItem(productId);

      // Update cache
      await this.updateCartCache(userId, cart);

      logger.info('Item removed from cart', {
        userId,
        productId,
        action: 'remove_from_cart'
      });

      return cart;
    } catch (error) {
      logger.error('Failed to remove item from cart', {
        userId,
        productId,
        error: error.message,
        action: 'remove_from_cart'
      });
      throw error;
    }
  }

  async clearCart(userId: string): Promise<ICartDocument> {
    try {
      const cart = await Cart.findByUser(userId);
      if (!cart) {
        throw new NotFoundError('Cart not found');
      }

      await cart.clearCart();

      // Update cache
      await this.updateCartCache(userId, cart);

      logger.info('Cart cleared', {
        userId,
        action: 'clear_cart'
      });

      return cart;
    } catch (error) {
      logger.error('Failed to clear cart', {
        userId,
        error: error.message,
        action: 'clear_cart'
      });
      throw error;
    }
  }

  async getCartItemCount(userId: string): Promise<number> {
    try {
      const cart = await this.getCart(userId);
      return cart.itemCount;
    } catch (error) {
      logger.error('Failed to get cart item count', {
        userId,
        error: error.message,
        action: 'get_cart_item_count'
      });
      return 0;
    }
  }

  async validateCartForCheckout(userId: string): Promise<{ valid: boolean; errors: string[] }> {
    try {
      const cart = await Cart.findByUser(userId);
      const errors: string[] = [];

      if (!cart || cart.items.length === 0) {
        errors.push('Cart is empty');
        return { valid: false, errors };
      }

      // Validate each item
      for (const item of cart.items) {
        if (item.quantity <= 0) {
          errors.push(`Invalid quantity for ${item.productName}`);
        }

        if (item.price <= 0) {
          errors.push(`Invalid price for ${item.productName}`);
        }

        // In a real implementation, we would validate against current product data
        // to ensure prices and availability are still valid
      }

      const valid = errors.length === 0;

      logger.info('Cart validation completed', {
        userId,
        valid,
        errorCount: errors.length,
        action: 'validate_cart_for_checkout'
      });

      return { valid, errors };
    } catch (error) {
      logger.error('Failed to validate cart for checkout', {
        userId,
        error: error.message,
        action: 'validate_cart_for_checkout'
      });
      return { valid: false, errors: ['Cart validation failed'] };
    }
  }

  private async updateCartCache(userId: string, cart: ICartDocument): Promise<void> {
    try {
      const cacheKey = `cart:${userId}`;
      await redisClient.setex(cacheKey, this.CACHE_TTL, JSON.stringify(cart));
    } catch (error) {
      logger.error('Failed to update cart cache', {
        userId,
        error: error.message,
        action: 'update_cart_cache'
      });
    }
  }

  async clearCartCache(userId: string): Promise<void> {
    try {
      const cacheKey = `cart:${userId}`;
      await redisClient.del(cacheKey);
    } catch (error) {
      logger.error('Failed to clear cart cache', {
        userId,
        error: error.message,
        action: 'clear_cart_cache'
      });
    }
  }
}

export const cartService = new CartService();
