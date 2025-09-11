const { MongoClient } = require('mongodb');

async function checkDatabase() {
  const uri = 'mongodb+srv://userservice-dev:OELp6t3K63rHhKgJ@cluster0.0ezsixh.mongodb.net/apnidukaan?retryWrites=true&w=majority&appName=Cluster0';
  
  try {
    const client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db('apnidukaan');
    
    // Check what collections exist
    const collections = await db.listCollections().toArray();
    console.log('Collections in apnidukaan database:');
    collections.forEach(col => console.log(`- ${col.name}`));
    
    // Check products collection
    const productsCollection = db.collection('products');
    const productCount = await productsCollection.countDocuments();
    console.log(`\nTotal products in apnidukaan.products: ${productCount}`);
    
    // Show first few products
    const products = await productsCollection.find().limit(3).toArray();
    console.log('\nFirst 3 products:');
    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} (${product._id})`);
    });
    
    // Check if there's a catalog_db database
    const catalogDb = client.db('catalog_db');
    const catalogCollections = await catalogDb.listCollections().toArray();
    console.log('\nCollections in catalog_db database:');
    catalogCollections.forEach(col => console.log(`- ${col.name}`));
    
    if (catalogCollections.length > 0) {
      const catalogProductsCollection = catalogDb.collection('products');
      const catalogProductCount = await catalogProductsCollection.countDocuments();
      console.log(`\nTotal products in catalog_db.products: ${catalogProductCount}`);
    }
    
    await client.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkDatabase();
