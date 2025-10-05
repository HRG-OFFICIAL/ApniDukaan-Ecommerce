'use client'

import Link from 'next/link'
import { ArrowRight, Zap, Gift, Store } from 'lucide-react'
import { sampleProducts, categories } from '../lib/data'
// import ProductCard from '../components/ProductCard'
import MainLayout from '../components/layout/MainLayout'

export default function Home() {
  return (
    <MainLayout pageTitle="Home" className="bg-gray-50">
      <div className="min-h-screen bg-gray-50">

      <main className="bg-gray-50">
        <section className="relative bg-blue-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight">
              <span className="block">India's Biggest</span>
              <span className="block text-blue-600">Online Marketplace</span>
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600">
              Discover millions of products at great prices. Shop from top brands with fast delivery and secure payments.
            </p>
            <div className="mt-8">
              <Link
                href="/products"
                className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Shop Now <ArrowRight className="ml-2 -mr-1 h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Shop by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((cat, i) => {
                const Icon = cat.icon;
                return (
                    <Link href="#" key={i} className="group block text-center p-4 bg-white rounded-xl border hover:border-blue-500 hover:shadow-lg transition-all duration-300">
                        <div className="flex items-center justify-center h-16 w-16 mx-auto bg-blue-100 rounded-full">
                            <Icon className="h-8 w-8 text-blue-600"/>
                        </div>
                        <h3 className="mt-4 font-semibold text-gray-800">{cat.name}</h3>
                        <p className="text-sm text-gray-500">{cat.count}+ items</p>
                    </Link>
                )
            })}
          </div>
        </section>

        <section className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 flex items-center"><Gift className="mr-3 h-8 w-8 text-blue-600" /> Today's Offers</h2>
              <span className="text-sm font-mono bg-gray-900 text-white px-3 py-1.5 rounded">⏰ 22:56:00 left</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {sampleProducts.map((p) => (
                <div key={p.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="aspect-square bg-gray-200 rounded-lg mb-4"></div>
                  <h3 className="font-semibold text-gray-900 mb-2">{p.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{p.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-blue-600">₹{p.price}</span>
                    <span className="text-sm text-gray-500">{p.rating} ⭐</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-gray-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
            <Zap className="mx-auto h-12 w-12 text-yellow-400" />
            <h2 className="mt-4 text-3xl font-extrabold">Flash Sale Madness</h2>
            <p className="mt-2 text-lg text-gray-300">Limited time offer - Extra 20% off on Electronics!</p>
            <div className="mt-8">
              <Link
                href="/products?category=electronics"
                className="inline-block bg-yellow-400 text-gray-900 font-bold px-8 py-3 rounded-md hover:bg-yellow-300 transition-colors"
              >
                Grab the Deal
              </Link>
            </div>
          </div>
        </section>
      </main>
      </div>
    </MainLayout>
  )
}