'use client'

import { useAuthStore } from '../store/useAuthStore'
import toast from 'react-hot-toast'

interface SessionData {
  accessToken: string
  refreshToken: string
  expiresAt: number
  user: any
}

export class SessionManager {
  private static instance: SessionManager
  private refreshTimer: NodeJS.Timeout | null = null
  private storageEventListener: ((e: StorageEvent) => void) | null = null
  private isRefreshing = false
  private refreshPromise: Promise<boolean> | null = null

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager()
    }
    return SessionManager.instance
  }

  /**
   * Initialize session management
   */
  initialize() {
    if (typeof window === 'undefined') return

    // Set up storage event listener for cross-tab synchronization
    this.setupCrossTabSync()
    
    // Check if we have a valid session on startup
    this.validateCurrentSession()
    
    // Set up automatic token refresh
    this.setupAutoRefresh()
  }

  /**
   * Set up cross-tab synchronization
   */
  private setupCrossTabSync() {
    if (typeof window === 'undefined') return

    this.storageEventListener = (e: StorageEvent) => {
      if (e.key === 'auth-storage' && e.newValue !== e.oldValue) {
        // Another tab updated the auth state
        const authStore = useAuthStore.getState()
        
        if (e.newValue) {
          try {
            const newAuth = JSON.parse(e.newValue)
            
            // If another tab logged in/out, sync the state
            if (newAuth.isAuthenticated !== authStore.isAuthenticated) {
              if (newAuth.isAuthenticated) {
                authStore.login(newAuth.user, newAuth.token)
                toast.success('Signed in from another tab')
              } else {
                authStore.logout()
                toast('Signed out from another tab')
              }
            }
          } catch (error) {
            console.error('Error parsing auth storage event:', error)
          }
        } else {
          // Auth storage was cleared in another tab
          authStore.logout()
          toast('Signed out from another tab')
        }
      }
    }

    window.addEventListener('storage', this.storageEventListener)
  }

  /**
   * Validate current session on startup
   */
  private validateCurrentSession() {
    if (typeof window === 'undefined') return

    const authStore = useAuthStore.getState()
    const token = localStorage.getItem('authToken')
    
    if (authStore.isAuthenticated && token) {
      // Check if token is expired
      if (this.isTokenExpired(token)) {
        console.log('Session expired, attempting refresh...')
        this.refreshSession()
      } else {
        // Token is still valid, set up refresh timer
        this.scheduleTokenRefresh(token)
      }
    }
  }

  /**
   * Set up automatic token refresh
   */
  private setupAutoRefresh() {
    // Clear any existing timer
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
    }

    const authStore = useAuthStore.getState()
    const token = authStore.token

    if (token && authStore.isAuthenticated) {
      this.scheduleTokenRefresh(token)
    }
  }

  /**
   * Schedule token refresh based on expiration time
   */
  private scheduleTokenRefresh(token: string) {
    if (typeof window === 'undefined') return

    const expirationTime = this.getTokenExpiration(token)
    if (!expirationTime) return

    // Refresh token 5 minutes before it expires
    const refreshTime = expirationTime - Date.now() - (5 * 60 * 1000)
    
    if (refreshTime > 0) {
      this.refreshTimer = setTimeout(() => {
        console.log('Auto-refreshing token...')
        this.refreshSession()
      }, refreshTime)
    } else {
      // Token expires soon or is already expired
      this.refreshSession()
    }
  }

  /**
   * Check if token is expired
   */
  private isTokenExpired(token: string): boolean {
    const expirationTime = this.getTokenExpiration(token)
    return expirationTime ? Date.now() >= expirationTime : false
  }

  /**
   * Get token expiration time
   */
  private getTokenExpiration(token: string): number | null {
    try {
      const payload = this.parseJWTPayload(token)
      return payload.exp ? payload.exp * 1000 : null
    } catch (error) {
      console.error('Error parsing token expiration:', error)
      return null
    }
  }

  /**
   * Parse JWT payload
   */
  private parseJWTPayload(token: string): any {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  }

  /**
   * Refresh the current session
   */
  async refreshSession(): Promise<boolean> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise
    }

    this.isRefreshing = true
    this.refreshPromise = this._performRefresh()
    
    const result = await this.refreshPromise
    this.isRefreshing = false
    this.refreshPromise = null
    
    return result
  }

  /**
   * Perform the actual token refresh
   */
  private async _performRefresh(): Promise<boolean> {
    try {
      const refreshToken = localStorage.getItem('refreshToken')
      if (!refreshToken) {
        throw new Error('No refresh token available')
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken })
      })

      if (!response.ok) {
        throw new Error('Token refresh failed')
      }

      const data = await response.json()
      
      if (data.accessToken) {
        // Update tokens in storage
        localStorage.setItem('authToken', data.accessToken)
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken)
        }

        // Update auth store
        const authStore = useAuthStore.getState()
        if (authStore.user) {
          authStore.login(authStore.user, data.accessToken)
        }

        // Schedule next refresh
        this.scheduleTokenRefresh(data.accessToken)

        console.log('Token refreshed successfully')
        return true
      }

      throw new Error('No access token in refresh response')
    } catch (error) {
      console.error('Token refresh failed:', error)
      this.handleRefreshFailure()
      return false
    }
  }

  /**
   * Handle refresh failure by logging out user
   */
  private handleRefreshFailure() {
    console.log('Refresh failed, logging out user...')
    
    // Clear all auth data
    localStorage.removeItem('authToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    
    // Clear auth store
    const authStore = useAuthStore.getState()
    authStore.logout()
    
    // Clear refresh timer
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
      this.refreshTimer = null
    }
    
    // Show notification
    toast.error('Session expired. Please log in again.')
    
    // Redirect to login if not already on auth pages
    if (typeof window !== 'undefined' && 
        !window.location.pathname.startsWith('/auth/') &&
        window.location.pathname !== '/') {
      window.location.href = '/auth/login'
    }
  }

  /**
   * Extend current session (called after user activity)
   */
  extendSession() {
    const authStore = useAuthStore.getState()
    
    if (authStore.isAuthenticated && authStore.token) {
      // Update last activity timestamp
      localStorage.setItem('lastActivity', Date.now().toString())
      
      // Reset refresh timer if token is still valid for a while
      const expirationTime = this.getTokenExpiration(authStore.token)
      if (expirationTime && (expirationTime - Date.now()) > (10 * 60 * 1000)) {
        this.scheduleTokenRefresh(authStore.token)
      }
    }
  }

  /**
   * Force logout and clear all session data
   */
  forceLogout() {
    // Clear timers
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
      this.refreshTimer = null
    }

    // Clear storage
    localStorage.removeItem('authToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    localStorage.removeItem('lastActivity')

    // Clear auth store
    const authStore = useAuthStore.getState()
    authStore.logout()
  }

  /**
   * Get session info
   */
  getSessionInfo(): {
    isValid: boolean
    expiresAt: number | null
    timeUntilExpiry: number | null
  } {
    const authStore = useAuthStore.getState()
    
    if (!authStore.isAuthenticated || !authStore.token) {
      return {
        isValid: false,
        expiresAt: null,
        timeUntilExpiry: null
      }
    }

    const expirationTime = this.getTokenExpiration(authStore.token)
    const timeUntilExpiry = expirationTime ? expirationTime - Date.now() : null

    return {
      isValid: !this.isTokenExpired(authStore.token),
      expiresAt: expirationTime,
      timeUntilExpiry
    }
  }

  /**
   * Clean up resources
   */
  cleanup() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
      this.refreshTimer = null
    }

    if (this.storageEventListener && typeof window !== 'undefined') {
      window.removeEventListener('storage', this.storageEventListener)
      this.storageEventListener = null
    }
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance()

// Activity tracking for session extension
let activityTimer: NodeJS.Timeout | null = null

export function trackUserActivity() {
  if (typeof window === 'undefined') return

  const extendSession = () => {
    sessionManager.extendSession()
  }

  // Throttle activity tracking to avoid excessive calls
  const throttledExtend = () => {
    if (activityTimer) clearTimeout(activityTimer)
    activityTimer = setTimeout(extendSession, 30000) // Extend every 30 seconds of activity
  }

  // Track various user activities
  const activities = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
  
  activities.forEach(activity => {
    window.addEventListener(activity, throttledExtend, { passive: true })
  })

  return () => {
    activities.forEach(activity => {
      window.removeEventListener(activity, throttledExtend)
    })
    if (activityTimer) {
      clearTimeout(activityTimer)
      activityTimer = null
    }
  }
}

// React hooks for session management
export function useSessionManager() {
  const refreshSession = () => sessionManager.refreshSession()
  const getSessionInfo = () => sessionManager.getSessionInfo()
  const forceLogout = () => sessionManager.forceLogout()

  return {
    refreshSession,
    getSessionInfo,
    forceLogout,
    sessionManager
  }
}
