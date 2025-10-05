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
  if (!categories || categories.length === 0) return null
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {categories.map((category) => (
        <motion.div
          key={category.slug}
          whileHover={{ scale: 1.04 }}
          className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition"
        >
          <Image
            src={category.image || '/placeholder-category.jpg'}
            alt={category.name}
            width={300}
            height={200}
            className="w-full h-32 object-cover"
          />
          <div className="p-4 text-center">
            <Link href={`/categories/${category.slug}`} className="text-lg font-semibold text-gray-900 hover:text-primary-600 transition">
              {category.name}
            </Link>
          </div>
        </motion.div>
      ))}
    </div>
  )
}


