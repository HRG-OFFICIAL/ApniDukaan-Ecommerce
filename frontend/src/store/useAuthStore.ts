// Custom implementation to replace zustand dependency using React hooks
import { useState, useEffect } from 'react';

// Create a context-like system without using React Context
// This allows components to subscribe to state changes
type Listener = () => void;
type Store<T> = { getState: () => T; setState: (value: Partial<T>) => void; subscribe: (listener: Listener) => () => void };

// Global store instance that lives outside of React components
const createStore = <T extends Record<string, unknown>>(initialState: T): Store<T> => {
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
const persistState = (key: string, state: unknown) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch (error) {
    console.error('Error persisting state:', error);
  }
};

// Create a hook factory that will connect to our store
// function createStoreHook<T extends Record<string, unknown>>(initialState: T, persistKey?: string) {
//   // Initialize with persisted state if available
//   const persistedState = persistKey ? loadPersistedState(persistKey) : null;
//   const store = createStore<T>(persistedState ? { ...initialState, ...persistedState } : initialState);

//   // Create the hook function
//   const useStore = <K extends keyof T | undefined = undefined>(
//     selector?: K
//   ): K extends keyof T ? T[K] : T => {
//     // Get current state value
//     const getValue = useCallback(() => {
//       return selector ? store.getState()[selector as keyof T] : store.getState();
//     }, [selector]);

//     // State that will trigger re-renders
//     const [value, setValue] = useState(getValue);
    
//     // Keep track of mounted state to prevent updates after unmount
//     const mountedRef = useRef(true);
    
//     // Subscribe to store updates
//     useEffect(() => {
//       const unsubscribe = store.subscribe(() => {
//         if (mountedRef.current) {
//           setValue(getValue());
//         }
//       });
      
//       return () => {
//         mountedRef.current = false;
//         unsubscribe();
//       };
//     }, [getValue]);

//     // Persist state changes if persistKey is provided
//     useEffect(() => {
//       if (persistKey) {
//         persistState(persistKey, store.getState());
//       }
//     }, [value]);

//     // Expose the setState method
//     const storeValue = useMemo(() => {
//       const result = selector ? value : { ...value };
//       if (typeof result === 'object' && result !== null) {
//         (result as Record<string, unknown>).setState = store.setState;
//       }
//       return result;
//     }, [value, selector]);

//     return storeValue as T;
//   };
  
//   // Add store methods to the hook function
//   useStore.getState = store.getState;
//   useStore.setState = store.setState;
  
//   return useStore;
// }

export interface User {
  id: string
  email: string
  name: string
  role: 'user' | 'admin'
  avatar?: string
  createdAt: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  [key: string]: unknown
}

// Create actions separately from state
interface AuthActions {
  login: (user: User, token: string) => void
  logout: () => void
  setUser: (user: User) => void
  setLoading: (loading: boolean) => void
}

// Initial state
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false
};

// Create the store with initial state
const authStore = createStore<AuthState>({
  ...initialState
});

// Create actions that will update the store
const authActions: AuthActions = {
  login: (user: User, token: string) => {
    authStore.setState({ user, token, isAuthenticated: true });
  },
  
  logout: () => {
    authStore.setState({ user: null, token: null, isAuthenticated: false });
  },
  
  setUser: (user: User) => {
    authStore.setState({ user });
  },
  
  setLoading: (isLoading: boolean) => {
    authStore.setState({ isLoading });
  }
};

// Load persisted state on initialization
const persistedState = loadPersistedState('auth-storage');
if (persistedState) {
  authStore.setState(persistedState);
}

// Create the hook
const useAuthStoreBase = () => {
  // Get current state
  const [state, setState] = useState(authStore.getState());
  
  // Subscribe to changes
  useEffect(() => {
    const unsubscribe = authStore.subscribe(() => {
      setState(authStore.getState());
    });
    
    return unsubscribe;
  }, []);
  
  // Persist state changes
  useEffect(() => {
    persistState('auth-storage', state);
  }, [state]);
  
  // Return state and actions
  return { ...state, ...authActions };
};

// Add static methods for external access
useAuthStoreBase.getState = authStore.getState;
useAuthStoreBase.setState = authStore.setState;

// Export the hook
export const useAuthStore = useAuthStoreBase;
