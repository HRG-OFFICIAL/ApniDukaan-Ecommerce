'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Search, 
  ShoppingCart, 
  CircleUser,
  Menu, 
  X, 
  ChevronDown,
  ShoppingBag,
  MoreVertical,
  Heart,
  Grid3X3,
  Package,
  TrendingUp,
  Sparkles,
  Store,
  RotateCcw,
  Gift,
  BookOpen,
  History,
  Zap,
  HelpCircle
} from 'lucide-react'
import { useCartStore } from '../../store/useCartStore'
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

interface NavbarProps {
  className?: string
}

export function Navbar({ className = '' }: NavbarProps) {
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

  // Get cart data from store
  const { itemCount: cartItemCount, toggleCart } = useCartStore()
  const { isAuthenticated, isGuest, user, guestUser, logout } = useAuthStore()
  const wishlistCount = 0

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
    logout()
    setIsUserMenuOpen(false)
    router.push('/')
  }

  return (
    <>
      {/* Main Navigation */}
      <nav className={`bg-white sticky top-0 z-40 text-gray-900 border-b border-black ${className}`}>
        <div className="mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <span className="font-bold text-xl text-gray-900">ApniDukaan</span>
            </Link>

            {/* Search Bar */}
            <div className="hidden md:block flex-1 max-w-2xl mx-8 navbar-search" ref={searchRef}>
              <form onSubmit={handleSearch} className="relative">
                <div className="relative rounded-md bg-gray-100">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setSearchSuggestionIndex(-1)
                    }}
                    onFocus={() => setIsSearchFocused(true)}
                    onKeyDown={handleSearchKeyDown}
                    placeholder="Search for Products, Brands and More"
                    className="w-full pl-10 pr-3 py-1.5 rounded-md bg-gray-100 focus:bg-gray-100 text-gray-900 placeholder-gray-600 border border-transparent focus:border-transparent outline-none focus:outline-none focus:ring-0 focus:shadow-none appearance-none autofill:shadow-[inset_0_0_0px_1000px_#f3f4f6]"
                  />
                  {/* submit icon removed for compact style */}
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
              {/* Account Dropdown */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 p-2 text-black hover:text-gray-600 transition-all duration-200"
                >
                  <CircleUser className="h-5 w-5" />
                   <span className="hidden md:block text-black text-sm font-medium">
                     {isAuthenticated ? (
                       isGuest ? 'Guest' : (user as any)?.name || 'Account'
                     ) : 'Sign In'}
                   </span>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-in slide-in-from-top-2 duration-200">
                    {isAuthenticated ? (
                      isGuest ? (
                        <>
                          <div className="px-4 py-2 border-b border-gray-100">
                            <p className="text-sm font-medium text-gray-900 m-0">Welcome, Guest!</p>
                            <p className="text-xs text-gray-500 m-0">{(guestUser as any)?.email || 'guest@apnidukaan.com'}</p>
                          </div>
                          <div className="py-1">
                            <Link href="/auth/login" className="flex items-center px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 group">
                              <CircleUser className="h-4 w-4 mr-3 group-hover:text-blue-600" />
                              Sign In to Save Progress
                            </Link>
                          </div>
                          <div className="border-t border-gray-100 pt-1">
                            <button
                              onClick={handleLogout}
                              className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-700 transition-all duration-200 group"
                            >
                              <span className="h-4 w-4 mr-3 flex items-center justify-center group-hover:text-red-600">
                                <span className="text-xs font-bold">×</span>
                              </span>
                              Exit Guest Mode
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="px-4 py-2 border-b border-gray-100">
                            <p className="text-sm font-medium text-gray-900 m-0">Welcome back!</p>
                            <p className="text-xs text-gray-500 m-0">{(user as any)?.email || 'user@example.com'}</p>
                          </div>
                          <div className="py-1">
                            <Link href="/profile" className="flex items-center px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 group">
                              <CircleUser className="h-4 w-4 mr-3 group-hover:text-blue-600" />
                              My Profile
                            </Link>
                            <Link href="/orders" className="flex items-center px-4 py-2 text-gray-700 hover:bg-green-50 hover:text-green-700 transition-all duration-200 group">
                              <ShoppingBag className="h-4 w-4 mr-3 group-hover:text-green-600" />
                              My Orders
                            </Link>
                            <Link href="/wishlist" className="flex items-center px-4 py-2 text-gray-700 hover:bg-pink-50 hover:text-pink-700 transition-all duration-200 group">
                              <Heart className="h-4 w-4 mr-3 group-hover:text-pink-600" />
                              Wishlist
                            </Link>
                          </div>
                          <div className="border-t border-gray-100 pt-1">
                            <button
                              onClick={handleLogout}
                              className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-700 transition-all duration-200 group"
                            >
                              <span className="h-4 w-4 mr-3 flex items-center justify-center group-hover:text-red-600">
                                <span className="text-xs font-bold">×</span>
                              </span>
                              Sign Out
                            </button>
                          </div>
                        </>
                      )
                    ) : (
                      <>
                        <div className="px-4 py-2 border-b border-gray-100">
                          <h3 className="text-lg font-semibold text-gray-900 whitespace-nowrap m-0">Welcome to ApniDukaan</h3>
                          <p className="text-sm text-gray-500 m-0">Sign in to access your account</p>
                        </div>
                        <div className="py-1">
                          <Link 
                            href="/auth/login" 
                            className="flex items-center px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 group"
                          >
                            <CircleUser className="h-5 w-5 mr-3 group-hover:text-blue-600" />
                            <div>
                              <p className="font-medium m-0">Sign In</p>
                              <p className="text-xs text-gray-500 m-0">Access your account</p>
                            </div>
                          </Link>
                          <Link 
                            href="/auth/register" 
                            className="flex items-center px-4 py-2 text-gray-700 hover:bg-green-50 hover:text-green-700 transition-all duration-200 group"
                          >
                            <span className="h-5 w-5 mr-3 flex items-center justify-center group-hover:text-green-600">
                              <span className="text-sm font-bold">+</span>
                            </span>
                            <div>
                              <p className="font-medium m-0">Create Account</p>
                              <p className="text-xs text-gray-500 m-0">Join ApniDukaan today</p>
                            </div>
                          </Link>
                        </div>
                        <div className="px-4 py-2 bg-gray-50 rounded-b-2xl">
                          <p className="text-xs text-gray-500 text-center m-0">
                            By continuing, you agree to our Terms of Service
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Cart with label */}
              <button 
                onClick={toggleCart}
                className="relative flex items-center gap-2 p-2 text-black hover:text-black transition-colors"
              >
                <ShoppingCart className="h-5 w-5" />
                <span className="hidden md:inline text-sm font-medium text-black">Cart</span>
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </button>

              {/* Become a Seller */}
              <Link href="/seller" className="hidden md:flex items-center gap-2 p-2 text-black hover:text-black transition-colors">
                <ShoppingBag className="h-5 w-5" />
                <span className="text-sm font-medium text-black">Become a Seller</span>
              </Link>

              {/* More options */}
              <button className="p-2 text-black hover:text-black transition-colors" aria-label="More options">
                <MoreVertical className="h-5 w-5" />
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-gray-700 hover:text-blue-600 transition-colors"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          
        </div>

         {/* Secondary Navigation - Horizontal Links */}
         <div className="hidden md:block">
           <div className="flex items-center justify-between py-3 text-sm px-6 w-full">
             <Link href="/categories" className="flex items-center gap-2 text-black hover:text-gray-600 transition-colors whitespace-nowrap">
               <Grid3X3 className="h-4 w-4" />
               Categories
             </Link>
             <Link href="/products" className="flex items-center gap-2 text-black hover:text-gray-600 transition-colors whitespace-nowrap">
               <Package className="h-4 w-4" />
               All Products
             </Link>
             <Link href="/deals" className="flex items-center gap-2 text-black hover:text-gray-600 transition-colors whitespace-nowrap">
               <TrendingUp className="h-4 w-4" />
               Trending Deals
             </Link>
             <Link href="/new-arrivals" className="flex items-center gap-2 text-black hover:text-gray-600 transition-colors whitespace-nowrap">
               <Sparkles className="h-4 w-4" />
               New Arrivals
             </Link>
             <Link href="/sell" className="flex items-center gap-2 text-black hover:text-gray-600 transition-colors whitespace-nowrap">
               <Store className="h-4 w-4" />
               Sell
             </Link>
             <Link href="/buy-again" className="flex items-center gap-2 text-black hover:text-gray-600 transition-colors whitespace-nowrap">
               <RotateCcw className="h-4 w-4" />
               Buy Again
             </Link>
             <Link href="/gift-cards" className="flex items-center gap-2 text-black hover:text-gray-600 transition-colors whitespace-nowrap">
               <Gift className="h-4 w-4" />
               Gift Cards
             </Link>
             <Link href="/kindle-ebooks" className="flex items-center gap-2 text-black hover:text-gray-600 transition-colors whitespace-nowrap">
               <BookOpen className="h-4 w-4" />
               Kindle eBooks
             </Link>
             <Link href="/history" className="flex items-center gap-2 text-black hover:text-gray-600 transition-colors whitespace-nowrap">
               <History className="h-4 w-4" />
               Browsing History
             </Link>
             <Link href="/todays-deals" className="flex items-center gap-2 text-black hover:text-gray-600 transition-colors whitespace-nowrap">
               <Zap className="h-4 w-4" />
               Today's Deals
             </Link>
             <Link href="/support" className="flex items-center gap-2 text-black hover:text-gray-600 transition-colors whitespace-nowrap">
               <HelpCircle className="h-4 w-4" />
               Customer Service
             </Link>
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

              <div className="space-y-2">
                <button 
                  onClick={toggleCart}
                  className="block w-full text-left text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Cart ({cartItemCount})
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  )
}