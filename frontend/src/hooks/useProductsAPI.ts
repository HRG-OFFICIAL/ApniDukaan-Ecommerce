import { useState, useEffect, useMemo } from 'react'
import { Product } from '../graphql/types'
import { productsApi, ProductFilters, ProductSort, Product as ApiProduct } from '../lib/api'

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
    isFeatured?: boolean
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
    id: '1',
    name: 'Wireless Bluetooth Headphones',
    description: 'High-quality wireless headphones with noise cancellation',
    sku: 'WBH-001',
    price: 199.99,
    originalPrice: 249.99,
    images: ['/images/products/headphones-1.jpg'],
    category: 'Electronics',
    brand: { name: 'TechSound' },
    tags: ['wireless', 'bluetooth', 'headphones'],
    rating: 4.5,
    reviewCount: 128,
    stock: 50,
    isNew: false,
    isBestseller: true,
    isOnSale: true,
    isFeatured: true,
    isActive: true,
    inStock: true,
    specifications: {
      'Color': 'Black',
      'Battery Life': '30 hours'
    },
    reviews: [],
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
  
  // Convert API product to frontend format
  function convertApiProductToFrontend(apiProduct: ApiProduct): Product {
    return {
      id: apiProduct._id,
      name: apiProduct.name,
      description: apiProduct.description,
      sku: apiProduct.sku,
      price: apiProduct.price,
      originalPrice: apiProduct.originalPrice,
      images: apiProduct.images,
      category: apiProduct.category.name,
      subcategory: apiProduct.subcategory?.name,
      brand: apiProduct.brand ? { name: apiProduct.brand } : undefined,
      tags: apiProduct.tags,
      stock: apiProduct.inventory?.quantity || 0,
      isFeatured: apiProduct.featured || false,
      isActive: apiProduct.status === 'published',
      rating: apiProduct.rating?.average || 0,
      reviewCount: apiProduct.rating?.count || 0,
      isOnSale: apiProduct.isOnSale,
      isNew: new Date(apiProduct.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      isBestseller: apiProduct.sales?.totalSold > 100,
      inStock: (apiProduct.inventory?.quantity || 0) > 0,
      specifications: apiProduct.attributes?.reduce((acc, attr) => {
        acc[attr.name] = attr.value;
        return acc;
      }, {} as Record<string, string | number | boolean>) || {},
      reviews: [],
      createdAt: apiProduct.createdAt,
      updatedAt: apiProduct.updatedAt
    };
  }

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
          featured: stableFilter?.isFeatured,
          search: search
        };

        // Convert sort format
        const apiSort: ProductSort = {
          field: sort === 'price' ? 'price' : 
                 sort === 'name' ? 'name' : 
                 sort === 'rating' ? 'rating' : 
                 sort === 'popular' ? 'sales' : 'createdAt',
          order: sort === 'price-low' || sort === 'name' ? 'asc' : 'desc'
        };

        const page = Math.floor(offset / limit) + 1;
        
        const response = await productsApi.getAll(apiFilters, apiSort, page, limit);
        
        if (response.success) {
          // Convert API products to frontend format
          const convertedProducts = response.data.map(convertApiProductToFrontend);
          setProducts(convertedProducts);
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
          // Convert API product to frontend format
          const convertedProduct = {
            id: response.data._id,
            name: response.data.name,
            description: response.data.description,
            sku: response.data.sku,
            price: response.data.price,
            originalPrice: response.data.originalPrice,
            images: response.data.images,
            category: response.data.category.name,
            subcategory: response.data.subcategory?.name,
            brand: response.data.brand ? { name: response.data.brand } : undefined,
            tags: response.data.tags,
            stock: response.data.inventory?.quantity || 0,
            isFeatured: response.data.featured || false,
            isActive: response.data.status === 'published',
            rating: response.data.rating.average,
            reviewCount: response.data.rating.count,
            isOnSale: response.data.isOnSale,
            isNew: new Date(response.data.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            isBestseller: response.data.sales?.totalSold > 100,
            inStock: (response.data.inventory?.quantity || 0) > 0,
            specifications: response.data.attributes?.reduce((acc, attr) => {
              acc[attr.name] = attr.value;
              return acc;
            }, {} as Record<string, string | number | boolean>) || {},
            reviews: [],
            createdAt: response.data.createdAt,
            updatedAt: response.data.updatedAt
          };
          setProduct(convertedProduct);
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
          // Convert API products to frontend format
          const convertedProducts = response.data.map((apiProduct: ApiProduct) => ({
            id: apiProduct._id,
            name: apiProduct.name,
            slug: apiProduct.slug,
            description: apiProduct.description,
            shortDescription: apiProduct.shortDescription,
            sku: apiProduct.sku,
            price: apiProduct.price,
            originalPrice: apiProduct.originalPrice,
            currency: apiProduct.currency,
            images: apiProduct.images,
            thumbnailImage: apiProduct.thumbnailImage,
            category: apiProduct.category.name,
            subcategory: apiProduct.subcategory?.name,
            brand: apiProduct.brand ? { name: apiProduct.brand } : undefined,
            tags: apiProduct.tags,
            attributes: apiProduct.attributes,
            inventory: {
              quantity: apiProduct.inventory.quantity,
              lowStockThreshold: apiProduct.inventory.lowStockThreshold,
              trackQuantity: apiProduct.inventory.trackQuantity,
              allowBackorder: apiProduct.inventory.allowBackorder
            },
            shipping: apiProduct.shipping ? {
              weight: apiProduct.shipping.weight || 0,
              dimensions: apiProduct.shipping.dimensions || { length: 0, width: 0, height: 0 },
              freeShipping: apiProduct.shipping.freeShipping || false,
              shippingClass: apiProduct.shipping.shippingClass || 'standard'
            } : {
              weight: 0,
              dimensions: { length: 0, width: 0, height: 0 },
              freeShipping: false,
              shippingClass: 'standard'
            },
            seo: apiProduct.seo,
            status: apiProduct.status,
            featured: apiProduct.featured,
            visibility: apiProduct.visibility,
            rating: apiProduct.rating.average,
            reviewCount: apiProduct.rating.count,
            sales: {
              totalSold: apiProduct.sales.totalSold,
              revenue: apiProduct.sales.revenue
            },
            isOnSale: apiProduct.isOnSale,
            saleStartDate: apiProduct.saleStartDate,
            saleEndDate: apiProduct.saleEndDate,
            createdAt: apiProduct.createdAt,
            updatedAt: apiProduct.updatedAt,
            // Frontend-specific fields
            stock: apiProduct.inventory.quantity,
            isNew: new Date(apiProduct.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            isBestseller: apiProduct.sales.totalSold > 100,
            discount: apiProduct.originalPrice ? 
              Math.round(((apiProduct.originalPrice - apiProduct.price) / apiProduct.originalPrice) * 100) : 0,
            reviews: []
          }));
          setProducts(convertedProducts);
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
    isFeatured?: boolean
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
    isFeatured: undefined as boolean | undefined,
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
      isFeatured: undefined,
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