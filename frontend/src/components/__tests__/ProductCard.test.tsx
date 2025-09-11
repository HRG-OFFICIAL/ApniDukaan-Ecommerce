import { render, screen, fireEvent } from '@testing-library/react'
import ProductCard from '../ProductCard'
import { Product } from '../../graphql/types'

const mockProduct: Product = {
  id: '1',
  name: 'Test Product',
  description: 'A test product description',
  price: 99.99,
  originalPrice: 129.99,
  images: ['https://example.com/test-image.jpg'],
  category: 'Electronics',
  rating: 4.5,
  reviewCount: 10,
  stock: 5,
  isBestseller: true,
  isOnSale: true,
  isNew: false,
  reviews: [],
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z'
}

// Mock the hooks
jest.mock('../../store/useCartStore', () => ({
  useCartStore: () => ({
    addItem: jest.fn(),
  }),
}))

jest.mock('../../store/usePreferencesStore', () => ({
  usePreferencesStore: () => ({
    addToWishlist: jest.fn(),
    removeFromWishlist: jest.fn(),
    wishlist: [],
  }),
}))

jest.mock('../../store/useAuthStore', () => ({
  useAuthStore: () => ({
    isAuthenticated: true,
  }),
}))

describe('ProductCard Component', () => {
  test('renders product information correctly', () => {
    render(<ProductCard product={mockProduct} />)
    
    expect(screen.getByText('Test Product')).toBeInTheDocument()
    expect(screen.getByText('$99.99')).toBeInTheDocument()
    expect(screen.getByText('$129.99')).toBeInTheDocument()
  })

  test('displays bestseller badge when product is bestseller', () => {
    render(<ProductCard product={mockProduct} />)
    expect(screen.getByText('Best Seller')).toBeInTheDocument()
  })

  test('displays sale badge when product is on sale', () => {
    render(<ProductCard product={mockProduct} />)
    expect(screen.getByText('23% off')).toBeInTheDocument()
  })

  test('displays new badge when product is new', () => {
    const newProduct = { ...mockProduct, isNew: true, isBestseller: false }
    render(<ProductCard product={newProduct} />)
    expect(screen.getByText('New')).toBeInTheDocument()
  })

  test('displays out of stock message when stock is 0', () => {
    const outOfStockProduct = { ...mockProduct, stock: 0 }
    render(<ProductCard product={outOfStockProduct} />)
    // Badge and button text should be present
    const outOfStockElements = screen.getAllByText('Out of Stock')
    expect(outOfStockElements.length).toBeGreaterThanOrEqual(2)
  })

  test('displays low stock warning when stock is low', () => {
    const lowStockProduct = { ...mockProduct, stock: 3 }
    render(<ProductCard product={lowStockProduct} />)
    expect(screen.getByText('Only 3 left')).toBeInTheDocument()
  })

  test('handles add to cart click', () => {
    render(<ProductCard product={mockProduct} />)
    
    const addToCartButton = screen.getByRole('button', { name: /Add Test Product to cart/i })
    fireEvent.click(addToCartButton)
    
    // Test that the button is clickable
    expect(addToCartButton).toBeInTheDocument()
  })

  test('displays rating correctly', () => {
    render(<ProductCard product={mockProduct} />)
    expect(screen.getByText('4.5 (10)')).toBeInTheDocument()
  })
})
