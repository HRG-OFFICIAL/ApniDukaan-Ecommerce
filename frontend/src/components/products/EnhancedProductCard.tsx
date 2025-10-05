'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Heart, 
  Eye, 
  ShoppingCart, 
  Star, 
  GitCompare,
  Share2,
  Zap,
  Truck,
  CheckCircle
} from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { useCartStore } from '../../store/useCartStore'
import { usePreferencesStore } from '../../store/usePreferencesStore'
import { useAuthStore } from '../../store/useAuthStore'
import { Product } from '../../lib/api'
import toast from 'react-hot-toast'

interface EnhancedProductCardProps {
  product: Product
  viewMode: 'grid' | 'list'
  onQuickView: (product: Product) => void
  onCompare?: (product: Product) => void
  showCompare?: boolean
  isComparing?: boolean
}

export function EnhancedProductCard({ 
  product, 
  viewMode = 'grid',
  onQuickView,
  onCompare,
  showCompare = true,
  isComparing = false
}: EnhancedProductCardProps) {
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const { addItem } = useCartStore()
  const { wishlist, addToWishlist, removeFromWishlist } = usePreferencesStore()
  const { isAuthenticated } = useAuthStore()

  const isInWishlist = wishlist.includes(product._id)
  const isOutOfStock = product.inventory.quantity === 0
  const isLowStock = product.inventory.quantity > 0 && product.inventory.quantity <= 5
  const discount = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) 
    : 0

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (isOutOfStock) {
      // Allow adding to cart regardless of stock status
      return
    }

    addItem({
      id: product._id,
      productId: product._id,
      name: product.name,
      price: product.price,
      image: product.images[0] || '',
      maxStock: product.inventory.quantity
    })
    
    toast.success('Added to cart!')
  }

  const handleWishlistToggle = (e: React.MouseEvent) => {
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

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onQuickView(product)
  }

  const handleCompare = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onCompare) {
      onCompare(product)
    }
  }

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: product.description,
        url: `/products/${product._id}`
      })
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/products/${product._id}`)
      toast.success('Product link copied to clipboard!')
    }
  }

  const renderRating = () => (
    <div className="flex items-center space-x-1">
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < Math.floor(product.rating.average) 
                ? 'fill-current text-yellow-400' 
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
      <span className="text-sm text-gray-600">({product.rating.count})</span>
    </div>
  )

  const renderGridCard = () => (
    <div 
      className={`group relative bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 ${
        isComparing ? 'ring-2 ring-blue-500' : 'hover:border-gray-300'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/products/${product._id}`}>
        {/* Image Container */}
        <div className="aspect-square relative overflow-hidden bg-gray-100">
          {!imageError ? (
            <Image
              src={product.images[0] || '/placeholder-product.jpg'}
              alt={product.name}
              fill
              className={`object-cover transition-transform duration-300 group-hover:scale-105 ${
                imageLoading ? 'blur-sm' : 'blur-0'
              }`}
              onLoad={() => setImageLoading(false)}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <span className="text-gray-400 text-sm">No Image</span>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 z-10 flex flex-col space-y-1">
            {product.featured && (
              <Badge className="bg-yellow-500 text-white text-xs px-2 py-1">Featured</Badge>
            )}
            {discount > 0 && (
              <Badge className="bg-red-500 text-white text-xs px-2 py-1">-{discount}%</Badge>
            )}
            {isLowStock && !isOutOfStock && (
              <Badge className="bg-yellow-500 text-white text-xs px-2 py-1">
                <Zap className="h-3 w-3 mr-1" />
                Low Stock
              </Badge>
            )}
          </div>

          {/* Stock Status */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="text-white font-semibold">Add to Cart</span>
            </div>
          )}

          {/* Quick Actions Overlay */}
          <div className={`absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}>
            <div className="absolute top-2 right-2 flex flex-col space-y-2">
              {/* Wishlist */}
              <Button
                size="sm"
                variant="ghost"
                onClick={handleWishlistToggle}
                className={`p-2 rounded-full ${
                  isInWishlist 
                    ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                    : 'bg-white bg-opacity-90 hover:bg-opacity-100'
                }`}
              >
                <Heart className={`h-4 w-4 ${isInWishlist ? 'fill-current' : ''}`} />
              </Button>

              {/* Quick View */}
              <Button
                size="sm"
                variant="ghost"
                onClick={handleQuickView}
                className="p-2 rounded-full bg-white bg-opacity-90 hover:bg-opacity-100"
              >
                <Eye className="h-4 w-4" />
              </Button>

              {/* Compare */}
              {showCompare && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCompare}
                  className={`p-2 rounded-full ${
                    isComparing
                      ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                      : 'bg-white bg-opacity-90 hover:bg-opacity-100'
                  }`}
                >
                  <GitCompare className="h-4 w-4" />
                </Button>
              )}

              {/* Share */}
              <Button
                size="sm"
                variant="ghost"
                onClick={handleShare}
                className="p-2 rounded-full bg-white bg-opacity-90 hover:bg-opacity-100"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Quick Add to Cart */}
            {!isOutOfStock && (
              <div className="absolute bottom-4 left-4 right-4">
                <Button
                  onClick={handleAddToCart}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4">
          <div className="mb-2">
            <p className="text-sm text-gray-500 mb-1">
              {product.category.name || 'Category'}
            </p>
            <h3 className="font-medium text-gray-900 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
              {product.name}
            </h3>
          </div>

          {/* Rating */}
          <div className="mb-2">
            {renderRating()}
          </div>

          {/* Price */}
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-lg font-bold text-gray-900">
              ₹{product.price.toFixed(2)}
            </span>
            {product.originalPrice && (
              <span className="text-sm text-gray-500 line-through">
                ₹{product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>

          {/* Stock & Delivery Info */}
          <div className="text-xs text-gray-600 space-y-1">
            {!isOutOfStock && (
              <div className="flex items-center">
                <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                <span>{product.inventory.quantity} in stock</span>
              </div>
            )}
            <div className="flex items-center">
              <Truck className="h-3 w-3 text-blue-500 mr-1" />
              <span>Free delivery</span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  )

  const renderListCard = () => (
    <div 
      className={`group bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 ${
        isComparing ? 'ring-2 ring-blue-500' : 'hover:border-gray-300'
      }`}
    >
      <Link href={`/products/${product._id}`} className="flex">
        {/* Image */}
        <div className="w-48 h-48 relative bg-gray-100 flex-shrink-0">
          {!imageError ? (
            <Image
              src={product.images[0] || '/placeholder-product.jpg'}
              alt={product.name}
              fill
              className={`object-cover ${imageLoading ? 'blur-sm' : 'blur-0'}`}
              onLoad={() => setImageLoading(false)}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <span className="text-gray-400 text-sm">No Image</span>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col space-y-1">
            {product.featured && (
              <Badge className="bg-yellow-500 text-white text-xs">Featured</Badge>
            )}
            {discount > 0 && (
              <Badge className="bg-red-500 text-white text-xs">-{discount}%</Badge>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6">
          <div className="flex justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-500 mb-1">
                {product.category.name || 'Category'}
              </p>
              <h3 className="text-lg font-medium text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                {product.name}
              </h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {product.description}
              </p>

              {/* Rating */}
              <div className="mb-4">
                {renderRating()}
              </div>

              {/* Price */}
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-xl font-bold text-gray-900">
                  ₹{product.price.toFixed(2)}
                </span>
                {product.originalPrice && (
                  <span className="text-lg text-gray-500 line-through">
                    ₹{product.originalPrice.toFixed(2)}
                  </span>
                )}
              </div>

              {/* Features */}
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span>{`${product.inventory.quantity} in stock`}</span>
                </div>
                <div className="flex items-center">
                  <Truck className="h-4 w-4 text-blue-500 mr-2" />
                  <span>Free delivery</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col space-y-2 ml-6">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleWishlistToggle}
                className={`p-2 ${
                  isInWishlist 
                    ? 'text-red-600 hover:bg-red-50' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <Heart className={`h-4 w-4 ${isInWishlist ? 'fill-current' : ''}`} />
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={handleQuickView}
                className="p-2 hover:bg-gray-50"
              >
                <Eye className="h-4 w-4" />
              </Button>

              {showCompare && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCompare}
                  className={`p-2 ${
                    isComparing
                      ? 'text-blue-600 hover:bg-blue-50'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <GitCompare className="h-4 w-4" />
                </Button>
              )}

              <Button
                size="sm"
                variant="ghost"
                onClick={handleShare}
                className="p-2 hover:bg-gray-50"
              >
                <Share2 className="h-4 w-4" />
              </Button>

              {!isOutOfStock && (
                <Button
                  onClick={handleAddToCart}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
              )}
            </div>
          </div>
        </div>
      </Link>
    </div>
  )

  return viewMode === 'grid' ? renderGridCard() : renderListCard()
}
