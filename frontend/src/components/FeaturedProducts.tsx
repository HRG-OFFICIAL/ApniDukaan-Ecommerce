'use client'

import { useEffect, useState } from 'react'
import ProductCard from './ProductCard'
import type { Product } from '../lib/api'
import { productsApi, type ProductFilters, type ProductSort } from '../lib/api'

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
        // Fetch a larger pool then strictly filter to preferred SKUs (ASINs in sku)
        const preferredIdList = [
          '68e36f6789364caaa97f3c23',
          '68e36f6789364caaa97f3df3',
          '68e36f6789364caaa97f3c5f',
          '68e36f6789364caaa97f3bd3',
          '68e36f6889364caaa97f4053',
          '68e36f6889364caaa97f40cd',
          '68e36f6889364caaa97f4068',
          '68e36f6789364caaa97f3c75'
        ]

        // Fetch exactly the preferred IDs via by-ids endpoint
        const byIds = await productsApi.getByIds(preferredIdList)
        const ordered: Product[] = Array.isArray(byIds.data) ? byIds.data : []

        if (ordered.length > 0) {
          setDataSource('database')
          setFeaturedProducts(ordered)
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('featured-ready'))
          }
        } else {
          // No matches found in fetched pages: show empty state (no mocks)
          setDataSource('database')
          setFeaturedProducts([])
        }
      } catch (error) {
        setDataSource('database')
        setFeaturedProducts([])
      } finally {
        setLoading(false)
      }
    }

    fetchFeaturedProducts()
  }, [propProducts])

  if (loading) {
    return (
      <div>
        <p className="text-center text-sm text-gray-600 mb-4">
          We’re fetching featured products from our free MongoDB tier. It may
          take up to about 1 minute to load ~2 lakh (200,000) products. Thanks
          for your patience!
        </p>
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
      </div>
    )
  }

  if (!featuredProducts || featuredProducts.length === 0) {
    return <div className="text-center text-gray-600">No featured products available.</div>
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {featuredProducts.map((product, idx) => (
        <ProductCard key={product._id || product.slug || idx} product={product} />
      ))}
    </div>
  )
}


