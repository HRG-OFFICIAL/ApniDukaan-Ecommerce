'use client'

import { useState, useEffect, useMemo } from 'react'

// Disable static generation for this page since it uses Apollo Client
export const dynamic = 'force-dynamic'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import {
  Star,
  Heart,
  Share2,
  ShoppingCart,
  Truck,
  RotateCcw,
  Shield,
  Minus,
  Plus,
  ChevronRight,
  MessageCircle,
  AlertCircle
} from 'lucide-react'
import { usePreferencesStore } from '../../../store/usePreferencesStore'
import { useAuthStore } from '../../../store/useAuthStore'
import { useProductsStore } from '../../../store/useProductsStore'
import { useProduct } from '../../../hooks/useProductsAPI'
import { useProducts } from '../../../hooks/useProductsAPI'
import { useWishlist } from '../../../hooks/useWishlist'
import { useCartMutations } from '../../../hooks/useCart'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { Breadcrumb } from '../../../components/ui/Breadcrumb'
import MainLayout from '../../../components/layout/MainLayout'
import ProductCard from '../../../components/ProductCard'
import { Loading } from '../../../components/ui/LoadingSpinner'
import { SyncErrorAlert } from '../../../components/ui/ApiErrorAlert'
import { cn } from '../../../utils/cn'
import toast from 'react-hot-toast'

// Mock data for demonstration
const mockProduct = {
  id: '1',
  name: 'Premium Wireless Headphones with Active Noise Cancellation',
  description: 'Experience premium sound quality with our latest wireless headphones featuring advanced noise cancellation technology, 30-hour battery life, and premium materials.',
  price: 299.99,
  originalPrice: 399.99,
  images: [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
    'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800',
    'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800',
    'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800'
  ],
  category: 'Electronics',
  rating: 4.5,
  reviewCount: 128,
  stock: 15,
  isBestseller: true,
  isOnSale: true,
  isNew: false,
  specifications: {
    'Battery Life': '30 hours',
    'Connectivity': 'Bluetooth 5.0, USB-C',
    'Weight': '250g',
    'Drivers': '40mm dynamic drivers',
    'Frequency Response': '20Hz - 20kHz',
    'Noise Cancellation': 'Active ANC',
    'Microphone': 'Built-in with noise reduction',
    'Colors': 'Black, White, Silver'
  },
  features: [
    'Active Noise Cancellation',
    '30-hour battery life',
    'Quick charge - 5 min for 3 hours',
    'Premium materials',
    'Comfortable over-ear design',
    'Voice assistant compatible'
  ],
  reviews: [
    {
      id: '1',
      user: { id: 'user1', name: 'John Doe' },
      rating: 5,
      comment: 'Excellent sound quality and the noise cancellation is amazing!',
      createdAt: '2023-12-15'
    },
    {
      id: '2',
      user: { id: 'user2', name: 'Jane Smith' },
      rating: 4,
      comment: 'Great headphones, very comfortable for long listening sessions.',
      createdAt: '2023-12-10'
    }
  ],
  createdAt: '2023-11-01',
  updatedAt: '2023-12-01'
}

const fallbackRelatedProducts = [
  {
    id: '2',
    name: 'Wireless Earbuds Pro',
    description: 'Premium wireless earbuds with noise cancellation',
    price: 149.99,
    originalPrice: 199.99,
    images: ['https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=400'],
    category: 'Electronics',
    rating: 4.3,
    reviewCount: 95,
    stock: 25,
    isBestseller: false,
    isOnSale: true,
    isNew: false,
    reviews: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Bluetooth Speaker',
    description: 'Portable Bluetooth speaker with premium sound',
    price: 79.99,
    images: ['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400'],
    category: 'Electronics',
    rating: 4.6,
    reviewCount: 67,
    stock: 18,
    isBestseller: true,
    isOnSale: false,
    isNew: false,
    reviews: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

export default function ProductDetailPage() {
  const params = useParams()
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [selectedTab, setSelectedTab] = useState('description')
  const [apiError, setApiError] = useState<string | null>(null)
  
  const { addToRecentlyViewed } = usePreferencesStore()
  const { isAuthenticated } = useAuthStore()
  const { setCurrentProduct } = useProductsStore()
  const { isInWishlist, toggleWishlist, isLoading: wishlistLoading } = useWishlist()
  const { addToCart, loading: cartLoading } = useCartMutations()
  
  // Real API integration
  const productId = params?.id as string
  const { product: apiProduct, loading, error, refetch } = useProduct(productId)
  
  // Fetch related products - memoize filter to prevent infinite re-renders
  const relatedProductsFilter = useMemo(() => {
    // Only return filter when category exists to prevent unnecessary API calls
    if (!apiProduct?.category) return null
    
    return {
      filter: {
        category: apiProduct.category.name,
      },
      limit: 4
    }
  }, [apiProduct?.category])
  
  const { products: relatedProductsList } = useProducts(relatedProductsFilter || {})
  
  // Use API data or fallback to mock data
  const product = apiError || error ? mockProduct : apiProduct
  const relatedProducts = apiError || error ? fallbackRelatedProducts : relatedProductsList
  
  const isProductInWishlist = product ? isInWishlist((product as any)._id || (product as any).id) : false
  const isOutOfStock = !product || ((product as any).inventory?.quantity || (product as any).stock || 0) <= 0
  const isLowStock = product && ((product as any).inventory?.quantity || (product as any).stock || 0) <= 5 && ((product as any).inventory?.quantity || (product as any).stock || 0) > 0
  const discount = product?.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) 
    : 0

  // Handle API errors
  useEffect(() => {
    if (error) {
      const errorMessage = error.message || 'Failed to fetch product'
      console.error('Product API Error:', error)
      setApiError(errorMessage)
      toast.error(`API Error: ${errorMessage}. Using fallback data.`)
    } else {
      setApiError(null)
    }
  }, [error])
  
  useEffect(() => {
    if (product) {
      setCurrentProduct(product as any)
      addToRecentlyViewed((product as any)._id || (product as any).id)
    }
  }, [product, setCurrentProduct, addToRecentlyViewed])
  
  // Retry API call on error
  const retryApiCall = () => {
    setApiError(null)
    refetch()
  }

  const handleAddToCart = async () => {
    if (!product) {
      toast.error('Product not found')
      return
    }
    
    if (isOutOfStock) {
      // Allow adding to cart regardless of stock status
      return
    }
    
    const result = await addToCart((product as any)._id || (product as any).id, quantity)
    if (result.success) {
      toast.success(`Added ${quantity}x ${product.name} to cart!`)
    } else {
      toast.error(result.error || 'Failed to add to cart')
    }
  }

  const handleWishlistToggle = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add to wishlist', {
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="9" stroke="#000000" strokeWidth="2" />
            <path d="M12 7v6" stroke="#000000" strokeWidth="2" strokeLinecap="round" />
            <circle cx="12" cy="17" r="1.5" fill="#000000" />
          </svg>
        ),
        style: {
          background: '#FEE2E2',
          border: '1px solid #FCA5A5',
          color: '#000000',
          borderRadius: 6,
          boxShadow: 'none'
        }
      })
      return
    }
    
    if (!product) {
      toast.error('Product not found')
      return
    }
    
    await toggleWishlist((product as any)._id || (product as any).id)
  }

  const breadcrumbItems = product ? [
    { label: 'Products', href: '/products' },
    { 
      label: typeof product.category === 'string' ? product.category : product.category?.name || 'Category', 
      href: `/products?category=${typeof product.category === 'string' ? product.category : product.category?.name || ''}` 
    },
    { label: product.name }
  ] : [
    { label: 'Products', href: '/products' },
    { label: 'Loading...' }
  ]

  if (loading || (!product && !apiError)) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <Loading text="Loading product..." />
        </div>
      </MainLayout>
    )
  }
  
  if (!product && !loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64 flex-col space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <h2 className="text-xl font-semibold text-gray-900">Product Not Found</h2>
          <p className="text-gray-500">The product you're looking for doesn't exist.</p>
          <Button onClick={() => window.history.back()} variant="outline">
            Go Back
          </Button>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <Breadcrumb items={breadcrumbItems} className="mb-8" />
          
          {/* API Error Display */}
          {apiError && (
            <div className="mb-8">
              <SyncErrorAlert
                error={apiError}
                onRetry={retryApiCall}
              />
            </div>
          )}

          <div className="lg:grid lg:grid-cols-2 lg:gap-12 lg:items-start">
            {/* Product Images */}
            <div className="space-y-4">
              <div className="aspect-square overflow-hidden rounded-lg border border-gray-200">
                <Image
                  src={product?.images?.[selectedImageIndex] || '/placeholder-product.jpg'}
                  alt={product?.name || 'Product image'}
                  width={600}
                  height={600}
                  className="h-full w-full object-cover object-center"
                />
              </div>
              
              {/* Image Thumbnails */}
              <div className="grid grid-cols-4 gap-4">
                {product?.images?.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={cn(
                      "aspect-square overflow-hidden rounded-lg border-2",
                      selectedImageIndex === index 
                        ? "border-blue-600" 
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <Image
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      width={150}
                      height={150}
                      className="h-full w-full object-cover object-center"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Product Info */}
            <div className="mt-10 lg:mt-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Badges */}
                  <div className="flex items-center space-x-2 mb-4">
                    {(product as any)?.isBestseller && (
                      <Badge variant="secondary">Bestseller</Badge>
                    )}
                    {(product as any)?.isNew && (
                      <Badge className="bg-blue-500">New</Badge>
                    )}
                    {(product as any)?.isOnSale && (
                      <Badge variant="destructive">Sale</Badge>
                    )}
                    {isLowStock && (
                      <Badge className="bg-orange-500">Only {(product as any)?.inventory?.quantity || (product as any)?.stock} left</Badge>
                    )}
                  </div>

                  <h1 className="text-3xl font-bold text-gray-900">
                    {product?.name || 'Product'}
                  </h1>

                  {/* Rating */}
                  <div className="flex items-center mt-4">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "w-5 h-5",
                            i < Math.floor(typeof product?.rating === 'number' ? product.rating : product?.rating?.average || 0)
                              ? "text-yellow-400 fill-current"
                              : "text-gray-300"
                          )}
                        />
                      ))}
                    </div>
                    <span className="ml-2 text-sm text-gray-600">
                      {typeof product?.rating === 'number' ? product.rating : product?.rating?.average || 0} ({typeof product?.rating === 'number' ? (product as any)?.reviewCount || 0 : product?.rating?.count || 0} reviews)
                    </span>
                  </div>

                  {/* Price */}
                  <div className="mt-6">
                    <div className="flex items-center space-x-4">
                      <span className="text-3xl font-bold text-gray-900">
                        ${product?.price?.toFixed(2) || '0.00'}
                      </span>
                      {product?.originalPrice && (
                        <span className="text-xl text-gray-500 line-through">
                          ${product.originalPrice.toFixed(2)}
                        </span>
                      )}
                      {discount > 0 && (
                        <Badge className="bg-green-500">
                          {discount}% OFF
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleWishlistToggle}
                    disabled={wishlistLoading}
                    className={cn(
                      isProductInWishlist && "text-red-600 border-red-600"
                    )}
                  >
                    <Heart className={cn("w-4 h-4", isProductInWishlist && "fill-current")} />
                  </Button>
                  
                  <Button variant="outline" size="sm">
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Description */}
              <div className="mt-6">
                <p className="text-gray-600 leading-relaxed">
                  {product?.description || 'No description available.'}
                </p>
              </div>

              {/* Features */}
              {(product as any)?.features && (product as any).features.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Key Features
                  </h3>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(product as any).features.map((feature: string, index: number) => (
                      <li key={index} className="flex items-center text-sm text-gray-600">
                        <ChevronRight className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Quantity & Add to Cart */}
              <div className="mt-8">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center border border-gray-300 rounded-md">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="px-4 py-2 text-center min-w-[3rem]">
                      {quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setQuantity(Math.min((product as any)?.inventory?.quantity || (product as any)?.stock || 0, quantity + 1))}
                      disabled={quantity >= ((product as any)?.inventory?.quantity || (product as any)?.stock || 0)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  
                <Button
                    onClick={handleAddToCart}
                    disabled={isOutOfStock || cartLoading}
                    loading={cartLoading}
                  className="flex-1"
                  size="sm"
                  variant="success"
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Add to Cart
                  </Button>
                </div>
              </div>

              {/* Shipping Info */}
              <div className="mt-8 border-t border-gray-200 pt-8">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Truck className="w-5 h-5 text-blue-600 mr-2" />
                    Free shipping on orders over $50
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <RotateCcw className="w-5 h-5 text-blue-600 mr-2" />
                    30-day return policy
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Shield className="w-5 h-5 text-blue-600 mr-2" />
                    2-year warranty
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Product Details Tabs */}
          <div className="mt-16 border-t border-gray-200 pt-16">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {[
                  { id: 'description', label: 'Description' },
                  { id: 'specifications', label: 'Specifications' },
                  { id: 'reviews', label: `Reviews (${typeof product?.rating === 'number' ? (product as any)?.reviewCount || 0 : product?.rating?.count || 0})` }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedTab(tab.id)}
                    className={cn(
                      "py-4 px-1 border-b-2 font-medium text-sm",
                      selectedTab === tab.id
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="mt-8">
              {selectedTab === 'description' && (
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-600 leading-relaxed">
                    {product?.description || 'No description available.'}
                  </p>
                  <h4 className="text-lg font-semibold text-gray-900 mt-6 mb-4">
                    What's in the box:
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 text-gray-600">
                    <li>Premium Wireless Headphones</li>
                    <li>USB-C Charging Cable</li>
                    <li>3.5mm Audio Cable</li>
                    <li>Carrying Case</li>
                    <li>User Manual</li>
                  </ul>
                </div>
              )}

              {selectedTab === 'specifications' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {Object.entries((product as any)?.specifications || {}).map(([key, value]: [string, any]) => (
                    <div key={key} className="border-b border-gray-200 pb-2">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-900">{key}</span>
                        <span className="text-gray-600">{value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedTab === 'reviews' && (
                <div className="space-y-8">
                  {(product as any)?.reviews?.map((review: any) => (
                    <div key={review.id} className="border-b border-gray-200 pb-8">
                      <div className="flex items-center mb-4">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                "w-4 h-4",
                                i < review.rating
                                  ? "text-yellow-400 fill-current"
                                  : "text-gray-300"
                              )}
                            />
                          ))}
                        </div>
                        <span className="ml-2 text-sm font-medium text-gray-900">
                          {review.user.name}
                        </span>
                        <span className="ml-2 text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-600">{review.comment}</p>
                    </div>
                  ))}
                  
                  <Button variant="outline" className="w-full">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Write a Review
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Related Products */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              Related Products
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((product) => (
                <ProductCard key={(product as any)._id || (product as any).id} product={product as any} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
