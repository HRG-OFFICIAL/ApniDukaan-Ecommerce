import { Metadata } from 'next';
import ProductGrid from '../../components/ProductGrid';
import { productService } from '../../services/productService';
import { Product } from '../../graphql/types';

export const metadata: Metadata = {
  title: 'Deals & Offers - ApniDukaan',
  description: 'Find amazing deals and discounts at ApniDukaan',
};

export default async function DealsPage() {
  let products: Product[] = [];
  
  try {
    const response = await productService.getDeals(20);
    products = response.data?.products || [];
  } catch (error) {
    console.error('Error fetching deals:', error);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Deals & Offers</h1>
        <p className="text-gray-600">Find amazing deals and discounts</p>
      </div>
      
      {products.length > 0 ? (
        <ProductGrid products={products} />
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">No deals found. Please try again later.</p>
        </div>
      )}
    </div>
  );
}
