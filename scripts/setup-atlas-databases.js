#!/usr/bin/env node

/**
 * MongoDB Atlas Database Setup Script
 * Creates all required databases and collections for ApniDukaan
 */

const mongoose = require('mongoose');

// MongoDB Atlas connection string
const MONGODB_URI = 'mongodb+srv://userservice-dev:OELp6t3K63rHhKgJ@cluster0.0ezsixh.mongodb.net/apnidukaan?retryWrites=true&w=majority&appName=Cluster0';

// Database configurations
const databases = [
  {
    name: 'apnidukaan_catalog',
    collections: ['products', 'categories', 'reviews', 'brands']
  },
  {
    name: 'apnidukaan_users',
    collections: ['users', 'profiles', 'addresses', 'preferences']
  },
  {
    name: 'apnidukaan_orders',
    collections: ['orders', 'orderitems', 'shipping', 'tracking']
  },
  {
    name: 'apnidukaan_cart',
    collections: ['carts', 'cartitems']
  },
  {
    name: 'apnidukaan_payments',
    collections: ['payments', 'transactions', 'refunds']
  },
  {
    name: 'apnidukaan_notifications',
    collections: ['notifications', 'templates', 'logs']
  }
];

async function setupDatabases() {
  try {
    console.log('🌱 Connecting to MongoDB Atlas...');
    
    // Connect to the main database
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');

    const admin = mongoose.connection.db.admin();
    
    // Create each database and its collections
    for (const dbConfig of databases) {
      console.log(`📁 Setting up database: ${dbConfig.name}`);
      
      // Switch to the database
      const db = mongoose.connection.useDb(dbConfig.name);
      
      // Create collections with indexes
      for (const collectionName of dbConfig.collections) {
        console.log(`  📄 Creating collection: ${collectionName}`);
        
        // Create the collection
        await db.createCollection(collectionName);
        
        // Add basic indexes based on collection type
        await createIndexesForCollection(db, collectionName);
      }
      
      console.log(`✅ Database ${dbConfig.name} setup complete`);
    }

    console.log('🎉 All databases and collections created successfully!');
    console.log('📊 Summary:');
    databases.forEach(db => {
      console.log(`   - ${db.name}: ${db.collections.length} collections`);
    });

  } catch (error) {
    console.error('❌ Error setting up databases:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB Atlas');
    process.exit(0);
  }
}

async function createIndexesForCollection(db, collectionName) {
  try {
    const collection = db.collection(collectionName);
    
    switch (collectionName) {
      case 'products':
        await collection.createIndex({ "name": "text", "description": "text", "tags": "text" });
        await collection.createIndex({ "category": 1, "status": 1, "visibility": 1 });
        await collection.createIndex({ "price": 1 });
        await collection.createIndex({ "rating.average": -1 });
        await collection.createIndex({ "featured": -1, "status": 1 });
        await collection.createIndex({ "slug": 1 }, { unique: true });
        await collection.createIndex({ "sku": 1 }, { unique: true });
        await collection.createIndex({ "createdAt": -1 });
        await collection.createIndex({ "sales.totalSold": -1 });
        await collection.createIndex({ "tags": 1 });
        break;
        
      case 'categories':
        await collection.createIndex({ "name": 1 });
        await collection.createIndex({ "slug": 1 }, { unique: true });
        await collection.createIndex({ "parent": 1 });
        await collection.createIndex({ "isActive": 1, "sortOrder": 1 });
        break;
        
      case 'users':
        await collection.createIndex({ "email": 1 }, { unique: true });
        await collection.createIndex({ "username": 1 }, { unique: true, sparse: true });
        await collection.createIndex({ "role": 1 });
        await collection.createIndex({ "isActive": 1 });
        await collection.createIndex({ "createdAt": -1 });
        break;
        
      case 'orders':
        await collection.createIndex({ "userId": 1 });
        await collection.createIndex({ "orderNumber": 1 }, { unique: true });
        await collection.createIndex({ "status": 1 });
        await collection.createIndex({ "createdAt": -1 });
        await collection.createIndex({ "paymentStatus": 1 });
        break;
        
      case 'carts':
        await collection.createIndex({ "userId": 1 }, { unique: true });
        await collection.createIndex({ "sessionId": 1 }, { unique: true, sparse: true });
        await collection.createIndex({ "updatedAt": -1 });
        break;
        
      case 'payments':
        await collection.createIndex({ "orderId": 1 });
        await collection.createIndex({ "userId": 1 });
        await collection.createIndex({ "status": 1 });
        await collection.createIndex({ "createdAt": -1 });
        await collection.createIndex({ "transactionId": 1 }, { unique: true, sparse: true });
        break;
        
      case 'notifications':
        await collection.createIndex({ "userId": 1 });
        await collection.createIndex({ "type": 1 });
        await collection.createIndex({ "status": 1 });
        await collection.createIndex({ "createdAt": -1 });
        break;
        
      default:
        // Basic indexes for any collection
        await collection.createIndex({ "createdAt": -1 });
        await collection.createIndex({ "updatedAt": -1 });
        break;
    }
    
    console.log(`    ✅ Indexes created for ${collectionName}`);
  } catch (error) {
    console.log(`    ⚠️  Warning: Could not create indexes for ${collectionName}:`, error.message);
  }
}

// Run the setup
setupDatabases();
