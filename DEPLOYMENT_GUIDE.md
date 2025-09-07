# ShopSphere Deployment Guide

This guide covers local development setup, Docker deployment, and production deployment on AWS with Kubernetes.

## 📋 Prerequisites

### Local Development
- **Node.js** >= 18.0.0
- **npm** >= 8.0.0
- **Git**

### Docker Development
- **Docker** >= 20.0.0
- **Docker Compose** >= 2.0.0

### Production Deployment
- **AWS CLI** configured
- **kubectl** for Kubernetes
- **Helm** (optional, for easier deployments)

## 🚀 Quick Start (Docker)

### 1. Clone and Setup Environment

```bash
git clone https://github.com/your-username/shopsphere-ecommerce.git
cd shopsphere-ecommerce

# Copy and configure environment variables
cp .env.example .env

# Edit .env with your configuration
# At minimum, set these required variables:
# - JWT_ACCESS_SECRET=your-secure-access-secret
# - JWT_REFRESH_SECRET=your-secure-refresh-secret
# - STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
# - STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
# - GOOGLE_CLIENT_ID=your-google-oauth-client-id
# - GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
# - SENDGRID_API_KEY=your-sendgrid-api-key
```

### 2. Start All Services

```bash
# Start all services with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Check service status
docker-compose ps
```

### 3. Initialize Data (Optional)

```bash
# Seed initial data
npm run seed

# Or manually access services:
# MongoDB: mongodb://localhost:27017
# Redis: redis://localhost:6379
# MinIO Console: http://localhost:9001 (minioadmin/minioadmin123)
```

### 4. Access Application

- **Frontend**: http://localhost:3000
- **GraphQL Playground**: http://localhost:4000/graphql
- **MinIO Console**: http://localhost:9001
- **Grafana Monitoring**: http://localhost:3001 (admin/admin)
- **Prometheus**: http://localhost:9090

## 🏗️ Local Development (Without Docker)

### 1. Install Dependencies

```bash
# Install all workspace dependencies
npm install

# Install individual service dependencies
npm run setup
```

### 2. Setup Infrastructure Services

You'll need to run these services locally or in Docker:

```bash
# MongoDB
mongod --dbpath /path/to/data

# Redis
redis-server

# Kafka & Zookeeper (using Docker)
docker-compose up -d kafka zookeeper mongodb redis minio
```

### 3. Environment Configuration

Create `.env` files in each service directory with appropriate configuration.

### 4. Start Services

```bash
# Start all services
npm run dev

# Or start individual services
npm run dev:frontend
npm run dev:backend

# Or start specific backend services
npm run dev --workspace=backend/user-service
npm run dev --workspace=backend/catalog-service
```

## 🔧 Service Configuration

### Required Environment Variables

#### Global Variables
```bash
# JWT Authentication
JWT_ACCESS_SECRET=your-super-secure-access-secret-min-32-chars
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-min-32-chars

# Database
MONGODB_URI=mongodb://localhost:27017
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your-redis-password

# Kafka
KAFKA_BROKERS=localhost:9092
```

#### Frontend Variables
```bash
NEXT_PUBLIC_API_URL=http://localhost:4000/graphql
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-key
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
```

#### Payment Configuration
```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# PayPal
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
PAYPAL_MODE=sandbox
```

#### OAuth Configuration
```bash
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback/google
```

#### Email Configuration
```bash
SENDGRID_API_KEY=SG.your-sendgrid-api-key
FROM_EMAIL=noreply@shopsphere.com
```

#### AWS Configuration
```bash
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
S3_BUCKET=shopsphere-product-images
CLOUDFRONT_DOMAIN=d1234567890.cloudfront.net
```

## ☁️ Production Deployment on AWS

### 1. Infrastructure Setup

#### Create EKS Cluster
```bash
# Install eksctl if not already installed
curl --silent --location "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" | tar xz -C /tmp
sudo mv /tmp/eksctl /usr/local/bin

# Create EKS cluster
eksctl create cluster \
  --name shopsphere-cluster \
  --region us-east-1 \
  --nodegroup-name shopsphere-nodes \
  --node-type t3.medium \
  --nodes 3 \
  --nodes-min 1 \
  --nodes-max 5 \
  --managed
```

#### Setup AWS Resources
```bash
# Create S3 bucket for images
aws s3 mb s3://shopsphere-product-images-prod

# Create CloudFront distribution
aws cloudfront create-distribution \
  --distribution-config file://infrastructure/aws/cloudfront-config.json

# Create RDS MongoDB Atlas cluster (recommended)
# Or set up MongoDB on EKS using Helm

# Create ElastiCache Redis cluster
aws elasticache create-cache-cluster \
  --cache-cluster-id shopsphere-redis \
  --engine redis \
  --cache-node-type cache.t3.micro \
  --num-cache-nodes 1
```

### 2. Build and Push Docker Images

```bash
# Build all images
docker-compose -f docker-compose.prod.yml build

# Tag and push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Tag and push each service
docker tag shopsphere-frontend:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/shopsphere-frontend:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/shopsphere-frontend:latest

# Repeat for all services...
```

### 3. Deploy to Kubernetes

```bash
# Create namespace
kubectl create namespace shopsphere

# Create secrets
kubectl create secret generic app-secrets \
  --from-literal=jwt-access-secret="your-jwt-access-secret" \
  --from-literal=jwt-refresh-secret="your-jwt-refresh-secret" \
  --from-literal=stripe-secret-key="your-stripe-secret" \
  --from-literal=mongodb-uri="your-mongodb-connection-string" \
  -n shopsphere

# Apply Kubernetes manifests
kubectl apply -f infrastructure/k8s/ -n shopsphere

# Verify deployment
kubectl get pods -n shopsphere
kubectl get services -n shopsphere
```

### 4. Configure Ingress and SSL

```bash
# Install AWS Load Balancer Controller
helm repo add eks https://aws.github.io/eks-charts
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=shopsphere-cluster

# Apply ingress configuration
kubectl apply -f infrastructure/k8s/ingress.yaml -n shopsphere

# Configure SSL with cert-manager
kubectl apply -f https://github.com/jetstack/cert-manager/releases/download/v1.13.0/cert-manager.yaml
kubectl apply -f infrastructure/k8s/cert-manager-issuer.yaml -n shopsphere
```

## 🔍 Monitoring and Logging

### Application Monitoring
- **Grafana Dashboard**: http://localhost:3001
- **Prometheus Metrics**: http://localhost:9090
- **Application logs**: `docker-compose logs -f [service-name]`

### Key Metrics to Monitor
- API response times
- Database query performance
- Order conversion rates
- Payment success rates
- Cache hit ratios
- Error rates by service

### Log Analysis
```bash
# View specific service logs
docker-compose logs -f frontend
docker-compose logs -f api-gateway
docker-compose logs -f user-service

# Search logs
docker-compose logs user-service | grep "ERROR"
docker-compose logs payment-service | grep "PAYMENT_FAILED"
```

## 🧪 Testing

### Run All Tests
```bash
# Run all tests
npm test

# Run tests for specific service
npm test --workspace=frontend
npm test --workspace=backend/user-service
```

### Load Testing
```bash
# Install artillery for load testing
npm install -g artillery

# Run load tests
artillery run infrastructure/load-tests/api-load-test.yml
artillery run infrastructure/load-tests/frontend-load-test.yml
```

## 🔒 Security Checklist

### Before Production
- [ ] Update all default passwords
- [ ] Configure proper CORS origins
- [ ] Set up SSL/TLS certificates
- [ ] Enable rate limiting
- [ ] Configure proper firewall rules
- [ ] Set up monitoring and alerting
- [ ] Implement proper backup strategy
- [ ] Configure log retention policies
- [ ] Set up secret management (AWS Secrets Manager)
- [ ] Enable database encryption at rest
- [ ] Configure network security groups

### Security Headers
Ensure these headers are configured in Nginx:
```nginx
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;
add_header X-XSS-Protection "1; mode=block";
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
```

## 🚨 Troubleshooting

### Common Issues

#### Service Won't Start
```bash
# Check service logs
docker-compose logs [service-name]

# Check if ports are available
netstat -tulpn | grep [port-number]

# Restart specific service
docker-compose restart [service-name]
```

#### Database Connection Issues
```bash
# Check MongoDB connection
docker-compose exec mongodb mongo --eval "db.adminCommand('ismaster')"

# Check Redis connection
docker-compose exec redis redis-cli ping
```

#### GraphQL Federation Issues
```bash
# Check if all services are registered with gateway
curl http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ __schema { types { name } } }"}'
```

#### Kafka Issues
```bash
# List Kafka topics
docker-compose exec kafka kafka-topics --bootstrap-server localhost:9092 --list

# Check consumer groups
docker-compose exec kafka kafka-consumer-groups --bootstrap-server localhost:9092 --list
```

### Getting Help
- Check service logs first
- Verify environment variables
- Ensure all dependencies are running
- Check network connectivity between services
- Review the application logs in Grafana

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Apollo GraphQL Documentation](https://www.apollographql.com/docs/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [AWS EKS Documentation](https://docs.aws.amazon.com/eks/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Check the troubleshooting section above
- Review service logs for error details
