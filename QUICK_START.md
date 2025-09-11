# 🚀 ApniDukaan Quick Start Guide

## Get ApniDukaan Running in 5 Minutes!

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Step 1: Install Dependencies
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

### Step 2: Start All Services
```bash
# Option 1: Start everything at once
node start-simple.js

# Option 2: Start services individually (in separate terminals)
# Terminal 1: Frontend
cd frontend && npm run dev

# Terminal 2: API Gateway
cd backend/api-gateway && npm run dev

# Terminal 3: Catalog Service
cd backend/catalog-service && npm run dev

# Terminal 4: User Service
cd backend/user-service && npm run dev

# Terminal 5: Order Service
cd backend/order-service && npm run dev

# Terminal 6: Payment Service
cd backend/payment-service && npm run dev
```

### Step 3: Test the Application
```bash
# Test all services
node test-services.js

# Or test individual services
curl http://localhost:4000/health  # API Gateway
curl http://localhost:4001/health  # Catalog Service
curl http://localhost:4002/health  # User Service
curl http://localhost:4003/health  # Order Service
curl http://localhost:4004/health  # Payment Service
```

### Step 4: Access the Application
- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:4000
- **Health Checks**: http://localhost:4000/health

## 🎯 What You Get

### Frontend Features
- ✅ Modern, responsive e-commerce design
- ✅ Product catalog with search and filtering
- ✅ Shopping cart functionality
- ✅ User authentication (mock)
- ✅ Professional UI with Tailwind CSS

### Backend Services
- ✅ **API Gateway** (Port 4000) - Central routing
- ✅ **Catalog Service** (Port 4001) - Product management
- ✅ **User Service** (Port 4002) - Authentication
- ✅ **Order Service** (Port 4003) - Order processing
- ✅ **Payment Service** (Port 4004) - Payment handling

### API Endpoints
```
GET  /health                    - Health check
GET  /api/catalog/products      - List products
GET  /api/catalog/products/:id  - Get product details
GET  /api/users                 - List users
POST /api/users/auth/login      - User login
POST /api/users/auth/register   - User registration
GET  /api/orders                - List orders
POST /api/orders                - Create order
GET  /api/payments              - Payment methods
```

## 🔧 Development

### Project Structure
```
ApniDukaan-ecommerce/
├── frontend/                 # Next.js React app
├── backend/
│   ├── api-gateway/         # Central API router
│   ├── catalog-service/     # Product management
│   ├── user-service/        # User authentication
│   ├── order-service/       # Order processing
│   └── payment-service/     # Payment handling
├── start-simple.js          # Start all services
├── test-services.js         # Test service health
└── QUICK_START.md           # This file
```

### Environment Variables
The application runs with default settings. For production, create these files:
- `.env` (root)
- `frontend/.env.local`
- `backend/*/service/.env`

### Troubleshooting

#### Port Already in Use
```bash
# Kill processes on ports 3000-4004
npx kill-port 3000 4000 4001 4002 4003 4004
```

#### Services Not Starting
1. Check if all dependencies are installed
2. Verify Node.js version (18+)
3. Check console output for specific errors
4. Run `node test-services.js` to diagnose

#### Frontend Build Issues
```bash
cd frontend
npm run build
npm run type-check
```

## 🎉 Success!

If everything is working, you should see:
- Frontend running at http://localhost:3000
- All services showing "healthy" status
- Professional e-commerce interface
- Working API endpoints

## 🚀 Next Steps

1. **Customize the UI** - Update colors, branding, content
2. **Add Real Data** - Connect to actual databases
3. **Implement Features** - Add real authentication, payments
4. **Deploy** - Use Docker or cloud platforms

## 📞 Support

If you encounter issues:
1. Check the console output for errors
2. Verify all services are running
3. Test individual endpoints
4. Check the project documentation

**Happy coding! 🛍️✨**
