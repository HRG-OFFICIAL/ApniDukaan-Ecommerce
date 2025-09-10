'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Lock, 
  ArrowLeft, 
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useCartWithOperations } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import MainLayout from '../../components/layout/MainLayout';
import { PaymentMethod, Address } from '../../graphql/types';

interface CheckoutFormData {
  email: string;
  shippingAddress: Address;
  billingAddress: Address;
  paymentMethod: PaymentMethod;
  sameAsShipping: boolean;
  couponCode: string;
  notes: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, loading: cartLoading } = useCartWithOperations();
  const { user } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CheckoutFormData>({
    email: user?.email || '',
    shippingAddress: {
      id: '',
      type: 'shipping',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US',
      isDefault: false
    },
    billingAddress: {
      id: '',
      type: 'billing',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US',
      isDefault: false
    },
    paymentMethod: PaymentMethod.CREDIT_CARD,
    sameAsShipping: true,
    couponCode: '',
    notes: ''
  });

  useEffect(() => {
    if (!cartLoading && (!cart || cart.items.length === 0)) {
      router.push('/cart');
    }
  }, [cart, cartLoading, router]);

  const handleInputChange = (field: keyof CheckoutFormData, value: string | boolean | PaymentMethod) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddressChange = (type: 'shipping' | 'billing', field: keyof Address, value: string) => {
    setFormData(prev => ({
      ...prev,
      [type === 'shipping' ? 'shippingAddress' : 'billingAddress']: {
        ...prev[type === 'shipping' ? 'shippingAddress' : 'billingAddress'],
        [field]: value
      }
    }));
  };

  const handleSameAsShippingChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      sameAsShipping: checked,
      billingAddress: checked ? prev.shippingAddress : prev.billingAddress
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1: // Contact & Shipping
        return !!(formData.email && 
                 formData.shippingAddress.street && 
                 formData.shippingAddress.city && 
                 formData.shippingAddress.state && 
                 formData.shippingAddress.zipCode);
      case 2: // Payment
        return !!(formData.paymentMethod);
      default:
        return true;
    }
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
      setError(null);
    } else {
      setError('Please fill in all required fields');
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep(prev => prev - 1);
    setError(null);
  };

  const handlePlaceOrder = async () => {
    if (!validateStep(2)) {
      setError('Please complete all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Here you would integrate with your order creation API
      // For now, we'll simulate the process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Redirect to order confirmation
      router.push('/orders/confirmation');
    } catch {
      setError('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (cartLoading) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!cart || cart.items.length === 0) {
    return null; // Will redirect to cart
  }

  const steps = [
    { id: 1, name: 'Contact & Shipping', status: currentStep >= 1 ? 'current' : 'upcoming' },
    { id: 2, name: 'Payment', status: currentStep >= 2 ? 'current' : 'upcoming' },
    { id: 3, name: 'Review & Place Order', status: currentStep >= 3 ? 'current' : 'upcoming' }
  ];

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cart
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <nav aria-label="Progress">
            <ol className="flex items-center">
              {steps.map((step, stepIdx) => (
                <li key={step.name} className={`${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''} relative`}>
                  <div className="flex items-center">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      currentStep > step.id 
                        ? 'bg-blue-600 text-white' 
                        : currentStep === step.id 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      {currentStep > step.id ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <span className="text-sm font-medium">{step.id}</span>
                      )}
                    </div>
                    <span className={`ml-4 text-sm font-medium ${
                      currentStep >= step.id ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {step.name}
                    </span>
                  </div>
                  {stepIdx !== steps.length - 1 && (
                    <div className="absolute top-4 left-4 -ml-px mt-0.5 h-full w-0.5 bg-gray-300" />
                  )}
                </li>
              ))}
            </ol>
          </nav>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6">
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex">
                      <AlertCircle className="h-5 w-5 text-red-400" />
                      <div className="ml-3">
                        <p className="text-sm text-red-800">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 1: Contact & Shipping */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <h2 className="text-lg font-semibold text-gray-900">Contact & Shipping Information</h2>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Street Address *
                        </label>
                        <input
                          type="text"
                          value={formData.shippingAddress.street}
                          onChange={(e) => handleAddressChange('shipping', 'street', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          City *
                        </label>
                        <input
                          type="text"
                          value={formData.shippingAddress.city}
                          onChange={(e) => handleAddressChange('shipping', 'city', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          State *
                        </label>
                        <input
                          type="text"
                          value={formData.shippingAddress.state}
                          onChange={(e) => handleAddressChange('shipping', 'state', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ZIP Code *
                        </label>
                        <input
                          type="text"
                          value={formData.shippingAddress.zipCode}
                          onChange={(e) => handleAddressChange('shipping', 'zipCode', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Payment */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <h2 className="text-lg font-semibold text-gray-900">Payment Information</h2>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-4">
                        Payment Method *
                      </label>
                      <div className="space-y-3">
                        {Object.values(PaymentMethod).map((method) => (
                          <label key={method} className="flex items-center p-3 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50">
                            <input
                              type="radio"
                              name="paymentMethod"
                              value={method}
                              checked={formData.paymentMethod === method}
                              onChange={(e) => handleInputChange('paymentMethod', e.target.value as PaymentMethod)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-3 text-sm font-medium text-gray-700">
                              {method.replace('_', ' ')}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="sameAsShipping"
                        checked={formData.sameAsShipping}
                        onChange={(e) => handleSameAsShippingChange(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="sameAsShipping" className="ml-2 text-sm text-gray-700">
                        Billing address same as shipping address
                      </label>
                    </div>
                  </div>
                )}

                {/* Step 3: Review & Place Order */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <h2 className="text-lg font-semibold text-gray-900">Review Your Order</h2>
                    
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h3 className="font-medium text-gray-900 mb-2">Shipping Address</h3>
                      <p className="text-sm text-gray-600">
                        {formData.shippingAddress.street}<br />
                        {formData.shippingAddress.city}, {formData.shippingAddress.state} {formData.shippingAddress.zipCode}
                      </p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-md">
                      <h3 className="font-medium text-gray-900 mb-2">Payment Method</h3>
                      <p className="text-sm text-gray-600">
                        {formData.paymentMethod.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8">
                  <Button
                    variant="outline"
                    onClick={handlePreviousStep}
                    disabled={currentStep === 1}
                  >
                    Previous
                  </Button>
                  
                  {currentStep < 3 ? (
                    <Button onClick={handleNextStep}>
                      Next
                    </Button>
                  ) : (
                    <Button
                      onClick={handlePlaceOrder}
                      disabled={loading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Place Order'
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-8">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Order Summary
                </h2>
                
                <div className="space-y-4 mb-6">
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-12 h-12 bg-gray-200 rounded-md"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {item.product.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">${cart.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium">${cart.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium">
                      {cart.shipping > 0 ? `$${cart.shipping.toFixed(2)}` : 'Free'}
                    </span>
                  </div>
                  <div className="border-t border-gray-200 pt-2">
                    <div className="flex justify-between text-base font-semibold">
                      <span>Total</span>
                      <span>${cart.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center text-sm text-gray-600">
                  <Lock className="h-4 w-4 mr-2" />
                  <span>Secure checkout</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
