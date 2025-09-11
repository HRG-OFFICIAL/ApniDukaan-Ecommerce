'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Star, ShoppingCart, Heart, Eye } from 'lucide-react'
import { Product } from '../graphql/types'
import { usePreferencesStore } from '../store/usePreferencesStore'
import { useAuthStore } from '../store/useAuthStore'
import { useWishlist } from '../hooks/useWishlist'
import { useCartAPI } from '../hooks/useCartAPI'
import { cn } from '../utils/cn'
import { Button } from './ui/Button'
import toast from 'react-hot-toast'

interface ProductCardProps {
  product: Product;
}

const getBadge = (product: Product) => {
  if (product.isBestseller) return { text: 'Best Seller', classes: 'bg-yellow-400 text-yellow-900' };
  if (product.isNew) return { text: 'New', classes: 'bg-blue-500 text-white' };
  if (product.isOnSale) return { text: 'Sale', classes: 'bg-red-500 text-white' };
  return null;
};

export default function ProductCard({ product }: ProductCardProps) {
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)
  
  const { addToRecentlyViewed } = usePreferencesStore()
  const { isAuthenticated } = useAuthStore()
  const { isInWishlist, toggleWishlist, isLoading: wishlistLoading } = useWishlist()
  const { addItem, loading: cartLoading } = useCartAPI()
  
  const discount = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) 
    : 0
  const badge = getBadge(product)
  const productImage = Array.isArray(product.images) ? product.images[0] : product.images
  const imageUrl = typeof productImage === 'string' ? productImage : productImage || '/placeholder.jpg'
  const isProductInWishlist = isInWishlist(product.id)
  const isOutOfStock = product.stock <= 0
  const isLowStock = product.stock <= 5 && product.stock > 0

  const handleAddToCart = async () => {
    if (isOutOfStock) {
      toast.error('Product is out of stock')
      return
    }
    
    await addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      price: product.price,
      image: imageUrl,
      maxStock: product.stock
    })
  }

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault() // Prevent navigation when clicking wishlist button
    
    if (!isAuthenticated) {
      toast.error('Please login to add to wishlist')
      return
    }
    
    await toggleWishlist(product.id)
  }

  const handleProductClick = () => {
    addToRecentlyViewed(product.id)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative">
      {/* Wishlist Button */}
      <button
        onClick={handleWishlistToggle}
        disabled={wishlistLoading}
        className={cn(
          "absolute top-2 right-2 z-10 p-2 rounded-full transition-all duration-200",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          isProductInWishlist 
            ? "bg-red-100 text-red-600 hover:bg-red-200" 
            : "bg-white/80 text-gray-600 hover:bg-white hover:text-red-600"
        )}
        aria-label={isProductInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        aria-pressed={isProductInWishlist}
        title={isProductInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <Heart className={cn("w-4 h-4", isProductInWishlist && "fill-current")} />
      </button>

      <Link 
        href={`/products/${product.id}`} 
        onClick={handleProductClick}
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
            <Button
              size="sm"
              variant="outline"
              className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0 bg-white hover:bg-gray-50"
              aria-label={`Quick view ${product.name}`}
              onClick={(e) => {
                e.preventDefault()
                // TODO: Open quick view modal
              }}
            >
              <Eye className="w-4 h-4 mr-2" />
              Quick View
            </Button>
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
                className={cn(
                  "w-3 h-3",
                  i < Math.floor(product.rating) 
                    ? "text-yellow-400 fill-current" 
                    : "text-gray-300"
                )}
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
        <Button
          onClick={handleAddToCart}
          disabled={isOutOfStock || cartLoading}
          loading={cartLoading}
          className={cn(
            "w-full",
            isOutOfStock 
              ? "bg-gray-300 cursor-not-allowed" 
              : "bg-blue-600 hover:bg-blue-700"
          )}
          size="sm"
          aria-label={isOutOfStock ? 'Product out of stock' : `Add ${product.name} to cart`}
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
        </Button>
      </div>
    </div>
  )
}
