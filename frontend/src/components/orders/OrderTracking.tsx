'use client';

import { useState, useEffect } from 'react';
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Calendar,
  ExternalLink,
  Copy,
  Phone,
  Mail,
  RefreshCw
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import toast from 'react-hot-toast';

export interface TrackingUpdate {
  id: string;
  timestamp: string;
  status: string;
  location?: string;
  description: string;
  isEstimate?: boolean;
}

export interface OrderTrackingData {
  orderNumber: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  carrierInfo?: {
    name: string;
    phone?: string;
    website?: string;
    trackingUrl?: string;
  };
  updates: TrackingUpdate[];
  lastUpdated: string;
}

interface OrderTrackingProps {
  orderData: OrderTrackingData;
  onRefresh?: () => void;
  isLoading?: boolean;
}

const statusIcons = {
  pending: Clock,
  confirmed: CheckCircle,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: ExternalLink
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-orange-100 text-orange-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

export default function OrderTracking({ orderData, onRefresh, isLoading = false }: OrderTrackingProps) {
  const [showAllUpdates, setShowAllUpdates] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  const StatusIcon = statusIcons[orderData.status];
  
  // Auto refresh every 5 minutes if order is in transit
  useEffect(() => {
    if (!autoRefreshEnabled || !onRefresh) return;
    
    const shouldAutoRefresh = ['confirmed', 'processing', 'shipped'].includes(orderData.status);
    if (!shouldAutoRefresh) return;

    const interval = setInterval(() => {
      onRefresh();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [autoRefreshEnabled, onRefresh, orderData.status]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${label} copied to clipboard`);
    });
  };

  const openCarrierTracking = () => {
    if (orderData.carrierInfo?.trackingUrl && orderData.trackingNumber) {
      const url = orderData.carrierInfo.trackingUrl.replace('{trackingNumber}', orderData.trackingNumber);
      window.open(url, '_blank');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getProgressPercentage = () => {
    const statusOrder = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
    const currentIndex = statusOrder.indexOf(orderData.status);
    return ((currentIndex + 1) / statusOrder.length) * 100;
  };

  const visibleUpdates = showAllUpdates ? orderData.updates : orderData.updates.slice(0, 3);

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <StatusIcon className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">Order #{orderData.orderNumber}</h1>
              <p className="text-blue-100">Track your package in real-time</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge className={`px-3 py-1 text-sm font-medium ${statusColors[orderData.status]} border-0`}>
              {orderData.status.charAt(0).toUpperCase() + orderData.status.slice(1)}
            </Badge>
            
            {onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                disabled={isLoading}
                className="text-white hover:bg-white/20"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
        </div>
        
        {/* Progress Bar */}
        {orderData.status !== 'cancelled' && (
          <div className="mt-4">
            <div className="bg-white/20 rounded-full h-2">
              <div 
                className="bg-white rounded-full h-2 transition-all duration-300 ease-out"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="p-6">
        {/* Tracking Information */}
        {orderData.trackingNumber && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Tracking Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Tracking Number:</span>
                    <span className="font-mono text-sm font-medium">{orderData.trackingNumber}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(orderData.trackingNumber!, 'Tracking number')}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  {orderData.carrier && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Carrier:</span>
                      <span className="text-sm font-medium">{orderData.carrier}</span>
                    </div>
                  )}
                  
                  {orderData.estimatedDelivery && (
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Estimated Delivery:</span>
                      <span className="text-sm font-medium text-green-600">
                        {formatDate(orderData.estimatedDelivery)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {orderData.carrierInfo?.trackingUrl && (
                <Button onClick={openCarrierTracking} className="ml-4">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Track on {orderData.carrier}
                </Button>
              )}
            </div>

            {/* Carrier Contact Info */}
            {orderData.carrierInfo && (orderData.carrierInfo.phone || orderData.carrierInfo.website) && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Carrier Contact</h4>
                <div className="flex items-center space-x-4">
                  {orderData.carrierInfo.phone && (
                    <a
                      href={`tel:${orderData.carrierInfo.phone}`}
                      className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                    >
                      <Phone className="h-4 w-4 mr-1" />
                      {orderData.carrierInfo.phone}
                    </a>
                  )}
                  
                  {orderData.carrierInfo.website && (
                    <a
                      href={orderData.carrierInfo.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Website
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Shipping Address */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            Shipping Address
          </h3>
          <address className="text-sm text-gray-600 not-italic">
            <div className="font-medium">{orderData.shippingAddress.name}</div>
            <div>{orderData.shippingAddress.street}</div>
            <div>
              {orderData.shippingAddress.city}, {orderData.shippingAddress.state} {orderData.shippingAddress.zipCode}
            </div>
            <div>{orderData.shippingAddress.country}</div>
          </address>
        </div>

        {/* Tracking Updates */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Tracking Updates</h3>
            <div className="flex items-center space-x-2">
              <label className="flex items-center text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={autoRefreshEnabled}
                  onChange={(e) => setAutoRefreshEnabled(e.target.checked)}
                  className="mr-2"
                />
                Auto-refresh
              </label>
            </div>
          </div>

          <div className="space-y-4">
            {visibleUpdates.map((update, index) => (
              <div
                key={update.id}
                className={`relative flex space-x-3 ${
                  index === 0 ? 'pb-4' : 'pb-4'
                }`}
              >
                {/* Timeline line */}
                {index < visibleUpdates.length - 1 && (
                  <div
                    className="absolute left-4 top-6 w-0.5 bg-gray-300"
                    style={{ height: 'calc(100% - 0.5rem)' }}
                  />
                )}

                {/* Status indicator */}
                <div className={`
                  flex h-8 w-8 items-center justify-center rounded-full border-2 
                  ${index === 0 
                    ? 'border-blue-500 bg-blue-500 text-white' 
                    : 'border-gray-300 bg-white text-gray-400'
                  }
                `}>
                  {index === 0 ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <div className="h-2 w-2 rounded-full bg-gray-300" />
                  )}
                </div>

                {/* Update content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium ${
                        index === 0 ? 'text-gray-900' : 'text-gray-700'
                      }`}>
                        {update.status}
                      </p>
                      <p className="text-sm text-gray-500">{update.description}</p>
                      {update.location && (
                        <p className="text-xs text-gray-400 flex items-center mt-1">
                          <MapPin className="h-3 w-3 mr-1" />
                          {update.location}
                        </p>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{formatDate(update.timestamp)}</p>
                      {update.isEstimate && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          Estimated
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {orderData.updates.length > 3 && (
            <Button
              variant="ghost"
              onClick={() => setShowAllUpdates(!showAllUpdates)}
              className="w-full mt-4"
            >
              {showAllUpdates 
                ? `Show Less` 
                : `Show ${orderData.updates.length - 3} More Updates`
              }
            </Button>
          )}
        </div>

        {/* Footer Info */}
        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
          <p className="flex items-center justify-between">
            <span>Last updated: {formatDate(orderData.lastUpdated)}</span>
            <span>Updates may take up to 24 hours to reflect</span>
          </p>
        </div>
      </div>
    </div>
  );
}
