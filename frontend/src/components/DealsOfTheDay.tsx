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
          // Fallback to premium deals based on user's requested items
          const mockDeals: Product[] = [
            {
              _id: 'deal1',
              name: 'Anker PowerCore 20000mAh Power Bank',
              price: 29,
              originalPrice: 39,
              rating: { average: 4.6, count: 1234 },
              images: ['https://via.placeholder.com/300x300/1F2937/FFFFFF?text=Anker+PowerBank'],
              category: { _id: 'electronics', name: 'Electronics', slug: 'electronics' },
              inventory: { quantity: 100, lowStockThreshold: 20, trackQuantity: true, allowBackorder: false },
              isFeatured: true
            },
            {
              _id: 'deal2',
              name: 'Belkin 3-in-1 Wireless Charging Station',
              price: 79,
              originalPrice: 99,
              rating: { average: 4.4, count: 567 },
              images: ['https://via.placeholder.com/300x300/3B82F6/FFFFFF?text=Belkin+Charger'],
              category: { _id: 'electronics', name: 'Electronics', slug: 'electronics' },
              inventory: { quantity: 75, lowStockThreshold: 15, trackQuantity: true, allowBackorder: false },
              isFeatured: true
            },
            {
              _id: 'deal3',
              name: 'JBL Flip 6 Bluetooth Speaker',
              price: 89,
              originalPrice: 119,
              rating: { average: 4.5, count: 2345 },
              images: ['https://via.placeholder.com/300x300/EF4444/FFFFFF?text=JBL+Flip+6'],
              category: { _id: 'electronics', name: 'Electronics', slug: 'electronics' },
              inventory: { quantity: 60, lowStockThreshold: 12, trackQuantity: true, allowBackorder: false },
              isFeatured: true
            },
            {
              _id: 'deal4',
              name: 'Logitech MX Master 3S Wireless Mouse',
              price: 99,
              originalPrice: 129,
              rating: { average: 4.7, count: 3456 },
              images: ['https://via.placeholder.com/300x300/10B981/FFFFFF?text=Logitech+MX+Master'],
              category: { _id: 'electronics', name: 'Electronics', slug: 'electronics' },
              inventory: { quantity: 40, lowStockThreshold: 8, trackQuantity: true, allowBackorder: false },
              isFeatured: true
            }
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


