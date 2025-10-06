'use client'

import Link from 'next/link'
import { Home, Search, ShoppingBag, ArrowRight, AlertTriangle, Grid3X3 } from 'lucide-react'
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
    color: 'indigo'
  }
]


export default function NotFound() {
  return (
    <MainLayout>
      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 bg-gray-50">
        <div className="max-w-4xl w-full text-center">
          {/* 404 Display */}
          <div className="mb-8">
            <div className="text-8xl md:text-9xl font-bold text-red-500 mb-4 drop-shadow-lg">
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
            <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-lg mx-auto shadow-sm">
              <div className="flex items-center justify-center mb-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
                <p className="text-sm font-medium text-gray-700">
                  Looking for something specific?
                </p>
              </div>
              <p className="text-sm text-gray-500">
                Try our search or browse our categories below.
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {suggestions.map((suggestion, index) => {
              const Icon = suggestion.icon
              const colorClasses = {
                blue: 'bg-blue-100 text-blue-600 hover:bg-blue-200',
                green: 'bg-green-100 text-green-600 hover:bg-green-200',
                indigo: 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
              }
              
              return (
                <Link
                  key={index}
                  href={suggestion.href}
                  className="group block p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-2"
                >
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 transition-colors ${colorClasses[suggestion.color as keyof typeof colorClasses]}`}>
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
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
                { name: 'Electronics', href: '/categories/electronics', color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
                { name: 'Clothing', href: '/categories/clothing', color: 'bg-green-100 text-green-700 hover:bg-green-200' },
                { name: 'Home & Garden', href: '/categories/home-garden', color: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' },
                { name: 'Sports', href: '/categories/sports', color: 'bg-orange-100 text-orange-700 hover:bg-orange-200' },
                { name: 'Books', href: '/categories/books', color: 'bg-pink-100 text-pink-700 hover:bg-pink-200' }
              ].map((category, index) => (
                <Link
                  key={index}
                  href={category.href}
                  className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105 ${category.color}`}
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="relative overflow-hidden rounded-2xl p-8 text-black shadow-2xl border-2 border-gray-300">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200"></div>
            <div className="absolute inset-0 opacity-30">
              <div className="w-full h-full" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                backgroundRepeat: 'repeat'
              }}></div>
            </div>
            
            {/* Content */}
            <div className="relative max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-black/10 rounded-full mb-4">
                  <Search className="h-8 w-8 text-black" />
                </div>
                <h2 className="text-3xl font-bold mb-4 text-black">Need Help Finding Something?</h2>
                <p className="text-gray-700 text-lg leading-relaxed">
                  Our customer support team is here to help you find exactly what you're looking for.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/">
                  <Button size="lg" variant="secondary" className="bg-white text-black hover:bg-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-black">
                    <Home className="mr-2 h-5 w-5" />
                    Go to Homepage
                  </Button>
                </Link>
                <Link href="/search">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="border-black text-black hover:bg-black hover:text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Search className="mr-2 h-5 w-5" />
                    Search Products
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="mt-8 text-center">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 max-w-md mx-auto">
              <p className="text-gray-600 mb-3">Still can't find what you're looking for?</p>
              <Link 
                href="/contact" 
                className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Contact our support team 
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
