import React from 'react';
import { render, screen } from '@testing-library/react';
import ProductGrid from '../ProductGrid';
import { Product } from '../../lib/data';

// Mock product data
const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Test Product 1',
    price: 1000,
    images: ['https://example.com/image1.jpg'],
    category: { id: '1', name: 'Electronics' },
    rating: 4.5,
    reviews: [],
    inventory: { quantity: 10 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Test Product 2',
    price: 2000,
    images: ['https://example.com/image2.jpg'],
    category: { id: '2', name: 'Clothing' },
    rating: 4.0,
    reviews: [],
    inventory: { quantity: 5 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

describe('ProductGrid', () => {
  it('renders products correctly', () => {
    render(<ProductGrid products={mockProducts} />);
    
    expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    expect(screen.getByText('Test Product 2')).toBeInTheDocument();
  });

  it('renders empty state when no products', () => {
    render(<ProductGrid products={[]} />);
    
    expect(screen.getByText('No products found.')).toBeInTheDocument();
  });

  it('renders empty state when products is null', () => {
    render(<ProductGrid products={null as any} />);
    
    expect(screen.getByText('No products found.')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <ProductGrid products={mockProducts} className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('renders correct number of products', () => {
    render(<ProductGrid products={mockProducts} />);
    
    const productCards = screen.getAllByRole('article');
    expect(productCards).toHaveLength(2);
  });
});
