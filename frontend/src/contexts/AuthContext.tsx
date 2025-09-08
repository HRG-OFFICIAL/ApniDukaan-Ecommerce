'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface User {
  id: string
  email: string
  name: string
  role: 'user' | 'admin'
  avatar?: string
  createdAt: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

interface AuthContextType extends AuthState {
  login: (user: User, token: string) => void
  logout: () => void
  setUser: (user: User) => void
  setLoading: (loading: boolean) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false
  })

  // Load persisted state only on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const persistedAuth = localStorage.getItem('auth-storage')
        if (persistedAuth) {
          const parsedAuth = JSON.parse(persistedAuth)
          setState(parsedAuth)
        }
      } catch (error) {
        console.error('Error loading persisted auth:', error)
      }
    }
  }, [])

  // Persist state changes only on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('auth-storage', JSON.stringify(state))
      } catch (error) {
        console.error('Error persisting auth:', error)
      }
    }
  }, [state])

  const login = (user: User, token: string) => {
    setState({ user, token, isAuthenticated: true, isLoading: false })
  }

  const logout = () => {
    setState({ user: null, token: null, isAuthenticated: false, isLoading: false })
  }

  const setUser = (user: User) => {
    setState(prev => ({ ...prev, user }))
  }

  const setLoading = (isLoading: boolean) => {
    setState(prev => ({ ...prev, isLoading }))
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout, setUser, setLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// For backward compatibility, create a hook that matches the old store interface
export function useAuthStore() {
  return useAuth()
}
