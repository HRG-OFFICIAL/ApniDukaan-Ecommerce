'use client'

import { useAuthStore } from '../store/useAuthStore'
import toast from 'react-hot-toast'

interface OAuthProvider {
  name: string
  startUrl: string
  callbackUrl: string
}

const OAUTH_PROVIDERS: Record<string, OAuthProvider> = {
  google: {
    name: 'Google',
    startUrl: `${process.env.NEXT_PUBLIC_API_URL}/auth/google`,
    callbackUrl: '/auth/callback'
  },
  // Future providers can be added here
  // facebook: {
  //   name: 'Facebook',
  //   startUrl: `${process.env.NEXT_PUBLIC_API_URL}/auth/facebook`,
  //   callbackUrl: '/auth/callback'
  // }
}

export class OAuthService {
  private static instance: OAuthService
  private popupWindow: Window | null = null
  private checkInterval: NodeJS.Timeout | null = null

  static getInstance(): OAuthService {
    if (!OAuthService.instance) {
      OAuthService.instance = new OAuthService()
    }
    return OAuthService.instance
  }

  /**
   * Initiate OAuth login with popup window
   */
  async loginWithPopup(provider: keyof typeof OAUTH_PROVIDERS): Promise<{ success: boolean; error?: string }> {
    const oauthProvider = OAUTH_PROVIDERS[provider]
    if (!oauthProvider) {
      return { success: false, error: 'Invalid OAuth provider' }
    }

    return new Promise((resolve) => {
      try {
        // Create popup window
        const width = 500
        const height = 600
        const left = window.screen.width / 2 - width / 2
        const top = window.screen.height / 2 - height / 2

        this.popupWindow = window.open(
          oauthProvider.startUrl,
          `oauth_${provider}`,
          `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
        )

        if (!this.popupWindow) {
          resolve({ success: false, error: 'Popup blocked. Please allow popups for this site.' })
          return
        }

        // Check for popup close or success
        this.checkInterval = setInterval(() => {
          try {
            if (this.popupWindow?.closed) {
              this.cleanup()
              resolve({ success: false, error: 'OAuth cancelled by user' })
              return
            }

            // Check if popup navigated to callback URL
            if (this.popupWindow?.location.href.includes(oauthProvider.callbackUrl)) {
              const url = new URL(this.popupWindow.location.href)
              const accessToken = url.searchParams.get('accessToken')
              const refreshToken = url.searchParams.get('refreshToken')
              const error = url.searchParams.get('error')

              this.cleanup()

              if (error) {
                resolve({ success: false, error: decodeURIComponent(error) })
              } else if (accessToken) {
                // Handle successful authentication
                this.handleOAuthSuccess(accessToken, refreshToken)
                resolve({ success: true })
              } else {
                resolve({ success: false, error: 'No authentication tokens received' })
              }
            }
          } catch (e) {
            // Cross-origin error means we're still on the OAuth provider's domain
            // This is normal during the OAuth flow
          }
        }, 1000)

        // Timeout after 5 minutes
        setTimeout(() => {
          if (this.checkInterval) {
            this.cleanup()
            resolve({ success: false, error: 'OAuth timeout' })
          }
        }, 300000)

      } catch (error) {
        this.cleanup()
        resolve({ success: false, error: 'Failed to initialize OAuth flow' })
      }
    })
  }

  /**
   * Initiate OAuth login with redirect
   */
  loginWithRedirect(provider: keyof typeof OAUTH_PROVIDERS): void {
    const oauthProvider = OAUTH_PROVIDERS[provider]
    if (!oauthProvider) {
      toast.error('Invalid OAuth provider')
      return
    }

    // Store current URL for redirect after login
    const currentUrl = window.location.href
    localStorage.setItem('oauth_redirect_url', currentUrl)

    // Redirect to OAuth provider
    window.location.href = oauthProvider.startUrl
  }

  /**
   * Handle OAuth callback (for redirect flow)
   */
  handleCallback(): { success: boolean; error?: string } {
    try {
      const url = new URL(window.location.href)
      const accessToken = url.searchParams.get('accessToken')
      const refreshToken = url.searchParams.get('refreshToken')
      const error = url.searchParams.get('error')

      if (error) {
        return { success: false, error: decodeURIComponent(error) }
      }

      if (accessToken) {
        this.handleOAuthSuccess(accessToken, refreshToken)
        return { success: true }
      }

      return { success: false, error: 'No authentication tokens received' }
    } catch (error) {
      return { success: false, error: 'Failed to process OAuth callback' }
    }
  }

  /**
   * Handle successful OAuth authentication
   */
  private async handleOAuthSuccess(accessToken: string, refreshToken?: string | null): Promise<void> {
    try {
      // Decode JWT to get user info (basic implementation)
      const payload = this.decodeJWT(accessToken)
      if (!payload) {
        throw new Error('Invalid access token')
      }

      const user = {
        id: payload.sub || payload.id,
        email: payload.email,
        name: payload.name || payload.given_name + ' ' + payload.family_name,
        role: payload.role || 'user' as 'user' | 'admin',
        avatar: payload.picture || payload.avatar,
        createdAt: new Date().toISOString()
      }

      // Store in auth store
      const authStore = useAuthStore.getState()
      authStore.login(user, accessToken)

      // Store refresh token if provided
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken)
      }

      toast.success('Login successful!')

      // Redirect to original URL or home
      const redirectUrl = localStorage.getItem('oauth_redirect_url')
      if (redirectUrl) {
        localStorage.removeItem('oauth_redirect_url')
        window.location.href = redirectUrl
      }

    } catch (error) {
      console.error('OAuth success handler error:', error)
      toast.error('Authentication failed. Please try again.')
    }
  }

  /**
   * Simple JWT decoder (for client-side parsing only)
   */
  private decodeJWT(token: string): any {
    try {
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
      return JSON.parse(jsonPayload)
    } catch (error) {
      console.error('JWT decode error:', error)
      return null
    }
  }

  /**
   * Cleanup popup and intervals
   */
  private cleanup(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
    if (this.popupWindow) {
      this.popupWindow.close()
      this.popupWindow = null
    }
  }

  /**
   * Check if OAuth is supported
   */
  isSupported(): boolean {
    return typeof window !== 'undefined' && 
           !!window.open && 
           !!process.env.NEXT_PUBLIC_API_URL &&
           Object.keys(OAUTH_PROVIDERS).length > 0
  }
}

// Export singleton instance
export const oauthService = OAuthService.getInstance()

// React hook for OAuth
export function useOAuth() {
  const loginWithGoogle = async (usePopup = true): Promise<{ success: boolean; error?: string }> => {
    if (!oauthService.isSupported()) {
      return { success: false, error: 'OAuth not supported in this environment' }
    }

    if (usePopup) {
      return await oauthService.loginWithPopup('google')
    } else {
      oauthService.loginWithRedirect('google')
      return { success: true } // Redirect doesn't return immediately
    }
  }

  const handleCallback = (): { success: boolean; error?: string } => {
    return oauthService.handleCallback()
  }

  return {
    loginWithGoogle,
    handleCallback,
    isSupported: oauthService.isSupported()
  }
}
