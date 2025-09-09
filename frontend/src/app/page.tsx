'use client'

import Link from 'next/link'
import { sampleProducts, categories } from '../lib/data'
import ProductCard from '../components/ProductCard'
import Header from '../components/Header'
import { ArrowRight, Zap, Gift } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main>
        <section className="relative bg-blue-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight">
              <span className="block">Unbeatable Deals,</span>
              <span className="block text-blue-600">Unmatched Prices.</span>
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600">
              Explore thousands of products from top brands. Your next great find is just a click away.
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
              <h2 className="text-3xl font-bold text-gray-900 flex items-center"><Gift className="mr-3 h-8 w-8 text-blue-600" /> Deals of the Day</h2>
              <span className="text-sm font-mono bg-gray-900 text-white px-3 py-1.5 rounded">⏰ 22:56:00 Left</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {sampleProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>

        <section className="bg-gray-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
            <Zap className="mx-auto h-12 w-12 text-yellow-400" />
            <h2 className="mt-4 text-3xl font-extrabold">Flash Sale Frenzy</h2>
            <p className="mt-2 text-lg text-gray-300">Limited time offer - Extra 20% Off on Electronics!</p>
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

      <footer className="bg-gray-800 text-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {['About', 'Help', 'Policy', 'Social'].map(title => (
                    <div key={title}>
                        <h3 className="font-semibold text-white mb-4">{title}</h3>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="#" className="hover:text-white">Link 1</Link></li>
                            <li><Link href="#" className="hover:text-white">Link 2</Link></li>
                            <li><Link href="#" className="hover:text-white">Link 3</Link></li>
                        </ul>
                    </div>
                ))}
            </div>
            <div className="mt-12 border-t border-gray-700 pt-8 text-center text-sm">
                <p>&copy; {new Date().getFullYear()} ApniDukaan.com. All Rights Reserved.</p>
            </div>
        </div>
      </footer>
    </div>
  )
}