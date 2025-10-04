import { useQuery, useMutation } from '@apollo/client';
import { GET_USER_PROFILE } from '../graphql/queries';
import { 
  LOGIN, 
  REGISTER, 
  LOGOUT, 
  REFRESH_TOKEN,
  FORGOT_PASSWORD,
  RESET_PASSWORD,
  UPDATE_PROFILE,
  ADD_ADDRESS,
  UPDATE_ADDRESS,
  DELETE_ADDRESS
} from '../graphql/mutations';
import { 
  RegisterInput, 
  UpdateProfileInput, 
  AddressInput, 
  User 
} from '../graphql/types';

// Hook for user profile
export function useUser() {
  const { data, loading, error, refetch } = useQuery(GET_USER_PROFILE);

  return {
    user: data?.me as User,
    loading,
    error,
    refetch
  };
}

// Hook for authentication operations
export function useAuth() {
  const { data: userData } = useQuery(GET_USER_PROFILE);
  const [login, { loading: loggingIn, error: loginError }] = useMutation(LOGIN);
  const [register, { loading: registering, error: registerError }] = useMutation(REGISTER);
  const [logout, { loading: loggingOut }] = useMutation(LOGOUT);
  const [, { loading: refreshing }] = useMutation(REFRESH_TOKEN);
  const [forgotPassword, { loading: sendingReset }] = useMutation(FORGOT_PASSWORD);
  const [resetPassword, { loading: resetting }] = useMutation(RESET_PASSWORD);

  const handleLogin = async (email: string, password: string) => {
    try {
      const { data } = await login({ variables: { email, password } });
      
      if (data?.login) {
        const { token, user } = data.login;
        
        // Store tokens in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('authToken', token);
          localStorage.setItem('user', JSON.stringify(user));
        }
        
        return { success: true, user };
      }
      
      return { success: false, error: 'Login failed' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error };
    }
  };

  const handleRegister = async (input: RegisterInput) => {
    try {
      const { data } = await register({ variables: { input } });
      
      if (data?.register) {
        const { token, user } = data.register;
        
        // Store tokens in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('authToken', token);
          localStorage.setItem('user', JSON.stringify(user));
        }
        
        return { success: true, user };
      }
      
      return { success: false, error: 'Registration failed' };
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, error };
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      
      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      }
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error };
    }
  };

  const handleForgotPassword = async (email: string) => {
    try {
      await forgotPassword({ variables: { email } });
      return { success: true };
    } catch (error) {
      console.error('Forgot password error:', error);
      return { success: false, error };
    }
  };

  const handleResetPassword = async (token: string, password: string) => {
    try {
      await resetPassword({ variables: { token, password } });
      return { success: true };
    } catch (error) {
      console.error('Reset password error:', error);
      return { success: false, error };
    }
  };

  return {
    user: userData?.me,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    forgotPassword: handleForgotPassword,
    resetPassword: handleResetPassword,
    loading: loggingIn || registering || loggingOut || refreshing || sendingReset || resetting,
    errors: {
      login: loginError,
      register: registerError
    }
  };
}

// Hook for profile management
export function useProfile() {
  const [updateProfile, { loading: updatingProfile }] = useMutation(UPDATE_PROFILE, {
    refetchQueries: ['GetUserProfile'],
  });

  const [addAddress, { loading: addingAddress }] = useMutation(ADD_ADDRESS, {
    refetchQueries: ['GetUserProfile'],
  });

  const [updateAddress, { loading: updatingAddress }] = useMutation(UPDATE_ADDRESS, {
    refetchQueries: ['GetUserProfile'],
  });

  const [deleteAddress, { loading: deletingAddress }] = useMutation(DELETE_ADDRESS, {
    refetchQueries: ['GetUserProfile'],
  });

  const handleUpdateProfile = async (input: UpdateProfileInput) => {
    try {
      const { data } = await updateProfile({ variables: { input } });
      return { success: true, user: data?.updateProfile };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error };
    }
  };

  const handleAddAddress = async (input: AddressInput) => {
    try {
      const { data } = await addAddress({ variables: { input } });
      return { success: true, address: data?.addAddress };
    } catch (error) {
      console.error('Add address error:', error);
      return { success: false, error };
    }
  };

  const handleUpdateAddress = async (id: string, input: AddressInput) => {
    try {
      const { data } = await updateAddress({ variables: { id, input } });
      return { success: true, address: data?.updateAddress };
    } catch (error) {
      console.error('Update address error:', error);
      return { success: false, error };
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await deleteAddress({ variables: { id } });
      return { success: true };
    } catch (error) {
      console.error('Delete address error:', error);
      return { success: false, error };
    }
  };

  return {
    updateProfile: handleUpdateProfile,
    addAddress: handleAddAddress,
    updateAddress: handleUpdateAddress,
    deleteAddress: handleDeleteAddress,
    loading: updatingProfile || addingAddress || updatingAddress || deletingAddress
  };
}