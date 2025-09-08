# Overview

ShopSphere is a comprehensive e-commerce platform built with a microservices architecture. The system features a Next.js frontend and multiple Node.js backend services that handle different business domains including user management, product catalog, order processing, and payment handling. The platform is designed for scalability and uses modern technologies like MongoDB, Redis, GraphQL Federation, and TypeScript throughout the entire stack.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Core Architecture Pattern
The system follows a **microservices architecture** with clear service boundaries:

- **Frontend**: Next.js 14 with App Router, TypeScript, and Tailwind CSS
- **API Gateway**: Express.js gateway that routes requests to appropriate microservices
- **Backend Services**: Independent Node.js services for different business domains
- **Shared Package**: Common utilities, types, and middleware shared across all services

## Service Structure
The platform consists of multiple specialized services:

1. **Catalog Service** (Port 4001): Manages products, categories, reviews, and product images
2. **User Service** (Port 4002): Handles authentication, user profiles, and user management
3. **Order Service** (Port 4003): Processes orders, manages shopping carts, and tracks fulfillment
4. **Cart Service**: Dedicated shopping cart management with Redis session storage
5. **Payment Service** (Port 4004): Processes payments through Stripe and PayPal
6. **API Gateway** (Port 4000): Routes requests and provides centralized access point

## Data Architecture
- **MongoDB**: Primary database with separate databases per service
- **Redis**: Caching layer and session storage
- **TypeScript**: End-to-end type safety across all services
- **Shared Types**: Common interfaces and enums in the shared package

## Communication Patterns
- **Frontend to Backend**: REST API calls through the API Gateway
- **Service-to-Service**: Direct HTTP calls and event-driven communication
- **Authentication**: JWT tokens with refresh token support
- **Session Management**: Redis-backed sessions for cart and user state

## Security Implementation
- **Helmet.js**: Security headers and CORS protection
- **Rate Limiting**: Multiple tiers of rate limiting per service
- **JWT Authentication**: Access and refresh tokens with configurable expiry
- **Input Validation**: Express-validator and Joi schema validation
- **Password Security**: Bcrypt hashing with salt rounds

## Development Approach
- **Workspace Configuration**: npm workspaces for monorepo management
- **Docker Support**: Containerization for all services and infrastructure
- **TypeScript**: Strict typing across frontend and backend
- **ESLint/Prettier**: Code formatting and linting standards
- **Testing**: Jest testing framework setup for all services

# External Dependencies

## Core Infrastructure
- **MongoDB**: Primary database for persistent storage
- **Redis**: Caching and session storage
- **Node.js**: Runtime environment for all backend services
- **Express.js**: Web framework for REST APIs

## Payment Processing
- **Stripe**: Primary payment processor for credit cards
- **PayPal**: Alternative payment method integration

## Authentication & Security
- **JWT**: Token-based authentication system
- **bcryptjs**: Password hashing
- **Helmet.js**: Security middleware
- **CORS**: Cross-origin resource sharing configuration

## Frontend Libraries
- **Next.js 14**: React framework with App Router
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Animation library
- **Zustand**: State management
- **React Hook Form**: Form handling

## Development & Build Tools
- **TypeScript**: Type safety across the stack
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Concurrently**: Parallel script execution
- **Nodemon**: Development server with hot reload

## Cloud Services (Optional)
- **AWS S3**: File storage for product images
- **SendGrid**: Email service for notifications
- **Twilio**: SMS services for notifications