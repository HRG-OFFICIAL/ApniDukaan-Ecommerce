import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { User } from '../lib/api'

interface GuestUser {
  email: string
  name: string
  isGuest: boolean
  loginTime: string
}

interface AuthState {
  user: User | null
  guestUser: GuestUser | null
  token: string | null
  isAuthenticated: boolean
  isGuest: boolean
  isLoading: boolean
}

interface AuthActions {
  login: (user: User, token: string) => void
  guestLogin: (guestUser: GuestUser) => void
  logout: () => void
  setUser: (user: User) => void
  setLoading: (loading: boolean) => void
  clearAuth: () => void
}

type AuthStore = AuthState & AuthActions

const initialState: AuthState = {
  user: null,
  guestUser: null,
  token: null,
  isAuthenticated: false,
  isGuest: false,
  isLoading: false
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      ...initialState,
      
      login: (user: User, token: string) => {
        set({ 
          user, 
          guestUser: null,
          token, 
          isAuthenticated: true, 
          isGuest: false,
          isLoading: false 
        })
        
        // Store token in localStorage for Apollo Client
        if (typeof window !== 'undefined') {
          localStorage.setItem('authToken', token)
          localStorage.removeItem('guestUser')
        }
      },

      guestLogin: (guestUser: GuestUser) => {
        set({
          user: null,
          guestUser,
          token: null,
          isAuthenticated: true,
          isGuest: true,
          isLoading: false
        })
        
        // Store guest user in localStorage and set a guest token cookie
        if (typeof window !== 'undefined') {
          localStorage.setItem('guestUser', JSON.stringify(guestUser))
          localStorage.removeItem('authToken')
          localStorage.removeItem('refreshToken')
          
          // Set a guest token cookie for middleware
          const guestToken = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
          document.cookie = `authToken=${guestToken}; path=/; max-age=86400; SameSite=Lax`
        }
      },
      
      logout: () => {
        set(initialState)
        
        // Clear tokens from localStorage and cookies
        if (typeof window !== 'undefined') {
          localStorage.removeItem('authToken')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('guestUser')
          
          // Clear auth token cookie
          document.cookie = 'authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
        }
      },
      
      setUser: (user: User) => {
        set({ user })
      },
      
      setLoading: (isLoading: boolean) => {
        set({ isLoading })
      },
      
      clearAuth: () => {
        set(initialState)
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        user: state.user, 
        guestUser: state.guestUser,
        token: state.token, 
        isAuthenticated: state.isAuthenticated,
        isGuest: state.isGuest
      })
    }
  )
)
