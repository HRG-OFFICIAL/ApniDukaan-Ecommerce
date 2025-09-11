'use client'

import React from 'react'
import { User } from '../../store/useAuthStore'
import { Permission, usePermissions } from '../../services/rbac'

// Permission-based component wrapper
interface PermissionGuardProps {
  user: User | null
  permission: Permission
  permissions?: Permission[]
  requireAll?: boolean
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function PermissionGuard({
  user,
  permission,
  permissions = [],
  requireAll = false,
  fallback = null,
  children
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions()

  let hasAccess = false

  if (permissions.length > 0) {
    hasAccess = requireAll 
      ? hasAllPermissions(user, permissions)
      : hasAnyPermission(user, permissions)
  } else {
    hasAccess = hasPermission(user, permission)
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>
}
