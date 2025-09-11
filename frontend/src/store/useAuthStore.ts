import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface User {
  id: string
  email: string
  name: string
  role: 'user' | 'admin' | 'moderator'
  avatar?: string
  createdAt: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

interface AuthActions {
  login: (user: User, token: string) => void
  logout: () => void
  setUser: (user: User) => void
  setLoading: (loading: boolean) => void
  clearAuth: () => void
}

type AuthStore = AuthState & AuthActions

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      ...initialState,
      
      login: (user: User, token: string) => {
        set({ 
          user, 
          token, 
          isAuthenticated: true, 
          isLoading: false 
        })
        
        // Store token in localStorage for Apollo Client
        if (typeof window !== 'undefined') {
          localStorage.setItem('authToken', token)
        }
      },
      
      logout: () => {
        set(initialState)
        
        // Clear tokens from localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('authToken')
          localStorage.removeItem('refreshToken')
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
        token: state.token, 
        isAuthenticated: state.isAuthenticated 
      })
    }
  )
)
