'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
  PaymentElement
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { stripeService, PaymentIntentData } from '@/services/stripeService';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  Lock,
  AlertCircle,
  CheckCircle,
  Loader2,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface PaymentFormProps {
  amount: number;
  currency?: string;
  onSuccess: (paymentIntent: any) => void;
  onError: (error: string) => void;
  disabled?: boolean;
  orderId: string;
  showSavePaymentMethod?: boolean;
  customerId?: string;
}

interface SavedPaymentMethod {
  id: string;
  card: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  amount,
  currency = 'usd',
  onSuccess,
  onError,
  disabled = false,
  orderId,
  showSavePaymentMethod = false,
  customerId
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);
  const [savePaymentMethod, setSavePaymentMethod] = useState(false);
  const [savedPaymentMethods, setSavedPaymentMethods] = useState<SavedPaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('new');
  const [showCardDetails, setShowCardDetails] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [paymentType, setPaymentType] = useState<'card' | 'saved'>('card');
  const formRef = useRef<HTMLFormElement>(null);

  // Card element styling
  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#374151',
        '::placeholder': {
          color: '#9CA3AF',
        },
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
        lineHeight: '24px',
      },
      invalid: {
        color: '#EF4444',
        iconColor: '#EF4444',
      },
    },
    hidePostalCode: true,
  };

  // Initialize payment intent and load saved payment methods
  useEffect(() => {
    const initializePayment = async () => {
      try {
        const paymentData: PaymentIntentData = {
          orderId,
          amount: stripeService.formatAmountForStripe(amount, currency),
          currency,
          paymentMethod: 'card',
          customerId,
          description: `Order #${orderId}`,
          metadata: {
            orderId,
            source: 'web_checkout'
          }
        };

        const result = await stripeService.createPaymentIntent(paymentData);
        if (result) {
          setClientSecret(result.clientSecret);
        } else {
          setError('Failed to initialize payment. Please try again.');
        }

        // Load saved payment methods if customer ID is provided
        if (customerId) {
          const methods = await stripeService.getPaymentMethods(customerId);
          setSavedPaymentMethods(methods.paymentMethods || []);
        }
      } catch (err) {
        setError('Payment initialization failed. Please refresh and try again.');
      }
    };

    if (amount > 0) {
      initializePayment();
    }
  }, [amount, currency, orderId, customerId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe is not ready. Please try again.');
      return;
    }

    if (selectedPaymentMethod !== 'new' && savedPaymentMethods.length === 0) {
      setError('No saved payment methods available.');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      let result;

      if (selectedPaymentMethod === 'new') {
        // Use new payment method with Card Element
        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
          throw new Error('Card element not found');
        }

        if (savePaymentMethod && customerId) {
          // Create setup intent to save payment method
          const setupResult = await stripeService.createSetupIntent(customerId);
          if (!setupResult) {
            throw new Error('Failed to setup payment method saving');
          }
        }

        result = await stripeService.confirmPayment(elements);
      } else {
        // Use saved payment method
        result = await stripeService.confirmPaymentWithPaymentMethod(
          clientSecret,
          selectedPaymentMethod
        );
      }

      if (result.success && result.paymentIntent) {
        setSuccess(true);
        onSuccess(result.paymentIntent);
      } else if (result.requiresAction) {
        setError('Your payment requires additional authentication. Please complete the verification.');
      } else {
        setError(result.error || 'Payment failed. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during payment processing.');
    } finally {
      setProcessing(false);
    }
  };

  const handleCardChange = (event: any) => {
    setCardComplete(event.complete);
    if (event.error) {
      setError(event.error.message);
    } else {
      setError('');
    }
  };

  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  const getCardIcon = (brand: string) => {
    const icons: Record<string, string> = {
      visa: '💳',
      mastercard: '💳',
      american_express: '💳',
      discover: '💳',
    };
    return icons[brand] || '💳';
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center p-8"
      >
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Successful!</h3>
        <p className="text-gray-600">
          Your payment of {formatAmount(amount)} has been processed successfully.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Payment Details</h3>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Total</div>
            <div className="text-xl font-bold text-gray-900">{formatAmount(amount)}</div>
          </div>
        </div>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Payment Method Selection */}
        {savedPaymentMethods.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">Payment Method</h4>
            
            {/* Saved Payment Methods */}
            <div className="space-y-3">
              {savedPaymentMethods.map((method) => (
                <label
                  key={method.id}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedPaymentMethod === method.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.id}
                    checked={selectedPaymentMethod === method.id}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div className="ml-3 flex items-center space-x-2">
                    <span className="text-lg">{getCardIcon(method.card.brand)}</span>
                    <span className="text-sm text-gray-900">
                      •••• •••• •••• {method.card.last4}
                    </span>
                    <span className="text-xs text-gray-500">
                      {method.card.exp_month}/{method.card.exp_year}
                    </span>
                    <span className="text-xs text-gray-500 uppercase">
                      {method.card.brand}
                    </span>
                  </div>
                </label>
              ))}

              {/* New Payment Method Option */}
              <label
                className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedPaymentMethod === 'new'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="new"
                  checked={selectedPaymentMethod === 'new'}
                  onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <div className="ml-3 flex items-center space-x-2">
                  <CreditCard className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-900">Use a new payment method</span>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Card Details */}
        <AnimatePresence>
          {selectedPaymentMethod === 'new' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              <div>
                <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
                  <span>Card Information</span>
                  <button
                    type="button"
                    onClick={() => setShowCardDetails(!showCardDetails)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    {showCardDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <CreditCard className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="pl-11 pr-4 py-3 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                    <CardElement
                      options={cardElementOptions}
                      onChange={handleCardChange}
                    />
                  </div>
                </div>
              </div>

              {/* Save Payment Method */}
              {showSavePaymentMethod && customerId && (
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={savePaymentMethod}
                    onChange={(e) => setSavePaymentMethod(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700">
                    Save this payment method for future purchases
                  </span>
                </label>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Security Notice */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Lock className="w-4 h-4" />
            <span>Your payment information is encrypted and secure</span>
          </div>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-md"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!stripe || processing || disabled || (selectedPaymentMethod === 'new' && !cardComplete)}
          className={`w-full flex items-center justify-center px-6 py-3 rounded-md font-medium transition-all ${
            processing || disabled || (selectedPaymentMethod === 'new' && !cardComplete)
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
          }`}
        >
          {processing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing Payment...
            </>
          ) : (
            <>
              <Lock className="w-4 h-4 mr-2" />
              Pay {formatAmount(amount)}
            </>
          )}
        </button>

        {/* Test Card Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <p className="text-xs text-yellow-800 mb-2 font-medium">Test Mode:</p>
            <div className="text-xs text-yellow-700 space-y-1">
              <div>Success: 4242 4242 4242 4242</div>
              <div>Decline: 4000 0000 0000 0002</div>
              <div>Use any future date and any 3-digit CVC</div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

// Wrapper component with Stripe Elements provider
const StripePaymentForm: React.FC<PaymentFormProps> = (props) => {
  const [stripeLoaded, setStripeLoaded] = useState(false);

  useEffect(() => {
    stripePromise.then((stripe) => {
      setStripeLoaded(!!stripe);
    });
  }, []);

  if (!stripeLoaded) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
          <span className="text-gray-600">Loading payment form...</span>
        </div>
      </div>
    );
  }

  const options = {
    clientSecret: '', // Will be set by the PaymentForm component
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#2563eb',
        colorBackground: '#ffffff',
        colorText: '#374151',
        colorDanger: '#ef4444',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        spacingUnit: '4px',
        borderRadius: '6px',
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentForm {...props} />
    </Elements>
  );
};

export default StripePaymentForm;
