import { useState, useCallback } from 'react';

/**
 * A hook for managing wishlist functionality
 */
export const useWishlist = () => {
  const [wishlistItems, setWishlistItems] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Check if an item is in the wishlist
  const isInWishlist = useCallback((productId: string) => {
    return wishlistItems.includes(productId);
  }, [wishlistItems]);

  // Add an item to the wishlist
  const addToWishlist = useCallback(async (productId: string) => {
    try {
      setIsLoading(true);
      setWishlistItems(prev => [...prev, productId]);
      return true;
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Remove an item from the wishlist
  const removeFromWishlist = useCallback(async (productId: string) => {
    try {
      setIsLoading(true);
      setWishlistItems(prev => prev.filter(id => id !== productId));
      return true;
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Clear the wishlist
  const clearWishlist = useCallback(async () => {
    try {
      setIsLoading(true);
      setWishlistItems([]);
      return true;
    } catch (error) {
      console.error('Error clearing wishlist:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    wishlistItems,
    isLoading,
    isInWishlist,
    addToWishlist,
    removeFromWishlist,
    clearWishlist
  };
};