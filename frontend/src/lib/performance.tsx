import React, { lazy } from 'react'
import dynamic from 'next/dynamic'

// Lazy loaded components for code splitting
export const LazyProductCard = lazy(() => import('../components/ProductCard'))
export const LazyEnhancedProductCard = lazy(() => import('../components/products/EnhancedProductCard').then(module => ({ default: module.EnhancedProductCard })))
export const LazyCartSidebar = lazy(() => import('../components/cart/CartSidebar'))

// Dynamic imports with Next.js dynamic for better optimization
export const DynamicEnhancedNavbar = dynamic(() => import('../components/layout/EnhancedNavbar').then(module => ({ default: module.EnhancedNavbar })), {
  ssr: false,
  loading: () => <div className="h-16 bg-gray-100 animate-pulse" />
})

export const DynamicThemeToggle = dynamic(() => import('../components/ui/ThemeToggle').then(module => ({ default: module.ThemeToggle })), {
  ssr: false,
  loading: () => <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
})

export const DynamicModal = dynamic(() => import('../components/ui/Modal').then(module => ({ default: module.Modal })), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-black bg-opacity-50 animate-pulse" />
})

// Heavy dashboard components loaded only when needed
export const DynamicUserDashboard = dynamic(() => import('../app/profile/page'), {
  loading: () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    </div>
  )
})

export const DynamicAdminDashboard = dynamic(() => import('../app/admin/page'), {
  loading: () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  )
})

// Performance utilities
export const preloadRoute = (href: string) => {
  const link = document.createElement('link')
  link.rel = 'prefetch'
  link.href = href
  document.head.appendChild(link)
}

export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = reject
    img.src = src
  })
}

// Bundle analysis helper
export const getBundleInfo = () => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    return {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
    }
  }
  return null
}

// Image optimization settings
export const imageOptimization = {
  quality: 85,
  formats: ['image/webp', 'image/avif'],
  placeholder: 'blur',
  loading: 'lazy' as const,
  sizes: {
    mobile: '(max-width: 768px) 100vw',
    tablet: '(max-width: 1024px) 50vw',
    desktop: '33vw'
  }
}

// Performance monitoring
export class PerformanceMonitor {
  private metrics: { [key: string]: number } = {}

  startTimer(label: string) {
    this.metrics[`${label}_start`] = performance.now()
  }

  endTimer(label: string) {
    const startTime = this.metrics[`${label}_start`]
    if (startTime) {
      this.metrics[label] = performance.now() - startTime
      delete this.metrics[`${label}_start`]
    }
  }

  getMetric(label: string): number {
    return this.metrics[label] || 0
  }

  getAllMetrics() {
    return { ...this.metrics }
  }

  logMetrics() {
    console.table(this.metrics)
  }
}

// Global performance monitor instance
export const perfMonitor = new PerformanceMonitor()

// Performance optimization hooks
export const usePerformanceOptimization = () => {
  const preloadCriticalResources = () => {
    if (typeof window !== 'undefined') {
      // Preload critical routes
      preloadRoute('/products')
      preloadRoute('/auth/login')
      preloadRoute('/cart')
      
      // Preload critical images
      const criticalImages = [
        '/images/logo.png',
        '/images/hero-bg.jpg'
      ]
      
      criticalImages.forEach(src => {
        preloadImage(src).catch(() => {
          console.warn(`Failed to preload image: ${src}`)
        })
      })
    }
  }

  const optimizeScroll = () => {
    let ticking = false

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          // Perform scroll-related operations
          ticking = false
        })
        ticking = true
      }
    }

    return handleScroll
  }

  const debounce = <T extends (...args: any[]) => void>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout
    return (...args: Parameters<T>) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func.apply(this, args), wait)
    }
  }

  const throttle = <T extends (...args: any[]) => void>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle = false
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func.apply(this, args)
        inThrottle = true
        setTimeout(() => (inThrottle = false), limit)
      }
    }
  }

  return {
    preloadCriticalResources,
    optimizeScroll,
    debounce,
    throttle,
    perfMonitor
  }
}
