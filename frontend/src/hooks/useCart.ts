'use client'

import { useState, useEffect } from 'react';
import { cartService, Cart, CartItem } from '../services/cartService';

// Hook for fetching cart
export function useCart() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCart = async () => {
    setLoading(true);
    setError(null);
    try {
      const cart = await cartService.getCart();
      setCart(cart);
    } catch (err) {
      setError('Failed to fetch cart');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  return {
    cart,
    loading,
    error,
    refetch: fetchCart
  };
}

// Hook for cart mutations
export function useCartMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addToCart = async (productId: string, quantity: number = 1) => {
    setLoading(true);
    setError(null);
    try {
      const cart = await cartService.addToCart(productId, quantity);
      return { success: true, data: cart };
    } catch (err) {
      const errorMsg = 'Failed to add to cart';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const updateCartItem = async (itemId: string, quantity: number) => {
    setLoading(true);
    setError(null);
    try {
      const cart = await cartService.updateCartItem(itemId, quantity);
      return { success: true, data: cart };
    } catch (err) {
      const errorMsg = 'Failed to update cart item';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (itemId: string) => {
    setLoading(true);
    setError(null);
    try {
      const cart = await cartService.removeFromCart(itemId);
      return { success: true, data: cart };
    } catch (err) {
      const errorMsg = 'Failed to remove from cart';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    setLoading(true);
    setError(null);
    try {
      const cart = await cartService.clearCart();
      return { success: true, data: cart };
    } catch (err) {
      const errorMsg = 'Failed to clear cart';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  return {
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    loading,
    error
  };
}