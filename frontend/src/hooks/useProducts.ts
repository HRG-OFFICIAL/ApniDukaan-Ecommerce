import { useQuery, useMutation } from '@apollo/client';
import { 
  GET_PRODUCTS, 
  GET_PRODUCT, 
  SEARCH_PRODUCTS, 
  GET_CATEGORIES 
} from '../graphql/queries';
import { 
  CREATE_PRODUCT, 
  UPDATE_PRODUCT, 
  DELETE_PRODUCT 
} from '../graphql/mutations';
import { 
  ProductFilter, 
  ProductSort, 
  CreateProductInput, 
  UpdateProductInput 
} from '../graphql/types';

// Hook for fetching products with filters
export function useProducts(
  filter?: ProductFilter,
  sort?: ProductSort,
  search?: string,
  limit = 20,
  offset = 0
) {
  const { data, loading, error, refetch, fetchMore } = useQuery(GET_PRODUCTS, {
    variables: { filter, sort, search, limit, offset },
    notifyOnNetworkStatusChange: true,
  });

  return {
    products: data?.products || [],
    loading,
    error,
    refetch,
    fetchMore: () => fetchMore({
      variables: { offset: data?.products?.length || 0 }
    }),
    hasMore: data?.products?.length === limit
  };
}

// Hook for fetching a single product
export function useProduct(id: string) {
  const { data, loading, error, refetch } = useQuery(GET_PRODUCT, {
    variables: { id },
    skip: !id,
  });

  return {
    product: data?.product,
    loading,
    error,
    refetch
  };
}

// Hook for searching products
export function useSearchProducts(
  query: string,
  filter?: ProductFilter,
  sort?: ProductSort,
  limit = 20,
  offset = 0
) {
  const { data, loading, error, refetch } = useQuery(SEARCH_PRODUCTS, {
    variables: { query, filters: filter, sort, limit, offset },
    skip: !query || query.length < 2,
  });

  return {
    products: data?.searchProducts || [],
    loading,
    error,
    refetch
  };
}

// Hook for fetching categories
export function useCategories() {
  const { data, loading, error, refetch } = useQuery(GET_CATEGORIES);

  return {
    categories: data?.categories || [],
    loading,
    error,
    refetch
  };
}

// Hook for featured products
export function useFeaturedProducts(limit = 8) {
  const { data, loading, error } = useQuery(GET_PRODUCTS, {
    variables: { 
      filter: { isBestseller: true },
      limit 
    },
  });

  return {
    products: data?.products || [],
    loading,
    error
  };
}

// Hook for new products
export function useNewProducts(limit = 8) {
  const { data, loading, error } = useQuery(GET_PRODUCTS, {
    variables: { 
      filter: { isNew: true },
      limit 
    },
  });

  return {
    products: data?.products || [],
    loading,
    error
  };
}

// Hook for sale products
export function useSaleProducts(limit = 8) {
  const { data, loading, error } = useQuery(GET_PRODUCTS, {
    variables: { 
      filter: { isOnSale: true },
      limit 
    },
  });

  return {
    products: data?.products || [],
    loading,
    error
  };
}

// Admin hooks for product management
export function useCreateProduct() {
  const [createProduct, { loading, error }] = useMutation(CREATE_PRODUCT, {
    refetchQueries: ['GetProducts'],
  });

  return {
    createProduct: (input: CreateProductInput) => 
      createProduct({ variables: { input } }),
    loading,
    error
  };
}

export function useUpdateProduct() {
  const [updateProduct, { loading, error }] = useMutation(UPDATE_PRODUCT, {
    refetchQueries: ['GetProducts', 'GetProduct'],
  });

  return {
    updateProduct: (id: string, input: UpdateProductInput) => 
      updateProduct({ variables: { id, input } }),
    loading,
    error
  };
}

export function useDeleteProduct() {
  const [deleteProduct, { loading, error }] = useMutation(DELETE_PRODUCT, {
    refetchQueries: ['GetProducts'],
  });

  return {
    deleteProduct: (id: string) => 
      deleteProduct({ variables: { id } }),
    loading,
    error
  };
}