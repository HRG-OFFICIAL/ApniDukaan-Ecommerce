# ShopSphere Environment Configuration Guide

## Main Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Application Settings
NODE_ENV=development
PORT=3000
API_PORT=4000

# Database Configuration
DATABASE_URL=mongodb://localhost:27017/shopsphere
POSTGRES_URL=postgresql://postgres:password@localhost:5432/shopsphere
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production

# API Keys
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@shopsphere.com

# File Upload
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=jpg,jpeg,png,gif,webp

# External Services
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Feature Flags
ENABLE_GRAPHQL=true
ENABLE_WEBSOCKETS=true
ENABLE_REDIS_CACHE=true
ENABLE_EMAIL_NOTIFICATIONS=true
```

## Service-Specific Environment Files

### Catalog Service (.env)
```bash
PORT=4001
MONGODB_URI=mongodb://localhost:27017/shopsphere_catalog
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

### API Gateway (.env)
```bash
PORT=4000
CATALOG_SERVICE_URL=http://localhost:4001
USER_SERVICE_URL=http://localhost:4002
ORDER_SERVICE_URL=http://localhost:4003
PAYMENT_SERVICE_URL=http://localhost:4004
```

### User Service (.env)
```bash
PORT=4002
MONGODB_URI=mongodb://localhost:27017/shopsphere_users
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

### Order Service (.env)
```bash
PORT=4003
MONGODB_URI=mongodb://localhost:27017/shopsphere_orders
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

### Payment Service (.env)
```bash
PORT=4004
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
```

## Frontend Environment (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
NEXT_PUBLIC_APP_NAME=ShopSphere
NEXT_PUBLIC_APP_VERSION=1.0.0
```
