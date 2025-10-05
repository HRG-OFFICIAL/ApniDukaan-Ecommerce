'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import MainLayout from '../components/layout/MainLayout'
import FeaturedProducts from '../components/FeaturedProducts'
import CategoriesGrid from '../components/CategoriesGrid'
import DealsOfTheDay from '../components/DealsOfTheDay'
import Testimonials from '../components/Testimonials'
import Newsletter from '../components/Newsletter'
import { useProducts } from '../hooks/useProducts'
import { categories as sampleCategories } from '../lib/data'
import { ArrowRight } from 'lucide-react'
import Image from 'next/image'

export default function Home() {
  const { products, loading } = useProducts(undefined, undefined, undefined, 20)

  const categories = useMemo(() => {
    return (sampleCategories || []).map((c: any) => ({
      name: c.name,
      slug: (c.name || '').toLowerCase(),
      image: '/placeholder-category.jpg'
    }))
  }, [])

  if (loading) {
    return (
      <MainLayout pageTitle="Home" className="bg-gray-50">
        <div className="min-h-[60vh] flex items-center justify-center">Loading...</div>
      </MainLayout>
    )
  }

  return (
    <MainLayout pageTitle="Home" className="bg-gray-50">
      <div className="min-h-screen bg-gray-50">
        <main className="bg-gray-50">
          {/* Restored original in-page Hero section */}
          <section className="relative min-h-[80vh] overflow-hidden">
            <div className="absolute bottom-0 left-0 right-0 h-3/5">
              <Image
                src="/bg.jpg"
                alt="Background"
                fill
                className="object-contain scale-110"
                priority
              />
            </div>
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20 md:pt-12 md:pb-28 text-center">
              <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight">
                <span className="block">India's Biggest</span>
                <span className="block text-blue-600">Online Marketplace</span>
              </h1>
              <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600">
                Discover millions of products at great prices. Shop from top brands with fast delivery and secure payments.
              </p>
            </div>
          </section>

                 <section className="py-16 bg-white">
                   <motion.div
                     initial={{ opacity: 0, y: 20 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     viewport={{ once: true }}
                     className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
                   >
                     <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Featured Products</h2>
                     <FeaturedProducts />
                   </motion.div>
                 </section>

          <section className="py-16 bg-gray-50">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Shop by Category</h2>
              <CategoriesGrid categories={categories} />
            </motion.div>
          </section>

          <section className="py-16 bg-gray-50">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
            >
              <h2 className="text-3xl font-bold mb-4 text-gray-900">Deals of the Day</h2>
              <p className="text-xl mb-8 text-gray-600">Save up to 50% on top picks!</p>
              <DealsOfTheDay />
            </motion.div>
          </section>

          <section className="py-16 bg-white">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">What Our Customers Say</h2>
              <Testimonials />
            </motion.div>
          </section>

          <Newsletter />
        </main>
      </div>
    </MainLayout>
  )
}