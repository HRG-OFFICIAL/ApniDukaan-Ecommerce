const { MongoClient } = require('mongodb');

async function testCatalogDatabase() {
  // Test the exact connection string that the catalog service is using
  const uri = 'mongodb+srv://userservice-dev:OELp6t3K63rHhKgJ@cluster0.0ezsixh.mongodb.net/apnidukaan?retryWrites=true&w=majority&appName=Cluster0';
  
  try {
    const client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db('apnidukaan');
    
    // Test the exact query that the ProductService is using
    const query = {}; // No filters
    const limit = 25;
    
    const products = await db.collection('products').find(query).limit(limit).toArray();
    console.log(`Found ${products.length} products with no filters:`);
    
    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} (${product._id}) - Status: ${product.status}`);
    });
    
    // Test with status filter
    const publishedQuery = { status: 'published' };
    const publishedProducts = await db.collection('products').find(publishedQuery).limit(limit).toArray();
    console.log(`\nFound ${publishedProducts.length} products with status='published':`);
    
    publishedProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} (${product._id}) - Status: ${product.status}`);
    });
    
    // Check total count
    const totalCount = await db.collection('products').countDocuments();
    console.log(`\nTotal products in database: ${totalCount}`);
    
    const publishedCount = await db.collection('products').countDocuments({ status: 'published' });
    console.log(`Total published products: ${publishedCount}`);
    
    await client.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

testCatalogDatabase();
