'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Home, Search, ShoppingBag, ArrowRight } from 'lucide-react'
import { Button } from '../components/ui/Button'
import MainLayout from '../components/layout/MainLayout'

const suggestions = [
  {
    icon: Home,
    title: 'Go Home',
    description: 'Return to our homepage and explore featured products',
    href: '/',
    color: 'blue'
  },
  {
    icon: ShoppingBag,
    title: 'Browse Products',
    description: 'Discover thousands of products across all categories',
    href: '/products',
    color: 'green'
  },
  {
    icon: Search,
    title: 'Search',
    description: 'Find exactly what you\'re looking for',
    href: '/search',
    color: 'purple'
  }
]

export default function NotFound() {
  return (
    <MainLayout>
      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl w-full text-center">
          {/* 404 Illustration */}
          <div className="mb-8">
            <div className="relative w-64 h-64 mx-auto mb-6">
              <Image
                src="https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400"
                alt="Page not found illustration"
                width={256}
                height={256}
                className="rounded-full object-cover shadow-lg"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-blue-600/20 rounded-full"></div>
            </div>
            
            <div className="text-8xl font-bold text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text mb-4">
              404
            </div>
          </div>

          {/* Error Message */}
          <div className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Oops! Page Not Found
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-6">
              The page you're looking for doesn't exist or may have been moved. 
              Don't worry, let's get you back on track!
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-sm text-gray-500">
                <strong>Looking for something specific?</strong> Try our search or browse our categories below.
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {suggestions.map((suggestion, index) => {
              const Icon = suggestion.icon
              const colorClasses = {
                blue: 'bg-blue-100 text-blue-600',
                green: 'bg-green-100 text-green-600',
                purple: 'bg-purple-100 text-purple-600'
              }
              
              return (
                <Link
                  key={index}
                  href={suggestion.href}
                  className="block p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
                >
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4 ${colorClasses[suggestion.color as keyof typeof colorClasses]}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {suggestion.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {suggestion.description}
                  </p>
                </Link>
              )
            })}
          </div>

          {/* Popular Categories */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Popular Categories</h2>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                { name: 'Electronics', href: '/categories/electronics' },
                { name: 'Clothing', href: '/categories/clothing' },
                { name: 'Home & Garden', href: '/categories/home-garden' },
                { name: 'Sports', href: '/categories/sports' },
                { name: 'Books', href: '/categories/books' }
              ].map((category, index) => (
                <Link
                  key={index}
                  href={category.href}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-blue-100 hover:text-blue-700 transition-colors"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-4">Need Help?</h2>
            <p className="text-blue-100 mb-6">
              Our customer support team is here to help you find what you're looking for.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/">
                <Button size="lg" variant="secondary">
                  <Home className="mr-2 h-5 w-5" />
                  Go to Homepage
                </Button>
              </Link>
              <Link href="/search">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white text-white hover:bg-white hover:text-blue-600"
                >
                  <Search className="mr-2 h-5 w-5" />
                  Search Products
                </Button>
              </Link>
            </div>
          </div>

          {/* Contact Info */}
          <div className="mt-8 text-center text-gray-500 text-sm">
            <p>Still can't find what you're looking for?</p>
            <Link 
              href="/contact" 
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Contact our support team <ArrowRight className="inline h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
