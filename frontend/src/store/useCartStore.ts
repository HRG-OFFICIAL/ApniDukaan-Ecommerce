// Custom implementation to replace zustand dependency using React hooks
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// Create a context-like system without using React Context
// This allows components to subscribe to state changes
type Listener = () => void;
type Store<T> = { getState: () => T; setState: (value: Partial<T>) => void; subscribe: (listener: Listener) => () => void };

// Global store instance that lives outside of React components
const createStore = <T extends Record<string, any>>(initialState: T): Store<T> => {
  let state = { ...initialState };
  const listeners = new Set<Listener>();

  return {
    getState: () => state,
    setState: (partial: Partial<T>) => {
      state = { ...state, ...partial };
      listeners.forEach(listener => listener());
    },
    subscribe: (listener: Listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
};

// Load persisted state from localStorage
const loadPersistedState = (key: string) => {
  if (typeof window === 'undefined') return null;
  
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error('Error loading persisted state:', error);
    return null;
  }
};

// Save state to localStorage
const persistState = (key: string, state: any) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch (error) {
    console.error('Error persisting state:', error);
  }
};

export interface CartItem {
  id: string
  productId: string
  name: string
  price: number
  image: string
  quantity: number
  maxStock: number
}

interface CartState {
  items: CartItem[]
  total: number
  itemCount: number
  isOpen: boolean
}

// Create actions separately from state
interface CartActions {
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  toggleCart: () => void
  calculateTotals: () => void
}

// Initial state
const initialCartState: CartState = {
  items: [],
  total: 0,
  itemCount: 0,
  isOpen: false
};

// Create the store with initial state
const cartStore = createStore<CartState>(initialCartState);

// Load persisted state on initialization
const persistedCartState = loadPersistedState('cart-storage');
if (persistedCartState) {
  cartStore.setState(persistedCartState);
}

// Create actions that will update the store
const cartActions: CartActions = {
  addItem: (item: Omit<CartItem, 'quantity'>) => {
    const state = cartStore.getState();
    const existingItem = state.items.find(i => i.productId === item.productId);
    
    if (existingItem) {
      cartStore.setState({
        items: state.items.map(i =>
          i.productId === item.productId
            ? { ...i, quantity: Math.min(i.quantity + 1, i.maxStock) }
            : i
        )
      });
    } else {
      cartStore.setState({
        items: [...state.items, { ...item, quantity: 1 }]
      });
    }
    
    cartActions.calculateTotals();
  },
  
  removeItem: (productId: string) => {
    const state = cartStore.getState();
    cartStore.setState({
      items: state.items.filter(item => item.productId !== productId)
    });
    cartActions.calculateTotals();
  },
  
  updateQuantity: (productId: string, quantity: number) => {
    if (quantity <= 0) {
      cartActions.removeItem(productId);
      return;
    }
    
    const state = cartStore.getState();
    cartStore.setState({
      items: state.items.map(item =>
        item.productId === productId
          ? { ...item, quantity: Math.min(quantity, item.maxStock) }
          : item
      )
    });
    cartActions.calculateTotals();
  },
  
  clearCart: () => {
    cartStore.setState({ items: [], total: 0, itemCount: 0 });
  },
  
  toggleCart: () => {
    const state = cartStore.getState();
    cartStore.setState({ isOpen: !state.isOpen });
  },
  
  calculateTotals: () => {
    const state = cartStore.getState();
    const total = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
    cartStore.setState({ total, itemCount });
  }
};

// Create the hook
const useCartStoreBase = () => {
  // Get current state
  const [state, setState] = useState(cartStore.getState());
  
  // Subscribe to changes
  useEffect(() => {
    const unsubscribe = cartStore.subscribe(() => {
      setState(cartStore.getState());
    });
    
    return unsubscribe;
  }, []);
  
  // Persist state changes
  useEffect(() => {
    persistState('cart-storage', {
      items: state.items,
      total: state.total,
      itemCount: state.itemCount
    });
  }, [state]);
  
  // Return state and actions
  return { ...state, ...cartActions };
};

// Add static methods for external access
useCartStoreBase.getState = cartStore.getState;
useCartStoreBase.setState = cartStore.setState;

// Export the hook
export const useCartStore = useCartStoreBase;
