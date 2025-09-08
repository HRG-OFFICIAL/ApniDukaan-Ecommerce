'use client'

import { useState, useEffect } from 'react'
import { Product } from '@/components/product/ProductCard'

// Mock data for development
const mockFeaturedProducts: Product[] = [
  {
    id: '1',
    name: 'Premium Wireless Headphones',
    description: 'High-quality wireless headphones with noise cancellation',
    price: 299.99,
    originalPrice: 399.99,
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'],
    category: 'Electronics',
    rating: 4.8,
    reviewCount: 324,
    stock: 15,
    isBestseller: true
  },
  {
    id: '2',
    name: 'Smart Fitness Tracker',
    description: 'Track your fitness goals with this advanced tracker',
    price: 149.99,
    images: ['https://images.unsplash.com/photo-1544117519-31a4b719223d?w=400'],
    category: 'Electronics',
    rating: 4.5,
    reviewCount: 189,
    stock: 23,
    isNew: true
  },
  {
    id: '3',
    name: 'Organic Cotton T-Shirt',
    description: 'Comfortable and sustainable organic cotton t-shirt',
    price: 29.99,
    images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400'],
    category: 'Clothing',
    rating: 4.3,
    reviewCount: 67,
    stock: 45
  },
  {
    id: '4',
    name: 'Leather Crossbody Bag',
    description: 'Stylish leather crossbody bag for everyday use',
    price: 89.99,
    originalPrice: 119.99,
    images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400'],
    category: 'Accessories',
    rating: 4.7,
    reviewCount: 145,
    stock: 8,
    isOnSale: true
  }
]

export const useFeaturedProducts = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        setLoading(true)
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // In a real app, this would be an API call
        // const response = await fetch('/api/products/featured')
        // const data = await response.json()
        
        setProducts(mockFeaturedProducts)
        setError(null)
      } catch (err) {
        setError('Failed to fetch featured products')
        console.error('Error fetching featured products:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchFeaturedProducts()
  }, [])

  return {
    products,
    loading,
    error,
    refetch: () => {
      setProducts(mockFeaturedProducts)
    }
  }
}

export const useProducts = (category?: string, search?: string) => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 300))
        
        let filteredProducts = mockFeaturedProducts
        
        if (category && category !== 'All Categories') {
          filteredProducts = filteredProducts.filter(p => 
            typeof p.category === 'string' ? p.category === category : p.category.name === category
          )
        }
        
        if (search) {
          filteredProducts = filteredProducts.filter(p =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.description.toLowerCase().includes(search.toLowerCase())
          )
        }
        
        setProducts(filteredProducts)
        setError(null)
      } catch (err) {
        setError('Failed to fetch products')
        console.error('Error fetching products:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [category, search])

  const refetch = () => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        await new Promise(resolve => setTimeout(resolve, 300))
        
        let filteredProducts = mockFeaturedProducts
        
        if (category && category !== 'All Categories') {
          filteredProducts = filteredProducts.filter(p => 
            typeof p.category === 'string' ? p.category === category : p.category.name === category
          )
        }
        
        if (search) {
          filteredProducts = filteredProducts.filter(p =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.description.toLowerCase().includes(search.toLowerCase())
          )
        }
        
        setProducts(filteredProducts)
        setError(null)
      } catch (err) {
        setError('Failed to fetch products')
        console.error('Error fetching products:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }

  return {
    products,
    loading,
    error,
    refetch
  }
}
