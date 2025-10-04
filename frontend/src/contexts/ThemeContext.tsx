'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  actualTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
}

export function ThemeProvider({ children, defaultTheme = 'light' }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme)
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light')
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    if (typeof window !== 'undefined') {
      // Get theme from localStorage or use default
      const savedTheme = localStorage.getItem('theme') as Theme || defaultTheme
      setTheme(savedTheme)
      setActualTheme(savedTheme === 'system' ? 
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : 
        savedTheme
      )
    }
  }, [defaultTheme])

  useEffect(() => {
    if (!isClient || typeof window === 'undefined') return
    
    const root = document.documentElement

    if (theme === 'system') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const resolvedTheme = systemPrefersDark ? 'dark' : 'light'
      setActualTheme(resolvedTheme)
      root.classList.toggle('dark', resolvedTheme === 'dark')
      
      // Listen for system theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = (e: MediaQueryListEvent) => {
        const newTheme = e.matches ? 'dark' : 'light'
        setActualTheme(newTheme)
        root.classList.toggle('dark', newTheme === 'dark')
      }
      
      mediaQuery.addEventListener('change', handler)
      return () => mediaQuery.removeEventListener('change', handler)
    } else {
      const resolvedTheme = theme as 'light' | 'dark'
      setActualTheme(resolvedTheme)
      root.classList.toggle('dark', resolvedTheme === 'dark')
      return undefined
    }
  }, [isClient, theme])


  useEffect(() => {
    // Save theme to localStorage (client-side only)
    if (isClient && typeof window !== 'undefined') {
      localStorage.setItem('theme', theme)
    }
  }, [isClient, theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  const contextValue: ThemeContextType = {
    theme,
    actualTheme,
    setTheme,
    toggleTheme
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// Hook for components that only need to know the current theme
export const useActualTheme = () => {
  const { actualTheme } = useTheme()
  return actualTheme
}
