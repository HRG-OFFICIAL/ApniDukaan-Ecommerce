import { useState, useEffect } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatar?: string;
  };
  addresses?: Address[];
}

export interface Address {
  id: string;
  type: 'home' | 'work' | 'other';
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  firstName?: string;
  lastName?: string;
}

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
}

export interface AddressInput {
  type: 'home' | 'work' | 'other';
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault?: boolean;
}

// Hook for user profile
export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.data);
        setError(null);
      } else {
        setUser(null);
        setError('Failed to fetch user profile');
      }
    } catch (err) {
      setError('Network error');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return {
    user,
    loading,
    error,
    refetch: fetchUser
  };
}

// Hook for authentication operations
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ login?: any; register?: any }>({});

  const handleLogin = async (email: string, password: string) => {
    try {
      setLoading(true);
      setErrors({});

      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success) {
        const { token, user: userData } = data.data;
        
        // Store tokens in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('authToken', token);
          localStorage.setItem('user', JSON.stringify(userData));
        }
        
        setUser(userData);
        return { success: true, user: userData };
      } else {
        setErrors({ login: data.error });
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors({ login: error });
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (input: RegisterInput) => {
    try {
      setLoading(true);
      setErrors({});

      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(input)
      });

      const data = await response.json();

      if (data.success) {
        const { token, user: userData } = data.data;
        
        // Store tokens in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('authToken', token);
          localStorage.setItem('user', JSON.stringify(userData));
        }
        
        setUser(userData);
        return { success: true, user: userData };
      } else {
        setErrors({ register: data.error });
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Register error:', error);
      setErrors({ register: error });
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('authToken');
      
      if (token) {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
      
      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      }
      
      setUser(null);
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (email: string) => {
    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      return { success: data.success, message: data.message };
    } catch (error) {
      console.error('Forgot password error:', error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (token: string, password: string) => {
    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token, password })
      });

      const data = await response.json();
      return { success: data.success, message: data.message };
    } catch (error) {
      console.error('Reset password error:', error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    forgotPassword: handleForgotPassword,
    resetPassword: handleResetPassword,
    loading,
    errors
  };
}

// Hook for profile management
export function useProfile() {
  const [loading, setLoading] = useState(false);

  const handleUpdateProfile = async (input: UpdateProfileInput) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(input)
      });

      const data = await response.json();
      return { success: data.success, user: data.data };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = async (input: AddressInput) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      const response = await fetch(`${API_BASE_URL}/api/users/addresses`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(input)
      });

      const data = await response.json();
      return { success: data.success, address: data.data };
    } catch (error) {
      console.error('Add address error:', error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAddress = async (id: string, input: AddressInput) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      const response = await fetch(`${API_BASE_URL}/api/users/addresses/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(input)
      });

      const data = await response.json();
      return { success: data.success, address: data.data };
    } catch (error) {
      console.error('Update address error:', error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      const response = await fetch(`${API_BASE_URL}/api/users/addresses/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      return { success: data.success };
    } catch (error) {
      console.error('Delete address error:', error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  return {
    updateProfile: handleUpdateProfile,
    addAddress: handleAddAddress,
    updateAddress: handleUpdateAddress,
    deleteAddress: handleDeleteAddress,
    loading
  };
}