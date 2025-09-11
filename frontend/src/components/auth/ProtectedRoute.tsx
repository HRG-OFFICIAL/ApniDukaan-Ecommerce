'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStatus } from '../../hooks/useAuthAPI'
import { usePermissions, Permission } from '../../services/rbac'
import { LoadingSpinner } from '../ui/LoadingSpinner'

interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
  requireRole?: 'user' | 'admin' | 'moderator'
  requirePermission?: Permission
  requirePermissions?: Permission[]
  requireAllPermissions?: boolean
  fallback?: React.ReactNode
  showUnauthorized?: boolean
}

export function ProtectedRoute({ 
  children, 
  redirectTo = '/auth/login', 
  requireRole,
  requirePermission,
  requirePermissions = [],
  requireAllPermissions = false,
  fallback,
  showUnauthorized = true
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuthStatus()
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        // Redirect to login with return URL
        const currentPath = window.location.pathname + window.location.search
        router.push(`${redirectTo}?redirect=${encodeURIComponent(currentPath)}`)
        return
      }

      // Check role requirements
      if (requireRole && user?.role !== requireRole) {
        // User doesn't have required role
        if (user?.role === 'admin' && (requireRole === 'user' || requireRole === 'moderator')) {
          // Admin can access user and moderator routes
          return
        }
        
        if (user?.role === 'moderator' && requireRole === 'user') {
          // Moderator can access user routes
          return
        }
        
        // Redirect to unauthorized page or home
        if (showUnauthorized) {
          router.push('/unauthorized')
        } else {
          router.push('/')
        }
        return
      }

      // Check permission requirements
      if (requirePermission && !hasPermission(user, requirePermission)) {
        if (showUnauthorized) {
          router.push('/unauthorized')
        } else {
          router.push('/')
        }
        return
      }

      // Check multiple permissions requirements
      if (requirePermissions.length > 0) {
        const hasRequiredPermissions = requireAllPermissions
          ? hasAllPermissions(user, requirePermissions)
          : hasAnyPermission(user, requirePermissions)
        
        if (!hasRequiredPermissions) {
          if (showUnauthorized) {
            router.push('/unauthorized')
          } else {
            router.push('/')
          }
          return
        }
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
  if (requireRole && user?.role !== requireRole) {
    if (!(user?.role === 'admin' && (requireRole === 'user' || requireRole === 'moderator')) &&
        !(user?.role === 'moderator' && requireRole === 'user')) {
      return null
    }
  }

  // Check permission requirements
  if (requirePermission && !hasPermission(user, requirePermission)) {
    return null
  }

  if (requirePermissions.length > 0) {
    const hasRequiredPermissions = requireAllPermissions
      ? hasAllPermissions(user, requirePermissions)
      : hasAnyPermission(user, requirePermissions)
    
    if (!hasRequiredPermissions) {
      return null
    }
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
export function useProtectedRoute(
  requireRole?: 'user' | 'admin' | 'moderator',
  requirePermission?: Permission,
  requirePermissions?: Permission[],
  requireAllPermissions = false
) {
  const { isAuthenticated, isLoading, user } = useAuthStatus()
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const currentPath = window.location.pathname + window.location.search
      router.push(`/auth/login?redirect=${encodeURIComponent(currentPath)}`)
    }
  }, [isAuthenticated, isLoading, router])

  const hasRequiredRole = !requireRole || 
    user?.role === requireRole || 
    (user?.role === 'admin' && (requireRole === 'user' || requireRole === 'moderator')) ||
    (user?.role === 'moderator' && requireRole === 'user')

  const hasRequiredPermission = !requirePermission || hasPermission(user, requirePermission)
  
  const hasRequiredPermissions = !requirePermissions?.length || (
    requireAllPermissions
      ? hasAllPermissions(user, requirePermissions)
      : hasAnyPermission(user, requirePermissions)
  )

  return {
    isAuthenticated,
    isLoading,
    user,
    hasRequiredRole,
    hasRequiredPermission,
    hasRequiredPermissions,
    canAccess: isAuthenticated && hasRequiredRole && hasRequiredPermission && hasRequiredPermissions
  }
}
