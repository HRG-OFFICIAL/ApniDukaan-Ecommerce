# ApniDukaan Development Guide

## Overview

This guide provides comprehensive information for developers working on the ApniDukaan e-commerce platform, including setup, coding standards, testing, and contribution guidelines.

## Table of Contents

1. [Development Setup](#development-setup)
2. [Project Architecture](#project-architecture)
3. [Coding Standards](#coding-standards)
4. [Testing Guidelines](#testing-guidelines)
5. [API Development](#api-development)
6. [Frontend Development](#frontend-development)
7. [Database Development](#database-development)
8. [Debugging](#debugging)
9. [Performance Optimization](#performance-optimization)
10. [Contributing](#contributing)

## Development Setup

### Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** 9+ or **yarn** 1.22+
- **MongoDB** 6.0+
- **Redis** 6.0+
- **Docker** & **Docker Compose** (optional)
- **Git** 2.30+

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/apnidukaan-ecommerce.git
   cd apnidukaan-ecommerce
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install frontend dependencies
   cd frontend && npm install && cd ..
   
   # Install shared dependencies
   cd backend/shared && npm install && cd ../..
   
   # Install service dependencies
   for service in backend/*/; do
     if [ -f "$service/package.json" ]; then
       cd "$service" && npm install && cd ../..
     fi
   done
   ```

3. **Environment setup**
   ```bash
   # Automated setup
   npm run setup:env
   
   # Or manual setup
   cp env.example .env
   cp frontend/.env.local.example frontend/.env.local
   ```

4. **Start development servers**
   ```bash
   # Start all services
   npm start
   
   # Or start individually
   npm run dev:frontend    # Frontend only
   npm run dev:backend     # Backend services only
   ```

### IDE Setup

#### VS Code (Recommended)
Install the following extensions:
- **ES7+ React/Redux/React-Native snippets**
- **TypeScript Importer**
- **Tailwind CSS IntelliSense**
- **Prettier - Code formatter**
- **ESLint**
- **Thunder Client** (API testing)
- **MongoDB for VS Code**

#### VS Code Settings
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "tailwindCSS.includeLanguages": {
    "typescript": "typescript",
    "typescriptreact": "typescriptreact"
  }
}
```

## Project Architecture

### Microservices Architecture

The platform follows a microservices architecture with the following services:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │   Services      │
│   (Next.js)     │◄──►│   (Express)     │◄──►│   (Express)     │
│   Port: 3000    │    │   Port: 4000    │    │   Ports: 4001+  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Static Files  │    │   Load Balancer │    │   Databases     │
│   (CDN)         │    │   (Nginx)       │    │   (MongoDB)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Service Communication

- **Synchronous**: REST APIs and GraphQL
- **Asynchronous**: Kafka message queue
- **Caching**: Redis for session and data caching
- **File Storage**: Local filesystem or AWS S3

### Data Flow

1. **User Request** → Frontend (Next.js)
2. **API Call** → API Gateway (Express)
3. **Service Routing** → Specific Microservice
4. **Database Query** → MongoDB
5. **Cache Check** → Redis
6. **Response** → User

## Coding Standards

### TypeScript Guidelines

#### Type Definitions
```typescript
// Use interfaces for object shapes
interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

// Use types for unions and primitives
type Status = 'pending' | 'completed' | 'cancelled';
type ID = string | number;

// Use enums for constants
enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}
```

#### Function Definitions
```typescript
// Use explicit return types for public functions
export const getUserById = async (id: string): Promise<User | null> => {
  // Implementation
};

// Use arrow functions for simple operations
const formatPrice = (price: number): string => `$${price.toFixed(2)}`;

// Use async/await instead of Promises
const fetchUser = async (id: string): Promise<User> => {
  try {
    const response = await api.get(`/users/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch user: ${error.message}`);
  }
};
```

### React Guidelines

#### Component Structure
```typescript
// Use functional components with hooks
interface ProductCardProps {
  product: Product;
  onAddToCart: (productId: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart
}) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleAddToCart = async () => {
    setIsLoading(true);
    try {
      await onAddToCart(product.id);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="product-card">
      {/* Component JSX */}
    </div>
  );
};
```

#### Hooks Usage
```typescript
// Custom hooks for business logic
export const useProducts = (filters: ProductFilters) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await productService.getProducts(filters);
        setProducts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [filters]);

  return { products, loading, error };
};
```

### API Guidelines

#### REST API Structure
```typescript
// Use consistent naming conventions
GET    /api/products           // Get all products
GET    /api/products/:id       // Get product by ID
POST   /api/products           // Create product
PUT    /api/products/:id       // Update product
DELETE /api/products/:id       // Delete product

// Use proper HTTP status codes
200 OK           // Success
201 Created      // Resource created
400 Bad Request  // Invalid input
401 Unauthorized // Authentication required
403 Forbidden    // Insufficient permissions
404 Not Found    // Resource not found
500 Internal Server Error // Server error
```

#### Error Handling
```typescript
// Use consistent error response format
interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// Throw appropriate errors
throw new BadRequestError('Invalid product data', {
  field: 'price',
  message: 'Price must be greater than 0'
});

// Handle errors consistently
try {
  const result = await someOperation();
  return result;
} catch (error) {
  logger.error('Operation failed', { error, context });
  throw new InternalServerError('Operation failed');
}
```

### Database Guidelines

#### Mongoose Schemas
```typescript
// Use clear schema definitions
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  inventory: {
    type: Number,
    default: 0,
    min: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add indexes for performance
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, price: 1 });
productSchema.index({ createdAt: -1 });
```

## Testing Guidelines

### Unit Testing

#### Frontend Testing
```typescript
// Component testing with React Testing Library
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from './ProductCard';

describe('ProductCard', () => {
  const mockProduct = {
    id: '1',
    name: 'Test Product',
    price: 99.99,
    image: 'test.jpg'
  };

  it('renders product information', () => {
    render(<ProductCard product={mockProduct} onAddToCart={jest.fn()} />);
    
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$99.99')).toBeInTheDocument();
  });

  it('calls onAddToCart when button is clicked', () => {
    const mockOnAddToCart = jest.fn();
    render(<ProductCard product={mockProduct} onAddToCart={mockOnAddToCart} />);
    
    fireEvent.click(screen.getByText('Add to Cart'));
    expect(mockOnAddToCart).toHaveBeenCalledWith('1');
  });
});
```

#### Backend Testing
```typescript
// Service testing with Jest
import { ProductService } from '../services/ProductService';
import { Product } from '../models/Product';

jest.mock('../models/Product');

describe('ProductService', () => {
  let productService: ProductService;

  beforeEach(() => {
    productService = new ProductService();
  });

  describe('createProduct', () => {
    it('should create a product successfully', async () => {
      const productData = {
        name: 'Test Product',
        price: 99.99,
        category: 'electronics'
      };

      const mockProduct = { ...productData, id: '1' };
      (Product.create as jest.Mock).mockResolvedValue(mockProduct);

      const result = await productService.createProduct(productData);

      expect(result).toEqual(mockProduct);
      expect(Product.create).toHaveBeenCalledWith(productData);
    });
  });
});
```

### Integration Testing

#### API Testing
```typescript
// API endpoint testing
import request from 'supertest';
import app from '../app';

describe('Product API', () => {
  describe('GET /api/products', () => {
    it('should return products with pagination', async () => {
      const response = await request(app)
        .get('/api/products?page=1&limit=10')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.data).toHaveLength(10);
    });
  });

  describe('POST /api/products', () => {
    it('should create a product with valid data', async () => {
      const productData = {
        name: 'Test Product',
        price: 99.99,
        category: 'electronics'
      };

      const response = await request(app)
        .post('/api/products')
        .send(productData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(productData.name);
    });
  });
});
```

### E2E Testing

#### Playwright Testing
```typescript
// E2E test with Playwright
import { test, expect } from '@playwright/test';

test('user can add product to cart', async ({ page }) => {
  await page.goto('/products');
  
  // Click on first product
  await page.click('[data-testid="product-card"]:first-child');
  
  // Add to cart
  await page.click('[data-testid="add-to-cart"]');
  
  // Verify cart count
  const cartCount = await page.textContent('[data-testid="cart-count"]');
  expect(cartCount).toBe('1');
  
  // Go to cart page
  await page.click('[data-testid="cart-link"]');
  
  // Verify product in cart
  await expect(page.locator('[data-testid="cart-item"]')).toBeVisible();
});
```

## API Development

### Creating New Endpoints

1. **Define the route**
   ```typescript
   // routes/products.ts
   router.get('/products', getProducts);
   router.post('/products', createProduct);
   ```

2. **Create the controller**
   ```typescript
   // controllers/productController.ts
   export const getProducts = async (req: Request, res: Response) => {
     try {
       const { page = 1, limit = 10, category, sort } = req.query;
       const products = await productService.getProducts({
         page: Number(page),
         limit: Number(limit),
         category: category as string,
         sort: sort as string
       });
       res.json(products);
     } catch (error) {
       res.status(500).json({ error: error.message });
     }
   };
   ```

3. **Implement the service**
   ```typescript
   // services/ProductService.ts
   export class ProductService {
     async getProducts(filters: ProductFilters): Promise<Product[]> {
       const query = this.buildQuery(filters);
       const products = await Product.find(query)
         .populate('category')
         .sort(filters.sort)
         .limit(filters.limit)
         .skip((filters.page - 1) * filters.limit);
       return products;
     }
   }
   ```

4. **Add validation**
   ```typescript
   // middleware/validation.ts
   import { body, query, validationResult } from 'express-validator';

   export const validateProduct = [
     body('name').notEmpty().withMessage('Name is required'),
     body('price').isNumeric().withMessage('Price must be a number'),
     body('category').isMongoId().withMessage('Invalid category ID'),
     (req: Request, res: Response, next: NextFunction) => {
       const errors = validationResult(req);
       if (!errors.isEmpty()) {
         return res.status(400).json({ errors: errors.array() });
       }
       next();
     }
   ];
   ```

### GraphQL Development

#### Schema Definition
```typescript
// schemas/productSchema.ts
export const productTypeDefs = `
  type Product {
    id: ID!
    name: String!
    price: Float!
    description: String
    category: Category!
    inventory: Int!
    images: [String!]!
    createdAt: String!
    updatedAt: String!
  }

  type Query {
    products(filter: ProductFilter, pagination: PaginationInput): ProductConnection!
    product(id: ID!): Product
  }

  type Mutation {
    createProduct(input: CreateProductInput!): Product!
    updateProduct(id: ID!, input: UpdateProductInput!): Product!
    deleteProduct(id: ID!): Boolean!
  }
`;
```

#### Resolver Implementation
```typescript
// resolvers/productResolvers.ts
export const productResolvers = {
  Query: {
    products: async (_, { filter, pagination }) => {
      return await productService.getProducts(filter, pagination);
    },
    product: async (_, { id }) => {
      return await productService.getProductById(id);
    }
  },
  Mutation: {
    createProduct: async (_, { input }) => {
      return await productService.createProduct(input);
    }
  }
};
```

## Frontend Development

### Component Development

#### Creating a New Component
```typescript
// components/ui/Button.tsx
import React from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        loading && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner className="mr-2" />}
      {children}
    </button>
  );
};
```

#### Using Context for State Management
```typescript
// contexts/CartContext.tsx
import React, { createContext, useContext, useReducer } from 'react';

interface CartItem {
  id: string;
  product: Product;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
}

type CartAction = 
  | { type: 'ADD_ITEM'; payload: { product: Product; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: { productId: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'CLEAR_CART' };

const CartContext = createContext<{
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
} | null>(null);

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM':
      // Implementation
      break;
    case 'REMOVE_ITEM':
      // Implementation
      break;
    // ... other cases
  }
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    total: 0,
    itemCount: 0
  });

  return (
    <CartContext.Provider value={{ state, dispatch }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
```

### API Integration

#### Creating API Services
```typescript
// services/apiService.ts
class ApiService {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  setToken(token: string) {
    this.token = token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers
      },
      ...options
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
}

export const apiService = new ApiService(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000');
```

## Database Development

### Schema Design

#### Product Schema
```typescript
// models/Product.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: mongoose.Types.ObjectId;
  subcategory?: mongoose.Types.ObjectId;
  brand: string;
  sku: string;
  inventory: number;
  images: string[];
  specifications: Record<string, any>;
  tags: string[];
  isActive: boolean;
  isFeatured: boolean;
  averageRating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  originalPrice: {
    type: Number,
    min: 0
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  subcategory: {
    type: Schema.Types.ObjectId,
    ref: 'Subcategory'
  },
  brand: {
    type: String,
    required: true,
    trim: true
  },
  sku: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  inventory: {
    type: Number,
    default: 0,
    min: 0
  },
  images: [{
    type: String,
    required: true
  }],
  specifications: {
    type: Map,
    of: Schema.Types.Mixed
  },
  tags: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ price: 1 });
productSchema.index({ averageRating: -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ isFeatured: 1, isActive: 1 });

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
  if (this.originalPrice && this.originalPrice > this.price) {
    return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
  }
  return 0;
});

export const Product = mongoose.model<IProduct>('Product', productSchema);
```

### Database Migrations

#### Creating Migrations
```typescript
// migrations/001_add_product_indexes.ts
import { MongoClient } from 'mongodb';

export async function up(client: MongoClient) {
  const db = client.db('apnidukaan');
  const products = db.collection('products');
  
  // Add indexes
  await products.createIndex({ name: 'text', description: 'text' });
  await products.createIndex({ category: 1, isActive: 1 });
  await products.createIndex({ price: 1 });
}

export async function down(client: MongoClient) {
  const db = client.db('apnidukaan');
  const products = db.collection('products');
  
  // Drop indexes
  await products.dropIndex({ name: 'text', description: 'text' });
  await products.dropIndex({ category: 1, isActive: 1 });
  await products.dropIndex({ price: 1 });
}
```

## Debugging

### Frontend Debugging

#### React Developer Tools
1. Install React Developer Tools browser extension
2. Use `console.log` for debugging
3. Use React DevTools Profiler for performance debugging

#### Debugging Hooks
```typescript
// Custom debugging hook
export const useDebug = (value: any, label?: string) => {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(label || 'Debug:', value);
    }
  }, [value, label]);
};

// Usage
const MyComponent = () => {
  const [count, setCount] = useState(0);
  useDebug(count, 'Count value');
  
  return <div>{count}</div>;
};
```

### Backend Debugging

#### Logging
```typescript
// utils/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

export default logger;
```

#### Debugging Database Queries
```typescript
// Enable Mongoose debugging
mongoose.set('debug', process.env.NODE_ENV === 'development');

// Log queries
const products = await Product.find({ category: 'electronics' })
  .explain('executionStats');
console.log('Query execution stats:', products);
```

## Performance Optimization

### Frontend Optimization

#### Code Splitting
```typescript
// Lazy load components
const LazyComponent = React.lazy(() => import('./LazyComponent'));

// Use with Suspense
<Suspense fallback={<LoadingSpinner />}>
  <LazyComponent />
</Suspense>
```

#### Image Optimization
```typescript
// Use Next.js Image component
import Image from 'next/image';

<Image
  src="/product-image.jpg"
  alt="Product"
  width={300}
  height={200}
  priority={isAboveFold}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

#### Memoization
```typescript
// Memoize expensive calculations
const expensiveValue = useMemo(() => {
  return products.reduce((total, product) => total + product.price, 0);
}, [products]);

// Memoize callbacks
const handleClick = useCallback((id: string) => {
  onProductClick(id);
}, [onProductClick]);
```

### Backend Optimization

#### Database Optimization
```typescript
// Use proper indexes
productSchema.index({ category: 1, price: 1 });

// Use projection to limit fields
const products = await Product.find({ category: 'electronics' })
  .select('name price images')
  .limit(20);

// Use aggregation for complex queries
const stats = await Product.aggregate([
  { $match: { category: 'electronics' } },
  { $group: { _id: '$brand', count: { $sum: 1 }, avgPrice: { $avg: '$price' } } }
]);
```

#### Caching
```typescript
// Redis caching
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export const getCachedProducts = async (key: string) => {
  const cached = await redis.get(key);
  if (cached) {
    return JSON.parse(cached);
  }
  return null;
};

export const setCachedProducts = async (key: string, data: any, ttl = 3600) => {
  await redis.setex(key, ttl, JSON.stringify(data));
};
```

## Contributing

### Git Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

2. **Make your changes**
   ```bash
   git add .
   git commit -m "Add amazing feature"
   ```

3. **Push and create PR**
   ```bash
   git push origin feature/amazing-feature
   ```

### Code Review Process

1. **Self-review** your code before submitting
2. **Write tests** for new functionality
3. **Update documentation** if needed
4. **Ensure all tests pass**
5. **Request review** from team members

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] All tests pass
```

---

*Last updated: January 2024*
