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
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Logo } from '../ui/Logo'
import { useCartStore } from '../../store/useCartStore'
import { usePreferencesStore } from '../../store/usePreferencesStore'
import { useAuthStore } from '../../store/useAuthStore'

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
      { name: 'Home Decor', href: '/products?category=home-decor' },
      { name: 'Kitchen', href: '/products?category=kitchen' },
      { name: 'Garden Tools', href: '/products?category=garden-tools' },
      { name: 'Appliances', href: '/products?category=appliances' },
      { name: 'Bedding', href: '/products?category=bedding' }
    ]
  },
  {
    title: 'Sports & Fitness',
    items: [
      { name: 'Exercise Equipment', href: '/products?category=exercise' },
      { name: 'Sports Gear', href: '/products?category=sports-gear' },
      { name: 'Outdoor Recreation', href: '/products?category=outdoor' },
      { name: 'Athletic Wear', href: '/products?category=athletic-wear' },
      { name: 'Supplements', href: '/products?category=supplements' },
      { name: 'Yoga & Meditation', href: '/products?category=yoga' }
    ]
  }
]

// Search suggestions
const searchSuggestions = [
  'iPhone 15',
  'Samsung Galaxy',
  'MacBook Pro',
  'Nike Air Jordan',
  'Sony Headphones',
  'Kitchen Appliances',
  'Furniture',
  'Gaming Chair'
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

  const { items, itemCount } = useCartStore()
  const { wishlist } = usePreferencesStore()
  const { user, isAuthenticated, logout } = useAuthStore()

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
    const filteredSuggestions = searchSuggestions.filter(suggestion =>
      suggestion.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSearchSuggestionIndex(prev => 
        prev < filteredSuggestions.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSearchSuggestionIndex(prev => prev > -1 ? prev - 1 : prev)
    } else if (e.key === 'Enter' && searchSuggestionIndex >= 0) {
      e.preventDefault()
      setSearchQuery(filteredSuggestions[searchSuggestionIndex])
      setSearchSuggestionIndex(-1)
      setTimeout(() => {
        const form = e.target as HTMLElement
        form.closest('form')?.requestSubmit()
      }, 100)
    } else if (e.key === 'Escape') {
      setIsSearchFocused(false)
      setSearchSuggestionIndex(-1)
    }
  }

  const handleLogout = () => {
    logout()
    setIsUserMenuOpen(false)
    router.push('/')
  }

  const filteredSearchSuggestions = searchSuggestions.filter(suggestion =>
    searchQuery && suggestion.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <>
      {/* Top Bar */}
      <div className="hidden lg:block bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-10 text-sm">
            <div className="flex items-center space-x-6">
              <div className="flex items-center text-gray-600">
                <Phone className="h-4 w-4 mr-1" />
                <span>+91 1800-123-4567</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Mail className="h-4 w-4 mr-1" />
                <span>support@apnidukaan.com</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-gray-600">
                <Truck className="h-4 w-4 mr-1" />
                <span>Free shipping over ₹999</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Shield className="h-4 w-4 mr-1" />
                <span>100% Secure Payment</span>
              </div>
              <div className="flex items-center text-gray-600">
                <RotateCcw className="h-4 w-4 mr-1" />
                <span>30-Day Returns</span>
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
            <Logo variant="navbar" size="md" />

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
                  <Button
                    type="submit"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>

                {/* Search Suggestions */}
                {isSearchFocused && (searchQuery || true) && (
                  <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto z-50">
                    {searchQuery ? (
                      <>
                        {/* Search Results */}
                        {filteredSearchSuggestions.length > 0 && (
                          <div className="p-2">
                            <p className="text-xs text-gray-500 mb-2 px-2">Suggestions</p>
                            {filteredSearchSuggestions.map((suggestion, index) => (
                              <button
                                key={suggestion}
                                onClick={() => {
                                  setSearchQuery(suggestion)
                                  setTimeout(() => handleSearch({ preventDefault: () => {} } as any), 100)
                                }}
                                className={`w-full text-left px-3 py-2 rounded hover:bg-gray-50 flex items-center ${
                                  index === searchSuggestionIndex ? 'bg-blue-50 text-blue-600' : ''
                                }`}
                              >
                                <Search className="h-4 w-4 mr-2 text-gray-400" />
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      /* Popular Searches */
                      <div className="p-2">
                        <p className="text-xs text-gray-500 mb-2 px-2">Popular Searches</p>
                        {searchSuggestions.slice(0, 6).map((suggestion) => (
                          <button
                            key={suggestion}
                            onClick={() => {
                              setSearchQuery(suggestion)
                              setTimeout(() => handleSearch({ preventDefault: () => {} } as any), 100)
                            }}
                            className="w-full text-left px-3 py-2 rounded hover:bg-gray-50 flex items-center text-gray-700"
                          >
                            <Search className="h-4 w-4 mr-2 text-gray-400" />
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </form>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
              {/* Location */}
              <div className="hidden lg:flex items-center text-sm text-gray-600">
                <MapPin className="h-4 w-4 mr-1" />
                <span>Delhi 110001</span>
              </div>

              {/* Wishlist */}
              <Link href="/wishlist" className="relative p-2 text-gray-600 hover:text-gray-900">
                <Heart className="h-6 w-6" />
                {wishlist.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs min-w-[20px] h-5 flex items-center justify-center">
                    {wishlist.length}
                  </Badge>
                )}
              </Link>

              {/* Cart */}
              <Link href="/cart" className="relative p-2 text-gray-600 hover:text-gray-900">
                <ShoppingCart className="h-6 w-6" />
                {itemCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs min-w-[20px] h-5 flex items-center justify-center">
                    {itemCount}
                  </Badge>
                )}
              </Link>

              {/* User Menu */}
              <div className="relative" ref={userMenuRef}>
                <Button
                  variant="ghost"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 p-2"
                >
                  <User className="h-6 w-6" />
                  {isAuthenticated && (
                    <span className="hidden lg:inline text-sm">
                      Hi, {user?.name?.split(' ')[0]}
                    </span>
                  )}
                  <ChevronDown className="h-4 w-4" />
                </Button>

                {/* User Dropdown */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    {isAuthenticated ? (
                      <>
                        <div className="px-4 py-2 border-b border-gray-200">
                          <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                          <p className="text-xs text-gray-500">{user?.email}</p>
                        </div>
                        <Link
                          href="/account"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          My Account
                        </Link>
                        <Link
                          href="/orders"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          My Orders
                        </Link>
                        <Link
                          href="/wishlist"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          Wishlist
                        </Link>
                        <Link
                          href="/profile"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          Settings
                        </Link>
                        <div className="border-t border-gray-200 mt-1 pt-1">
                          <button
                            onClick={handleLogout}
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            Logout
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/auth/login"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          Login
                        </Link>
                        <Link
                          href="/auth/register"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          Sign Up
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="hidden lg:block border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-8 h-12">
              {/* Categories Dropdown */}
              <div className="relative" ref={categoriesRef}>
                <Button
                  variant="ghost"
                  onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                  className="flex items-center space-x-1 text-sm font-medium"
                >
                  <Menu className="h-4 w-4" />
                  <span>All Categories</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>

                {/* Mega Menu */}
                {isCategoriesOpen && (
                  <div className="absolute top-full left-0 mt-1 w-screen max-w-4xl bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="grid grid-cols-4 gap-6 p-6">
                      {categoryGroups.map((group) => (
                        <div key={group.title}>
                          <h3 className="font-semibold text-gray-900 mb-3">{group.title}</h3>
                          <ul className="space-y-2">
                            {group.items.map((item) => (
                              <li key={item.name}>
                                <Link
                                  href={item.href}
                                  className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                                  onClick={() => setIsCategoriesOpen(false)}
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
                )}
              </div>

              {/* Quick Links */}
              <div className="flex items-center space-x-6">
                <Link href="/products?filter=new" className="text-sm text-gray-600 hover:text-gray-900">
                  New Arrivals
                </Link>
                <Link href="/products?filter=bestseller" className="text-sm text-gray-600 hover:text-gray-900">
                  Bestsellers
                </Link>
                <Link href="/products?filter=sale" className="text-sm text-red-600 hover:text-red-700 font-medium">
                  Sale
                </Link>
                <Link href="/categories" className="text-sm text-gray-600 hover:text-gray-900">
                  Categories
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-4 py-6 space-y-6">
              {/* Mobile Search */}
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </form>

              {/* Mobile Navigation Links */}
              <div className="space-y-4">
                <Link
                  href="/products"
                  className="block text-base font-medium text-gray-900"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  All Products
                </Link>
                <Link
                  href="/categories"
                  className="block text-base font-medium text-gray-900"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Categories
                </Link>
                <Link
                  href="/products?filter=new"
                  className="block text-base font-medium text-gray-900"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  New Arrivals
                </Link>
                <Link
                  href="/products?filter=sale"
                  className="block text-base font-medium text-red-600"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sale
                </Link>
              </div>

              {/* Mobile User Actions */}
              <div className="border-t border-gray-200 pt-6">
                {isAuthenticated ? (
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <User className="h-8 w-8 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Link
                        href="/account"
                        className="block text-base text-gray-900"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        My Account
                      </Link>
                      <Link
                        href="/orders"
                        className="block text-base text-gray-900"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        My Orders
                      </Link>
                      <button
                        onClick={() => {
                          handleLogout()
                          setIsMobileMenuOpen(false)
                        }}
                        className="block text-base text-red-600"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link
                      href="/auth/login"
                      className="block text-base font-medium text-blue-600"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Login
                    </Link>
                    <Link
                      href="/auth/register"
                      className="block text-base font-medium text-gray-900"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  )
}
