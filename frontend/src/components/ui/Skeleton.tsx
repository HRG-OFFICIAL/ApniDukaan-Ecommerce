import React from 'react';
import { cn } from '../../utils/cn';

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'card' | 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export function Skeleton({ 
  className, 
  variant = 'default',
  width,
  height,
  lines = 1
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-gray-200 dark:bg-gray-800 rounded';
  
  const variantClasses = {
    default: 'h-4',
    card: 'h-48',
    text: 'h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-md'
  };

  const style = {
    ...(width && { width: typeof width === 'number' ? `${width}px` : width }),
    ...(height && { height: typeof height === 'number' ? `${height}px` : height })
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: lines }, (_, i) => (
          <div
            key={i}
            className={cn(baseClasses, variantClasses[variant])}
            style={{ 
              ...style,
              width: i === lines - 1 ? '75%' : '100%' // Last line is shorter
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(baseClasses, variantClasses[variant], className)}
      style={style}
    />
  );
}

// Predefined skeleton components for common use cases
export function ProductCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 space-y-4">
      <Skeleton variant="rectangular" height={200} />
      <div className="space-y-2">
        <Skeleton variant="text" lines={2} />
        <div className="flex items-center justify-between">
          <Skeleton width={80} height={20} />
          <Skeleton width={60} height={24} />
        </div>
      </div>
    </div>
  );
}

export function ProductListSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Skeleton variant="circular" width={80} height={80} />
        <div className="space-y-2">
          <Skeleton width={200} height={24} />
          <Skeleton width={150} height={16} />
        </div>
      </div>
      
      <div className="space-y-4">
        <Skeleton variant="text" lines={1} />
        <Skeleton variant="text" lines={1} />
        <Skeleton variant="text" lines={2} />
      </div>
    </div>
  );
}

export function OrderSkeleton() {
  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton width={120} height={16} />
        <Skeleton width={80} height={24} />
      </div>
      
      <div className="flex items-center space-x-4">
        <Skeleton variant="rectangular" width={60} height={60} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" lines={1} />
          <Skeleton width={100} height={16} />
        </div>
        <Skeleton width={80} height={20} />
      </div>
      
      <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
        <Skeleton width={100} height={16} />
        <Skeleton width={80} height={20} />
      </div>
    </div>
  );
}
