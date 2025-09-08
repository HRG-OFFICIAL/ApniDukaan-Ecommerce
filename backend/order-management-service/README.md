# ShopSphere Order Management Service

A comprehensive microservice for managing e-commerce orders, payments, shipping, and inventory coordination within the ShopSphere platform.

## 🚀 Features

### Core Order Management
- **Order Lifecycle**: Draft → Pending → Confirmed → Processing → Shipped → Delivered
- **Order Creation**: Multi-item orders with comprehensive validation
- **Order Tracking**: Real-time status updates and history
- **Order Modification**: Update shipping addresses, add notes, and more
- **Order Cancellation**: Customer and admin cancellation with reason tracking

### Payment Processing
- **Multiple Payment Gateways**: Stripe, PayPal integration
- **Payment Methods**: Credit/Debit cards, PayPal, Apple Pay, Google Pay
- **Secure Processing**: PCI-compliant payment handling
- **Refund Management**: Partial and full refunds with tracking
- **Webhook Support**: Real-time payment status updates

### Shipping & Fulfillment
- **Multi-Carrier Support**: UPS, FedEx, USPS, DHL integration
- **Rate Calculation**: Real-time shipping cost estimation
- **Label Generation**: Automatic shipping label creation
- **Tracking Integration**: Real-time shipment tracking
- **Delivery Notifications**: Status updates throughout delivery

### Inventory Management
- **Stock Validation**: Real-time inventory checks
- **Reservation System**: Temporary inventory holds during checkout
- **Atomic Updates**: Thread-safe inventory operations
- **Expiration Handling**: Auto-release of expired reservations

### Advanced Features
- **Tax Calculation**: Automated tax computation
- **Discount Management**: Coupon codes and promotional discounts
- **Order Analytics**: Comprehensive reporting and metrics
- **Event System**: Real-time notifications and webhooks
- **Caching**: Redis-powered performance optimization

## 🏗️ Architecture

### Technology Stack
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js with comprehensive middleware
- **Database**: MongoDB with Mongoose ODM
- **Cache**: Redis for high-performance caching
- **Queue**: Bull queue for background job processing
- **Validation**: Express-validator for request validation
- **Testing**: Jest with comprehensive test coverage

### Service Structure
```
src/
├── app.ts                    # Express application setup
├── server.ts                 # Server entry point
├── models/
│   └── Order.ts             # Mongoose order model
├── services/
│   ├── OrderService.ts      # Core business logic
│   ├── PaymentService.ts    # Payment processing
│   ├── ShippingService.ts   # Shipping operations
│   └── InventoryService.ts  # Inventory management
├── routes/
│   └── orders.ts            # REST API endpoints
├── types/
│   └── order.types.ts       # TypeScript interfaces
├── middleware/
│   └── [authentication, validation, etc.]
├── utils/
│   └── [helper functions]
└── tests/
    ├── unit/               # Unit tests
    └── integration/        # Integration tests
```

## 🚦 API Endpoints

### Order Operations
```http
POST   /api/orders                    # Create new order
GET    /api/orders                    # List orders (paginated)
GET    /api/orders/:id                # Get order by ID
GET    /api/orders/number/:number     # Get order by order number
PUT    /api/orders/:id                # Update order
POST   /api/orders/:id/cancel         # Cancel order
```

### Payment Operations
```http
POST   /api/orders/:id/payments       # Process payment
POST   /api/orders/:id/refunds        # Process refund
```

### Shipping Operations
```http
GET    /api/orders/:id/shipping/rates # Get shipping rates
POST   /api/orders/:id/shipping/label # Generate shipping label
GET    /api/orders/:id/tracking       # Get tracking info
PUT    /api/orders/:id/shipping/status # Update shipping status
```

### Inventory Operations
```http
POST   /api/orders/:id/inventory/reserve # Reserve inventory
POST   /api/orders/:id/inventory/confirm # Confirm reservation
```

### Webhook Endpoints
```http
POST   /api/orders/webhooks/stripe    # Stripe webhook handler
POST   /api/orders/webhooks/paypal    # PayPal webhook handler
```

### Admin & Analytics
```http
GET    /api/orders/admin/orders/analytics # Order analytics
```

### System Endpoints
```http
GET    /health                        # Health check
GET    /ready                         # Readiness probe
GET    /live                          # Liveness probe
```

## 📊 Data Models

### Order Structure
```typescript
interface IOrder {
  orderNumber: string;           // Unique order identifier
  customerId: string;            // Customer reference
  customerEmail: string;         // Customer contact
  status: OrderStatus;           // Current order status
  
  items: IOrderItem[];           // Order line items
  totals: IOrderTotals;          // Calculated amounts
  
  shippingAddress: IAddress;     // Delivery address
  billingAddress: IAddress;      // Billing address
  
  payment: IPaymentInfo;         // Payment details
  shipping: IShippingInfo;       // Shipping details
  
  dates: IOrderDates;           // Important timestamps
  notes: IOrderNote[];          // Order history
  events: IOrderEvent[];        // System events
}
```

### Payment Information
```typescript
interface IPaymentInfo {
  method: PaymentMethod;         // Payment type
  status: PaymentStatus;         // Current status
  transactions: IPaymentTransaction[]; // Payment history
  totalPaid: number;            // Amount paid
  totalRefunded: number;        // Amount refunded
}
```

### Shipping Information
```typescript
interface IShippingInfo {
  method: ShippingMethod;        // Shipping type
  carrier: ShippingCarrier;      // Shipping provider
  service: string;               // Service level
  trackingNumber?: string;       // Tracking ID
  estimatedDelivery?: Date;      // Expected delivery
  actualDelivery?: Date;         // Actual delivery
  cost: number;                  // Shipping cost
}
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ and npm/yarn
- MongoDB 5.0+
- Redis 6.0+
- Payment gateway accounts (Stripe, PayPal)
- Shipping carrier accounts (optional for production)

### Installation Steps

1. **Clone and Navigate**
   ```bash
   cd backend/order-management-service
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Database Setup**
   ```bash
   # Ensure MongoDB and Redis are running
   # MongoDB: mongodb://localhost:27017
   # Redis: redis://localhost:6379
   ```

5. **Build Application**
   ```bash
   npm run build
   ```

6. **Start Development Server**
   ```bash
   npm run dev
   ```

7. **Run Tests**
   ```bash
   npm test
   ```

## ⚙️ Configuration

### Environment Variables

#### Core Configuration
```bash
PORT=3002                              # Server port
NODE_ENV=development                   # Environment
MONGODB_URI=mongodb://localhost:27017/shopsphere-orders
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_secret_key
```

#### Payment Gateways
```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# PayPal  
PAYPAL_CLIENT_ID=your_client_id
PAYPAL_CLIENT_SECRET=your_client_secret
PAYPAL_MODE=sandbox
```

#### Shipping Carriers
```bash
# UPS
UPS_ACCESS_KEY=your_ups_key
UPS_USERNAME=your_ups_username
UPS_PASSWORD=your_ups_password

# FedEx
FEDEX_KEY=your_fedex_key
FEDEX_PASSWORD=your_fedex_password

# USPS
USPS_USER_ID=your_usps_id
```

#### Feature Toggles
```bash
ENABLE_INVENTORY_TRACKING=true
ENABLE_PAYMENT_WEBHOOKS=true
ENABLE_SHIPPING_LABELS=true
ENABLE_TAX_CALCULATION=true
```

## 🔒 Security Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (customer, admin)
- Request rate limiting
- API key validation for admin operations

### Data Protection
- Input sanitization and validation
- NoSQL injection prevention
- XSS protection with Helmet.js
- CORS configuration
- Request/response logging

### Payment Security
- PCI-compliant payment processing
- Webhook signature verification
- Sensitive data encryption
- Payment tokenization

## 📈 Performance & Scalability

### Caching Strategy
- **Order Caching**: Frequently accessed orders cached in Redis
- **Inventory Caching**: Stock levels cached with TTL
- **Shipping Rates**: Cached rate calculations
- **Payment Status**: Cached payment states

### Database Optimization
- Compound indexes for efficient queries
- Aggregation pipelines for analytics
- Connection pooling and timeout handling
- Read/write operation optimization

### Queue Processing
- Background job processing with Bull
- Payment processing queues
- Notification dispatch queues
- Inventory update queues

## 🧪 Testing

### Test Coverage
- **Unit Tests**: Individual service and utility testing
- **Integration Tests**: API endpoint testing
- **End-to-End Tests**: Complete workflow testing
- **Performance Tests**: Load and stress testing

### Running Tests
```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests
npm run test:integration

# Test coverage
npm run test:coverage

# Test watch mode
npm run test:watch
```

## 📊 Monitoring & Observability

### Health Checks
- `/health` - Service health status
- `/ready` - Readiness for traffic
- `/live` - Liveness status

### Logging
- Structured JSON logging with Winston
- Request/response logging
- Error tracking and reporting
- Performance monitoring

### Metrics
- Order processing metrics
- Payment success rates
- Shipping performance
- API response times

## 🚀 Deployment

### Docker Support
```dockerfile
# Production-ready Docker image
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3002
CMD ["node", "dist/server.js"]
```

### Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-management-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: order-management-service
  template:
    metadata:
      labels:
        app: order-management-service
    spec:
      containers:
      - name: order-management-service
        image: shopsphere/order-management-service:latest
        ports:
        - containerPort: 3002
        env:
        - name: NODE_ENV
          value: "production"
        livenessProbe:
          httpGet:
            path: /live
            port: 3002
        readinessProbe:
          httpGet:
            path: /ready
            port: 3002
```

## 📚 API Documentation

### Authentication
All API endpoints (except webhooks and health checks) require authentication via:
- `x-user-id` header: User identifier
- `x-user-role` header: User role (customer, admin)

### Request/Response Format
```typescript
// Standard Success Response
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* response data */ },
  "timestamp": "2024-01-15T10:30:00.000Z"
}

// Standard Error Response
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/orders",
  "method": "POST"
}
```

### Example API Calls

#### Create Order
```bash
curl -X POST http://localhost:3002/api/orders \
  -H "Content-Type: application/json" \
  -H "x-user-id: 507f1f77bcf86cd799439011" \
  -H "x-user-role: customer" \
  -d '{
    "customerEmail": "customer@example.com",
    "items": [{
      "productId": "507f1f77bcf86cd799439013",
      "quantity": 2,
      "unitPrice": 29.99,
      "name": "Sample Product"
    }],
    "shippingAddress": {
      "firstName": "John",
      "lastName": "Doe",
      "addressLine1": "123 Main St",
      "city": "New York",
      "state": "NY",
      "postalCode": "10001",
      "country": "US"
    },
    "shippingMethod": "standard",
    "paymentMethod": "credit_card"
  }'
```

#### Process Payment
```bash
curl -X POST http://localhost:3002/api/orders/{orderId}/payments \
  -H "Content-Type: application/json" \
  -H "x-user-id: 507f1f77bcf86cd799439011" \
  -H "x-user-role: customer" \
  -d '{
    "method": "credit_card",
    "amount": 65.47,
    "currency": "USD",
    "paymentData": {
      "token": "tok_1234567890",
      "cardLast4": "4242"
    }
  }'
```

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Make changes and add tests
4. Run test suite: `npm test`
5. Commit changes: `git commit -m 'Add new feature'`
6. Push to branch: `git push origin feature/new-feature`
7. Submit pull request

### Code Standards
- TypeScript with strict mode enabled
- ESLint and Prettier for code formatting
- Jest for testing with >80% coverage
- Conventional commits for version control

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Getting Help
- Documentation: See this README and inline code comments
- Issues: Create GitHub issues for bugs and feature requests
- Discussions: Use GitHub discussions for questions

### Common Issues
- **Database Connection**: Ensure MongoDB and Redis are running
- **Payment Webhooks**: Verify webhook URLs and signatures
- **Environment Variables**: Check all required variables are set
- **Port Conflicts**: Ensure port 3002 is available

---

**ShopSphere Order Management Service** - Built with ❤️ for scalable e-commerce
