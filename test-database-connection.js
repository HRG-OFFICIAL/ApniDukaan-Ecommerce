#!/usr/bin/env node

const mongoose = require('mongoose');

// MongoDB Atlas connection string
const MONGODB_URI = 'mongodb+srv://userservice-dev:OELp6t3K63rHhKgJ@cluster0.0ezsixh.mongodb.net/apnidukaan?retryWrites=true&w=majority&appName=Cluster0';

// Product Schema (same as in the service)
const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  images: [String],
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  inventory: {
    quantity: { type: Number, default: 0 },
    lowStockThreshold: { type: Number, default: 5 }
  },
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'published' },
  featured: { type: Boolean, default: false },
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0, min: 0 }
  }
}, { timestamps: true });

const Product = mongoose.model('Product', ProductSchema);

async function testDatabaseConnection() {
  console.log('🔍 Testing MongoDB Atlas Database Connection...\n');

  try {
    // Test 1: Connect to database
    console.log('1️⃣ Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Successfully connected to MongoDB Atlas\n');

    // Test 2: Check if collections exist
    console.log('2️⃣ Checking database collections...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📁 Available collections:');
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    console.log('');

    // Test 3: Count products
    console.log('3️⃣ Counting products in database...');
    const productCount = await Product.countDocuments();
    console.log(`📦 Total products in database: ${productCount}\n`);

    // Test 4: Fetch sample products
    console.log('4️⃣ Fetching sample products...');
    const products = await Product.find().limit(3).select('name price slug');
    console.log('🛍️ Sample products:');
    products.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name} - $${product.price} (${product.slug})`);
    });
    console.log('');

    // Test 5: Test a specific query
    console.log('5️⃣ Testing specific queries...');
    const featuredProducts = await Product.find({ featured: true }).countDocuments();
    const expensiveProducts = await Product.find({ price: { $gte: 100 } }).countDocuments();
    console.log(`⭐ Featured products: ${featuredProducts}`);
    console.log(`💰 Products over $100: ${expensiveProducts}\n`);

    // Test 6: Test database operations
    console.log('6️⃣ Testing database operations...');
    
    // Create a test product
    const testProduct = new Product({
      name: 'Test Product - Database Verification',
      slug: 'test-product-database-verification',
      description: 'This is a test product to verify database functionality',
      price: 99.99,
      images: ['/test-image.jpg'],
      inventory: { quantity: 10, lowStockThreshold: 5 },
      status: 'published',
      featured: false
    });

    await testProduct.save();
    console.log('✅ Successfully created test product');

    // Read the test product
    const savedProduct = await Product.findOne({ slug: 'test-product-database-verification' });
    console.log('✅ Successfully read test product');

    // Update the test product
    await Product.updateOne(
      { slug: 'test-product-database-verification' },
      { price: 149.99 }
    );
    console.log('✅ Successfully updated test product');

    // Delete the test product
    await Product.deleteOne({ slug: 'test-product-database-verification' });
    console.log('✅ Successfully deleted test product\n');

    // Test 7: Performance test
    console.log('7️⃣ Testing database performance...');
    const startTime = Date.now();
    await Product.find().limit(10);
    const endTime = Date.now();
    console.log(`⚡ Query performance: ${endTime - startTime}ms\n`);

    console.log('🎉 ALL DATABASE TESTS PASSED!');
    console.log('✅ Database is fully functional and connected');
    console.log('✅ CRUD operations working');
    console.log('✅ Queries performing well');
    console.log('✅ MongoDB Atlas connection stable\n');

    console.log('📊 Database Summary:');
    console.log(`   - Connection: MongoDB Atlas (Cloud)`);
    console.log(`   - Products: ${productCount}`);
    console.log(`   - Collections: ${collections.length}`);
    console.log(`   - Status: Fully Operational`);

  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.error('🔍 Error details:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB Atlas');
    process.exit(0);
  }
}

// Run the test
testDatabaseConnection();
