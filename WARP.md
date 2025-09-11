# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

ApniDukaan is a full-stack e-commerce platform built with a microservices architecture. The system is designed for scalability and uses modern technologies including Next.js, Node.js microservices, GraphQL, MongoDB, Redis, Kafka, Docker, and Kubernetes.

## Architecture

### High-Level System Architecture

The platform follows a microservices architecture with the following key components:

- **Frontend**: Next.js 15 application with App Router and Server Components
- **API Gateway**: Apollo Federation gateway that routes GraphQL requests to microservices
- **Microservices**: Four independent services handling specific business domains:
  - **Catalog Service** (Port 4001): Product catalog, categories, reviews, image management via S3
  - **User Service** (Port 4002): User authentication, profiles, wishlists, JWT tokens
  - **Order Service** (Port 4003): Order processing, cart management, order tracking
  - **Payment Service** (Port 4004): Payment processing with Stripe/PayPal integration
- **Shared Package**: Common utilities, types, and middleware shared across services

### Technology Stack

- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS, Apollo Client, Zustand, NextAuth.js
- **Backend**: Node.js, Express, Apollo Server, GraphQL Federation, TypeScript
- **Databases**: MongoDB (per-service databases), Redis (caching/sessions)
- **Message Queue**: Apache Kafka for inter-service communication
- **Storage**: AWS S3 (or MinIO for local development)
- **Infrastructure**: Docker, Kubernetes, Nginx load balancer

### Service Communication

- **Frontend ↔ API Gateway**: GraphQL over HTTP
- **API Gateway ↔ Microservices**: Apollo Federation with service composition
- **Service-to-Service**: Kafka events for asynchronous communication
- **Caching**: Redis for session management and performance optimization

## Development Commands

### Initial Setup
```bash
# Install all workspace dependencies
npm install

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your configuration
```

### Development Workflow

```bash
# Start all services in development mode
npm run dev

# Start frontend only
npm run dev:frontend

# Start backend services only
npm run dev:backend

# Start specific service
npm run dev --workspace=backend/catalog-service
npm run dev --workspace=frontend
```

### Docker Development

```bash
# Start all services with Docker Compose
npm run docker:up

# Build Docker images
npm run docker:build

# Stop Docker services
npm run docker:down

# View Docker logs
docker-compose -f infrastructure/docker/docker-compose.yml logs -f [service-name]
```

### Testing

```bash
# Run all tests
npm test

# Run tests for specific service
npm test --workspace=frontend
npm test --workspace=backend/catalog-service

# Run tests in watch mode
npm run test:watch --workspace=frontend
```

### Code Quality

```bash
# Lint all workspaces
npm run lint

# Format code with Prettier
npm run format

# Type checking
npm run type-check
```

### Build & Deployment

```bash
# Build all services
npm run build

# Build specific components
npm run build:frontend
npm run build:backend

# Kubernetes deployment
npm run k8s:deploy
npm run k8s:delete
```

### Individual Service Commands

For working with specific services, navigate to their directory or use workspace commands:

```bash
# Catalog Service
npm run dev --workspace=backend/catalog-service
npm run test --workspace=backend/catalog-service
npm run lint --workspace=backend/catalog-service

# User Service  
npm run dev --workspace=backend/user-service
npm run test --workspace=backend/user-service

# Order Service
npm run dev --workspace=backend/order-service  
npm run test --workspace=backend/order-service

# Payment Service
npm run dev --workspace=backend/payment-service
npm run test --workspace=backend/payment-service

# API Gateway
npm run dev --workspace=backend/api-gateway
npm run test --workspace=backend/api-gateway
```

## Service Endpoints

| Service | Port | URL | GraphQL Endpoint |
|---------|------|-----|------------------|
| Frontend | 3000 | http://localhost:3000 | - |
| API Gateway | 4000 | http://localhost:4000 | http://localhost:4000/graphql |
| Catalog Service | 4001 | http://localhost:4001 | Direct service access |
| User Service | 4002 | http://localhost:4002 | Direct service access |
| Order Service | 4003 | http://localhost:4003 | Direct service access |
| Payment Service | 4004 | http://localhost:4004 | Direct service access |

## Important Architecture Notes

### Workspace Structure
The project uses npm workspaces to manage dependencies across all services. The root `package.json` defines workspace patterns and shared scripts.

### Database Strategy
Each microservice has its own MongoDB database to maintain service isolation:
- `ApniDukaan_catalog` - Products, categories, reviews
- `ApniDukaan_users` - Users, profiles, wishlists  
- `ApniDukaan_orders` - Orders, carts, order items
- `ApniDukaan_payments` - Payments, payment methods, transactions

### Event-Driven Architecture
Services communicate asynchronously through Kafka topics for:
- Order status updates
- Payment confirmations
- Inventory changes
- User activity tracking

### Authentication Flow
- JWT-based authentication managed by User Service
- NextAuth.js handles frontend authentication
- API Gateway validates JWT tokens for protected routes
- Refresh token mechanism for session management

### GraphQL Federation
The API Gateway uses Apollo Federation to compose schemas from all microservices, providing a unified GraphQL API to the frontend while maintaining service autonomy.

## Development Guidelines

### Environment Configuration
- Use `.env.example` as template for environment variables
- Each service can override environment variables as needed
- Docker Compose provides development environment with all dependencies

### Testing Strategy
- Unit tests with Jest for business logic
- Integration tests for database operations
- End-to-end tests for critical user flows
- GraphQL schema validation

### Code Organization
- Shared types and utilities in `backend/shared` workspace
- Service-specific code isolated in respective directories
- Frontend components follow Next.js App Router conventions
- GraphQL schemas use federation directives for composition

### Local Development
- MongoDB, Redis, Kafka, and MinIO run in Docker containers
- Each service has hot-reload enabled in development mode
- Use GraphQL playground at http://localhost:4000/graphql for API testing
