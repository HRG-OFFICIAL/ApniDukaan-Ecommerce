import { Metadata } from 'next';
import ProductGrid from '../../components/ProductGrid';
import { productService } from '../../services/productService';
import { Product } from '../../graphql/types';

export const metadata: Metadata = {
  title: 'New Arrivals - ApniDukaan',
  description: 'Discover the latest products at ApniDukaan',
};

export default async function NewArrivalsPage() {
  let products: Product[] = [];
  
  try {
    const response = await productService.getNewArrivals(20);
    products = response.data?.products || [];
  } catch (error) {
    console.error('Error fetching new arrivals:', error);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">New Arrivals</h1>
        <p className="text-gray-600">Discover our latest products</p>
      </div>
      
      {products.length > 0 ? (
        <ProductGrid products={products} />
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">No new arrivals found. Please try again later.</p>
        </div>
      )}
    </div>
  );
}
