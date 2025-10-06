'use client'

import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { razorpayService } from '../../services/razorpayService'

export default function TestRazorpayPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<string>('')

  const handleTestPayment = async () => {
    setIsLoading(true)
    setResult('')

    try {
      await razorpayService.openPaymentModal({
        amount: 1000, // ₹10.00
        currency: 'INR',
        receipt: `test_order_${Date.now()}`,
        customerName: 'Test User',
        customerEmail: 'test@example.com',
        customerPhone: '+919876543210',
        description: 'Test payment for ApniDukaan',
        onSuccess: (response) => {
          console.log('Payment successful:', response)
          setResult(`✅ Payment Successful!\nPayment ID: ${response.razorpay_payment_id}\nOrder ID: ${response.razorpay_order_id}`)
          setIsLoading(false)
        },
        onError: (error) => {
          console.error('Payment failed:', error)
          setResult(`❌ Payment Failed: ${error}`)
          setIsLoading(false)
        },
        onDismiss: () => {
          console.log('Payment modal dismissed')
          setResult('⚠️ Payment cancelled by user')
          setIsLoading(false)
        }
      })
    } catch (error: any) {
      console.error('Error opening payment modal:', error)
      setResult(`❌ Error: ${error.message}`)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Test Razorpay Integration
        </h1>
        
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Click the button below to test the Razorpay payment modal
            </p>
            <p className="text-sm text-gray-500">
              Amount: ₹10.00 (1000 paise)
            </p>
          </div>

          <Button
            onClick={handleTestPayment}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Processing...' : 'Test Razorpay Payment'}
          </Button>

          {result && (
            <div className="mt-6 p-4 bg-gray-100 rounded-lg">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                {result}
              </pre>
            </div>
          )}
        </div>

        <div className="mt-8 text-xs text-gray-500">
          <p><strong>Note:</strong> This is using real Razorpay integration.</p>
          <p>Test credentials are configured in the API gateway.</p>
        </div>
      </div>
    </div>
  )
}
