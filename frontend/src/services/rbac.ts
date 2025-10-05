'use client'

import type { User } from '../lib/api'

// Define available permissions
export enum Permission {
  // User permissions
  USER_VIEW_PROFILE = 'user:view_profile',
  USER_EDIT_PROFILE = 'user:edit_profile',
  USER_DELETE_ACCOUNT = 'user:delete_account',
  
  // Product permissions
  PRODUCT_VIEW = 'product:view',
  PRODUCT_CREATE = 'product:create',
  PRODUCT_EDIT = 'product:edit',
  PRODUCT_DELETE = 'product:delete',
  PRODUCT_MANAGE_INVENTORY = 'product:manage_inventory',
  
  // Order permissions
  ORDER_VIEW_OWN = 'order:view_own',
  ORDER_VIEW_ALL = 'order:view_all',
  ORDER_CREATE = 'order:create',
  ORDER_EDIT = 'order:edit',
  ORDER_CANCEL = 'order:cancel',
  ORDER_FULFILL = 'order:fulfill',
  
  // Cart permissions
  CART_VIEW = 'cart:view',
  CART_EDIT = 'cart:edit',
  
  // Admin permissions
  ADMIN_DASHBOARD_VIEW = 'admin:dashboard_view',
  ADMIN_USER_MANAGE = 'admin:user_manage',
  ADMIN_ANALYTICS_VIEW = 'admin:analytics_view',
  ADMIN_SETTINGS_MANAGE = 'admin:settings_manage',
  ADMIN_CONTENT_MANAGE = 'admin:content_manage',
  
  // System permissions
  SYSTEM_BACKUP = 'system:backup',
  SYSTEM_LOGS_VIEW = 'system:logs_view'
}

// Define base permissions for each role
const USER_PERMISSIONS = [
  Permission.USER_VIEW_PROFILE,
  Permission.USER_EDIT_PROFILE,
  Permission.PRODUCT_VIEW,
  Permission.ORDER_VIEW_OWN,
  Permission.ORDER_CREATE,
  Permission.ORDER_CANCEL,
  Permission.CART_VIEW,
  Permission.CART_EDIT
]

const GUEST_PERMISSIONS = [
  Permission.PRODUCT_VIEW
]

// Define roles with their permissions
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  guest: GUEST_PERMISSIONS,
  
  user: USER_PERMISSIONS,
  
  moderator: [
    // Moderator has all user permissions plus additional ones
    ...USER_PERMISSIONS,
    Permission.PRODUCT_EDIT,
    Permission.PRODUCT_MANAGE_INVENTORY,
    Permission.ORDER_VIEW_ALL,
    Permission.ORDER_EDIT,
    Permission.ORDER_FULFILL,
    Permission.ADMIN_DASHBOARD_VIEW,
    Permission.ADMIN_CONTENT_MANAGE
  ],
  
  admin: [
    // Admin has all permissions
    ...Object.values(Permission)
  ]
}

// RBAC Service Class
export class RBACService {
  private static instance: RBACService

  static getInstance(): RBACService {
    if (!RBACService.instance) {
      RBACService.instance = new RBACService()
    }
    return RBACService.instance
  }

  /**
   * Check if user has a specific permission
   */
  hasPermission(user: User | null, permission: Permission): boolean {
    if (!user) {
      return ROLE_PERMISSIONS.guest.includes(permission)
    }

    const userRole = user.role || 'user'
    const permissions = ROLE_PERMISSIONS[userRole] || []
    return permissions.includes(permission)
  }

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(user: User | null, permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(user, permission))
  }

  /**
   * Check if user has all of the specified permissions
   */
  hasAllPermissions(user: User | null, permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(user, permission))
  }

  /**
   * Get all permissions for a user
   */
  getUserPermissions(user: User | null): Permission[] {
    if (!user) {
      return ROLE_PERMISSIONS.guest
    }

    const userRole = user.role || 'user'
    return ROLE_PERMISSIONS[userRole] || []
  }

  /**
   * Check if user can access a specific route
   */
  canAccessRoute(user: User | null, route: string): boolean {
    const routePermissions = this.getRoutePermissions(route)
    return this.hasAnyPermission(user, routePermissions)
  }

  /**
   * Get required permissions for a route
   */
  private getRoutePermissions(route: string): Permission[] {
    const routeMap: Record<string, Permission[]> = {
      '/admin': [Permission.ADMIN_DASHBOARD_VIEW],
      '/admin/dashboard': [Permission.ADMIN_DASHBOARD_VIEW],
      '/admin/users': [Permission.ADMIN_USER_MANAGE],
      '/admin/products': [Permission.PRODUCT_CREATE, Permission.PRODUCT_EDIT, Permission.PRODUCT_DELETE],
      '/admin/orders': [Permission.ORDER_VIEW_ALL],
      '/admin/analytics': [Permission.ADMIN_ANALYTICS_VIEW],
      '/admin/settings': [Permission.ADMIN_SETTINGS_MANAGE],
      
      '/profile': [Permission.USER_VIEW_PROFILE],
      '/account': [Permission.USER_VIEW_PROFILE],
      '/orders': [Permission.ORDER_VIEW_OWN],
      '/cart': [Permission.CART_VIEW],
      '/checkout': [Permission.ORDER_CREATE],
      
      '/products': [Permission.PRODUCT_VIEW],
      '/': [Permission.PRODUCT_VIEW]
    }

    // Find matching route pattern
    for (const [pattern, permissions] of Object.entries(routeMap)) {
      if (route.startsWith(pattern)) {
        return permissions
      }
    }

    // Default: require basic product view permission
    return [Permission.PRODUCT_VIEW]
  }

  /**
   * Get user-friendly role name
   */
  getRoleName(role: string): string {
    const roleNames: Record<string, string> = {
      'user': 'Customer',
      'admin': 'Administrator',
      'moderator': 'Moderator',
      'guest': 'Guest'
    }

    return roleNames[role] || 'Unknown'
  }

  /**
   * Check if role can be upgraded to target role
   */
  canUpgradeRole(currentRole: string, targetRole: string, actorRole: string): boolean {
    const roleHierarchy: Record<string, number> = {
      'guest': 0,
      'user': 1,
      'moderator': 2,
      'admin': 3
    }

    const currentLevel = roleHierarchy[currentRole] || 0
    const targetLevel = roleHierarchy[targetRole] || 0
    const actorLevel = roleHierarchy[actorRole] || 0

    // Actor must have higher level than both current and target roles
    return actorLevel > Math.max(currentLevel, targetLevel)
  }

  /**
   * Filter menu items based on user permissions
   */
  filterMenuItems(user: User | null, menuItems: MenuItem[]): MenuItem[] {
    return menuItems.filter(item => {
      if (!item.permission) return true
      return this.hasPermission(user, item.permission)
    }).map(item => ({
      ...item,
      children: item.children ? this.filterMenuItems(user, item.children) : undefined
    }))
  }
}

// Menu item interface for permission-based filtering
export interface MenuItem {
  id: string
  label: string
  path?: string
  permission?: Permission
  children?: MenuItem[]
  icon?: string
}

// Export singleton instance
export const rbacService = RBACService.getInstance()

// React hooks for RBAC
export function usePermissions() {
  const hasPermission = (user: User | null, permission: Permission): boolean => {
    return rbacService.hasPermission(user, permission)
  }

  const hasAnyPermission = (user: User | null, permissions: Permission[]): boolean => {
    return rbacService.hasAnyPermission(user, permissions)
  }

  const hasAllPermissions = (user: User | null, permissions: Permission[]): boolean => {
    return rbacService.hasAllPermissions(user, permissions)
  }

  const canAccessRoute = (user: User | null, route: string): boolean => {
    return rbacService.canAccessRoute(user, route)
  }

  const getUserPermissions = (user: User | null): Permission[] => {
    return rbacService.getUserPermissions(user)
  }

  const filterMenuItems = (user: User | null, items: MenuItem[]): MenuItem[] => {
    return rbacService.filterMenuItems(user, items)
  }

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessRoute,
    getUserPermissions,
    filterMenuItems,
    rbacService
  }
}

