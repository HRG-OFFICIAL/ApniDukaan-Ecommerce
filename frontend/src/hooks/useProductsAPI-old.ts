import { useState, useEffect, useMemo } from 'react'
import { Product } from '../graphql/types'
import { productsApi, ProductFilters, ProductSort, Product as ApiProduct } from '../lib/api'

interface UseProductsOptions {
  filter?: {
    category?: string
    subcategory?: string
    brand?: string
    minPrice?: number
    maxPrice?: number
    isOnSale?: boolean
    isNew?: boolean
    isBestseller?: boolean
    isFeatured?: boolean
    isActive?: boolean
    tags?: string[]
    colors?: string[]
    sizes?: string[]
  }
  sort?: string
  search?: string
  limit?: number
  offset?: number
}

interface UseProductsResult {
  products: Product[]
  loading: boolean
  error: Error | null
  totalCount: number
  hasMore: boolean
  fetchMore: () => void
  refetch: () => void
}

// Mock data for development when backend is not available - moved outside component
const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Wireless Bluetooth Headphones',
    description: 'High-quality wireless headphones with noise cancellation',
    price: 199.99,
    originalPrice: 249.99,
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'],
    category: 'Electronics',
    subcategory: 'Audio',
    brand: { name: 'TechSound' },
    rating: 4.5,
    reviewCount: 128,
    stock: 50,
    sku: 'WS-BT-001',
    isBestseller: true,
    isOnSale: true,
    isNew: false,
    isFeatured: true,
    isActive: true,
    tags: ['wireless', 'bluetooth', 'noise-cancellation'],
    colors: ['Black', 'White', 'Blue'],
    sizes: ['One Size'],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    specifications: {
      'Battery Life': '30 hours',
      'Connectivity': 'Bluetooth 5.0',
      'Weight': '250g'
    },
    reviews: []
  },
  {
    id: '2',
    name: 'Smart Fitness Watch',
    description: 'Advanced fitness tracking with heart rate monitoring',
    price: 299.99,
    originalPrice: 349.99,
    images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'],
    category: 'Electronics',
    subcategory: 'Wearables',
    brand: { name: 'FitTech' },
    rating: 4.3,
    reviewCount: 89,
    stock: 25,
    sku: 'SF-WT-002',
    isBestseller: false,
    isOnSale: true,
    isNew: true,
    isFeatured: false,
    isActive: true,
    tags: ['fitness', 'smartwatch', 'health'],
    colors: ['Black', 'Silver', 'Rose Gold'],
    sizes: ['One Size'],
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2024-01-20T10:00:00Z',
    specifications: {
      'Battery Life': '7 days',
      'Water Resistance': '5ATM',
      'Display': '1.4" AMOLED'
    },
    reviews: []
  },
  {
    id: '3',
    name: 'Organic Cotton T-Shirt',
    description: 'Comfortable and sustainable cotton t-shirt',
    price: 29.99,
    originalPrice: 39.99,
    images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400'],
    category: 'Clothing',
    subcategory: 'Tops',
    brand: { name: 'EcoWear' },
    rating: 4.7,
    reviewCount: 156,
    stock: 100,
    sku: 'OC-TS-003',
    isBestseller: true,
    isOnSale: true,
    isNew: false,
    isFeatured: true,
    isActive: true,
    tags: ['organic', 'cotton', 'sustainable'],
    colors: ['White', 'Black', 'Navy', 'Gray'],
    sizes: ['S', 'M', 'L', 'XL'],
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-10T10:00:00Z',
    specifications: {
      'Material': '100% Organic Cotton',
      'Care': 'Machine Wash Cold',
      'Origin': 'Made in USA'
    },
    reviews: []
  },
  {
    id: '4',
    name: 'Gaming Mechanical Keyboard',
    description: 'RGB backlit mechanical keyboard for gaming enthusiasts',
    price: 149.99,
    originalPrice: 199.99,
    images: ['https://picsum.photos/400/400?random=4'],
    category: 'Electronics',
    subcategory: 'Gaming',
    brand: { name: 'GameMaster' },
    rating: 4.6,
    reviewCount: 203,
    stock: 75,
    sku: 'GM-KB-004',
    isBestseller: true,
    isOnSale: true,
    isNew: false,
    isFeatured: true,
    isActive: true,
    tags: ['gaming', 'mechanical', 'rgb', 'keyboard'],
    colors: ['Black', 'White'],
    sizes: ['Full Size'],
    createdAt: '2024-01-12T10:00:00Z',
    updatedAt: '2024-01-12T10:00:00Z',
    specifications: {
      'Switch Type': 'Cherry MX Blue',
      'Backlight': 'RGB',
      'Connectivity': 'USB-C'
    },
    reviews: []
  },
  {
    id: '5',
    name: 'Wireless Mouse',
    description: 'Ergonomic wireless mouse with precision tracking',
    price: 49.99,
    originalPrice: 69.99,
    images: ['https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400'],
    category: 'Electronics',
    subcategory: 'Accessories',
    brand: { name: 'TechPro' },
    rating: 4.4,
    reviewCount: 92,
    stock: 120,
    sku: 'TP-MS-005',
    isBestseller: false,
    isOnSale: true,
    isNew: false,
    isFeatured: false,
    isActive: true,
    tags: ['wireless', 'ergonomic', 'precision'],
    colors: ['Black', 'White', 'Gray'],
    sizes: ['One Size'],
    createdAt: '2024-01-08T10:00:00Z',
    updatedAt: '2024-01-08T10:00:00Z',
    specifications: {
      'DPI': '16000',
      'Battery Life': '70 hours',
      'Connectivity': 'Bluetooth 5.0'
    },
    reviews: []
  },
  {
    id: '6',
    name: 'Denim Jeans',
    description: 'Classic blue denim jeans with modern fit',
    price: 79.99,
    originalPrice: 99.99,
    images: ['https://images.unsplash.com/photo-1542272604-787c3835535d?w=400'],
    category: 'Clothing',
    subcategory: 'Bottoms',
    brand: { name: 'DenimCo' },
    rating: 4.5,
    reviewCount: 187,
    stock: 80,
    sku: 'DC-JN-006',
    isBestseller: true,
    isOnSale: true,
    isNew: false,
    isFeatured: true,
    isActive: true,
    tags: ['denim', 'jeans', 'casual'],
    colors: ['Blue', 'Black', 'Light Blue'],
    sizes: ['28', '30', '32', '34', '36'],
    createdAt: '2024-01-05T10:00:00Z',
    updatedAt: '2024-01-05T10:00:00Z',
    specifications: {
      'Material': '100% Cotton Denim',
      'Fit': 'Slim',
      'Care': 'Machine Wash'
    },
    reviews: []
  },
  {
    id: '7',
    name: 'Running Shoes',
    description: 'Lightweight running shoes with excellent cushioning',
    price: 129.99,
    originalPrice: 159.99,
    images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400'],
    category: 'Footwear',
    subcategory: 'Athletic',
    brand: { name: 'RunFast' },
    rating: 4.8,
    reviewCount: 234,
    stock: 60,
    sku: 'RF-RS-007',
    isBestseller: true,
    isOnSale: true,
    isNew: false,
    isFeatured: true,
    isActive: true,
    tags: ['running', 'athletic', 'lightweight'],
    colors: ['Black', 'White', 'Blue', 'Red'],
    sizes: ['7', '8', '9', '10', '11', '12'],
    createdAt: '2024-01-18T10:00:00Z',
    updatedAt: '2024-01-18T10:00:00Z',
    specifications: {
      'Weight': '280g',
      'Cushioning': 'Air Max',
      'Upper': 'Mesh'
    },
    reviews: []
  },
  {
    id: '8',
    name: 'Laptop Stand',
    description: 'Adjustable aluminum laptop stand for better ergonomics',
    price: 39.99,
    originalPrice: 59.99,
    images: ['https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400'],
    category: 'Electronics',
    subcategory: 'Accessories',
    brand: { name: 'ErgoDesk' },
    rating: 4.3,
    reviewCount: 76,
    stock: 90,
    sku: 'ED-LS-008',
    isBestseller: false,
    isOnSale: true,
    isNew: false,
    isFeatured: false,
    isActive: true,
    tags: ['laptop', 'stand', 'ergonomic', 'adjustable'],
    colors: ['Silver', 'Black'],
    sizes: ['One Size'],
    createdAt: '2024-01-14T10:00:00Z',
    updatedAt: '2024-01-14T10:00:00Z',
    specifications: {
      'Material': 'Aluminum',
      'Height': 'Adjustable 6-12 inches',
      'Weight': '1.2kg'
    },
    reviews: []
  },
  {
    id: '9',
    name: 'Coffee Maker',
    description: 'Programmable drip coffee maker with thermal carafe',
    price: 89.99,
    originalPrice: 119.99,
    images: ['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400'],
    category: 'Home & Kitchen',
    subcategory: 'Appliances',
    brand: { name: 'BrewMaster' },
    rating: 4.6,
    reviewCount: 145,
    stock: 40,
    sku: 'BM-CM-009',
    isBestseller: true,
    isOnSale: true,
    isNew: false,
    isFeatured: true,
    isActive: true,
    tags: ['coffee', 'programmable', 'thermal'],
    colors: ['Black', 'White', 'Stainless Steel'],
    sizes: ['12 Cup'],
    createdAt: '2024-01-16T10:00:00Z',
    updatedAt: '2024-01-16T10:00:00Z',
    specifications: {
      'Capacity': '12 cups',
      'Timer': '24-hour programmable',
      'Carafe': 'Thermal stainless steel'
    },
    reviews: []
  },
  {
    id: '10',
    name: 'Bluetooth Speaker',
    description: 'Portable waterproof Bluetooth speaker with 360-degree sound',
    price: 79.99,
    originalPrice: 99.99,
    images: ['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400'],
    category: 'Electronics',
    subcategory: 'Audio',
    brand: { name: 'SoundWave' },
    rating: 4.4,
    reviewCount: 167,
    stock: 85,
    sku: 'SW-BS-010',
    isBestseller: false,
    isOnSale: true,
    isNew: false,
    isFeatured: false,
    isActive: true,
    tags: ['bluetooth', 'speaker', 'portable', 'waterproof'],
    colors: ['Black', 'Blue', 'Red'],
    sizes: ['One Size'],
    createdAt: '2024-01-11T10:00:00Z',
    updatedAt: '2024-01-11T10:00:00Z',
    specifications: {
      'Battery Life': '12 hours',
      'Waterproof': 'IPX7',
      'Connectivity': 'Bluetooth 5.0'
    },
    reviews: []
  },
  {
    id: '11',
    name: 'Yoga Mat',
    description: 'Non-slip premium yoga mat for all fitness levels',
    price: 34.99,
    originalPrice: 49.99,
    images: ['https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400'],
    category: 'Sports & Fitness',
    subcategory: 'Yoga',
    brand: { name: 'ZenFit' },
    rating: 4.7,
    reviewCount: 198,
    stock: 110,
    sku: 'ZF-YM-011',
    isBestseller: true,
    isOnSale: true,
    isNew: false,
    isFeatured: true,
    isActive: true,
    tags: ['yoga', 'mat', 'non-slip', 'fitness'],
    colors: ['Purple', 'Blue', 'Pink', 'Gray'],
    sizes: ['72" x 24"'],
    createdAt: '2024-01-09T10:00:00Z',
    updatedAt: '2024-01-09T10:00:00Z',
    specifications: {
      'Thickness': '6mm',
      'Material': 'TPE',
      'Weight': '2.2kg'
    },
    reviews: []
  },
  {
    id: '12',
    name: 'Smartphone Case',
    description: 'Protective clear case with MagSafe compatibility',
    price: 24.99,
    originalPrice: 34.99,
    images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400'],
    category: 'Electronics',
    subcategory: 'Accessories',
    brand: { name: 'PhoneGuard' },
    rating: 4.2,
    reviewCount: 89,
    stock: 150,
    sku: 'PG-SC-012',
    isBestseller: false,
    isOnSale: true,
    isNew: true,
    isFeatured: false,
    isActive: true,
    tags: ['phone', 'case', 'protective', 'magsafe'],
    colors: ['Clear', 'Black', 'Blue'],
    sizes: ['iPhone 15 Pro'],
    createdAt: '2024-01-22T10:00:00Z',
    updatedAt: '2024-01-22T10:00:00Z',
    specifications: {
      'Material': 'Polycarbonate',
      'Compatibility': 'iPhone 15 Pro',
      'Features': 'MagSafe compatible'
    },
    reviews: []
  },
  {
    id: '13',
    name: 'Backpack',
    description: 'Durable travel backpack with laptop compartment',
    price: 69.99,
    originalPrice: 89.99,
    images: ['https://picsum.photos/400/400?random=13'],
    category: 'Accessories',
    subcategory: 'Bags',
    brand: { name: 'TravelGear' },
    rating: 4.5,
    reviewCount: 123,
    stock: 70,
    sku: 'TG-BP-013',
    isBestseller: true,
    isOnSale: true,
    isNew: false,
    isFeatured: true,
    isActive: true,
    tags: ['backpack', 'travel', 'laptop', 'durable'],
    colors: ['Black', 'Gray', 'Navy'],
    sizes: ['25L'],
    createdAt: '2024-01-13T10:00:00Z',
    updatedAt: '2024-01-13T10:00:00Z',
    specifications: {
      'Capacity': '25L',
      'Laptop Compartment': 'Up to 15.6"',
      'Material': 'Nylon'
    },
    reviews: []
  },
  {
    id: '14',
    name: 'Desk Lamp',
    description: 'LED desk lamp with adjustable brightness and color temperature',
    price: 59.99,
    originalPrice: 79.99,
    images: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'],
    category: 'Home & Office',
    subcategory: 'Lighting',
    brand: { name: 'BrightLight' },
    rating: 4.4,
    reviewCount: 94,
    stock: 55,
    sku: 'BL-DL-014',
    isBestseller: false,
    isOnSale: true,
    isNew: false,
    isFeatured: false,
    isActive: true,
    tags: ['lamp', 'led', 'adjustable', 'desk'],
    colors: ['White', 'Black'],
    sizes: ['One Size'],
    createdAt: '2024-01-17T10:00:00Z',
    updatedAt: '2024-01-17T10:00:00Z',
    specifications: {
      'Brightness': '5 levels',
      'Color Temperature': '2700K-6500K',
      'Power': 'USB-C'
    },
    reviews: []
  },
  {
    id: '15',
    name: 'Water Bottle',
    description: 'Insulated stainless steel water bottle with leak-proof lid',
    price: 19.99,
    originalPrice: 29.99,
    images: ['https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400'],
    category: 'Sports & Fitness',
    subcategory: 'Hydration',
    brand: { name: 'HydroMax' },
    rating: 4.6,
    reviewCount: 156,
    stock: 200,
    sku: 'HM-WB-015',
    isBestseller: true,
    isOnSale: true,
    isNew: false,
    isFeatured: true,
    isActive: true,
    tags: ['water', 'bottle', 'insulated', 'stainless'],
    colors: ['Silver', 'Black', 'Blue', 'Pink'],
    sizes: ['32oz'],
    createdAt: '2024-01-06T10:00:00Z',
    updatedAt: '2024-01-06T10:00:00Z',
    specifications: {
      'Capacity': '32oz',
      'Material': 'Stainless Steel',
      'Insulation': '24 hours cold'
    },
    reviews: []
  },
  {
    id: '16',
    name: 'Wireless Charger',
    description: 'Fast wireless charging pad with LED indicator',
    price: 29.99,
    originalPrice: 39.99,
    images: ['https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400'],
    category: 'Electronics',
    subcategory: 'Accessories',
    brand: { name: 'ChargeTech' },
    rating: 4.3,
    reviewCount: 78,
    stock: 95,
    sku: 'CT-WC-016',
    isBestseller: false,
    isOnSale: true,
    isNew: false,
    isFeatured: false,
    isActive: true,
    tags: ['wireless', 'charger', 'fast', 'charging'],
    colors: ['Black', 'White'],
    sizes: ['One Size'],
    createdAt: '2024-01-19T10:00:00Z',
    updatedAt: '2024-01-19T10:00:00Z',
    specifications: {
      'Power': '15W',
      'Compatibility': 'Qi-enabled devices',
      'LED': 'Charging indicator'
    },
    reviews: []
  },
  {
    id: '17',
    name: 'Sunglasses',
    description: 'UV protection sunglasses with polarized lenses',
    price: 89.99,
    originalPrice: 119.99,
    images: ['https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400'],
    category: 'Accessories',
    subcategory: 'Eyewear',
    brand: { name: 'SunStyle' },
    rating: 4.5,
    reviewCount: 112,
    stock: 65,
    sku: 'SS-SG-017',
    isBestseller: true,
    isOnSale: true,
    isNew: false,
    isFeatured: true,
    isActive: true,
    tags: ['sunglasses', 'uv', 'polarized', 'style'],
    colors: ['Black', 'Brown', 'Blue'],
    sizes: ['One Size'],
    createdAt: '2024-01-07T10:00:00Z',
    updatedAt: '2024-01-07T10:00:00Z',
    specifications: {
      'UV Protection': '100% UVA/UVB',
      'Lens': 'Polarized',
      'Frame': 'Acetate'
    },
    reviews: []
  },
  {
    id: '18',
    name: 'Protein Powder',
    description: 'Whey protein powder for muscle building and recovery',
    price: 39.99,
    originalPrice: 49.99,
    images: ['https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=400'],
    category: 'Sports & Fitness',
    subcategory: 'Supplements',
    brand: { name: 'FitFuel' },
    rating: 4.7,
    reviewCount: 189,
    stock: 120,
    sku: 'FF-PP-018',
    isBestseller: true,
    isOnSale: true,
    isNew: false,
    isFeatured: true,
    isActive: true,
    tags: ['protein', 'whey', 'fitness', 'supplement'],
    colors: ['Chocolate', 'Vanilla', 'Strawberry'],
    sizes: ['2lb'],
    createdAt: '2024-01-04T10:00:00Z',
    updatedAt: '2024-01-04T10:00:00Z',
    specifications: {
      'Protein': '25g per serving',
      'Flavors': 'Chocolate, Vanilla, Strawberry',
      'Size': '2lb container'
    },
    reviews: []
  },
  {
    id: '19',
    name: 'Bluetooth Earbuds',
    description: 'True wireless earbuds with active noise cancellation',
    price: 149.99,
    originalPrice: 199.99,
    images: ['https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=400'],
    category: 'Electronics',
    subcategory: 'Audio',
    brand: { name: 'SoundPro' },
    rating: 4.6,
    reviewCount: 203,
    stock: 45,
    sku: 'SP-BE-019',
    isBestseller: true,
    isOnSale: true,
    isNew: false,
    isFeatured: true,
    isActive: true,
    tags: ['earbuds', 'wireless', 'noise-cancellation', 'bluetooth'],
    colors: ['Black', 'White', 'Blue'],
    sizes: ['One Size'],
    createdAt: '2024-01-21T10:00:00Z',
    updatedAt: '2024-01-21T10:00:00Z',
    specifications: {
      'Battery Life': '6 hours + 18 hours case',
      'Noise Cancellation': 'Active',
      'Connectivity': 'Bluetooth 5.2'
    },
    reviews: []
  },
  {
    id: '20',
    name: 'Hoodie',
    description: 'Comfortable fleece hoodie with kangaroo pocket',
    price: 49.99,
    originalPrice: 69.99,
    images: ['https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400'],
    category: 'Clothing',
    subcategory: 'Tops',
    brand: { name: 'ComfortWear' },
    rating: 4.4,
    reviewCount: 134,
    stock: 85,
    sku: 'CW-HD-020',
    isBestseller: true,
    isOnSale: true,
    isNew: false,
    isFeatured: true,
    isActive: true,
    tags: ['hoodie', 'fleece', 'comfortable', 'casual'],
    colors: ['Black', 'Gray', 'Navy', 'Green'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    createdAt: '2024-01-03T10:00:00Z',
    updatedAt: '2024-01-03T10:00:00Z',
    specifications: {
      'Material': '80% Cotton, 20% Polyester',
      'Style': 'Pullover',
      'Pocket': 'Kangaroo pocket'
    },
    reviews: []
  },
  {
    id: '21',
    name: 'Gaming Mouse Pad',
    description: 'Large RGB gaming mouse pad with smooth surface',
    price: 24.99,
    originalPrice: 34.99,
    images: ['https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400'],
    category: 'Electronics',
    subcategory: 'Gaming',
    brand: { name: 'GameGear' },
    rating: 4.3,
    reviewCount: 67,
    stock: 110,
    sku: 'GG-MP-021',
    isBestseller: false,
    isOnSale: true,
    isNew: true,
    isFeatured: false,
    isActive: true,
    tags: ['gaming', 'mousepad', 'rgb', 'large'],
    colors: ['Black'],
    sizes: ['900x400mm'],
    createdAt: '2024-01-23T10:00:00Z',
    updatedAt: '2024-01-23T10:00:00Z',
    specifications: {
      'Size': '900x400mm',
      'Surface': 'Smooth',
      'RGB': '16.8 million colors'
    },
    reviews: []
  },
  {
    id: '22',
    name: 'Resistance Bands Set',
    description: 'Set of 5 resistance bands for home workouts',
    price: 19.99,
    originalPrice: 29.99,
    images: ['https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400'],
    category: 'Sports & Fitness',
    subcategory: 'Equipment',
    brand: { name: 'FitFlex' },
    rating: 4.5,
    reviewCount: 98,
    stock: 140,
    sku: 'FF-RB-022',
    isBestseller: true,
    isOnSale: true,
    isNew: false,
    isFeatured: true,
    isActive: true,
    tags: ['resistance', 'bands', 'workout', 'fitness'],
    colors: ['Multi-color'],
    sizes: ['5 bands'],
    createdAt: '2024-01-02T10:00:00Z',
    updatedAt: '2024-01-02T10:00:00Z',
    specifications: {
      'Bands': '5 different resistance levels',
      'Material': 'Latex-free',
      'Includes': 'Door anchor and handles'
    },
    reviews: []
  }
]

export function useProducts(options: UseProductsOptions = {}): UseProductsResult {
  const { filter, sort, search, limit = 12, offset = 0 } = options
  
  // State management
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [totalCount, setTotalCount] = useState(0)

  // Memoize the filter object to prevent unnecessary re-renders
  const stableFilter = useMemo(() => filter, [JSON.stringify(filter)])
  
  // Real API call
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      setError(null)
      
      try {
        // Convert frontend filter format to API format
        const apiFilters: ProductFilters = {
          category: stableFilter?.category,
          subcategory: stableFilter?.subcategory,
          brand: stableFilter?.brand,
          minPrice: stableFilter?.minPrice,
          maxPrice: stableFilter?.maxPrice,
          tags: stableFilter?.tags,
          status: stableFilter?.isActive ? 'published' : undefined,
          featured: stableFilter?.isFeatured,
          search: search
        };

        // Convert sort format
        const apiSort: ProductSort = {
          field: sort === 'price' ? 'price' : 
                 sort === 'name' ? 'name' : 
                 sort === 'rating' ? 'rating' : 
                 sort === 'popular' ? 'sales' : 'createdAt',
          order: sort === 'price-low' || sort === 'name' ? 'asc' : 'desc'
        };

        const page = Math.floor(offset / limit) + 1;
        
        const response = await productsApi.getAll(apiFilters, apiSort, page, limit);
        
        if (response.success) {
          // Convert API products to frontend format
          const convertedProducts = response.data.map(convertApiProductToFrontend);
          setProducts(convertedProducts);
          setTotalCount(response.pagination?.total || 0);
        } else {
          throw new Error(response.error || 'Failed to fetch products');
        }
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(err as Error);
        // Fallback to mock data on error
        setProducts(mockProducts.slice(0, limit));
        setTotalCount(mockProducts.length);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [stableFilter, sort, search, limit, offset]);

  // Convert API product to frontend format
  function convertApiProductToFrontend(apiProduct: ApiProduct): Product {
    return {
      id: apiProduct._id,
      name: apiProduct.name,
      slug: apiProduct.slug,
      description: apiProduct.description,
      shortDescription: apiProduct.shortDescription,
      sku: apiProduct.sku,
      price: apiProduct.price,
      originalPrice: apiProduct.originalPrice,
      currency: apiProduct.currency,
      images: apiProduct.images,
      thumbnailImage: apiProduct.thumbnailImage,
      category: {
        id: apiProduct.category._id,
        name: apiProduct.category.name,
        slug: apiProduct.category.slug
      },
      subcategory: apiProduct.subcategory ? {
        id: apiProduct.subcategory._id,
        name: apiProduct.subcategory.name,
        slug: apiProduct.subcategory.slug
      } : undefined,
      brand: apiProduct.brand,
      tags: apiProduct.tags,
      attributes: apiProduct.attributes,
      inventory: {
        quantity: apiProduct.inventory.quantity,
        lowStockThreshold: apiProduct.inventory.lowStockThreshold,
        trackQuantity: apiProduct.inventory.trackQuantity,
        allowBackorder: apiProduct.inventory.allowBackorder
      },
      shipping: {
        weight: apiProduct.shipping.weight,
        dimensions: apiProduct.shipping.dimensions,
        freeShipping: apiProduct.shipping.freeShipping,
        shippingClass: apiProduct.shipping.shippingClass
      },
      seo: apiProduct.seo,
      status: apiProduct.status,
      featured: apiProduct.featured,
      visibility: apiProduct.visibility,
      rating: {
        average: apiProduct.rating.average,
        count: apiProduct.rating.count
      },
      sales: {
        totalSold: apiProduct.sales.totalSold,
        revenue: apiProduct.sales.revenue
      },
      isOnSale: apiProduct.isOnSale,
      saleStartDate: apiProduct.saleStartDate,
      saleEndDate: apiProduct.saleEndDate,
      createdAt: apiProduct.createdAt,
      updatedAt: apiProduct.updatedAt,
      // Frontend-specific fields
      stock: apiProduct.inventory.quantity,
      isNew: new Date(apiProduct.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      isBestseller: apiProduct.sales.totalSold > 100,
      discount: apiProduct.originalPrice ? 
        Math.round(((apiProduct.originalPrice - apiProduct.price) / apiProduct.originalPrice) * 100) : 0,
      reviews: [] // Will be populated separately if needed
    };
  }

  // Legacy code for fallback - keeping for now
  const timer = setTimeout(() => {
      try {
        // Apply filters
        let filteredProducts = [...mockProducts]
        
        if (stableFilter?.category) {
          filteredProducts = filteredProducts.filter(p => 
            p.category.toLowerCase().includes(stableFilter.category!.toLowerCase())
          )
        }
        
        if (stableFilter?.subcategory) {
          filteredProducts = filteredProducts.filter(p => 
            p.subcategory?.toLowerCase().includes(stableFilter.subcategory!.toLowerCase())
          )
        }
        
        if (stableFilter?.brand) {
          filteredProducts = filteredProducts.filter(p => 
            p.brand?.name.toLowerCase().includes(stableFilter.brand!.toLowerCase())
          )
        }
        
        if (stableFilter?.minPrice !== undefined) {
          filteredProducts = filteredProducts.filter(p => p.price >= stableFilter.minPrice!)
        }
        
        if (stableFilter?.maxPrice !== undefined) {
          filteredProducts = filteredProducts.filter(p => p.price <= stableFilter.maxPrice!)
        }
        
        if (stableFilter?.isOnSale) {
          filteredProducts = filteredProducts.filter(p => p.isOnSale)
        }
        
        if (stableFilter?.isNew) {
          filteredProducts = filteredProducts.filter(p => p.isNew)
        }
        
        if (stableFilter?.isBestseller) {
          filteredProducts = filteredProducts.filter(p => p.isBestseller)
        }
        
        if (stableFilter?.isFeatured) {
          filteredProducts = filteredProducts.filter(p => p.isFeatured)
        }
        
        if (stableFilter?.isActive !== undefined) {
          filteredProducts = filteredProducts.filter(p => p.isActive === stableFilter.isActive)
        }
        
        if (stableFilter?.tags && stableFilter.tags.length > 0) {
          filteredProducts = filteredProducts.filter(p => 
            p.tags && p.tags.some(tag => stableFilter.tags!.some(filterTag => 
              tag.toLowerCase().includes(filterTag.toLowerCase())
            ))
          )
        }
        
        if (stableFilter?.colors && stableFilter.colors.length > 0) {
          filteredProducts = filteredProducts.filter(p => 
            p.colors && p.colors.some(color => stableFilter.colors!.some(filterColor => 
              color.toLowerCase().includes(filterColor.toLowerCase())
            ))
          )
        }
        
        if (stableFilter?.sizes && stableFilter.sizes.length > 0) {
          filteredProducts = filteredProducts.filter(p => 
            p.sizes && p.sizes.some(size => stableFilter.sizes!.some(filterSize => 
              size.toLowerCase().includes(filterSize.toLowerCase())
            ))
          )
        }
        
        // Apply search
        if (search) {
          const searchLower = search.toLowerCase()
          filteredProducts = filteredProducts.filter(p => 
            p.name.toLowerCase().includes(searchLower) ||
            p.description.toLowerCase().includes(searchLower) ||
            p.category.toLowerCase().includes(searchLower) ||
            p.subcategory?.toLowerCase().includes(searchLower) ||
            p.brand?.name.toLowerCase().includes(searchLower) ||
            (p.tags && p.tags.some(tag => tag.toLowerCase().includes(searchLower)))
          )
        }
        
        // Apply sorting
        if (sort) {
          switch (sort) {
            case 'price_asc':
              filteredProducts.sort((a, b) => a.price - b.price)
              break
            case 'price_desc':
              filteredProducts.sort((a, b) => b.price - a.price)
              break
            case 'name_asc':
              filteredProducts.sort((a, b) => a.name.localeCompare(b.name))
              break
            case 'name_desc':
              filteredProducts.sort((a, b) => b.name.localeCompare(a.name))
              break
            case 'rating_desc':
              filteredProducts.sort((a, b) => b.rating - a.rating)
              break
            case 'created_desc':
              filteredProducts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              break
            case 'created_asc':
              filteredProducts.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
              break
            case 'popular':
              filteredProducts.sort((a, b) => b.reviewCount - a.reviewCount)
              break
            default:
              // Default sorting by featured/created
              filteredProducts.sort((a, b) => {
                if (a.isFeatured && !b.isFeatured) return -1
                if (!a.isFeatured && b.isFeatured) return 1
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              })
          }
        }
        
        // Apply pagination
        const startIndex = offset
        const endIndex = Math.min(startIndex + limit, filteredProducts.length)
        const paginatedProducts = filteredProducts.slice(startIndex, endIndex)
        
        setProducts(paginatedProducts)
        setTotalCount(filteredProducts.length)
        setLoading(false)
      } catch (err) {
        setError(err as Error)
        setLoading(false)
      }
      }, 500) // Reasonable delay for API simulation
    
    return () => clearTimeout(timer)
  }, [stableFilter, sort, search, limit, offset])

  // Calculate pagination
  const hasMore = (offset + limit) < totalCount

  const fetchMore = () => {
    // In a real implementation, this would fetch more data from the API
    console.log('Fetch more products')
  }

  const refetch = () => {
    // In a real implementation, this would refetch data from the API
    console.log('Refetch products')
  }

  return {
    products,
    loading,
    error,
    totalCount,
    hasMore,
    fetchMore,
    refetch,
  }
}

interface UseProductOptions {
  id: string
}

interface UseProductResult {
  product: Product | null
  loading: boolean
  error: Error | null
  refetch: () => void
}

export function useProduct(id: string): UseProductResult {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    
    const timer = setTimeout(() => {
      try {
        const foundProduct = mockProducts.find(p => p.id === id)
        setProduct(foundProduct || null)
        setLoading(false)
      } catch (err) {
        setError(err as Error)
        setLoading(false)
      }
    }, 300)
    
    return () => clearTimeout(timer)
  }, [id])

  const refetch = () => {
    console.log('Refetch product')
  }

  return {
    product,
    loading,
    error,
    refetch,
  }
}

interface UseProductSearchOptions {
  query: string
  limit?: number
}

interface UseProductSearchResult {
  products: Product[]
  loading: boolean
  error: Error | null
}

export function useProductSearch(options: UseProductSearchOptions): UseProductSearchResult {
  const { query, limit = 10 } = options
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!query) {
      setProducts([])
      return
    }

    setLoading(true)
    setError(null)
    
    const timer = setTimeout(() => {
      try {
        const searchLower = query.toLowerCase()
        const filteredProducts = mockProducts.filter(p => 
          p.name.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower) ||
          p.category.toLowerCase().includes(searchLower)
        ).slice(0, limit)
        
        setProducts(filteredProducts)
        setLoading(false)
      } catch (err) {
        setError(err as Error)
        setLoading(false)
      }
    }, 100)
    
    return () => clearTimeout(timer)
  }, [query, limit])

  return {
    products,
    loading,
    error,
  }
}

interface UseProductMutationsResult {
  createProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Product>
  updateProduct: (id: string, updates: Partial<Product>) => Promise<Product>
  deleteProduct: (id: string) => Promise<boolean>
}

export function useProductMutations(): UseProductMutationsResult {
  const createProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> => {
    // Mock implementation
    const newProduct: Product = {
      ...productData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    return newProduct
  }

  const updateProduct = async (id: string, updates: Partial<Product>): Promise<Product> => {
    // Mock implementation
    const existingProduct = mockProducts.find(p => p.id === id)
    if (!existingProduct) {
      throw new Error('Product not found')
    }
    return { ...existingProduct, ...updates, updatedAt: new Date().toISOString() }
  }

  const deleteProduct = async (id: string): Promise<boolean> => {
    // Mock implementation
    return true
  }

  return {
    createProduct,
    updateProduct,
    deleteProduct,
  }
}

// Product filters hook
interface UseProductFiltersResult {
  filters: UseProductsOptions['filter']
  sort: string
  updateFilter: (filter: Partial<UseProductsOptions['filter']>) => void
  updateSort: (sort: string) => void
  clearFilters: () => void
}

export function useProductFilters(): UseProductFiltersResult {
  const [filters, setFilters] = useState<UseProductsOptions['filter']>({})
  const [sort, setSort] = useState('featured')

  const updateFilter = (newFilter: Partial<UseProductsOptions['filter']>) => {
    setFilters(prev => ({ ...prev, ...newFilter }))
  }

  const updateSort = (newSort: string) => {
    setSort(newSort)
  }

  const clearFilters = () => {
    setFilters({})
    setSort('featured')
  }

  return {
    filters,
    sort,
    updateFilter,
    updateSort,
    clearFilters,
  }
}