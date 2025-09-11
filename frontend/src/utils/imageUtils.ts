/**
 * Image Utility Functions
 * Handles image URLs, fallbacks, and optimization
 */

export interface ImageConfig {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

/**
 * Generate optimized image URL with Unsplash parameters
 */
export function getOptimizedImageUrl(
  baseUrl: string, 
  config: ImageConfig = {}
): string {
  const {
    width = 600,
    height = 600,
    quality = 80,
    format = 'webp'
  } = config;

  // If it's already an Unsplash URL, add optimization parameters
  if (baseUrl.includes('unsplash.com')) {
    const url = new URL(baseUrl);
    url.searchParams.set('w', width.toString());
    url.searchParams.set('h', height.toString());
    url.searchParams.set('q', quality.toString());
    url.searchParams.set('fm', format);
    url.searchParams.set('fit', 'crop');
    url.searchParams.set('crop', 'center');
    return url.toString();
  }

  // For other URLs, return as-is
  return baseUrl;
}

/**
 * Get fallback image URL based on product category
 */
export function getFallbackImageUrl(category: string, productName: string): string {
  const categoryImages = {
    'electronics': 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&h=600&fit=crop&crop=center',
    'clothing': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=600&fit=crop&crop=center',
    'home-garden': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=600&fit=crop&crop=center',
    'sports-fitness': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=600&fit=crop&crop=center',
    'books-media': 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&h=600&fit=crop&crop=center',
    'health-beauty': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&h=600&fit=crop&crop=center',
    'food-beverages': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=600&fit=crop&crop=center',
    'automotive': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=600&fit=crop&crop=center'
  };

  return categoryImages[category as keyof typeof categoryImages] || 
         'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=600&fit=crop&crop=center';
}

/**
 * Generate placeholder image URL with product name
 */
export function getPlaceholderImageUrl(productName: string, width = 600, height = 600): string {
  const encodedName = encodeURIComponent(productName);
  return `https://via.placeholder.com/${width}x${height}/f3f4f6/6b7280?text=${encodedName}`;
}

/**
 * Check if image URL is valid
 */
export function isValidImageUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get product image with fallback chain
 */
export function getProductImage(
  images: string[] | string | undefined,
  category: string,
  productName: string,
  config: ImageConfig = {}
): string {
  // If images is an array, take the first one
  const primaryImage = Array.isArray(images) ? images[0] : images;
  
  // If we have a valid image URL, optimize it
  if (primaryImage && isValidImageUrl(primaryImage)) {
    return getOptimizedImageUrl(primaryImage, config);
  }
  
  // Fallback to category-based image
  return getFallbackImageUrl(category, productName);
}

/**
 * Get multiple product images with fallbacks
 */
export function getProductImages(
  images: string[] | string | undefined,
  category: string,
  productName: string,
  config: ImageConfig = {}
): string[] {
  if (Array.isArray(images) && images.length > 0) {
    return images
      .filter(img => isValidImageUrl(img))
      .map(img => getOptimizedImageUrl(img, config));
  }
  
  // Return fallback images
  return [
    getFallbackImageUrl(category, productName),
    getFallbackImageUrl(category, productName)
  ];
}

/**
 * Generate responsive image sizes for Next.js Image component
 */
export function getResponsiveImageSizes(breakpoints: string[] = ['640px', '768px', '1024px', '1280px']): string {
  return breakpoints.map((bp, index) => {
    const size = bp.replace('px', '');
    return `(max-width: ${bp}) ${size}px`;
  }).join(', ') + ', 600px';
}
