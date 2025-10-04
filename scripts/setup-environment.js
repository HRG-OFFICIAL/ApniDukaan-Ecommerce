#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up ApniDukaan E-commerce Environment\n');

// Environment templates
const envTemplates = {
  root: `# Database Configuration
MONGODB_URI=mongodb+srv://userservice-dev:OELp6t3K63rHhKgJ@cluster0.0ezsixh.mongodb.net/apnidukaan?retryWrites=true&w=majority&appName=Cluster0
REDIS_URL=redis://localhost:6379

# Service Ports
API_GATEWAY_PORT=4000
CATALOG_SERVICE_PORT=4001
USER_SERVICE_PORT=4002
ORDER_SERVICE_PORT=4003
PAYMENT_SERVICE_PORT=4004
CART_SERVICE_PORT=4005
NOTIFICATION_SERVICE_PORT=4007
SEARCH_SERVICE_PORT=4006

# Frontend Configuration
FRONTEND_URL=http://localhost:3000

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-change-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production

# Payment Gateways
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
RAZORPAY_KEY_ID=rzp_test_your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret

# PayPal Configuration (Optional)
PAYPAL_ENABLED=false
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_MODE=sandbox

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@apnidukaan.com

# AWS Configuration (Optional)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=apnidukaan-images
CLOUDFRONT_DOMAIN=your-cloudfront-domain

# Environment
NODE_ENV=development

# Kafka Configuration (Optional)
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=apnidukaan-producer
KAFKA_GROUP_ID=apnidukaan-consumer-group

# Session Configuration
SESSION_SECRET=your-session-secret-key-change-in-production

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security
BCRYPT_ROUNDS=12
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Feature Flags
ENABLE_GRAPHQL=true
ENABLE_WEBSOCKETS=true
ENABLE_REDIS_CACHE=true
ENABLE_EMAIL_NOTIFICATIONS=true`,

  frontend: `# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:4000/graphql

# App Configuration
NEXT_PUBLIC_APP_NAME=ApniDukaan
NEXT_PUBLIC_APP_VERSION=1.0.0

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key

# Payment Keys (Public)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_razorpay_key_id

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_DEBUG=true`
};

// Service-specific environment files
const serviceEnvs = {
  'backend/api-gateway': `PORT=4000
NODE_ENV=development
CATALOG_SERVICE_URL=http://localhost:4001
USER_SERVICE_URL=http://localhost:4002
ORDER_SERVICE_URL=http://localhost:4003
PAYMENT_SERVICE_URL=http://localhost:4004
CART_SERVICE_URL=http://localhost:4005
NOTIFICATION_SERVICE_URL=http://localhost:4007
SEARCH_SERVICE_URL=http://localhost:4006
MONGODB_URI=mongodb+srv://userservice-dev:OELp6t3K63rHhKgJ@cluster0.0ezsixh.mongodb.net/apnidukaan?retryWrites=true&w=majority&appName=Cluster0
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-here-change-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production
FRONTEND_URL=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
LOG_LEVEL=info`,

  'backend/catalog-service': `PORT=4001
NODE_ENV=development
MONGODB_URI=mongodb+srv://userservice-dev:OELp6t3K63rHhKgJ@cluster0.0ezsixh.mongodb.net/apnidukaan?retryWrites=true&w=majority&appName=Cluster0
REDIS_URL=redis://localhost:6379
FRONTEND_URL=http://localhost:3000
LOG_LEVEL=info`,

  'backend/user-service': `PORT=4002
NODE_ENV=development
MONGODB_URI=mongodb+srv://userservice-dev:OELp6t3K63rHhKgJ@cluster0.0ezsixh.mongodb.net/apnidukaan?retryWrites=true&w=majority&appName=Cluster0
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-here-change-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production
FRONTEND_URL=http://localhost:3000
LOG_LEVEL=info`,

  'backend/order-service': `PORT=4003
NODE_ENV=development
MONGODB_URI=mongodb+srv://userservice-dev:OELp6t3K63rHhKgJ@cluster0.0ezsixh.mongodb.net/apnidukaan?retryWrites=true&w=majority&appName=Cluster0
REDIS_URL=redis://localhost:6379
FRONTEND_URL=http://localhost:3000
LOG_LEVEL=info`,

  'backend/payment-service': `PORT=4004
NODE_ENV=development
MONGODB_URI=mongodb+srv://userservice-dev:OELp6t3K63rHhKgJ@cluster0.0ezsixh.mongodb.net/apnidukaan?retryWrites=true&w=majority&appName=Cluster0
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
RAZORPAY_KEY_ID=rzp_test_your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret
PAYPAL_ENABLED=false
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_MODE=sandbox
FRONTEND_URL=http://localhost:3000
LOG_LEVEL=info`,

  'backend/cart-service': `PORT=4005
NODE_ENV=development
MONGODB_URI=mongodb+srv://userservice-dev:OELp6t3K63rHhKgJ@cluster0.0ezsixh.mongodb.net/apnidukaan_cart?retryWrites=true&w=majority&appName=Cluster0
REDIS_URL=redis://localhost:6379
SESSION_SECRET=your-session-secret-key-change-in-production
FRONTEND_URL=http://localhost:3000
CLEANUP_INTERVAL_HOURS=6
LOG_LEVEL=info`,

  'backend/notification-service': `PORT=4007
NODE_ENV=development
MONGODB_URI=mongodb+srv://userservice-dev:OELp6t3K63rHhKgJ@cluster0.0ezsixh.mongodb.net/apnidukaan_notifications?retryWrites=true&w=majority&appName=Cluster0
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@apnidukaan.com
SMS_API_KEY=your-sms-api-key
SMS_API_URL=https://api.textlocal.in/send/
FRONTEND_URL=http://localhost:3000
LOG_LEVEL=info`,

  'backend/search-service': `PORT=4006
NODE_ENV=development
MONGODB_URI=mongodb+srv://userservice-dev:OELp6t3K63rHhKgJ@cluster0.0ezsixh.mongodb.net/apnidukaan_search?retryWrites=true&w=majority&appName=Cluster0
ELASTICSEARCH_URL=http://localhost:9200
FRONTEND_URL=http://localhost:3000
LOG_LEVEL=info`
};

// Create environment files
function createEnvFile(filePath, content) {
  try {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Created ${filePath}`);
  } catch (error) {
    console.log(`❌ Failed to create ${filePath}: ${error.message}`);
  }
}

// Create directories if they don't exist
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

console.log('📁 Creating environment files...\n');

// Create root .env file
createEnvFile('.env', envTemplates.root);

// Create frontend .env.local file
ensureDirectoryExists('frontend');
createEnvFile('frontend/.env.local', envTemplates.frontend);

// Create service-specific .env files
Object.entries(serviceEnvs).forEach(([servicePath, content]) => {
  ensureDirectoryExists(servicePath);
  createEnvFile(path.join(servicePath, '.env'), content);
});

console.log('\n🎉 Environment setup completed!');
console.log('\n📝 Next steps:');
console.log('1. Update the environment variables with your actual values');
console.log('2. Install dependencies: npm install');
console.log('3. Start the services: npm start');
console.log('4. Run tests: npm run test:all');
console.log('\n⚠️  Remember to change all default secrets in production!');
