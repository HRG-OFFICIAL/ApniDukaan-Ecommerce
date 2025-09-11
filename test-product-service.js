const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://userservice-dev:OELp6t3K63rHhKgJ@cluster0.0ezsixh.mongodb.net/apnidukaan?retryWrites=true&w=majority&appName=Cluster0';

// Simple product schema for testing
const ProductSchema = new mongoose.Schema({}, { strict: false });
const Product = mongoose.model('Product', ProductSchema);

async function testProductService() {
  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: 'apnidukaan'
    });
    
    console.log('Connected to database:', mongoose.connection.db.databaseName);
    
    // Test 1: Count all products
    const totalCount = await Product.countDocuments();
    console.log(`\nTotal products in Product model: ${totalCount}`);
    
    // Test 2: Find all products with no filters
    const allProducts = await Product.find();
    console.log(`Found ${allProducts.length} products with no filters`);
    
    // Test 3: Find products with status filter
    const publishedProducts = await Product.find({ status: 'published' });
    console.log(`Found ${publishedProducts.length} products with status='published'`);
    
    // Test 4: Find products with limit
    const limitedProducts = await Product.find().limit(25);
    console.log(`Found ${limitedProducts.length} products with limit=25`);
    
    // Test 5: Check if there are any filters being applied
    const query = {};
    const products = await Product.find(query).limit(25);
    console.log(`Found ${products.length} products with empty query and limit=25`);
    
    // Show first few products
    console.log('\nFirst 3 products:');
    products.slice(0, 3).forEach((p, index) => {
      console.log(`${index + 1}. ${p.name} (${p._id}) - Status: ${p.status}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testProductService();
