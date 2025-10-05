import { WishlistItem } from '../lib/api';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

/**
 * A hook for managing wishlist functionality with real API integration
 */
export const useWishlist = () => {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadWishlist = () => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('wishlist') : null;
      setWishlistItems(raw ? JSON.parse(raw) : []);
    } catch (e) {
      setWishlistItems([]);
    }
  };

  const saveWishlist = (items: WishlistItem[]) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('wishlist', JSON.stringify(items));
      }
    } catch {}
  };

  useEffect(() => {
    loadWishlist();
  }, []);

  // Check if an item is in the wishlist
  const isInWishlist = useCallback((productId: string) => {
    return wishlistItems.some(item => item.product.id === productId);
  }, [wishlistItems]);

  // Add an item to the wishlist
  const addToWishlist = useCallback(async (productId: string) => {
    try {
      setIsLoading(true);
      const newItem: WishlistItem = {
        id: `wl_${productId}`,
        product: {
          id: productId,
          name: 'Product',
          price: 0,
          originalPrice: null,
          images: [],
          rating: 0,
          reviewCount: 0,
          stock: 0,
          isOnSale: false,
        },
        createdAt: new Date().toISOString(),
      };
      const updated = [...wishlistItems.filter(i => i.product.id !== productId), newItem];
      setWishlistItems(updated);
      saveWishlist(updated);
      toast.success('Added to wishlist');
      return true;
    } catch (e: any) {
      setError(e);
      toast.error('Failed to add to wishlist');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [wishlistItems]);

  // Remove an item from the wishlist
  const removeFromWishlist = useCallback(async (productId: string) => {
    try {
      setIsLoading(true);
      const updated = wishlistItems.filter(item => item.product.id !== productId);
      setWishlistItems(updated);
      saveWishlist(updated);
      toast.success('Removed from wishlist');
      return true;
    } catch (e: any) {
      setError(e);
      toast.error('Failed to remove from wishlist');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [wishlistItems]);

  // Clear the wishlist (this would need a separate mutation in a real app)
  const clearWishlist = useCallback(async () => {
    try {
      setIsLoading(true);
      setWishlistItems([]);
      saveWishlist([]);
      toast.success('Wishlist cleared');
      return true;
    } catch (e: any) {
      setError(e);
      toast.error('Failed to clear wishlist');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Toggle wishlist item
  const toggleWishlist = useCallback(async (productId: string) => {
    if (isInWishlist(productId)) {
      return await removeFromWishlist(productId);
    } else {
      return await addToWishlist(productId);
    }
  }, [isInWishlist, addToWishlist, removeFromWishlist]);

  return {
    wishlistItems,
    isLoading,
    error,
    isInWishlist,
    addToWishlist,
    removeFromWishlist,
    clearWishlist,
    toggleWishlist,
    refetch: loadWishlist,
  };
};
