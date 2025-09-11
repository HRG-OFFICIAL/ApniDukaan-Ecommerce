'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Lock, 
  ArrowLeft, 
  CheckCircle,
  AlertCircle,
  Loader2,
  Shield,
  CreditCard
} from 'lucide-react';
import { useCartWithOperations } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import MainLayout from '../../components/layout/MainLayout';
import { PaymentMethod, Address } from '../../graphql/types';
import { CouponManager, Coupon } from '../../components/checkout/SimpleCouponManager';
import { AddressManager, Address as AddressType } from '../../components/checkout/AddressManager';
import StripePaymentForm from '@/components/payment/StripePaymentForm';

interface CheckoutFormData {
  email: string;
  shippingAddress: Address;
  billingAddress: Address;
  paymentMethod: PaymentMethod;
  sameAsShipping: boolean;
  couponCode: string;
  notes: string;
  selectedAddressId?: string;
  appliedCoupons: Coupon[];
}

export default function StripeCheckoutPage() {
  const router = useRouter();
  const { cart, loading: cartLoading } = useCartWithOperations();
  const { user } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [orderId, setOrderId] = useState<string>('');
  
  const [addresses, setAddresses] = useState<AddressType[]>([
    {
      id: '1',
      type: 'home',
      name: 'John Doe',
      street: '123 Main Street, Apt 4B',
      city: 'New Delhi',
      state: 'Delhi',
      zipCode: '110001',
      country: 'India',
      isDefault: true
    }
  ]);

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
    notes: '',
    selectedAddressId: '1',
    appliedCoupons: []
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
        return paymentCompleted;
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

  // Payment handlers
  const handlePaymentSuccess = (paymentIntent: any) => {
    console.log('Payment successful:', paymentIntent);
    setPaymentCompleted(true);
    setOrderId(paymentIntent.id || `order_${Date.now()}`);
    
    // Move to review step after successful payment
    setCurrentStep(3);
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment failed:', error);
    setError(`Payment failed: ${error}`);
  };

  // Address management handlers
  const handleSelectAddress = (addressId: string) => {
    setFormData(prev => ({ ...prev, selectedAddressId: addressId }));
  };

  const handleAddAddress = (address: Omit<AddressType, 'id'>) => {
    const newAddress = { ...address, id: Date.now().toString() };
    setAddresses(prev => [...prev, newAddress]);
    setFormData(prev => ({ ...prev, selectedAddressId: newAddress.id }));
  };

  const handleEditAddress = (addressId: string, address: Omit<AddressType, 'id'>) => {
    setAddresses(prev => prev.map(addr => 
      addr.id === addressId ? { ...address, id: addressId } : addr
    ));
  };

  const handleDeleteAddress = (addressId: string) => {
    setAddresses(prev => prev.filter(addr => addr.id !== addressId));
    if (formData.selectedAddressId === addressId) {
      setFormData(prev => ({ ...prev, selectedAddressId: undefined }));
    }
  };

  // Coupon management handlers
  const handleApplyCoupon = async (couponCode: string): Promise<{ success: boolean; coupon?: Coupon; error?: string }> => {
    // Simulate coupon validation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockCoupons: Coupon[] = [
      {
        id: '1',
        code: 'WELCOME10',
        type: 'percentage',
        value: 10,
        description: 'Welcome discount - 10% off your first order',
        minOrderAmount: 0,
        expiresAt: '2024-12-31T23:59:59Z',
        usageLimit: 1,
        usedCount: 0,
        isActive: true
      },
      {
        id: '2',
        code: 'SAVE50',
        type: 'fixed_amount',
        value: 50,
        description: 'Fixed ₹50 off on orders over ₹500',
        minOrderAmount: 500,
        expiresAt: '2024-06-30T23:59:59Z',
        usageLimit: undefined,
        usedCount: 234,
        isActive: true
      }
    ];
    
    const coupon = mockCoupons.find(c => c.code === couponCode);
    
    if (!coupon) {
      return { success: false, error: 'Invalid coupon code' };
    }
    
    if (coupon.minOrderAmount && cart && cart.subtotal < coupon.minOrderAmount) {
      return { success: false, error: `Minimum order amount is ₹${coupon.minOrderAmount}` };
    }
    
    const isAlreadyApplied = formData.appliedCoupons.find(c => c.id === coupon.id);
    if (isAlreadyApplied) {
      return { success: false, error: 'Coupon already applied' };
    }
    
    setFormData(prev => ({ 
      ...prev, 
      appliedCoupons: [...prev.appliedCoupons, coupon] 
    }));
    
    return { success: true, coupon };
  };

  const handleRemoveCoupon = (couponId: string) => {
    setFormData(prev => ({
      ...prev,
      appliedCoupons: prev.appliedCoupons.filter(c => c.id !== couponId)
    }));
  };

  const handlePlaceOrder = async () => {
    if (!paymentCompleted) {
      setError('Please complete payment first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const orderData = {
        formData,
        cart,
        orderId,
        paymentStatus: 'paid'
      };
      
      console.log('Placing order:', orderData);
      
      // Here you would integrate with your order creation API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Redirect to order confirmation
      router.push(`/orders/${orderId}/confirmation`);
    } catch {
      setError('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals with applied coupons
  const calculateDiscount = () => {
    return formData.appliedCoupons.reduce((total, coupon) => {
      if (coupon.type === 'percentage') {
        return total + (cart?.subtotal || 0) * (coupon.value / 100);
      } else {
        return total + coupon.value;
      }
    }, 0);
  };

  const discount = calculateDiscount();
  const finalTotal = Math.max(0, (cart?.total || 0) - discount);

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
    { id: 3, name: 'Review & Confirm', status: currentStep >= 3 ? 'current' : 'upcoming' }
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
          <h1 className="text-3xl font-bold text-gray-900">Secure Checkout</h1>
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
                        ? 'bg-green-600 text-white' 
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

                    {/* Address selection & management */}
                    <div className="space-y-4">
                      <AddressManager
                        addresses={addresses}
                        selectedAddressId={formData.selectedAddressId}
                        onSelectAddress={handleSelectAddress}
                        onAddAddress={handleAddAddress}
                        onEditAddress={handleEditAddress}
                        onDeleteAddress={handleDeleteAddress}
                      />
                    </div>
                  </div>
                )}

                {/* Step 2: Payment */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-5 h-5 text-blue-600" />
                      <h2 className="text-lg font-semibold text-gray-900">Secure Payment</h2>
                    </div>
                    
                    {/* Coupon manager */}
                    <CouponManager
                      currentTotal={cart?.total || 0}
                      appliedCoupons={formData.appliedCoupons}
                      onApplyCoupon={handleApplyCoupon}
                      onRemoveCoupon={handleRemoveCoupon}
                    />

                    {/* Stripe Payment Form */}
                    <StripePaymentForm
                      amount={finalTotal}
                      currency="usd"
                      orderId={orderId || `temp_${Date.now()}`}
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                      showSavePaymentMethod={true}
                      customerId={user?.id || formData.email}
                      disabled={loading}
                    />

                    {paymentCompleted && (
                      <div className="bg-green-50 border border-green-200 rounded-md p-4">
                        <div className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-400" />
                          <div className="ml-3">
                            <p className="text-sm text-green-800">Payment completed successfully!</p>
                            <p className="text-xs text-green-600 mt-1">Order ID: {orderId}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Review & Confirm */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <h2 className="text-lg font-semibold text-gray-900">Review Your Order</h2>
                    
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h3 className="font-medium text-gray-900 mb-2">Contact Information</h3>
                      <p className="text-sm text-gray-600">{formData.email}</p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-md">
                      <h3 className="font-medium text-gray-900 mb-2">Shipping Address</h3>
                      {formData.selectedAddressId && (
                        <div className="text-sm text-gray-600">
                          {(() => {
                            const selectedAddress = addresses.find(addr => addr.id === formData.selectedAddressId);
                            return selectedAddress ? (
                              <div>
                                <p>{selectedAddress.name}</p>
                                <p>{selectedAddress.street}</p>
                                <p>{selectedAddress.city}, {selectedAddress.state} {selectedAddress.zipCode}</p>
                                <p>{selectedAddress.country}</p>
                              </div>
                            ) : null;
                          })()}
                        </div>
                      )}
                    </div>

                    <div className="bg-green-50 p-4 rounded-md">
                      <h3 className="font-medium text-gray-900 mb-2">Payment Status</h3>
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                        <span className="text-sm text-green-800">Payment Confirmed</span>
                      </div>
                      <p className="text-xs text-green-600 mt-1">Transaction ID: {orderId}</p>
                    </div>

                    {formData.appliedCoupons.length > 0 && (
                      <div className="bg-blue-50 p-4 rounded-md">
                        <h3 className="font-medium text-gray-900 mb-2">Applied Discounts</h3>
                        {formData.appliedCoupons.map((coupon) => (
                          <div key={coupon.id} className="text-sm text-blue-800">
                            {coupon.code} - {coupon.type === 'percentage' ? `${coupon.value}%` : `$${coupon.value}`} off
                          </div>
                        ))}
                      </div>
                    )}
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
                  
                  {currentStep === 1 ? (
                    <Button onClick={handleNextStep}>
                      Continue to Payment
                    </Button>
                  ) : currentStep === 2 ? (
                    paymentCompleted ? (
                      <Button onClick={handleNextStep}>
                        Review Order
                      </Button>
                    ) : (
                      <div className="text-center text-sm text-gray-600">
                        Complete payment above to continue
                      </div>
                    )
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
                        'Confirm Order'
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
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount</span>
                      <span>-${discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-2">
                    <div className="flex justify-between text-base font-semibold">
                      <span>Total</span>
                      <span>${finalTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center text-sm text-gray-600">
                  <Lock className="h-4 w-4 mr-2" />
                  <span>Secure checkout with Stripe</span>
                </div>

                {paymentCompleted && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-center text-sm text-green-800">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      <span>Payment Confirmed</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
