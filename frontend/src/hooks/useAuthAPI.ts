'use client'

import { useQuery, useMutation, useSubscription } from '@apollo/client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { 
  GET_USER_PROFILE, 
  GET_USER_ORDERS 
} from '../graphql/queries'
import { 
  LOGIN, 
  REGISTER, 
  LOGOUT, 
  REFRESH_TOKEN,
  FORGOT_PASSWORD,
  RESET_PASSWORD,
  UPDATE_PROFILE,
  VERIFY_EMAIL
} from '../graphql/mutations'
import { USER_UPDATED } from '../graphql/subscriptions'
import { 
  RegisterInput, 
  UpdateProfileInput, 
  User 
} from '../graphql/types'
import toast from 'react-hot-toast'

// Token refresh utility
export function useTokenRefresh() {
  const { logout } = useAuth()
  const [refreshTokenMutation] = useMutation(REFRESH_TOKEN)

  const refreshToken = async (): Promise<string | null> => {
    try {
      const refreshToken = localStorage.getItem('refreshToken')
      if (!refreshToken) {
        throw new Error('No refresh token available')
      }

      const { data } = await refreshTokenMutation({ 
        variables: { refreshToken } 
      })

      if (data?.refreshToken) {
        const { accessToken, refreshToken: newRefreshToken } = data.refreshToken
        
        // Update tokens in localStorage
        localStorage.setItem('authToken', accessToken)
        localStorage.setItem('refreshToken', newRefreshToken)
        
        return accessToken
      }

      throw new Error('Failed to refresh token')
    } catch (error) {
      console.error('Token refresh failed:', error)
      
      // Clear all auth data and redirect to login
      localStorage.removeItem('authToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      logout()
      
      toast.error('Session expired. Please log in again.')
      window.location.href = '/auth/login'
      return null
    }
  }

  return { refreshToken }
}

// Main authentication API hook
export function useAuthAPI() {
  const router = useRouter()
  const { login: setAuthState, logout: clearAuthState, setUser, setLoading } = useAuth()
  const { refreshToken } = useTokenRefresh()

  // Queries
  const { 
    data: userData, 
    loading: userLoading, 
    error: userError,
    refetch: refetchUser 
  } = useQuery(GET_USER_PROFILE, {
    skip: typeof window !== 'undefined' && !localStorage.getItem('authToken'),
    errorPolicy: 'all'
  })

  // Handle user data updates with useEffect
  useEffect(() => {
    if (userData?.me) {
      setUser(userData.me)
    }
  }, [userData, setUser])

  // Handle authentication errors with useEffect
  useEffect(() => {
    const handleAuthError = async () => {
      if (userError?.networkError && 'statusCode' in userError.networkError && userError.networkError.statusCode === 401) {
        const newToken = await refreshToken()
        if (newToken) {
          refetchUser()
        }
      }
    }
    
    if (userError) {
      handleAuthError()
    }
  }, [userError, refreshToken, refetchUser])

  const {
    data: ordersData,
    loading: ordersLoading,
    error: ordersError,
    refetch: refetchOrders
  } = useQuery(GET_USER_ORDERS, {
    skip: !userData?.me,
    errorPolicy: 'all'
  })

  // Mutations
  const [loginMutation, { loading: loggingIn, error: loginError, data: loginData }] = useMutation(LOGIN)
  const [registerMutation, { loading: registering, error: registerError, data: registerData }] = useMutation(REGISTER)
  const [logoutMutation, { loading: loggingOut }] = useMutation(LOGOUT)
  const [forgotPasswordMutation, { loading: sendingReset }] = useMutation(FORGOT_PASSWORD)
  const [resetPasswordMutation, { loading: resetting }] = useMutation(RESET_PASSWORD)
  const [updateProfileMutation, { loading: updatingProfile }] = useMutation(UPDATE_PROFILE, {
    refetchQueries: [{ query: GET_USER_PROFILE }]
  })
  const [verifyEmailMutation, { loading: verifyingEmail }] = useMutation(VERIFY_EMAIL)

  // Handle login success
  useEffect(() => {
    if (loginData?.login) {
      const { user, accessToken, refreshToken } = loginData.login
      
      // Store tokens and user data
      localStorage.setItem('authToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      localStorage.setItem('user', JSON.stringify(user))
      
      // Update auth context
      setAuthState(user, accessToken)
      toast.success('Login successful!')
    }
  }, [loginData, setAuthState])

  // Handle login error
  useEffect(() => {
    if (loginError) {
      console.error('Login error:', loginError)
      toast.error(loginError.message || 'Login failed. Please check your credentials.')
    }
  }, [loginError])

  // Handle register success
  useEffect(() => {
    if (registerData?.register) {
      const { user, accessToken, refreshToken } = registerData.register
      
      // Store tokens and user data
      localStorage.setItem('authToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      localStorage.setItem('user', JSON.stringify(user))
      
      // Update auth context
      setAuthState(user, accessToken)
      toast.success('Registration successful!')
    }
  }, [registerData, setAuthState])

  // Handle register error
  useEffect(() => {
    if (registerError) {
      console.error('Registration error:', registerError)
      toast.error(registerError.message || 'Registration failed. Please try again.')
    }
  }, [registerError])

  // Subscription for real-time user updates
  useSubscription(USER_UPDATED, {
    skip: !userData?.me,
    onSubscriptionData: ({ subscriptionData }) => {
      if (subscriptionData.data?.userUpdated) {
        setUser(subscriptionData.data.userUpdated)
        toast.success('Your profile has been updated')
      }
    }
  })

  // Handler functions
  const handleLogin = async (email: string, password: string) => {
    setLoading(true)
    try {
      const result = await loginMutation({ 
        variables: { email, password }
      })
      return { success: true, user: result.data?.login?.user }
    } catch (error) {
      return { success: false, error }
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (input: RegisterInput) => {
    setLoading(true)
    try {
      const result = await registerMutation({ 
        variables: { input }
      })
      return { success: true, user: result.data?.register?.user }
    } catch (error) {
      return { success: false, error }
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    setLoading(true)
    try {
      await logoutMutation()
      
      // Clear all stored data
      localStorage.removeItem('authToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      
      // Clear auth context
      clearAuthState()
      toast.success('Logged out successfully')
      
      // Redirect to home
      router.push('/')
      
      return { success: true }
    } catch (error) {
      console.error('Logout error:', error)
      // Even if logout fails on server, clear local data
      localStorage.removeItem('authToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      clearAuthState()
      router.push('/')
      return { success: false, error }
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (email: string) => {
    try {
      await forgotPasswordMutation({ variables: { email } })
      toast.success('Password reset email sent! Check your inbox.')
      return { success: true }
    } catch (error: any) {
      console.error('Forgot password error:', error)
      toast.error(error.message || 'Failed to send reset email. Please try again.')
      return { success: false, error }
    }
  }

  const handleResetPassword = async (token: string, password: string) => {
    try {
      await resetPasswordMutation({ variables: { token, password } })
      toast.success('Password reset successful! You can now log in with your new password.')
      router.push('/auth/login')
      return { success: true }
    } catch (error: any) {
      console.error('Reset password error:', error)
      toast.error(error.message || 'Failed to reset password. Please try again.')
      return { success: false, error }
    }
  }

  const handleUpdateProfile = async (input: UpdateProfileInput) => {
    try {
      const result = await updateProfileMutation({ variables: { input } })
      if (result.data?.updateProfile) {
        setUser(result.data.updateProfile)
        toast.success('Profile updated successfully!')
      }
      return { success: true, user: result.data?.updateProfile }
    } catch (error: any) {
      console.error('Update profile error:', error)
      toast.error(error.message || 'Failed to update profile. Please try again.')
      return { success: false, error }
    }
  }

  const handleVerifyEmail = async (token: string) => {
    try {
      await verifyEmailMutation({ variables: { token } })
      toast.success('Email verified successfully!')
      refetchUser()
      return { success: true }
    } catch (error: any) {
      console.error('Email verification error:', error)
      toast.error(error.message || 'Failed to verify email. Please try again.')
      return { success: false, error }
    }
  }

  // Auto-login on app start if token exists
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken')
      const user = localStorage.getItem('user')
      
      if (token && user && !userData?.me) {
        try {
          const parsedUser = JSON.parse(user)
          setAuthState(parsedUser, token)
        } catch (error) {
          console.error('Error parsing stored user:', error)
          localStorage.removeItem('authToken')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('user')
        }
      }
    }
  }, [])

  return {
    // Data
    user: userData?.me,
    orders: ordersData?.me?.orders || [],
    
    // Loading states
    loading: userLoading || loggingIn || registering || loggingOut || sendingReset || resetting || updatingProfile || verifyingEmail,
    userLoading,
    ordersLoading,
    
    // Error states
    errors: {
      user: userError,
      login: loginError,
      register: registerError,
      orders: ordersError
    },
    
    // Actions
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    forgotPassword: handleForgotPassword,
    resetPassword: handleResetPassword,
    updateProfile: handleUpdateProfile,
    verifyEmail: handleVerifyEmail,
    
    // Utilities
    refetchUser,
    refetchOrders,
    refreshToken
  }
}

// Hook for checking authentication status
export function useAuthStatus() {
  const { user, loading } = useAuthAPI()
  
  return {
    isAuthenticated: !!user,
    isLoading: loading,
    user
  }
}

// Hook for protected routes
export function useProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuthStatus()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const currentPath = window.location.pathname
      router.push(`/auth/login?redirect=${encodeURIComponent(currentPath)}`)
    }
  }, [isAuthenticated, isLoading, router])

  return { isAuthenticated, isLoading }
}
