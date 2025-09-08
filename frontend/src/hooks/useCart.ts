import { useCallback, useState } from 'react';
import { useCartStore, CartItem } from '@/store/useCartStore';

/**
 * A simplified hook for interacting with the cart store
 * Provides memoized functions for common cart operations
 */
export const useCart = () => {
  const cart = useCartStore();
  const [isLoading, setIsLoading] = useState(false);
  
  // Memoize common functions to prevent unnecessary re-renders
  const addToCart = useCallback(async (item: Omit<CartItem, 'quantity'>) => {
    try {
      setIsLoading(true);
      cart.addItem(item);
      return true;
    } catch (error) {
      console.error('Error adding item to cart:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [cart]);
  
  const removeFromCart = useCallback(async (productId: string) => {
    try {
      setIsLoading(true);
      cart.removeItem(productId);
      return true;
    } catch (error) {
      console.error('Error removing item from cart:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [cart]);
  
  const updateQuantity = useCallback(async (productId: string, quantity: number) => {
    try {
      setIsLoading(true);
      cart.updateQuantity(productId, quantity);
      return true;
    } catch (error) {
      console.error('Error updating quantity:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [cart]);
  
  const clearCart = useCallback(async () => {
    try {
      setIsLoading(true);
      cart.clearCart();
      return true;
    } catch (error) {
      console.error('Error clearing cart:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [cart]);
  
  const toggleCart = useCallback(() => {
    cart.toggleCart();
  }, [cart]);
  
  // Return a simplified interface
  return {
    // State
    items: cart.items,
    total: cart.total,
    itemCount: cart.itemCount,
    isOpen: cart.isOpen,
    isLoading,
    
    // Actions
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    toggleCart
  };
};