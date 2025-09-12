const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://userservice-dev:OELp6t3K63rHhKgJ@cluster0.0ezsixh.mongodb.net/apnidukaan?retryWrites=true&w=majority&appName=Cluster0';

async function testProductModel() {
  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: 'apnidukaan'
    });
    
    console.log('Connected to database:', mongoose.connection.db.databaseName);
    
    // Create a simple Product model that matches the database schema
    const ProductSchema = new mongoose.Schema({
      name: String,
      status: String,
      price: Number,
      // Add other fields as needed
    }, { strict: false });
    
    const Product = mongoose.model('Product', ProductSchema);
    
    // Test 1: Count all products
    const totalCount = await Product.countDocuments();
    console.log(`\nTotal products: ${totalCount}`);
    
    // Test 2: Find all products
    const allProducts = await Product.find();
    console.log(`Found ${allProducts.length} products`);
    
    // Test 3: Find products with limit
    const limitedProducts = await Product.find().limit(25);
    console.log(`Found ${limitedProducts.length} products with limit=25`);
    
    // Test 4: Show first few products with their IDs
    console.log('\nFirst 5 products:');
    limitedProducts.slice(0, 5).forEach((p, index) => {
      console.log(`${index + 1}. ${p.name} (${p._id}) - Status: ${p.status}`);
    });
    
    // Test 5: Check if there are any products with status 'published'
    const publishedProducts = await Product.find({ status: 'published' });
    console.log(`\nFound ${publishedProducts.length} products with status='published'`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testProductModel();
