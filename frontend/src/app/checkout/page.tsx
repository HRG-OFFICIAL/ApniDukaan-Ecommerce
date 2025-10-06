'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Lock, 
  ArrowLeft, 
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Button } from '../../components/ui/Button';
import MainLayout from '../../components/layout/MainLayout';
// Payment and Address types
export type PaymentMethod = 'card' | 'upi' | 'netbanking' | 'wallet';

export interface Address {
  id: string;
  type: 'home' | 'work' | 'other' | 'shipping' | 'billing';
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}
import { CouponManager, Coupon } from '../../components/checkout/SimpleCouponManager';
import { AddressManager, Address as AddressType } from '../../components/checkout/AddressManager';
import { FadeIn, SlideIn, AnimatedProgress } from '../../components/ui/Animations';
import { Badge } from '../../components/ui/Badge';
import RazorpayPaymentForm from '../../components/payment/RazorpayPaymentForm';

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

export default function CheckoutPage() {
  const router = useRouter();
  const { items: cartItems, itemCount, total, subtotal, tax, shipping, discount, calculateTotals } = useCartStore();
  const { user, guestUser, isAuthenticated, isGuest } = useAuthStore();
  
  console.log('✅ CHECKOUT PAGE LOADED SUCCESSFULLY!');
  console.log('Checkout page - Auth state:', { isAuthenticated, isGuest, user, guestUser });
  console.log('Checkout page - Cart state:', { cartItems, itemCount, total });
  console.log('Checkout page - Cart items structure:', cartItems.map(item => ({ id: item.id, name: item.name, price: item.price, quantity: item.quantity })));
  console.log('Checkout page - Current URL:', typeof window !== 'undefined' ? window.location.href : 'SSR');
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<AddressType[]>([
    {
      id: '1',
      type: 'home',
      name: 'Amit Kumar',
      street: '123 MG Road, Sector 15',
      city: 'New Delhi',
      state: 'Delhi',
      zipCode: '110001',
      country: 'India',
      isDefault: true
    }
  ]);

  const [formData, setFormData] = useState<CheckoutFormData>({
    email: (user?.email || guestUser?.email) || '',
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
    paymentMethod: 'card',
    sameAsShipping: true,
    couponCode: '',
    notes: '',
    selectedAddressId: '1',
    appliedCoupons: []
  });

  useEffect(() => {
    console.log('Checkout page - Cart check:', { cartItems, itemCount });
    if (cartItems.length === 0) {
      console.log('Checkout page - Redirecting to cart because cart is empty');
      router.push('/cart');
    } else {
      console.log('Checkout page - Cart is valid, staying on checkout page');
    }
  }, [cartItems, itemCount, router]);

  // Update email when user changes
  useEffect(() => {
    const currentEmail = user?.email || guestUser?.email;
    if (currentEmail && currentEmail !== formData.email) {
      setFormData(prev => ({ ...prev, email: currentEmail }));
    }
  }, [user, guestUser, formData.email]);

  // Auto-select default address on load
  useEffect(() => {
    console.log('Auto-select effect:', { 
      addressesLength: addresses.length, 
      selectedAddressId: formData.selectedAddressId,
      addresses: addresses.map(a => ({ id: a.id, name: a.name, isDefault: a.isDefault }))
    });
    
    if (addresses.length > 0 && !formData.selectedAddressId) {
      const defaultAddress = addresses.find(addr => addr.isDefault) || addresses[0];
      console.log('Auto-selecting address:', defaultAddress);
      if (defaultAddress) {
        handleSelectAddress(defaultAddress.id);
      }
    }
  }, [addresses, formData.selectedAddressId]);

  // Force select address on component mount
  useEffect(() => {
    if (addresses.length > 0 && addresses[0]) {
      console.log('Force selecting first address on mount:', addresses[0]);
      handleSelectAddress(addresses[0].id);
    }
  }, []); // Run only once on mount

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
        return true; // No validation needed for payment step
      default:
        return true;
    }
  };

  const handleNextStep = () => {
    console.log('Validation check:', {
      currentStep,
      email: formData.email,
      shippingAddress: formData.shippingAddress,
      paymentMethod: formData.paymentMethod,
      isValid: validateStep(currentStep)
    });
    
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
      setError(null);
    } else {
      // More specific error message
      if (currentStep === 1) {
        if (!formData.email) {
          setError('Please enter your email address');
        } else if (!formData.shippingAddress.street) {
          setError('Please select a delivery address');
        } else {
          setError('Please fill in all required fields');
        }
      } else {
        setError('Please fill in all required fields');
      }
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep(prev => prev - 1);
    setError(null);
  };

  // Address management handlers
  const handleSelectAddress = (addressId: string) => {
    console.log('🔄 handleSelectAddress called with:', addressId);
    console.log('🔄 Current selectedAddressId:', formData.selectedAddressId);
    console.log('🔄 Available addresses:', addresses.map(a => ({ id: a.id, name: a.name })));
    
    // Handle deselection (empty string)
    if (!addressId) {
      console.log('🔄 Deselecting address');
      setFormData(prev => ({
        ...prev,
        selectedAddressId: '',
        shippingAddress: {
          id: '',
          type: 'home',
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: '',
          isDefault: false
        }
      }));
      return;
    }
    
    const selectedAddress = addresses.find(addr => addr.id === addressId);
    console.log('🔄 Selected address found:', selectedAddress);
    
    if (selectedAddress) {
      const newShippingAddress = {
        id: selectedAddress.id,
        type: selectedAddress.type as 'home' | 'work' | 'other' | 'shipping' | 'billing',
        street: selectedAddress.street,
        city: selectedAddress.city,
        state: selectedAddress.state,
        zipCode: selectedAddress.zipCode,
        country: selectedAddress.country,
        isDefault: selectedAddress.isDefault
      };
      
      console.log('✅ Setting shipping address to:', newShippingAddress);
      
      setFormData(prev => {
        const newFormData = { 
          ...prev, 
          selectedAddressId: addressId,
          shippingAddress: newShippingAddress
        };
        console.log('✅ New form data:', newFormData);
        return newFormData;
      });
    } else {
      console.error('❌ Address not found for ID:', addressId);
    }
  };

  const handleAddAddress = (address: Omit<AddressType, 'id'>) => {
    const newAddress = { ...address, id: Date.now().toString() };
    setAddresses(prev => [...prev, newAddress]);
    setFormData(prev => ({ 
      ...prev, 
      selectedAddressId: newAddress.id,
      shippingAddress: {
        id: newAddress.id,
        type: newAddress.type as 'home' | 'work' | 'other' | 'shipping' | 'billing',
        street: newAddress.street,
        city: newAddress.city,
        state: newAddress.state,
        zipCode: newAddress.zipCode,
        country: newAddress.country,
        isDefault: newAddress.isDefault
      }
    }));
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
    
    if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
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

  const handlePaymentSuccess = (response: any) => {
    setPaymentCompleted(true);
    setOrderId(response.razorpay_order_id || `order_${Date.now()}`);
    setCurrentStep(4); // Move to success step
  };

  const handlePaymentError = (error: string) => {
    setError(error);
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

  if (false) { // Cart loading is handled by localStorage now
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

  if (cartItems.length === 0) {
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
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.href = '/cart';
              }
            }}
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
            <ol className="flex items-center justify-center space-x-8">
              {steps.map((step, stepIdx) => (
                <li key={step.name} className="flex items-center">
                  <div className="flex items-center">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                      currentStep > step.id 
                        ? 'bg-green-500 border-green-500 text-white' 
                        : currentStep === step.id 
                        ? 'bg-blue-600 border-blue-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-500'
                    }`}>
                      {currentStep > step.id ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <span className="text-sm font-semibold">{step.id}</span>
                      )}
                    </div>
                    <span className={`ml-3 text-sm font-semibold ${
                      currentStep >= step.id ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {step.name}
                    </span>
                  </div>
                  {stepIdx < steps.length - 1 && (
                    <div className="ml-8 w-16 h-0.5 bg-gray-200" />
                  )}
                </li>
              ))}
            </ol>
          </nav>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="p-8">
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
                    <h2 className="text-lg font-semibold text-gray-900">Payment Information</h2>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <div className="flex items-center">
                        <Lock className="h-6 w-6 text-blue-600 mr-3" />
                        <div>
                          <h3 className="text-lg font-semibold text-blue-900">Secure Payment</h3>
                          <p className="text-sm text-blue-700 mt-1">
                            Your payment will be processed securely. You can choose your preferred payment method at the final step.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Razorpay Payment Form */}
                    <RazorpayPaymentForm
                      amount={total}
                      currency="INR"
                      receipt={orderId || `receipt_${Date.now()}`}
                      customerName={user?.name || formData.email}
                      customerEmail={formData.email}
                      customerPhone={''}
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
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
                      <h3 className="font-medium text-gray-900 mb-2">Payment</h3>
                      <p className="text-sm text-gray-600">
                        Secure payment processing via Razorpay
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
                      className="!bg-black hover:!bg-gray-800 text-white border-0 font-semibold !py-0 px-6 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md disabled:!bg-gray-400 disabled:hover:!bg-gray-400"
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
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 sticky top-8">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Order Summary
                </h2>
                
                <div className="space-y-4 mb-6">
                  {cartItems.map((item: any) => (
                    <div key={item.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0 w-16 h-16 bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <img 
                          src={item.image || '/placeholder-product.jpg'} 
                          alt={item.name || 'Product'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder-product.jpg';
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 line-clamp-2">
                          {item.name || 'Unknown Product'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Qty: {item.quantity || 0}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        ${((item.price || 0) * (item.quantity || 0)).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm py-2">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium text-gray-900">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm py-2">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium text-gray-900">${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm py-2">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium text-green-600">
                      {shipping > 0 ? `$${shipping.toFixed(2)}` : 'Free'}
                    </span>
                  </div>
                  
                  {/* Coupon Section */}
                  <div className="border-t border-gray-200 pt-4">
                    <CouponManager
                      currentTotal={total}
                      appliedCoupons={formData.appliedCoupons}
                      onApplyCoupon={handleApplyCoupon}
                      onRemoveCoupon={handleRemoveCoupon}
                    />
                  </div>
                  
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between text-lg font-bold">
                      <span className="text-gray-900">Total</span>
                      <span className="text-gray-900">${total.toFixed(2)}</span>
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

        {/* Step 4: Payment Success */}
        {currentStep === 4 && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center">
              <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
              <p className="text-gray-600 mb-6">
                Thank you for your order. We've received your payment and will process your order shortly.
              </p>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600">Order ID</p>
                <p className="text-lg font-semibold text-gray-900">{orderId}</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => router.push('/orders')}
                  className="px-6 py-2"
                >
                  View Orders
                </Button>
                <Button
                  onClick={() => router.push('/')}
                  variant="outline"
                  className="px-6 py-2"
                >
                  Continue Shopping
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
