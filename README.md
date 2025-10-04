# ApniDukaan E-Commerce Platform

A full-stack e-commerce platform built with microservices architecture, featuring a modern React frontend and Node.js backend services.

## 🤖 Agent Context

This README serves as comprehensive context for AI agents working on this codebase. It provides detailed information about file/folder purposes, service responsibilities, and code organization to enable effective code navigation and modification.

## 🚀 Features

- **Modern Frontend**: Built with Next.js 14, React 18, and Tailwind CSS
- **Microservices Architecture**: Scalable backend with separate services
- **API Gateway**: Centralized routing and load balancing
- **Product Catalog**: Comprehensive product management
- **User Management**: Authentication and user profiles
- **Shopping Cart**: Real-time cart management
- **Order Processing**: Complete order lifecycle
- **Payment Integration**: Razorpay payment processing
- **Responsive Design**: Mobile-first approach

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │
│   (Next.js)     │◄──►│   (Express)     │
│   Port: 3000    │    │   Port: 4000    │
└─────────────────┘    └─────────────────┘
                                │
                    ┌───────────┼───────────┐
                    │           │           │
            ┌───────▼──┐ ┌──────▼──┐ ┌─────▼────┐
            │ Catalog  │ │  User   │ │  Order   │
            │ Service  │ │ Service │ │ Service  │
            │ Port:    │ │ Port:   │ │ Port:    │
            │ 4001     │ │ 4002    │ │ 4003     │
            └──────────┘ └─────────┘ └──────────┘
```

## 🗂️ Project Structure & Agent Context

### Root Directory Overview
```
apnidukaan-ecommerce/
├── 📁 frontend/                    # Next.js 14 React application
├── 📁 backend/                     # Microservices backend
│   ├── api-gateway/               # Central API routing (Port 4000)
│   ├── catalog-service/           # Product management (Port 4001)
│   ├── user-service/              # User authentication (Port 4002)
│   ├── order-service/             # Basic order processing (Port 4003)
│   ├── order-management-service/  # Advanced order management
│   ├── cart-service/              # Shopping cart (Port 4005)
│   ├── payment-service/           # Payment processing (Port 4004)
│   ├── notification-service/      # Email/SMS notifications
│   └── shared/                    # Common utilities and types
├── 📁 infrastructure/             # Docker, K8s, Terraform configs
├── 📁 docs/                       # Comprehensive documentation
├── 📁 scripts/                    # Setup and utility scripts
├── 📁 tests/                      # Integration and test files
└── 📄 Configuration files
```

### Backend Services Deep Dive

#### 🔀 API Gateway (`backend/api-gateway/`)
- **Purpose**: Central routing hub for all frontend requests
- **Port**: 4000
- **Key Files**:
  - `src/index.ts` - Main server setup with GraphQL and REST endpoints
  - `src/graphql/schema.ts` - Complete GraphQL schema definitions
  - `src/graphql/resolvers.ts` - GraphQL resolvers for all services
- **Responsibilities**:
  - Route requests to appropriate microservices
  - Provide unified GraphQL API
  - Handle authentication and authorization
  - Load balancing and rate limiting

#### 📦 Catalog Service (`backend/catalog-service/`)
- **Purpose**: Product catalog management and search
- **Port**: 4001
- **Key Files**:
  - `src/index.ts` - Express server with product endpoints
  - `src/models/Product.ts` - MongoDB product schema
  - `src/services/ProductService.ts` - Business logic for products
  - `src/routes/products.ts` - REST API endpoints
- **Endpoints**:
  - `GET /api/products` - List products with filtering
  - `GET /api/products/:id` - Get single product
  - `GET /api/categories` - List categories
  - `POST /api/products` - Create product (admin)
- **Dependencies**: MongoDB, Redis for caching

#### 👤 User Service (`backend/user-service/`)
- **Purpose**: User authentication and profile management
- **Port**: 4002
- **Key Files**:
  - `src/routes/auth.ts` - Authentication endpoints
  - `src/services/AuthService.ts` - JWT and password handling
  - `src/models/User.ts` - User schema
- **Endpoints**:
  - `POST /api/auth/login` - User login
  - `POST /api/auth/register` - User registration
  - `GET /api/users/profile` - Get user profile
  - `PUT /api/users/profile` - Update profile

#### 🛒 Cart Service (`backend/cart-service/`)
- **Purpose**: Shopping cart management for guest and authenticated users
- **Port**: 4005
- **Key Files**:
  - `src/services/CartService.ts` - Cart business logic
  - `src/models/Cart.ts` - Cart schema
  - `src/routes/cart.ts` - Cart API endpoints
- **Features**:
  - Dual storage (Redis for sessions, MongoDB for persistence)
  - Cart merging on authentication
  - Real-time total calculations
  - Abandoned cart recovery

#### 📋 Order Management Service (`backend/order-management-service/`)
- **Purpose**: Advanced order processing, payments, and fulfillment
- **Key Files**:
  - `src/services/OrderService.ts` - Core order business logic
  - `src/services/PaymentService.ts` - Payment processing (Stripe/Razorpay)
  - `src/services/ShippingService.ts` - Shipping and tracking
  - `src/services/InventoryService.ts` - Inventory management
  - `src/routes/orders.ts` - Order API endpoints
- **Features**:
  - Complete order lifecycle management
  - Multi-gateway payment processing
  - Shipping integration
  - Inventory coordination
  - Refund management

#### 💳 Payment Service (`backend/payment-service/`)
- **Purpose**: Payment processing and gateway integration
- **Port**: 4004
- **Key Files**:
  - `src/services/PaymentService.ts` - Payment processing logic
  - `src/routes/payments.ts` - Payment API endpoints
- **Supported Gateways**: Stripe, Razorpay, PayPal

#### 📧 Notification Service (`backend/notification-service/`)
- **Purpose**: Email and SMS notifications
- **Key Files**:
  - `src/services/EmailService.ts` - Email sending
  - `src/services/SMSService.ts` - SMS notifications
- **Features**: Order confirmations, password resets, promotional emails

#### 🔧 Shared Package (`backend/shared/`)
- **Purpose**: Common utilities, types, and configurations
- **Key Files**:
  - `src/types/` - TypeScript interfaces
  - `src/utils/` - Helper functions
  - `src/constants/` - Application constants
  - `src/middleware/` - Common middleware

### Frontend Structure (`frontend/`)

#### 📱 App Router Structure (`src/app/`)
- **Purpose**: Next.js 14 App Router pages and layouts
- **Key Files**:
  - `layout.tsx` - Root layout with providers
  - `page.tsx` - Homepage
  - `products/page.tsx` - Product listing
  - `product/[id]/page.tsx` - Product detail
  - `checkout/page.tsx` - Checkout process
  - `admin/page.tsx` - Admin dashboard
  - `showcase/page.tsx` - UI component showcase

#### 🧩 Components (`src/components/`)
- **Layout Components**:
  - `layout/MainLayout.tsx` - Main page wrapper
  - `layout/EnhancedNavbar.tsx` - Navigation with mega menu
  - `layout/Footer.tsx` - Site footer
- **UI Components** (`ui/`):
  - `Button.tsx`, `Input.tsx`, `Modal.tsx` - Basic UI elements
  - `ThemeToggle.tsx` - Dark/light mode toggle
  - `Skeleton.tsx` - Loading states
  - `Animations.tsx` - Framer Motion animations
- **Feature Components**:
  - `ProductCard.tsx` - Product display card
  - `CartSidebar.tsx` - Shopping cart drawer
  - `payment/RazorpayPaymentForm.tsx` - Payment form
  - `admin/` - Admin dashboard components

#### 🔄 State Management (`src/store/`)
- **Zustand Stores**:
  - `useAuthStore.ts` - Authentication state
  - `useCartStore.ts` - Shopping cart state
  - `usePreferencesStore.ts` - User preferences
  - `useAppStore.ts` - Global app state

#### 🎣 Custom Hooks (`src/hooks/`)
- `useAuth.ts` - Authentication logic
- `useCart.ts` - Cart operations
- `useProducts.ts` - Product data fetching
- `useLocalStorage.ts` - Local storage management

#### 🌐 Services (`src/services/`)
- `api.ts` - API client configuration
- `authService.ts` - Authentication API calls
- `productService.ts` - Product API calls
- `cartService.ts` - Cart API calls
- `razorpayService.ts` - Payment integration

#### 📊 GraphQL (`src/graphql/`)
- `types.ts` - Generated GraphQL types
- `queries.ts` - GraphQL queries
- `mutations.ts` - GraphQL mutations
- `apollo-client.ts` - Apollo Client configuration

### Configuration Files

#### 🔧 Environment Configuration
- **Root `.env`**: Database, JWT, service ports
- **Frontend `.env.local`**: API URLs, public keys
- **Service-specific `.env`**: Individual service configurations

#### 📦 Package Management
- **Root `package.json`**: Workspace configuration
- **Service `package.json`**: Individual service dependencies
- **Frontend `package.json`**: Next.js and React dependencies

#### 🐳 Infrastructure
- **Docker**: `docker-compose.yml` files for containerization
- **Kubernetes**: `infrastructure/k8s/` for orchestration
- **Terraform**: `infrastructure/terraform/` for cloud provisioning

### Development Workflow

#### 🚀 Starting the Application
1. **API Gateway** (Port 4000) - Must start first
2. **Catalog Service** (Port 4001) - Product data
3. **Frontend** (Port 3000) - React application
4. **Other services** as needed

#### 🔍 Key Entry Points
- **Frontend**: `frontend/src/app/page.tsx`
- **API Gateway**: `backend/api-gateway/src/index.ts`
- **GraphQL Schema**: `backend/api-gateway/src/graphql/schema.ts`
- **Main Layout**: `frontend/src/components/layout/MainLayout.tsx`

#### 🧪 Testing
- **Frontend**: `npm test` in frontend directory
- **Backend**: `npm test` in individual service directories
- **Integration**: `tests/` directory for end-to-end tests

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **React Hook Form** - Form handling
- **Framer Motion** - Animations

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **MongoDB** - Database
- **Redis** - Caching
- **JWT** - Authentication
- **Razorpay** - Payment processing

## 📋 Prerequisites

- Node.js 18+ 
- npm 8+
- MongoDB (local or cloud)
- Redis (optional, for caching)

## 📁 Project Structure

```
apnidukaan-ecommerce/
├── 📁 frontend/           # Next.js frontend application
├── 📁 backend/            # Microservices backend
│   ├── api-gateway/       # API Gateway service
│   ├── catalog-service/   # Product catalog service
│   ├── user-service/      # User management service
│   ├── order-service/     # Order processing service
│   ├── cart-service/      # Shopping cart service
│   ├── payment-service/   # Payment processing service
│   ├── notification-service/ # Notification service
│   └── shared/            # Shared utilities and types
├── 📁 docs/               # All documentation
├── 📁 scripts/            # Utility scripts
├── 📁 tests/              # Test files
├── 📁 infrastructure/     # Docker, K8s, Terraform configs
└── 📄 README.md           # This file
```

## 📚 Documentation

All documentation is organized in the `docs/` folder:
- **Quick Start**: `docs/QUICK_START.md`
- **Development**: `docs/DEVELOPMENT_TASKS.md`
- **Deployment**: `docs/DEPLOYMENT_GUIDE.md`
- **Configuration**: `docs/backend-setup.md`, `docs/database.md`
- **Testing**: `docs/QUICK_TEST_GUIDE.md`

See `docs/README.md` for a complete documentation index.

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd apnidukaan-ecommerce
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..

# Install backend dependencies
cd backend/catalog-service && npm install && cd ../..
cd backend/user-service && npm install && cd ../..
cd backend/order-service && npm install && cd ../..
cd backend/payment-service && npm install && cd ../..
cd backend/api-gateway && npm install && cd ../..
```

### 3. Start All Services (No Database Required!)
```bash
# Start everything at once
npm start
# or
node start.js

# Or test individual services
node tests/test-services.js
```

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:4000
- **Health Check**: http://localhost:4000/health

## ⚡ Immediate Setup (5 Minutes!)

For the fastest setup without any database configuration:

```bash
# 1. Install dependencies
npm install && cd frontend && npm install && cd ..

# 2. Start all services
node start-simple.js

# 3. Open browser
# http://localhost:3000
```

**That's it!** The application runs with mock data and doesn't require MongoDB or Redis.

## 📁 Project Structure

```
apnidukaan-ecommerce/
├── frontend/                 # Next.js frontend application
│   ├── src/
│   │   ├── app/             # App router pages
│   │   ├── components/      # React components
│   │   ├── contexts/        # React contexts
│   │   ├── hooks/           # Custom hooks
│   │   └── utils/           # Utility functions
│   └── package.json
├── backend/
│   ├── api-gateway/         # API Gateway service
│   ├── catalog-service/     # Product catalog service
│   ├── user-service/        # User management service
│   ├── order-service/       # Order processing service
│   ├── payment-service/     # Payment processing service
│   └── shared/              # Shared utilities and types
├── infrastructure/          # Docker and K8s configs
├── docs/                    # Documentation
└── package.json            # Root package.json
```

## 🔧 Configuration & Environment Setup

### Environment Variables Overview

The application uses multiple environment files for different purposes:

#### Root Environment (`.env`)
```env
# Application Settings
NODE_ENV=development
PORT=3000
API_PORT=4000

# Database Configuration
MONGODB_URI=mongodb+srv://userservice-dev:OELp6t3K63rHhKgJ@cluster0.0ezsixh.mongodb.net/apnidukaan?retryWrites=true&w=majority&appName=Cluster0
REDIS_URL=redis://localhost:6379

# Service Ports
API_GATEWAY_PORT=4000
CATALOG_SERVICE_PORT=4001
USER_SERVICE_PORT=4002
ORDER_SERVICE_PORT=4003
PAYMENT_SERVICE_PORT=4004
CART_SERVICE_PORT=4005

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-secret-key

# Payment Gateways
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@apnidukaan.com
```

#### Frontend Environment (`frontend/.env.local`)
```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:4000/graphql

# App Configuration
NEXT_PUBLIC_APP_NAME=ApniDukaan
NEXT_PUBLIC_APP_VERSION=1.0.0

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key

# Payment Keys (Public)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_DEBUG=true
```

### Service-Specific Configuration

#### API Gateway Configuration
- **File**: `backend/api-gateway/.env`
- **Key Variables**: Service URLs, JWT secrets, rate limiting
- **Dependencies**: All other services must be configured

#### Catalog Service Configuration
- **File**: `backend/catalog-service/.env`
- **Key Variables**: MongoDB URI, Redis URL, search configuration
- **Dependencies**: MongoDB, Redis

#### User Service Configuration
- **File**: `backend/user-service/.env`
- **Key Variables**: JWT secrets, password hashing rounds
- **Dependencies**: MongoDB

#### Payment Service Configuration
- **File**: `backend/payment-service/.env`
- **Key Variables**: Payment gateway credentials, webhook secrets
- **Dependencies**: External payment providers

### Database Configuration

#### MongoDB Setup
```bash
# Local MongoDB
mongod --dbpath /path/to/data

# MongoDB Atlas (Cloud)
# Use the provided connection string in MONGODB_URI
```

#### Redis Setup
```bash
# Local Redis
redis-server

# Redis with Docker
docker run -d -p 6379:6379 redis:alpine
```

### Development Environment Setup

#### Prerequisites
- Node.js 18+
- npm 8+
- MongoDB (local or Atlas)
- Redis (optional for caching)

#### Quick Setup
```bash
# 1. Clone and install dependencies
git clone <repository-url>
cd apnidukaan-ecommerce
npm install

# 2. Install frontend dependencies
cd frontend && npm install && cd ..

# 3. Install backend dependencies
npm run setup:backend

# 4. Create environment files
cp env.example .env
cp frontend/.env.local.example frontend/.env.local

# 5. Start services
npm start
```

#### Manual Service Startup
```bash
# Terminal 1: API Gateway
cd backend/api-gateway && npm run dev

# Terminal 2: Catalog Service
cd backend/catalog-service && npm run dev

# Terminal 3: Frontend
cd frontend && npm run dev
```

## 🧪 Testing & Development Workflow

### Testing Strategy

#### Frontend Testing
```bash
# Run all frontend tests
cd frontend
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- ProductCard.test.tsx
```

#### Backend Testing
```bash
# Test individual services
cd backend/catalog-service && npm test
cd backend/user-service && npm test
cd backend/cart-service && npm test

# Run all backend tests
npm run test:backend

# Run integration tests
npm run test:integration
```

#### Test Files Structure
```
tests/
├── test-api-connection.js      # API connectivity tests
├── test-database-connection.js # Database connection tests
├── test-catalog-db.js         # Catalog service database tests
├── test-product-model.js      # Product model tests
├── test-redis-connection.js   # Redis connection tests
└── test-services.js           # Service integration tests
```

### Development Workflow

#### 🚀 Starting Development
1. **Start Infrastructure Services**:
   ```bash
   # MongoDB (if local)
   mongod --dbpath /path/to/data
   
   # Redis (if local)
   redis-server
   ```

2. **Start Backend Services** (in order):
   ```bash
   # Terminal 1: API Gateway (Port 4000)
   cd backend/api-gateway && npm run dev
   
   # Terminal 2: Catalog Service (Port 4001)
   cd backend/catalog-service && npm run dev
   
   # Terminal 3: User Service (Port 4002)
   cd backend/user-service && npm run dev
   
   # Terminal 4: Cart Service (Port 4005)
   cd backend/cart-service && npm run dev
   ```

3. **Start Frontend**:
   ```bash
   # Terminal 5: Frontend (Port 3000)
   cd frontend && npm run dev
   ```

#### 🔍 Development Tools

##### Code Quality
```bash
# TypeScript type checking
npm run type-check

# ESLint (if configured)
npm run lint

# Prettier formatting
npm run format
```

##### Database Management
```bash
# Seed database with sample data
node scripts/seed-comprehensive-data.js

# Check database connection
node scripts/check-database.js

# Initialize database
node scripts/init-database.js
```

##### Service Health Checks
```bash
# Check all services
node tests/test-services.js

# Check specific service
curl http://localhost:4000/health  # API Gateway
curl http://localhost:4001/health  # Catalog Service
curl http://localhost:4002/health  # User Service
```

#### 🐛 Debugging

##### Frontend Debugging
- **React DevTools**: Browser extension for component inspection
- **Next.js Debug**: `NODE_OPTIONS='--inspect' npm run dev`
- **Console Logs**: Check browser console for errors
- **Network Tab**: Monitor API calls and responses

##### Backend Debugging
- **Service Logs**: Check terminal output for each service
- **Database Logs**: MongoDB and Redis connection status
- **API Testing**: Use Postman or curl for endpoint testing
- **Error Tracking**: Check service-specific error logs

##### Common Issues & Solutions

**Frontend API Connection Issues**:
- Ensure API Gateway is running on port 4000
- Check `NEXT_PUBLIC_API_URL` in frontend/.env.local
- Verify service endpoints are accessible

**Database Connection Issues**:
- Check MongoDB connection string in .env
- Ensure MongoDB is running and accessible
- Verify Redis connection if using caching

**Service Startup Issues**:
- Check port conflicts (services using same ports)
- Verify all dependencies are installed
- Check environment variables are set correctly

#### 🔄 Hot Reloading & Development Experience

##### Frontend Hot Reloading
- Next.js provides automatic hot reloading
- Changes to components update instantly
- Page refreshes preserve state where possible

##### Backend Development
- Use `nodemon` for automatic service restarts
- TypeScript compilation on file changes
- Service-specific logging for debugging

#### 📊 Performance Monitoring

##### Frontend Performance
```bash
# Analyze bundle size
cd frontend
npm run build
npm run analyze

# Check Core Web Vitals
# Use Chrome DevTools Performance tab
```

##### Backend Performance
- Monitor service response times
- Check database query performance
- Monitor memory usage and CPU
- Use Redis for caching optimization

## 🚀 Deployment

### Docker Deployment
```bash
# Build and start all services
docker-compose -f infrastructure/docker/docker-compose.yml up -d
```

### Kubernetes Deployment
```bash
# Deploy to Kubernetes
kubectl apply -f infrastructure/k8s/
```

## 📚 API Documentation

### GraphQL API (Primary)

The application uses GraphQL as the primary API interface through the API Gateway.

#### GraphQL Endpoint
- **URL**: `http://localhost:4000/graphql`
- **Playground**: `http://localhost:4000/graphql` (in development)

#### Key Queries
```graphql
# Get products with filtering
query GetProducts($filter: ProductFilter, $sort: ProductSort, $limit: Int, $offset: Int) {
  products(filter: $filter, sort: $sort, limit: $limit, offset: $offset) {
    products {
      id
      name
      price
      images
      category {
        name
      }
    }
    totalCount
  }
}

# Get single product
query GetProduct($id: ID!) {
  product(id: $id) {
    id
    name
    description
    price
    images
    inventory {
      quantity
    }
  }
}

# User authentication
mutation Login($email: String!, $password: String!) {
  login(email: $email, password: $password) {
    accessToken
    user {
      id
      name
      email
    }
  }
}

# Cart operations
mutation AddToCart($productId: ID!, $quantity: Int!) {
  addToCart(productId: $productId, quantity: $quantity) {
    id
    items {
      product {
        name
        price
      }
      quantity
    }
    total
  }
}
```

### REST API Endpoints

#### API Gateway (Port 4000)
- **Base URL**: `http://localhost:4000`
- **Health Check**: `GET /health`
- **GraphQL**: `POST /graphql`

#### Catalog Service (Port 4001)
- **Base URL**: `http://localhost:4001`
- **Health Check**: `GET /health`
- **Products**: `GET /api/products`
- **Product Detail**: `GET /api/products/:id`
- **Categories**: `GET /api/categories`
- **Search**: `GET /api/products/search?q=query`

#### User Service (Port 4002)
- **Base URL**: `http://localhost:4002`
- **Health Check**: `GET /health`
- **Authentication**:
  - `POST /api/auth/login`
  - `POST /api/auth/register`
  - `POST /api/auth/logout`
  - `POST /api/auth/refresh`
- **Profile**:
  - `GET /api/users/profile`
  - `PUT /api/users/profile`
  - `POST /api/users/addresses`
  - `PUT /api/users/addresses/:id`

#### Cart Service (Port 4005)
- **Base URL**: `http://localhost:4005`
- **Health Check**: `GET /health`
- **Cart Operations**:
  - `GET /api/cart` - Get current cart
  - `POST /api/cart/items` - Add item to cart
  - `PUT /api/cart/items/:id` - Update cart item
  - `DELETE /api/cart/items/:id` - Remove cart item
  - `DELETE /api/cart` - Clear cart

#### Order Management Service
- **Base URL**: `http://localhost:4003`
- **Health Check**: `GET /health`
- **Order Operations**:
  - `POST /api/orders` - Create order
  - `GET /api/orders` - List orders
  - `GET /api/orders/:id` - Get order details
  - `PUT /api/orders/:id` - Update order
  - `POST /api/orders/:id/cancel` - Cancel order
- **Payment Operations**:
  - `POST /api/orders/:id/payments` - Process payment
  - `POST /api/orders/:id/refunds` - Process refund

#### Payment Service (Port 4004)
- **Base URL**: `http://localhost:4004`
- **Health Check**: `GET /health`
- **Payment Operations**:
  - `POST /api/payments/create-intent` - Create payment intent
  - `POST /api/payments/confirm` - Confirm payment
  - `POST /api/payments/webhook` - Payment webhook

### API Authentication

#### JWT Token Authentication
```bash
# Include token in headers
Authorization: Bearer <jwt_token>

# Or as header
x-user-id: <user_id>
x-user-role: <user_role>
```

#### GraphQL Context
The GraphQL API automatically handles authentication through the context resolver.

### API Response Format

#### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

#### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": { ... }
}
```

### Rate Limiting
- **Default**: 100 requests per 15 minutes per IP
- **Authentication**: 10 login attempts per 15 minutes per IP
- **API Gateway**: Centralized rate limiting for all services

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔧 Troubleshooting & Common Issues

### 🚨 Critical Issues

#### Frontend API Connection Issues
**Problem**: Frontend shows "API Error: Failed to fetch. Using fallback data" even when backend services are running.

**Root Cause**: Frontend is configured to call services directly instead of through the API Gateway.

**Solution**: 
- ✅ Frontend should call API Gateway at `http://localhost:4000`
- ❌ Never configure frontend to call services directly at ports 4001-4004
- The API Gateway handles routing: `/api/catalog/products` → `http://localhost:4001/api/products`

**Configuration Files to Check**:
- `frontend/src/lib/api.ts`
- `frontend/src/utils/constants.ts`
- `frontend/src/middleware.ts`
- `frontend/src/lib/apollo-client.ts`
- `frontend/src/lib/apollo-client-ssr.ts`
- `frontend/src/services/emailService.ts`

All should have: `API_BASE_URL = 'http://localhost:4000'`

#### Service Startup Order Issues
**Problem**: Services not starting in the correct order causing API connection issues.

**Solution**: Start services in this specific order:

1. **API Gateway** (Port 4000) - Central routing hub
   ```bash
   cd backend/api-gateway
   npm run dev
   ```

2. **Catalog Service** (Port 4001) - Product data service
   ```bash
   cd backend/catalog-service
   npm run dev
   ```

3. **Frontend** (Port 3000) - React application
   ```bash
   cd frontend
   npm run dev
   ```

**Why this order matters**:
- API Gateway must start first to handle routing
- Catalog Service must be running before frontend tries to fetch products
- Frontend connects to API Gateway, which proxies to individual services

**Verification**:
- API Gateway: http://localhost:4000/health
- Catalog Service: http://localhost:4001/health  
- Frontend: http://localhost:3000
- Products API: http://localhost:4000/api/catalog/products

### 🔧 Development Issues

#### TypeScript Compilation Errors
```bash
# Run type checking for all services
npm run type-check

# Check specific service
cd backend/catalog-service && npm run type-check
cd backend/user-service && npm run type-check
cd frontend && npm run type-check
```

#### Frontend Build Issues
```bash
# Clear Next.js cache and rebuild
cd frontend
rm -rf .next
rm -rf node_modules/.cache
npm run build

# Check for dependency issues
npm run lint
npm run type-check
```

#### Backend Service Issues
```bash
# Check service health
curl http://localhost:4000/health  # API Gateway
curl http://localhost:4001/health  # Catalog Service
curl http://localhost:4002/health  # User Service

# View service logs
cd backend/api-gateway && npm run dev
cd backend/catalog-service && npm run dev
```

#### Database Connection Issues
- **MongoDB**: Ensure MongoDB Atlas is accessible (cloud database)
- **Redis**: Check Redis connection on `redis://localhost:6379`
- **Environment**: Verify environment variables in `.env` file
- **Network**: Check firewall and network connectivity

#### Linting Issues
```bash
# Fix frontend linting issues
cd frontend
npm run lint -- --fix

# Check backend linting (if ESLint is configured)
cd backend/catalog-service
npx eslint src/**/*.ts --fix
```

### 🐛 Runtime Issues

#### Theme Toggle Issues
**Problem**: Theme toggle button not working, pages opening in dark theme by default.

**Solution**: Check that `usePageTheme` hook is not being used and theme state is managed globally through Zustand store.

#### Cart State Issues
**Problem**: Cart items not persisting or showing incorrect totals.

**Solution**: 
- Check Redis connection for cart storage
- Verify cart service is running on port 4005
- Clear browser localStorage and cookies
- Check cart service logs for errors

#### Payment Integration Issues
**Problem**: Payment forms not loading or payment processing failing.

**Solution**:
- Verify payment gateway credentials in environment variables
- Check payment service is running on port 4004
- Ensure webhook endpoints are properly configured
- Test with sandbox/test credentials first

#### GraphQL Query Issues
**Problem**: GraphQL queries failing or returning unexpected data.

**Solution**:
- Check GraphQL playground at http://localhost:4000/graphql
- Verify API Gateway is running and accessible
- Check GraphQL schema for correct field names
- Review resolver implementations in backend services

### 🔍 Debugging Tools

#### Frontend Debugging
```bash
# Enable Next.js debug mode
NODE_OPTIONS='--inspect' npm run dev

# Check browser console for errors
# Use React DevTools extension
# Monitor Network tab for API calls
```

#### Backend Debugging
```bash
# Enable Node.js debug mode
node --inspect src/index.js

# Check service logs
tail -f logs/app.log

# Monitor database queries
# Use MongoDB Compass for database inspection
```

#### Database Debugging
```bash
# Test MongoDB connection
node scripts/check-database.js

# Test Redis connection
node scripts/test-redis-connection.js

# Check database collections
# Use MongoDB Atlas dashboard or Compass
```

### 📊 Performance Issues

#### Slow API Responses
- Check database query performance
- Enable Redis caching
- Monitor service response times
- Check for memory leaks

#### Frontend Performance
- Analyze bundle size with `npm run analyze`
- Check Core Web Vitals in Chrome DevTools
- Optimize images and assets
- Enable code splitting

#### Memory Issues
- Monitor Node.js memory usage
- Check for memory leaks in services
- Optimize database queries
- Use Redis for caching heavy operations

### 🆘 Getting Help

If you encounter issues not covered here:

1. **Check Logs**: Review service logs for error messages
2. **Verify Configuration**: Ensure all environment variables are set correctly
3. **Test Connectivity**: Use the provided test scripts
4. **Check Dependencies**: Ensure all services and databases are running
5. **Review Documentation**: Check the `docs/` folder for detailed guides
6. **Create Issue**: Document the problem with steps to reproduce

## ⚡ Performance Optimizations

### Frontend Performance Improvements

#### 1. Image Optimization
- ✅ **Next.js Image Component**: Replaced `<img>` tags with optimized `<Image>` components
- ✅ **Lazy Loading**: Images load only when needed
- ✅ **Responsive Images**: Automatic sizing and format optimization

#### 2. State Management Optimization
- ✅ **Zustand Store**: Lightweight state management with minimal re-renders
- ✅ **Memoization**: Proper use of `useCallback` and `useMemo` where needed
- ✅ **Local Storage**: Efficient cart and auth state persistence

#### 3. Component Optimization
- ✅ **Suspense Boundaries**: Proper loading states for async components
- ✅ **Error Boundaries**: Graceful error handling without performance impact
- ✅ **Code Splitting**: Automatic route-based code splitting with Next.js

### Backend Performance Improvements

#### 1. Database Optimization
- ✅ **Indexing**: Proper MongoDB indexes for frequently queried fields
- ✅ **Query Optimization**: Efficient aggregation pipelines and projections
- ✅ **Connection Pooling**: Optimized database connection management

#### 2. Caching Strategy
- ✅ **Redis Integration**: Multi-layer caching for user sessions and cart data
- ✅ **Query Caching**: Cached results for expensive database operations
- ✅ **Session Management**: Efficient session storage and retrieval

#### 3. API Performance
- ✅ **Rate Limiting**: Protection against abuse and DoS attacks
- ✅ **Request Validation**: Early validation to prevent unnecessary processing
- ✅ **Response Compression**: Gzip compression for API responses

### Performance Monitoring

#### Frontend Metrics
```bash
# Analyze bundle size
cd frontend
npm run build
npm run analyze

# Check Core Web Vitals
npm run dev
# Open http://localhost:3000 and use Chrome DevTools
```

#### Backend Metrics
```bash
# Monitor service performance
cd backend/user-management-service
npm run dev
# Check logs for response times and error rates

# Database performance
# Monitor MongoDB queries and indexes
# Check Redis cache hit rates
```

### Recommended Performance Improvements

#### 1. Frontend Optimizations
- **Virtual Scrolling**: For large product lists (1000+ items)
- **Service Worker**: For offline functionality and caching
- **CDN Integration**: For static assets and images
- **Bundle Analysis**: Regular bundle size monitoring

#### 2. Backend Optimizations
- **Database Sharding**: For horizontal scaling
- **Microservice Caching**: Inter-service caching layer
- **Async Processing**: Background jobs for heavy operations
- **Load Balancing**: Multiple service instances

#### 3. Infrastructure Optimizations
- **Container Optimization**: Multi-stage Docker builds
- **Kubernetes**: Auto-scaling based on metrics
- **Monitoring**: APM tools for performance tracking
- **CDN**: Global content delivery network

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/your-repo/issues) page
2. Create a new issue with detailed information
3. Join our community discussions

## ✅ Recent Updates

### TypeScript & Code Quality Improvements
- ✅ **Fixed all TypeScript compilation errors** across frontend and backend services
- ✅ **Resolved 50+ linting issues** in frontend components
- ✅ **Updated model interfaces** with proper typing for Mongoose documents
- ✅ **Fixed type safety issues** in store implementations and API responses
- ✅ **Added proper error handling** with type narrowing and validation
- ✅ **Optimized Next.js components** with proper Image usage and SSR compatibility

### Backend Service Improvements
- ✅ **Enhanced user-management-service** with complete TypeScript support
- ✅ **Improved user-profile-service** with proper model typing
- ✅ **Added missing configuration files** for database and Redis connections
- ✅ **Fixed service dependencies** and import/export issues
- ✅ **Updated test suites** to work with current implementation

### Build & Development Experience
- ✅ **Frontend build process** now passes successfully
- ✅ **Type checking** enabled for all backend services
- ✅ **Dependency management** verified and updated
- ✅ **Code quality** significantly improved across the project

### Performance Optimizations
- ✅ **Frontend optimizations** implemented for better user experience
- ✅ **Backend caching strategies** enhanced for improved response times
- ✅ **Database query optimization** recommendations provided
- ✅ **Memory management** improvements identified and documented

## 🔧 Troubleshooting

### API Connection Issues

**Problem**: Frontend shows "API Error: Failed to fetch. Using fallback data" even when backend services are running.

**Root Cause**: Frontend is configured to call services directly instead of through the API Gateway.

**Solution**: 
- ✅ Frontend should call API Gateway at `http://localhost:4000`
- ❌ Never configure frontend to call services directly at ports 4001-4004
- The API Gateway handles routing: `/api/catalog/products` → `http://localhost:4001/api/products`

**Configuration Files to Check**:
- `frontend/src/lib/api.ts`
- `frontend/src/utils/constants.ts`
- `frontend/src/middleware.ts`
- `frontend/src/lib/apollo-client.ts`
- `frontend/src/lib/apollo-client-ssr.ts`
- `frontend/src/services/emailService.ts`

All should have: `API_BASE_URL = 'http://localhost:4000'`

### Theme Toggle Issues

**Problem**: Theme toggle button not working, pages opening in dark theme by default.

**Solution**: Check that `usePageTheme` hook is not being used and theme state is managed globally through Zustand store.

### Correct Service Startup Order

**Problem**: Services not starting in the correct order causing API connection issues.

**Solution**: Start services in this specific order:

1. **API Gateway** (Port 4000) - Central routing hub
   ```bash
   cd backend/api-gateway
   npm run dev
   ```

2. **Catalog Service** (Port 4001) - Product data service
   ```bash
   cd backend/catalog-service
   npm run dev
   ```

3. **Frontend** (Port 3000) - React application
   ```bash
   cd frontend
   npm run dev
   ```

**Why this order matters**:
- API Gateway must start first to handle routing
- Catalog Service must be running before frontend tries to fetch products
- Frontend connects to API Gateway, which proxies to individual services

**Verification**:
- API Gateway: http://localhost:4000/health
- Catalog Service: http://localhost:4001/health  
- Frontend: http://localhost:3000
- Products API: http://localhost:4000/api/catalog/products

## 🎯 Roadmap

- [x] User authentication and authorization
- [x] Advanced product search and filtering
- [x] Order management system
- [x] Payment integration with Stripe
- [x] Admin dashboard
- [x] Email notifications
- [x] Product reviews and ratings
- [x] Inventory management
- [x] Analytics and reporting
- [ ] Mobile app (React Native)

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Express.js](https://expressjs.com/) for the web framework
- [MongoDB](https://www.mongodb.com/) for the database
- [Stripe](https://stripe.com/) for payment processing

## 🤖 Agent Summary

This README now serves as comprehensive context for AI agents working on the ApniDukaan e-commerce platform. Here's what agents need to know:

### 🎯 Key Points for Agents

1. **Architecture**: Microservices with API Gateway (Port 4000) as central routing hub
2. **Frontend**: Next.js 14 with App Router, Zustand for state management
3. **Backend**: Node.js/Express services with MongoDB and Redis
4. **API**: GraphQL primary, REST secondary through API Gateway
5. **Startup Order**: API Gateway → Catalog Service → Frontend → Other services

### 🔍 Quick Navigation for Agents

- **Frontend Entry**: `frontend/src/app/page.tsx`
- **API Gateway**: `backend/api-gateway/src/index.ts`
- **GraphQL Schema**: `backend/api-gateway/src/graphql/schema.ts`
- **Main Layout**: `frontend/src/components/layout/MainLayout.tsx`
- **Cart Logic**: `frontend/src/store/useCartStore.ts`
- **Product Service**: `backend/catalog-service/src/services/ProductService.ts`

### 🚨 Common Agent Tasks

1. **Adding Features**: Start with GraphQL schema, then resolvers, then frontend components
2. **Fixing Issues**: Check service startup order, API Gateway routing, environment variables
3. **Database Changes**: Update models in `backend/*/src/models/`, then services and routes
4. **Frontend Changes**: Update components in `frontend/src/components/`, then pages in `frontend/src/app/`

### 📚 Additional Resources

- **Detailed Docs**: Check `docs/` folder for specific guides
- **Environment**: Use `env.example` as template for configuration
- **Testing**: Use `tests/` directory for integration tests
- **Scripts**: Use `scripts/` directory for database and setup utilities

---

**Happy Coding! 🚀**