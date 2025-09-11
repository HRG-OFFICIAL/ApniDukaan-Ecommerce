# Shopping Cart Service

A comprehensive, scalable shopping cart service for the ApniDukaan e-commerce platform. This microservice handles cart management for both guest and authenticated users with Redis-based session storage, MongoDB persistence, and advanced features like cart merging, validation, and abandoned cart recovery.

## 🚀 Features

### Core Cart Operations
- **Add/Remove/Update Items**: Full CRUD operations on cart items
- **Quantity Management**: Update quantities with inventory validation
- **Cart Clearing**: Complete cart reset functionality
- **Real-time Totals**: Automatic calculation of subtotals, taxes, shipping, and totals

### Advanced Features
- **Dual Storage System**: Redis for guest sessions, MongoDB for persistent carts
- **Cart Merging**: Intelligent merging of guest and user carts upon authentication
- **Discount Management**: Support for percentage, fixed, and shipping discounts
- **Cart Validation**: Real-time product availability and pricing validation
- **Abandoned Cart Recovery**: Automatic detection and tracking of abandoned carts
- **Session Management**: Secure session handling with configurable TTL

### Analytics & Monitoring
- **Event System**: Real-time cart events for analytics integration
- **Performance Monitoring**: Request logging and performance metrics
- **Health Checks**: Comprehensive health monitoring endpoints
- **Cleanup Jobs**: Automated expired cart cleanup

## 🏗️ Architecture

### Technology Stack
- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: MongoDB (persistent storage)
- **Cache**: Redis (session storage)
- **Testing**: Jest + Supertest
- **Validation**: Express-validator

### Service Structure
```
cart-service/
├── src/
│   ├── models/          # MongoDB schemas and models
│   ├── services/        # Business logic layer
│   ├── routes/          # REST API endpoints
│   ├── types/           # TypeScript interfaces
│   ├── middleware/      # Custom middleware
│   ├── utils/           # Utility functions
│   └── tests/           # Test suites
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

## 🔧 API Endpoints

### Cart Operations
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `GET` | `/api/cart` | Get current cart | Public/Private |
| `GET` | `/api/cart/summary` | Get cart summary | Public/Private |
| `POST` | `/api/cart/items` | Add item to cart | Public/Private |
| `PUT` | `/api/cart/items/:productId/:variantId?` | Update item quantity | Public/Private |
| `DELETE` | `/api/cart/items/:productId/:variantId?` | Remove item from cart | Public/Private |
| `DELETE` | `/api/cart` | Clear entire cart | Public/Private |

### Discount Operations
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `POST` | `/api/cart/discount` | Apply discount code | Public/Private |
| `DELETE` | `/api/cart/discount` | Remove discount | Public/Private |

### Advanced Operations
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `POST` | `/api/cart/validate` | Validate cart items | Public/Private |
| `POST` | `/api/cart/merge` | Merge guest & user carts | Private |
| `GET` | `/api/cart/abandoned` | Get abandoned carts | Admin |
| `POST` | `/api/cart/cleanup` | Clean expired carts | Admin |
| `PATCH` | `/api/cart/:cartId/status` | Update cart status | Admin |

### System Operations
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `GET` | `/health` | Health check | Public |

## 📊 Data Models

### Cart Model
```typescript
interface ICart {
  _id: string;
  userId?: string;           // For authenticated users
  sessionId?: string;        // For guest users
  items: ICartItem[];
  totals: ICartTotals;
  discount?: ICartDiscount;
  currency: string;
  status: 'active' | 'abandoned' | 'converted' | 'expired';
  metadata?: object;
  expiresAt?: Date;         // TTL for guest carts
  createdAt: Date;
  updatedAt: Date;
}
```

### Cart Item Model
```typescript
interface ICartItem {
  productId: string;
  variantId?: string;
  quantity: number;
  price: number;
  originalPrice: number;
  name: string;
  image?: string;
  sku: string;
  weight?: number;
  attributes?: object;
  addedAt: Date;
  updatedAt: Date;
}
```

### Cart Totals Model
```typescript
interface ICartTotals {
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
}
```

## 🚀 Quick Start

### Prerequisites
- Node.js (>= 18.0.0)
- MongoDB (>= 5.0)
- Redis (>= 6.0)

### Installation
```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env

# Build TypeScript
npm run build

# Start development server
npm run dev
```

### Environment Variables
```env
# Server Configuration
PORT=4003
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb+srv://userservice-dev:OELp6t3K63rHhKgJ@cluster0.0ezsixh.mongodb.net/apnidukaan_cart?retryWrites=true&w=majority&appName=Cluster0
REDIS_URL=redis://localhost:6379

# Session Configuration
SESSION_SECRET=your-session-secret-key
GUEST_CART_TTL_HOURS=24

# Business Configuration
TAX_RATE=0.08
FREE_SHIPPING_THRESHOLD=50.00
BASE_SHIPPING_COST=5.99

# Cleanup Configuration
CLEANUP_INTERVAL_HOURS=6

# Frontend Configuration
FRONTEND_URL=http://localhost:3000
```

## 🔍 Usage Examples

### Add Item to Cart
```bash
curl -X POST http://localhost:4003/api/cart/items \
  -H "Content-Type: application/json" \
  -H "X-Session-ID: guest-session-123" \
  -d '{
    "productId": "507f1f77bcf86cd799439011",
    "quantity": 2,
    "attributes": {
      "size": "L",
      "color": "Blue"
    }
  }'
```

### Update Item Quantity
```bash
curl -X PUT http://localhost:4003/api/cart/items/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -H "X-Session-ID: guest-session-123" \
  -d '{
    "quantity": 3
  }'
```

### Apply Discount Code
```bash
curl -X POST http://localhost:4003/api/cart/discount \
  -H "Content-Type: application/json" \
  -H "X-User-ID: user123" \
  -d '{
    "code": "SAVE10"
  }'
```

### Merge Guest Cart with User Cart
```bash
curl -X POST http://localhost:4003/api/cart/merge \
  -H "Content-Type: application/json" \
  -H "X-User-ID: user123" \
  -H "X-Session-ID: guest-session-123" \
  -d '{
    "strategy": "combine_quantities",
    "keepGuestCart": false
  }'
```

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Test Coverage
The service includes comprehensive test coverage for:
- Cart model operations and validations
- Service business logic and error handling
- API endpoint functionality and edge cases
- Cart merging strategies and scenarios
- Discount calculations and applications
- Session management and persistence

## 🔄 Cart Lifecycle

### Guest User Flow
1. **Cart Creation**: Automatic creation on first item addition
2. **Session Storage**: Cart stored in Redis with TTL
3. **Item Management**: Add/update/remove items
4. **Validation**: Real-time inventory and pricing checks
5. **Expiration**: Automatic cleanup after TTL

### Authenticated User Flow
1. **Cart Retrieval**: Fetch existing cart or create new
2. **Database Storage**: Persistent storage in MongoDB
3. **Cart Merging**: Merge with guest cart if applicable
4. **Order Conversion**: Mark as converted when order placed

### Abandoned Cart Flow
1. **Detection**: Identify carts inactive for specified period
2. **Tracking**: Record abandonment events for analytics
3. **Recovery**: Enable targeted recovery campaigns
4. **Cleanup**: Remove expired abandoned carts

## ⚡ Performance Features

### Caching Strategy
- **Redis Sessions**: Fast access for guest carts
- **Database Persistence**: Reliable storage for user carts
- **Connection Pooling**: Optimized database connections

### Optimization
- **Lazy Loading**: Load cart data only when needed
- **Batch Operations**: Efficient bulk item operations
- **Index Usage**: Optimized database queries
- **Memory Management**: Efficient data structures

### Scalability
- **Horizontal Scaling**: Stateless service design
- **Load Balancing**: Support for multiple instances
- **Session Sharing**: Redis-based session sharing
- **Database Sharding**: MongoDB sharding support

## 🔒 Security Features

### Data Protection
- **Input Validation**: Comprehensive request validation
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Input sanitization
- **CORS Configuration**: Controlled cross-origin access

### Session Security
- **Secure Cookies**: HttpOnly and Secure flags
- **Session Expiration**: Configurable TTL
- **Session Rotation**: Automatic session renewal
- **CSRF Protection**: Built-in CSRF tokens

### Access Control
- **Role-based Access**: Admin-only operations
- **Rate Limiting**: Request throttling
- **Authentication**: JWT token validation
- **Authorization**: Granular permission checks

## 📈 Monitoring & Analytics

### Metrics Collection
- **Cart Events**: Creation, modification, abandonment
- **Performance Metrics**: Response times, error rates
- **Business Metrics**: Conversion rates, average cart value
- **System Metrics**: Memory usage, connection pools

### Event System
```typescript
// Cart events emitted for analytics
cart:created        // New cart created
cart:item_added     // Item added to cart
cart:item_removed   // Item removed from cart
cart:item_updated   // Item quantity updated
cart:discount_applied   // Discount code applied
cart:discount_removed   // Discount removed
cart:abandoned      // Cart marked as abandoned
cart:converted      // Cart converted to order
cart:merged         // Guest cart merged with user cart
```

### Health Monitoring
- **Service Health**: Database and Redis connectivity
- **Performance Health**: Response time monitoring
- **Business Health**: Cart operation success rates

## 🔧 Configuration

### Business Rules
```typescript
// Configurable business parameters
MAX_ITEMS_PER_CART = 100
MAX_QUANTITY_PER_ITEM = 999
GUEST_CART_TTL_HOURS = 24
ABANDONED_CART_THRESHOLD_HOURS = 24
TAX_RATE = 0.08
FREE_SHIPPING_THRESHOLD = 50.00
BASE_SHIPPING_COST = 5.99
```

### Cart Merging Strategies
- **`combine_quantities`**: Add quantities for same items (default)
- **`user_priority`**: Keep user cart, ignore guest cart
- **`guest_priority`**: Replace user cart with guest cart

## 🐛 Error Handling

### Error Codes
- `CART_NOT_FOUND`: Cart does not exist
- `PRODUCT_OUT_OF_STOCK`: Insufficient inventory
- `PRODUCT_NOT_AVAILABLE`: Product no longer available
- `CART_ITEM_NOT_FOUND`: Item not in cart
- `INVALID_DISCOUNT_CODE`: Invalid or expired discount
- `MINIMUM_ORDER_NOT_MET`: Order below discount minimum
- `ACCESS_DENIED`: Insufficient permissions
- `VALIDATION_ERROR`: Request validation failed

### Error Response Format
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": []
}
```

## 🚀 Deployment

### Docker Configuration
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
EXPOSE 4003
CMD ["node", "dist/index.js"]
```

### Production Considerations
- **Environment Variables**: Secure configuration management
- **Database Connections**: Connection pooling and monitoring
- **Redis Clustering**: High availability Redis setup
- **Load Balancing**: Multiple service instances
- **Logging**: Centralized logging with structured logs
- **Monitoring**: APM integration for performance monitoring

## 📝 API Documentation

Complete API documentation is available at `/api/docs` when the service is running in development mode.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Built with ❤️ by the ApniDukaan Team
