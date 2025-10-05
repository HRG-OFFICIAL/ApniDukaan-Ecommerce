'use client'

import Link from 'next/link'
import { cn } from '../../utils/cn'

interface LogoProps {
  variant?: 'default' | 'footer' | 'navbar' | 'auth'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  showTagline?: boolean
  className?: string
  href?: string
}

export function Logo({ 
  variant = 'default', 
  size = 'md', 
  showText = true, 
  showTagline = false,
  className = '',
  href = '/'
}: LogoProps) {
  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl', 
    xl: 'text-3xl'
  }

  const taglineSizeClasses = {
    sm: 'text-xs',
    md: 'text-xs',
    lg: 'text-sm',
    xl: 'text-sm'
  }

  const LogoText = () => (
    <div className="flex flex-col">
      <span className={cn(
        'font-bold text-gray-900',
        textSizeClasses[size]
      )}>
        ApniDukaan
      </span>
      {showTagline && (
        <span className={cn(
          'text-gray-500 leading-none',
          taglineSizeClasses[size]
        )}>
          Your Store, Your Way
        </span>
      )}
    </div>
  )

  const LogoContent = () => (
    <div className="flex items-center">
      {showText && <LogoText />}
    </div>
  )

  if (variant === 'footer') {
    return (
      <Link href={href} className={cn('flex items-center', className)}>
        <span className="text-2xl font-bold text-white">ApniDukaan</span>
      </Link>
    )
  }

  if (variant === 'auth') {
    return (
      <h1 className={cn('text-3xl font-bold text-blue-600', className)}>
        ApniDukaan
      </h1>
    )
  }

  if (variant === 'navbar') {
    return (
      <Link href={href} className={cn('flex-shrink-0', className)}>
        <div className="flex items-center">
          <div>
            <h1 className={cn('font-bold text-gray-900', textSizeClasses[size])}>
              ApniDukaan
            </h1>
            <p className={cn('text-gray-500 leading-none', taglineSizeClasses[size])}>
              Your Store, Your Way
            </p>
          </div>
        </div>
      </Link>
    )
  }

  // Default variant
  return (
    <Link href={href} className={cn('flex items-center space-x-2', className)}>
      <LogoContent />
    </Link>
  )
}
