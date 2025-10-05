import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'

type SimpleCategory = {
  id?: string
  name: string
  slug: string
  image?: string
}

interface CategoriesGridProps {
  categories: SimpleCategory[]
}

export default function CategoriesGrid({ categories }: CategoriesGridProps) {
  // Define the correct categories with proper names and slugs
  const correctCategories = [
    { name: 'Electronics', slug: 'electronics', image: '/placeholder-category.jpg' },
    { name: 'Fashion', slug: 'fashion', image: '/placeholder-category.jpg' },
    { name: 'Home & Garden', slug: 'home-garden', image: '/placeholder-category.jpg' },
    { name: 'Sports', slug: 'sports-fitness', image: '/placeholder-category.jpg' },
    { name: 'Books', slug: 'books', image: '/placeholder-category.jpg' },
    { name: 'Toys', slug: 'baby-kids', image: '/placeholder-category.jpg' },
    { name: 'Beauty', slug: 'health-beauty', image: '/placeholder-category.jpg' },
    { name: 'Automotive', slug: 'automotive', image: '/placeholder-category.jpg' }
  ]

  return (
    <div className="grid grid-cols-4 gap-6">
      {correctCategories.map((category) => (
        <motion.div
          key={category.slug}
          whileHover={{ scale: 1.05 }}
          className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <Link href={`/categories/${category.slug}`} className="block">
            <div className="aspect-square bg-white border border-gray-200 flex items-center justify-center p-6">
              <div className="text-center">
                <h3 className="text-gray-900 text-lg font-bold">
                  {category.name}
                </h3>
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  )
}


