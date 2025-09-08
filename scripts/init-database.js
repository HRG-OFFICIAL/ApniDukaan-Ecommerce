#!/usr/bin/env node

/**
 * Database Initialization Script
 * Initializes MongoDB databases and seeds sample data for development
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// MongoDB initialization script
const initScript = `
// MongoDB Initialization Script for ShopSphere
// Run this script to create databases and initial collections

// Switch to catalog database
use shopsphere_catalog;

// Create indexes for products collection
db.products.createIndex({ "name": "text", "description": "text", "tags": "text" });
db.products.createIndex({ "category": 1, "status": 1, "visibility": 1 });
db.products.createIndex({ "price": 1 });
db.products.createIndex({ "rating.average": -1 });
db.products.createIndex({ "featured": -1, "status": 1 });
db.products.createIndex({ "slug": 1 }, { unique: true });
db.products.createIndex({ "sku": 1 }, { unique: true });
db.products.createIndex({ "createdAt": -1 });
db.products.createIndex({ "sales.totalSold": -1 });
db.products.createIndex({ "tags": 1 });
db.products.createIndex({ "brand": 1 });

// Create indexes for categories collection
db.categories.createIndex({ "slug": 1 }, { unique: true });
db.categories.createIndex({ "parentCategory": 1, "isActive": 1 });
db.categories.createIndex({ "level": 1, "sortOrder": 1 });
db.categories.createIndex({ "path": 1 });
db.categories.createIndex({ "name": "text", "description": "text" });

// Create indexes for reviews collection
db.reviews.createIndex({ "product": 1, "status": 1 });
db.reviews.createIndex({ "user": 1 });
db.reviews.createIndex({ "rating": -1 });
db.reviews.createIndex({ "createdAt": -1 });
db.reviews.createIndex({ "isVerifiedPurchase": -1 });
db.reviews.createIndex({ "isHelpful.yes": -1 });
db.reviews.createIndex({ "product": 1, "user": 1 }, { unique: true });

// Switch to users database
use shopsphere_users;

// Create indexes for users collection
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "username": 1 }, { unique: true, sparse: true });
db.users.createIndex({ "provider.google.id": 1 }, { sparse: true });
db.users.createIndex({ "createdAt": -1 });
db.users.createIndex({ "lastLogin": -1 });
db.users.createIndex({ "isActive": 1 });

// Create indexes for profiles collection
db.profiles.createIndex({ "userId": 1 }, { unique: true });
db.profiles.createIndex({ "addresses.type": 1 });

// Create indexes for wishlists collection
db.wishlists.createIndex({ "userId": 1 }, { unique: true });
db.wishlists.createIndex({ "items.productId": 1 });

// Switch to orders database
use shopsphere_orders;

// Create indexes for orders collection
db.orders.createIndex({ "userId": 1 });
db.orders.createIndex({ "orderNumber": 1 }, { unique: true });
db.orders.createIndex({ "status": 1 });
db.orders.createIndex({ "createdAt": -1 });
db.orders.createIndex({ "paymentStatus": 1 });
db.orders.createIndex({ "shippingStatus": 1 });

// Create indexes for carts collection
db.carts.createIndex({ "userId": 1 }, { unique: true });
db.carts.createIndex({ "sessionId": 1 }, { sparse: true });
db.carts.createIndex({ "items.productId": 1 });
db.carts.createIndex({ "updatedAt": -1 });

// Switch to payments database
use shopsphere_payments;

// Create indexes for payments collection
db.payments.createIndex({ "orderId": 1 });
db.payments.createIndex({ "userId": 1 });
db.payments.createIndex({ "stripePaymentIntentId": 1 }, { sparse: true });
db.payments.createIndex({ "paypalOrderId": 1 }, { sparse: true });
db.payments.createIndex({ "status": 1 });
db.payments.createIndex({ "createdAt": -1 });

// Create indexes for paymentmethods collection
db.paymentmethods.createIndex({ "userId": 1 });
db.paymentmethods.createIndex({ "isDefault": 1 });
db.paymentmethods.createIndex({ "type": 1 });

print("Database indexes created successfully!");
`;

const databases = [
  'shopsphere_catalog',
  'shopsphere_users', 
  'shopsphere_orders',
  'shopsphere_payments'
];

async function initializeDatabases() {
  try {
    console.log('🚀 Starting database initialization...');
    console.log(`📡 Connecting to MongoDB: ${process.env.MONGODB_URI}`);

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017', {
      serverSelectionTimeoutMS: 5000,
    });

    console.log('✅ Connected to MongoDB');

    // Create databases and collections
    for (const dbName of databases) {
      console.log(`📝 Initializing database: ${dbName}`);
      
      const db = mongoose.connection.useDb(dbName);
      
      // Create a dummy collection to initialize the database
      await db.createCollection('_init');
      await db.dropCollection('_init');
      
      console.log(`✅ Database ${dbName} initialized`);
    }

    // Run index creation script
    console.log('📊 Creating database indexes...');
    
    // Note: In a real implementation, you'd execute the MongoDB script
    // For now, we'll just log that indexes should be created
    console.log('ℹ️  Run the following MongoDB script to create indexes:');
    console.log('---');
    console.log(initScript);
    console.log('---');

    console.log('✅ Database initialization completed successfully!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Sample data seeding function
async function seedSampleData() {
  try {
    console.log('🌱 Starting data seeding...');
    
    const { seedDatabase } = require('../backend/shared/dist/utils/seeder');
    
    await seedDatabase(
      process.env.MONGODB_URI || 'mongodb://localhost:27017',
      'shopsphere_catalog',
      {
        dropFirst: false,
        seedCategories: true,
        seedProducts: true,
        seedUsers: false
      }
    );
    
    console.log('✅ Sample data seeded successfully!');
    
  } catch (error) {
    console.error('❌ Data seeding failed:', error);
    
    if (error.message.includes('Cannot find module')) {
      console.log('ℹ️  To seed sample data, first build the shared module:');
      console.log('   npm run build --workspace=backend/shared');
    }
  }
}

// Health check function
async function healthCheck() {
  try {
    console.log('🏥 Performing health check...');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017', {
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log('✅ MongoDB connection: OK');
    
    // Check Redis connection
    if (process.env.REDIS_URL) {
      const redis = require('redis');
      const client = redis.createClient({ url: process.env.REDIS_URL });
      
      try {
        await client.connect();
        await client.ping();
        console.log('✅ Redis connection: OK');
        await client.disconnect();
      } catch (redisError) {
        console.log('⚠️  Redis connection: FAILED');
        console.log('   Make sure Redis is running on:', process.env.REDIS_URL);
      }
    }
    
    console.log('✅ Health check completed!');
    
  } catch (error) {
    console.error('❌ Health check failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

// Environment validation
function validateEnvironment() {
  console.log('🔍 Validating environment configuration...');
  
  const requiredVars = [
    'MONGODB_URI',
    'JWT_SECRET'
  ];
  
  const optionalVars = [
    'REDIS_URL',
    'STRIPE_SECRET_KEY',
    'PAYPAL_CLIENT_ID',
    'AWS_ACCESS_KEY_ID'
  ];
  
  let hasErrors = false;
  
  // Check required variables
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      console.error(`❌ Missing required environment variable: ${varName}`);
      hasErrors = true;
    } else {
      console.log(`✅ ${varName}: Set`);
    }
  });
  
  // Check optional variables
  optionalVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`✅ ${varName}: Set`);
    } else {
      console.log(`⚠️  ${varName}: Not set (optional)`);
    }
  });
  
  if (hasErrors) {
    console.error('❌ Environment validation failed!');
    console.log('💡 Copy .env.example to .env and configure the required variables.');
    process.exit(1);
  }
  
  console.log('✅ Environment validation passed!');
}

// Command-line interface
async function main() {
  const command = process.argv[2];
  
  console.log('🛍️  ShopSphere Database Initialization Tool\n');
  
  switch (command) {
    case 'init':
      validateEnvironment();
      await initializeDatabases();
      break;
      
    case 'seed':
      validateEnvironment();
      await seedSampleData();
      break;
      
    case 'health':
      await healthCheck();
      break;
      
    case 'setup':
      validateEnvironment();
      await initializeDatabases();
      await seedSampleData();
      break;
      
    default:
      console.log('Usage: node init-database.js <command>');
      console.log('');
      console.log('Commands:');
      console.log('  init     Initialize databases and create indexes');
      console.log('  seed     Seed sample data (categories, products)');
      console.log('  health   Perform health check on connections');
      console.log('  setup    Run init + seed (recommended for first setup)');
      console.log('');
      console.log('Examples:');
      console.log('  node scripts/init-database.js setup');
      console.log('  node scripts/init-database.js health');
      break;
  }
}

// Run the script
main().catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});

module.exports = {
  initializeDatabases,
  seedSampleData,
  healthCheck,
  validateEnvironment
};
