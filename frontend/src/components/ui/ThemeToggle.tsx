'use client'

import React from 'react'
import { Sun, Moon, Monitor, Check } from 'lucide-react'
import { useTheme, Theme } from '../../contexts/ThemeContext'
import { Button } from './Button'

interface ThemeToggleProps {
  variant?: 'icon' | 'dropdown' | 'compact'
  className?: string
}

export function ThemeToggle({ variant = 'icon', className = '' }: ThemeToggleProps) {
  const { theme, actualTheme, setTheme } = useTheme()

  if (variant === 'icon') {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setTheme(actualTheme === 'dark' ? 'light' : 'dark')}
        className={`relative p-2 transition-all duration-300 ${className}`}
        aria-label="Toggle theme"
      >
        <div className="relative">
          {/* Sun icon */}
          <Sun 
            className={`h-5 w-5 absolute transition-all duration-300 ${
              actualTheme === 'dark' 
                ? 'scale-0 rotate-90 opacity-0' 
                : 'scale-100 rotate-0 opacity-100'
            }`} 
          />
          
          {/* Moon icon */}
          <Moon 
            className={`h-5 w-5 transition-all duration-300 ${
              actualTheme === 'dark' 
                ? 'scale-100 rotate-0 opacity-100' 
                : 'scale-0 rotate-90 opacity-0'
            }`} 
          />
        </div>
      </Button>
    )
  }

  if (variant === 'compact') {
    const themes: { value: Theme; icon: React.ElementType; label: string }[] = [
      { value: 'light', icon: Sun, label: 'Light' },
      { value: 'dark', icon: Moon, label: 'Dark' },
      { value: 'system', icon: Monitor, label: 'System' }
    ]

    return (
      <div className={`flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1 ${className}`}>
        {themes.map(({ value, icon: Icon, label }) => (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={`
              relative flex items-center justify-center p-2 rounded-md text-sm font-medium transition-all duration-200
              ${theme === value 
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }
            `}
            aria-label={`Switch to ${label} theme`}
            title={`Switch to ${label} theme`}
          >
            <Icon className="h-4 w-4" />
            <span className="sr-only">{label}</span>
          </button>
        ))}
      </div>
    )
  }

  if (variant === 'dropdown') {
    const themes: { value: Theme; icon: React.ElementType; label: string; description: string }[] = [
      { value: 'light', icon: Sun, label: 'Light', description: 'Always light mode' },
      { value: 'dark', icon: Moon, label: 'Dark', description: 'Always dark mode' },
      { value: 'system', icon: Monitor, label: 'System', description: 'Follow system preference' }
    ]

    return (
      <div className={`space-y-1 ${className}`}>
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Theme Preference
        </div>
        {themes.map(({ value, icon: Icon, label, description }) => (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={`
              w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-all duration-200
              ${theme === value 
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800' 
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }
            `}
          >
            <div className="flex-shrink-0">
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center">
                <p className="text-sm font-medium">{label}</p>
                {theme === value && (
                  <Check className="h-4 w-4 ml-auto text-blue-600 dark:text-blue-400" />
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
            </div>
          </button>
        ))}
      </div>
    )
  }

  return null
}

// Animated theme transition component
export function ThemeTransition({ children }: { children: React.ReactNode }) {
  return (
    <div className="transition-colors duration-300 ease-in-out">
      {children}
    </div>
  )
}
