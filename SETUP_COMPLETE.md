# 🚀 ApniDukaan Complete Setup Guide

## ✅ What's Been Fixed

### 🔧 **Backend Services Integration**
- ✅ Created Dockerfiles for all backend services
- ✅ Updated docker-compose.yml to include all services
- ✅ Fixed API Gateway to route to microservices instead of direct MongoDB
- ✅ Removed over-engineered monitoring stack (Prometheus, Grafana, Kafka, Elasticsearch)
- ✅ Added proper service dependencies and networking

### 🔗 **Frontend Integration**
- ✅ Created real search service integration
- ✅ Created cart service integration with offline fallback
- ✅ Created notification service integration
- ✅ Updated SmartSearch component to use real API
- ✅ Added proper error handling and fallbacks

### 🗂️ **Services Now Included**
- **API Gateway** (Port 4000) - Routes to all microservices
- **Catalog Service** (Port 4001) - Product management
- **User Service** (Port 4002) - Authentication & user management
- **Order Service** (Port 4003) - Order processing
- **Payment Service** (Port 4004) - Payment processing
- **Cart Service** (Port 4005) - Shopping cart management
- **Search Service** (Port 4006) - Product search
- **Notification Service** (Port 4007) - Email/SMS notifications
- **Order Management Service** (Port 4008) - Advanced order management

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- Git

### 1. Clone and Setup
```bash
git clone <your-repo>
cd apnidukaan-ecommerce
chmod +x scripts/setup-complete.sh
./scripts/setup-complete.sh
```

### 2. Manual Setup (Alternative)
```bash
# Install dependencies
npm install
npm run setup

# Copy environment file
cp env.local.example .env

# Update .env with your API keys
nano .env

# Start all services
docker-compose up -d

# Check health
curl http://localhost:4000/health
```

### 3. Verify Setup
- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:4000
- **Health Check**: http://localhost:4000/health
- **API Status**: http://localhost:4000/api/status

## 🔧 Environment Configuration

Update your `.env` file with these essential variables:

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/apnidukaan
REDIS_URL=redis://localhost:6379

# JWT Secrets
JWT_ACCESS_SECRET=your-super-secret-jwt-access-key
JWT_REFRESH_SECRET=your-super-secret-jwt-refresh-key

# Payment Gateways (Required for payments)
RAZORPAY_KEY_ID=rzp_test_your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Email Service (Required for notifications)
SENDGRID_API_KEY=your-sendgrid-api-key
FROM_EMAIL=noreply@apnidukaan.com

# SMS Service (Optional)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
```

## 📊 Service Architecture

```
Frontend (Next.js) → API Gateway → Microservices
                    ↓
    ┌─────────────────────────────────────┐
    │           API Gateway               │
    │         (Port 4000)                 │
    └─────────────────────────────────────┘
                    ↓
    ┌─────────────────────────────────────┐
    │         Microservices               │
    │  ┌─────────┐ ┌─────────┐ ┌─────────┐│
    │  │Catalog  │ │  User   │ │  Order  ││
    │  │Service  │ │ Service │ │ Service ││
    │  │ :4001   │ │ :4002   │ │ :4003   ││
    │  └─────────┘ └─────────┘ └─────────┘│
    │  ┌─────────┐ ┌─────────┐ ┌─────────┐│
    │  │Payment  │ │  Cart   │ │ Search  ││
    │  │Service  │ │ Service │ │ Service ││
    │  │ :4004   │ │ :4005   │ │ :4006   ││
    │  └─────────┘ └─────────┘ └─────────┘│
    │  ┌─────────┐ ┌─────────────────────┐│
    │  │Notify   │ │   Order Management  ││
    │  │Service  │ │      Service        ││
    │  │ :4007   │ │        :4008        ││
    │  └─────────┘ └─────────────────────┘│
    └─────────────────────────────────────┘
                    ↓
    ┌─────────────────────────────────────┐
    │         Infrastructure              │
    │  ┌─────────┐ ┌─────────┐ ┌─────────┐│
    │  │MongoDB   │ │  Redis   │ │ MinIO   ││
    │  │ :27017   │ │ :6379    │ │ :9000   ││
    │  └─────────┘ └─────────┘ └─────────┘│
    └─────────────────────────────────────┘
```

## 🛠️ Development Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f api-gateway

# Restart a service
docker-compose restart api-gateway

# Stop all services
docker-compose down

# Rebuild and start
docker-compose up --build -d

# Check service health
curl http://localhost:4000/health
```

## 🔍 API Endpoints

### Core Endpoints
- `GET /health` - Health check
- `GET /api/status` - Service status

### Product Management
- `GET /api/catalog/products` - List products
- `GET /api/catalog/products/:id` - Get product
- `GET /api/catalog/categories` - List categories

### Search
- `GET /api/search/products` - Search products
- `GET /api/search/suggestions` - Get search suggestions
- `GET /api/search/trending` - Get trending searches

### User Management
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/users/profile` - Get user profile

### Cart Management
- `GET /api/cart` - Get cart
- `POST /api/cart/add` - Add to cart
- `PUT /api/cart/items/:id` - Update cart item
- `DELETE /api/cart/items/:id` - Remove from cart

### Order Management
- `GET /api/orders` - List orders
- `POST /api/orders` - Create order
- `GET /api/orders/:id` - Get order details

### Payment
- `POST /api/payments/razorpay/create-order` - Create Razorpay order
- `POST /api/payments/razorpay/verify` - Verify payment

### Notifications
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `GET /api/notifications/unread-count` - Get unread count

## 🐛 Troubleshooting

### Common Issues

1. **Services not starting**
   ```bash
   docker-compose logs -f [service-name]
   ```

2. **Database connection issues**
   ```bash
   docker-compose restart mongodb redis
   ```

3. **Port conflicts**
   ```bash
   # Check what's using the ports
   lsof -i :3000
   lsof -i :4000
   ```

4. **Environment variables not loaded**
   ```bash
   # Check if .env file exists and has correct values
   cat .env
   ```

### Health Checks
```bash
# Check all services
curl http://localhost:4000/health

# Check individual services
curl http://localhost:4001/health  # Catalog
curl http://localhost:4002/health  # User
curl http://localhost:4003/health  # Order
curl http://localhost:4004/health  # Payment
curl http://localhost:4005/health  # Cart
curl http://localhost:4006/health  # Search
curl http://localhost:4007/health  # Notification
curl http://localhost:4008/health  # Order Management
```

## 📈 What's Working Now

### ✅ **Fully Integrated**
- Product catalog with real database
- User authentication and management
- Shopping cart with offline support
- Product search with suggestions
- Order processing and management
- Payment integration (Razorpay)
- Email/SMS notifications
- Real-time service communication

### ✅ **Frontend Features**
- Responsive design
- Product search with autocomplete
- Shopping cart with persistence
- User authentication
- Order tracking
- Notification system
- Offline functionality

### ✅ **Backend Features**
- Microservices architecture
- Service-to-service communication
- Database integration
- Caching with Redis
- File storage with MinIO
- Error handling and logging
- Health monitoring

## 🎯 Next Steps

1. **Configure Payment Gateways**
   - Set up Razorpay account
   - Add API keys to `.env`

2. **Configure Email Service**
   - Set up SendGrid account
   - Add API key to `.env`

3. **Configure SMS Service** (Optional)
   - Set up Twilio account
   - Add credentials to `.env`

4. **Deploy to Production**
   - Use the provided Kubernetes manifests
   - Set up proper monitoring
   - Configure SSL certificates

## 🆘 Support

If you encounter any issues:

1. Check the service logs: `docker-compose logs -f [service-name]`
2. Verify environment variables: `cat .env`
3. Check service health: `curl http://localhost:4000/health`
4. Restart services: `docker-compose restart`

The project is now fully integrated and ready for development! 🎉
