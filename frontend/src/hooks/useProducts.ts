import { useState, useEffect } from 'react';
import { productService } from '../services/productService';
import { searchService } from '../services/searchService';
import { Product } from '../lib/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface ProductFilter {
  categories?: string[];
  brands?: string[];
  priceRange?: [number, number];
  rating?: number;
  availability?: 'all' | 'in-stock' | 'out-of-stock';
  isNew?: boolean;
  isBestseller?: boolean;
  isOnSale?: boolean;
}

export interface ProductSort {
  field: 'name' | 'price' | 'rating' | 'createdAt';
  order: 'asc' | 'desc';
}

export interface CreateProductInput {
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: string;
  brand: string;
  stock: number;
  isNew?: boolean;
  isBestseller?: boolean;
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  price?: number;
  originalPrice?: number;
  images?: string[];
  category?: string;
  brand?: string;
  stock?: number;
  isNew?: boolean;
  isBestseller?: boolean;
}

// Hook for fetching products with filters
export function useProducts(
  filter?: ProductFilter,
  sort?: ProductSort,
  search?: string,
  limit = 20,
  offset = 0
) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      let response;
      const mapSortToSearchSort = (s?: ProductSort): 'relevance' | 'price-asc' | 'price-desc' | 'rating' | 'newest' => {
        if (!s) return 'relevance';
        if (s.field === 'price') return s.order === 'asc' ? 'price-asc' : 'price-desc';
        if (s.field === 'rating') return 'rating';
        if (s.field === 'createdAt') return 'newest';
        return 'relevance';
      };

      if (search && search.length >= 2) {
        response = await searchService.searchProducts({
          query: search,
          filters: filter,
          sortBy: mapSortToSearchSort(sort),
          limit,
          page: Math.floor(offset / limit) + 1
        });
      } else {
        response = await productService.getProducts({
          page: Math.floor(offset / limit) + 1,
          limit,
          category: filter?.categories?.[0],
          sortField: sort?.field,
          sortOrder: sort?.order,
          search
        });
      }

      if ('success' in response) {
        const newProducts = response.data.products || [];
        if (offset === 0) {
          setProducts(newProducts);
        } else {
          setProducts(prev => [...prev, ...newProducts]);
        }
        setHasMore(newProducts.length === limit);
      } else {
        const newProducts = response.products || [];
        if (offset === 0) {
          setProducts(newProducts);
        } else {
          setProducts(prev => [...prev, ...newProducts]);
        }
        setHasMore(newProducts.length === limit);
      }
    } catch (err) {
      setError('Network error');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    setProducts([]);
    fetchProducts();
  };

  const fetchMore = () => {
    if (!loading && hasMore) {
      fetchProducts();
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [filter, sort, search, limit, offset]);

  return {
    products,
    loading,
    error,
    refetch,
    fetchMore,
    hasMore
  };
}

// Hook for fetching a single product
export function useProduct(id: string) {
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProduct = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const response = await productService.getProduct(id);
      
      if (response.success) {
        setProduct(response.data);
      } else {
        setError(response.error || 'Failed to fetch product');
      }
    } catch (err) {
      setError('Network error');
      console.error('Error fetching product:', err);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchProduct();
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  return {
    product,
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
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchProducts = async () => {
    if (!query || query.length < 2) {
      setProducts([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await searchService.searchProducts({
        query,
        filters: filter,
        sortBy: ((): 'relevance' | 'price-asc' | 'price-desc' | 'rating' | 'newest' => {
          if (!sort) return 'relevance';
          if (sort.field === 'price') return sort.order === 'asc' ? 'price-asc' : 'price-desc';
          if (sort.field === 'rating') return 'rating';
          if (sort.field === 'createdAt') return 'newest';
          return 'relevance';
        })(),
        limit,
        page: Math.floor(offset / limit) + 1
      });

      setProducts(response.products || []);
    } catch (err) {
      setError('Network error');
      console.error('Error searching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    searchProducts();
  };

  useEffect(() => {
    searchProducts();
  }, [query, filter, sort, limit, offset]);

  return {
    products,
    loading,
    error,
    refetch
  };
}

// Hook for fetching categories
export function useCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await productService.getCategories();
      
      if (response.success) {
        setCategories(response.data || []);
      } else {
        setError(response.error || 'Failed to fetch categories');
      }
    } catch (err) {
      setError('Network error');
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchCategories();
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return {
    categories,
    loading,
    error,
    refetch
  };
}

// Hook for featured products
export function useFeaturedProducts(limit = 8) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFeaturedProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await productService.getProducts({
        page: 1,
        limit,
        sortField: 'rating',
        sortOrder: 'desc'
      });

      if (response.success) {
        setProducts(response.data.products || []);
      } else {
        setError(response.error || 'Failed to fetch featured products');
      }
    } catch (err) {
      setError('Network error');
      console.error('Error fetching featured products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeaturedProducts();
  }, [limit]);

  return {
    products,
    loading,
    error
  };
}

// Hook for new products
export function useNewProducts(limit = 8) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNewProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await productService.getProducts({
        page: 1,
        limit,
        sortField: 'createdAt',
        sortOrder: 'desc'
      });

      if (response.success) {
        setProducts(response.data.products || []);
      } else {
        setError(response.error || 'Failed to fetch new products');
      }
    } catch (err) {
      setError('Network error');
      console.error('Error fetching new products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNewProducts();
  }, [limit]);

  return {
    products,
    loading,
    error
  };
}

// Hook for sale products
export function useSaleProducts(limit = 8) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSaleProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await productService.getProducts({
        page: 1,
        limit,
        sortField: 'price',
        sortOrder: 'asc'
      });

      if (response.success) {
        // Filter products with discounts
        const saleProducts = (response.data.products || []).filter(
          (product: any) => product.originalPrice && product.originalPrice > product.price
        );
        setProducts(saleProducts);
      } else {
        setError(response.error || 'Failed to fetch sale products');
      }
    } catch (err) {
      setError('Network error');
      console.error('Error fetching sale products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSaleProducts();
  }, [limit]);

  return {
    products,
    loading,
    error
  };
}

// Admin hooks for product management
export function useCreateProduct() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createProduct = async (input: CreateProductInput) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/catalog/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(input)
      });

      const data = await response.json();
      return { success: data.success, product: data.data };
    } catch (err) {
      setError('Network error');
      console.error('Error creating product:', err);
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  return {
    createProduct,
    loading,
    error
  };
}

export function useUpdateProduct() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProduct = async (id: string, input: UpdateProductInput) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/catalog/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(input)
      });

      const data = await response.json();
      return { success: data.success, product: data.data };
    } catch (err) {
      setError('Network error');
      console.error('Error updating product:', err);
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  return {
    updateProduct,
    loading,
    error
  };
}

export function useDeleteProduct() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteProduct = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/catalog/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      const data = await response.json();
      return { success: data.success };
    } catch (err) {
      setError('Network error');
      console.error('Error deleting product:', err);
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  return {
    deleteProduct,
    loading,
    error
  };
}