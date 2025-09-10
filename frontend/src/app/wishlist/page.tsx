'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Heart, 
  ShoppingCart, 
  Trash2, 
  Search, 
  Grid,
  List,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_WISHLIST } from '../../graphql/queries';
import { ADD_TO_CART, REMOVE_FROM_WISHLIST } from '../../graphql/mutations';
import { Button } from '../../components/ui/Button';
import MainLayout from '../../components/layout/MainLayout';
import { WishlistItem } from '../../graphql/types';

export default function WishlistPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');

  const { data, loading, error, refetch } = useQuery(GET_WISHLIST);
  const [addToCart] = useMutation(ADD_TO_CART, {
    refetchQueries: ['GetCart']
  });
  const [removeFromWishlist] = useMutation(REMOVE_FROM_WISHLIST, {
    refetchQueries: ['GetWishlist']
  });

  const wishlistItems = data?.wishlist || [];

  const handleAddToCart = async (productId: string) => {
    try {
      await addToCart({ variables: { productId, quantity: 1 } });
      // You could show a success toast here
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const handleRemoveFromWishlist = async (productId: string) => {
    try {
      await removeFromWishlist({ variables: { productId } });
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    }
  };

  const filteredItems = wishlistItems
    .filter((item: WishlistItem) => 
      item.product.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a: WishlistItem, b: WishlistItem) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.product.name.localeCompare(b.product.name);
          break;
        case 'price':
          comparison = a.product.price - b.product.price;
          break;
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="h-64 bg-gray-200 rounded"></div>
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
            <Heart className="mx-auto h-24 w-24 text-gray-400 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Wishlist</h1>
            <p className="text-gray-600 mb-8">There was an error loading your wishlist. Please try again.</p>
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
          <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
          <p className="text-gray-600 mt-2">
            {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} saved
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search wishlist..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'price' | 'date')}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="date">Date Added</option>
                <option value="name">Name</option>
                <option value="price">Price</option>
              </select>
              
              <Button
                variant="outline"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              </Button>
              
              <div className="flex border border-gray-300 rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Wishlist Items */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="mx-auto h-24 w-24 text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {searchTerm ? 'No items found' : 'Your wishlist is empty'}
            </h2>
            <p className="text-gray-600 mb-8">
              {searchTerm 
                ? 'Try adjusting your search terms.' 
                : "Start adding items you love to your wishlist."
              }
            </p>
            {!searchTerm && (
              <Link href="/products">
                <Button>
                  Start Shopping
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
          }>
            {filteredItems.map((item: WishlistItem) => (
              <div
                key={item.id}
                className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${
                  viewMode === 'list' ? 'flex' : ''
                }`}
              >
                <div className={`${viewMode === 'list' ? 'w-48 flex-shrink-0' : 'aspect-w-1 aspect-h-1'}`}>
                  <Image
                    src={item.product.images[0] || '/placeholder-product.jpg'}
                    alt={item.product.name}
                    width={viewMode === 'list' ? 192 : 300}
                    height={viewMode === 'list' ? 192 : 300}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                      {item.product.name}
                    </h3>
                    <button
                      onClick={() => handleRemoveFromWishlist(item.product.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-center mb-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Heart
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.floor(item.product.rating)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="ml-2 text-sm text-gray-500">
                      ({item.product.reviewCount})
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-semibold text-gray-900">
                        ${item.product.price.toFixed(2)}
                      </span>
                      {item.product.originalPrice && item.product.originalPrice > item.product.price && (
                        <span className="text-sm text-gray-500 line-through">
                          ${item.product.originalPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                    {item.product.isOnSale && (
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                        Sale
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Added {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleAddToCart(item.product.id)}
                        className="flex-1"
                      >
                        <ShoppingCart className="h-4 w-4 mr-1" />
                        Add to Cart
                      </Button>
                    </div>
                  </div>
                  
                  {item.product.stock === 0 && (
                    <div className="mt-2 text-xs text-red-600">
                      Out of Stock
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bulk Actions */}
        {filteredItems.length > 0 && (
          <div className="mt-8 flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Showing {filteredItems.length} of {wishlistItems.length} items
            </div>
            <div className="flex space-x-2">
              <Button variant="outline">
                Add All to Cart
              </Button>
              <Button variant="outline" className="text-red-600 hover:text-red-700">
                Clear Wishlist
              </Button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
