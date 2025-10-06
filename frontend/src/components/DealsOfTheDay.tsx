'use client'

import { useEffect, useState } from 'react'
import ProductCard from './ProductCard'
import type { Product } from '../lib/api'

export default function DealsOfTheDay({ products: propProducts }: { products?: Product[] }) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 })
  const [deals, setDeals] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState<'database' | 'fallback' | 'props'>('props')

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date()
      const end = new Date()
      end.setHours(23, 59, 59, 999)
      const diff = Math.max(0, end.getTime() - now.getTime())
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      setTimeLeft({ hours, minutes, seconds })
    }
    updateCountdown()
    const timer = setInterval(updateCountdown, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const fetchDeals = async () => {
      if (propProducts && propProducts.length > 0) {
        setDataSource('props')
        setDeals(propProducts.slice(0, 4))
        return
      }

      setLoading(true)
      try {
        // Fetch deals from electronics category
        const response = await fetch(`/api/catalog/products?limit=4&category=Electronics&sortField=price&sortOrder=asc`)
        const data = await response.json()
        
        if (data.success && data.data.products && data.data.products.length > 0) {
          setDataSource('database')
          setDeals(data.data.products)
        } else {
          setDataSource('fallback')
          // Helper to generate slug
          const toSlug = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/[\s-]+/g, '-').replace(/^-|-$/g, '')
          // Helper to create a valid mock Product matching the schema
          const createMock = (
            id: string,
            name: string,
            price: number,
            originalPrice: number,
            image: string,
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
            category: { id: 'electronics', name: 'Electronics', slug: 'electronics' },
            tags: [],
            inventory: {
              quantity: qty,
              lowStockThreshold: lowStock,
              trackQuantity: true,
              allowBackorder: false,
              sku: `SKU-${id}`
            },
            hasVariants: false,
            reviews: [],
            rating: {
              average: ratingAvg,
              count: ratingCount,
              breakdown: {
                5: Math.round(ratingCount * 0.4),
                4: Math.round(ratingCount * 0.3),
                3: Math.round(ratingCount * 0.2),
                2: Math.round(ratingCount * 0.06),
                1: Math.max(0, ratingCount - (Math.round(ratingCount * 0.4) + Math.round(ratingCount * 0.3) + Math.round(ratingCount * 0.2) + Math.round(ratingCount * 0.06)))
              }
            },
            sales: { totalSold: 0, revenue: 0 },
            isOnSale: originalPrice > price,
            featured: true,
            status: 'published',
            visibility: 'public',
            seo: { title: name, description: name, keywords: [] },
            shipping: {
              weight: 1,
              dimensions: { length: 10, width: 10, height: 10, unit: 'cm' },
              freeShipping: price > 50
            },
            isDigital: false,
            isSubscription: false,
            isBundle: false,
            analytics: { views: 0, clicks: 0, addToCart: 0, wishlist: 0, share: 0 },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            publishedAt: new Date().toISOString()
          })

          // Fallback to premium deals
          const mockDeals: Product[] = [
            createMock(
              'deal1',
              'Anker PowerCore 20000mAh Power Bank',
              29,
              39,
              'https://via.placeholder.com/300x300/1F2937/FFFFFF?text=Anker+PowerBank',
              4.6,
              1234,
              100,
              20
            ),
            createMock(
              'deal2',
              'Belkin 3-in-1 Wireless Charging Station',
              79,
              99,
              'https://via.placeholder.com/300x300/3B82F6/FFFFFF?text=Belkin+Charger',
              4.4,
              567,
              75,
              15
            ),
            createMock(
              'deal3',
              'JBL Flip 6 Bluetooth Speaker',
              89,
              119,
              'https://via.placeholder.com/300x300/EF4444/FFFFFF?text=JBL+Flip+6',
              4.5,
              2345,
              60,
              12
            ),
            createMock(
              'deal4',
              'Logitech MX Master 3S Wireless Mouse',
              99,
              129,
              'https://via.placeholder.com/300x300/10B981/FFFFFF?text=Logitech+MX+Master',
              4.7,
              3456,
              40,
              8
            )
          ]
          setDeals(mockDeals)
        }
      } catch (error) {
        // Handle error silently
      } finally {
        setLoading(false)
      }
    }

    fetchDeals()
  }, [propProducts])

  if (loading) {
    return (
      <div>
        <div className="flex justify-center items-center gap-3 mb-6 text-gray-700">
          <span className="font-medium">Offer ends in:</span>
          <span className="bg-red-500 text-white px-3 py-1 rounded-md font-semibold text-sm">
            {String(timeLeft.hours).padStart(2, '0')}h {String(timeLeft.minutes).padStart(2, '0')}m {String(timeLeft.seconds).padStart(2, '0')}s
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, index) => (
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

  return (
    <div>
      <div className="flex justify-center items-center gap-3 mb-6 text-gray-700">
        <span className="font-medium">Offer ends in:</span>
        <span className="bg-red-500 text-white px-3 py-1 rounded-md font-semibold text-sm">
          {String(timeLeft.hours).padStart(2, '0')}h {String(timeLeft.minutes).padStart(2, '0')}m {String(timeLeft.seconds).padStart(2, '0')}s
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {deals.map((p) => (
          <ProductCard key={p._id} product={p} />
        ))}
      </div>
    </div>
  )
}


