'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingCart, Star, Eye } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { formatCurrency } from '@/utils/format';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export interface ProductCardProps {
  product: {
    id: string;
    name: string;
    description?: string;
    price: number;
    compareAtPrice?: number;
    images: Array<{
      url: string;
      alt?: string;
    }>;
    category: {
      id: string;
      name: string;
      slug: string;
    };
    brand?: {
      id: string;
      name: string;
    };
    rating?: {
      average: number;
      count: number;
    };
    inStock: boolean;
    stockQuantity?: number;
    slug: string;
    tags: string[];
    variants?: Array<{
      id: string;
      name: string;
      price: number;
      inStock: boolean;
    }>;
  };
  showQuickActions?: boolean;
  showComparePrice?: boolean;
  showRating?: boolean;
  showBrand?: boolean;
  className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  showQuickActions = true,
  showComparePrice = true,
  showRating = true,
  showBrand = true,
  className = ''
}) => {
  const { data: session } = useSession();
  const { addToCart, isLoading: cartLoading } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist, isLoading: wishlistLoading } = useWishlist();
  
  const [isHovered, setIsHovered] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const primaryImage = product.images[0];
  const hasMultipleImages = product.images.length > 1;
  const discountPercentage = product.compareAtPrice 
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;
  
  const isWishlisted = session ? isInWishlist(product.id) : false;
  const isLowStock = product.stockQuantity !== undefined && product.stockQuantity < 5;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!product.inStock) return;
    
    try {
      await addToCart({
        productId: product.id,
        quantity: 1,
        variantId: product.variants?.[0]?.id
      });
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!session) {
      // Redirect to login or show login modal
      return;
    }
    
    try {
      if (isWishlisted) {
        await removeFromWishlist(product.id);
      } else {
        await addToWishlist(product.id);
      }
    } catch (error) {
      console.error('Failed to update wishlist:', error);
    }
  };

  const handleImageNext = () => {
    if (hasMultipleImages) {
      setCurrentImageIndex((prev) => 
        prev === product.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const handleImagePrev = () => {
    if (hasMultipleImages) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? product.images.length - 1 : prev - 1
      );
    }
  };

  return (
    <div 
      className={`group relative bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/products/${product.slug}`} className="block">
        {/* Product Image */}
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          {primaryImage && (
            <Image
              src={product.images[currentImageIndex]?.url || primaryImage.url}
              alt={product.images[currentImageIndex]?.alt || product.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />
          )}
          
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {!product.inStock && (
              <Badge variant="destructive" className="text-xs">
                Out of Stock
              </Badge>
            )}
            {discountPercentage > 0 && (
              <Badge variant="destructive" className="text-xs">
                -{discountPercentage}%
              </Badge>
            )}
            {isLowStock && product.inStock && (
              <Badge variant="warning" className="text-xs">
                Low Stock
              </Badge>
            )}
            {product.tags.includes('new') && (
              <Badge variant="secondary" className="text-xs">
                New
              </Badge>
            )}
            {product.tags.includes('bestseller') && (
              <Badge variant="default" className="text-xs">
                Best Seller
              </Badge>
            )}
          </div>

          {/* Image Navigation */}
          {hasMultipleImages && isHovered && (
            <>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleImagePrev();
                }}
                className="absolute left-1 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15,18 9,12 15,6"></polyline>
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleImageNext();
                }}
                className="absolute right-1 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9,6 15,12 9,18"></polyline>
                </svg>
              </button>
            </>
          )}

          {/* Quick Actions */}
          {showQuickActions && (
            <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleWishlistToggle}
                disabled={wishlistLoading}
                className={`p-2 rounded-full transition-colors ${
                  isWishlisted 
                    ? 'bg-red-500 text-white' 
                    : 'bg-white/80 hover:bg-white text-gray-700'
                }`}
                title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <Heart 
                  size={16} 
                  className={isWishlisted ? 'fill-current' : ''} 
                />
              </button>
              
              <Link
                href={`/products/${product.slug}`}
                className="p-2 bg-white/80 hover:bg-white text-gray-700 rounded-full transition-colors"
                title="Quick view"
              >
                <Eye size={16} />
              </Link>
            </div>
          )}

          {/* Image Dots */}
          {hasMultipleImages && product.images.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {product.images.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentImageIndex(index);
                  }}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4">
          {/* Brand */}
          {showBrand && product.brand && (
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              {product.brand.name}
            </p>
          )}

          {/* Product Name */}
          <h3 className="font-medium text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {product.name}
          </h3>

          {/* Category */}
          <Link
            href={`/categories/${product.category.slug}`}
            className="text-xs text-gray-500 hover:text-blue-600 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {product.category.name}
          </Link>

          {/* Rating */}
          {showRating && product.rating && (
            <div className="flex items-center gap-1 mt-2 mb-2">
              <div className="flex items-center">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    size={12}
                    className={`${
                      i < Math.floor(product.rating!.average)
                        ? 'text-yellow-400 fill-current'
                        : i < product.rating!.average
                        ? 'text-yellow-400 fill-current opacity-50'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500">
                ({product.rating.count})
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-2 mb-3">
            <span className="font-semibold text-lg text-gray-900">
              {formatCurrency(product.price)}
            </span>
            {showComparePrice && product.compareAtPrice && (
              <span className="text-sm text-gray-500 line-through">
                {formatCurrency(product.compareAtPrice)}
              </span>
            )}
          </div>

          {/* Add to Cart Button */}
          <Button
            onClick={handleAddToCart}
            disabled={!product.inStock || cartLoading}
            variant={product.inStock ? 'default' : 'secondary'}
            size="sm"
            className="w-full"
          >
            {cartLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Adding...
              </div>
            ) : product.inStock ? (
              <div className="flex items-center gap-2">
                <ShoppingCart size={16} />
                Add to Cart
              </div>
            ) : (
              'Out of Stock'
            )}
          </Button>
        </div>
      </Link>
    </div>
  );
};
