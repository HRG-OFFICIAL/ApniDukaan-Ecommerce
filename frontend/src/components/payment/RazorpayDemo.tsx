'use client'

import React, { useState } from 'react';
import { RazorpayPaymentForm } from './RazorpayPaymentForm';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { CheckCircle, XCircle, CreditCard } from 'lucide-react';

interface PaymentResult {
  success: boolean;
  paymentId?: string;
  orderId?: string;
  error?: string;
}

export function RazorpayDemo() {
  const [amount, setAmount] = useState(100);
  const [customerName, setCustomerName] = useState('John Doe');
  const [customerEmail, setCustomerEmail] = useState('john@example.com');
  const [customerPhone, setCustomerPhone] = useState('+919876543210');
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePaymentSuccess = (paymentId: string, orderId: string) => {
    setPaymentResult({
      success: true,
      paymentId,
      orderId
    });
    setIsProcessing(false);
  };

  const handlePaymentError = (error: string) => {
    setPaymentResult({
      success: false,
      error
    });
    setIsProcessing(false);
  };

  const resetDemo = () => {
    setPaymentResult(null);
    setIsProcessing(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Razorpay Payment Integration Demo</h1>
        <p className="text-gray-600">Test the complete Razorpay payment flow with real API integration</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount (₹)
              </label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                min="1"
                step="0.01"
                placeholder="Enter amount"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Name
              </label>
              <Input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter customer name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Email
              </label>
              <Input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="Enter customer email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Phone
              </label>
              <Input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Enter customer phone"
              />
            </div>

            <div className="pt-4">
              <Button
                onClick={resetDemo}
                variant="outline"
                className="w-full"
              >
                Reset Demo
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Payment Form */}
        <div>
          <RazorpayPaymentForm
            amount={amount}
            currency="INR"
            receipt={`order_${Date.now()}`}
            customerName={customerName}
            customerEmail={customerEmail}
            customerPhone={customerPhone}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
            disabled={isProcessing}
          />
        </div>
      </div>

      {/* Payment Result */}
      {paymentResult && (
        <Card className={paymentResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              {paymentResult.success ? (
                <CheckCircle className="w-6 h-6 text-green-600 mt-0.5" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600 mt-0.5" />
              )}
              <div className="flex-1">
                <h3 className={`text-lg font-semibold ${paymentResult.success ? 'text-green-900' : 'text-red-900'}`}>
                  {paymentResult.success ? 'Payment Successful!' : 'Payment Failed'}
                </h3>
                
                {paymentResult.success ? (
                  <div className="mt-2 space-y-1 text-sm text-green-700">
                    <p><strong>Payment ID:</strong> {paymentResult.paymentId}</p>
                    <p><strong>Order ID:</strong> {paymentResult.orderId}</p>
                    <p><strong>Amount:</strong> ₹{amount}</p>
                    <p><strong>Status:</strong> Completed</p>
                  </div>
                ) : (
                  <div className="mt-2 text-sm text-red-700">
                    <p><strong>Error:</strong> {paymentResult.error}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* API Status */}
      <Card>
        <CardHeader>
          <CardTitle>API Integration Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Frontend API Routes</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Backend Payment Service</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Razorpay Integration</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <p>1. Configure the payment amount and customer details above</p>
          <p>2. Click the "Pay" button to open the Razorpay payment modal</p>
          <p>3. Use Razorpay test credentials for testing:</p>
          <ul className="ml-4 space-y-1">
            <li>• Card: 4111 1111 1111 1111</li>
            <li>• CVV: Any 3 digits</li>
            <li>• Expiry: Any future date</li>
            <li>• Name: Any name</li>
          </ul>
          <p>4. Complete the payment to see the success/error result</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default RazorpayDemo;
