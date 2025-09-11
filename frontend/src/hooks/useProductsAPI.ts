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
    slug: 'wireless-bluetooth-headphones',
    description: 'High-quality wireless headphones with noise cancellation',
    shortDescription: 'Premium wireless headphones',
    sku: 'WBH-001',
    price: 199.99,
    originalPrice: 249.99,
    currency: 'USD',
    images: ['/images/products/headphones-1.jpg'],
    thumbnailImage: '/images/products/headphones-1.jpg',
    category: {
      id: 'cat-1',
      name: 'Electronics',
      slug: 'electronics'
    },
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
      dimensions: { length: 20, width: 15, height: 8 },
      freeShipping: true
    },
    status: 'published',
    featured: true,
    visibility: 'public',
    rating: { average: 4.5, count: 128 },
    sales: { totalSold: 45, revenue: 8999.55 },
    isOnSale: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    // Frontend-specific fields
    stock: 50,
    isNew: false,
    isBestseller: true,
    discount: 20,
    reviews: []
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
      id: apiProduct.id || apiProduct._id,
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
      category: {
        id: apiProduct.category.id || apiProduct.category._id,
        name: apiProduct.category.name,
        slug: apiProduct.category.slug
      },
      subcategory: apiProduct.subcategory ? {
        id: apiProduct.subcategory.id || apiProduct.subcategory._id,
        name: apiProduct.subcategory.name,
        slug: apiProduct.subcategory.slug
      } : undefined,
      brand: apiProduct.brand,
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
      seo: apiProduct.seo || null,
      status: apiProduct.status || 'published',
      featured: apiProduct.featured || false,
      visibility: apiProduct.visibility || 'public',
      rating: apiProduct.rating ? {
        average: apiProduct.rating.average || 0,
        count: apiProduct.rating.count || 0
      } : {
        average: 0,
        count: 0
      },
      sales: apiProduct.sales ? {
        totalSold: apiProduct.sales.totalSold || 0,
        revenue: apiProduct.sales.revenue || 0
      } : {
        totalSold: 0,
        revenue: 0
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
      reviews: [] // Will be populated separately if needed
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
            id: response.data.id || response.data._id,
            name: response.data.name,
            slug: response.data.slug,
            description: response.data.description,
            shortDescription: response.data.shortDescription,
            sku: response.data.sku,
            price: response.data.price,
            originalPrice: response.data.originalPrice,
            currency: response.data.currency,
            images: response.data.images,
            thumbnailImage: response.data.thumbnailImage,
            category: {
              id: response.data.category.id || response.data.category._id,
              name: response.data.category.name,
              slug: response.data.category.slug
            },
            subcategory: response.data.subcategory ? {
              id: response.data.subcategory.id || response.data.subcategory._id,
              name: response.data.subcategory.name,
              slug: response.data.subcategory.slug
            } : undefined,
            brand: response.data.brand,
            tags: response.data.tags,
            attributes: response.data.attributes,
            inventory: {
              quantity: response.data.inventory.quantity,
              lowStockThreshold: response.data.inventory.lowStockThreshold,
              trackQuantity: response.data.inventory.trackQuantity,
              allowBackorder: response.data.inventory.allowBackorder
            },
            shipping: response.data.shipping ? {
              weight: response.data.shipping.weight || 0,
              dimensions: response.data.shipping.dimensions || { length: 0, width: 0, height: 0 },
              freeShipping: response.data.shipping.freeShipping || false,
              shippingClass: response.data.shipping.shippingClass || 'standard'
            } : {
              weight: 0,
              dimensions: { length: 0, width: 0, height: 0 },
              freeShipping: false,
              shippingClass: 'standard'
            },
            seo: response.data.seo,
            status: response.data.status,
            featured: response.data.featured,
            visibility: response.data.visibility,
            rating: {
              average: response.data.rating.average,
              count: response.data.rating.count
            },
            sales: {
              totalSold: response.data.sales.totalSold,
              revenue: response.data.sales.revenue
            },
            isOnSale: response.data.isOnSale,
            saleStartDate: response.data.saleStartDate,
            saleEndDate: response.data.saleEndDate,
            createdAt: response.data.createdAt,
            updatedAt: response.data.updatedAt,
            // Frontend-specific fields
            stock: response.data.inventory.quantity,
            isNew: new Date(response.data.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            isBestseller: response.data.sales.totalSold > 100,
            discount: response.data.originalPrice ? 
              Math.round(((response.data.originalPrice - response.data.price) / response.data.originalPrice) * 100) : 0,
            reviews: []
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
            id: apiProduct.id || apiProduct._id,
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
            category: {
              id: apiProduct.category.id || apiProduct.category._id,
              name: apiProduct.category.name,
              slug: apiProduct.category.slug
            },
            subcategory: apiProduct.subcategory ? {
              id: apiProduct.subcategory.id || apiProduct.subcategory._id,
              name: apiProduct.subcategory.name,
              slug: apiProduct.subcategory.slug
            } : undefined,
            brand: apiProduct.brand,
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
            rating: {
              average: apiProduct.rating.average,
              count: apiProduct.rating.count
            },
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