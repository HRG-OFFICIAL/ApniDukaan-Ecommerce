'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle, Package, Truck, Calendar, Download, Mail } from 'lucide-react'
import { useCartStore } from '../../../store/useCartStore'
import { useAuthStore } from '../../../store/useAuthStore'
import MainLayout from '../../../components/layout/MainLayout'
import { Button } from '../../../components/ui/Button'
import { Loading } from '../../../components/ui/LoadingSpinner'
import { cn } from '../../../utils/cn'

interface OrderDetails {
  id: string
  orderNumber: string
  total: number
  estimatedDelivery: string
  trackingNumber?: string
  email: string
}

export default function CheckoutSuccessPage() {
  const { clearCart } = useCartStore()
  const { user } = useAuthStore()
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate fetching order details
    const fetchOrderDetails = async () => {
      try {
        // Mock API call
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        const mockOrder: OrderDetails = {
          id: 'order_' + Date.now(),
          orderNumber: 'APD-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
          total: 299.99,
          estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          email: user?.email || 'customer@example.com'
        }
        
        setOrderDetails(mockOrder)
        
        // Clear the cart after successful order
        clearCart()
      } catch (error) {
        console.error('Error fetching order details:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrderDetails()
  }, [clearCart, user?.email])

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loading size="lg" text="Confirming your order..." />
        </div>
      </MainLayout>
    )
  }

  if (!orderDetails) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h1>
            <p className="text-gray-600 mb-8">We couldn't find your order details.</p>
            <Button href="/">Return Home</Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Success Header */}
          <div className="text-center mb-12">
            <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Order Confirmed!
            </h1>
            <p className="text-lg text-gray-600 mb-2">
              Thank you for your purchase. Your order has been successfully placed.
            </p>
            <p className="text-sm text-gray-500">
              Order confirmation has been sent to <strong>{orderDetails.email}</strong>
            </p>
          </div>

          {/* Order Details Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Order Details
                </h2>
                <span className="text-sm font-medium text-gray-500">
                  #{orderDetails.orderNumber}
                </span>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Order Info */}
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Package className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Order Number</p>
                      <p className="text-sm text-gray-600">{orderDetails.orderNumber}</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Order Date</p>
                      <p className="text-sm text-gray-600">{new Date().toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <Truck className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Estimated Delivery</p>
                      <p className="text-sm text-gray-600">{orderDetails.estimatedDelivery}</p>
                    </div>
                  </div>

                  {orderDetails.trackingNumber && (
                    <div className="flex items-center">
                      <Package className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Tracking Number</p>
                        <p className="text-sm text-gray-600 font-mono">{orderDetails.trackingNumber}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Order Total */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Order Total</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">${(orderDetails.total * 0.85).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Shipping</span>
                      <span className="font-medium">Free</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax</span>
                      <span className="font-medium">${(orderDetails.total * 0.15).toFixed(2)}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-2 flex justify-between">
                      <span className="text-base font-semibold text-gray-900">Total</span>
                      <span className="text-lg font-bold text-gray-900">
                        ${orderDetails.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">What happens next?</h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100">
                    <span className="text-sm font-medium text-primary-600">1</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">Order Processing</p>
                  <p className="text-sm text-gray-600">We'll prepare your items for shipment.</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100">
                    <span className="text-sm font-medium text-primary-600">2</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">Shipment</p>
                  <p className="text-sm text-gray-600">Your order will be shipped within 1-2 business days.</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100">
                    <span className="text-sm font-medium text-primary-600">3</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">Delivery</p>
                  <p className="text-sm text-gray-600">
                    Estimated delivery by {orderDetails.estimatedDelivery}.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <Button 
              href="/account/orders" 
              variant="outline" 
              className="flex items-center justify-center"
            >
              <Package className="w-4 h-4 mr-2" />
              Track Order
            </Button>

            <Button 
              variant="outline" 
              className="flex items-center justify-center"
              onClick={() => window.print()}
            >
              <Download className="w-4 h-4 mr-2" />
              Download Receipt
            </Button>

            <Button 
              href="/support" 
              variant="outline"
              className="flex items-center justify-center"
            >
              <Mail className="w-4 h-4 mr-2" />
              Contact Support
            </Button>
          </div>

          {/* Continue Shopping */}
          <div className="text-center">
            <div className="inline-flex space-x-4">
              <Button href="/products" size="lg">
                Continue Shopping
              </Button>
              <Button href="/" variant="outline" size="lg">
                Return Home
              </Button>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-12 text-center text-sm text-gray-500">
            <p>
              Need help with your order?{' '}
              <Link href="/support" className="text-primary-600 hover:text-primary-500 font-medium">
                Contact our customer support team
              </Link>
            </p>
            <p className="mt-2">
              You can track your order status in your{' '}
              <Link href="/account/orders" className="text-primary-600 hover:text-primary-500 font-medium">
                account dashboard
              </Link>
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
