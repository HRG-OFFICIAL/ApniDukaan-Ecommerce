// Mock data service for development when backend is not available

export interface MockProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: string;
  subcategory?: string;
  brand?: string;
  stock: number;
  sku: string;
  isActive: boolean;
  isFeatured: boolean;
  isOnSale: boolean;
  isBestseller: boolean;
  isNew: boolean;
  rating: number;
  reviewCount: number;
  tags: string[];
  colors: string[];
  sizes: string[];
  createdAt: string;
  updatedAt: string;
  specifications?: Record<string, string | number | boolean>;
}

export interface MockOrder {
  id: string;
  orderNumber: string;
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
  total: number;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  customer: {
    id: string;
    name: string;
    email: string;
  };
  items: Array<{
    id: string;
    product: {
      id: string;
      name: string;
      images: string[];
    };
    quantity: number;
    price: number;
  }>;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  payment: {
    method: string;
    status: string;
    transactionId?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface MockUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'MODERATOR' | 'USER' | 'GUEST';
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
  avatar?: string;
  phone?: string;
}

export const mockProducts: MockProduct[] = [
  {
    id: '1',
    name: 'Wireless Bluetooth Headphones',
    description: 'High-quality wireless headphones with noise cancellation',
    price: 199.99,
    originalPrice: 249.99,
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'],
    category: 'Electronics',
    subcategory: 'Audio',
    brand: 'TechSound',
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
    }
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
    brand: 'FitTech',
    rating: 4.3,
    reviewCount: 89,
    stock: 25,
    sku: 'SF-WT-002',
    isBestseller: false,
    isOnSale: true,
    isNew: true,
    isFeatured: true,
    isActive: true,
    tags: ['fitness', 'smartwatch', 'health'],
    colors: ['Black', 'Silver', 'Rose Gold'],
    sizes: ['Small', 'Medium', 'Large'],
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2024-01-20T10:00:00Z',
    specifications: {
      'Battery Life': '7 days',
      'Water Resistance': '50m',
      'Display': '1.4" AMOLED'
    }
  },
  {
    id: '3',
    name: 'Organic Cotton T-Shirt',
    description: 'Comfortable organic cotton t-shirt in various colors',
    price: 29.99,
    originalPrice: 39.99,
    images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400'],
    category: 'Clothing',
    subcategory: 'Tops',
    brand: 'EcoWear',
    rating: 4.7,
    reviewCount: 156,
    stock: 100,
    sku: 'OC-TS-003',
    isBestseller: true,
    isOnSale: true,
    isNew: false,
    isFeatured: false,
    isActive: true,
    tags: ['organic', 'cotton', 'sustainable'],
    colors: ['White', 'Black', 'Navy', 'Green'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-10T10:00:00Z',
    specifications: {
      'Material': '100% Organic Cotton',
      'Care': 'Machine Wash Cold',
      'Origin': 'Made in USA'
    }
  },
  {
    id: '4',
    name: 'Premium Coffee Beans',
    description: 'Single-origin coffee beans from Ethiopia',
    price: 24.99,
    originalPrice: 29.99,
    images: ['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400'],
    category: 'Food & Beverages',
    subcategory: 'Coffee',
    brand: 'CoffeeMaster',
    rating: 4.8,
    reviewCount: 203,
    stock: 75,
    sku: 'PC-CB-004',
    isBestseller: true,
    isOnSale: true,
    isNew: false,
    isFeatured: true,
    isActive: true,
    tags: ['coffee', 'premium', 'single-origin'],
    colors: ['Brown'],
    sizes: ['250g', '500g', '1kg'],
    createdAt: '2024-01-05T10:00:00Z',
    updatedAt: '2024-01-05T10:00:00Z',
    specifications: {
      'Origin': 'Ethiopia',
      'Roast Level': 'Medium',
      'Caffeine': 'High'
    }
  },
  {
    id: '5',
    name: 'Gaming Mechanical Keyboard',
    description: 'RGB mechanical keyboard with customizable switches',
    price: 149.99,
    originalPrice: 179.99,
    images: ['https://picsum.photos/400/400?random=5'],
    category: 'Electronics',
    subcategory: 'Gaming',
    brand: 'GameTech',
    rating: 4.6,
    reviewCount: 94,
    stock: 30,
    sku: 'GM-KB-005',
    isBestseller: false,
    isOnSale: true,
    isNew: true,
    isFeatured: false,
    isActive: true,
    tags: ['gaming', 'mechanical', 'rgb'],
    colors: ['Black', 'White'],
    sizes: ['Full Size', 'TKL'],
    createdAt: '2024-01-25T10:00:00Z',
    updatedAt: '2024-01-25T10:00:00Z',
    specifications: {
      'Switch Type': 'Cherry MX Blue',
      'Backlight': 'RGB',
      'Connectivity': 'USB-C'
    }
  }
];

export const mockOrders: MockOrder[] = [
  {
    id: '1',
    orderNumber: 'ORD-2024-001',
    status: 'DELIVERED',
    total: 229.98,
    subtotal: 199.99,
    tax: 16.00,
    shipping: 9.99,
    discount: 0,
    customer: {
      id: '1',
      name: 'John Doe',
      email: 'john.doe@example.com'
    },
    items: [
      {
        id: '1',
        product: {
          id: '1',
          name: 'Wireless Bluetooth Headphones',
          images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400']
        },
        quantity: 1,
        price: 199.99
      }
    ],
    shippingAddress: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA'
    },
    payment: {
      method: 'CREDIT_CARD',
      status: 'COMPLETED',
      transactionId: 'txn_123456789'
    },
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-16T14:30:00Z'
  },
  {
    id: '2',
    orderNumber: 'ORD-2024-002',
    status: 'SHIPPED',
    total: 329.98,
    subtotal: 299.99,
    tax: 24.00,
    shipping: 5.99,
    discount: 0,
    customer: {
      id: '2',
      name: 'Jane Smith',
      email: 'jane.smith@example.com'
    },
    items: [
      {
        id: '2',
        product: {
          id: '2',
          name: 'Smart Fitness Watch',
          images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400']
        },
        quantity: 1,
        price: 299.99
      }
    ],
    shippingAddress: {
      street: '456 Oak Ave',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90210',
      country: 'USA'
    },
    payment: {
      method: 'PAYPAL',
      status: 'COMPLETED',
      transactionId: 'pp_987654321'
    },
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2024-01-21T09:15:00Z'
  }
];

export const mockUsers: MockUser[] = [
  {
    id: '1',
    email: 'admin@apnidukaan.com',
    name: 'Admin User',
    role: 'ADMIN',
    isActive: true,
    createdAt: '2024-01-01T10:00:00Z',
    lastLoginAt: '2024-01-25T15:30:00Z',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
    phone: '+1-555-0123'
  },
  {
    id: '2',
    email: 'john.doe@example.com',
    name: 'John Doe',
    role: 'USER',
    isActive: true,
    createdAt: '2024-01-10T10:00:00Z',
    lastLoginAt: '2024-01-24T12:00:00Z',
    phone: '+1-555-0124'
  },
  {
    id: '3',
    email: 'jane.smith@example.com',
    name: 'Jane Smith',
    role: 'USER',
    isActive: true,
    createdAt: '2024-01-15T10:00:00Z',
    lastLoginAt: '2024-01-23T18:45:00Z',
    phone: '+1-555-0125'
  },
  {
    id: '4',
    email: 'moderator@apnidukaan.com',
    name: 'Moderator User',
    role: 'MODERATOR',
    isActive: true,
    createdAt: '2024-01-05T10:00:00Z',
    lastLoginAt: '2024-01-25T10:00:00Z',
    phone: '+1-555-0126'
  }
];

export const mockCategories = [
  { id: '1', name: 'Electronics', slug: 'electronics', description: 'Electronic devices and gadgets', productCount: 3 },
  { id: '2', name: 'Clothing', slug: 'clothing', description: 'Fashion and apparel', productCount: 1 },
  { id: '3', name: 'Food & Beverages', slug: 'food-beverages', description: 'Food and drink items', productCount: 1 }
];

export const mockDashboardStats = {
  totalOrders: 2,
  totalRevenue: 559.96,
  totalUsers: 4,
  totalProducts: 5,
  recentOrders: mockOrders.slice(0, 2),
  topProducts: [
    { id: '1', name: 'Wireless Bluetooth Headphones', sales: 15, revenue: 2999.85 },
    { id: '2', name: 'Smart Fitness Watch', sales: 8, revenue: 2399.92 },
    { id: '3', name: 'Organic Cotton T-Shirt', sales: 25, revenue: 749.75 }
  ]
};
