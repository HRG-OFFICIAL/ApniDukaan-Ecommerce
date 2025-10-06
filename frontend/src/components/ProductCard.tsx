'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Star, ShoppingCart, Heart, Eye } from 'lucide-react'
import { Product } from '../lib/api'
import { QuickViewModal } from './QuickViewModal'
import { useCartStore } from '../store/useCartStore'
import { usePreferencesStore } from '../store/usePreferencesStore'
import { useAuthStore } from '../store/useAuthStore'
import toast from 'react-hot-toast'

interface ProductCardProps {
  product: Product;
  viewMode?: 'grid' | 'list';
}

const getBadge = (product: Product) => {
  if (product.featured) return { text: 'Featured', classes: 'bg-yellow-400 text-yellow-900' };
  if (product.isOnSale) return { text: 'Sale', classes: 'bg-red-500 text-white' };
  return null;
};

export default function ProductCard({ product, viewMode = 'grid' }: ProductCardProps) {
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)
  const [showQuickView, setShowQuickView] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const { addItem } = useCartStore()
  const { wishlist, addToWishlist, removeFromWishlist } = usePreferencesStore()
  const { isAuthenticated } = useAuthStore()
  
  const discount = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) 
    : 0
  const badge = getBadge(product)
  const productImage = Array.isArray(product.images) ? product.images[0] : product.images
  const fallbackPlaceholder = 'https://placehold.co/400x300/png'
  const imageUrl = typeof productImage === 'string' ? (productImage || fallbackPlaceholder) : fallbackPlaceholder
  const isOutOfStock = (product.inventory?.quantity || 0) <= 0
  const isLowStock = (product.inventory?.quantity || 0) <= (product.inventory?.lowStockThreshold || 5) && (product.inventory?.quantity || 0) > 0
  const isInWishlist = wishlist.includes(product._id)

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Allow adding to cart regardless of stock status

    addItem({
      id: product._id,
      productId: product._id,
      name: product.name,
      price: product.price,
      image: product.images[0] || '',
      maxStock: product.inventory?.quantity || 0
    })
    
    toast.success('Added to cart!')
  }

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!isAuthenticated) {
      toast.error('Please login to add to wishlist')
      return
    }

    if (isInWishlist) {
      removeFromWishlist(product._id)
      toast.success('Removed from wishlist')
    } else {
      addToWishlist(product._id)
      toast.success('Added to wishlist')
    }
  }

  const handleAddToCartForModal = async (product: Product, quantity: number) => {
    // Allow adding to cart regardless of stock status

    addItem({
      id: product._id,
      productId: product._id,
      name: product.name,
      price: product.price,
      image: product.images[0] || '',
      maxStock: product.inventory.quantity
    })
    
    toast.success(`Added ${quantity}x ${product.name} to cart!`)
  }

  const handleWishlistToggleForModal = async (product: Product) => {
    if (!isAuthenticated) {
      toast.error('Please login to add to wishlist')
      return
    }

    if (isInWishlist) {
      removeFromWishlist(product._id)
      toast.success('Removed from wishlist')
    } else {
      addToWishlist(product._id)
      toast.success('Added to wishlist')
    }
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
                  Add to Cart
                </span>
              )}
              {isLowStock && !isOutOfStock && (
                <span className="bg-orange-500 text-white text-xs font-semibold px-2 py-1 rounded">
                  Only {product.inventory.quantity} left
                </span>
              )}
            </div>
            <button
              onClick={handleWishlistToggle}
              className={`absolute top-2 right-2 z-10 p-2 rounded-full transition-all duration-200 bg-white/80 hover:bg-white ${
                isInWishlist 
                  ? 'text-red-600' 
                  : 'text-gray-600 hover:text-red-600'
              }`}
              aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart className={`w-4 h-4 ${isInWishlist ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Content Section */}
          <div className="flex-1 p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <Link 
                  href={`/products/${product._id}`} 
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
                    aria-label={`Rating: ${product.rating.average} out of 5 stars`}
                  >
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(product.rating.average) 
                            ? "text-yellow-400 fill-current" 
                            : "text-gray-300"
                        }`}
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600 ml-2">
                    {product.rating.average} ({product.rating.count} reviews)
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
                  disabled={false}
                  className="px-4 py-1 h-7 rounded-md text-xs font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-white"
                  aria-label={isOutOfStock ? 'Product out of stock' : `Add ${product.name} to cart`}
                >
                  <ShoppingCart className="w-4 h-4 mr-2 inline" />
                  Add to Cart
                </button>
                
                <Link 
                  href={`/products/${product._id}`}
                  className="px-4 py-1 h-7 border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors text-center"
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
    <div 
      ref={cardRef}
      className="bg-white border border-gray-200 rounded-lg overflow-hidden group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Wishlist Button */}
      <button
        onClick={handleWishlistToggle}
        className={`absolute top-2 right-2 z-10 p-2 rounded-full transition-all duration-200 bg-white/80 hover:bg-white ${
          isInWishlist 
            ? 'text-red-600' 
            : 'text-gray-600 hover:text-red-600'
        }`}
        aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <Heart className={`w-4 h-4 ${isInWishlist ? 'fill-current' : ''}`} />
      </button>

      <Link 
        href={`/products/${product._id}`} 
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
            {isLowStock && !isOutOfStock && (
              <span className="bg-orange-500 text-white text-xs font-semibold px-2 py-1 rounded">
                Only {product.inventory.quantity} left
              </span>
            )}
          </div>

          {/* Quick View Button */}
          <div className={`absolute inset-0 bg-black transition-all duration-300 flex items-center justify-center ${
            isHovered ? 'bg-opacity-20' : 'bg-opacity-0'
          }`}>
            <button
              className={`transition-all duration-300 transform bg-white hover:bg-gray-50 px-4 py-2 rounded-md border border-gray-300 text-sm font-medium ${
                isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              aria-label={`Quick view ${product.name}`}
              onMouseDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setShowQuickView(true)
              }}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setShowQuickView(true)
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
              aria-label={`Rating: ${product.rating.average} out of 5 stars`}
            >
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${
                    i < Math.floor(product.rating.average) 
                      ? "text-yellow-400 fill-current" 
                      : "text-gray-300"
                  }`}
                  aria-hidden="true"
                />
              ))}
            </div>
            <span className="text-xs text-gray-600 ml-2">
              {product.rating.average} ({product.rating.count})
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
          disabled={false}
          className="w-full px-4 py-2 rounded-md text-sm font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-white"
          aria-label={isOutOfStock ? 'Product out of stock' : `Add ${product.name} to cart`}
        >
          <ShoppingCart className="w-4 h-4 mr-2 inline" />
          Add to Cart
        </button>
      </div>

      {/* Quick View Modal */}
      <QuickViewModal
        product={product}
        isOpen={showQuickView}
        onClose={() => setShowQuickView(false)}
        onAddToCart={handleAddToCartForModal}
        onAddToWishlist={handleWishlistToggleForModal}
      />
    </div>
  )
}