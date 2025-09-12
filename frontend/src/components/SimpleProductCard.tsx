'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Star, ShoppingCart, Heart } from 'lucide-react'
import { Product } from '../graphql/types'

interface ProductCardProps {
  product: Product;
}

const getBadge = (product: Product) => {
  if (product.isBestseller) return { text: 'Best Seller', classes: 'bg-yellow-400 text-yellow-900' };
  if (product.isNew) return { text: 'New', classes: 'bg-blue-500 text-white' };
  if (product.isOnSale) return { text: 'Sale', classes: 'bg-red-500 text-white' };
  return null;
};

export default function SimpleProductCard({ product }: ProductCardProps) {
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)
  
  const discount = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) 
    : 0
  const badge = getBadge(product)
  const productImage = Array.isArray(product.images) ? product.images[0] : product.images
  const imageUrl = typeof productImage === 'string' ? productImage : productImage || '/placeholder.jpg'
  const isOutOfStock = product.stock <= 0
  const isLowStock = product.stock <= 5 && product.stock > 0

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative">
      {/* Wishlist Button */}
      <button
        className="absolute top-2 right-2 z-10 p-2 rounded-full bg-white/80 text-gray-600 hover:bg-white hover:text-red-600 transition-all duration-200"
        aria-label="Add to wishlist"
        title="Add to wishlist"
      >
        <Heart className="w-4 h-4" />
      </button>

      <Link href={`/products/${product.id}`} aria-label={`View details for ${product.name}`}>
        <div className="relative">
          <Image
            src={imageUrl}
            alt={`Product image of ${product.name}`}
            width={400}
            height={300}
            className="object-cover w-full h-48 transition-transform duration-300 group-hover:scale-105"
            onLoad={() => setImageLoading(false)}
            onError={() => setImageError(true)}
            loading="lazy"
          />
          <div className="absolute top-2 left-2 flex flex-col space-y-1">
            {badge && (
              <span className={`text-xs font-semibold px-2 py-1 rounded ${badge.classes}`}>
                {badge.text}
              </span>
            )}
            {isOutOfStock && (
              <span className="bg-gray-800 text-white text-xs font-semibold px-2 py-1 rounded">
                Out of Stock
              </span>
            )}
            {isLowStock && !isOutOfStock && (
              <span className="bg-orange-500 text-white text-xs font-semibold px-2 py-1 rounded">
                Only {product.stock} left
              </span>
            )}
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 h-10 mb-2">
            {product.name}
          </h3>
          
          {/* Rating */}
          <div className="flex items-center mb-3">
            <div className="flex items-center" role="img" aria-label={`Rating: ${product.rating} out of 5 stars`}>
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${
                    i < Math.floor(product.rating) 
                      ? "text-yellow-400 fill-current" 
                      : "text-gray-300"
                  }`}
                  aria-hidden="true"
                />
              ))}
            </div>
            <span className="text-xs text-gray-600 ml-2">
              {product.rating} ({product.reviewCount})
            </span>
          </div>
          
          {/* Price */}
          <div className="flex items-center justify-between">
            <div className="flex items-baseline space-x-2">
              <p className="text-lg font-bold text-gray-900">
                ₹{product.price.toFixed(2)}
              </p>
              {product.originalPrice && (
                <p className="text-sm text-gray-500 line-through">
                  ₹{product.originalPrice.toFixed(2)}
                </p>
              )}
            </div>
            {discount > 0 && (
              <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">
                {discount}% off
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Add to Cart Button */}
      <div className="p-4 pt-0">
        <button
          disabled={isOutOfStock}
          className={`w-full py-2 px-4 rounded-md font-medium transition-all duration-200 flex items-center justify-center ${
            isOutOfStock
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  )
}
