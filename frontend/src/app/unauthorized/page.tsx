'use client'

export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Shield, ArrowLeft, Home, LogIn } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { GuestUserButton } from '../../components/auth/GuestUserButton'
import { useAuthStatus } from '../../hooks/useAuthAPI'
import { usePermissions, rbacService } from '../../services/rbac'
import MainLayout from '../../components/layout/MainLayout'

export default function UnauthorizedPage() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStatus()

  const handleGoBack = () => {
    router.back()
  }

  const handleGoHome = () => {
    router.push('/')
  }

  const handleLogin = () => {
    const currentPath = window.location.pathname
    router.push(`/auth/login?redirect=${encodeURIComponent(currentPath)}`)
  }

  const handleGuestLogin = (email: string, password: string) => {
    // For the unauthorized page, we'll redirect to login with guest credentials
    // The login page will handle the actual authentication
    const currentPath = window.location.pathname
    router.push(`/auth/login?redirect=${encodeURIComponent(currentPath)}&guest=true`)
  }

  return (
    <MainLayout>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          {/* Error Icon */}
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 mb-8">
            <Shield className="h-10 w-10 text-red-600" />
          </div>

          {/* Error Code */}
          <div className="mb-6">
            <Badge variant="secondary" className="bg-red-100 text-red-800 px-4 py-2 text-lg">
              403 - Access Denied
            </Badge>
          </div>

          {/* Main Message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Access Denied
          </h1>
          
          {isAuthenticated ? (
            <div className="space-y-4 mb-8">
              <p className="text-lg text-gray-600">
                Sorry, you don't have permission to access this page.
              </p>
              
              {user && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Current Role:</strong> {rbacService.getRoleName(user.role)}
                  </p>
                  <p className="text-sm text-gray-500">
                    This page requires different permissions than your current role provides.
                  </p>
                </div>
              )}

              <p className="text-gray-600">
                If you believe this is a mistake, please contact your administrator or try logging in with a different account.
              </p>
            </div>
          ) : (
            <div className="space-y-4 mb-8">
              <p className="text-lg text-gray-600">
                You need to be signed in to access this page.
              </p>
              <p className="text-gray-600">
                Please log in and make sure you have the required permissions.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-4">
            {!isAuthenticated ? (
              <div className="space-y-3">
                <Button size="lg" onClick={handleLogin} className="w-full">
                  <LogIn className="mr-2 h-5 w-5" />
                  Sign In
                </Button>
                
                <div className="text-center">
                  <span className="text-sm text-gray-500">or</span>
                </div>
                
                <GuestUserButton
                  onGuestLogin={handleGuestLogin}
                  className="w-full"
                  size="lg"
                />
              </div>
            ) : (
              <Button size="lg" onClick={handleGoHome} className="w-full">
                <Home className="mr-2 h-5 w-5" />
                Go to Homepage
              </Button>
            )}

            <div className="flex space-x-4">
              <Button
                variant="outline"
                onClick={handleGoBack}
                className="flex-1"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>

              <Link href="/contact" className="flex-1">
                <Button variant="outline" className="w-full">
                  Contact Support
                </Button>
              </Link>
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Common Solutions
            </h3>
            <div className="text-left space-y-3 text-sm text-gray-600">
              <div className="flex items-start">
                <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span>Make sure you're logged in with the correct account</span>
              </div>
              <div className="flex items-start">
                <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span>Check if your account has the necessary permissions</span>
              </div>
              <div className="flex items-start">
                <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span>Contact your administrator if you need access</span>
              </div>
              <div className="flex items-start">
                <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span>Try refreshing the page or clearing your browser cache</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
