'use client'

import Link from 'next/link'
import MainLayout from '../components/layout/MainLayout'
import ProductCard from '../components/product/ProductCard'
import { Product } from '../types'

// Featured products for the homepage
const featuredProducts: Product[] = [
  {
    id: '1',
    name: 'Premium Wireless Headphones',
    description: 'High-quality wireless headphones with noise cancellation',
    price: 299.99,
    originalPrice: 399.99,
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'],
    category: 'Electronics',
    rating: 4.5,
    reviewCount: 128,
    stock: 15,
    isBestseller: true,
    isOnSale: true
  },
  {
    id: '3',
    name: 'Smart Watch Pro',
    description: 'Advanced smartwatch with health monitoring features',
    price: 399.99,
    images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'],
    category: 'Electronics',
    rating: 4.7,
    reviewCount: 201,
    stock: 8
  },
  {
    id: '4',
    name: 'Leather Messenger Bag',
    description: 'Handcrafted leather messenger bag for professionals',
    price: 149.99,
    originalPrice: 199.99,
    images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400'],
    category: 'Accessories',
    rating: 4.8,
    reviewCount: 87,
    stock: 12,
    isOnSale: true
  },
  {
    id: '6',
    name: 'Coffee Maker Deluxe',
    description: 'Premium coffee maker with programmable features',
    price: 189.99,
    images: ['https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400'],
    category: 'Home & Kitchen',
    rating: 4.6,
    reviewCount: 93,
    stock: 18,
    isBestseller: true
  }
]

export default function Home() {
  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Welcome to <span className="text-accent-300">ShopSphere</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-primary-100">
              Your ultimate e-commerce destination powered by modern microservices architecture.
              Experience seamless shopping with cutting-edge technologies.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/products"
                className="rounded-md bg-white px-8 py-3 text-lg font-semibold text-primary-600 shadow-sm hover:bg-primary-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-colors"
              >
                Start Shopping
              </Link>
              <Link
                href="/about"
                className="text-lg font-semibold leading-6 text-white hover:text-accent-200 transition-colors"
              >
                Learn more <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 sm:py-32 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Why Choose ShopSphere?
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Built with modern technologies and best practices for exceptional performance and user experience.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              <div className="flex flex-col">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  Lightning Fast Performance
                </dt>
                <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">Built with Next.js 14 and optimized for speed. Server-side rendering and static generation ensure blazing fast load times.</p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  Secure & Reliable
                </dt>
                <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">Enterprise-grade security with JWT authentication, encrypted data transmission, and secure payment processing.</p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                  </div>
                  Scalable Architecture
                </dt>
                <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">Microservices architecture with Docker and Kubernetes ensures seamless scaling and high availability.</p>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-24 sm:py-32 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Featured Products
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Discover our handpicked selection of premium products.
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-6 sm:mt-20 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="mt-16 text-center">
            <Link
              href="/products"
              className="rounded-md bg-primary-600 px-6 py-3 text-lg font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 transition-colors"
            >
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* Technology Stack Section */}
      <section className="py-24 sm:py-32 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Built with Modern Technology
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Powered by cutting-edge technologies for optimal performance and developer experience.
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 sm:mt-20 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-4">
            <div className="text-center bg-gray-50 rounded-2xl p-8">
              <h3 className="text-lg font-semibold leading-8 text-primary-600">
                Frontend
              </h3>
              <p className="mt-4 text-base leading-7 text-gray-600">
                Next.js 14, React 18, TypeScript, Tailwind CSS
              </p>
            </div>
            <div className="text-center bg-gray-50 rounded-2xl p-8">
              <h3 className="text-lg font-semibold leading-8 text-primary-600">
                Backend
              </h3>
              <p className="mt-4 text-base leading-7 text-gray-600">
                Node.js, Express, GraphQL, Microservices
              </p>
            </div>
            <div className="text-center bg-gray-50 rounded-2xl p-8">
              <h3 className="text-lg font-semibold leading-8 text-primary-600">
                Database
              </h3>
              <p className="mt-4 text-base leading-7 text-gray-600">
                MongoDB, Redis, Apache Kafka
              </p>
            </div>
            <div className="text-center bg-gray-50 rounded-2xl p-8">
              <h3 className="text-lg font-semibold leading-8 text-primary-600">
                Infrastructure
              </h3>
              <p className="mt-4 text-base leading-7 text-gray-600">
                Docker, Kubernetes, AWS Cloud
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-600">
        <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to start shopping?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-primary-100">
              Join thousands of satisfied customers and experience the future of e-commerce today.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/auth/register"
                className="rounded-md bg-white px-6 py-3 text-lg font-semibold text-primary-600 shadow-sm hover:bg-primary-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-colors"
              >
                Get started
              </Link>
              <Link
                href="/products"
                className="text-lg font-semibold leading-6 text-white hover:text-accent-200 transition-colors"
              >
                Browse products <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  )
}
