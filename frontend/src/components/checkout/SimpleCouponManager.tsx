'use client'

import React, { useState } from 'react'
import { Tag, Check, X, AlertCircle } from 'lucide-react'
import { Button } from '../ui/Button'

export interface Coupon {
  id: string
  code: string
  type: 'percentage' | 'fixed_amount' | 'free_shipping'
  value: number
  description: string
  minOrderAmount?: number
  maxDiscount?: number
  expiresAt: string
  usageLimit?: number
  usedCount: number
  isActive: boolean
}

interface CouponManagerProps {
  currentTotal: number
  appliedCoupons: Coupon[]
  onApplyCoupon: (couponCode: string) => Promise<{ success: boolean; coupon?: Coupon; error?: string }>
  onRemoveCoupon: (couponId: string) => void
  className?: string
}

export function CouponManager({ 
  currentTotal, 
  appliedCoupons, 
  onApplyCoupon, 
  onRemoveCoupon, 
  className = '' 
}: CouponManagerProps) {
  const [couponCode, setCouponCode] = useState('')
  const [isApplying, setIsApplying] = useState(false)
  const [error, setError] = useState('')

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setError('Please enter a coupon code')
      return
    }

    setIsApplying(true)
    setError('')

    try {
      const result = await onApplyCoupon(couponCode.toUpperCase())
      
      if (result.success) {
        setCouponCode('')
        setError('')
      } else {
        setError(result.error || 'Invalid coupon code')
      }
    } catch (err) {
      setError('Failed to apply coupon. Please try again.')
    } finally {
      setIsApplying(false)
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center mb-3">
          <Tag className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Apply Coupon Code
          </h3>
        </div>

        <div className="flex space-x-2">
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            placeholder="Enter coupon code"
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 text-gray-900 bg-white uppercase"
            disabled={isApplying}
          />
          <Button
            onClick={handleApplyCoupon}
            disabled={isApplying || !couponCode.trim()}
          >
            {isApplying ? 'Applying...' : 'Apply'}
          </Button>
        </div>

        {error && (
          <div className="flex items-center mt-2 text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4 mr-1" />
            {error}
          </div>
        )}
      </div>

      {appliedCoupons.length > 0 && (
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 p-4">
          <div className="flex items-center mb-3">
            <Check className="h-5 w-5 text-green-600 mr-2" />
            <h4 className="text-sm font-semibold text-green-800 dark:text-green-200">
              Applied Coupons
            </h4>
          </div>
          <div className="space-y-2">
            {appliedCoupons.map((coupon) => (
              <div
                key={coupon.id}
                className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border border-green-200 dark:border-green-700"
              >
                <div>
                  <code className="text-sm font-mono font-bold text-green-700 dark:text-green-300">
                    {coupon.code}
                  </code>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    {coupon.description}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveCoupon(coupon.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
