import { Metadata } from 'next';
import ProductGrid from '@/components/ProductGrid';
import { getProducts } from '@/services/productService';

export const metadata: Metadata = {
  title: 'New Arrivals - ApniDukaan',
  description: 'Discover the latest products at ApniDukaan',
};

export default async function NewArrivalsPage() {
  const products = await getProducts({ 
    page: 1, 
    limit: 20, 
    sortField: 'createdAt', 
    sortOrder: 'desc' 
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">New Arrivals</h1>
        <p className="text-gray-600">Discover our latest products</p>
      </div>
      
      <ProductGrid products={products.data?.products || []} />
    </div>
  );
}
