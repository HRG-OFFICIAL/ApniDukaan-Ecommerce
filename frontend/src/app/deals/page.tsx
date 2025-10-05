'use client';

import ProductGrid from '../../components/ProductGrid';
import { productService } from '../../services/productService';
import { Product } from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useEffect, useState } from 'react';

export default function DealsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Set page title
    document.title = 'Deals & Offers - ApniDukaan';
    
    const fetchDeals = async () => {
      try {
        const response = await productService.getDeals(20);
        if (response.success && response.data) {
          setProducts(response.data.products || []);
        } else {
          setError(response.error || 'Failed to fetch deals');
        }
      } catch (err) {
        console.error('Error fetching deals:', err);
        setError('Failed to fetch deals. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDeals();
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Deals & Offers</h1>
          <p className="text-gray-600">Find amazing deals and discounts</p>
        </div>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Deals & Offers</h1>
        <p className="text-gray-600">Find amazing deals and discounts</p>
      </div>
      
      {error ? (
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={() => {
              setError(null);
              setIsLoading(true);
              window.location.reload();
            }} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      ) : products.length > 0 ? (
        <ProductGrid products={products} />
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">No deals found. Please try again later.</p>
        </div>
      )}
    </div>
  );
}
