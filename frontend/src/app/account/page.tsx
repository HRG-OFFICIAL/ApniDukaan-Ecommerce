'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  User, 
  Package, 
  Heart, 
  MapPin, 
  Settings, 
  ShoppingBag,
  Clock,
  CreditCard,
  Bell,
  ChevronRight
} from 'lucide-react'
import { useAuthStore } from '../../store/useAuthStore'
import { useCartStore } from '../../store/useCartStore'
import { usePreferencesStore } from '../../store/usePreferencesStore'
import MainLayout from '../../components/layout/MainLayout'
import { Button } from '../../components/ui/Button'
import { Loading } from '../../components/ui/LoadingSpinner'
import { Breadcrumb } from '../../components/ui/Breadcrumb'
import { cn } from '../../utils/cn'

interface AccountStats {
  totalOrders: number
  activeOrders: number
  wishlistItems: number
  rewardPoints: number
}

export default function AccountDashboard() {
  const { user, isAuthenticated } = useAuthStore()
  const { items } = useCartStore()
  const { wishlist } = usePreferencesStore()
  
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<AccountStats>({
    totalOrders: 0,
    activeOrders: 0,
    wishlistItems: 0,
    rewardPoints: 0
  })

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    const fetchAccountData = async () => {
      try {
        // Mock API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        setStats({
          totalOrders: 12,
          activeOrders: 2,
          wishlistItems: wishlist.length,
          rewardPoints: 240
        })
      } catch (error) {
        console.error('Error fetching account data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAccountData()
  }, [isAuthenticated, wishlist.length])

  const breadcrumbItems = [
    { label: 'My Account' }
  ]

  const quickActions = [
    {
      name: 'View Orders',
      description: 'Track your orders and view order history',
      href: '/account/orders',
      icon: Package,
      stats: `${stats.totalOrders} orders`
    },
    {
      name: 'Wishlist',
      description: 'View your saved items',
      href: '/account/wishlist',
      icon: Heart,
      stats: `${stats.wishlistItems} items`
    },
    {
      name: 'Addresses',
      description: 'Manage your shipping addresses',
      href: '/account/addresses',
      icon: MapPin,
      stats: 'Manage addresses'
    },
    {
      name: 'Payment Methods',
      description: 'Manage your payment methods',
      href: '/account/payment-methods',
      icon: CreditCard,
      stats: 'Secure payments'
    },
    {
      name: 'Account Settings',
      description: 'Update your account preferences',
      href: '/account/settings',
      icon: Settings,
      stats: 'Privacy & security'
    },
    {
      name: 'Notifications',
      description: 'Manage your notification preferences',
      href: '/account/notifications',
      icon: Bell,
      stats: 'Email & SMS'
    }
  ]

  if (!isAuthenticated) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <User className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Please sign in</h1>
            <p className="text-gray-600 mb-8">You need to be signed in to view your account.</p>
            <Button href="/auth/login?redirect=/account">Sign In</Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loading size="lg" text="Loading your account..." />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumb items={breadcrumbItems} className="mb-8" />

          {/* Welcome Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Welcome back, {user?.name?.split(' ')[0]}!
                </h1>
                <p className="text-gray-600">
                  Manage your account and track your orders from your dashboard.
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Member since</p>
                <p className="text-sm font-medium text-gray-900">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'January 2024'}
                </p>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Package className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Active Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeOrders}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Heart className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Wishlist Items</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.wishlistItems}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ShoppingBag className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Cart Items</p>
                  <p className="text-2xl font-bold text-gray-900">{items.length}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Quick Actions */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quickActions.map((action) => {
                    const Icon = action.icon
                    return (
                      <Link
                        key={action.name}
                        href={action.href}
                        className="group p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              <Icon className="h-6 w-6 text-gray-400 group-hover:text-primary-600 transition-colors" />
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                                {action.name}
                              </h3>
                              <p className="text-xs text-gray-500 mt-1">
                                {action.description}
                              </p>
                              <p className="text-xs text-primary-600 font-medium mt-1">
                                {action.stats}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-primary-600 transition-colors" />
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Recent Activity & Account Info */}
            <div className="space-y-6">
              {/* Recent Orders */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
                  <Link 
                    href="/account/orders" 
                    className="text-sm text-primary-600 hover:text-primary-500 font-medium"
                  >
                    View all
                  </Link>
                </div>

                <div className="space-y-3">
                  {stats.totalOrders > 0 ? (
                    <>
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <div>
                          <p className="text-sm font-medium text-gray-900">#APD-2024-001</p>
                          <p className="text-xs text-gray-500">2 items • $299.99</p>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Processing
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <div>
                          <p className="text-sm font-medium text-gray-900">#APD-2024-002</p>
                          <p className="text-xs text-gray-500">1 item • $149.99</p>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Delivered
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900">#APD-2024-003</p>
                          <p className="text-xs text-gray-500">3 items • $89.97</p>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Shipped
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Package className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                      <p className="text-sm text-gray-500">No orders yet</p>
                      <Button href="/products" size="sm" className="mt-2">
                        Start Shopping
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Account Status */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Status</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      <span className="text-sm text-gray-700">Account Status</span>
                    </div>
                    <span className="text-sm font-medium text-green-600">Active</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      <span className="text-sm text-gray-700">Membership</span>
                    </div>
                    <span className="text-sm font-medium text-blue-600">Standard</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                      <span className="text-sm text-gray-700">Reward Points</span>
                    </div>
                    <span className="text-sm font-medium text-purple-600">{stats.rewardPoints} pts</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200">
                  <Button href="/account/settings" variant="outline" size="sm" className="w-full">
                    Manage Account
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
