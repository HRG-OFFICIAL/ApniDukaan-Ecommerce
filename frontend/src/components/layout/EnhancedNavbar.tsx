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
  HelpCircle,
  Shirt,
  Smartphone,
  Home,
  Gamepad2,
  Sparkles as BeautyIcon,
  Dumbbell,
  Baby,
  Dog
} from 'lucide-react'
import { useCartStore } from '../../store/useCartStore'
import { useAuthStore } from '../../store/useAuthStore'

// Comprehensive categories organized by main groups
const categoryGroups = [
  {
    title: 'Fashion & Clothing',
    icon: <Shirt className="h-5 w-5 text-gray-700" />,
    subcategories: [
      {
        title: 'Women\'s Fashion',
        items: [
          { name: 'Women\'s Clothing', count: 2683, href: '/products?category=womens-clothing' },
          { name: 'Women\'s Shoes', count: 2410, href: '/products?category=womens-shoes' },
          { name: 'Women\'s Handbags', count: 2930, href: '/products?category=womens-handbags' },
          { name: 'Women\'s Jewelry', count: 2623, href: '/products?category=womens-jewelry' },
          { name: 'Women\'s Accessories', count: 2147, href: '/products?category=womens-accessories' },
          { name: 'Women\'s Watches', count: 1009, href: '/products?category=womens-watches' }
        ]
      },
      {
        title: 'Men\'s Fashion',
        items: [
          { name: 'Men\'s Clothing', count: 2816, href: '/products?category=mens-clothing' },
          { name: 'Men\'s Shoes', count: 3057, href: '/products?category=mens-shoes' },
          { name: 'Men\'s Accessories', count: 2727, href: '/products?category=mens-accessories' },
          { name: 'Men\'s Watches', count: 1980, href: '/products?category=mens-watches' }
        ]
      },
      {
        title: 'Kids\' Fashion',
        items: [
          { name: 'Girls\' Clothing', count: 4412, href: '/products?category=girls-clothing' },
          { name: 'Boys\' Clothing', count: 3804, href: '/products?category=boys-clothing' },
          { name: 'Girls\' Shoes', count: 1687, href: '/products?category=girls-shoes' },
          { name: 'Boys\' Shoes', count: 922, href: '/products?category=boys-shoes' },
          { name: 'Girls\' Jewelry', count: 2856, href: '/products?category=girls-jewelry' },
          { name: 'Boys\' Jewelry', count: 1676, href: '/products?category=boys-jewelry' }
        ]
      }
    ]
  },
  {
    title: 'Electronics & Technology',
    icon: <Smartphone className="h-5 w-5 text-gray-700" />,
    subcategories: [
      {
        title: 'Computers & Tablets',
        items: [
          { name: 'Computers & Tablets', count: 1290, href: '/products?category=computers-tablets' },
          { name: 'Computers', count: 1143, href: '/products?category=computers' },
          { name: 'Computer Components', count: 1302, href: '/products?category=computer-components' },
          { name: 'Computer Monitors', count: 553, href: '/products?category=computer-monitors' },
          { name: 'Laptop Accessories', count: 1043, href: '/products?category=laptop-accessories' }
        ]
      },
      {
        title: 'Mobile & Accessories',
        items: [
          { name: 'Cell Phones & Accessories', count: 531, href: '/products?category=cell-phones' },
          { name: 'Tablet Accessories', count: 1306, href: '/products?category=tablet-accessories' },
          { name: 'Wearable Technology', count: 1248, href: '/products?category=wearable-tech' }
        ]
      },
      {
        title: 'Audio & Video',
        items: [
          { name: 'Headphones & Earbuds', count: 1425, href: '/products?category=headphones' },
          { name: 'Home Audio & Theater Products', count: 744, href: '/products?category=home-audio' },
          { name: 'Televisions & Video Products', count: 1361, href: '/products?category=tv-video' },
          { name: 'Camera & Photo', count: 952, href: '/products?category=camera-photo' }
        ]
      },
      {
        title: 'Gaming',
        items: [
          { name: 'Video Games', count: 819, href: '/products?category=video-games' },
          { name: 'PlayStation 5 Consoles, Games & Accessories', count: 792, href: '/products?category=playstation-5' },
          { name: 'Nintendo Switch Consoles, Games & Accessories', count: 889, href: '/products?category=nintendo-switch' },
          { name: 'Xbox Series X & S Consoles, Games & Accessories', count: 871, href: '/products?category=xbox-series' }
        ]
      }
    ]
  },
  {
    title: 'Home & Garden',
    icon: <Home className="h-5 w-5 text-gray-700" />,
    subcategories: [
      {
        title: 'Furniture & Decor',
        items: [
          { name: 'Furniture', count: 899, href: '/products?category=furniture' },
          { name: 'Home Décor Products', count: 1263, href: '/products?category=home-decor' },
          { name: 'Wall Art', count: 1315, href: '/products?category=wall-art' },
          { name: 'Seasonal Décor', count: 1359, href: '/products?category=seasonal-decor' },
          { name: 'Lighting & Ceiling Fans', count: 1311, href: '/products?category=lighting' }
        ]
      },
      {
        title: 'Kitchen & Dining',
        items: [
          { name: 'Kitchen & Dining', count: 753, href: '/products?category=kitchen-dining' },
          { name: 'Home Appliances', count: 1081, href: '/products?category=home-appliances' },
          { name: 'Vacuum Cleaners & Floor Care', count: 1278, href: '/products?category=vacuum-cleaners' }
        ]
      },
      {
        title: 'Bedding & Bath',
        items: [
          { name: 'Bedding', count: 1286, href: '/products?category=bedding' },
          { name: 'Bath Products', count: 1326, href: '/products?category=bath-products' }
        ]
      }
    ]
  },
  {
    title: 'Toys & Games',
    icon: <Gamepad2 className="h-5 w-5 text-gray-700" />,
    subcategories: [
      {
        title: 'Kids\' Toys',
        items: [
          { name: 'Toys & Games', count: 3215, href: '/products?category=toys-games' },
          { name: 'Baby & Toddler Toys', count: 1391, href: '/products?category=baby-toddler-toys' },
          { name: 'Dolls & Accessories', count: 1160, href: '/products?category=dolls' },
          { name: 'Stuffed Animals & Plush Toys', count: 833, href: '/products?category=stuffed-animals' }
        ]
      },
      {
        title: 'Educational & Learning',
        items: [
          { name: 'Learning & Education Toys', count: 551, href: '/products?category=learning-toys' },
          { name: 'Puzzles', count: 1108, href: '/products?category=puzzles' },
          { name: 'Building Toys', count: 987, href: '/products?category=building-toys' }
        ]
      }
    ]
  },
  {
    title: 'Beauty & Personal Care',
    icon: <BeautyIcon className="h-5 w-5 text-gray-700" />,
    subcategories: [
      {
        title: 'Beauty & Cosmetics',
        items: [
          { name: 'Makeup', count: 1296, href: '/products?category=makeup' },
          { name: 'Skin Care Products', count: 1245, href: '/products?category=skin-care' },
          { name: 'Hair Care Products', count: 1337, href: '/products?category=hair-care' },
          { name: 'Beauty Tools & Accessories', count: 938, href: '/products?category=beauty-tools' }
        ]
      },
      {
        title: 'Personal Care',
        items: [
          { name: 'Shaving & Hair Removal Products', count: 1176, href: '/products?category=shaving' },
          { name: 'Oral Care Products', count: 621, href: '/products?category=oral-care' },
          { name: 'Foot, Hand & Nail Care Products', count: 1471, href: '/products?category=foot-hand-nail' }
        ]
      }
    ]
  },
  {
    title: 'Sports & Outdoors',
    icon: <Dumbbell className="h-5 w-5 text-gray-700" />,
    subcategories: [
      {
        title: 'Sports & Fitness',
        items: [
          { name: 'Sports & Fitness', count: 1028, href: '/products?category=sports-fitness' },
          { name: 'Sports Nutrition Products', count: 682, href: '/products?category=sports-nutrition' },
          { name: 'Outdoor Recreation', count: 548, href: '/products?category=outdoor-recreation' }
        ]
      },
      {
        title: 'Automotive',
        items: [
          { name: 'Automotive Performance Parts & Accessories', count: 1453, href: '/products?category=auto-performance' },
          { name: 'Automotive Tires & Wheels', count: 1449, href: '/products?category=auto-tires' },
          { name: 'Car Care', count: 1336, href: '/products?category=car-care' }
        ]
      }
    ]
  },
  {
    title: 'Baby & Kids',
    icon: <Baby className="h-5 w-5 text-gray-700" />,
    subcategories: [
      {
        title: 'Baby Clothing',
        items: [
          { name: 'Baby Boys\' Clothing & Shoes', count: 1366, href: '/products?category=baby-boys-clothing' },
          { name: 'Baby Girls\' Clothing & Shoes', count: 504, href: '/products?category=baby-girls-clothing' }
        ]
      },
      {
        title: 'Baby Care',
        items: [
          { name: 'Baby Care Products', count: 1030, href: '/products?category=baby-care' },
          { name: 'Baby & Toddler Feeding Supplies', count: 1180, href: '/products?category=baby-feeding' },
          { name: 'Baby Safety Products', count: 720, href: '/products?category=baby-safety' }
        ]
      }
    ]
  },
  {
    title: 'Pets & Animals',
    icon: <Dog className="h-5 w-5 text-gray-700" />,
    subcategories: [
      {
        title: 'Pet Supplies',
        items: [
          { name: 'Dog Supplies', count: 1284, href: '/products?category=dog-supplies' },
          { name: 'Cat Supplies', count: 1380, href: '/products?category=cat-supplies' },
          { name: 'Fish & Aquatic Pets', count: 1094, href: '/products?category=fish-aquatic' },
          { name: 'Small Animal Supplies', count: 927, href: '/products?category=small-animals' }
        ]
      }
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
             {/* Categories Dropdown */}
             <div className="relative" ref={categoriesRef}>
               <button
                 onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                 className="flex items-center gap-2 text-black hover:text-gray-600 transition-colors whitespace-nowrap"
               >
                 <Grid3X3 className="h-4 w-4" />
                 Categories
                 <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isCategoriesOpen ? 'rotate-180' : ''}`} />
               </button>

               {/* Mega Menu Dropdown */}
               {isCategoriesOpen && (
                 <div className="absolute top-full left-0 mt-2 w-screen max-w-5xl bg-white rounded-lg shadow-2xl border border-gray-200 z-50 animate-in slide-in-from-top-2 duration-200">
                   <div className="p-4">
                     <div className="grid grid-cols-4 gap-4">
                       {categoryGroups.map((group) => (
                         <div key={group.title} className="space-y-2">
                           {/* Main Category Header */}
                           <div className="flex items-center space-x-2 pb-1 border-b border-gray-200">
                             {group.icon}
                             <h3 className="text-sm font-bold text-gray-900 leading-tight">{group.title}</h3>
                           </div>
                           
                           {/* Subcategories */}
                           <div className="space-y-2">
                             {group.subcategories.map((subcategory) => (
                               <div key={subcategory.title}>
                                 <h4 className="text-xs font-semibold text-gray-700 mb-1">{subcategory.title}</h4>
                                 <ul className="space-y-0.5">
                                   {subcategory.items.map((item) => (
                                     <li key={item.name}>
                                       <Link
                                         href={item.href}
                                         className="flex items-center text-xs text-gray-600 hover:text-blue-600 transition-colors group py-0.5 px-1 rounded hover:bg-blue-50"
                                         onClick={() => setIsCategoriesOpen(false)}
                                       >
                                         <span className="group-hover:text-blue-600 font-medium">{item.name}</span>
                                         <span className="text-xs text-gray-400 ml-2">({item.count})</span>
                                       </Link>
                                     </li>
                                   ))}
                                 </ul>
                               </div>
                             ))}
                           </div>
                         </div>
                       ))}
                     </div>
                     
                     {/* Footer with View All Categories */}
                     <div className="mt-4 pt-4 border-t border-gray-200 text-center">
                       <Link
                         href="/categories"
                         className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded transition-colors"
                         onClick={() => setIsCategoriesOpen(false)}
                       >
                         View All 241 Categories
                         <ChevronDown className="h-4 w-4 ml-1 rotate-[-90deg]" />
                       </Link>
                     </div>
                   </div>
                 </div>
               )}
             </div>
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
                <div className="space-y-3">
                  {categoryGroups.map((group) => (
                    <div key={group.title}>
                      <div className="flex items-center space-x-2 mb-2">
                        {group.icon}
                        <h4 className="font-medium text-gray-700">{group.title}</h4>
                      </div>
                      <div className="ml-6 space-y-2">
                        {group.subcategories.slice(0, 2).map((subcategory) => (
                          <div key={subcategory.title}>
                            <h5 className="text-sm font-medium text-gray-600 mb-1">{subcategory.title}</h5>
                            <ul className="ml-3 space-y-1">
                              {subcategory.items.slice(0, 3).map((item) => (
                                <li key={item.name}>
                                  <Link
                                    href={item.href}
                                    className="text-gray-600 hover:text-blue-600 transition-colors text-sm"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                  >
                                    {item.name} ({item.count})
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
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