import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { Product, ProductFilter, ProductSort } from '../graphql/types'

interface ProductsState {
  products: Product[]
  featuredProducts: Product[]
  categories: string[]
  currentProduct: Product | null
  filters: ProductFilter
  sort: ProductSort
  searchQuery: string
  loading: boolean
  error: string | null
  hasMore: boolean
  currentPage: number
  totalPages: number
}

interface ProductsActions {
  setProducts: (products: Product[]) => void
  addProducts: (products: Product[]) => void
  setFeaturedProducts: (products: Product[]) => void
  setCurrentProduct: (product: Product | null) => void
  setCategories: (categories: string[]) => void
  setFilters: (filters: ProductFilter) => void
  setSort: (sort: ProductSort) => void
  setSearchQuery: (query: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setHasMore: (hasMore: boolean) => void
  setCurrentPage: (page: number) => void
  setTotalPages: (totalPages: number) => void
  clearProducts: () => void
  clearFilters: () => void
  updateProduct: (productId: string, updates: Partial<Product>) => void
}

type ProductsStore = ProductsState & ProductsActions

const initialState: ProductsState = {
  products: [],
  featuredProducts: [],
  categories: [],
  currentProduct: null,
  filters: {},
  sort: { field: 'createdAt', direction: 'DESC' },
  searchQuery: '',
  loading: false,
  error: null,
  hasMore: true,
  currentPage: 1,
  totalPages: 1
}

export const useProductsStore = create<ProductsStore>()(
  devtools(
    (set, get) => ({
      ...initialState,
      
      setProducts: (products: Product[]) => {
        set({ products }, false, 'setProducts')
      },
      
      addProducts: (products: Product[]) => {
        const existingProducts = get().products
        const newProducts = [...existingProducts, ...products]
        set({ products: newProducts }, false, 'addProducts')
      },
      
      setFeaturedProducts: (featuredProducts: Product[]) => {
        set({ featuredProducts }, false, 'setFeaturedProducts')
      },
      
      setCurrentProduct: (currentProduct: Product | null) => {
        set({ currentProduct }, false, 'setCurrentProduct')
      },
      
      setCategories: (categories: string[]) => {
        set({ categories }, false, 'setCategories')
      },
      
      setFilters: (filters: ProductFilter) => {
        set({ filters, currentPage: 1 }, false, 'setFilters')
      },
      
      setSort: (sort: ProductSort) => {
        set({ sort, currentPage: 1 }, false, 'setSort')
      },
      
      setSearchQuery: (searchQuery: string) => {
        set({ searchQuery, currentPage: 1 }, false, 'setSearchQuery')
      },
      
      setLoading: (loading: boolean) => {
        set({ loading }, false, 'setLoading')
      },
      
      setError: (error: string | null) => {
        set({ error }, false, 'setError')
      },
      
      setHasMore: (hasMore: boolean) => {
        set({ hasMore }, false, 'setHasMore')
      },
      
      setCurrentPage: (currentPage: number) => {
        set({ currentPage }, false, 'setCurrentPage')
      },
      
      setTotalPages: (totalPages: number) => {
        set({ totalPages }, false, 'setTotalPages')
      },
      
      clearProducts: () => {
        set({ products: [], currentPage: 1, hasMore: true }, false, 'clearProducts')
      },
      
      clearFilters: () => {
        set({ 
          filters: {}, 
          searchQuery: '', 
          currentPage: 1 
        }, false, 'clearFilters')
      },
      
      updateProduct: (productId: string, updates: Partial<Product>) => {
        const products = get().products.map(product =>
          product.id === productId ? { ...product, ...updates } : product
        )
        
        const featuredProducts = get().featuredProducts.map(product =>
          product.id === productId ? { ...product, ...updates } : product
        )
        
        const currentProduct = get().currentProduct
        const updatedCurrentProduct = currentProduct?.id === productId 
          ? { ...currentProduct, ...updates }
          : currentProduct
        
        set({ 
          products, 
          featuredProducts,
          currentProduct: updatedCurrentProduct 
        }, false, 'updateProduct')
      }
    }),
    {
      name: 'products-store'
    }
  )
)

// Selectors for common use cases
export const selectFilteredProducts = (state: ProductsStore) => {
  return state.products
}

export const selectProductsByCategory = (category: string) => (state: ProductsStore) => {
  return state.products.filter(product => product.category === category)
}

export const selectProductById = (productId: string) => (state: ProductsStore) => {
  return state.products.find(product => product.id === productId)
}
