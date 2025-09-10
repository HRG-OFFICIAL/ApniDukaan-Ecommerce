'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Minus, 
  Plus, 
  Trash2, 
  ShoppingBag, 
  ArrowRight,
  CreditCard,
  Truck,
  Shield
} from 'lucide-react';
import { useCartWithOperations } from '../../hooks/useCart';
import { Button } from '../../components/ui/Button';
import MainLayout from '../../components/layout/MainLayout';

export default function CartPage() {
  const { cart, loading, updateCartItem, removeFromCart, clearCart } = useCartWithOperations();
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setUpdatingItems(prev => new Set(prev).add(itemId));
    try {
      await updateCartItem(itemId, newQuantity);
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    setUpdatingItems(prev => new Set(prev).add(itemId));
    try {
      await removeFromCart(itemId);
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const handleClearCart = async () => {
    if (confirm('Are you sure you want to clear your cart?')) {
      await clearCart();
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <ShoppingBag className="mx-auto h-24 w-24 text-gray-400 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
            <p className="text-gray-600 mb-8">Looks like you haven&apos;t added any items to your cart yet.</p>
            <Link href="/products">
              <Button className="inline-flex items-center">
                Start Shopping
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <Button 
            variant="outline" 
            onClick={handleClearCart}
            className="text-red-600 hover:text-red-700"
          >
            Clear Cart
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Cart Items ({cart.itemCount})
                </h2>
                
                <div className="space-y-4">
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                      <div className="flex-shrink-0">
                        <Image
                          src={item.product.images[0] || '/placeholder-product.jpg'}
                          alt={item.product.name}
                          width={80}
                          height={80}
                          className="rounded-lg object-cover"
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {item.product.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          ${item.price.toFixed(2)} each
                        </p>
                        <p className="text-sm text-gray-500">
                          Stock: {item.product.stock} available
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          disabled={updatingItems.has(item.id) || item.quantity <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        
                        <span className="w-12 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          disabled={updatingItems.has(item.id) || item.quantity >= item.product.stock}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={updatingItems.has(item.id)}
                          className="text-red-600 hover:text-red-700 mt-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
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
                
                <div className="space-y-3 mb-6">
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
                  
                  {cart.discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount</span>
                      <span className="font-medium">-${cart.discount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between text-base font-semibold">
                      <span>Total</span>
                      <span>${cart.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <Link href="/checkout" className="block">
                  <Button className="w-full mb-4">
                    Proceed to Checkout
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>

                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Shield className="h-4 w-4 mr-2" />
                    <span>Secure checkout</span>
                  </div>
                  <div className="flex items-center">
                    <Truck className="h-4 w-4 mr-2" />
                    <span>Free shipping on orders over $50</span>
                  </div>
                  <div className="flex items-center">
                    <CreditCard className="h-4 w-4 mr-2" />
                    <span>Multiple payment options</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
