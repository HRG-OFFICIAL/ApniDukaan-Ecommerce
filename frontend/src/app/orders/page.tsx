'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react';
import Link from 'next/link';
import { 
  Package, 
  Search, 
  Eye, 
  Download,
  Calendar,
  MapPin,
  CreditCard,
  Truck
} from 'lucide-react';
import { useQuery } from '@apollo/client';
import { GET_USER_ORDERS } from '../../graphql/queries';
import { Button } from '../../components/ui/Button';
import MainLayout from '../../components/layout/MainLayout';
import { OrderResponse, OrderStatus, OrderFilter, OrderSort } from '../../graphql/types';

export default function OrdersPage() {
  const [filter, setFilter] = useState<OrderFilter>({});
  const [sort, setSort] = useState<OrderSort>({ field: 'createdAt', direction: 'DESC' });
  const [searchTerm, setSearchTerm] = useState('');

  const { data, loading, error, refetch } = useQuery(GET_USER_ORDERS, {
    variables: { filter, sort, limit: 20, offset: 0 }
  });

  const orders = data?.myOrders || [];

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case OrderStatus.CONFIRMED:
        return 'bg-blue-100 text-blue-800';
      case OrderStatus.PROCESSING:
        return 'bg-purple-100 text-purple-800';
      case OrderStatus.SHIPPED:
        return 'bg-indigo-100 text-indigo-800';
      case OrderStatus.DELIVERED:
        return 'bg-green-100 text-green-800';
      case OrderStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      case OrderStatus.REFUNDED:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return <Package className="h-4 w-4" />;
      case OrderStatus.CONFIRMED:
        return <CreditCard className="h-4 w-4" />;
      case OrderStatus.PROCESSING:
        return <Package className="h-4 w-4" />;
      case OrderStatus.SHIPPED:
        return <Truck className="h-4 w-4" />;
      case OrderStatus.DELIVERED:
        return <Package className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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

  if (error) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <Package className="mx-auto h-24 w-24 text-gray-400 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Orders</h1>
            <p className="text-gray-600 mb-8">There was an error loading your orders. Please try again.</p>
            <Button onClick={() => refetch()}>
              Try Again
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-600 mt-2">Track and manage your orders</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={filter.status || ''}
                onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value as OrderStatus || undefined }))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                {Object.values(OrderStatus).map((status) => (
                  <option key={status} value={status}>
                    {status.replace('_', ' ')}
                  </option>
                ))}
              </select>
              
              <select
                value={`${sort.field}-${sort.direction}`}
                onChange={(e) => {
                  const [field, direction] = e.target.value.split('-');
                  setSort({ field: field as 'createdAt' | 'updatedAt' | 'total' | 'status', direction: direction as 'ASC' | 'DESC' });
                }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="createdAt-DESC">Newest First</option>
                <option value="createdAt-ASC">Oldest First</option>
                <option value="total-DESC">Highest Amount</option>
                <option value="total-ASC">Lowest Amount</option>
                <option value="status-ASC">Status A-Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="mx-auto h-24 w-24 text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Orders Found</h2>
            <p className="text-gray-600 mb-8">
              {searchTerm || filter.status 
                ? 'No orders match your search criteria.' 
                : "You haven't placed any orders yet."
              }
            </p>
            {!searchTerm && !filter.status && (
              <Link href="/products">
                <Button>
                  Start Shopping
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order: OrderResponse) => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Order #{order.orderNumber}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span className="ml-1">{order.status.replace('_', ' ')}</span>
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>Ordered on {formatDate(order.createdAt)}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span>{order.shippingAddress.city}, {order.shippingAddress.state}</span>
                      </div>
                      <div className="flex items-center">
                        <CreditCard className="h-4 w-4 mr-2" />
                        <span>{order.payment?.method?.replace('_', ' ') || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Items ({order.items.length})</h4>
                      <div className="space-y-2">
                        {order.items.slice(0, 3).map((item) => (
                          <div key={item.id} className="flex items-center space-x-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded"></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {item.product.name}
                              </p>
                              <p className="text-sm text-gray-500">
                                Qty: {item.quantity} × ${item.price.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <p className="text-sm text-gray-500">
                            +{order.items.length - 3} more items
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:items-end">
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">
                        ${order.total.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Link href={`/orders/${order.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </Link>
                      
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        Invoice
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More Button */}
        {orders.length > 0 && (
          <div className="mt-8 text-center">
            <Button variant="outline">
              Load More Orders
            </Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
