import { useQuery, useMutation, useSubscription } from '@apollo/client';
import { GET_CART } from '../graphql/queries';
import { 
  ADD_TO_CART, 
  UPDATE_CART_ITEM, 
  REMOVE_FROM_CART, 
  CLEAR_CART 
} from '../graphql/mutations';
import { CART_UPDATED } from '../graphql/subscriptions';
import { CartResponse } from '../graphql/types';

// Hook for fetching cart
export function useCart() {
  const { data, loading, error, refetch } = useQuery(GET_CART);

  return {
    cart: data?.cart as CartResponse,
    loading,
    error,
    refetch
  };
}

// Hook for cart operations
export function useCartOperations() {
  const [addToCart, { loading: addingToCart }] = useMutation(ADD_TO_CART, {
    refetchQueries: ['GetCart'],
  });

  const [updateCartItem, { loading: updatingCart }] = useMutation(UPDATE_CART_ITEM, {
    refetchQueries: ['GetCart'],
  });

  const [removeFromCart, { loading: removingFromCart }] = useMutation(REMOVE_FROM_CART, {
    refetchQueries: ['GetCart'],
  });

  const [clearCart, { loading: clearingCart }] = useMutation(CLEAR_CART, {
    refetchQueries: ['GetCart'],
  });

  return {
    addToCart: (productId: string, quantity: number = 1) => 
      addToCart({ variables: { productId, quantity } }),
    updateCartItem: (itemId: string, quantity: number) => 
      updateCartItem({ variables: { itemId, quantity } }),
    removeFromCart: (itemId: string) => 
      removeFromCart({ variables: { itemId } }),
    clearCart: () => clearCart(),
    loading: addingToCart || updatingCart || removingFromCart || clearingCart
  };
}

// Hook for real-time cart updates
export function useCartSubscription() {
  const { data, loading, error } = useSubscription(CART_UPDATED);

  return {
    cartUpdate: data?.cartUpdated as CartResponse,
    loading,
    error
  };
}

// Combined hook for cart with operations
export function useCartWithOperations() {
  const cartQuery = useCart();
  const cartOperations = useCartOperations();
  const cartSubscription = useCartSubscription();

  return {
    ...cartQuery,
    ...cartOperations,
    subscription: cartSubscription
  };
}