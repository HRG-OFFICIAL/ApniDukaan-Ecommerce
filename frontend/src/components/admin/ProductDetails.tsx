'use client';

import { Edit, Trash2, X, Package, DollarSign, BarChart3, Star, Tag } from 'lucide-react';
import { Button } from '../ui/Button';

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

interface ProductDetailsProps {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export function ProductDetails({ product, onEdit, onDelete, onClose }: ProductDetailsProps) {
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

  const getStatusBadge = () => {
    if (!product.isActive) {
      return (
        <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-red-100 text-red-800">
          Inactive
        </span>
      );
    }
    if (product.stock === 0) {
      return (
        <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-yellow-100 text-yellow-800">
          Out of Stock
        </span>
      );
    }
    if (product.stock < 10) {
      return (
        <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-orange-100 text-orange-800">
          Low Stock
        </span>
      );
    }
    return (
      <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800">
        Active
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Product Details</h3>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="outline" onClick={onDelete} className="text-red-600 hover:text-red-700">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
              <Button variant="ghost" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Product Images */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-4">Images</h4>
              {product.images && product.images.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {product.images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  ))}
                </div>
              ) : (
                <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Package className="h-8 w-8 text-gray-400" />
                  <span className="ml-2 text-gray-500">No images</span>
                </div>
              )}
            </div>

            {/* Product Information */}
            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-4">Basic Information</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Name</label>
                    <p className="text-lg font-semibold text-gray-900">{product.name}</p>
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">SKU</label>
                    <p className="text-sm text-gray-900 font-mono">{product.sku}</p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Description</label>
                    <p className="text-sm text-gray-900">{product.description}</p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</label>
                    <div className="mt-1">
                      {getStatusBadge()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-4">Pricing</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Current Price</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">{formatCurrency(product.price)}</p>
                  </div>

                  {product.originalPrice && product.originalPrice > product.price && (
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Original Price</span>
                      </div>
                      <p className="text-sm text-gray-500 line-through">{formatCurrency(product.originalPrice)}</p>
                    </div>
                  )}

                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <BarChart3 className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Stock</span>
                    </div>
                    <p className="text-sm text-gray-900">{product.stock} units</p>
                  </div>
                </div>
              </div>

              {/* Category and Brand */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-4">Category & Brand</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Category</label>
                    <p className="text-sm text-gray-900">
                      {product.category || 'Category'}
                    </p>
                  </div>

                  {product.subcategory && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Subcategory</label>
                      <p className="text-sm text-gray-900">{product.subcategory}</p>
                    </div>
                  )}

                  {product.brand && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Brand</label>
                      <p className="text-sm text-gray-900">{product.brand}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Reviews */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-4">Reviews</h4>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="ml-1 text-sm font-medium text-gray-900">{product.rating}</span>
                  </div>
                  <span className="text-sm text-gray-500">({product.reviewCount} reviews)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tags, Colors, and Sizes */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tags */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Tags</h4>
              {product.tags && product.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No tags</p>
              )}
            </div>

            {/* Colors */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Colors</h4>
              {product.colors && product.colors.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      {color}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No colors</p>
              )}
            </div>

            {/* Sizes */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Sizes</h4>
              {product.sizes && product.sizes.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      {size}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No sizes</p>
              )}
            </div>
          </div>

          {/* Flags */}
          <div className="mt-8">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Product Flags</h4>
            <div className="flex space-x-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={product.isActive}
                  disabled
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">Active</label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={product.isFeatured}
                  disabled
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">Featured</label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={product.isOnSale}
                  disabled
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">On Sale</label>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Timestamps</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Created</label>
                <p className="text-sm text-gray-900">{formatDate(product.createdAt)}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Last Updated</label>
                <p className="text-sm text-gray-900">{formatDate(product.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
