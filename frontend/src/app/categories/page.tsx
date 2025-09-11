'use client'

import Link from 'next/link'
import MainLayout from '../../components/layout/MainLayout'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'

// Mock categories data
const categories = [
  {
    id: 'electronics',
    name: 'Electronics',
    description: 'Laptops, smartphones, headphones, and more tech essentials',
    image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400',
    productCount: 156,
    featured: true
  },
  {
    id: 'clothing',
    name: 'Clothing',
    description: 'Fashion for every style and occasion',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
    productCount: 234,
    featured: true
  },
  {
    id: 'accessories',
    name: 'Accessories',
    description: 'Complete your look with our accessory collection',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
    productCount: 89,
    featured: false
  },
  {
    id: 'sports-fitness',
    name: 'Sports & Fitness',
    description: 'Everything you need for an active lifestyle',
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400',
    productCount: 145,
    featured: false
  },
  {
    id: 'home-kitchen',
    name: 'Home & Kitchen',
    description: 'Make your house a home with our collection',
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400',
    productCount: 198,
    featured: true
  },
  {
    id: 'books',
    name: 'Books',
    description: 'Expand your knowledge with our book collection',
    image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400',
    productCount: 67,
    featured: false
  },
  {
    id: 'beauty-health',
    name: 'Beauty & Health',
    description: 'Personal care and wellness products',
    image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400',
    productCount: 123,
    featured: false
  },
  {
    id: 'automotive',
    name: 'Automotive',
    description: 'Car accessories and maintenance products',
    image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400',
    productCount: 78,
    featured: false
  }
]

export default function CategoriesPage() {
  const featuredCategories = categories.filter(cat => cat.featured)
  const allCategories = categories

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
                Shop by Category
              </h1>
              <p className="mt-4 text-xl text-gray-600">
                Discover products organized by your interests
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Featured Categories */}
          <section className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-900">
                Featured Categories
              </h2>
              <Badge variant="secondary">Most Popular</Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredCategories.map((category) => (
                <Link
                  key={category.id}
                  href={`/products?category=${category.name}`}
                  className="group"
                >
                  <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-1">
                    <div className="aspect-w-16 aspect-h-9 relative h-48">
                      <img
                        src={category.image}
                        alt={category.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <div className="absolute bottom-4 left-4 text-white">
                        <h3 className="text-2xl font-bold">{category.name}</h3>
                        <p className="text-sm opacity-90">{category.productCount} products</p>
                      </div>
                    </div>
                    <div className="p-6">
                      <p className="text-gray-600 mb-4">{category.description}</p>
                      <Button className="w-full group-hover:bg-blue-700">
                        Shop {category.name}
                      </Button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* All Categories Grid */}
          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              All Categories
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {allCategories.map((category) => (
                <Link
                  key={category.id}
                  href={`/products?category=${category.name}`}
                  className="group"
                >
                  <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-200">
                    <div className="aspect-w-16 aspect-h-12 relative h-32">
                      <img
                        src={category.image}
                        alt={category.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {category.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {category.productCount} products
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* CTA Section */}
          <section className="mt-16 text-center">
            <div className="bg-blue-50 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Can&apos;t find what you&apos;re looking for?
              </h3>
              <p className="text-gray-600 mb-6">
                Use our advanced search to find exactly what you need
              </p>
              <Link href="/search">
                <Button size="lg">
                  Advanced Search
                </Button>
              </Link>
            </div>
          </section>
        </div>
      </div>
    </MainLayout>
  )
}
