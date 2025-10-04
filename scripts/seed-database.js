const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/apnidukaan';

// Sample data
const categories = [
  {
    name: 'Electronics',
    slug: 'electronics',
    description: 'Latest electronic gadgets and devices',
    image: 'https://via.placeholder.com/300x200?text=Electronics',
    isActive: true,
    sortOrder: 1
  },
  {
    name: 'Fashion',
    slug: 'fashion',
    description: 'Trendy clothing and accessories',
    image: 'https://via.placeholder.com/300x200?text=Fashion',
    isActive: true,
    sortOrder: 2
  },
  {
    name: 'Home & Garden',
    slug: 'home-garden',
    description: 'Home improvement and garden supplies',
    image: 'https://via.placeholder.com/300x200?text=Home+Garden',
    isActive: true,
    sortOrder: 3
  },
  {
    name: 'Sports',
    slug: 'sports',
    description: 'Sports equipment and fitness gear',
    image: 'https://via.placeholder.com/300x200?text=Sports',
    isActive: true,
    sortOrder: 4
  },
  {
    name: 'Books',
    slug: 'books',
    description: 'Books and educational materials',
    image: 'https://via.placeholder.com/300x200?text=Books',
    isActive: true,
    sortOrder: 5
  }
];

const products = [
  {
    name: 'boAt Rockerz 450 Bluetooth Headphones',
    price: 1499,
    originalPrice: 2990,
    discount: 50,
    rating: 4.2,
    reviews: 1284,
    images: [
      'https://via.placeholder.com/400x400?text=Headphones+1',
      'https://via.placeholder.com/400x400?text=Headphones+2',
      'https://via.placeholder.com/400x400?text=Headphones+3'
    ],
    category: 'electronics',
    subcategory: 'audio',
    brand: 'boAt',
    description: 'Premium quality Bluetooth headphones with superior sound quality and comfortable fit.',
    specifications: {
      connectivity: 'Bluetooth 5.0',
      battery: '12 hours',
      charging: 'USB-C',
      weight: '200g',
      warranty: '1 year'
    },
    inStock: true,
    stockQuantity: 50,
    tags: ['bluetooth', 'headphones', 'wireless', 'audio'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Fire-Boltt Phoenix Pro Smartwatch',
    price: 1999,
    originalPrice: 7999,
    discount: 75,
    rating: 4.1,
    reviews: 8924,
    images: [
      'https://via.placeholder.com/400x400?text=Smartwatch+1',
      'https://via.placeholder.com/400x400?text=Smartwatch+2'
    ],
    category: 'electronics',
    subcategory: 'wearables',
    brand: 'Fire-Boltt',
    description: 'Advanced smartwatch with health monitoring and fitness tracking features.',
    specifications: {
      display: '1.4" HD',
      battery: '7 days',
      connectivity: 'Bluetooth 5.0',
      waterResistance: 'IP68',
      sensors: 'Heart Rate, SpO2, Sleep'
    },
    inStock: true,
    stockQuantity: 25,
    tags: ['smartwatch', 'fitness', 'health', 'wearable'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'American Tourister Laptop Backpack',
    price: 899,
    originalPrice: 2175,
    discount: 59,
    rating: 4.3,
    reviews: 15647,
    images: [
      'https://via.placeholder.com/400x400?text=Backpack+1',
      'https://via.placeholder.com/400x400?text=Backpack+2'
    ],
    category: 'fashion',
    subcategory: 'bags',
    brand: 'American Tourister',
    description: 'Durable and stylish laptop backpack perfect for work and travel.',
    specifications: {
      capacity: '25L',
      compartments: 'Multiple',
      material: 'Polyester',
      laptopSize: 'Up to 15.6"',
      warranty: '2 years'
    },
    inStock: true,
    stockQuantity: 100,
    tags: ['backpack', 'laptop', 'travel', 'work'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'GoPro HERO11 Black Action Camera',
    price: 37999,
    originalPrice: 54500,
    discount: 30,
    rating: 4.4,
    reviews: 1573,
    images: [
      'https://via.placeholder.com/400x400?text=Camera+1',
      'https://via.placeholder.com/400x400?text=Camera+2'
    ],
    category: 'electronics',
    subcategory: 'cameras',
    brand: 'GoPro',
    description: 'Professional action camera with 4K video recording and advanced stabilization.',
    specifications: {
      resolution: '4K@60fps',
      stabilization: 'HyperSmooth 5.0',
      waterproof: '10m',
      battery: '2 hours',
      storage: 'microSD'
    },
    inStock: true,
    stockQuantity: 15,
    tags: ['camera', 'action', '4k', 'video', 'sports'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Nike Air Max 270 Running Shoes',
    price: 8999,
    originalPrice: 12999,
    discount: 31,
    rating: 4.5,
    reviews: 2341,
    images: [
      'https://via.placeholder.com/400x400?text=Shoes+1',
      'https://via.placeholder.com/400x400?text=Shoes+2'
    ],
    category: 'fashion',
    subcategory: 'shoes',
    brand: 'Nike',
    description: 'Comfortable running shoes with maximum cushioning and breathable design.',
    specifications: {
      size: '6-12',
      color: 'Multiple',
      material: 'Mesh + Synthetic',
      sole: 'Air Max',
      type: 'Running'
    },
    inStock: true,
    stockQuantity: 75,
    tags: ['shoes', 'running', 'nike', 'sports', 'comfortable'],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function seedDatabase() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await db.collection('products').deleteMany({});
    await db.collection('categories').deleteMany({});
    await db.collection('users').deleteMany({});
    await db.collection('orders').deleteMany({});
    
    // Insert categories
    console.log('📂 Inserting categories...');
    const categoryResult = await db.collection('categories').insertMany(categories);
    console.log(`✅ Inserted ${categoryResult.insertedCount} categories`);
    
    // Insert products
    console.log('📦 Inserting products...');
    const productResult = await db.collection('products').insertMany(products);
    console.log(`✅ Inserted ${productResult.insertedCount} products`);
    
    // Create indexes
    console.log('🔍 Creating indexes...');
    await db.collection('products').createIndex({ category: 1 });
    await db.collection('products').createIndex({ name: 'text', description: 'text' });
    await db.collection('products').createIndex({ price: 1 });
    await db.collection('products').createIndex({ rating: -1 });
    await db.collection('categories').createIndex({ slug: 1 });
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('orders').createIndex({ userId: 1 });
    await db.collection('orders').createIndex({ createdAt: -1 });
    console.log('✅ Indexes created');
    
    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Categories: ${categoryResult.insertedCount}`);
    console.log(`- Products: ${productResult.insertedCount}`);
    console.log(`- Indexes: 8 created`);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await client.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the seeding
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
