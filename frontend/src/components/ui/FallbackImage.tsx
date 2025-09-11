'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ImageIcon } from 'lucide-react';

interface FallbackImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fallbackSrc?: string;
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
}

const FallbackImage: React.FC<FallbackImageProps> = ({
  src,
  alt,
  width = 400,
  height = 400,
  className = '',
  fallbackSrc,
  priority = false,
  fill = false,
  sizes,
}) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Generate a reliable fallback image URL
  const generateFallbackUrl = (originalSrc: string) => {
    if (fallbackSrc) return fallbackSrc;
    
    // Create a deterministic seed from the original src for consistent fallback images
    const seed = Math.abs(originalSrc.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0));
    
    return `https://picsum.photos/${width}/${height}?random=${seed % 1000}`;
  };

  const handleError = () => {
    setError(true);
    setLoading(false);
  };

  const handleLoad = () => {
    setLoading(false);
  };

  // Show placeholder while loading
  if (loading && !error) {
    return (
      <div 
        className={`bg-gray-200 animate-pulse flex items-center justify-center ${className}`}
        style={fill ? {} : { width, height }}
      >
        <ImageIcon className="w-8 h-8 text-gray-400" />
      </div>
    );
  }

  // Show error state with fallback image
  if (error) {
    return (
      <div 
        className={`bg-gray-100 flex items-center justify-center border border-gray-200 ${className}`}
        style={fill ? {} : { width, height }}
      >
        <div className="text-center text-gray-500">
          <ImageIcon className="w-8 h-8 mx-auto mb-1 text-gray-400" />
          <p className="text-xs">Image not available</p>
        </div>
      </div>
    );
  }

  const imageProps = {
    src: error ? generateFallbackUrl(src) : src,
    alt,
    onError: handleError,
    onLoad: handleLoad,
    priority,
    className,
    ...(fill ? { fill: true, sizes } : { width, height }),
  };

  return <Image {...imageProps} />;
};

export default FallbackImage;
