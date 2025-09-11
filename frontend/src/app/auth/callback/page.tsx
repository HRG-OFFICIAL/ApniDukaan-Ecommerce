'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useOAuth } from '../../../services/oauth'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'
import { AlertCircle, CheckCircle } from 'lucide-react'
import MainLayout from '../../../components/layout/MainLayout'

export default function AuthCallbackPage() {
  const router = useRouter()
  const { handleCallback } = useOAuth()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const processCallback = async () => {
      try {
        const result = handleCallback()
        
        if (result.success) {
          setStatus('success')
          setMessage('Authentication successful! Redirecting...')
          
          // Get redirect URL from localStorage or default to home
          const redirectUrl = localStorage.getItem('oauth_redirect_url') || '/'
          localStorage.removeItem('oauth_redirect_url')
          
          // Redirect after a short delay to show success message
          setTimeout(() => {
            router.push(redirectUrl)
          }, 2000)
        } else {
          setStatus('error')
          setMessage(result.error || 'Authentication failed')
        }
      } catch (error) {
        console.error('Callback processing error:', error)
        setStatus('error')
        setMessage('An unexpected error occurred during authentication')
      }
    }

    // Small delay to ensure URL params are available
    setTimeout(processCallback, 100)
  }, [handleCallback, router])

  const handleRetry = () => {
    router.push('/auth/login')
  }

  const handleGoHome = () => {
    router.push('/')
  }

  return (
    <MainLayout>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            {status === 'loading' && (
              <>
                <LoadingSpinner size="lg" className="mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Processing Authentication
                </h2>
                <p className="text-gray-600">
                  Please wait while we complete your sign-in...
                </p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Success!
                </h2>
                <p className="text-gray-600 mb-6">
                  {message}
                </p>
                <div className="animate-pulse">
                  <LoadingSpinner size="md" className="mx-auto" />
                </div>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Authentication Failed
                </h2>
                <p className="text-gray-600 mb-8">
                  {message}
                </p>
                <div className="space-y-4">
                  <button
                    onClick={handleRetry}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={handleGoHome}
                    className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Go to Homepage
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Help Text */}
          <div className="text-center">
            <p className="text-sm text-gray-500">
              Having trouble? <a href="/contact" className="text-blue-600 hover:text-blue-500">Contact support</a>
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
