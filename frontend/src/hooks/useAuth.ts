import { useCallback } from 'react';
import { useAuthStore, User } from '../store/useAuthStore';

/**
 * Custom hook that provides authentication functionality
 * This hook simplifies the interface for components to interact with the auth store
 */
export function useAuth() {
  // Get all auth state and actions from the store
  const auth = useAuthStore();
  
  // Memoized login function
  const login = useCallback((user: User, token: string) => {
    auth.login(user, token);
  }, [auth]);
  
  // Memoized logout function
  const logout = useCallback(() => {
    auth.logout();
  }, [auth]);
  
  // Return a simplified interface
  return {
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    token: auth.token,
    login,
    logout,
    setUser: auth.setUser,
    setLoading: auth.setLoading
  };
}