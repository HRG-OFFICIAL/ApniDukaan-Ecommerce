import { useState, useEffect, useMemo } from 'react'
import { productsApi, ProductFilters, ProductSort, Product } from '../lib/api'

interface UseProductsOptions {
  filter?: {
    category?: string
    subcategory?: string
    brand?: string
    minPrice?: number
    maxPrice?: number
    isOnSale?: boolean
    isNew?: boolean
    isBestseller?: boolean
    featured?: boolean
    isActive?: boolean
    tags?: string[]
    colors?: string[]
    sizes?: string[]
  }
  sort?: string
  search?: string
  limit?: number
  offset?: number
}

interface UseProductsResult {
  products: Product[]
  loading: boolean
  error: Error | null
  totalCount: number
  hasMore: boolean
  fetchMore: () => void
  refetch: () => void
}

// Mock products for fallback
const mockProducts: Product[] = [
  {
    _id: '1',
    name: 'Wireless Bluetooth Headphones',
    slug: 'wireless-bluetooth-headphones',
    description: 'High-quality wireless headphones with noise cancellation',
    shortDescription: 'Wireless ANC headphones',
    sku: 'WBH-001',
    price: 199.99,
    originalPrice: 249.99,
    currency: 'USD',
    images: ['/images/products/headphones-1.jpg'],
    thumbnailImage: '/images/products/headphones-1.jpg',
    category: { _id: 'cat1', name: 'Electronics', slug: 'electronics' },
    subcategory: { _id: 'sub1', name: 'Headphones', slug: 'headphones' },
    brand: 'TechSound',
    tags: ['wireless', 'bluetooth', 'headphones'],
    attributes: [
      { name: 'Color', value: 'Black' },
      { name: 'Battery Life', value: '30 hours' }
    ],
    inventory: {
      quantity: 50,
      lowStockThreshold: 5,
      trackQuantity: true,
      allowBackorder: false
    },
    shipping: {
      weight: 0.5,
      dimensions: { length: 20, width: 18, height: 8 },
      freeShipping: false,
      shippingClass: 'standard'
    },
    seo: { title: 'Wireless Bluetooth Headphones', description: 'ANC wireless headphones' },
    status: 'published',
    featured: true,
    visibility: 'public',
    rating: { average: 4.5, count: 128 },
    sales: { totalSold: 500, revenue: 99999 },
    isOnSale: true,
    saleStartDate: new Date().toISOString(),
    saleEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

export function useProducts(options: UseProductsOptions = {}): UseProductsResult {
  const { filter, sort, search, limit = 12, offset = 0 } = options
  
  // State management
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [totalCount, setTotalCount] = useState(0)

  // Memoize the filter object to prevent unnecessary re-renders
  const stableFilter = useMemo(() => filter, [JSON.stringify(filter)])
  
  // No conversion needed: API client returns `Product` shape already

  // Real API call
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      setError(null)
      
      try {
        // Convert frontend filter format to API format
        const apiFilters: ProductFilters = {
          category: stableFilter?.category,
          subcategory: stableFilter?.subcategory,
          brand: stableFilter?.brand,
          minPrice: stableFilter?.minPrice,
          maxPrice: stableFilter?.maxPrice,
          tags: stableFilter?.tags,
          status: stableFilter?.isActive ? 'published' : undefined,
          featured: stableFilter?.featured,
          search: search
        };

        // Convert sort format
        const apiSort: ProductSort = {
          field: sort === 'price' ? 'price' : 
                 sort === 'name' ? 'name' : 
                 sort === 'rating' ? 'rating' : 
                 sort === 'popular' ? 'sales' : 'createdAt',
          order: sort?.includes('asc') ? 'asc' : 'desc'
        };

        const page = Math.floor(offset / limit) + 1;
        
        const response = await productsApi.getAll(apiFilters, apiSort, page, limit);
        
        if (response.success) {
          setProducts(response.data);
          setTotalCount(response.pagination?.total || 0);
        } else {
          throw new Error(response.error || 'Failed to fetch products');
        }
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(err as Error);
        // Fallback to mock data on error
        setProducts(mockProducts.slice(0, limit));
        setTotalCount(mockProducts.length);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [stableFilter, sort, search, limit, offset]);

  // Calculate pagination
  const hasMore = (offset + limit) < totalCount

  const fetchMore = async () => {
    if (hasMore && !loading) {
      // In a real implementation, this would fetch more data from the API
      console.log('Fetch more products')
    }
  }

  const refetch = async () => {
    // Trigger a refetch by updating the effect dependencies
    setLoading(true)
    // The useEffect will handle the actual refetch
  }

  return {
    products,
    loading,
    error,
    totalCount,
    hasMore,
    fetchMore,
    refetch,
  }
}

interface UseProductOptions {
  id: string
}

interface UseProductResult {
  product: Product | null
  loading: boolean
  error: Error | null
  refetch: () => void
}

export function useProduct(id: string): UseProductResult {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const response = await productsApi.getById(id);
        
        if (response.success) {
          // Return the API product directly since it matches the lib/api Product interface
          setProduct(response.data);
        } else {
          throw new Error(response.error || 'Failed to fetch product');
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setError(err as Error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id])

  const refetch = async () => {
    // Trigger a refetch by updating the effect dependencies
    setLoading(true)
    // The useEffect will handle the actual refetch
  }

  return {
    product,
    loading,
    error,
    refetch,
  }
}

interface UseProductSearchOptions {
  query: string
  limit?: number
}

interface UseProductSearchResult {
  products: Product[]
  loading: boolean
  error: Error | null
  refetch: () => void
}

export function useProductSearch(options: UseProductSearchOptions): UseProductSearchResult {
  const { query, limit = 10 } = options
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const searchProducts = async () => {
      if (!query.trim()) {
        setProducts([])
        return
      }

      setLoading(true)
      setError(null)
      
      try {
        const response = await productsApi.search(query, {}, 1, limit);
        
        if (response.success) {
          setProducts(response.data);
        } else {
          throw new Error(response.error || 'Failed to search products');
        }
      } catch (err) {
        console.error('Error searching products:', err);
        setError(err as Error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    searchProducts();
  }, [query, limit])

  const refetch = async () => {
    // Trigger a refetch by updating the effect dependencies
    setLoading(true)
    // The useEffect will handle the actual refetch
  }

  return {
    products,
    loading,
    error,
    refetch,
  }
}

// Product filters hook
interface UseProductFiltersResult {
  filters: {
    category?: string
    subcategory?: string
    brand?: string
    minPrice?: number
    maxPrice?: number
    isOnSale?: boolean
    isNew?: boolean
    isBestseller?: boolean
    featured?: boolean
    isActive?: boolean
    tags?: string[]
    colors?: string[]
    sizes?: string[]
  }
  sort: string
  updateFilter: (key: string, value: any) => void
  updateSort: (sort: string) => void
  clearFilters: () => void
}

export function useProductFilters(): UseProductFiltersResult {
  const [filters, setFilters] = useState({
    category: undefined as string | undefined,
    subcategory: undefined as string | undefined,
    brand: undefined as string | undefined,
    minPrice: undefined as number | undefined,
    maxPrice: undefined as number | undefined,
    isOnSale: undefined as boolean | undefined,
    isNew: undefined as boolean | undefined,
    isBestseller: undefined as boolean | undefined,
    featured: undefined as boolean | undefined,
    isActive: undefined as boolean | undefined,
    tags: undefined as string[] | undefined,
    colors: undefined as string[] | undefined,
    sizes: undefined as string[] | undefined,
  })
  
  const [sort, setSort] = useState('featured')

  const updateFilter = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const updateSort = (newSort: string) => {
    setSort(newSort)
  }

  const clearFilters = () => {
    setFilters({
      category: undefined,
      subcategory: undefined,
      brand: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      isOnSale: undefined,
      isNew: undefined,
      isBestseller: undefined,
      featured: undefined,
      isActive: undefined,
      tags: undefined,
      colors: undefined,
      sizes: undefined,
    })
    setSort('featured')
  }

  return {
    filters,
    sort,
    updateFilter,
    updateSort,
    clearFilters
  }
}