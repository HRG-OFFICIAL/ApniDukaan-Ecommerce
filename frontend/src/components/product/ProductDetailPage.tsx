'use client'

import React, { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { 
  Heart, 
  Share2, 
  Star, 
  ShoppingCart, 
  Minus, 
  Plus, 
  Truck, 
  RotateCcw, 
  Shield, 
  MapPin,
  Clock,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  AlertCircle,
  MessageSquare,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { useCartStore } from '../../store/useCartStore'
import { usePreferencesStore } from '../../store/usePreferencesStore'
import { useAuthStore } from '../../store/useAuthStore'
import { toast } from 'react-hot-toast'

interface ProductImage {
  id: string
  url: string
  alt: string
}

interface ProductVariant {
  id: string
  name: string
  value: string
  price?: number
  available: boolean
  image?: string
}

interface ProductVariantGroup {
  id: string
  name: string
  type: 'color' | 'size' | 'style' | 'other'
  variants: ProductVariant[]
}

interface ProductReview {
  id: string
  user: {
    name: string
    avatar?: string
    verified: boolean
  }
  rating: number
  title: string
  content: string
  images?: string[]
  date: string
  helpful: number
  verified_purchase: boolean
}

interface ProductFeature {
  icon: string
  title: string
  description: string
}

interface ProductDetailProps {
  product: {
    id: string
    name: string
    description: string
    price: number
    originalPrice?: number
    discount?: number
    images: ProductImage[]
    brand: string
    category: string
    rating: number
    reviewCount: number
    stock: number
    sku: string
    variants?: ProductVariantGroup[]
    features: ProductFeature[]
    specifications: Record<string, string>
    reviews: ProductReview[]
    isBestseller?: boolean
    isNew?: boolean
    tags: string[]
    deliveryInfo: {
      freeShipping: boolean
      estimatedDays: number
      expressAvailable: boolean
      codAvailable: boolean
    }
    warranty: string
    returnPolicy: string
  }
}

export function ProductDetailPage({ product }: ProductDetailProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({})
  const [quantity, setQuantity] = useState(1)
  const [isZoomed, setIsZoomed] = useState(false)
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 })
  const [activeTab, setActiveTab] = useState<'description' | 'specifications' | 'reviews'>('description')
  const [showAllReviews, setShowAllReviews] = useState(false)
  const [reviewFilter, setReviewFilter] = useState<'all' | '5' | '4' | '3' | '2' | '1'>('all')
  const [isExpanded, setIsExpanded] = useState(false)

  const imageRef = useRef<HTMLDivElement>(null)
  const { addItem, items } = useCartStore()
  const { addToWishlist, removeFromWishlist, isInWishlist } = usePreferencesStore()
  const { isAuthenticated } = useAuthStore()

  const isInCartItem = items.find(item => item.productId === product.id)
  const inWishlist = isInWishlist(product.id)

  // Calculate final price based on selected variants
  const finalPrice = product.variants?.reduce((price, group) => {
    const selectedVariant = group.variants.find(v => v.id === selectedVariants[group.id])
    return price + (selectedVariant?.price || 0)
  }, product.price) || product.price

  // Get current product image based on selected variants
  const currentImage = product.images[selectedImageIndex]
  const variantGroup = product.variants?.find(group => 
    selectedVariants[group.id] && 
    group.variants.find(v => v.id === selectedVariants[group.id])?.image
  )
  const variantImage = variantGroup?.variants.find(v => v.id === selectedVariants[variantGroup.id])?.image

  // Filter reviews by rating
  const filteredReviews = reviewFilter === 'all' 
    ? product.reviews 
    : product.reviews.filter(review => review.rating === parseInt(reviewFilter))

  // Calculate rating distribution
  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: product.reviews.filter(r => r.rating === rating).length,
    percentage: (product.reviews.filter(r => r.rating === rating).length / product.reviews.length) * 100
  }))

  const handleImageHover = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current || !isZoomed) return
    
    const rect = imageRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    
    setZoomPosition({ x, y })
  }

  const handleAddToCart = () => {
    if (product.stock === 0) {
      toast.error('Product is out of stock')
      return
    }

    // Check if all required variants are selected
    const requiredVariants = product.variants?.filter(group => group.variants.some(v => v.available)) || []
    const missingVariants = requiredVariants.filter(group => !selectedVariants[group.id])

    if (missingVariants.length > 0) {
      toast.error(`Please select ${missingVariants.map(v => v.name).join(', ')}`)
      return
    }

    const cartItem = {
      id: `${product.id}_${Object.values(selectedVariants).join('_')}`,
      productId: product.id,
      name: product.name,
      price: finalPrice,
      image: variantImage || currentImage.url,
      maxStock: product.stock
    }

    // Add the item the specified number of times
    for (let i = 0; i < quantity; i++) {
      addItem(cartItem)
    }
    
    toast.success(`Added ${quantity} item(s) to cart`)
  }

  const handleWishlistToggle = () => {
    if (!isAuthenticated) {
      toast.error('Please login to add to wishlist')
      return
    }

    if (inWishlist) {
      removeFromWishlist(product.id)
      toast.success('Removed from wishlist')
    } else {
      addToWishlist(product.id)
      toast.success('Added to wishlist')
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: product.description,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard')
    }
  }

  const handleVariantSelect = (groupId: string, variantId: string) => {
    setSelectedVariants(prev => ({
      ...prev,
      [groupId]: variantId
    }))

    // Update image if variant has an image
    const group = product.variants?.find(g => g.id === groupId)
    const variant = group?.variants.find(v => v.id === variantId)
    if (variant?.image) {
      const imageIndex = product.images.findIndex(img => img.url === variant.image)
      if (imageIndex >= 0) {
        setSelectedImageIndex(imageIndex)
      }
    }
  }

  const renderVariantSelector = (group: ProductVariantGroup) => {
    if (group.type === 'color') {
      return (
        <div className="flex flex-wrap gap-3">
          {group.variants.map(variant => (
            <button
              key={variant.id}
              onClick={() => handleVariantSelect(group.id, variant.id)}
              disabled={!variant.available}
              className={`w-8 h-8 rounded-full border-2 transition-all ${
                selectedVariants[group.id] === variant.id
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-gray-300'
              } ${!variant.available ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              style={{ backgroundColor: variant.value }}
              title={`${variant.name} ${!variant.available ? '(Unavailable)' : ''}`}
            >
              {!variant.available && <X className="h-4 w-4 text-white" />}
            </button>
          ))}
        </div>
      )
    }

    return (
      <div className="flex flex-wrap gap-2">
        {group.variants.map(variant => (
          <button
            key={variant.id}
            onClick={() => handleVariantSelect(group.id, variant.id)}
            disabled={!variant.available}
            className={`px-3 py-2 border rounded-md text-sm transition-all ${
              selectedVariants[group.id] === variant.id
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 hover:border-gray-400'
            } ${!variant.available ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}`}
          >
            {variant.name}
            {variant.price && variant.price !== 0 && (
              <span className="ml-1 text-xs">
                {variant.price > 0 ? '+' : ''}₹{variant.price}
              </span>
            )}
          </button>
        ))}
      </div>
    )
  }

  const renderRatingStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClass = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-6 w-6' : 'h-4 w-4'
    
    return (
      <div className="flex items-center space-x-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`${sizeClass} ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Image Gallery */}
        <div className="space-y-4">
          {/* Main Image */}
          <div 
            ref={imageRef}
            className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group cursor-crosshair"
            onMouseMove={handleImageHover}
            onMouseEnter={() => setIsZoomed(true)}
            onMouseLeave={() => setIsZoomed(false)}
          >
            <Image
              src={variantImage || currentImage.url}
              alt={currentImage.alt}
              fill
              className={`object-cover transition-transform duration-300 ${
                isZoomed ? 'scale-150' : 'scale-100'
              }`}
              style={{
                transformOrigin: isZoomed ? `${zoomPosition.x}% ${zoomPosition.y}%` : 'center'
              }}
            />
            
            {/* Navigation Arrows */}
            {product.images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedImageIndex(prev => 
                    prev === 0 ? product.images.length - 1 : prev - 1
                  )}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedImageIndex(prev => 
                    prev === product.images.length - 1 ? 0 : prev + 1
                  )}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}

            {/* Badges */}
            <div className="absolute top-4 left-4 space-y-2">
              {product.isNew && <Badge className="bg-green-500 text-white">New</Badge>}
              {product.isBestseller && <Badge className="bg-yellow-500 text-white">Bestseller</Badge>}
              {product.discount && product.discount > 0 && (
                <Badge className="bg-red-500 text-white">-{product.discount}%</Badge>
              )}
            </div>

            {/* Zoom Indicator */}
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-black/50 text-white p-2 rounded-full">
                <ZoomIn className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Thumbnail Gallery */}
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`relative aspect-square bg-gray-100 rounded-md overflow-hidden border-2 transition-colors ${
                    selectedImageIndex === index ? 'border-blue-500' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Image
                    src={image.url}
                    alt={image.alt}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-sm text-gray-500">{product.brand}</p>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                  {product.name}
                </h1>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  onClick={handleWishlistToggle}
                  className={`p-2 ${inWishlist ? 'text-red-500' : 'text-gray-400'}`}
                >
                  <Heart className={`h-5 w-5 ${inWishlist ? 'fill-current' : ''}`} />
                </Button>
                <Button variant="ghost" onClick={handleShare} className="p-2 text-gray-400">
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Rating */}
            <div className="flex items-center space-x-3">
              {renderRatingStars(product.rating)}
              <span className="text-sm font-medium">{product.rating}</span>
              <span className="text-sm text-gray-500">
                ({product.reviewCount} {product.reviewCount === 1 ? 'review' : 'reviews'})
              </span>
            </div>
          </div>

          {/* Price */}
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <span className="text-3xl font-bold text-gray-900">
                ₹{finalPrice.toLocaleString()}
              </span>
              {product.originalPrice && product.originalPrice > finalPrice && (
                <span className="text-lg text-gray-500 line-through">
                  ₹{product.originalPrice.toLocaleString()}
                </span>
              )}
              {product.discount && product.discount > 0 && (
                <Badge className="bg-red-100 text-red-800">
                  {product.discount}% OFF
                </Badge>
              )}
            </div>
            <p className="text-sm text-green-600">Inclusive of all taxes</p>
          </div>

          {/* Stock Status */}
          <div className="flex items-center space-x-2">
            {product.stock > 0 ? (
              <>
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-600">
                  {product.stock > 10 ? 'In Stock' : `Only ${product.stock} left`}
                </span>
              </>
            ) : (
              <>
                <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                <span className="text-sm text-red-600">Out of Stock</span>
              </>
            )}
          </div>

          {/* Variants */}
          {product.variants && product.variants.map(group => (
            <div key={group.id} className="space-y-3">
              <h3 className="text-sm font-medium text-gray-900">
                {group.name}: 
                {selectedVariants[group.id] && (
                  <span className="font-normal text-gray-600 ml-1">
                    {group.variants.find(v => v.id === selectedVariants[group.id])?.name}
                  </span>
                )}
              </h3>
              {renderVariantSelector(group)}
            </div>
          ))}

          {/* Quantity & Actions */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center border border-gray-300 rounded-md">
                <Button
                  variant="ghost"
                  onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                  disabled={quantity <= 1}
                  className="p-2 rounded-l-md rounded-r-none"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="px-4 py-2 text-center min-w-[60px] border-x border-gray-300">
                  {quantity}
                </span>
                <Button
                  variant="ghost"
                  onClick={() => setQuantity(prev => Math.min(product.stock, prev + 1))}
                  disabled={quantity >= product.stock}
                  className="p-2 rounded-r-md rounded-l-none"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <span className="text-sm text-gray-500">
                Max {product.stock} available
              </span>
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                {isInCartItem ? 'Update Cart' : 'Add to Cart'}
              </Button>
              <Button
                variant="outline"
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="py-3 px-6"
              >
                Buy Now
              </Button>
            </div>
          </div>

          {/* Delivery & Services */}
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Truck className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium">
                    {product.deliveryInfo.freeShipping ? 'Free Delivery' : 'Fast Delivery'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {product.deliveryInfo.estimatedDays} days
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <RotateCcw className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Easy Returns</p>
                  <p className="text-xs text-gray-500">{product.returnPolicy}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-sm font-medium">Warranty</p>
                  <p className="text-xs text-gray-500">{product.warranty}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-orange-600" />
                <div>
                  <p className="text-sm font-medium">Cash on Delivery</p>
                  <p className="text-xs text-gray-500">
                    {product.deliveryInfo.codAvailable ? 'Available' : 'Not Available'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Key Features */}
          {product.features.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-medium">Key Features</h3>
              <div className="space-y-2">
                {product.features.slice(0, isExpanded ? product.features.length : 3).map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                      <Check className="h-3 w-3 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{feature.title}</p>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              {product.features.length > 3 && (
                <Button
                  variant="ghost"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-blue-600 p-0 h-auto"
                >
                  {isExpanded ? (
                    <>Show Less <ChevronUp className="h-4 w-4 ml-1" /></>
                  ) : (
                    <>Show More <ChevronDown className="h-4 w-4 ml-1" /></>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Product Details Tabs */}
      <div className="mt-16 border-t pt-8">
        <div className="flex space-x-8 border-b border-gray-200">
          {[
            { id: 'description', label: 'Description' },
            { id: 'specifications', label: 'Specifications' },
            { id: 'reviews', label: `Reviews (${product.reviewCount})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="py-8">
          {activeTab === 'description' && (
            <div className="prose max-w-none">
              <div dangerouslySetInnerHTML={{ __html: product.description }} />
            </div>
          )}

          {activeTab === 'specifications' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(product.specifications).map(([key, value]) => (
                <div key={key} className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">{key}</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-8">
              {/* Reviews Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="text-4xl font-bold mb-2">{product.rating}</div>
                  {renderRatingStars(product.rating, 'lg')}
                  <p className="text-sm text-gray-500 mt-2">
                    Based on {product.reviewCount} reviews
                  </p>
                </div>
                
                <div className="lg:col-span-2 space-y-2">
                  {ratingDistribution.map(({ rating, count, percentage }) => (
                    <div key={rating} className="flex items-center space-x-3">
                      <span className="text-sm w-8">{rating}★</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-yellow-400 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-500 w-8">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Review Filters */}
              <div className="flex flex-wrap gap-2">
                {(['all', '5', '4', '3', '2', '1'] as const).map(filter => (
                  <Button
                    key={filter}
                    variant={reviewFilter === filter ? 'default' : 'outline'}
                    onClick={() => setReviewFilter(filter)}
                    size="sm"
                  >
                    {filter === 'all' ? 'All' : `${filter} Stars`}
                  </Button>
                ))}
              </div>

              {/* Reviews List */}
              <div className="space-y-6">
                {filteredReviews.slice(0, showAllReviews ? filteredReviews.length : 5).map(review => (
                  <div key={review.id} className="border-b border-gray-200 pb-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          {review.user.avatar ? (
                            <Image 
                              src={review.user.avatar} 
                              alt={review.user.name}
                              width={40}
                              height={40}
                              className="rounded-full"
                            />
                          ) : (
                            <span className="text-sm font-medium">
                              {review.user.name.charAt(0)}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-medium flex items-center">
                              {review.user.name}
                              {review.user.verified && (
                                <Badge className="ml-2 bg-green-100 text-green-800">
                                  Verified
                                </Badge>
                              )}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              {renderRatingStars(review.rating, 'sm')}
                              <span className="text-xs text-gray-500">
                                {new Date(review.date).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <h4 className="font-medium mb-2">{review.title}</h4>
                        <p className="text-gray-700 mb-3">{review.content}</p>
                        
                        {review.images && review.images.length > 0 && (
                          <div className="flex space-x-2 mb-3">
                            {review.images.map((img, idx) => (
                              <div key={idx} className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden">
                                <Image
                                  src={img}
                                  alt={`Review image ${idx + 1}`}
                                  width={64}
                                  height={64}
                                  className="object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          {review.verified_purchase && (
                            <span className="flex items-center">
                              <Check className="h-3 w-3 mr-1 text-green-600" />
                              Verified Purchase
                            </span>
                          )}
                          <button className="flex items-center hover:text-gray-700">
                            <ThumbsUp className="h-3 w-3 mr-1" />
                            Helpful ({review.helpful})
                          </button>
                          <button className="flex items-center hover:text-gray-700">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            Reply
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Show More Reviews */}
              {filteredReviews.length > 5 && (
                <div className="text-center">
                  <Button
                    variant="outline"
                    onClick={() => setShowAllReviews(!showAllReviews)}
                  >
                    {showAllReviews 
                      ? 'Show Less Reviews' 
                      : `Show All ${filteredReviews.length} Reviews`
                    }
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
