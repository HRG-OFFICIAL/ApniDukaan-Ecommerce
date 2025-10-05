'use client'

import { useState, useEffect } from 'react'
import { useParams, notFound } from 'next/navigation'
import { useProducts } from '../../../hooks/useProductsAPI'
import ProductCard from '../../../components/ProductCard'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { Breadcrumb } from '../../../components/ui/Breadcrumb'
import { Loading } from '../../../components/ui/LoadingSpinner'
import { Filter, Grid, List, SortAsc, Search } from 'lucide-react'
import { cn } from '../../../utils/cn'
import MainLayout from '../../../components/layout/MainLayout'

const VALID_CATEGORIES = [
  'electronics',
  'clothing',
  'home-garden',
  'sports',
  'books',
  'beauty',
  'toys',
  'automotive'
]

const CATEGORY_INFO = {
  electronics: {
    name: 'Electronics',
    description: 'Discover the latest in technology and electronics',
    icon: '💻'
  },
  clothing: {
    name: 'Clothing & Fashion',
    description: 'Trendy clothing and fashion accessories',
    icon: '👕'
  },
  'home-garden': {
    name: 'Home & Garden',
    description: 'Everything for your home and garden needs',
    icon: '🏠'
  },
  sports: {
    name: 'Sports & Fitness',
    description: 'Sports equipment and fitness gear',
    icon: '🏃‍♂️'
  },
  books: {
    name: 'Books & Media',
    description: 'Books, audiobooks, and educational materials',
    icon: '📚'
  },
  beauty: {
    name: 'Beauty & Personal Care',
    description: 'Beauty products and personal care items',
    icon: '💄'
  },
  toys: {
    name: 'Toys & Games',
    description: 'Fun toys and games for all ages',
    icon: '🧸'
  },
  automotive: {
    name: 'Automotive',
    description: 'Car parts and automotive accessories',
    icon: '🚗'
  }
}

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name-asc', label: 'Name: A to Z' },
  { value: 'rating-desc', label: 'Highest Rated' },
  { value: 'newest', label: 'Newest First' }
]

export default function CategoryPage() {
  const params = useParams()
  const category = params?.category as string
  
  const [sortBy, setSortBy] = useState('featured')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Validate category
  if (!category || !VALID_CATEGORIES.includes(category)) {
    notFound()
  }
  
  const categoryInfo = CATEGORY_INFO[category as keyof typeof CATEGORY_INFO]
  
  // Fetch products for this category
  const { 
    products, 
    loading, 
    error, 
    totalCount,
    fetchMore,
    hasMore,
    refetch
  } = useProducts({
    filter: {
      // Use the URL slug; backend resolves slug/name/ObjectId
      category: category
    },
    search: searchQuery || undefined,
    sort: sortBy === 'featured' ? undefined : 
          sortBy === 'price-asc' ? 'price_asc' :
          sortBy === 'price-desc' ? 'price_desc' :
          sortBy === 'name-asc' ? 'name_asc' :
          sortBy === 'rating-desc' ? 'rating_desc' :
          sortBy === 'newest' ? 'created_desc' : undefined,
    limit: 12
  })
  
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Categories', href: '/categories' },
    { label: categoryInfo.name, href: `/categories/${category}` }
  ]
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    refetch()
  }
  
  if (loading && !products.length) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Loading />
        </div>
      </MainLayout>
    )
  }
  
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Breadcrumb items={breadcrumbItems} />
        </div>
        
        {/* Category Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white mb-8">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-4xl">{categoryInfo.icon}</span>
            <div>
              <h1 className="text-3xl font-bold mb-2">{categoryInfo.name}</h1>
              <p className="text-blue-100">{categoryInfo.description}</p>
            </div>
          </div>
          
          {products.length > 0 && (
            <Badge variant="secondary" className="bg-white/20 text-white">
              {products.length} {products.length === 1 ? 'product' : 'products'} found
            </Badge>
          )}
        </div>
        
        {/* Search and Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder={`Search ${categoryInfo.name.toLowerCase()}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </form>
          
          {/* Sort */}
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {SORT_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  "p-2 rounded-md transition-colors",
                  viewMode === 'grid'
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-400 hover:text-gray-600"
                )}
              >
                <Grid className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-2 rounded-md transition-colors",
                  viewMode === 'list'
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-400 hover:text-gray-600"
                )}
              >
                <List className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">
              Failed to load products: {error.message}
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refetch}
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        )}
        
        {/* Products Grid */}
        {products.length > 0 ? (
          <>
            <div className={cn(
              viewMode === 'grid'
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-4"
            )}>
              {products.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                />
              ))}
            </div>
            
            {/* Load More */}
            {hasMore && (
              <div className="text-center mt-8">
                <Button
                  onClick={fetchMore}
                  disabled={loading}
                  className="px-8"
                >
                  {loading ? 'Loading...' : 'Load More Products'}
                </Button>
              </div>
            )}
          </>
        ) : (
          /* Empty State */
          <div className="text-center py-16">
            <div className="text-6xl mb-4">{categoryInfo.icon}</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No products found
            </h3>
            <p className="text-gray-600 mb-4">
              {searchQuery 
                ? `No products found for "${searchQuery}" in ${categoryInfo.name}`
                : `No products available in ${categoryInfo.name} yet.`
              }
            </p>
            {searchQuery && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('')
                  refetch()
                }}
              >
                Clear Search
              </Button>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  )
}
