# ShopSphere E-Commerce Platform

A full-stack e-commerce platform built with microservices architecture, featuring a modern React frontend and Node.js backend services.

## 🚀 Features

- **Modern Frontend**: Built with Next.js 14, React 18, and Tailwind CSS
- **Microservices Architecture**: Scalable backend with separate services
- **API Gateway**: Centralized routing and load balancing
- **Product Catalog**: Comprehensive product management
- **User Management**: Authentication and user profiles
- **Shopping Cart**: Real-time cart management
- **Order Processing**: Complete order lifecycle
- **Payment Integration**: Stripe payment processing
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
- **Stripe** - Payment processing

## 📋 Prerequisites

- Node.js 18+ 
- npm 8+
- MongoDB (local or cloud)
- Redis (optional, for caching)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd shopsphere-ecommerce
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
```bash
cp env.example .env
# Edit .env with your configuration
```

### 4. Start Development Servers

#### Option 1: Start All Services (Recommended)
```bash
node start-dev.js
```

#### Option 2: Start Services Individually
```bash
# Terminal 1 - Frontend
cd frontend && npm run dev

# Terminal 2 - API Gateway
cd backend/api-gateway && npm run dev

# Terminal 3 - Catalog Service
cd backend/catalog-service && npm run dev
```

### 5. Access the Application
- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:4000
- **Catalog Service**: http://localhost:4001

## 📁 Project Structure

```
shopsphere-ecommerce/
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

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017
REDIS_URL=redis://localhost:6379

# Service Ports
API_GATEWAY_PORT=4000
CATALOG_SERVICE_PORT=4001
USER_SERVICE_PORT=4002
ORDER_SERVICE_PORT=4003
PAYMENT_SERVICE_PORT=4004

# Frontend Configuration
FRONTEND_URL=http://localhost:3000

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Environment
NODE_ENV=development
```

## 🧪 Testing

### Frontend Tests
```bash
cd frontend
npm test
```

### Backend Tests
```bash
cd backend/catalog-service
npm test
```

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

### Catalog Service Endpoints
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `GET /api/categories` - Get all categories
- `GET /health` - Health check

### API Gateway Endpoints
- `GET /health` - Health check
- `GET /api/catalog/*` - Proxy to catalog service
- `GET /api/users/*` - Proxy to user service
- `GET /api/orders/*` - Proxy to order service
- `GET /api/payments/*` - Proxy to payment service

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/your-repo/issues) page
2. Create a new issue with detailed information
3. Join our community discussions

## 🎯 Roadmap

- [ ] User authentication and authorization
- [ ] Advanced product search and filtering
- [ ] Order management system
- [ ] Payment integration with Stripe
- [ ] Admin dashboard
- [ ] Email notifications
- [ ] Product reviews and ratings
- [ ] Inventory management
- [ ] Analytics and reporting
- [ ] Mobile app (React Native)

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Express.js](https://expressjs.com/) for the web framework
- [MongoDB](https://www.mongodb.com/) for the database
- [Stripe](https://stripe.com/) for payment processing

---

**Happy Coding! 🚀**