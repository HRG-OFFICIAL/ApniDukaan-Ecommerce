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
        // Try to fetch featured, published products from database first
        const desired = 16
        const filters: ProductFilters = { status: 'published', featured: true }
        const sort: ProductSort = { field: 'rating', order: 'desc' }
        const res = await productsApi.getAll(filters, sort, 1, desired)

        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          let products: Product[] = res.data
          // If fewer than desired, top up from top-rated published (avoid duplicates)
          if (products.length < desired) {
            const fallback = await productsApi.getAll({ status: 'published' }, { field: 'rating', order: 'desc' }, 1, desired - products.length)
            const fallbackProducts: Product[] = fallback?.data || []
            const seen = new Set(products.map(p => p._id || p.slug))
            for (const p of fallbackProducts) {
              const key = p._id || p.slug
              if (!key || !seen.has(key)) {
                products.push(p)
                if (key) seen.add(key)
              }
              if (products.length >= desired) break
            }
          }
          setDataSource('database')
          setFeaturedProducts(products)
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
            createMock('mock-6','Breville Barista Express Espresso Machine',599,699,'https://via.placeholder.com/300x300/92400E/FFFFFF?text=Breville+Barista','home','Home & Garden','home-garden',4.7,12000,22,4),
            createMock('mock-7','Lululemon Everywhere Belt Bag',38,48,'https://via.placeholder.com/300x300/F472B6/FFFFFF?text=Lululemon+Belt+Bag','fashion','Fashion','fashion',4.6,45000,150,15),
            createMock('mock-8','LEGO Icons Concorde Set (10318)',199,229,'https://via.placeholder.com/300x300/22C55E/FFFFFF?text=LEGO+Concorde','toys','Toys & Games','toys-games',4.9,5600,18,3),
            createMock('mock-9','"Atomic Habits" by James Clear',12,18,'https://via.placeholder.com/300x300/0EA5E9/FFFFFF?text=Atomic+Habits','books','Books','books',4.8,150000,300,30),
            createMock('mock-10','Oura Ring Gen3 Horizon',349,399,'https://via.placeholder.com/300x300/111827/FFFFFF?text=Oura+Ring','wearables','Wearable Technology','wearable-technology',4.7,12000,16,2)
          ]
          setFeaturedProducts(mockProducts)
        }
      } catch (error) {
        // Network/API failure: fallback to mocks so homepage isn't empty
        setDataSource('fallback')
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
        setFeaturedProducts([
          createMock('mock-1','Apple iPhone 15 Pro Max - Premium flagship smartphone',1199,1299,'https://via.placeholder.com/300x300/000000/FFFFFF?text=iPhone+15+Pro+Max','electronics','Electronics','electronics',4.8,15420,25,5),
          createMock('mock-2','Samsung Galaxy Watch6 Classic - Premium smartwatch',399,449,'https://via.placeholder.com/300x300/1E3A8A/FFFFFF?text=Galaxy+Watch6','electronics','Electronics','electronics',4.7,8932,50,10),
          createMock('mock-3','Sony WH-1000XM5 Wireless Headphones',399,449,'https://via.placeholder.com/300x300/1F2937/FFFFFF?text=Sony+WH-1000XM5','electronics','Electronics','electronics',4.9,28456,30,5),
          createMock('mock-4','iPad Air (5th Generation) - Versatile tablet',599,649,'https://via.placeholder.com/300x300/3B82F6/FFFFFF?text=iPad+Air','electronics','Electronics','electronics',4.8,12345,40,8),
          createMock('mock-5','Dyson V15 Detect Absolute - Advanced cordless vacuum',749,799,'https://via.placeholder.com/300x300/EF4444/FFFFFF?text=Dyson+V15','home','Home & Garden','home-garden',4.6,6789,20,5),
          createMock('mock-6','Breville Barista Express Espresso Machine',599,699,'https://via.placeholder.com/300x300/92400E/FFFFFF?text=Breville+Barista','home','Home & Garden','home-garden',4.7,12000,22,4),
          createMock('mock-7','Lululemon Everywhere Belt Bag',38,48,'https://via.placeholder.com/300x300/F472B6/FFFFFF?text=Lululemon+Belt+Bag','fashion','Fashion','fashion',4.6,45000,150,15),
          createMock('mock-8','LEGO Icons Concorde Set (10318)',199,229,'https://via.placeholder.com/300x300/22C55E/FFFFFF?text=LEGO+Concorde','toys','Toys & Games','toys-games',4.9,5600,18,3),
          createMock('mock-9','"Atomic Habits" by James Clear',12,18,'https://via.placeholder.com/300x300/0EA5E9/FFFFFF?text=Atomic+Habits','books','Books','books',4.8,150000,300,30),
          createMock('mock-10','Oura Ring Gen3 Horizon',349,399,'https://via.placeholder.com/300x300/111827/FFFFFF?text=Oura+Ring','wearables','Wearable Technology','wearable-technology',4.7,12000,16,2)
        ])
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
      {featuredProducts.map((product, idx) => (
        <ProductCard key={product._id || product.slug || idx} product={product} />
      ))}
    </div>
  )
}


