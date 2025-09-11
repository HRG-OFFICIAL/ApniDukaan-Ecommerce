# Deployment Configuration Guide

## Docker Setup

### 1. Main Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  # Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=http://api-gateway:4000
    depends_on:
      - api-gateway
    networks:
      - ApniDukaan-network

  # API Gateway
  api-gateway:
    build:
      context: ./backend/api-gateway
      dockerfile: Dockerfile
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
      - CATALOG_SERVICE_URL=http://catalog-service:4001
      - USER_SERVICE_URL=http://user-service:4002
      - ORDER_SERVICE_URL=http://order-service:4003
      - PAYMENT_SERVICE_URL=http://payment-service:4004
    depends_on:
      - catalog-service
      - user-service
      - order-service
      - payment-service
    networks:
      - ApniDukaan-network

  # Catalog Service
  catalog-service:
    build:
      context: ./backend/catalog-service
      dockerfile: Dockerfile
    ports:
      - "4001:4001"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongodb:27017/ApniDukaan_catalog
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongodb
      - redis
    networks:
      - ApniDukaan-network

  # User Service
  user-service:
    build:
      context: ./backend/user-service
      dockerfile: Dockerfile
    ports:
      - "4002:4002"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongodb:27017/ApniDukaan_users
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongodb
      - redis
    networks:
      - ApniDukaan-network

  # Order Service
  order-service:
    build:
      context: ./backend/order-service
      dockerfile: Dockerfile
    ports:
      - "4003:4003"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongodb:27017/ApniDukaan_orders
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongodb
      - redis
    networks:
      - ApniDukaan-network

  # Payment Service
  payment-service:
    build:
      context: ./backend/payment-service
      dockerfile: Dockerfile
    ports:
      - "4004:4004"
    environment:
      - NODE_ENV=production
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
      - PAYPAL_CLIENT_ID=${PAYPAL_CLIENT_ID}
      - PAYPAL_CLIENT_SECRET=${PAYPAL_CLIENT_SECRET}
    networks:
      - ApniDukaan-network

  # MongoDB
  mongodb:
    image: mongo:6.0
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=password
    volumes:
      - mongodb_data:/data/db
      - ./infrastructure/docker/mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js:ro
    networks:
      - ApniDukaan-network

  # Redis
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - ApniDukaan-network

  # Nginx (Reverse Proxy)
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./infrastructure/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./infrastructure/nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - frontend
      - api-gateway
    networks:
      - ApniDukaan-network

volumes:
  mongodb_data:
  redis_data:

networks:
  ApniDukaan-network:
    driver: bridge
```

### 2. Frontend Dockerfile
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### 3. Backend Service Dockerfile
```dockerfile
# backend/catalog-service/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 4001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4001/health || exit 1

# Start the application
CMD ["npm", "start"]
```

## Kubernetes Deployment

### 1. Namespace
```yaml
# infrastructure/k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: ApniDukaan
  labels:
    name: ApniDukaan
```

### 2. ConfigMap
```yaml
# infrastructure/k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: ApniDukaan-config
  namespace: ApniDukaan
data:
  NODE_ENV: "production"
  MONGODB_URI: "mongodb://mongodb:27017/ApniDukaan"
  REDIS_URL: "redis://redis:6379"
  JWT_SECRET: "your-jwt-secret"
```

### 3. Frontend Deployment
```yaml
# infrastructure/k8s/frontend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: ApniDukaan
spec:
  replicas: 3
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: ApniDukaan/frontend:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: NEXT_PUBLIC_API_URL
          value: "http://api-gateway:4000"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: frontend-service
  namespace: ApniDukaan
spec:
  selector:
    app: frontend
  ports:
  - port: 3000
    targetPort: 3000
  type: ClusterIP
```

### 4. Ingress
```yaml
# infrastructure/k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ApniDukaan-ingress
  namespace: ApniDukaan
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
spec:
  tls:
  - hosts:
    - ApniDukaan.com
    - www.ApniDukaan.com
    secretName: ApniDukaan-tls
  rules:
  - host: ApniDukaan.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-service
            port:
              number: 3000
  - host: api.ApniDukaan.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: api-gateway-service
            port:
              number: 4000
```

## CI/CD Pipeline

### 1. GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Run linting
      run: npm run lint
    
    - name: Type check
      run: npm run type-check

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build frontend
      run: cd frontend && npm run build
    
    - name: Build backend services
      run: |
        cd backend/catalog-service && npm run build
        cd ../user-service && npm run build
        cd ../order-service && npm run build
        cd ../payment-service && npm run build
        cd ../api-gateway && npm run build

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to production
      run: |
        # Add your deployment commands here
        echo "Deploying to production..."
```

### 2. Environment Variables for Production
```bash
# Production environment variables
NODE_ENV=production
PORT=3000
API_PORT=4000

# Database URLs (use cloud providers)
DATABASE_URL=mongodb+srv://user:pass@cluster.mongodb.net/ApniDukaan
POSTGRES_URL=postgresql://user:pass@host:5432/ApniDukaan
REDIS_URL=redis://user:pass@host:6379

# JWT Secrets (use strong, unique secrets)
JWT_SECRET=your-super-secure-jwt-secret-for-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-super-secure-refresh-secret

# API Keys (use production keys)
STRIPE_SECRET_KEY=sk_live_your_stripe_live_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_live_publishable_key
PAYPAL_CLIENT_ID=your_paypal_live_client_id
PAYPAL_CLIENT_SECRET=your_paypal_live_client_secret

# Email Configuration
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your-email@yourdomain.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@yourdomain.com

# External Services
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS (use your production domain)
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/ApniDukaan/app.log
```

## Monitoring and Logging

### 1. Health Check Endpoints
```typescript
// Health check for all services
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version,
    environment: process.env.NODE_ENV,
  });
});
```

### 2. Logging Configuration
```typescript
// backend/shared/src/utils/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'ApniDukaan' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

export default logger;
```

## Performance Optimization

### 1. Caching Strategy
```typescript
// Redis caching for products
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export const cacheProduct = async (productId: string, product: any) => {
  await redis.setex(`product:${productId}`, 3600, JSON.stringify(product));
};

export const getCachedProduct = async (productId: string) => {
  const cached = await redis.get(`product:${productId}`);
  return cached ? JSON.parse(cached) : null;
};
```

### 2. Database Indexing
```javascript
// MongoDB indexes for better performance
db.products.createIndex({ "name": "text", "description": "text" });
db.products.createIndex({ "category": 1 });
db.products.createIndex({ "price": 1 });
db.products.createIndex({ "createdAt": -1 });

db.users.createIndex({ "email": 1 }, { unique: true });
db.orders.createIndex({ "userId": 1 });
db.orders.createIndex({ "status": 1 });
db.orders.createIndex({ "createdAt": -1 });
```
