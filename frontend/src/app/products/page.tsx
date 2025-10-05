'use client'

import { useState, useEffect, Suspense, useMemo } from 'react'

// Disable static generation for this page since it uses Apollo Client
export const dynamic = 'force-dynamic'
import { useSearchParams, useRouter } from 'next/navigation'
import { 
  Search,
  Grid,
  List,
  SlidersHorizontal,
  AlertCircle
} from 'lucide-react'
// import ProductCard from '../../components/ProductCard'
import { Product } from '../../lib/api'
import { useProductsStore } from '../../store/useProductsStore'
import { usePreferencesStore } from '../../store/usePreferencesStore'
import { useProducts, useProductFilters } from '../../hooks/useProductsAPI'
import { Button } from '../../components/ui/Button'
import { Loading } from '../../components/ui/LoadingSpinner'
import { Pagination } from '../../components/ui/Pagination'
import { Breadcrumb } from '../../components/ui/Breadcrumb'
import MainLayout from '../../components/layout/MainLayout'
import { SyncErrorAlert } from '../../components/ui/ApiErrorAlert'
import toast from 'react-hot-toast'

// Fallback mock data in case API fails
// Fallback products removed - using API products only

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
  const router = useRouter()
  
  const {
    searchQuery,
    currentPage,
    setSearchQuery,
    setCurrentPage,
    setLoading
  } = useProductsStore()
  
  const { viewMode, setViewMode, addToSearchHistory } = usePreferencesStore()
  
  const [selectedCategory, setSelectedCategory] = useState('All Categories')
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 })
  const [showFilters, setShowFilters] = useState(false)
  const [itemsPerPage] = useState(12)
  const [sortBy, setSortBy] = useState('featured')
  const [apiError, setApiError] = useState<string | null>(null)
  
  // Real API integration
  const { filters, sort, updateFilter, updateSort, clearFilters } = useProductFilters()
  
  // Memoize the filter object to prevent unnecessary re-renders
  const memoizedFilter = useMemo(() => ({
    ...filters,
    category: selectedCategory !== 'All Categories' ? selectedCategory : undefined,
    minPrice: priceRange.min > 0 ? priceRange.min : undefined,
    maxPrice: priceRange.max < 1000 ? priceRange.max : undefined,
  }), [filters, selectedCategory, priceRange.min, priceRange.max])
  
  const {
    products: apiProducts,
    loading: apiLoading,
    error: apiErrorData,
    totalCount,
    hasMore,
    fetchMore,
    refetch
  } = useProducts({
    filter: memoizedFilter,
    sort,
    search: searchQuery,
    limit: itemsPerPage,
    offset: (currentPage - 1) * itemsPerPage,
  })
  
  // Use API data or fallback to mock data
  const displayProducts = apiProducts
  const loading = apiLoading
  const totalProducts = totalCount

  // Handle API errors
  useEffect(() => {
    if (apiErrorData) {
      const errorMessage = apiErrorData.message || 'Failed to fetch products'
      console.error('API Error:', apiErrorData)
      setApiError(errorMessage)
      toast.error(`API Error: ${errorMessage}. Using fallback data.`)
    } else {
      setApiError(null)
    }
  }, [apiErrorData])

  // Initialize from URL params
  useEffect(() => {
    const search = searchParams.get('q')
    const category = searchParams.get('category')
    const filter = searchParams.get('filter')
    const sortParam = searchParams.get('sort')
    
    // Only update if values have actually changed
    if (search && search !== searchQuery) {
      setSearchQuery(search)
      addToSearchHistory(search)
    }
    if (category && category !== selectedCategory) {
      setSelectedCategory(category)
    }
    
    // Apply filters from URL
    if (filter) {
      switch (filter) {
        case 'new':
          updateFilter('isNew', true)
          break
        case 'bestseller':
          updateFilter('isBestseller', true)
          break
        case 'sale':
          updateFilter('isOnSale', true)
          break
      }
    }
    
    // Apply sort from URL
    if (sortParam && sortParam !== sortBy) {
      const sortOption = sortOptions.find(opt => opt.value === sortParam)
      if (sortOption) {
        switch (sortParam) {
          case 'price-low':
            updateSort('price_asc')
            break
          case 'price-high':
            updateSort('price_desc')
            break
          case 'rating':
            updateSort('rating_desc')
            break
          case 'newest':
            updateSort('created_desc')
            break
          default:
            updateSort('featured')
        }
        setSortBy(sortParam)
      }
    }
  }, [searchParams, searchQuery, selectedCategory, sortBy])

  // Handle search with URL update
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    addToSearchHistory(query)
    
    const params = new URLSearchParams(searchParams)
    if (query) {
      params.set('q', query)
    } else {
      params.delete('q')
    }
    router.push(`/products?${params.toString()}`)
  }
  
  // Handle category change with URL update
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    
    const params = new URLSearchParams(searchParams)
    if (category !== 'All Categories') {
      params.set('category', category)
    } else {
      params.delete('category')
    }
    router.push(`/products?${params.toString()}`)
  }
  
  // Handle sort change with URL update
  const handleSortChange = (sortValue: string) => {
    setSortBy(sortValue)
    
    // Update API sort
    switch (sortValue) {
      case 'price-low':
        updateSort('price_asc')
        break
      case 'price-high':
        updateSort('price_desc')
        break
      case 'rating':
        updateSort('rating_desc')
        break
      case 'newest':
        updateSort('created_desc')
        break
      default:
        updateSort('created_desc')
    }
    
    const params = new URLSearchParams(searchParams)
    params.set('sort', sortValue)
    router.push(`/products?${params.toString()}`)
  }
  
  // Handle price range change
  const handlePriceRangeChange = (newRange: { min: number; max: number }) => {
    setPriceRange(newRange)
  }
  
  // Apply filters function (simplified)
  // const applyFilters = () => {
  //   // This will trigger the useEffect that applies filters
  // }
  
  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery('')
    setSelectedCategory('All Categories')
    setPriceRange({ min: 0, max: 1000 })
    setSortBy('featured')
    setCurrentPage(1)
    
    // Clear API filters
    clearFilters()
    updateSort('created_desc')
    
    // Clear URL params
    router.push('/products')
  }
  
  // Handle load more products
  const handleLoadMore = () => {
    if (hasMore && !loading) {
      fetchMore()
    }
  }
  
  // Retry API call on error
  const retryApiCall = () => {
    setApiError(null)
    refetch()
  }
  
  // Pagination logic - API handles pagination
  const totalPages = Math.ceil(totalProducts / itemsPerPage)
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <MainLayout>
      <div className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <Breadcrumb 
            items={[
              { label: 'Products' }
            ]} 
            className="mb-8" 
          />
          
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between border-b border-gray-200 pb-6">
            <div className="flex-1">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900">Products</h1>
              <p className="mt-4 text-base text-gray-500">
                {loading ? (
                  <Loading size="sm" text="Loading products..." />
                ) : (
                  `Discover our amazing collection of ${totalProducts} products`
                )}
              </p>
              
              {/* API Error Display */}
              {apiError && (
                <div className="mt-4">
                  <SyncErrorAlert
                    error={apiError}
                    onRetry={retryApiCall}
                  />
                </div>
              )}
            </div>
            
            {/* View Toggle & Mobile Filter */}
            <div className="flex items-center space-x-4 mt-4 lg:mt-0">
              {/* View Mode Toggle */}
              <div className="hidden sm:flex items-center border border-gray-300 rounded-md p-1 bg-white shadow-sm">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="px-3 py-2 min-w-[40px] border-0 mr-1"
                  aria-label="Grid view"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <div className="w-px h-6 bg-gray-300 mx-1"></div>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="px-3 py-2 min-w-[40px] border-0 ml-1"
                  aria-label="List view"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Mobile Filter Button */}
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden"
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
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
                      onChange={(e) => handleSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
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
                          onChange={(e) => handleCategoryChange(e.target.value)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
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
                      onChange={(e) => handlePriceRangeChange({ min: Number(e.target.value), max: priceRange.max })}
                        className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm"
                      />
                      <span className="text-gray-500">to</span>
                      <input
                        type="number"
                        placeholder="Max"
                        value={priceRange.max}
                      onChange={(e) => handlePriceRangeChange({ min: priceRange.min, max: Number(e.target.value) })}
                        className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Quick Filters */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Quick Filters</h3>
                  <div className="mt-2 space-y-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        updateFilter('isNew', true)
                        const params = new URLSearchParams(searchParams)
                        params.set('filter', 'new')
                        router.push(`/products?${params.toString()}`)
                      }}
                      className="w-full justify-start text-primary-600 hover:text-primary-500 h-8"
                    >
                      New Arrivals
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        updateFilter('isBestseller', true)
                        const params = new URLSearchParams(searchParams)
                        params.set('filter', 'bestseller')
                        router.push(`/products?${params.toString()}`)
                      }}
                      className="w-full justify-start text-primary-600 hover:text-primary-500 h-8"
                    >
                      Bestsellers
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        updateFilter('isOnSale', true)
                        const params = new URLSearchParams(searchParams)
                        params.set('filter', 'sale')
                        router.push(`/products?${params.toString()}`)
                      }}
                      className="w-full justify-start text-primary-600 hover:text-primary-500 h-8"
                    >
                      On Sale
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFilters}
                      className="w-full justify-start text-gray-600 hover:text-gray-500 h-8"
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </div>
            </aside>

            {/* Product Grid */}
            <div className="mt-6 lg:col-span-3 lg:mt-0">
              {/* Sort */}
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-gray-700">
                  Showing {displayProducts.length} of {totalProducts} products
                </p>
                <div className="flex items-center space-x-4">
                  <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
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
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loading size="lg" text="Loading products..." />
                </div>
              ) : displayProducts.length > 0 ? (
                <>
                  <div className={`grid gap-6 ${
                    viewMode === 'grid' 
                      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                      : 'grid-cols-1'
                  }`} style={{ minHeight: '200px' }}>
                    {displayProducts.map((product) => (
                      <div key={(product as any)._id || (product as any).id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <div className="aspect-square bg-gray-200 rounded-lg mb-4"></div>
                        <h3 className="font-semibold text-gray-900 mb-2">{product.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-blue-600">₹{product.price}</span>
                          <span className="text-sm text-gray-500">{typeof product.rating === 'number' ? product.rating : product.rating?.average || 0} ⭐</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-12 flex justify-center bg-white p-4 rounded-lg border border-gray-200">
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h10a2 2 0 012 2v14a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
                  <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
                  <Button
                    variant="ghost"
                    onClick={clearAllFilters}
                    className="mt-4 text-sm font-medium text-primary-600 hover:text-primary-500"
                  >
                    Clear all filters
                  </Button>
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
