import { Metadata } from 'next';
import ProductGrid from '@/components/ProductGrid';
import { getProducts } from '@/services/productService';

export const metadata: Metadata = {
  title: 'Deals & Offers - ApniDukaan',
  description: 'Find amazing deals and discounts at ApniDukaan',
};

export default async function DealsPage() {
  const products = await getProducts({ 
    page: 1, 
    limit: 20, 
    sortField: 'discount', 
    sortOrder: 'desc' 
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Deals & Offers</h1>
        <p className="text-gray-600">Find amazing deals and discounts</p>
      </div>
      
      <ProductGrid products={products.data?.products || []} />
    </div>
  );
}
