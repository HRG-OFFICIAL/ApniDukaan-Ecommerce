'use client'

import React, { useState, useRef, useEffect, forwardRef } from 'react'
import { ChevronDown, X, Check } from 'lucide-react'
import { cn } from '../../utils/cn'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SelectProps {
  options: SelectOption[]
  value?: string | string[]
  onChange: (value: string | string[]) => void
  placeholder?: string
  label?: string
  error?: string
  disabled?: boolean
  multiple?: boolean
  searchable?: boolean
  clearable?: boolean
  className?: string
  maxHeight?: number
}

const Select = forwardRef<HTMLDivElement, SelectProps>(({
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  label,
  error,
  disabled = false,
  multiple = false,
  searchable = false,
  clearable = false,
  className,
  maxHeight = 200
}, ref) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedValues = Array.isArray(value) ? value : value ? [value] : []
  const selectedOptions = options.filter(option => selectedValues.includes(option.value))

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen, searchable])

  const handleOptionClick = (optionValue: string) => {
    if (multiple) {
      const newValue = selectedValues.includes(optionValue)
        ? selectedValues.filter(v => v !== optionValue)
        : [...selectedValues, optionValue]
      onChange(newValue)
    } else {
      onChange(optionValue)
      setIsOpen(false)
    }
    setSearchTerm('')
  }

  const handleRemoveOption = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (multiple) {
      onChange(selectedValues.filter(v => v !== optionValue))
    } else {
      onChange('')
    }
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(multiple ? [] : '')
    setSearchTerm('')
  }

  const getDisplayText = () => {
    if (selectedOptions.length === 0) return placeholder
    if (!multiple) return selectedOptions[0]?.label
    if (selectedOptions.length === 1) return selectedOptions[0].label
    return `${selectedOptions.length} items selected`
  }

  return (
    <div className={cn('relative w-full', className)} ref={ref}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}

      <div
        ref={dropdownRef}
        className={cn(
          'relative w-full cursor-pointer rounded-md border border-gray-300 bg-white px-3 py-2.5 text-left shadow-sm transition-colors',
          'focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500',
          disabled && 'cursor-not-allowed opacity-50 bg-gray-50',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
          isOpen && 'border-primary-500 ring-1 ring-primary-500'
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1 flex-1 min-w-0">
            {multiple && selectedOptions.length > 0 ? (
              selectedOptions.map(option => (
                <span
                  key={option.value}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-800 text-xs font-medium rounded"
                >
                  {option.label}
                  <button
                    type="button"
                    onClick={(e) => handleRemoveOption(option.value, e)}
                    className="hover:bg-primary-200 rounded p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))
            ) : (
              <span className={cn(
                'block truncate',
                selectedOptions.length === 0 && 'text-gray-500'
              )}>
                {getDisplayText()}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 ml-2">
            {clearable && selectedOptions.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className="hover:bg-gray-100 rounded p-1"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            )}
            <ChevronDown 
              className={cn(
                'h-4 w-4 text-gray-400 transition-transform',
                isOpen && 'rotate-180'
              )} 
            />
          </div>
        </div>

        {isOpen && (
          <div 
            className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg"
            style={{ maxHeight: maxHeight + 'px' }}
          >
            {searchable && (
              <div className="p-2 border-b border-gray-200">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search options..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}

            <div className="max-h-48 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500">
                  No options found
                </div>
              ) : (
                filteredOptions.map(option => {
                  const isSelected = selectedValues.includes(option.value)
                  return (
                    <div
                      key={option.value}
                      className={cn(
                        'flex items-center justify-between px-3 py-2 text-sm cursor-pointer hover:bg-gray-50',
                        option.disabled && 'opacity-50 cursor-not-allowed',
                        isSelected && 'bg-primary-50 text-primary-900'
                      )}
                      onClick={() => !option.disabled && handleOptionClick(option.value)}
                    >
                      <span className="truncate">{option.label}</span>
                      {isSelected && (
                        <Check className="h-4 w-4 text-primary-600" />
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
})

Select.displayName = 'Select'

export { Select }
export type { SelectProps }
