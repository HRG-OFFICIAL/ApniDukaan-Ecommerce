'use client';

import { useState } from 'react';
import { 
  Mail, 
  Package, 
  Search, 
  Heart,
  ArrowRight,
  CheckCircle
} from 'lucide-react';
import MainLayout from '../../../components/layout/MainLayout';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import OrderTracking, { OrderTrackingData, TrackingUpdate } from '../../../components/orders/OrderTracking';
import SmartSearch from '../../../components/search/SmartSearch';
import WishlistButton from '../../../components/wishlist/WishlistButton';
import WishlistInsights from '../../../components/wishlist/WishlistInsights';
import { emailService } from '../../../services/emailService';
import toast from 'react-hot-toast';

// Mock data for demonstrations
const mockTrackingData: OrderTrackingData = {
  orderNumber: 'APD-2024-001234',
  status: 'shipped',
  trackingNumber: 'TRK123456789',
  carrier: 'FedEx',
  estimatedDelivery: '2024-01-20T16:00:00Z',
  shippingAddress: {
    name: 'John Doe',
    street: '123 Main Street',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'United States'
  },
  carrierInfo: {
    name: 'FedEx',
    phone: '1-800-463-3339',
    website: 'https://fedex.com',
    trackingUrl: 'https://fedex.com/track?trackingnumber={trackingNumber}'
  },
  updates: [
    {
      id: '1',
      timestamp: '2024-01-18T14:30:00Z',
      status: 'Out for Delivery',
      location: 'New York, NY',
      description: 'Package is out for delivery and will arrive by end of day',
      isEstimate: false
    },
    {
      id: '2',
      timestamp: '2024-01-18T08:45:00Z',
      status: 'In Transit',
      location: 'Newark, NJ',
      description: 'Package arrived at Newark facility',
      isEstimate: false
    },
    {
      id: '3',
      timestamp: '2024-01-17T16:20:00Z',
      status: 'In Transit',
      location: 'Philadelphia, PA',
      description: 'Package departed Philadelphia facility',
      isEstimate: false
    },
    {
      id: '4',
      timestamp: '2024-01-17T10:15:00Z',
      status: 'Shipped',
      location: 'Warehouse, CA',
      description: 'Package has been shipped',
      isEstimate: false
    },
    {
      id: '5',
      timestamp: '2024-01-16T14:30:00Z',
      status: 'Processing',
      location: 'Warehouse, CA',
      description: 'Order is being prepared for shipment',
      isEstimate: false
    }
  ],
  lastUpdated: '2024-01-18T14:30:00Z'
};

export default function AdvancedFeaturesDemo() {
  const [activeDemo, setActiveDemo] = useState<'email' | 'tracking' | 'search' | 'wishlist'>('email');
  const [isEmailSending, setIsEmailSending] = useState(false);

  const handleSendTestEmail = async (type: 'order_confirmation' | 'order_shipped' | 'welcome') => {
    setIsEmailSending(true);
    try {
      const mockData = {
        orderNumber: 'APD-2024-001234',
        customerName: 'John Doe',
        items: [
          { name: 'Premium Wireless Headphones', quantity: 1, price: 299.99 },
          { name: 'Smart Fitness Watch', quantity: 1, price: 199.99 }
        ],
        total: 499.98,
        shippingAddress: {
          street: '123 Main Street',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'United States'
        },
        trackingNumber: 'TRK123456789',
        carrier: 'FedEx',
        estimatedDelivery: 'January 20, 2024',
        resetLink: 'https://apnidukaan.com/reset-password?token=abc123'
      };

      const success = await emailService.sendNotification({
        to: 'demo@example.com',
        templateType: type,
        data: mockData
      });

      if (success) {
        toast.success(`${type.replace('_', ' ').toUpperCase()} email sent successfully!`);
      } else {
        toast.error('Failed to send email. Please try again.');
      }
    } catch (error) {
      console.error('Email demo error:', error);
      toast.error('Email demo failed. This is a demo environment.');
    } finally {
      setIsEmailSending(false);
    }
  };

  const demoSections = [
    {
      id: 'email' as const,
      title: 'Email Notifications',
      icon: Mail,
      description: 'Rich HTML email templates for all customer communications',
      color: 'bg-blue-50 text-blue-600 border-blue-200'
    },
    {
      id: 'tracking' as const,
      title: 'Order Tracking',
      icon: Package,
      description: 'Real-time order tracking with carrier integration',
      color: 'bg-green-50 text-green-600 border-green-200'
    },
    {
      id: 'search' as const,
      title: 'Smart Search',
      icon: Search,
      description: 'Advanced search with suggestions and filters',
      color: 'bg-purple-50 text-purple-600 border-purple-200'
    },
    {
      id: 'wishlist' as const,
      title: 'Enhanced Wishlist',
      icon: Heart,
      description: 'Smart wishlist with analytics and insights',
      color: 'bg-red-50 text-red-600 border-red-200'
    }
  ];

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Advanced Features Demo
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience the powerful advanced features that make ApniDukaan a complete e-commerce solution
          </p>
        </div>

        {/* Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {demoSections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveDemo(section.id)}
                className={`p-6 rounded-lg border-2 transition-all duration-200 text-left hover:shadow-md ${
                  activeDemo === section.id 
                    ? section.color 
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
              >
                <Icon className="h-8 w-8 mb-3" />
                <h3 className="text-lg font-semibold mb-2">{section.title}</h3>
                <p className="text-sm opacity-75">{section.description}</p>
              </button>
            );
          })}
        </div>

        {/* Demo Content */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Email Notifications Demo */}
          {activeDemo === 'email' && (
            <div className="p-8">
              <div className="flex items-center mb-6">
                <Mail className="h-6 w-6 text-blue-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">Email Notification System</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Features</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>Rich HTML email templates</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>Order confirmation emails</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>Shipping notification emails</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>Password reset emails</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>Welcome & promotional emails</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>Responsive design for all devices</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Try It Out</h3>
                  <div className="space-y-4">
                    <Button 
                      onClick={() => handleSendTestEmail('order_confirmation')}
                      disabled={isEmailSending}
                      className="w-full"
                    >
                      Send Order Confirmation Email
                    </Button>
                    <Button 
                      onClick={() => handleSendTestEmail('order_shipped')}
                      disabled={isEmailSending}
                      variant="outline"
                      className="w-full"
                    >
                      Send Shipping Notification
                    </Button>
                    <Button 
                      onClick={() => handleSendTestEmail('welcome')}
                      disabled={isEmailSending}
                      variant="outline"
                      className="w-full"
                    >
                      Send Welcome Email
                    </Button>
                  </div>

                  {isEmailSending && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                        <span className="text-sm text-blue-700">Sending email...</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Order Tracking Demo */}
          {activeDemo === 'tracking' && (
            <div className="p-8">
              <div className="flex items-center mb-6">
                <Package className="h-6 w-6 text-green-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">Order Tracking System</h2>
              </div>
              
              <OrderTracking 
                orderData={mockTrackingData}
                onRefresh={() => toast.success('Tracking data refreshed!')}
              />
            </div>
          )}

          {/* Smart Search Demo */}
          {activeDemo === 'search' && (
            <div className="p-8">
              <div className="flex items-center mb-6">
                <Search className="h-6 w-6 text-purple-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">Smart Search System</h2>
              </div>
              
              <div className="max-w-2xl mx-auto">
                <SmartSearch 
                  placeholder="Try typing 'headphones' or 'apple'..."
                  showFilters={true}
                  className="mb-8"
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Features</h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>Real-time search suggestions</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>Recent search history</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>Trending searches</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>Keyboard navigation</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>Category & brand suggestions</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Advanced Filters</h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>Price range filters</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>Rating filters</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>Brand & category filters</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>Availability filters</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>Multiple sorting options</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Wishlist Demo */}
          {activeDemo === 'wishlist' && (
            <div className="p-8">
              <div className="flex items-center mb-6">
                <Heart className="h-6 w-6 text-red-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">Enhanced Wishlist System</h2>
              </div>
              
              <div className="space-y-8">
                {/* Wishlist Button Demo */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Interactive Wishlist Buttons</h3>
                  <div className="flex items-center space-x-4">
                    <WishlistButton 
                      productId="demo-product-1"
                      variant="button"
                      showText={true}
                      size="lg"
                    />
                    <WishlistButton 
                      productId="demo-product-2"
                      variant="icon"
                      size="lg"
                    />
                    <span className="text-sm text-gray-600">
                      Try clicking the wishlist buttons to see the animations!
                    </span>
                  </div>
                </div>

                {/* Wishlist Insights */}
                <WishlistInsights />

                {/* Features List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Wishlist Features</h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>Animated heart interactions</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>Wishlist analytics & insights</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>Price tracking & alerts</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>Stock level monitoring</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>Category preferences analysis</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Smart Features</h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>Sale item notifications</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>Quick add to cart from wishlist</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>Bulk wishlist operations</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>Wishlist sharing capabilities</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>Personalized recommendations</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to Experience These Features?
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              All these advanced features are now integrated into your ApniDukaan e-commerce platform, 
              providing a premium shopping experience for your customers.
            </p>
            <div className="flex justify-center space-x-4">
              <Button size="lg">
                View Live Store
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg">
                Documentation
              </Button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
