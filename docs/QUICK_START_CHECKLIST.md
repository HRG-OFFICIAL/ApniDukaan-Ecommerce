# ApniDukaan Quick Start Checklist

## 🚀 Getting Started in 5 Minutes

Follow this checklist to get ApniDukaan running on your local machine quickly.

## ✅ Prerequisites Check

- [ ] **Node.js 18+** installed (`node --version`)
- [ ] **npm 9+** installed (`npm --version`)
- [ ] **Git** installed (`git --version`)
- [ ] **MongoDB** running locally or Atlas account
- [ ] **Redis** running locally (optional)

## 🛠️ Setup Steps

### 1. Clone and Install
```bash
# Clone the repository
git clone https://github.com/your-username/apnidukaan-ecommerce.git
cd apnidukaan-ecommerce

# Install all dependencies
npm install
```

### 2. Environment Setup
```bash
# Automated environment setup
npm run setup:env

# Or manually copy environment files
cp env.example .env
cp frontend/.env.local.example frontend/.env.local
```

### 3. Start Services
```bash
# Start all services (recommended)
npm start

# Or start individual services
npm run dev:frontend    # Frontend only
npm run dev:backend     # Backend services only
```

### 4. Verify Installation
- [ ] Frontend: http://localhost:3000
- [ ] API Gateway: http://localhost:4000
- [ ] Health Check: http://localhost:4000/health

## 🐳 Docker Setup (Alternative)

### 1. Start with Docker
```bash
# Start all services with Docker
docker-compose -f infrastructure/docker/docker-compose.yml up -d

# Check status
docker-compose -f infrastructure/docker/docker-compose.yml ps
```

### 2. View Logs
```bash
# View all logs
docker-compose -f infrastructure/docker/docker-compose.yml logs -f

# View specific service logs
docker-compose -f infrastructure/docker/docker-compose.yml logs -f frontend
```

## 🧪 Testing Setup

### 1. Run Tests
```bash
# Run all tests
npm run test:all

# Run specific tests
npm run test:frontend
npm run test:backend
```

### 2. Test Coverage
```bash
# Run tests with coverage
npm run test:coverage
```

## 📊 Database Setup

### 1. MongoDB Setup
```bash
# Local MongoDB
brew install mongodb-community
brew services start mongodb-community

# Or use MongoDB Atlas
# Update MONGODB_URI in .env files
```

### 2. Seed Database
```bash
# Seed with sample data
npm run seed

# Or reset database
npm run db:reset
```

## 🔧 Development Workflow

### 1. Make Changes
- [ ] Edit frontend code in `frontend/src/`
- [ ] Edit backend code in `backend/[service-name]/src/`
- [ ] Add tests for new features
- [ ] Update documentation if needed

### 2. Test Changes
```bash
# Run tests
npm run test:all

# Check types
npm run type-check

# Lint code
npm run lint
```

### 3. Build for Production
```bash
# Build all services
npm run build

# Build specific service
npm run build:frontend
npm run build:backend
```

## 🚀 Deployment

### 1. Docker Deployment
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

### 2. Kubernetes Deployment
```bash
# Deploy to Kubernetes
kubectl apply -f infrastructure/k8s/

# Check deployment
kubectl get pods
kubectl get services
```

## 📚 Documentation

### 1. Read Documentation
- [ ] [README.md](../README.md) - Project overview
- [ ] [API Documentation](./API_DOCUMENTATION.md) - API reference
- [ ] [Development Guide](./DEVELOPMENT_GUIDE.md) - Development guidelines
- [ ] [Deployment Guide](./DEPLOYMENT_GUIDE.md) - Deployment instructions
- [ ] [Features Overview](./FEATURES_OVERVIEW.md) - Complete feature list

### 2. API Testing
- [ ] Use Postman collection for API testing
- [ ] Test GraphQL queries in GraphQL Playground
- [ ] Verify all endpoints are working

## 🔍 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port
lsof -ti:3000

# Kill process
kill -9 $(lsof -ti:3000)
```

#### Database Connection Issues
```bash
# Check MongoDB status
brew services list | grep mongodb

# Check connection
mongo --host localhost:27017
```

#### Docker Issues
```bash
# Clean Docker
docker system prune -a

# Rebuild images
docker-compose build --no-cache
```

#### Permission Issues
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm

# Fix node_modules permissions
sudo chown -R $(whoami) node_modules
```

## 📞 Getting Help

### 1. Check Documentation
- [ ] Read the relevant documentation
- [ ] Check the troubleshooting section
- [ ] Look at existing issues

### 2. Create Issue
- [ ] Search existing issues first
- [ ] Create detailed issue description
- [ ] Include error logs and steps to reproduce

### 3. Contact Support
- [ ] Email: support@apnidukaan.com
- [ ] GitHub Issues: [Create an issue](https://github.com/your-username/apnidukaan-ecommerce/issues)

## ✅ Success Checklist

After completing setup, you should have:

- [ ] Frontend running on http://localhost:3000
- [ ] API Gateway running on http://localhost:4000
- [ ] All tests passing
- [ ] Database connected and seeded
- [ ] All services healthy
- [ ] Documentation accessible
- [ ] Development environment ready

## 🎯 Next Steps

### 1. Explore the Platform
- [ ] Browse the product catalog
- [ ] Test user registration and login
- [ ] Add products to cart
- [ ] Test checkout process
- [ ] Explore admin panel

### 2. Start Development
- [ ] Choose a feature to work on
- [ ] Create a feature branch
- [ ] Make your changes
- [ ] Add tests
- [ ] Submit a pull request

### 3. Learn More
- [ ] Read the development guide
- [ ] Explore the codebase
- [ ] Join the community
- [ ] Contribute to the project

---

**Welcome to ApniDukaan!** 🎉

*You're now ready to start building amazing e-commerce experiences.*
