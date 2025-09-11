'use client'

import React, { ReactNode } from 'react'
import { EnhancedNavbar } from './EnhancedNavbar'
import Footer from './Footer'
import CartSidebar from '../cart/CartSidebar'
import { ErrorBoundary } from '../ui/ErrorBoundary'
import { useAppStore } from '../../store/useAppStore'
import { cn } from '../../utils/cn'
import { SkipLinks, LiveRegion } from '../ui/Accessibility'

interface MainLayoutProps {
  children: ReactNode
  className?: string
  showFooter?: boolean
  showNavbar?: boolean
  pageTitle?: string
}

export default function MainLayout({
  children,
  className,
  showFooter = true,
  showNavbar = true,
  pageTitle
}: MainLayoutProps) {
  const { isLoading, globalError } = useAppStore()

  // Update document title for accessibility
  React.useEffect(() => {
    if (pageTitle) {
      document.title = `${pageTitle} - ApniDukaan`
    }
  }, [pageTitle])

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <SkipLinks />
      {/* Global Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-900 font-medium">Loading...</span>
          </div>
        </div>
      )}

      {/* Global Error Banner */}
      {globalError && (
        <div 
          className="bg-red-600 text-white px-4 py-2 text-center text-sm"
          role="alert"
          aria-live="assertive"
        >
          <span>{globalError}</span>
          <button
            onClick={() => useAppStore.getState().clearGlobalError()}
            className="ml-4 underline hover:no-underline"
            aria-label="Dismiss error message"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation */}
      {showNavbar && (
        <header role="banner" id="navigation">
          <EnhancedNavbar />
        </header>
      )}

      {/* Main Content */}
      <main 
        id="main-content"
        className={cn('flex-1', className)}
        role="main"
        tabIndex={-1}
        aria-label={pageTitle ? `${pageTitle} content` : 'Main content'}
      >
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>

      {/* Footer */}
      {showFooter && (
        <footer role="contentinfo" id="footer">
          <Footer />
        </footer>
      )}
      
      {/* Cart Sidebar */}
      <CartSidebar />
    </div>
  )
}


