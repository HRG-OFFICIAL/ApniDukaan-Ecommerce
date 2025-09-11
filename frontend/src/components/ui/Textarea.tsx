'use client'

import React, { forwardRef, useEffect, useRef } from 'react'
import { cn } from '../../utils/cn'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
  variant?: 'default' | 'filled' | 'outlined'
  resize?: 'none' | 'vertical' | 'horizontal' | 'both' | 'auto'
  showCharCount?: boolean
  maxLength?: number
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({
    className,
    label,
    error,
    helperText,
    variant = 'default',
    resize = 'vertical',
    showCharCount = false,
    maxLength,
    disabled,
    value,
    ...props
  }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const combinedRef = (ref as any) || textareaRef

    const variantClasses = {
      default: 'border border-gray-300 bg-white focus:border-primary-500 focus:ring-primary-500',
      filled: 'border-0 bg-gray-100 focus:bg-white focus:ring-2 focus:ring-primary-500',
      outlined: 'border-2 border-gray-300 bg-transparent focus:border-primary-500'
    }

    const resizeClasses = {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x',
      both: 'resize',
      auto: 'resize-none'
    }

    // Auto-resize functionality
    useEffect(() => {
      if (resize === 'auto' && combinedRef.current) {
        const textarea = combinedRef.current
        textarea.style.height = 'auto'
        textarea.style.height = textarea.scrollHeight + 'px'
      }
    }, [value, resize])

    const characterCount = typeof value === 'string' ? value.length : 0
    const isOverLimit = maxLength ? characterCount > maxLength : false

    const baseClasses = cn(
      'w-full min-h-[80px] px-3 py-2.5 text-sm rounded-md shadow-sm transition-colors',
      'focus:outline-none focus:ring-1',
      'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50',
      'placeholder:text-gray-500',
      variantClasses[variant],
      resizeClasses[resize],
      error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
      className
    )

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <textarea
          className={baseClasses}
          ref={combinedRef}
          disabled={disabled}
          value={value}
          maxLength={maxLength}
          {...props}
        />
        
        <div className="flex justify-between items-center mt-1">
          <div>
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            {helperText && !error && (
              <p className="text-sm text-gray-500">{helperText}</p>
            )}
          </div>
          
          {showCharCount && (
            <div className="text-xs text-gray-500">
              <span className={cn(isOverLimit && 'text-red-500')}>
                {characterCount}
              </span>
              {maxLength && (
                <span>/{maxLength}</span>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

export { Textarea }
