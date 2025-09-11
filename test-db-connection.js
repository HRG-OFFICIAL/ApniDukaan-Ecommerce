const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://userservice-dev:OELp6t3K63rHhKgJ@cluster0.0ezsixh.mongodb.net/apnidukaan?retryWrites=true&w=majority&appName=Cluster0';

async function testConnection() {
  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: 'apnidukaan'
    });
    
    console.log('Connected to database:', mongoose.connection.db.databaseName);
    console.log('Connection host:', mongoose.connection.host);
    console.log('Connection port:', mongoose.connection.port);
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nCollections in database:');
    collections.forEach(c => console.log(`- ${c.name}`));
    
    // Check products collection
    const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }), 'products');
    const productCount = await Product.countDocuments();
    console.log(`\nTotal products: ${productCount}`);
    
    const products = await Product.find().limit(5);
    console.log('\nFirst 5 products:');
    products.forEach((p, index) => {
      console.log(`${index + 1}. ${p.name} (${p._id})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testConnection();
