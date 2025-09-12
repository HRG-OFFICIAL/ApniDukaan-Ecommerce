'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Star, ShoppingCart, Heart, Eye } from 'lucide-react'
import { Product } from '../graphql/types'

interface ProductCardProps {
  product: Product;
  viewMode?: 'grid' | 'list';
}

const getBadge = (product: Product) => {
  if (product.isBestseller) return { text: 'Best Seller', classes: 'bg-yellow-400 text-yellow-900' };
  if (product.isNew) return { text: 'New', classes: 'bg-blue-500 text-white' };
  if (product.isOnSale) return { text: 'Sale', classes: 'bg-red-500 text-white' };
  return null;
};

export default function ProductCard({ product, viewMode = 'grid' }: ProductCardProps) {
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

  const handleAddToCart = async () => {
    if (isOutOfStock) {
      alert('Product is out of stock')
      return
    }
    
    alert(`Added ${product.name} to cart!`)
  }

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    alert('Please login to add to wishlist')
  }

  if (viewMode === 'list') {
    return (
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden group transition-all duration-300 hover:shadow-lg relative">
        <div className="flex">
          {/* Image Section */}
          <div className="relative w-48 h-48 flex-shrink-0">
            <Image
              src={imageUrl}
              alt={`Product image of ${product.name}`}
              width={200}
              height={200}
              className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
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
            <button
              onClick={handleWishlistToggle}
              className="absolute top-2 right-2 z-10 p-2 rounded-full transition-all duration-200 bg-white/80 text-gray-600 hover:bg-white hover:text-red-600"
              aria-label="Add to wishlist"
            >
              <Heart className="w-4 h-4" />
            </button>
          </div>

          {/* Content Section */}
          <div className="flex-1 p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <Link 
                  href={`/products/${product.id}`} 
                  aria-label={`View details for ${product.name}`}
                  className="block"
                >
                  <h3 className="text-lg font-semibold text-gray-800 mb-2 hover:text-blue-600 transition-colors">
                    {product.name}
                  </h3>
                </Link>
                
                {/* Rating */}
                <div className="flex items-center mb-3">
                  <div 
                    className="flex items-center"
                    role="img"
                    aria-label={`Rating: ${product.rating} out of 5 stars`}
                  >
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(product.rating) 
                            ? "text-yellow-400 fill-current" 
                            : "text-gray-300"
                        }`}
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600 ml-2">
                    {product.rating} ({product.reviewCount} reviews)
                  </span>
                </div>

                {/* Description */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {product.description}
                </p>

                {/* Price */}
                <div className="flex items-center space-x-4">
                  <div className="flex items-baseline space-x-2">
                    <p className="text-2xl font-bold text-gray-900">
                      ${product.price.toFixed(2)}
                    </p>
                    {product.originalPrice && (
                      <p className="text-lg text-gray-500 line-through">
                        ${product.originalPrice.toFixed(2)}
                      </p>
                    )}
                  </div>
                  {discount > 0 && (
                    <span className="text-sm font-semibold text-green-600 bg-green-50 px-3 py-1 rounded">
                      {discount}% off
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col space-y-3 ml-6">
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                    isOutOfStock 
                      ? "bg-gray-300 cursor-not-allowed text-gray-500" 
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                  aria-label={isOutOfStock ? 'Product out of stock' : `Add ${product.name} to cart`}
                >
                  <ShoppingCart className="w-4 h-4 mr-2 inline" />
                  {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                </button>
                
                <Link 
                  href={`/products/${product.id}`}
                  className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors text-center"
                >
                  <Eye className="w-4 h-4 mr-2 inline" />
                  View Details
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Grid view (default)
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative">
      {/* Wishlist Button */}
      <button
        onClick={handleWishlistToggle}
        className="absolute top-2 right-2 z-10 p-2 rounded-full transition-all duration-200 bg-white/80 text-gray-600 hover:bg-white hover:text-red-600"
        aria-label="Add to wishlist"
      >
        <Heart className="w-4 h-4" />
      </button>

      <Link 
        href={`/products/${product.id}`} 
        aria-label={`View details for ${product.name}`}
      >
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

          {/* Quick View Button */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
            <button
              className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0 bg-white hover:bg-gray-50 px-4 py-2 rounded-md border border-gray-300 text-sm font-medium"
              aria-label={`Quick view ${product.name}`}
              onClick={(e) => {
                e.preventDefault()
                alert('Quick view not implemented yet')
              }}
            >
              <Eye className="w-4 h-4 mr-2 inline" />
              Quick View
            </button>
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 h-10 mb-2">
            {product.name}
          </h3>
          
          {/* Rating */}
          <div className="flex items-center mb-3">
            <div 
              className="flex items-center"
              role="img"
              aria-label={`Rating: ${product.rating} out of 5 stars`}
            >
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
                ${product.price.toFixed(2)}
              </p>
              {product.originalPrice && (
                <p className="text-sm text-gray-500 line-through">
                  ${product.originalPrice.toFixed(2)}
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
      <div className="px-4 pb-4">
        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className={`w-full px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            isOutOfStock 
              ? "bg-gray-300 cursor-not-allowed text-gray-500" 
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
          aria-label={isOutOfStock ? 'Product out of stock' : `Add ${product.name} to cart`}
        >
          <ShoppingCart className="w-4 h-4 mr-2 inline" />
          {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  )
}