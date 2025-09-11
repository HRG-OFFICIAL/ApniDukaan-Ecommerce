'use client';

import { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Download,
  Filter,
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { mockProducts, mockCategories } from '../../services/mockData';
import { Button } from '../ui/Button';
import { ProductForm } from './ProductForm';
import { ProductDetails } from './ProductDetails';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: string;
  subcategory?: string;
  brand?: string;
  stock: number;
  sku: string;
  isActive: boolean;
  isFeatured: boolean;
  isOnSale: boolean;
  rating: number;
  reviewCount: number;
  tags: string[];
  colors: string[];
  sizes: string[];
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export function ProductManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Use mock data instead of GraphQL
  const productsLoading = false;
  const categories = mockCategories;

  // Filter and search mock data
  let filteredProducts = [...mockProducts];

  if (searchTerm) {
    filteredProducts = filteredProducts.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  if (selectedCategory) {
    filteredProducts = filteredProducts.filter(product =>
      product.category === selectedCategory
    );
  }

  if (statusFilter !== 'all') {
    if (statusFilter === 'active') {
      filteredProducts = filteredProducts.filter(product => product.isActive);
    } else if (statusFilter === 'inactive') {
      filteredProducts = filteredProducts.filter(product => !product.isActive);
    }
  }

  // Apply sorting
  filteredProducts.sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortBy) {
      case 'name':
        aValue = a.name;
        bValue = b.name;
        break;
      case 'price':
        aValue = a.price;
        bValue = b.price;
        break;
      case 'stock':
        aValue = a.stock;
        bValue = b.stock;
        break;
      case 'createdAt':
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
      case 'updatedAt':
        aValue = new Date(a.updatedAt).getTime();
        bValue = new Date(b.updatedAt).getTime();
        break;
      default:
        return 0;
    }

    if (sortOrder === 'ASC') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Apply pagination
  const products = filteredProducts.slice((currentPage - 1) * 20, currentPage * 20);
  const totalCount = filteredProducts.length;

  // Mock mutations
  const createProduct = async (input: any) => {
    console.log('Create product:', input);
    return { data: { createProduct: { id: Date.now().toString(), ...input } } };
  };

  const updateProduct = async (id: string, input: any) => {
    console.log('Update product:', id, input);
    return { data: { updateProduct: { id, ...input } } };
  };

  const deleteProduct = async (id: string) => {
    console.log('Delete product:', id);
    return { data: { deleteProduct: true } };
  };

  const refetchProducts = () => {
    console.log('Refetch products');
  };
  const totalPages = Math.ceil(totalCount / 20);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map((p: Product) => p.id));
    }
  };

  const handleCreateProduct = async (productData: any) => {
    try {
      await createProduct({
        variables: { input: productData }
      });
      setShowProductForm(false);
      refetchProducts();
    } catch (error) {
      console.error('Error creating product:', error);
    }
  };

  const handleUpdateProduct = async (productId: string, productData: any) => {
    try {
      await updateProduct(productId, productData);
      setEditingProduct(null);
      refetchProducts();
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(productId);
        refetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedProducts.length === 0) return;

    try {
      switch (action) {
        case 'activate':
          // Implement bulk activate
          break;
        case 'deactivate':
          // Implement bulk deactivate
          break;
        case 'delete':
          if (window.confirm(`Are you sure you want to delete ${selectedProducts.length} products?`)) {
            // Implement bulk delete
          }
          break;
      }
      setSelectedProducts([]);
      refetchProducts();
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
      day: 'numeric'
    });
  };

  const getStatusBadge = (product: Product) => {
    if (!product.isActive) {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
          Inactive
        </span>
      );
    }
    if (product.stock === 0) {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
          Out of Stock
        </span>
      );
    }
    if (product.stock < 10) {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
          Low Stock
        </span>
      );
    }
    return (
      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
        Active
      </span>
    );
  };

  if (showProductForm) {
    return (
      <ProductForm
        product={editingProduct}
        categories={categories}
        onSave={editingProduct ? 
          (data) => handleUpdateProduct(editingProduct.id, data) : 
          handleCreateProduct
        }
        onCancel={() => {
          setShowProductForm(false);
          setEditingProduct(null);
        }}
      />
    );
  }

  if (viewingProduct) {
    return (
      <ProductDetails
        product={viewingProduct}
        onEdit={() => {
          setViewingProduct(null);
          setEditingProduct(viewingProduct);
          setShowProductForm(true);
        }}
        onDelete={() => {
          setViewingProduct(null);
          handleDeleteProduct(viewingProduct.id);
        }}
        onClose={() => setViewingProduct(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Product Management</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {totalCount} products total
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowProductForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
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
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map((category: Category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => handleStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="out_of_stock">Out of Stock</option>
            <option value="low_stock">Low Stock</option>
          </select>

          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order);
            }}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="price-asc">Price Low to High</option>
            <option value="price-desc">Price High to Low</option>
            <option value="stock-asc">Stock Low to High</option>
            <option value="stock-desc">Stock High to Low</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedProducts.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
              {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('activate')}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Activate
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('deactivate')}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Deactivate
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('delete')}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedProducts.length === products.length && products.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {productsLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto"></div>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No products found
                  </td>
                </tr>
              ) : (
                products.map((product: Product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => handleSelectProduct(product.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          {product.images && product.images.length > 0 ? (
                            <img
                              className="h-12 w-12 rounded-lg object-cover"
                              src={product.images[0]}
                              alt={product.name}
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-400 text-xs">No Image</span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            SKU: {product.sku}
                          </div>
                          {product.brand && (
                            <div className="text-xs text-gray-400">
                              {product.brand}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {product.category}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div>
                        {formatCurrency(product.price)}
                        {product.originalPrice && product.originalPrice > product.price && (
                          <div className="text-xs text-gray-500 line-through">
                            {formatCurrency(product.originalPrice)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {product.stock}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(product)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(product.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewingProduct(product)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingProduct(product);
                            setShowProductForm(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
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
