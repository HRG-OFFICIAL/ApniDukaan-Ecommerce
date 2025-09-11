/**
 * Validation utilities for forms and data validation
 */

// Email validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

// Phone number validation (US format)
export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\+?1?[-.\s]?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/
  return phoneRegex.test(phone.replace(/\s+/g, ''))
}

// Password strength validation
export const validatePassword = (password: string): {
  isValid: boolean
  errors: string[]
  strength: 'weak' | 'medium' | 'strong'
} => {
  const errors: string[] = []
  let score = 0

  // Check length
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  } else {
    score += 1
  }

  // Check for lowercase
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  } else {
    score += 1
  }

  // Check for uppercase
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  } else {
    score += 1
  }

  // Check for numbers
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  } else {
    score += 1
  }

  // Check for special characters
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character')
  } else {
    score += 1
  }

  // Determine strength
  let strength: 'weak' | 'medium' | 'strong'
  if (score <= 2) {
    strength = 'weak'
  } else if (score <= 4) {
    strength = 'medium'
  } else {
    strength = 'strong'
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength
  }
}

// Credit card validation
export const validateCreditCard = (cardNumber: string): {
  isValid: boolean
  brand: string | null
} => {
  // Remove all non-digit characters
  const cleaned = cardNumber.replace(/\D/g, '')

  // Check if empty
  if (!cleaned) {
    return { isValid: false, brand: null }
  }

  // Luhn algorithm
  const luhnCheck = (num: string): boolean => {
    let sum = 0
    let alternate = false
    
    for (let i = num.length - 1; i >= 0; i--) {
      let n = parseInt(num.charAt(i), 10)
      
      if (alternate) {
        n *= 2
        if (n > 9) {
          n = (n % 10) + 1
        }
      }
      
      sum += n
      alternate = !alternate
    }
    
    return sum % 10 === 0
  }

  // Determine card brand
  const getBrand = (num: string): string | null => {
    if (/^4/.test(num)) return 'Visa'
    if (/^5[1-5]/.test(num)) return 'Mastercard'
    if (/^3[47]/.test(num)) return 'American Express'
    if (/^6(?:011|5)/.test(num)) return 'Discover'
    return null
  }

  const isValid = luhnCheck(cleaned) && cleaned.length >= 13 && cleaned.length <= 19
  const brand = getBrand(cleaned)

  return { isValid, brand }
}

// URL validation
export const isValidURL = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// Zip code validation (US format)
export const isValidZipCode = (zipCode: string): boolean => {
  const zipRegex = /^\d{5}(-\d{4})?$/
  return zipRegex.test(zipCode.trim())
}

// Name validation
export const isValidName = (name: string): boolean => {
  const nameRegex = /^[a-zA-Z\s'-]{2,50}$/
  return nameRegex.test(name.trim())
}

// Username validation
export const isValidUsername = (username: string): {
  isValid: boolean
  errors: string[]
} => {
  const errors: string[] = []
  const trimmed = username.trim()

  if (trimmed.length < 3) {
    errors.push('Username must be at least 3 characters long')
  }

  if (trimmed.length > 20) {
    errors.push('Username must be no more than 20 characters long')
  }

  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
    errors.push('Username can only contain letters, numbers, and underscores')
  }

  if (/^[0-9]/.test(trimmed)) {
    errors.push('Username cannot start with a number')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Age validation
export const isValidAge = (birthDate: string | Date): boolean => {
  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate
  const today = new Date()
  const age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    return age - 1 >= 13 // Must be at least 13 years old
  }

  return age >= 13
}

// Required field validation
export const isRequired = (value: any): boolean => {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  return true
}

// Min length validation
export const minLength = (value: string, min: number): boolean => {
  return value.trim().length >= min
}

// Max length validation
export const maxLength = (value: string, max: number): boolean => {
  return value.trim().length <= max
}

// Number range validation
export const isInRange = (value: number, min: number, max: number): boolean => {
  return value >= min && value <= max
}

// File validation
export const validateFile = (file: File, options: {
  maxSize?: number // in bytes
  allowedTypes?: string[]
  allowedExtensions?: string[]
}): {
  isValid: boolean
  errors: string[]
} => {
  const errors: string[] = []

  // Check file size
  if (options.maxSize && file.size > options.maxSize) {
    const maxSizeMB = (options.maxSize / (1024 * 1024)).toFixed(2)
    errors.push(`File size must be less than ${maxSizeMB}MB`)
  }

  // Check file type
  if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
    errors.push(`File type ${file.type} is not allowed`)
  }

  // Check file extension
  if (options.allowedExtensions) {
    const extension = file.name.split('.').pop()?.toLowerCase()
    if (!extension || !options.allowedExtensions.includes(extension)) {
      errors.push(`File extension .${extension} is not allowed`)
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Form validation helper
export const validateForm = <T extends Record<string, any>>(
  data: T,
  rules: Partial<Record<keyof T, Array<(value: any) => boolean | string>>>
): {
  isValid: boolean
  errors: Partial<Record<keyof T, string[]>>
} => {
  const errors: Partial<Record<keyof T, string[]>> = {}

  Object.keys(rules).forEach(key => {
    const fieldRules = rules[key as keyof T]
    const fieldValue = data[key as keyof T]
    const fieldErrors: string[] = []

    if (fieldRules) {
      fieldRules.forEach(rule => {
        const result = rule(fieldValue)
        if (result !== true) {
          fieldErrors.push(typeof result === 'string' ? result : 'Invalid value')
        }
      })
    }

    if (fieldErrors.length > 0) {
      errors[key as keyof T] = fieldErrors
    }
  })

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// Common validation rules
export const validationRules = {
  required: (value: any) => isRequired(value) || 'This field is required',
  email: (value: string) => isValidEmail(value) || 'Please enter a valid email address',
  phone: (value: string) => isValidPhoneNumber(value) || 'Please enter a valid phone number',
  zipCode: (value: string) => isValidZipCode(value) || 'Please enter a valid zip code',
  name: (value: string) => isValidName(value) || 'Please enter a valid name',
  url: (value: string) => isValidURL(value) || 'Please enter a valid URL',
  
  minLength: (min: number) => (value: string) => 
    minLength(value, min) || `Must be at least ${min} characters long`,
    
  maxLength: (max: number) => (value: string) => 
    maxLength(value, max) || `Must be no more than ${max} characters long`,
    
  range: (min: number, max: number) => (value: number) => 
    isInRange(value, min, max) || `Must be between ${min} and ${max}`,
    
  match: (otherValue: any, fieldName: string) => (value: any) => 
    value === otherValue || `Must match ${fieldName}`,
    
  pattern: (regex: RegExp, message: string) => (value: string) => 
    regex.test(value) || message
}
