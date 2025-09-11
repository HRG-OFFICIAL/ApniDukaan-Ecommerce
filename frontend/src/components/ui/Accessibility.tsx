import React from 'react'
import { cn } from '../../utils/cn'

// Skip Links Component for keyboard navigation
interface SkipLinksProps {
  links?: Array<{
    href: string
    label: string
  }>
}

export function SkipLinks({ links }: SkipLinksProps) {
  const defaultLinks = [
    { href: '#main-content', label: 'Skip to main content' },
    { href: '#navigation', label: 'Skip to navigation' },
    { href: '#footer', label: 'Skip to footer' }
  ]

  const skipLinks = links || defaultLinks

  return (
    <nav aria-label="Skip links" className="sr-only focus-within:not-sr-only">
      <ul className="flex flex-col gap-2 p-4 bg-blue-600 text-white fixed top-0 left-0 z-50">
        {skipLinks.map((link, index) => (
          <li key={index}>
            <a
              href={link.href}
              className="underline focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
              onKeyDown={(e) => {
                if (e.key === 'Tab' && index === skipLinks.length - 1) {
                  // Focus the target element after the last skip link
                  e.preventDefault()
                  const target = document.querySelector(skipLinks[0].href)
                  if (target instanceof HTMLElement) {
                    target.focus()
                  }
                }
              }}
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

// Screen Reader Only Text Component
interface ScreenReaderOnlyProps {
  children: React.ReactNode
  className?: string
}

export function ScreenReaderOnly({ children, className }: ScreenReaderOnlyProps) {
  return (
    <span className={cn('sr-only', className)}>
      {children}
    </span>
  )
}

// Live Region for Dynamic Content Announcements
interface LiveRegionProps {
  children: React.ReactNode
  politeness?: 'polite' | 'assertive' | 'off'
  atomic?: boolean
  relevant?: 'additions' | 'removals' | 'text' | 'all'
  className?: string
}

export function LiveRegion({ 
  children, 
  politeness = 'polite', 
  atomic = true,
  relevant = 'all',
  className 
}: LiveRegionProps) {
  return (
    <div
      aria-live={politeness}
      aria-atomic={atomic}
      aria-relevant={relevant}
      className={cn('sr-only', className)}
    >
      {children}
    </div>
  )
}

// Focus Trap Component for Modals/Dialogs
interface FocusTrapProps {
  children: React.ReactNode
  active?: boolean
  className?: string
}

export function FocusTrap({ children, active = true, className }: FocusTrapProps) {
  const trapRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!active || !trapRef.current) return

    const focusableElements = trapRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    
    // Focus first element when trap becomes active
    if (firstElement) {
      firstElement.focus()
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [active])

  if (!active) {
    return <>{children}</>
  }

  return (
    <div ref={trapRef} className={className}>
      {children}
    </div>
  )
}

// Keyboard Navigation Helper Hook
export function useKeyboardNavigation(
  items: HTMLElement[],
  options: {
    loop?: boolean
    vertical?: boolean
    horizontal?: boolean
  } = {}
) {
  const { loop = true, vertical = true, horizontal = false } = options
  const [focusedIndex, setFocusedIndex] = React.useState(0)

  const handleKeyDown = React.useCallback((e: KeyboardEvent) => {
    const { key } = e
    let nextIndex = focusedIndex

    if (vertical && (key === 'ArrowUp' || key === 'ArrowDown')) {
      e.preventDefault()
      nextIndex = key === 'ArrowUp' 
        ? focusedIndex - 1 
        : focusedIndex + 1
    }

    if (horizontal && (key === 'ArrowLeft' || key === 'ArrowRight')) {
      e.preventDefault()
      nextIndex = key === 'ArrowLeft' 
        ? focusedIndex - 1 
        : focusedIndex + 1
    }

    if (key === 'Home') {
      e.preventDefault()
      nextIndex = 0
    }

    if (key === 'End') {
      e.preventDefault()
      nextIndex = items.length - 1
    }

    // Handle looping
    if (loop) {
      if (nextIndex < 0) nextIndex = items.length - 1
      if (nextIndex >= items.length) nextIndex = 0
    } else {
      nextIndex = Math.max(0, Math.min(items.length - 1, nextIndex))
    }

    if (nextIndex !== focusedIndex && items[nextIndex]) {
      setFocusedIndex(nextIndex)
      items[nextIndex].focus()
    }
  }, [focusedIndex, items, loop, vertical, horizontal])

  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return {
    focusedIndex,
    setFocusedIndex
  }
}

// Accessible Button Component with Enhanced Features
interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  children: React.ReactNode
}

export function AccessibleButton({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  children,
  className,
  disabled,
  ...props
}: AccessibleButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-offset-2'
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
  }

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        disabled && 'opacity-50 cursor-not-allowed',
        loading && 'cursor-wait',
        className
      )}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg 
          className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      
      {!loading && icon && iconPosition === 'left' && (
        <span className="mr-2" aria-hidden="true">
          {icon}
        </span>
      )}
      
      <span>
        {loading ? 'Loading...' : children}
      </span>
      
      {!loading && icon && iconPosition === 'right' && (
        <span className="ml-2" aria-hidden="true">
          {icon}
        </span>
      )}
    </button>
  )
}
