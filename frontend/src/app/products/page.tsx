'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { 
  FunnelIcon, 
  AdjustmentsHorizontalIcon,
  MagnifyingGlassIcon 
} from '@heroicons/react/24/outline'
import ProductCard from '../../components/product/ProductCard'
import { Product } from '../../types'
import MainLayout from '../../components/layout/MainLayout'

// Mock data for demonstration
const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Premium Wireless Headphones',
    description: 'High-quality wireless headphones with noise cancellation',
    price: 299.99,
    originalPrice: 399.99,
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'],
    category: 'Electronics',
    rating: 4.5,
    reviewCount: 128,
    stock: 15,
    isBestseller: true,
    isOnSale: true
  },
  {
    id: '2',
    name: 'Organic Cotton T-Shirt',
    description: 'Comfortable organic cotton t-shirt in multiple colors',
    price: 29.99,
    images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400'],
    category: 'Clothing',
    rating: 4.2,
    reviewCount: 64,
    stock: 42,
    isNew: true
  },
  {
    id: '3',
    name: 'Smart Watch Pro',
    description: 'Advanced smartwatch with health monitoring features',
    price: 399.99,
    images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'],
    category: 'Electronics',
    rating: 4.7,
    reviewCount: 201,
    stock: 8
  },
  {
    id: '4',
    name: 'Leather Messenger Bag',
    description: 'Handcrafted leather messenger bag for professionals',
    price: 149.99,
    originalPrice: 199.99,
    images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400'],
    category: 'Accessories',
    rating: 4.8,
    reviewCount: 87,
    stock: 12,
    isOnSale: true
  },
  {
    id: '5',
    name: 'Yoga Mat Pro',
    description: 'Professional grade yoga mat with superior grip',
    price: 79.99,
    images: ['https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400'],
    category: 'Sports & Fitness',
    rating: 4.4,
    reviewCount: 156,
    stock: 25,
    isNew: true
  },
  {
    id: '6',
    name: 'Coffee Maker Deluxe',
    description: 'Premium coffee maker with programmable features',
    price: 189.99,
    images: ['https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400'],
    category: 'Home & Kitchen',
    rating: 4.6,
    reviewCount: 93,
    stock: 18,
    isBestseller: true
  }
]

const categories = [
  'All Categories',
  'Electronics',
  'Clothing',
  'Accessories',
  'Sports & Fitness',
  'Home & Kitchen',
  'Books',
  'Beauty & Health'
]

const sortOptions = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest First' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Customer Rating' },
  { value: 'popular', label: 'Most Popular' }
]

function ProductsContent() {
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<Product[]>(mockProducts)
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(mockProducts)
  const [selectedCategory, setSelectedCategory] = useState('All Categories')
  const [sortBy, setSortBy] = useState('featured')
  const [searchQuery, setSearchQuery] = useState('')
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 })
  const [showFilters, setShowFilters] = useState(false)

  // Initialize filters from URL params
  useEffect(() => {
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const filter = searchParams.get('filter')
    
    if (search) setSearchQuery(search)
    if (category) setSelectedCategory(category)
    if (filter) {
      // Handle special filters like 'new', 'bestseller', 'sale'
      let filtered = mockProducts
      switch (filter) {
        case 'new':
          filtered = mockProducts.filter(p => p.isNew)
          break
        case 'bestseller':
          filtered = mockProducts.filter(p => p.isBestseller)
          break
        case 'sale':
          filtered = mockProducts.filter(p => p.isOnSale)
          break
      }
      setProducts(filtered)
    }
  }, [searchParams])

  // Apply filters
  useEffect(() => {
    let filtered = products

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(product => {
        const categoryName = typeof product.category === 'string' 
          ? product.category 
          : product.category.name
        
        return (
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          categoryName.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })
    }

    // Category filter
    if (selectedCategory !== 'All Categories') {
      filtered = filtered.filter(product => {
        const categoryName = typeof product.category === 'string' 
          ? product.category 
          : product.category.name
        return categoryName === selectedCategory
      })
    }

    // Price range filter
    filtered = filtered.filter(product => 
      product.price >= priceRange.min && product.price <= priceRange.max
    )

    // Sorting
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price)
        break
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price)
        break
      case 'rating':
        filtered.sort((a, b) => {
          const aRating = typeof a.rating === 'number' ? a.rating : a.rating.average
          const bRating = typeof b.rating === 'number' ? b.rating : b.rating.average
          return bRating - aRating
        })
        break
      case 'newest':
        filtered.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0))
        break
      case 'popular':
        filtered.sort((a, b) => b.reviewCount - a.reviewCount)
        break
      default:
        // Featured - prioritize bestsellers and new items
        filtered.sort((a, b) => {
          if (a.isBestseller && !b.isBestseller) return -1
          if (!a.isBestseller && b.isBestseller) return 1
          if (a.isNew && !b.isNew) return -1
          if (!a.isNew && b.isNew) return 1
          const aRating = typeof a.rating === 'number' ? a.rating : a.rating.average
          const bRating = typeof b.rating === 'number' ? b.rating : b.rating.average
          return bRating - aRating
        })
    }

    setFilteredProducts(filtered)
  }, [products, searchQuery, selectedCategory, sortBy, priceRange])

  return (
    <MainLayout>
      <div className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 pb-6">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-gray-900">Products</h1>
              <p className="mt-4 text-base text-gray-500">
                Discover our amazing collection of {filteredProducts.length} products
              </p>
            </div>
            
            {/* Mobile filter button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <FunnelIcon className="h-5 w-5" />
              <span>Filters</span>
            </button>
          </div>

          <div className="pt-6 lg:grid lg:grid-cols-4 lg:gap-x-8">
            {/* Filters Sidebar */}
            <aside className={`${showFilters ? 'block' : 'hidden'} lg:block`}>
              <div className="space-y-6">
                {/* Search */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Search</h3>
                  <div className="mt-2 relative">
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    />
                    <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>

                {/* Categories */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Categories</h3>
                  <div className="mt-2 space-y-2">
                    {categories.map((category) => (
                      <label key={category} className="flex items-center">
                        <input
                          type="radio"
                          name="category"
                          value={category}
                          checked={selectedCategory === category}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                        />
                        <span className="ml-3 text-sm text-gray-600">{category}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Price Range</h3>
                  <div className="mt-2 space-y-3">
                    <div className="flex items-center space-x-3">
                      <input
                        type="number"
                        placeholder="Min"
                        value={priceRange.min}
                        onChange={(e) => setPriceRange(prev => ({ ...prev, min: Number(e.target.value) }))}
                        className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm"
                      />
                      <span className="text-gray-500">to</span>
                      <input
                        type="number"
                        placeholder="Max"
                        value={priceRange.max}
                        onChange={(e) => setPriceRange(prev => ({ ...prev, max: Number(e.target.value) }))}
                        className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Quick Filters */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Quick Filters</h3>
                  <div className="mt-2 space-y-2">
                    <button 
                      onClick={() => setProducts(mockProducts.filter(p => p.isNew))}
                      className="block text-left text-sm text-primary-600 hover:text-primary-500"
                    >
                      New Arrivals
                    </button>
                    <button 
                      onClick={() => setProducts(mockProducts.filter(p => p.isBestseller))}
                      className="block text-left text-sm text-primary-600 hover:text-primary-500"
                    >
                      Bestsellers
                    </button>
                    <button 
                      onClick={() => setProducts(mockProducts.filter(p => p.isOnSale))}
                      className="block text-left text-sm text-primary-600 hover:text-primary-500"
                    >
                      On Sale
                    </button>
                    <button 
                      onClick={() => setProducts(mockProducts)}
                      className="block text-left text-sm text-gray-600 hover:text-gray-500"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              </div>
            </aside>

            {/* Product Grid */}
            <div className="mt-6 lg:col-span-3 lg:mt-0">
              {/* Sort */}
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-gray-700">
                  Showing {filteredProducts.length} products
                </p>
                <div className="flex items-center space-x-4">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-primary-500 focus:border-primary-500"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Products Grid */}
              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h10a2 2 0 012 2v14a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
                  <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
                  <button 
                    onClick={() => {
                      setSearchQuery('')
                      setSelectedCategory('All Categories')
                      setPriceRange({ min: 0, max: 1000 })
                      setProducts(mockProducts)
                    }}
                    className="mt-4 text-sm font-medium text-primary-600 hover:text-primary-500"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductsContent />
    </Suspense>
  )
}
