'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Search, 
  ShoppingCart, 
  Heart, 
  User, 
  Menu, 
  X, 
  ChevronDown,
  MapPin,
  Phone,
  Mail,
  Globe,
  Shield,
  Truck,
  RotateCcw
} from 'lucide-react'
import { ThemeToggle } from '../ui/ThemeToggle'

// Categories for mega menu
const categoryGroups = [
  {
    title: 'Electronics',
    items: [
      { name: 'Smartphones', href: '/products?category=smartphones' },
      { name: 'Laptops', href: '/products?category=laptops' },
      { name: 'Headphones', href: '/products?category=headphones' },
      { name: 'Smart Watches', href: '/products?category=smart-watches' },
      { name: 'Cameras', href: '/products?category=cameras' },
      { name: 'Gaming', href: '/products?category=gaming' }
    ]
  },
  {
    title: 'Fashion',
    items: [
      { name: 'Men\'s Clothing', href: '/products?category=mens-clothing' },
      { name: 'Women\'s Clothing', href: '/products?category=womens-clothing' },
      { name: 'Shoes', href: '/products?category=shoes' },
      { name: 'Accessories', href: '/products?category=accessories' },
      { name: 'Watches', href: '/products?category=watches' },
      { name: 'Jewelry', href: '/products?category=jewelry' }
    ]
  },
  {
    title: 'Home & Garden',
    items: [
      { name: 'Furniture', href: '/products?category=furniture' },
      { name: 'Kitchen', href: '/products?category=kitchen' },
      { name: 'Bedding', href: '/products?category=bedding' },
      { name: 'Decor', href: '/products?category=decor' },
      { name: 'Garden', href: '/products?category=garden' },
      { name: 'Tools', href: '/products?category=tools' }
    ]
  },
  {
    title: 'Sports',
    items: [
      { name: 'Fitness', href: '/products?category=fitness' },
      { name: 'Outdoor', href: '/products?category=outdoor' },
      { name: 'Team Sports', href: '/products?category=team-sports' },
      { name: 'Water Sports', href: '/products?category=water-sports' },
      { name: 'Winter Sports', href: '/products?category=winter-sports' },
      { name: 'Cycling', href: '/products?category=cycling' }
    ]
  }
]

// Search suggestions
const searchSuggestions = [
  'iPhone 15 Pro',
  'MacBook Air M2',
  'Sony WH-1000XM5',
  'Samsung Galaxy S24',
  'Nike Air Max',
  'Adidas Ultraboost',
  'Canon EOS R5',
  'PlayStation 5',
  'Apple Watch Series 9',
  'Dyson V15 Detect'
]

interface EnhancedNavbarProps {
  className?: string
}

export function EnhancedNavbar({ className = '' }: EnhancedNavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchSuggestionIndex, setSearchSuggestionIndex] = useState(-1)

  const router = useRouter()
  const searchRef = useRef<HTMLDivElement>(null)
  const categoriesRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Mock data for cart and user
  const cartItemCount = 0
  const wishlistCount = 0
  const isAuthenticated = false
  const user: { name?: string; email?: string } | null = null

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false)
      }
      if (categoriesRef.current && !categoriesRef.current.contains(event.target as Node)) {
        setIsCategoriesOpen(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
      setIsSearchFocused(false)
    }
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSearchSuggestionIndex(prev => 
        prev < searchSuggestions.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSearchSuggestionIndex(prev => prev > 0 ? prev - 1 : -1)
    } else if (e.key === 'Enter' && searchSuggestionIndex >= 0) {
      e.preventDefault()
      setSearchQuery(searchSuggestions[searchSuggestionIndex])
      router.push(`/search?q=${encodeURIComponent(searchSuggestions[searchSuggestionIndex])}`)
      setIsSearchFocused(false)
    } else if (e.key === 'Escape') {
      setIsSearchFocused(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion)
    router.push(`/search?q=${encodeURIComponent(suggestion)}`)
    setIsSearchFocused(false)
  }

  const handleLogout = () => {
    // Mock logout
    setIsUserMenuOpen(false)
  }

  return (
    <>
      {/* Top Bar */}
      <div className="bg-blue-600 text-white text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>Deliver to India</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>+91 98765 43210</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>support@apnidukaan.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4" />
                <span>English</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className={`bg-white shadow-sm sticky top-0 z-40 ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <span className="font-bold text-xl text-gray-900">ApniDukaan</span>
            </Link>

            {/* Search Bar */}
            <div className="hidden md:block flex-1 max-w-2xl mx-8" ref={searchRef}>
              <form onSubmit={handleSearch} className="relative">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setSearchSuggestionIndex(-1)
                    }}
                    onFocus={() => setIsSearchFocused(true)}
                    onKeyDown={handleSearchKeyDown}
                    placeholder="Search for products, brands, and more..."
                    className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-colors"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md transition-colors"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                </div>

                {/* Search Suggestions */}
                {isSearchFocused && (searchQuery || true) && (
                  <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto z-50">
                    {searchSuggestions
                      .filter(suggestion => 
                        suggestion.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((suggestion, index) => (
                        <button
                          key={suggestion}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                            index === searchSuggestionIndex ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <Search className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-900">{suggestion}</span>
                          </div>
                        </button>
                      ))}
                  </div>
                )}
              </form>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
              {/* Cart */}
              <Link href="/cart" className="relative p-2 text-gray-700 hover:text-blue-600 transition-colors">
                <ShoppingCart className="h-6 w-6" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </Link>

              {/* Wishlist */}
              <Link href="/wishlist" className="relative p-2 text-gray-700 hover:text-red-600 transition-colors">
                <Heart className="h-6 w-6" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Theme Toggle */}
              <div className="flex items-center">
                <ThemeToggle variant="icon" size="md" />
              </div>

              {/* User Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 p-2 text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <User className="h-6 w-6" />
                  <span className="hidden md:block">
                    {isAuthenticated ? (user as any)?.name || 'Account' : 'Sign In'}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    {isAuthenticated ? (
                      <>
                        <Link href="/profile" className="block px-4 py-2 text-gray-700 hover:bg-gray-50">
                          My Profile
                        </Link>
                        <Link href="/orders" className="block px-4 py-2 text-gray-700 hover:bg-gray-50">
                          My Orders
                        </Link>
                        <Link href="/wishlist" className="block px-4 py-2 text-gray-700 hover:bg-gray-50">
                          Wishlist
                        </Link>
                        <hr className="my-2" />
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50"
                        >
                          Sign Out
                        </button>
                      </>
                    ) : (
                      <>
                        <Link href="/auth/login" className="block px-4 py-2 text-gray-700 hover:bg-gray-50">
                          Sign In
                        </Link>
                        <Link href="/auth/register" className="block px-4 py-2 text-gray-700 hover:bg-gray-50">
                          Create Account
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-gray-700 hover:text-blue-600 transition-colors"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Categories Menu */}
          <div className="hidden md:block border-t border-gray-200">
            <div className="flex items-center space-x-8 py-3" ref={categoriesRef}>
              <button
                onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors"
              >
                <Menu className="h-5 w-5" />
                <span>Categories</span>
                <ChevronDown className="h-4 w-4" />
              </button>

              <Link href="/products" className="text-gray-700 hover:text-blue-600 transition-colors">
                All Products
              </Link>
              <Link href="/deals" className="text-gray-700 hover:text-blue-600 transition-colors">
                Deals
              </Link>
              <Link href="/new-arrivals" className="text-gray-700 hover:text-blue-600 transition-colors">
                New Arrivals
              </Link>

              {isCategoriesOpen && (
                <div className="absolute top-full left-0 w-full bg-white border-t border-gray-200 shadow-lg z-50">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                      {categoryGroups.map((group) => (
                        <div key={group.title}>
                          <h3 className="font-semibold text-gray-900 mb-4">{group.title}</h3>
                          <ul className="space-y-2">
                            {group.items.map((item) => (
                              <li key={item.name}>
                                <Link
                                  href={item.href}
                                  className="text-gray-600 hover:text-blue-600 transition-colors"
                                >
                                  {item.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-4 space-y-4">
              {/* Mobile Search */}
              <form onSubmit={handleSearch} className="relative">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for products..."
                    className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                </div>
              </form>

              {/* Mobile Categories */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Categories</h3>
                <div className="space-y-2">
                  {categoryGroups.map((group) => (
                    <div key={group.title}>
                      <h4 className="font-medium text-gray-700 mb-1">{group.title}</h4>
                      <ul className="ml-4 space-y-1">
                        {group.items.slice(0, 3).map((item) => (
                          <li key={item.name}>
                            <Link
                              href={item.href}
                              className="text-gray-600 hover:text-blue-600 transition-colors text-sm"
                            >
                              {item.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile Links */}
              <div className="space-y-2">
                <Link href="/products" className="block text-gray-700 hover:text-blue-600 transition-colors">
                  All Products
                </Link>
                <Link href="/deals" className="block text-gray-700 hover:text-blue-600 transition-colors">
                  Deals
                </Link>
                <Link href="/new-arrivals" className="block text-gray-700 hover:text-blue-600 transition-colors">
                  New Arrivals
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  )
}