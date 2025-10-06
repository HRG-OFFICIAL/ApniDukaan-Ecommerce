'use client'

import { useEffect, useState } from 'react'
import ProductCard from './ProductCard'
import type { Product } from '../lib/api'

interface FeaturedProductsProps {
  products?: Product[]
}

export default function FeaturedProducts({ products: propProducts }: FeaturedProductsProps) {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState<'database' | 'fallback' | 'props'>('props')

  // Define specific categories for featured products
  const featuredCategories = [
    'Cell Phones & Accessories',
    'Computers & Tablets', 
    'Headphones & Earbuds',
    'Books',
    'Video Games',
    'Wearable Technology',
    'Camera & Photo',
    'Audio & Video'
  ]

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      if (propProducts && propProducts.length > 0) {
        setDataSource('props')
        setFeaturedProducts(propProducts.slice(0, 8))
        return
      }

      setLoading(true)
      try {
        // Fetch premium electronics products from database
        const response = await fetch(`/api/catalog/products?limit=8&category=Electronics&sortField=price&sortOrder=desc`)
        const data = await response.json()
        
        if (data.success && data.data.products && data.data.products.length > 0) {
          setDataSource('database')
          setFeaturedProducts(data.data.products)
        } else {
          setDataSource('fallback')
          // Fallback to premium mock products based on user's requested items
          const mockProducts: Product[] = [
            {
              _id: 'mock-1',
              name: 'Apple iPhone 15 Pro Max - Premium flagship smartphone',
              price: 1199,
              originalPrice: 1299,
              rating: { average: 4.8, count: 15420 },
              images: ['https://via.placeholder.com/300x300/000000/FFFFFF?text=iPhone+15+Pro+Max'],
              category: { _id: 'electronics', name: 'Electronics', slug: 'electronics' },
              inventory: { quantity: 25, lowStockThreshold: 5, trackQuantity: true, allowBackorder: false },
              featured: true
            },
            {
              _id: 'mock-2', 
              name: 'Samsung Galaxy Watch6 Classic - Premium smartwatch',
              price: 399,
              originalPrice: 449,
              rating: { average: 4.7, count: 8932 },
              images: ['https://via.placeholder.com/300x300/1E3A8A/FFFFFF?text=Galaxy+Watch6'],
              category: { _id: 'electronics', name: 'Electronics', slug: 'electronics' },
              inventory: { quantity: 50, lowStockThreshold: 10, trackQuantity: true, allowBackorder: false },
              featured: true
            },
            {
              _id: 'mock-3',
              name: 'Sony WH-1000XM5 Wireless Headphones',
              price: 399,
              originalPrice: 449,
              rating: { average: 4.9, count: 28456 },
              images: ['https://via.placeholder.com/300x300/1F2937/FFFFFF?text=Sony+WH-1000XM5'],
              category: { _id: 'electronics', name: 'Electronics', slug: 'electronics' },
              inventory: { quantity: 30, lowStockThreshold: 5, trackQuantity: true, allowBackorder: false },
              featured: true
            },
            {
              _id: 'mock-4',
              name: 'iPad Air (5th Generation) - Versatile tablet',
              price: 599,
              originalPrice: 649,
              rating: { average: 4.8, count: 12345 },
              images: ['https://via.placeholder.com/300x300/3B82F6/FFFFFF?text=iPad+Air'],
              category: { _id: 'electronics', name: 'Electronics', slug: 'electronics' },
              inventory: { quantity: 40, lowStockThreshold: 8, trackQuantity: true, allowBackorder: false },
              featured: true
            },
            {
              _id: 'mock-5',
              name: 'Dyson V15 Detect Absolute - Advanced cordless vacuum',
              price: 749,
              originalPrice: 799,
              rating: { average: 4.6, count: 6789 },
              images: ['https://via.placeholder.com/300x300/EF4444/FFFFFF?text=Dyson+V15'],
              category: { _id: 'home', name: 'Home & Garden', slug: 'home-garden' },
              inventory: { quantity: 20, lowStockThreshold: 5, trackQuantity: true, allowBackorder: false },
              featured: true
            },
            {
              _id: 'mock-6',
              name: 'Ninja Foodi Smart XL Pro 7-in-1 - Multifunctional grill',
              price: 199,
              originalPrice: 249,
              rating: { average: 4.5, count: 4567 },
              images: ['https://via.placeholder.com/300x300/F59E0B/FFFFFF?text=Ninja+Foodi'],
              category: { _id: 'home', name: 'Home & Garden', slug: 'home-garden' },
              inventory: { quantity: 35, lowStockThreshold: 7, trackQuantity: true, allowBackorder: false },
              featured: true
            },
            {
              _id: 'mock-7',
              name: 'Ring Video Doorbell Pro 2 - Smart home security',
              price: 249,
              originalPrice: 299,
              rating: { average: 4.4, count: 2345 },
              images: ['https://via.placeholder.com/300x300/8B5CF6/FFFFFF?text=Ring+Doorbell'],
              category: { _id: 'electronics', name: 'Electronics', slug: 'electronics' },
              inventory: { quantity: 60, lowStockThreshold: 12, trackQuantity: true, allowBackorder: false },
              featured: true
            },
            {
              _id: 'mock-8',
              name: 'Philips Hue Color Smart Bulb Starter Kit',
              price: 199,
              originalPrice: 249,
              rating: { average: 4.3, count: 3456 },
              images: ['https://via.placeholder.com/300x300/10B981/FFFFFF?text=Philips+Hue'],
              category: { _id: 'home', name: 'Home & Garden', slug: 'home-garden' },
              inventory: { quantity: 45, lowStockThreshold: 9, trackQuantity: true, allowBackorder: false },
              featured: true
            }
          ]
          setFeaturedProducts(mockProducts)
        }
      } catch (error) {
        // Handle error silently
      } finally {
        setLoading(false)
      }
    }

    fetchFeaturedProducts()
  }, [propProducts])

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-4 animate-pulse">
            <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
            <div className="bg-gray-200 h-4 rounded mb-2"></div>
            <div className="bg-gray-200 h-4 rounded mb-2 w-3/4"></div>
            <div className="bg-gray-200 h-6 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  if (!featuredProducts || featuredProducts.length === 0) {
    return <div className="text-center text-gray-600">No featured products available.</div>
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {featuredProducts.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  )
}


