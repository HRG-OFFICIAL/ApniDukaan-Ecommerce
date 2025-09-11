'use client';

import { useState } from 'react';
import { 
  X, 
  Edit, 
  Package, 
  Truck, 
  CheckCircle, 
  XCircle,
  User,
  MapPin,
  CreditCard,
  Calendar,
  Phone,
  Mail
} from 'lucide-react';
import { Button } from '../ui/Button';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  customer: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  items: Array<{
    id: string;
    product: {
      id: string;
      name: string;
      images: string[];
    };
    quantity: number;
    price: number;
  }>;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  payment: {
    method: string;
    status: string;
    transactionId?: string;
  };
  tracking?: {
    status: string;
    carrier: string;
    trackingNumber: string;
    estimatedDelivery: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface OrderDetailsProps {
  order: Order;
  onStatusUpdate: (orderId: string, newStatus: string) => void;
  onClose: () => void;
}

export function OrderDetails({ order, onStatusUpdate, onClose }: OrderDetailsProps) {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'PENDING': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      'CONFIRMED': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Confirmed' },
      'PROCESSING': { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Processing' },
      'SHIPPED': { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'Shipped' },
      'DELIVERED': { bg: 'bg-green-100', text: 'text-green-800', label: 'Delivered' },
      'CANCELLED': { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled' },
      'REFUNDED': { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Refunded' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['PENDING'];

    return (
      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'SHIPPED':
        return <Truck className="h-5 w-5 text-indigo-600" />;
      case 'PROCESSING':
        return <Package className="h-5 w-5 text-purple-600" />;
      case 'CANCELLED':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Package className="h-5 w-5 text-gray-600" />;
    }
  };

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'PENDING':
        return 'CONFIRMED';
      case 'CONFIRMED':
        return 'PROCESSING';
      case 'PROCESSING':
        return 'SHIPPED';
      case 'SHIPPED':
        return 'DELIVERED';
      default:
        return 'PROCESSING';
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      await onStatusUpdate(order.id, newStatus);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h3 className="text-lg font-semibold text-gray-900">Order Details</h3>
              {getStatusBadge(order.status)}
            </div>
            <div className="flex items-center space-x-2">
              {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                <Button
                  onClick={() => handleStatusUpdate(getNextStatus(order.status))}
                  disabled={isUpdatingStatus}
                >
                  {isUpdatingStatus ? 'Updating...' : `Mark as ${getNextStatus(order.status)}`}
                </Button>
              )}
              <Button variant="ghost" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Order Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Summary */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-4">Order Summary</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(order.status)}
                      <span className="text-sm font-medium text-gray-900">
                        Order #{order.orderNumber}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="text-gray-900">{formatCurrency(order.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax:</span>
                      <span className="text-gray-900">{formatCurrency(order.tax)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping:</span>
                      <span className="text-gray-900">{formatCurrency(order.shipping)}</span>
                    </div>
                    {order.discount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Discount:</span>
                        <span className="text-green-600">-{formatCurrency(order.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="font-medium text-gray-900">Total:</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(order.total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-4">Order Items</h4>
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                      <div className="flex-shrink-0">
                        {item.product.images && item.product.images.length > 0 ? (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="h-16 w-16 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="h-16 w-16 bg-gray-200 rounded-lg flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="text-sm font-medium text-gray-900 truncate">
                          {item.product.name}
                        </h5>
                        <p className="text-sm text-gray-500">
                          Quantity: {item.quantity}
                        </p>
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-4">Shipping Address</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div className="text-sm text-gray-900">
                      <p>{order.shippingAddress.street}</p>
                      <p>
                        {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                      </p>
                      <p>{order.shippingAddress.country}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Billing Address */}
              {order.billingAddress && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-4">Billing Address</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div className="text-sm text-gray-900">
                        <p>{order.billingAddress.street}</p>
                        <p>
                          {order.billingAddress.city}, {order.billingAddress.state} {order.billingAddress.zipCode}
                        </p>
                        <p>{order.billingAddress.country}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Customer Information & Actions */}
            <div className="space-y-6">
              {/* Customer Info */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-4">Customer Information</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{order.customer.name}</p>
                      <p className="text-xs text-gray-500">Customer</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-900">{order.customer.email}</p>
                      <p className="text-xs text-gray-500">Email</p>
                    </div>
                  </div>

                  {order.customer.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-900">{order.customer.phone}</p>
                        <p className="text-xs text-gray-500">Phone</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Information */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-4">Payment Information</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <CreditCard className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">
                      {order.payment.method}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Status: <span className="font-medium">{order.payment.status}</span>
                  </div>
                  {order.payment.transactionId && (
                    <div className="text-xs text-gray-500 mt-1">
                      Transaction ID: {order.payment.transactionId}
                    </div>
                  )}
                </div>
              </div>

              {/* Tracking Information */}
              {order.tracking && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-4">Tracking Information</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Truck className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {order.tracking.carrier}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Tracking: <span className="font-mono">{order.tracking.trackingNumber}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Status: <span className="font-medium">{order.tracking.status}</span>
                      </div>
                      {order.tracking.estimatedDelivery && (
                        <div className="text-sm text-gray-600">
                          Est. Delivery: <span className="font-medium">{order.tracking.estimatedDelivery}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Order Timeline */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-4">Order Timeline</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Order Placed</p>
                      <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                    </div>
                  </div>
                  
                  {order.status !== 'PENDING' && (
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Order Confirmed</p>
                        <p className="text-xs text-gray-500">{formatDate(order.updatedAt)}</p>
                      </div>
                    </div>
                  )}

                  {['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status) && (
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Processing</p>
                        <p className="text-xs text-gray-500">{formatDate(order.updatedAt)}</p>
                      </div>
                    </div>
                  )}

                  {['SHIPPED', 'DELIVERED'].includes(order.status) && (
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-2 w-2 bg-indigo-500 rounded-full"></div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Shipped</p>
                        <p className="text-xs text-gray-500">{formatDate(order.updatedAt)}</p>
                      </div>
                    </div>
                  )}

                  {order.status === 'DELIVERED' && (
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Delivered</p>
                        <p className="text-xs text-gray-500">{formatDate(order.updatedAt)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
