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
            
            {/* Mobile Filter Button */}
            <div className="flex items-center space-x-4 mt-4 lg:mt-0">
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
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <div className="space-y-8">
                  {/* Search */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Search className="h-5 w-5 mr-2 text-gray-600" />
                      Search Products
                    </h3>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                      />
                      <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                    </div>
                  </div>

                  {/* Categories */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
                    <div className="space-y-3">
                      {categories.map((category) => (
                        <label key={category} className="flex items-center p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                          <input
                            type="radio"
                            name="category"
                            value={category}
                            checked={selectedCategory === category}
                            onChange={(e) => handleCategoryChange(e.target.value)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <span className={`ml-3 text-sm font-medium ${
                            selectedCategory === category ? 'text-blue-600' : 'text-gray-700'
                          }`}>
                            {category}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Price Range */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Range</h3>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-600 mb-1">Min Price</label>
                          <input
                            type="number"
                            placeholder="0"
                            value={priceRange.min}
                            onChange={(e) => handlePriceRangeChange({ min: Number(e.target.value), max: priceRange.max })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                          />
                        </div>
                        <div className="flex items-center pt-6">
                          <span className="text-gray-500 font-medium">to</span>
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-600 mb-1">Max Price</label>
                          <input
                            type="number"
                            placeholder="1000"
                            value={priceRange.max}
                            onChange={(e) => handlePriceRangeChange({ min: priceRange.min, max: Number(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                          />
                        </div>
                      </div>
                      <div className="text-center">
                        <span className="text-sm text-gray-600">
                          ₹{priceRange.min} - ₹{priceRange.max}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Filters */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Filters</h3>
                    <div className="space-y-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          updateFilter('isNew', true)
                          const params = new URLSearchParams(searchParams)
                          params.set('filter', 'new')
                          router.push(`/products?${params.toString()}`)
                        }}
                        className="w-full justify-start text-gray-700 hover:text-blue-600 hover:border-blue-300 h-10 border-gray-300"
                      >
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                        New Arrivals
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          updateFilter('isBestseller', true)
                          const params = new URLSearchParams(searchParams)
                          params.set('filter', 'bestseller')
                          router.push(`/products?${params.toString()}`)
                        }}
                        className="w-full justify-start text-gray-700 hover:text-blue-600 hover:border-blue-300 h-10 border-gray-300"
                      >
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                        Bestsellers
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          updateFilter('isOnSale', true)
                          const params = new URLSearchParams(searchParams)
                          params.set('filter', 'sale')
                          router.push(`/products?${params.toString()}`)
                        }}
                        className="w-full justify-start text-gray-700 hover:text-blue-600 hover:border-blue-300 h-10 border-gray-300"
                      >
                        <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                        On Sale
                      </Button>
                      <div className="pt-2 border-t border-gray-200">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearAllFilters}
                          className="w-full justify-start text-gray-600 hover:text-red-600 hover:bg-red-50 h-10"
                        >
                          Clear All Filters
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            {/* Product Grid */}
            <div className="mt-6 lg:col-span-3 lg:mt-0">
              {/* Sort & View Controls */}
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-black font-medium">
                  {(() => {
                    const startItem = (currentPage - 1) * itemsPerPage + 1;
                    const endItem = Math.min(currentPage * itemsPerPage, totalProducts);
                    return `Showing ${startItem}-${endItem} of ${totalProducts.toLocaleString()} products`;
                  })()}
                </p>
                <div className="flex items-center space-x-4">
                  {/* Sort Dropdown */}
                  <div className="flex items-center space-x-2">
                    <label htmlFor="sort-select" className="text-sm font-medium text-black">
                      Sort by:
                    </label>
                    <select
                      id="sort-select"
                      value={sortBy}
                      onChange={(e) => handleSortChange(e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm min-w-[180px]"
                    >
                      {sortOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* View Mode Toggle */}
                  <div className="flex items-center border border-gray-300 rounded-md p-1 bg-white shadow-sm">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className={`px-3 py-2 min-w-[40px] border-0 mr-1 ${
                        viewMode === 'grid' 
                          ? '!bg-black !text-white hover:!bg-gray-800' 
                          : '!text-black hover:!bg-gray-100'
                      }`}
                      style={{
                        color: viewMode === 'grid' ? 'white' : 'black',
                        backgroundColor: viewMode === 'grid' ? 'black' : 'transparent'
                      }}
                      aria-label="Grid view"
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <div className="w-px h-6 bg-gray-300 mx-1"></div>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className={`px-3 py-2 min-w-[40px] border-0 ml-1 ${
                        viewMode === 'list' 
                          ? '!bg-black !text-white hover:!bg-gray-800' 
                          : '!text-black hover:!bg-gray-100'
                      }`}
                      style={{
                        color: viewMode === 'list' ? 'white' : 'black',
                        backgroundColor: viewMode === 'list' ? 'black' : 'transparent'
                      }}
                      aria-label="List view"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
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
                  }`}>
                    {displayProducts.map((product) => (
                      <div key={(product as any)._id || (product as any).id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200 flex flex-col h-full">
                        {/* Product Image - Fixed Height */}
                        <div className="aspect-square bg-gray-100 relative overflow-hidden">
                          {product.images && product.images.length > 0 ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder-product.jpg'
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                              <div className="text-center">
                                <div className="w-16 h-16 mx-auto mb-2 bg-gray-300 rounded-lg flex items-center justify-center">
                                  <span className="text-2xl text-gray-500">📦</span>
                                </div>
                                <p className="text-xs text-gray-500">No Image</p>
                              </div>
                            </div>
                          )}
                          
                          {/* Product Badges */}
                          <div className="absolute top-2 left-2 flex flex-col gap-1">
                            {(product as any)?.isNew && (
                              <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">New</span>
                            )}
                            {product.isOnSale && (
                              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">Sale</span>
                            )}
                            {(product as any)?.isBestseller && (
                              <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium">Bestseller</span>
                            )}
                          </div>
                        </div>
                        
                        {/* Product Info - Flexible Height with Fixed Bottom */}
                        <div className="p-4 flex flex-col flex-grow">
                          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 h-12 flex items-start">{product.name}</h3>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2 h-10 flex items-start">{product.description}</p>
                          
                          {/* Price and Rating - Fixed Height */}
                          <div className="flex items-center justify-between mb-3 h-8">
                            <div className="flex flex-col">
                              <span className="text-lg font-bold text-blue-600">₹{product.price}</span>
                              {product.originalPrice && product.originalPrice > product.price && (
                                <span className="text-sm text-gray-500 line-through">₹{product.originalPrice}</span>
                              )}
                            </div>
                            <div className="flex items-center">
                              <span className="text-sm text-gray-500">
                                {typeof product.rating === 'number' ? product.rating : product.rating?.average || 0} ⭐
                              </span>
                            </div>
                          </div>
                          
                          {/* Add to Cart Button - Fixed at Bottom */}
                          <button className="w-full mt-auto bg-black text-white py-2 px-4 rounded-md hover:bg-gray-800 transition-colors duration-200 text-sm font-medium">
                            Add to Cart
                          </button>
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
