'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { Heart, ShoppingCart, Star } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { formatCurrency } from '@/utils/format'
import { cn } from '@/utils/cn'

import { Product } from '@/types'

interface ProductCardProps {
  product: Product
  showQuickActions?: boolean
  showComparePrice?: boolean
  showRating?: boolean
  showBrand?: boolean
  className?: string
  viewMode?: 'grid' | 'list'
}

export default function ProductCard({ 
  product, 
  showQuickActions = true,
  showComparePrice = true,
  showRating = true,
  showBrand = true,
  className,
  viewMode = 'grid'
}: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [imageError, setImageError] = useState(false)
  
  const { addItem } = useCart()

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      price: product.price,
      image: typeof product.images[0] === 'string' 
        ? product.images[0] as string 
        : (product.images[0] as {url: string})?.url || '/placeholder-product.jpg',
      maxStock: product.stock,
    })
  }

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsWishlisted(!isWishlisted)
  }

  const renderStars = (rating: number | { average: number; count: number }) => {
    const ratingValue = typeof rating === 'number' ? rating : rating.average
    
    return [...Array(5)].map((_, i) => {
      const filled = i < Math.floor(ratingValue)
      const halfFilled = i < ratingValue && i >= Math.floor(ratingValue)
      
      return (
        <div key={i} className="relative">
          {filled ? (
            <Star className="h-4 w-4 text-yellow-400" fill="currentColor" />
          ) : halfFilled ? (
            <>
              <Star className="h-4 w-4 text-gray-300" />
              <Star 
                className="absolute inset-0 h-4 w-4 text-yellow-400" 
                style={{ clipPath: 'inset(0 50% 0 0)' }} 
              />
            </>
          ) : (
            <Star className="h-4 w-4 text-gray-300" />
          )}
        </div>
      )
    })
  }

  const discountPercentage = product.originalPrice || product.compareAtPrice 
    ? Math.round((((product.originalPrice || product.compareAtPrice || 0) - product.price) / (product.originalPrice || product.compareAtPrice || 1)) * 100)
    : 0

  const categoryName = typeof product.category === 'string' ? product.category : product.category?.name || 'Category'
  const ratingCount = typeof product.rating === 'number' ? product.reviewCount : product.rating?.count || 0

  if (viewMode === 'list') {
    return (
      <div className={cn('group relative bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200', className)}>
        <Link href={`/products/${product.slug || product.id}`} className="flex">
          {/* Product Image */}
          <div className="w-32 h-32 flex-shrink-0 overflow-hidden rounded-l-lg bg-gray-200 group-hover:opacity-75 transition-opacity">
            {!imageError ? (
              <Image
                src={typeof product.images[0] === 'string' 
                  ? product.images[0] as string 
                  : (product.images[0] as {url: string})?.url || '/placeholder-product.jpg'}
                alt={product.name}
                width={128}
                height={128}
                className="h-full w-full object-cover object-center"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-gray-100">
                <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex-1 p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                  {product.name}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{categoryName}</p>
                
                {/* Rating */}
                {showRating && (
                  <div className="flex items-center mt-2">
                    <div className="flex items-center space-x-1">
                      {renderStars(product.rating)}
                    </div>
                    <span className="text-sm text-gray-500 ml-2">({ratingCount})</span>
                  </div>
                )}

                <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                  {product.description}
                </p>
              </div>

              <div className="ml-4 text-right">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-xl font-semibold text-gray-900">
                    {formatCurrency(product.price)}
                  </span>
                  {showComparePrice && (product.originalPrice && product.originalPrice > product.price) && (
                    <span className="text-sm text-gray-500 line-through">
                      {formatCurrency(product.originalPrice)}
                    </span>
                  )}
                </div>
                
                {product.stock <= 5 && product.stock > 0 && (
                  <span className="text-sm text-orange-600 font-medium">
                    Only {product.stock} left
                  </span>
                )}

                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={handleAddToCart}
                    disabled={product.stock === 0}
                    className={cn(
                      'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                      product.stock > 0
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    )}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2 inline" />
                    {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                  </button>
                  
                  <button
                    onClick={handleToggleWishlist}
                    className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    {isWishlisted ? (
                      <Heart className="h-4 w-4 text-red-500" fill="currentColor" />
                    ) : (
                      <Heart className="h-4 w-4 text-gray-600" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Link>
      </div>
    );
  }

  return (
    <div className={cn('group relative bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200', className)}>
      <Link href={`/products/${product.slug || product.id}`}>
        {/* Product Image */}
        <div className="aspect-square w-full overflow-hidden rounded-t-lg bg-gray-200 group-hover:opacity-75 transition-opacity">
          {!imageError ? (
            <Image
              src={typeof product.images[0] === 'string' 
                ? product.images[0] as string 
                : (product.images[0] as {url: string})?.url || '/placeholder-product.jpg'}
              alt={product.name}
              width={300}
              height={300}
              className="h-full w-full object-cover object-center"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-gray-100">
              <svg className="h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col space-y-1">
            {product.isNew && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                New
              </span>
            )}
            {product.isBestseller && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Bestseller
              </span>
            )}
            {product.isOnSale && discountPercentage > 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                -{discountPercentage}%
              </span>
            )}
          </div>

          {/* Wishlist Button */}
          {showQuickActions && (
            <button
              onClick={handleToggleWishlist}
              className="absolute top-2 right-2 p-2 rounded-full bg-white/80 hover:bg-white transition-colors opacity-0 group-hover:opacity-100"
            >
              {isWishlisted ? (
                <Heart className="h-5 w-5 text-red-500" fill="currentColor" />
              ) : (
                <Heart className="h-5 w-5 text-gray-600" />
              )}
            </button>
          )}

          {/* Quick Add to Cart - only show on hover */}
          {showQuickActions && (
            <div className="absolute inset-x-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className={cn(
                  'w-full flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors',
                  product.stock > 0
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                )}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
              </button>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4">
          <div className="mb-2">
            <h3 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
              {product.name}
            </h3>
            <p className="text-xs text-gray-500 mt-1">{categoryName}</p>
            {showBrand && product.brand && (
              <p className="text-xs text-gray-400 mt-1">{product.brand.name}</p>
            )}
          </div>

          {/* Rating */}
          {showRating && (
            <div className="flex items-center mb-2">
              <div className="flex items-center space-x-1">
                {renderStars(product.rating)}
              </div>
              <span className="text-xs text-gray-500 ml-2">({ratingCount})</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-lg font-semibold text-gray-900">
                {formatCurrency(product.price)}
              </span>
              {showComparePrice && (product.originalPrice && product.originalPrice > product.price) && (
                <span className="text-sm text-gray-500 line-through">
                  {formatCurrency(product.originalPrice)}
                </span>
              )}
              {showComparePrice && (product.compareAtPrice && product.compareAtPrice > product.price) && (
                <span className="text-sm text-gray-500 line-through">
                  {formatCurrency(product.compareAtPrice)}
                </span>
              )}
            </div>
            
            {product.stock <= 5 && product.stock > 0 && (
              <span className="text-xs text-orange-600 font-medium">
                Only {product.stock} left
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  )
}
