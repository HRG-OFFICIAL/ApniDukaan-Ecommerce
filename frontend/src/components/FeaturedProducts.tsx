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
          // Helpers to create fully typed mock products
          const toSlug = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/[\s-]+/g, '-').replace(/^-|-$/g, '')
          const createMock = (
            id: string,
            name: string,
            price: number,
            originalPrice: number,
            image: string,
            categoryId: string,
            categoryName: string,
            categorySlug: string,
            ratingAvg: number,
            ratingCount: number,
            qty: number,
            lowStock: number
          ): Product => ({
            _id: id,
            name,
            slug: toSlug(name),
            description: name,
            shortDescription: name,
            sku: `SKU-${id}`,
            price,
            originalPrice,
            currency: 'USD',
            images: [image],
            thumbnailImage: image,
            category: { _id: categoryId, name: categoryName, slug: categorySlug },
            tags: [],
            attributes: [],
            inventory: { quantity: qty, lowStockThreshold: lowStock, trackQuantity: true, allowBackorder: false },
            shipping: { weight: 1, dimensions: { length: 10, width: 10, height: 10 }, freeShipping: price > 50 },
            seo: { title: name, description: name, keywords: [] },
            status: 'published',
            featured: true,
            visibility: 'public',
            rating: { average: ratingAvg, count: ratingCount },
            sales: { totalSold: 0, revenue: 0 },
            isOnSale: originalPrice > price,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })

          const mockProducts: Product[] = [
            createMock('mock-1','Apple iPhone 15 Pro Max - Premium flagship smartphone',1199,1299,'https://via.placeholder.com/300x300/000000/FFFFFF?text=iPhone+15+Pro+Max','electronics','Electronics','electronics',4.8,15420,25,5),
            createMock('mock-2','Samsung Galaxy Watch6 Classic - Premium smartwatch',399,449,'https://via.placeholder.com/300x300/1E3A8A/FFFFFF?text=Galaxy+Watch6','electronics','Electronics','electronics',4.7,8932,50,10),
            createMock('mock-3','Sony WH-1000XM5 Wireless Headphones',399,449,'https://via.placeholder.com/300x300/1F2937/FFFFFF?text=Sony+WH-1000XM5','electronics','Electronics','electronics',4.9,28456,30,5),
            createMock('mock-4','iPad Air (5th Generation) - Versatile tablet',599,649,'https://via.placeholder.com/300x300/3B82F6/FFFFFF?text=iPad+Air','electronics','Electronics','electronics',4.8,12345,40,8),
            createMock('mock-5','Dyson V15 Detect Absolute - Advanced cordless vacuum',749,799,'https://via.placeholder.com/300x300/EF4444/FFFFFF?text=Dyson+V15','home','Home & Garden','home-garden',4.6,6789,20,5),
            createMock('mock-6','Ninja Foodi Smart XL Pro 7-in-1 - Multifunctional grill',199,249,'https://via.placeholder.com/300x300/F59E0B/FFFFFF?text=Ninja+Foodi','home','Home & Garden','home-garden',4.5,4567,35,7),
            createMock('mock-7','Ring Video Doorbell Pro 2 - Smart home security',249,299,'https://via.placeholder.com/300x300/8B5CF6/FFFFFF?text=Ring+Doorbell','electronics','Electronics','electronics',4.4,2345,60,12),
            createMock('mock-8','Philips Hue Color Smart Bulb Starter Kit',199,249,'https://via.placeholder.com/300x300/10B981/FFFFFF?text=Philips+Hue','home','Home & Garden','home-garden',4.3,3456,45,9)
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


