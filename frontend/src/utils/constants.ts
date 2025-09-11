/**
 * Application constants and configuration
 */

// App Configuration
export const APP_CONFIG = {
  name: 'ApniDukaan',
  description: 'Your ultimate e-commerce destination',
  version: '1.0.0',
  author: 'ApniDukaan Team',
  email: 'support@apnidukaan.com',
  website: 'https://apnidukaan.com',
  social: {
    twitter: 'https://twitter.com/apnidukaan',
    facebook: 'https://facebook.com/apnidukaan',
    instagram: 'https://instagram.com/apnidukaan',
    linkedin: 'https://linkedin.com/company/apnidukaan'
  }
} as const

// API Configuration
export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000
} as const

// Authentication
export const AUTH_CONFIG = {
  tokenKey: 'auth_token',
  refreshTokenKey: 'refresh_token',
  userKey: 'user_data',
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  passwordMinLength: 8,
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000 // 15 minutes in milliseconds
} as const

// Pagination
export const PAGINATION = {
  defaultPageSize: 12,
  pageSizes: [6, 12, 24, 48],
  maxPageSize: 100
} as const

// File Upload
export const FILE_UPLOAD = {
  maxSize: 5 * 1024 * 1024, // 5MB in bytes
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  allowedDocumentTypes: ['application/pdf', 'application/msword', 'text/plain'],
  allowedImageExtensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
  allowedDocumentExtensions: ['pdf', 'doc', 'docx', 'txt']
} as const

// Product Configuration
export const PRODUCT_CONFIG = {
  maxImagesPerProduct: 10,
  maxDescriptionLength: 2000,
  maxNameLength: 200,
  minPrice: 0.01,
  maxPrice: 999999.99,
  lowStockThreshold: 5,
  outOfStockThreshold: 0
} as const

// Order Configuration
export const ORDER_CONFIG = {
  maxItemsPerOrder: 100,
  minOrderAmount: 1.00,
  maxOrderAmount: 50000.00,
  defaultCurrency: 'USD',
  shippingThresholdForFree: 50.00,
  taxRate: 0.08 // 8%
} as const

// Cart Configuration
export const CART_CONFIG = {
  maxItemsInCart: 100,
  maxQuantityPerItem: 10,
  sessionTimeout: 7 * 24 * 60 * 60 * 1000, // 7 days
  autoSaveInterval: 5000 // 5 seconds
} as const

// Search Configuration
export const SEARCH_CONFIG = {
  minQueryLength: 2,
  maxQueryLength: 100,
  maxSearchResults: 100,
  searchDebounceDelay: 300,
  maxRecentSearches: 10
} as const

// UI Configuration
export const UI_CONFIG = {
  mobileBreakpoint: 768,
  tabletBreakpoint: 1024,
  desktopBreakpoint: 1280,
  animationDuration: 200,
  toastDuration: 5000,
  modalZIndex: 1000,
  dropdownZIndex: 500
} as const

// Local Storage Keys
export const STORAGE_KEYS = {
  cart: 'apnidukaan_cart',
  wishlist: 'apnidukaan_wishlist',
  preferences: 'apnidukaan_preferences',
  recentSearches: 'apnidukaan_recent_searches',
  theme: 'apnidukaan_theme',
  language: 'apnidukaan_language',
  currency: 'apnidukaan_currency',
  viewMode: 'apnidukaan_view_mode'
} as const

// Order Status
export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
} as const

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded'
} as const

// Payment Methods
export const PAYMENT_METHODS = {
  CREDIT_CARD: 'credit_card',
  DEBIT_CARD: 'debit_card',
  PAYPAL: 'paypal',
  APPLE_PAY: 'apple_pay',
  GOOGLE_PAY: 'google_pay',
  CASH_ON_DELIVERY: 'cash_on_delivery'
} as const

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  USER: 'user',
  GUEST: 'guest'
} as const

// Product Categories
export const PRODUCT_CATEGORIES = [
  'Electronics',
  'Clothing',
  'Home & Garden',
  'Sports & Fitness',
  'Books',
  'Beauty & Health',
  'Toys & Games',
  'Automotive',
  'Food & Beverages',
  'Office Supplies'
] as const

// Currencies
export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' }
] as const

// Countries
export const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'AU', name: 'Australia' },
  { code: 'JP', name: 'Japan' },
  { code: 'IN', name: 'India' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' }
] as const

// Languages
export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'it', name: 'Italiano' },
  { code: 'pt', name: 'Português' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'zh', name: '中文' }
] as const

// Shipping Methods
export const SHIPPING_METHODS = [
  { id: 'standard', name: 'Standard Shipping', price: 5.99, estimatedDays: '5-7 business days' },
  { id: 'expedited', name: 'Expedited Shipping', price: 12.99, estimatedDays: '2-3 business days' },
  { id: 'overnight', name: 'Overnight Shipping', price: 24.99, estimatedDays: '1 business day' },
  { id: 'free', name: 'Free Shipping', price: 0, estimatedDays: '7-10 business days', minOrderAmount: 50 }
] as const

// Sort Options
export const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest First' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'name-asc', label: 'Name: A to Z' },
  { value: 'name-desc', label: 'Name: Z to A' }
] as const

// Filter Options
export const FILTER_OPTIONS = {
  priceRanges: [
    { min: 0, max: 25, label: 'Under $25' },
    { min: 25, max: 50, label: '$25 - $50' },
    { min: 50, max: 100, label: '$50 - $100' },
    { min: 100, max: 250, label: '$100 - $250' },
    { min: 250, max: 500, label: '$250 - $500' },
    { min: 500, max: Infinity, label: 'Over $500' }
  ],
  ratings: [
    { value: 4, label: '4 stars & up' },
    { value: 3, label: '3 stars & up' },
    { value: 2, label: '2 stars & up' },
    { value: 1, label: '1 star & up' }
  ]
} as const

// Error Messages
export const ERROR_MESSAGES = {
  generic: 'Something went wrong. Please try again.',
  network: 'Network error. Please check your connection.',
  unauthorized: 'You are not authorized to perform this action.',
  forbidden: 'Access denied.',
  notFound: 'The requested resource was not found.',
  validation: 'Please check your input and try again.',
  timeout: 'Request timed out. Please try again.',
  serverError: 'Server error. Please try again later.'
} as const

// Success Messages
export const SUCCESS_MESSAGES = {
  login: 'Successfully logged in!',
  logout: 'Successfully logged out!',
  register: 'Account created successfully!',
  passwordReset: 'Password reset link sent to your email!',
  profileUpdate: 'Profile updated successfully!',
  cartAdd: 'Item added to cart!',
  cartRemove: 'Item removed from cart!',
  wishlistAdd: 'Item added to wishlist!',
  wishlistRemove: 'Item removed from wishlist!',
  orderPlaced: 'Order placed successfully!',
  paymentComplete: 'Payment completed successfully!'
} as const

// Regex Patterns
export const REGEX_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?1?[-.\s]?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/,
  zipCode: /^\d{5}(-\d{4})?$/,
  creditCard: /^\d{13,19}$/,
  username: /^[a-zA-Z0-9_]{3,20}$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/
} as const

// Theme Configuration
export const THEME_CONFIG = {
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      900: '#1e3a8a'
    },
    secondary: {
      50: '#f9fafb',
      100: '#f3f4f6',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      900: '#111827'
    },
    success: {
      50: '#ecfdf5',
      100: '#d1fae5',
      500: '#10b981',
      600: '#059669',
      700: '#047857'
    },
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309'
    },
    error: {
      50: '#fef2f2',
      100: '#fecaca',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c'
    }
  },
  fonts: {
    sans: ['Inter', 'sans-serif'],
    mono: ['Fira Code', 'monospace']
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem'
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    full: '9999px'
  }
} as const
