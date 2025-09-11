import { useQuery, useLazyQuery, useMutation } from '@apollo/client'
import { useState, useCallback } from 'react'
import { GET_PRODUCTS, GET_PRODUCT, SEARCH_PRODUCTS } from '../graphql/queries'
import { CREATE_PRODUCT, UPDATE_PRODUCT, DELETE_PRODUCT } from '../graphql/mutations'
import { Product, ProductFilter, ProductSort } from '../graphql/types'

interface UseProductsOptions {
  filter?: ProductFilter
  sort?: ProductSort
  search?: string
  limit?: number
  offset?: number
}

interface UseProductsResult {
  products: Product[]
  loading: boolean
  error: any
  totalCount: number
  hasMore: boolean
  fetchMore: () => void
  refetch: () => void
}

export function useProducts(options: UseProductsOptions = {}): UseProductsResult {
  const { filter, sort, search, limit = 12, offset = 0 } = options
  
  const { data, loading, error, fetchMore: apolloFetchMore, refetch } = useQuery(GET_PRODUCTS, {
    variables: { filter, sort, search, limit, offset },
    errorPolicy: 'all',
    notifyOnNetworkStatusChange: true,
  })

  const products = data?.products || []
  const totalCount = data?.totalCount || 0
  const hasMore = products.length < totalCount

  const fetchMore = useCallback(() => {
    if (hasMore && !loading) {
      apolloFetchMore({
        variables: {
          offset: products.length,
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult) return prev
          return {
            ...prev,
            products: [...prev.products, ...fetchMoreResult.products],
          }
        },
      })
    }
  }, [hasMore, loading, apolloFetchMore, products.length])

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

interface UseProductResult {
  product: Product | null
  loading: boolean
  error: any
  refetch: () => void
}

export function useProduct(id: string): UseProductResult {
  const { data, loading, error, refetch } = useQuery(GET_PRODUCT, {
    variables: { id },
    errorPolicy: 'all',
    skip: !id,
  })

  return {
    product: data?.product || null,
    loading,
    error,
    refetch,
  }
}

interface UseProductSearchOptions {
  query?: string
  filters?: ProductFilter
  sort?: ProductSort
  limit?: number
  offset?: number
}

interface UseProductSearchResult {
  products: Product[]
  loading: boolean
  error: any
  search: (searchQuery: string) => void
  clearSearch: () => void
  hasSearched: boolean
}

export function useProductSearch(options: UseProductSearchOptions = {}): UseProductSearchResult {
  const { filters, sort, limit = 20, offset = 0 } = options
  const [hasSearched, setHasSearched] = useState(false)

  const [searchProducts, { data, loading, error }] = useLazyQuery(SEARCH_PRODUCTS, {
    errorPolicy: 'all',
  })

  const search = useCallback((query: string) => {
    if (query.trim()) {
      setHasSearched(true)
      searchProducts({
        variables: {
          query: query.trim(),
          filters,
          sort,
          limit,
          offset,
        },
      })
    }
  }, [searchProducts, filters, sort, limit, offset])

  const clearSearch = useCallback(() => {
    setHasSearched(false)
  }, [])

  return {
    products: data?.searchProducts || [],
    loading,
    error,
    search,
    clearSearch,
    hasSearched,
  }
}

interface UseProductMutationsResult {
  createProduct: (productData: any) => Promise<Product>
  updateProduct: (id: string, productData: any) => Promise<Product>
  deleteProduct: (id: string) => Promise<boolean>
  loading: boolean
  error: any
}

export function useProductMutations(): UseProductMutationsResult {
  const [createProductMutation, { loading: createLoading, error: createError }] = useMutation(CREATE_PRODUCT)
  const [updateProductMutation, { loading: updateLoading, error: updateError }] = useMutation(UPDATE_PRODUCT)
  const [deleteProductMutation, { loading: deleteLoading, error: deleteError }] = useMutation(DELETE_PRODUCT)

  const createProduct = useCallback(async (productData: any): Promise<Product> => {
    try {
      const { data } = await createProductMutation({
        variables: { input: productData },
        update: (cache, { data: { createProduct } }) => {
          // Update the products cache
          const existingProducts = cache.readQuery({ query: GET_PRODUCTS }) as any
          if (existingProducts) {
            cache.writeQuery({
              query: GET_PRODUCTS,
              data: {
                products: [createProduct, ...existingProducts.products],
                totalCount: existingProducts.totalCount + 1,
              },
            })
          }
        },
      })
      return data.createProduct
    } catch (error) {
      throw new Error('Failed to create product')
    }
  }, [createProductMutation])

  const updateProduct = useCallback(async (id: string, productData: any): Promise<Product> => {
    try {
      const { data } = await updateProductMutation({
        variables: { id, input: productData },
      })
      return data.updateProduct
    } catch (error) {
      throw new Error('Failed to update product')
    }
  }, [updateProductMutation])

  const deleteProduct = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { data } = await deleteProductMutation({
        variables: { id },
        update: (cache) => {
          // Remove the product from cache
          const existingProducts = cache.readQuery({ query: GET_PRODUCTS }) as any
          if (existingProducts) {
            cache.writeQuery({
              query: GET_PRODUCTS,
              data: {
                products: existingProducts.products.filter((p: Product) => p.id !== id),
                totalCount: existingProducts.totalCount - 1,
              },
            })
          }
        },
      })
      return data.deleteProduct
    } catch (error) {
      throw new Error('Failed to delete product')
    }
  }, [deleteProductMutation])

  const loading = createLoading || updateLoading || deleteLoading
  const error = createError || updateError || deleteError

  return {
    createProduct,
    updateProduct,
    deleteProduct,
    loading,
    error,
  }
}

// Helper hook for product filters and sorting
export function useProductFilters() {
  const [filters, setFilters] = useState<ProductFilter>({})
  const [sort, setSort] = useState<ProductSort>({
    field: 'createdAt',
    direction: 'DESC',
  })

  const updateFilter = useCallback((key: keyof ProductFilter, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({})
  }, [])

  const updateSort = useCallback((field: 'name' | 'price' | 'rating' | 'createdAt' | 'updatedAt', direction: 'ASC' | 'DESC' = 'ASC') => {
    setSort({ field, direction })
  }, [])

  return {
    filters,
    sort,
    updateFilter,
    clearFilters,
    updateSort,
    setFilters,
    setSort,
  }
}
