'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { 
  Search, 
  Download, 
  Eye, 
  Edit, 
  Filter,
  MoreVertical,
  CheckCircle,
  XCircle,
  Truck,
  Package
} from 'lucide-react';
import { mockOrders } from '../../services/mockData';
import { Button } from '../ui/Button';
import { OrderDetails } from './OrderDetails';
import { GET_ALL_ORDERS } from '../../graphql/queries';
import { UPDATE_ORDER_STATUS } from '../../graphql/mutations';

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

export function OrderManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [showBulkActions, setShowBulkActions] = useState(false);

  const { data: ordersData, loading: ordersLoading, refetch: refetchOrders } = useQuery(GET_ALL_ORDERS, {
    variables: {
      filter: {
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: searchTerm || undefined
      },
      limit: 20,
      offset: (currentPage - 1) * 20
    }
  });

  const [updateOrderStatus] = useMutation(UPDATE_ORDER_STATUS);

  const orders = ordersData?.orders || [];
  const totalCount = ordersData?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / 20);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleDateFilter = (date: string) => {
    setDateFilter(date);
    setCurrentPage(1);
  };

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map((o: Order) => o.id));
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await updateOrderStatus({
        variables: { 
          id: orderId, 
          status: newStatus 
        }
      });
      refetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedOrders.length === 0) return;

    try {
      switch (action) {
        case 'mark_processing':
          for (const orderId of selectedOrders) {
            await updateOrderStatus({
              variables: { id: orderId, status: 'PROCESSING' }
            });
          }
          break;
        case 'mark_shipped':
          for (const orderId of selectedOrders) {
            await updateOrderStatus({
              variables: { id: orderId, status: 'SHIPPED' }
            });
          }
          break;
        case 'mark_delivered':
          for (const orderId of selectedOrders) {
            await updateOrderStatus({
              variables: { id: orderId, status: 'DELIVERED' }
            });
          }
          break;
      }
      setSelectedOrders([]);
      refetchOrders();
    } catch (error) {
      console.error('Error performing bulk action:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return <CheckCircle className="h-4 w-4" />;
      case 'SHIPPED':
        return <Truck className="h-4 w-4" />;
      case 'PROCESSING':
        return <Package className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  if (viewingOrder) {
    return (
      <OrderDetails
        order={viewingOrder}
        onStatusUpdate={handleStatusUpdate}
        onClose={() => setViewingOrder(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Order Management</h2>
          <p className="text-sm text-gray-600">
            {totalCount} orders total
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => handleStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PROCESSING">Processing</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="REFUNDED">Refunded</option>
          </select>

          <select
            value={dateFilter}
            onChange={(e) => handleDateFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>

          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            More Filters
          </Button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedOrders.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
              {selectedOrders.length} order{selectedOrders.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('mark_processing')}
              >
                <Package className="h-4 w-4 mr-1" />
                Mark Processing
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('mark_shipped')}
              >
                <Truck className="h-4 w-4 mr-1" />
                Mark Shipped
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('mark_delivered')}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Mark Delivered
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedOrders.length === orders.length && orders.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ordersLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto"></div>
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No orders found
                  </td>
                </tr>
              ) : (
                orders.map((order: Order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order.id)}
                        onChange={() => handleSelectOrder(order.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          {getStatusIcon(order.status)}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            #{order.orderNumber}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {order.id.slice(-8)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {order.customer?.name || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.customer?.email || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewingOrder(order)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newStatus = order.status === 'PENDING' ? 'PROCESSING' : 
                                            order.status === 'PROCESSING' ? 'SHIPPED' :
                                            order.status === 'SHIPPED' ? 'DELIVERED' : 'PROCESSING';
                            handleStatusUpdate(order.id, newStatus);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, totalCount)} of {totalCount} results
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
