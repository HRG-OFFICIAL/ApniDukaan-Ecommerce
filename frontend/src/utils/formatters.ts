/**
 * Utility functions for formatting data
 */

// Currency formatting - Default to INR for Indian market
export const formatCurrency = (
  amount: number, 
  currency: string = 'INR', 
  locale: string = 'en-IN'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount)
}

// Number formatting with commas - Default to Indian locale
export const formatNumber = (num: number, locale: string = 'en-IN'): string => {
  return new Intl.NumberFormat(locale).format(num)
}

// Percentage formatting
export const formatPercentage = (
  value: number, 
  decimals: number = 1,
  locale: string = 'en-US'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value / 100)
}

// Date formatting
export const formatDate = (
  date: string | Date,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  },
  locale: string = 'en-US'
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat(locale, options).format(dateObj)
}

// Relative time formatting (e.g., "2 hours ago")
export const formatRelativeTime = (
  date: string | Date,
  locale: string = 'en-US'
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000)

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })

  if (diffInSeconds < 60) {
    return rtf.format(-diffInSeconds, 'second')
  } else if (diffInSeconds < 3600) {
    return rtf.format(-Math.floor(diffInSeconds / 60), 'minute')
  } else if (diffInSeconds < 86400) {
    return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour')
  } else if (diffInSeconds < 2592000) {
    return rtf.format(-Math.floor(diffInSeconds / 86400), 'day')
  } else if (diffInSeconds < 31536000) {
    return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month')
  } else {
    return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year')
  }
}

// File size formatting
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Phone number formatting - Indian format
export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '')
  
  // Format Indian phone numbers
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`
  } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`
  } else if (cleaned.length === 13 && cleaned.startsWith('+91')) {
    return `+91 ${cleaned.slice(3, 8)} ${cleaned.slice(8)}`
  }
  
  return phone // Return original if not a recognized format
}

// Credit card number formatting
export const formatCreditCard = (cardNumber: string): string => {
  // Remove all non-digit characters
  const cleaned = cardNumber.replace(/\D/g, '')
  
  // Add spaces every 4 digits
  return cleaned.replace(/(.{4})/g, '$1 ').trim()
}

// Truncate text with ellipsis
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

// Capitalize first letter
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

// Title case formatting
export const titleCase = (str: string): string => {
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  )
}

// Slug generation from text
export const createSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

// Extract initials from name
export const getInitials = (name: string, maxInitials: number = 2): string => {
  return name
    .split(' ')
    .slice(0, maxInitials)
    .map(word => word.charAt(0).toUpperCase())
    .join('')
}

// Format rating with stars
export const formatRating = (rating: number, maxRating: number = 5): string => {
  const fullStars = '★'.repeat(Math.floor(rating))
  const hasHalfStar = rating % 1 !== 0
  const halfStar = hasHalfStar ? '☆' : ''
  const emptyStars = '☆'.repeat(maxRating - Math.ceil(rating))
  
  return fullStars + halfStar + emptyStars
}

// Format discount percentage
export const formatDiscount = (originalPrice: number, salePrice: number): number => {
  if (originalPrice <= 0) return 0
  return Math.round(((originalPrice - salePrice) / originalPrice) * 100)
}

// Format address for display
export const formatAddress = (address: {
  street?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
}): string => {
  const parts = [
    address.street,
    address.city,
    address.state && address.zipCode ? `${address.state} ${address.zipCode}` : address.state || address.zipCode,
    address.country
  ].filter(Boolean)
  
  return parts.join(', ')
}

// Format order status for display
export const formatOrderStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'pending': 'Pending',
    'confirmed': 'Confirmed',
    'processing': 'Processing',
    'shipped': 'Shipped',
    'delivered': 'Delivered',
    'cancelled': 'Cancelled',
    'refunded': 'Refunded'
  }
  
  return statusMap[status.toLowerCase()] || titleCase(status)
}

// Format payment method for display
export const formatPaymentMethod = (method: string): string => {
  const methodMap: Record<string, string> = {
    'credit_card': 'Credit Card',
    'debit_card': 'Debit Card',
    'paypal': 'PayPal',
    'apple_pay': 'Apple Pay',
    'google_pay': 'Google Pay',
    'cash_on_delivery': 'Cash on Delivery'
  }
  
  return methodMap[method.toLowerCase()] || titleCase(method.replace(/_/g, ' '))
}

// Format product stock status
export const formatStockStatus = (stock: number, lowStockThreshold: number = 5): {
  status: 'in_stock' | 'low_stock' | 'out_of_stock'
  message: string
} => {
  if (stock === 0) {
    return { status: 'out_of_stock', message: 'Out of stock' }
  } else if (stock <= lowStockThreshold) {
    return { status: 'low_stock', message: `Only ${stock} left` }
  } else {
    return { status: 'in_stock', message: 'In stock' }
  }
}
