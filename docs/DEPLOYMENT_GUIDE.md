# ApniDukaan Deployment Guide

## Overview

This guide covers deploying the ApniDukaan e-commerce platform to various environments, from development to production.

## Prerequisites

- Docker and Docker Compose
- Kubernetes cluster (for K8s deployment)
- Domain name and SSL certificates
- MongoDB Atlas account (for production)
- Redis Cloud account (for production)
- Vercel account (for frontend deployment)

## Environment Setup

### 1. Development Environment

#### Local Development
```bash
# Clone repository
git clone https://github.com/your-username/apnidukaan-ecommerce.git
cd apnidukaan-ecommerce

# Install dependencies
npm install
cd frontend && npm install && cd ..
cd backend/shared && npm install && cd ../..

# Setup environment
npm run setup:env

# Start all services
npm start
```

#### Docker Development
```bash
# Start with Docker Compose
docker-compose -f infrastructure/docker/docker-compose.yml up -d

# View logs
docker-compose -f infrastructure/docker/docker-compose.yml logs -f

# Stop services
docker-compose -f infrastructure/docker/docker-compose.yml down
```

### 2. Staging Environment

#### Environment Variables
Create `.env.staging` file:
```env
NODE_ENV=staging
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/apnidukaan-staging
REDIS_URL=redis://staging-redis:6379
JWT_SECRET=staging-jwt-secret
API_GATEWAY_URL=https://api-staging.apnidukaan.com
FRONTEND_URL=https://staging.apnidukaan.com
```

#### Deploy to Staging
```bash
# Build staging images
docker build -t apnidukaan-frontend:staging ./frontend
docker build -t apnidukaan-api-gateway:staging ./backend/api-gateway

# Deploy with Docker Compose
docker-compose -f docker-compose.staging.yml up -d
```

### 3. Production Environment

#### Environment Variables
Create `.env.production` file:
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/apnidukaan-prod
REDIS_URL=redis://prod-redis:6379
JWT_SECRET=production-jwt-secret-very-secure
API_GATEWAY_URL=https://api.apnidukaan.com
FRONTEND_URL=https://apnidukaan.com
STRIPE_SECRET_KEY=sk_live_...
RAZORPAY_KEY_ID=rzp_live_...
SMTP_HOST=smtp.gmail.com
SMTP_USER=noreply@apnidukaan.com
SMTP_PASS=app-password
```

## Deployment Methods

### Method 1: Docker Compose Deployment

#### 1. Prepare Production Configuration
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "80:3000"
      - "443:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://api.apnidukaan.com
    depends_on:
      - api-gateway

  api-gateway:
    build: ./backend/api-gateway
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=${MONGODB_URI}
      - REDIS_URL=${REDIS_URL}
    depends_on:
      - mongodb
      - redis

  mongodb:
    image: mongo:6.0
    volumes:
      - mongodb_data:/data/db
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=password

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./infrastructure/docker/nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - api-gateway

volumes:
  mongodb_data:
  redis_data:
```

#### 2. Deploy
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps
```

### Method 2: Kubernetes Deployment

#### 1. Create Namespace
```bash
kubectl create namespace apnidukaan
```

#### 2. Apply ConfigMaps
```bash
kubectl apply -f infrastructure/k8s/configmap.yaml
```

#### 3. Apply Secrets
```bash
kubectl create secret generic apnidukaan-secrets \
  --from-literal=mongodb-uri="mongodb+srv://..." \
  --from-literal=jwt-secret="your-jwt-secret" \
  --from-literal=redis-url="redis://..." \
  -n apnidukaan
```

#### 4. Deploy Services
```bash
# Deploy all services
kubectl apply -f infrastructure/k8s/

# Check deployment status
kubectl get pods -n apnidukaan
kubectl get services -n apnidukaan
```

#### 5. Apply Ingress
```bash
kubectl apply -f infrastructure/k8s/ingress.yaml
```

### Method 3: Vercel + Railway Deployment

#### Frontend (Vercel)
1. Connect GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

#### Backend (Railway)
1. Connect GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy each service separately

## SSL Certificate Setup

### Using Let's Encrypt
```bash
# Install certbot
sudo apt-get install certbot

# Generate certificates
sudo certbot certonly --standalone -d apnidukaan.com -d www.apnidukaan.com

# Copy certificates to Docker volume
sudo cp /etc/letsencrypt/live/apnidukaan.com/fullchain.pem ./ssl/cert.pem
sudo cp /etc/letsencrypt/live/apnidukaan.com/privkey.pem ./ssl/key.pem
```

### Using Cloudflare
1. Add domain to Cloudflare
2. Enable SSL/TLS encryption
3. Set SSL mode to "Full (strict)"
4. Enable "Always Use HTTPS"

## Database Setup

### MongoDB Atlas (Production)
1. Create MongoDB Atlas cluster
2. Configure network access (whitelist IPs)
3. Create database user
4. Get connection string
5. Update environment variables

### Local MongoDB (Development)
```bash
# Install MongoDB
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community

# Create database
mongo
> use apnidukaan
> db.createUser({user: "admin", pwd: "password", roles: ["readWrite"]})
```

## Redis Setup

### Redis Cloud (Production)
1. Create Redis Cloud account
2. Create database
3. Get connection string
4. Update environment variables

### Local Redis (Development)
```bash
# Install Redis
brew install redis

# Start Redis
brew services start redis

# Test connection
redis-cli ping
```

## Monitoring Setup

### Prometheus + Grafana
```bash
# Start monitoring stack
docker-compose -f infrastructure/docker/monitoring.yml up -d

# Access Grafana
open http://localhost:3001
# Username: admin, Password: admin
```

### Application Monitoring
1. Set up APM (Application Performance Monitoring)
2. Configure log aggregation
3. Set up alerting rules
4. Monitor key metrics

## Backup Strategy

### Database Backups
```bash
# MongoDB backup
mongodump --uri="mongodb+srv://..." --out=./backups/$(date +%Y%m%d)

# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --uri="$MONGODB_URI" --out="./backups/$DATE"
aws s3 cp "./backups/$DATE" "s3://apnidukaan-backups/$DATE" --recursive
```

### File Backups
```bash
# Backup uploaded files
tar -czf "uploads_$(date +%Y%m%d).tar.gz" ./uploads/
aws s3 cp "uploads_$(date +%Y%m%d).tar.gz" "s3://apnidukaan-backups/"
```

## Security Checklist

### Pre-deployment
- [ ] Environment variables secured
- [ ] SSL certificates configured
- [ ] Database access restricted
- [ ] API rate limiting enabled
- [ ] Security headers configured
- [ ] Dependencies updated
- [ ] Secrets management implemented

### Post-deployment
- [ ] Health checks working
- [ ] Monitoring alerts configured
- [ ] Backup strategy tested
- [ ] Security scan completed
- [ ] Performance testing done
- [ ] Load testing completed

## Performance Optimization

### Frontend Optimization
```bash
# Build with optimizations
npm run build

# Analyze bundle
npm run analyze

# Enable compression
# Add to nginx.conf
gzip on;
gzip_types text/plain text/css application/json application/javascript;
```

### Backend Optimization
```bash
# Enable clustering
NODE_ENV=production node -e "require('cluster').isMaster ? require('./cluster') : require('./app')"

# Enable compression
app.use(compression());

# Enable caching
app.use(express.static('public', { maxAge: '1d' }));
```

## Troubleshooting

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

#### Kubernetes Issues
```bash
# Check pod logs
kubectl logs -f deployment/apnidukaan-frontend

# Check pod status
kubectl describe pod <pod-name>

# Restart deployment
kubectl rollout restart deployment/apnidukaan-frontend
```

### Health Checks

#### API Health Check
```bash
curl http://localhost:4000/health
```

#### Database Health Check
```bash
curl http://localhost:4000/health/db
```

#### Redis Health Check
```bash
curl http://localhost:4000/health/redis
```

## Rollback Procedures

### Docker Compose Rollback
```bash
# Stop current deployment
docker-compose down

# Start previous version
docker-compose -f docker-compose.previous.yml up -d
```

### Kubernetes Rollback
```bash
# Rollback deployment
kubectl rollout undo deployment/apnidukaan-frontend

# Check rollback status
kubectl rollout status deployment/apnidukaan-frontend
```

## Maintenance

### Regular Tasks
- [ ] Monitor application logs
- [ ] Check database performance
- [ ] Update dependencies
- [ ] Review security alerts
- [ ] Test backup restoration
- [ ] Monitor resource usage

### Monthly Tasks
- [ ] Security audit
- [ ] Performance review
- [ ] Dependency updates
- [ ] Backup testing
- [ ] Disaster recovery testing

## Support

For deployment support:
- **Email**: devops@apnidukaan.com
- **Documentation**: [Deployment Docs](https://docs.apnidukaan.com/deployment)
- **Issues**: [GitHub Issues](https://github.com/your-username/apnidukaan-ecommerce/issues)

---

*Last updated: January 2024*