'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Star, ShoppingCart, Heart, X, Truck, Shield, RotateCcw } from 'lucide-react'
import { Product } from '../lib/api'
import { Button } from './ui/Button'

interface QuickViewModalProps {
  product: Product
  isOpen: boolean
  onClose: () => void
  onAddToCart: (product: Product, quantity: number) => void
  onAddToWishlist: (product: Product) => void
}

export function QuickViewModal({ 
  product, 
  isOpen, 
  onClose, 
  onAddToCart, 
  onAddToWishlist 
}: QuickViewModalProps) {
  const router = useRouter()
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen || !mounted) return null

  // Simple placeholder image
  const placeholderImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1lcmlmIiBmb250LXNpemU9IjE4IiBmaWxsPSIjOWNhM2FmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2UgTm90IEF2YWlsYWJsZTwvdGV4dD48L3N2Zz4='
  
  const images = Array.isArray(product.images) ? product.images : [product.images || placeholderImage]
  const currentImage = images[selectedImageIndex] || placeholderImage
  const imageUrl = typeof currentImage === 'string' ? currentImage : placeholderImage

  const discount = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) 
    : 0

  const isOutOfStock = product.inventory.quantity <= 0
  const isLowStock = product.inventory.quantity <= 5 && product.inventory.quantity > 0

  const handleAddToCart = async () => {
    if (isOutOfStock) return
    
    setIsAddingToCart(true)
    try {
      await onAddToCart(product, quantity)
    } finally {
      setIsAddingToCart(false)
    }
  }

  const handleAddToWishlist = async () => {
    setIsAddingToWishlist(true)
    try {
      await onAddToWishlist(product)
    } finally {
      setIsAddingToWishlist(false)
    }
  }

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= product.inventory.quantity) {
      setQuantity(newQuantity)
    }
  }

  const handleViewFullDetails = () => {
    // Close the modal first
    onClose()
    // Navigate to the product detail page
    router.push(`/products/${product._id}`)
  }

  const modalContent = (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-semibold text-gray-900">
              Quick View: {product.name}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex flex-col lg:flex-row max-h-[calc(90vh-80px)] overflow-y-auto">
            {/* Image Gallery */}
            <div className="lg:w-1/2 p-4">
              <div className="space-y-4">
                {/* Main Image */}
                <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = placeholderImage
                    }}
                  />
                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex flex-col space-y-1">
                    {product.featured && (
                      <span className="bg-yellow-400 text-yellow-900 text-xs font-semibold px-2 py-1 rounded">
                        Featured
                      </span>
                    )}
                    {product.isOnSale && (
                      <span className="bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
                        Sale
                      </span>
                    )}
                    {isOutOfStock && (
                      <span className="bg-gray-800 text-white text-xs font-semibold px-2 py-1 rounded">
                        Out of Stock
                      </span>
                    )}
                    {isLowStock && !isOutOfStock && (
                      <span className="bg-orange-500 text-white text-xs font-semibold px-2 py-1 rounded">
                        Only {product.inventory.quantity} left
                      </span>
                    )}
                  </div>
                </div>

                {/* Thumbnail Images */}
                {images.length > 1 && (
                  <div className="flex space-x-2 overflow-x-auto">
                    {images.map((image, index) => {
                      const thumbUrl = typeof image === 'string' ? image : image
                      return (
                        <button
                          key={index}
                          onClick={() => setSelectedImageIndex(index)}
                          className={`relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 ${
                            selectedImageIndex === index 
                              ? 'border-blue-500' 
                              : 'border-gray-200'
                          }`}
                        >
                          <img
                            src={thumbUrl}
                            alt={`${product.name} view ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = placeholderImage
                            }}
                          />
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Product Details */}
            <div className="lg:w-1/2 p-4 space-y-6">
              {/* Title and Rating */}
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {product.name}
                </h1>
                
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex items-center">
                    <div className="flex items-center" role="img" aria-label={`Rating: ${product.rating.average} out of 5 stars`}>
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
                </div>
              </div>

              {/* Price */}
              <div className="flex items-baseline space-x-4">
                <span className="text-3xl font-bold text-gray-900">
                  ${product.price.toFixed(2)}
                </span>
                {product.originalPrice && (
                  <span className="text-xl text-gray-500 line-through">
                    ${product.originalPrice.toFixed(2)}
                  </span>
                )}
                {discount > 0 && (
                  <span className="text-sm font-semibold text-green-600 bg-green-50 px-3 py-1 rounded">
                    {discount}% off
                  </span>
                )}
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Quantity Selector */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Quantity</h3>
                {isOutOfStock ? (
                  <div className="text-red-600 font-medium">
                    Out of Stock
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <input
                      type="number"
                      min="1"
                      max={product.inventory.quantity}
                      value={quantity}
                      onChange={(e) => {
                        const newQuantity = parseInt(e.target.value) || 1
                        handleQuantityChange(newQuantity)
                      }}
                      className="w-20 text-center border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="text-sm text-gray-500">
                      {product.inventory.quantity} available
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <div className="flex space-x-3">
                  <Button
                    onClick={handleAddToCart}
                    disabled={isOutOfStock || isAddingToCart}
                    loading={isAddingToCart}
                    className="flex-1"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                  </Button>
                  
                  <Button
                    onClick={handleAddToWishlist}
                    variant="outline"
                    disabled={isAddingToWishlist}
                    loading={isAddingToWishlist}
                  >
                    <Heart className="w-4 h-4" />
                  </Button>
                </div>

                <Button
                  onClick={handleViewFullDetails}
                  variant="outline"
                  className="w-full"
                >
                  View Full Details
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <Truck className="w-6 h-6 mx-auto text-gray-400 mb-1" />
                  <p className="text-xs text-gray-600">Free Shipping</p>
                </div>
                <div className="text-center">
                  <Shield className="w-6 h-6 mx-auto text-gray-400 mb-1" />
                  <p className="text-xs text-gray-600">Secure Payment</p>
                </div>
                <div className="text-center">
                  <RotateCcw className="w-6 h-6 mx-auto text-gray-400 mb-1" />
                  <p className="text-xs text-gray-600">Easy Returns</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

