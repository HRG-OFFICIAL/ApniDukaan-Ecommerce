'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStatus } from '../../hooks/useAuthAPI'
import { LoadingSpinner } from '../ui/LoadingSpinner'

interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
  requireRole?: 'user' | 'admin'
  fallback?: React.ReactNode
}

export function ProtectedRoute({ 
  children, 
  redirectTo = '/auth/login', 
  requireRole,
  fallback 
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuthStatus()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        // Redirect to login with return URL
        const currentPath = window.location.pathname + window.location.search
        router.push(`${redirectTo}?redirect=${encodeURIComponent(currentPath)}`)
        return
      }

      if (requireRole && user?.role !== requireRole) {
        // User doesn't have required role
        if (user?.role === 'admin' && requireRole === 'user') {
          // Admin can access user routes
          return
        }
        
        // Redirect to unauthorized page or home
        router.push('/unauthorized')
        return
      }
    }
  }, [isAuthenticated, isLoading, user, requireRole, router, redirectTo])

  // Show loading spinner while checking authentication
  if (isLoading) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // Show nothing while redirecting
  if (!isAuthenticated) {
    return null
  }

  // Check role requirements
  if (requireRole && user?.role !== requireRole && !(user?.role === 'admin' && requireRole === 'user')) {
    return null
  }

  // Render protected content
  return <>{children}</>
}

// Higher-order component version
export function withProtectedRoute<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<ProtectedRouteProps, 'children'>
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    )
  }
}

// Hook version for manual protection
export function useProtectedRoute(requireRole?: 'user' | 'admin') {
  const { isAuthenticated, isLoading, user } = useAuthStatus()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const currentPath = window.location.pathname + window.location.search
      router.push(`/auth/login?redirect=${encodeURIComponent(currentPath)}`)
    }
  }, [isAuthenticated, isLoading, router])

  const hasRequiredRole = !requireRole || 
    user?.role === requireRole || 
    (user?.role === 'admin' && requireRole === 'user')

  return {
    isAuthenticated,
    isLoading,
    user,
    hasRequiredRole,
    canAccess: isAuthenticated && hasRequiredRole
  }
}
