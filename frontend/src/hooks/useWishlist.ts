import { useQuery, useMutation } from '@apollo/client';
import { GET_WISHLIST } from '../graphql/queries';
import { ADD_TO_WISHLIST, REMOVE_FROM_WISHLIST } from '../graphql/mutations';
import { WishlistItem } from '../graphql/types';
import { useCallback } from 'react';
import toast from 'react-hot-toast';

/**
 * A hook for managing wishlist functionality with real API integration
 */
export const useWishlist = () => {
  // Fetch wishlist from API
  const { data, loading: fetchLoading, error, refetch } = useQuery(GET_WISHLIST, {
    errorPolicy: 'all',
  });

  // Mutations
  const [addToWishlistMutation, { loading: addLoading }] = useMutation(ADD_TO_WISHLIST, {
    refetchQueries: ['GetWishlist'],
  });

  const [removeFromWishlistMutation, { loading: removeLoading }] = useMutation(REMOVE_FROM_WISHLIST, {
    refetchQueries: ['GetWishlist'],
  });

  const wishlistItems: WishlistItem[] = data?.wishlist || [];
  const isLoading = fetchLoading || addLoading || removeLoading;

  // Check if an item is in the wishlist
  const isInWishlist = useCallback((productId: string) => {
    return wishlistItems.some(item => item.product.id === productId);
  }, [wishlistItems]);

  // Add an item to the wishlist
  const addToWishlist = useCallback(async (productId: string) => {
    try {
      const { data } = await addToWishlistMutation({
        variables: { productId },
        optimisticResponse: {
          addToWishlist: {
            id: `temp-${productId}`,
            product: {
              id: productId,
              name: 'Loading...',
              price: 0,
              originalPrice: null,
              images: [],
              rating: 0,
              reviewCount: 0,
              stock: 0,
              isOnSale: false,
            },
            createdAt: new Date().toISOString(),
          },
        },
      });
      
      if (data?.addToWishlist) {
        toast.success('Added to wishlist');
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Error adding to wishlist:', error);
      const errorMessage = error.message || 'Failed to add to wishlist';
      toast.error(errorMessage);
      return false;
    }
  }, [addToWishlistMutation]);

  // Remove an item from the wishlist
  const removeFromWishlist = useCallback(async (productId: string) => {
    try {
      await removeFromWishlistMutation({
        variables: { productId },
        optimisticResponse: {
          removeFromWishlist: true,
        },
        update: (cache) => {
          // Remove the item from the cache optimistically
          const existingWishlist = cache.readQuery({ query: GET_WISHLIST }) as any;
          if (existingWishlist) {
            cache.writeQuery({
              query: GET_WISHLIST,
              data: {
                wishlist: existingWishlist.wishlist.filter(
                  (item: WishlistItem) => item.product.id !== productId
                ),
              },
            });
          }
        },
      });
      
      toast.success('Removed from wishlist');
      return true;
    } catch (error: any) {
      console.error('Error removing from wishlist:', error);
      const errorMessage = error.message || 'Failed to remove from wishlist';
      toast.error(errorMessage);
      return false;
    }
  }, [removeFromWishlistMutation]);

  // Clear the wishlist (this would need a separate mutation in a real app)
  const clearWishlist = useCallback(async () => {
    try {
      // Since there's no clear mutation, we'll remove items one by one
      const promises = wishlistItems.map(item => 
        removeFromWishlistMutation({ variables: { productId: item.product.id } })
      );
      await Promise.all(promises);
      toast.success('Wishlist cleared');
      return true;
    } catch (error: any) {
      console.error('Error clearing wishlist:', error);
      toast.error('Failed to clear wishlist');
      return false;
    }
  }, [wishlistItems, removeFromWishlistMutation]);

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
    refetch,
  };
};
