'use client'

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { razorpayService } from '../../services/razorpayService';
import { Loader2, CreditCard, Smartphone, Building2, Wallet } from 'lucide-react';

interface RazorpayPaymentFormProps {
  amount: number;
  currency?: string;
  receipt: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  onSuccess: (response: any) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

const paymentMethods = [
  { id: 'card', name: 'Credit/Debit Card', icon: CreditCard },
  { id: 'upi', name: 'UPI', icon: Smartphone },
  { id: 'netbanking', name: 'Net Banking', icon: Building2 },
  { id: 'wallet', name: 'Wallet', icon: Wallet }
];

export function RazorpayPaymentForm({
  amount,
  currency = 'INR',
  receipt,
  customerName,
  customerEmail,
  customerPhone,
  onSuccess,
  onError,
  disabled = false
}: RazorpayPaymentFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('card');
  const [customerDetails, setCustomerDetails] = useState({
    name: customerName || '',
    email: customerEmail || '',
    phone: customerPhone || ''
  });

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const handlePayment = async () => {
    if (disabled || isLoading) return;

    // Validate customer details
    if (!customerDetails.name.trim()) {
      onError('Customer name is required');
      return;
    }

    if (!customerDetails.email.trim()) {
      onError('Customer email is required');
      return;
    }

    if (!customerDetails.phone.trim()) {
      onError('Customer phone is required');
      return;
    }

    setIsLoading(true);

    try {
      await razorpayService.openPaymentModal({
        amount,
        currency,
        receipt,
        customerName: customerDetails.name,
        customerEmail: customerDetails.email,
        customerPhone: customerDetails.phone,
        description: `Payment for order ${receipt}`,
        onSuccess: (response) => {
          setIsLoading(false);
          onSuccess(response);
        },
        onError: (error) => {
          setIsLoading(false);
          onError(error);
        },
        onDismiss: () => {
          setIsLoading(false);
        }
      });
    } catch (error: any) {
      setIsLoading(false);
      onError(error.message || 'Payment failed');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-md border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-center text-lg font-semibold text-gray-900">Complete Payment</h3>
        <div className="text-center text-2xl font-bold text-green-600 mt-2">
          {formatCurrency(amount, currency)}
        </div>
      </div>
      
      <div className="p-6 space-y-6">
        {/* Customer Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Customer Details</h3>
          
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name *</label>
            <Input
              id="name"
              type="text"
              value={customerDetails.name}
              onChange={(e) => setCustomerDetails(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter your full name"
              disabled={disabled || isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email *</label>
            <Input
              id="email"
              type="email"
              value={customerDetails.email}
              onChange={(e) => setCustomerDetails(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Enter your email"
              disabled={disabled || isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number *</label>
            <Input
              id="phone"
              type="tel"
              value={customerDetails.phone}
              onChange={(e) => setCustomerDetails(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="Enter your phone number"
              disabled={disabled || isLoading}
              required
            />
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Payment Method</h3>
          
          <div className="grid grid-cols-2 gap-3">
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setSelectedMethod(method.id)}
                  disabled={disabled || isLoading}
                  className={`p-3 border rounded-lg text-left transition-colors ${
                    selectedMethod === method.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center space-x-2">
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{method.name}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Payment Button */}
        <Button
          onClick={handlePayment}
          disabled={disabled || isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 mr-2" />
              Pay {formatCurrency(amount, currency)}
            </>
          )}
        </Button>

        {/* Security Notice */}
        <div className="text-xs text-gray-500 text-center">
          <p>🔒 Your payment is secured by Razorpay</p>
          <p>We do not store your payment details</p>
        </div>

        {/* Supported Payment Methods */}
        <div className="text-xs text-gray-500 text-center">
          <p className="font-medium mb-1">Supported Payment Methods:</p>
          <div className="flex flex-wrap justify-center gap-1">
            {razorpayService.getSupportedMethods().map((method) => (
              <span
                key={method}
                className="px-2 py-1 bg-gray-100 rounded text-xs"
              >
                {method.toUpperCase()}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RazorpayPaymentForm;
