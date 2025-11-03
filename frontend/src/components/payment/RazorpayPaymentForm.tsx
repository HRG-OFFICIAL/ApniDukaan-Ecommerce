'use client'

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { 
  loadScript, 
  createRazorpayOrder, 
  verifyRazorpayPayment, 
  formatCurrency, 
  formatAmountForRazorpay,
  getSupportedPaymentMethods,
  RAZORPAY_CONFIG,
  type RazorpayOrderData,
  type RazorpayVerificationData
} from '../../utils/razorpay';

interface RazorpayPaymentFormProps {
  amount: number;
  currency?: string;
  receipt: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  onSuccess: (paymentId: string, orderId: string) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}


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
  const [isRazorpayLoaded, setIsRazorpayLoaded] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [customerDetails, setCustomerDetails] = useState({
    name: customerName || '',
    email: customerEmail || '',
    phone: customerPhone || ''
  });

  // Load Razorpay script on component mount
  useEffect(() => {
    const loadRazorpayScript = async () => {
      try {
        await loadScript('https://checkout.razorpay.com/v1/checkout.js');
        setIsRazorpayLoaded(true);
        console.log('Razorpay script loaded successfully');
      } catch (error) {
        console.error('Failed to load Razorpay script:', error);
        onError('Failed to load payment gateway. Please refresh the page.');
      }
    };

    loadRazorpayScript();
  }, [onError]);

  const handlePayment = async () => {
    if (disabled || isLoading || !isRazorpayLoaded) return;

    // Use props directly for validation and payment
    const finalName = customerName || customerDetails.name || 'Guest User';
    const finalEmail = customerEmail || customerDetails.email || 'guest@apnidukaan.com';
    const finalPhone = customerPhone || customerDetails.phone || '+919876543210';

    // Validate customer details
    if (!finalName.trim()) {
      onError('Customer name is required');
      return;
    }

    if (!finalEmail.trim()) {
      onError('Customer email is required');
      return;
    }

    if (!finalPhone.trim()) {
      onError('Customer phone is required');
      return;
    }

    setIsLoading(true);
    setPaymentStatus('processing');

    try {
      // Create Razorpay order
      const orderData: RazorpayOrderData = {
        amount,
        currency,
        receipt,
        customerName: finalName,
        customerEmail: finalEmail,
        customerPhone: finalPhone,
        description: `Payment for order ${receipt}`
      };

      const orderResponse = await createRazorpayOrder(orderData);
      
      console.log('Order response:', orderResponse);
      
      if (!orderResponse.success) {
        throw new Error(orderResponse.error || 'Failed to create order');
      }

      // Configure Razorpay options
      const options = {
        key: RAZORPAY_CONFIG.keyId,
        amount: formatAmountForRazorpay(amount),
        currency: currency,
        name: 'ApniDukaan',
        description: `Order #${receipt}`,
        order_id: orderResponse.data.orderId,
        prefill: {
          name: finalName,
          email: finalEmail,
          contact: finalPhone
        },
        theme: RAZORPAY_CONFIG.theme,
        // Real payment verification
        
        handler: async function (response: any) {
          console.log('Razorpay payment response:', response);
          try {
            // Verify payment on backend
            const verificationData: RazorpayVerificationData = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            };

            const verificationResponse = await verifyRazorpayPayment(verificationData);
            
            if (verificationResponse.success) {
              setPaymentStatus('success');
              onSuccess(response.razorpay_payment_id, response.razorpay_order_id);
            } else {
              setPaymentStatus('error');
              onError(verificationResponse.error || 'Payment verification failed');
            }
          } catch (error: any) {
            setPaymentStatus('error');
            onError(error.message || 'Payment verification failed');
          } finally {
            setIsLoading(false);
          }
        },
        modal: {
          ondismiss: function() {
            setIsLoading(false);
            setPaymentStatus('idle');
          }
        }
      };

      // Open Razorpay modal with real integration
      console.log('Opening Razorpay with options:', options);
      
      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();

    } catch (error: any) {
      console.error('Payment error:', error);
      setPaymentStatus('error');
      onError(error.message || 'Payment failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        {/* Payment Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Complete Payment</h3>
            <span className="text-sm text-gray-500">#{receipt}</span>
          </div>
          <p className="text-2xl font-bold text-gray-800 mt-2">{formatCurrency(amount, currency)}</p>
        </div>

        {/* Form */}
        <form className="px-6 py-4 space-y-4">
          {/* Customer Details */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <Input
                type="text"
                value={customerDetails.name}
                onChange={(e) => setCustomerDetails(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter your full name"
                disabled={disabled || isLoading}
                required
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <Input
                type="email"
                value={customerDetails.email}
                onChange={(e) => setCustomerDetails(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter your email"
                disabled={disabled || isLoading}
                required
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number *
              </label>
              <Input
                type="tel"
                value={customerDetails.phone}
                onChange={(e) => setCustomerDetails(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter your phone number"
                disabled={disabled || isLoading}
                required
                className="w-full"
              />
            </div>
          </div>

          {/* Payment Button */}
          <div className="pt-2">
            <Button
              type="button"
              onClick={handlePayment}
              disabled={disabled || isLoading || !isRazorpayLoaded || !customerDetails.name || !customerDetails.email || !customerDetails.phone}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-md font-medium"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Pay {formatCurrency(amount, currency)}
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          {/* Security Notice */}
          <div className="text-center mb-3">
            <p className="text-xs text-gray-500 flex items-center justify-center">
              🔒 Your payment is secured by Razorpay
            </p>
            <p className="text-xs text-gray-400 mt-1">
              We do not store your payment details
            </p>
          </div>

          {/* Payment Status */}
          {paymentStatus === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-3">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <div className="ml-2">
                  <p className="text-sm text-green-800">Payment completed successfully!</p>
                </div>
              </div>
            </div>
          )}

          {paymentStatus === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-3">
              <div className="flex items-center">
                <XCircle className="h-4 w-4 text-red-400" />
                <div className="ml-2">
                  <p className="text-sm text-red-800">Payment failed. Please try again.</p>
                </div>
              </div>
            </div>
          )}

          {/* Supported Payment Methods */}
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-2">Supported Payment Methods:</p>
            <div className="flex flex-wrap justify-center gap-1">
              {getSupportedPaymentMethods().map((method) => (
                <span
                  key={method}
                  className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                >
                  {method}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RazorpayPaymentForm;
