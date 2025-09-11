import { useQuery, useMutation, useSubscription } from '@apollo/client';
import { useEffect, useCallback, useState } from 'react';
import { GET_CART } from '../graphql/queries';
import { 
  ADD_TO_CART, 
  UPDATE_CART_ITEM, 
  REMOVE_FROM_CART, 
  CLEAR_CART 
} from '../graphql/mutations';
import { CART_UPDATED } from '../graphql/subscriptions';
import { CartResponse } from '../graphql/types';
import { useCartStore, CartItem as LocalCartItem } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import toast from 'react-hot-toast';

/**
 * Enhanced cart hook that synchronizes local Zustand store with GraphQL API
 * Provides offline-first functionality with server synchronization
 */
export function useCartAPI() {
  const [syncError, setSyncError] = useState<string | null>(null);
  const { isAuthenticated } = useAuthStore();
  
  // Local cart store
  const localCart = useCartStore();
  
  // API cart query (only for authenticated users)
  const { 
    data, 
    loading: fetchLoading, 
    error: fetchError, 
    refetch 
  } = useQuery(GET_CART, {
    errorPolicy: 'all',
    skip: !isAuthenticated,
  });

  // Cart mutations
  const [addToCartMutation, { loading: addLoading }] = useMutation(ADD_TO_CART, {
    errorPolicy: 'all',
  });
  
  const [updateCartItemMutation, { loading: updateLoading }] = useMutation(UPDATE_CART_ITEM, {
    errorPolicy: 'all',
  });
  
  const [removeFromCartMutation, { loading: removeLoading }] = useMutation(REMOVE_FROM_CART, {
    errorPolicy: 'all',
  });
  
  const [clearCartMutation, { loading: clearLoading }] = useMutation(CLEAR_CART, {
    errorPolicy: 'all',
  });

  // Cart subscription (only for authenticated users)
  const { data: subscriptionData, error: subscriptionError } = useSubscription(CART_UPDATED, {
    skip: !isAuthenticated,
  });

  const loading = fetchLoading || addLoading || updateLoading || removeLoading || clearLoading;
  const serverCart: CartResponse | null = data?.cart || null;

  // Handle API errors
  useEffect(() => {
    if (fetchError || subscriptionError) {
      const errorMessage = fetchError?.message || subscriptionError?.message || 'Cart sync failed';
      console.error('Cart API Error:', fetchError || subscriptionError);
      setSyncError(errorMessage);
      toast.error(`Cart sync error: ${errorMessage}`);
    } else {
      setSyncError(null);
    }
  }, [fetchError, subscriptionError]);

  // Sync server cart with local cart when authenticated
  useEffect(() => {
    if (isAuthenticated && serverCart && !fetchError) {
      syncServerCartToLocal(serverCart);
    }
  }, [isAuthenticated, serverCart, fetchError]);

  // Handle real-time cart updates via subscription
  useEffect(() => {
    if (subscriptionData?.cartUpdated) {
      syncServerCartToLocal(subscriptionData.cartUpdated);
    }
  }, [subscriptionData]);

  // Convert server cart to local cart format
  const syncServerCartToLocal = (cart: CartResponse) => {
    try {
      const localItems = cart.items.map(item => ({
        id: item.id,
        productId: item.product.id,
        name: item.product.name,
        price: item.product.price,
        image: item.product.images?.[0] || '',
        quantity: item.quantity,
        maxStock: item.product.stock,
      }));

      // Update local store with server data
      localCart.items = localItems;
      localCart.subtotal = cart.subtotal;
      localCart.tax = cart.tax;
      localCart.shipping = cart.shipping;
      localCart.discount = cart.discount;
      localCart.total = cart.total;
      localCart.itemCount = cart.itemCount;
    } catch (error) {
      console.error('Error syncing server cart to local:', error);
    }
  };

  // Add item to cart (with API sync if authenticated)
  const addItem = useCallback(async (item: Omit<LocalCartItem, 'quantity'>, quantity: number = 1) => {
    try {
      // Always update local cart first (optimistic update)
      localCart.addItem(item);
      
      if (isAuthenticated) {
        // Sync with server
        const { data } = await addToCartMutation({
          variables: { productId: item.productId, quantity },
          optimisticResponse: {
            addToCart: {
              id: serverCart?.id || 'temp-cart',
              items: [
                ...(serverCart?.items || []),
                {
                  id: `temp-${item.productId}`,
                  product: {
                    id: item.productId,
                    name: item.name,
                    price: item.price,
                    images: [item.image],
                    stock: item.maxStock,
                  },
                  quantity,
                  price: item.price,
                },
              ],
              subtotal: (serverCart?.subtotal || 0) + (item.price * quantity),
              tax: 0,
              shipping: 0,
              discount: 0,
              total: (serverCart?.total || 0) + (item.price * quantity),
              itemCount: (serverCart?.itemCount || 0) + quantity,
            },
          },
        });

        if (data?.addToCart) {
          syncServerCartToLocal(data.addToCart);
          toast.success('Item added to cart!');
        }
      } else {
        toast.success('Item added to cart!');
      }

      return true;
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      const errorMessage = error.message || 'Failed to add item to cart';
      setSyncError(errorMessage);
      toast.error(errorMessage);
      return false;
    }
  }, [isAuthenticated, addToCartMutation, serverCart, localCart]);

  // Update cart item quantity
  const updateQuantity = useCallback(async (productId: string, quantity: number) => {
    try {
      const localItem = localCart.items.find(item => item.productId === productId);
      if (!localItem) return false;

      // Update local cart first
      localCart.updateQuantity(productId, quantity);

      if (isAuthenticated && serverCart) {
        const serverItem = serverCart.items.find(item => item.product.id === productId);
        if (serverItem) {
          await updateCartItemMutation({
            variables: { itemId: serverItem.id, quantity },
          });
        }
      }

      return true;
    } catch (error: any) {
      console.error('Error updating cart quantity:', error);
      const errorMessage = error.message || 'Failed to update quantity';
      setSyncError(errorMessage);
      toast.error(errorMessage);
      return false;
    }
  }, [isAuthenticated, updateCartItemMutation, serverCart, localCart]);

  // Remove item from cart
  const removeItem = useCallback(async (productId: string) => {
    try {
      // Update local cart first
      localCart.removeItem(productId);

      if (isAuthenticated && serverCart) {
        const serverItem = serverCart.items.find(item => item.product.id === productId);
        if (serverItem) {
          await removeFromCartMutation({
            variables: { itemId: serverItem.id },
          });
        }
      }

      toast.success('Item removed from cart');
      return true;
    } catch (error: any) {
      console.error('Error removing from cart:', error);
      const errorMessage = error.message || 'Failed to remove item';
      setSyncError(errorMessage);
      toast.error(errorMessage);
      return false;
    }
  }, [isAuthenticated, removeFromCartMutation, serverCart, localCart]);

  // Clear cart
  const clearCart = useCallback(async () => {
    try {
      // Clear local cart first
      localCart.clearCart();

      if (isAuthenticated) {
        await clearCartMutation();
      }

      toast.success('Cart cleared');
      return true;
    } catch (error: any) {
      console.error('Error clearing cart:', error);
      const errorMessage = error.message || 'Failed to clear cart';
      setSyncError(errorMessage);
      toast.error(errorMessage);
      return false;
    }
  }, [isAuthenticated, clearCartMutation, localCart]);

  // Retry sync with server
  const retrySync = useCallback(async () => {
    try {
      setSyncError(null);
      if (isAuthenticated) {
        await refetch();
        toast.success('Cart synced successfully');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Sync failed';
      setSyncError(errorMessage);
      toast.error(`Sync failed: ${errorMessage}`);
    }
  }, [isAuthenticated, refetch]);

  return {
    // Cart data (from local store, synced with server)
    cart: {
      items: localCart.items,
      subtotal: localCart.subtotal,
      tax: localCart.tax,
      shipping: localCart.shipping,
      discount: localCart.discount,
      total: localCart.total,
      itemCount: localCart.itemCount,
    },
    
    // UI state
    isOpen: localCart.isOpen,
    
    // Loading states
    loading,
    syncError,
    
    // Actions
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    openCart: localCart.openCart,
    closeCart: localCart.closeCart,
    toggleCart: localCart.toggleCart,
    retrySync,
    
    // Server sync status
    isAuthenticated,
    isSynced: isAuthenticated ? !syncError && !fetchError : true,
    serverCart,
  };
}
