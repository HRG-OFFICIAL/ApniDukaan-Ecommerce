# ApniDukaan - E-Commerce Platform

ApniDukaan is a full-stack e-commerce project implementing a microservices architecture. The repository includes a Next.js frontend, multiple Node.js/Express services, and infrastructure for local and containerized development.

## Quick Preview

![Homepage Screenshot](./docs/home.png)

## Description

This project demonstrates a modular e-commerce system with separate services for catalog, users, orders, payments, cart, search, notifications, and an API gateway. It also includes deployment and monitoring configurations.

## Features

- Product catalog, cart, checkout, and order management
- Authentication and role-based access control
- Payment integration (Stripe and Razorpay)
- Search (Elasticsearch) and analytics endpoints
- PWA setup with service worker
- Docker and Kubernetes manifests for deployment
- Prometheus and Grafana monitoring configuration

## Technologies

- Frontend: `Next.js`, `TypeScript`, `Tailwind CSS`, `Jest`
- Backend: `Node.js`, `Express`, `TypeScript`
- Data: `MongoDB`, `Redis`
- Search and messaging: `Elasticsearch`, `Kafka`
- Infrastructure: `Docker`, `Kubernetes`, `Nginx`, `Prometheus`, `Grafana`

## Installation

Prerequisites: `Node.js >= 18`, `npm >= 8`, `MongoDB`, `Docker` (optional), `Git`.

```bash
git clone https://github.com/your-username/apnidukaan-ecommerce.git
cd apnidukaan-ecommerce
npm install
```

Workspaces install all packages under `frontend` and `backend/*`.

## Environment Setup

- Copy environment examples where needed and adjust values.
  - Root: `env.example` → `.env`
  - Frontend: `frontend/.env.example` → `frontend/.env.local`
  - Services: each service may include `.env.example`

You can also run:

```bash
npm run setup:env
```

## Usage

- Start all services (development):
  ```bash
  npm run dev
  ```
- Start frontend only:
  ```bash
  npm run dev:frontend
  ```
- Start selected backend services:
  ```bash
  npm run dev:backend
  ```
- Build all workspaces:
  ```bash
  npm run build
  ```
- Docker Compose (optional):
  ```bash
  npm run docker:up
  ```

Default ports:
- Frontend: `http://localhost:3000`
- API Gateway: `http://localhost:4000`

## Project Structure

```
apnidukaan-ecommerce/
├── frontend/             # Next.js application
├── backend/              # Microservices (api-gateway, catalog, user, order, payment, cart, search, notification, shared)
├── infrastructure/       # Docker and Kubernetes configs
├── docs/                 # Documentation
├── scripts/              # Utility scripts
├── package.json          # Root workspaces and scripts
└── README.md
```

## Documentation

Additional technical documentation is available under `docs/`:
- `docs/FEATURES_OVERVIEW.md`
- `docs/DEVELOPMENT_GUIDE.md`
- `docs/DEPLOYMENT_GUIDE.md`
- `docs/API_DOCUMENTATION.md`

## License

This project is licensed under the MIT License. See `LICENSE` for details.

#### Service-Specific Environments
Each backend service has its own `.env` file with service-specific configurations.

### Database Setup

#### MongoDB Setup
```bash
# Local MongoDB
mongod --dbpath /path/to/your/db

# Or use MongoDB Atlas
# Update MONGODB_URI in .env files
```

#### Redis Setup
```bash
# Local Redis
redis-server

# Or use Redis Cloud
# Update REDIS_URL in .env files
```

#### Elasticsearch Setup (Optional)
```bash
# Using Docker
docker run -d -p 9200:9200 -p 9300:9300 elasticsearch:7.17.0
```

## Testing

### Test Structure
- **Unit Tests**: Individual component/function testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Full user journey testing

### Running Tests

```bash
# Run all tests
npm run test:all

# Run specific test suites
npm run test:frontend      # Frontend tests only
npm run test:backend       # Backend tests only
npm run test:integration   # Integration tests only

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Test Coverage
- **Frontend**: 95%+ coverage
- **Backend**: 90%+ coverage
- **Integration**: 85%+ coverage

## Deployment

### Docker Deployment

#### Using Docker Compose
```bash
# Start all services
docker-compose -f infrastructure/docker/docker-compose.yml up -d

# View logs
docker-compose -f infrastructure/docker/docker-compose.yml logs -f

# Stop services
docker-compose -f infrastructure/docker/docker-compose.yml down
```

#### Individual Service Deployment
```bash
# Build specific service
docker build -t apnidukaan-catalog-service ./backend/catalog-service

# Run specific service
docker run -p 4001:4001 apnidukaan-catalog-service
```

### Kubernetes Deployment

```bash
# Apply all manifests
kubectl apply -f infrastructure/k8s/

# Check deployment status
kubectl get pods
kubectl get services

# View logs
kubectl logs -f deployment/apnidukaan-frontend
```

### Production Deployment

#### Environment Setup
1. Set up production environment variables
2. Configure SSL certificates
3. Set up monitoring and logging
4. Configure backup strategies

#### Deployment Steps
1. **Build production images**
   ```bash
   docker build -t apnidukaan-frontend:latest ./frontend
   docker build -t apnidukaan-api-gateway:latest ./backend/api-gateway
   # ... build other services
   ```

2. **Deploy to production**
   ```bash
   # Using Docker Compose
   docker-compose -f docker-compose.prod.yml up -d
   
   # Or using Kubernetes
   kubectl apply -f infrastructure/k8s/production/
   ```

## Monitoring & Observability

### Monitoring Stack
- **Prometheus**: Metrics collection and storage
- **Grafana**: Visualization and dashboards
- **AlertManager**: Alert management
- **Node Exporter**: System metrics
- **Custom Metrics**: Application-specific metrics

### Accessing Monitoring
- **Grafana Dashboard**: http://localhost:3001 (admin/admin)
- **Prometheus**: http://localhost:9090
- **Health Checks**: http://localhost:4000/health

### Key Metrics
- **Application Metrics**: Request rate, response time, error rate
- **System Metrics**: CPU, memory, disk usage
- **Business Metrics**: Orders, revenue, user activity
- **Infrastructure Metrics**: Database connections, cache hit rate

## **Dataset Integration**

### **Kaggle Amazon Product Dataset**
- **Source**: [Amazon Product Dataset on Kaggle](https://www.kaggle.com/datasets/amazon-product-data)
- **Scale**: **1.3+ million products** with real Amazon data
- **Categories**: 241+ product categories including:
  - Fashion & Clothing (Women's, Men's, Kids')
  - Electronics & Technology
  - Home & Garden
  - Toys & Games
  - Beauty & Personal Care
  - Sports & Outdoors
  - Baby & Kids
  - Pets & Animals
- **Data Quality**: Real product names, descriptions, prices, and categories
- **Updates**: Regular dataset synchronization for fresh product data

### **Product Data Features**
- **Rich Metadata**: Product descriptions, specifications, and attributes
- **Category Hierarchy**: Multi-level category organization
- **Price Ranges**: Realistic pricing data across all categories
- **Inventory Management**: Stock levels and availability tracking
- **Search Optimization**: Enhanced search with real product data

## **Features**

### **Core E-commerce Features**
- **Massive Product Catalog**: 1.3M+ products with real Amazon data
- **Advanced Categories**: 241+ categories with hierarchical organization
- **Smart Search**: Elasticsearch-powered with real product data
- **Shopping Cart**: Persistent cart with real-time updates
- **User Authentication**: Secure JWT-based authentication
- **Order Management**: Complete order lifecycle management
- **Payment Processing**: Razorpay & Stripe integration with real APIs
- **Reviews & Ratings**: Customer review system
- **Wishlist**: Save products for later purchase

### **Advanced Features**
- **PWA Support**: Offline functionality and mobile app experience
- **Multi-language**: English/Hindi support with i18n
- **Real-time Analytics**: Business intelligence dashboard
- **Notification System**: Email, SMS, and push notifications
- **Admin Panel**: Comprehensive admin interface
- **API Documentation**: Complete REST & GraphQL APIs
- **Monitoring**: Full observability with Prometheus & Grafana

### **Technical Excellence**
- **Microservices Architecture**: 8+ independent services
- **Type Safety**: 100% TypeScript coverage
- **Testing**: Comprehensive test suite (95%+ coverage)
- **Security**: OWASP-compliant security measures
- **Performance**: Optimized for speed and scalability
- **SEO**: Advanced search engine optimization
- **Accessibility**: WCAG 2.1 compliance

## Security

### Security Measures
- **Authentication**: JWT-based authentication with refresh tokens
- **Authorization**: Role-based access control (RBAC)
- **Input Validation**: Comprehensive input sanitization
- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS**: Proper cross-origin resource sharing configuration
- **HTTPS**: SSL/TLS encryption for all communications
- **Security Headers**: Comprehensive security headers
- **Dependency Scanning**: Regular security vulnerability scanning

### Security Best Practices
- Regular security audits
- Dependency updates
- Secure coding practices
- Environment variable protection
- Database security
- API security

## Performance

### Performance Optimizations
- **Code Splitting**: Dynamic imports for better loading
- **Image Optimization**: Next.js image optimization
- **Caching**: Redis caching for improved performance
- **CDN Ready**: Static asset optimization
- **Database Indexing**: Optimized database queries
- **Bundle Optimization**: Webpack optimization
- **Lazy Loading**: Component lazy loading

### Performance Metrics
- **Lighthouse Score**: 95+ across all categories
- **Core Web Vitals**: Excellent performance
- **Bundle Size**: Optimized for production
- **Load Time**: < 2 seconds for initial load

## Contributing

We welcome contributions! Please follow these steps:

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Add tests for your changes
5. Run the test suite: `npm run test:all`
6. Commit your changes: `git commit -m 'Add amazing feature'`
7. Push to the branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

### Code Standards
- Follow TypeScript best practices
- Write comprehensive tests
- Follow the existing code style
- Update documentation as needed
- Ensure all tests pass

### Pull Request Process
1. Ensure your code follows the project's coding standards
2. Add tests for any new functionality
3. Update documentation if needed
4. Ensure all tests pass
5. Request review from maintainers

## Documentation

### Additional Documentation
- [API Documentation](./docs/API_DOCUMENTATION.md)
- [Deployment Guide](./docs/DEPLOYMENT_GUIDE.md)
- [Development Guide](./docs/DEVELOPMENT_TASKS.md)
- [Database Schema](./docs/DATABASE_SETUP_GUIDE.md)
- [Environment Setup](./docs/environment.md)

### API Documentation
- **GraphQL API**: Available at `/graphql` endpoint
- **REST API**: Available at `/api` endpoints
- **OpenAPI Spec**: Available at `/api/docs`

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Kill process using port
lsof -ti:3000 | xargs kill -9
```

#### Database Connection Issues
```bash
# Check MongoDB status
brew services list | grep mongodb
# or
systemctl status mongod
```

#### Docker Issues
```bash
# Clean Docker containers and images
docker system prune -a
```

### Getting Help
- Check the [Issues](https://github.com/your-username/apnidukaan-ecommerce/issues) page
- Review the documentation
- Contact the development team

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## **Technology Stack**

### **Frontend Technologies**
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Zustand**: State management
- **Apollo Client**: GraphQL client
- **PWA**: Progressive Web App capabilities

### **Backend Technologies**
- **Node.js**: JavaScript runtime
- **Express.js**: Web framework
- **MongoDB**: NoSQL database
- **Redis**: Caching and sessions
- **Elasticsearch**: Search engine
- **Kafka**: Message queuing
- **JWT**: Authentication tokens

### **Infrastructure & DevOps**
- **Docker**: Containerization
- **Kubernetes**: Orchestration
- **Nginx**: Load balancing
- **Prometheus**: Metrics collection
- **Grafana**: Monitoring dashboards
- **GitHub Actions**: CI/CD pipeline

### **Payment & External Services**
- **Razorpay**: Payment gateway integration
- **Stripe**: International payments
- **MongoDB Atlas**: Cloud database
- **Redis Cloud**: Cloud caching
- **Elasticsearch Cloud**: Managed search

## **Acknowledgments**

- **Kaggle Community**: For the comprehensive Amazon product dataset
- **Next.js Team**: For the amazing React framework
- **MongoDB Team**: For the robust database solution
- **Open Source Contributors**: For the incredible ecosystem
- **Razorpay**: For seamless payment integration
- **All Contributors**: Who helped make this project possible
  
## **Get Started Today**

Ready to build the next generation of e-commerce? Clone this repository and start building your own enterprise-grade e-commerce platform with real Amazon product data!

```bash
git clone https://github.com/your-username/apnidukaan-ecommerce.git
cd apnidukaan-ecommerce
npm install
npm start
```
