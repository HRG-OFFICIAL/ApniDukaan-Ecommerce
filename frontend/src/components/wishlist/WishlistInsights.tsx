'use client';

import { useMemo } from 'react';
import { 
  TrendingDown, 
  TrendingUp, 
  Star, 
  ShoppingCart,
  Clock,
  Tag,
  BarChart3,
  Heart
} from 'lucide-react';
import { useWishlist } from '../../hooks/useWishlist';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface WishlistInsightsProps {
  className?: string;
}

export default function WishlistInsights({ className = '' }: WishlistInsightsProps) {
  const { wishlistItems } = useWishlist();

  const insights = useMemo(() => {
    if (wishlistItems.length === 0) {
      return null;
    }

    const totalItems = wishlistItems.length;
    const totalValue = wishlistItems.reduce((sum, item) => sum + item.product.price, 0);
    const averagePrice = totalValue / totalItems;
    
    // Category breakdown
    const categories = wishlistItems.reduce((acc, item) => {
      const category = item.product.category || 'Other';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topCategory = Object.entries(categories).sort(([,a], [,b]) => b - a)[0];
    
    // Price analysis
    const prices = wishlistItems.map(item => item.product.price).sort((a, b) => a - b);
    const minPrice = prices[0];
    const maxPrice = prices[prices.length - 1];
    
    // Rating analysis
    const avgRating = wishlistItems.reduce((sum, item) => sum + (item.product.rating || 0), 0) / totalItems;
    
    // Sale items
    const onSaleItems = wishlistItems.filter(item => item.product.isOnSale);
    const salePercentage = (onSaleItems.length / totalItems) * 100;
    
    // Stock analysis
    const outOfStockItems = wishlistItems.filter(item => item.product.stock === 0);
    const lowStockItems = wishlistItems.filter(item => item.product.stock > 0 && item.product.stock <= 5);
    
    // Potential savings
    const originalValue = wishlistItems.reduce((sum, item) => {
      return sum + (item.product.originalPrice || item.product.price);
    }, 0);
    const potentialSavings = originalValue - totalValue;
    
    // Recently added
    const recentItems = wishlistItems
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);

    return {
      totalItems,
      totalValue,
      averagePrice,
      categories,
      topCategory,
      minPrice,
      maxPrice,
      avgRating,
      onSaleItems,
      salePercentage,
      outOfStockItems,
      lowStockItems,
      potentialSavings,
      recentItems
    };
  }, [wishlistItems]);

  if (!insights) {
    return (
      <div className={`bg-gradient-to-br from-pink-50 to-red-50 rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No insights yet</h3>
          <p className="text-gray-600 text-sm">
            Start adding items to your wishlist to see personalized insights and recommendations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{insights.totalItems}</p>
            </div>
            <Heart className="h-8 w-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">${insights.totalValue.toFixed(0)}</p>
            </div>
            <Tag className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Avg Rating</p>
              <p className="text-2xl font-bold text-gray-900">{insights.avgRating.toFixed(1)}</p>
            </div>
            <Star className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">On Sale</p>
              <p className="text-2xl font-bold text-gray-900">{insights.salePercentage.toFixed(0)}%</p>
            </div>
            <TrendingDown className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Price Analysis */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
            Price Analysis
          </h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Average Price</span>
              <span className="font-semibold">${insights.averagePrice.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Price Range</span>
              <span className="font-semibold">${insights.minPrice} - ${insights.maxPrice}</span>
            </div>
            
            {insights.potentialSavings > 0 && (
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-sm text-green-700">Potential Savings</span>
                <span className="font-semibold text-green-700">${insights.potentialSavings.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Tag className="h-5 w-5 mr-2 text-purple-500" />
            Category Breakdown
          </h3>
          
          <div className="space-y-3">
            {Object.entries(insights.categories)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 4)
              .map(([category, count]) => (
                <div key={category} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{category}</span>
                  <Badge variant="secondary">{count} items</Badge>
                </div>
              ))}
          </div>
          
          {insights.topCategory && (
            <div className="mt-4 p-3 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-700">
                <span className="font-semibold">{insights.topCategory[0]}</span> is your favorite category
                with {insights.topCategory[1]} items
              </p>
            </div>
          )}
        </div>

        {/* Stock Alerts */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-orange-500" />
            Stock Alerts
          </h3>
          
          <div className="space-y-4">
            {insights.outOfStockItems.length > 0 && (
              <div className="p-3 bg-red-50 rounded-lg">
                <p className="text-sm text-red-700 font-medium mb-2">Out of Stock ({insights.outOfStockItems.length})</p>
                {insights.outOfStockItems.slice(0, 2).map(item => (
                  <p key={item.id} className="text-xs text-red-600 truncate">
                    • {item.product.name}
                  </p>
                ))}
              </div>
            )}
            
            {insights.lowStockItems.length > 0 && (
              <div className="p-3 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-700 font-medium mb-2">Low Stock ({insights.lowStockItems.length})</p>
                {insights.lowStockItems.slice(0, 2).map(item => (
                  <p key={item.id} className="text-xs text-yellow-600 truncate">
                    • {item.product.name} ({item.product.stock} left)
                  </p>
                ))}
              </div>
            )}
            
            {insights.onSaleItems.length > 0 && (
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700 font-medium mb-2">On Sale ({insights.onSaleItems.length})</p>
                {insights.onSaleItems.slice(0, 2).map(item => (
                  <p key={item.id} className="text-xs text-green-600 truncate">
                    • {item.product.name}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-indigo-500" />
            Recently Added
          </h3>
          
          <div className="space-y-3">
            {insights.recentItems.map(item => (
              <div key={item.id} className="flex items-center space-x-3">
                <img
                  src={item.product.images[0] || '/placeholder-product.jpg'}
                  alt={item.product.name}
                  className="h-10 w-10 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.product.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    Added {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  ${item.product.price}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Ready to shop?</h3>
            <p className="text-sm text-gray-600">
              You have {insights.onSaleItems.length} items on sale in your wishlist
            </p>
          </div>
          <Button className="ml-4">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add Sale Items to Cart
          </Button>
        </div>
      </div>
    </div>
  );
}
