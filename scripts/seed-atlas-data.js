#!/usr/bin/env node

const mongoose = require('mongoose');

// MongoDB Atlas connection string
const MONGODB_URI = 'mongodb+srv://userservice-dev:OELp6t3K63rHhKgJ@cluster0.0ezsixh.mongodb.net/apnidukaan?retryWrites=true&w=majority&appName=Cluster0';

// Product Schema
const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  shortDescription: String,
  sku: { type: String, required: true, unique: true },
  price: { type: Number, required: true },
  originalPrice: Number,
  currency: { type: String, default: 'USD' },
  images: [String],
  thumbnailImage: String,
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  subcategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  brand: String,
  tags: [String],
  attributes: [{
    name: String,
    value: String
  }],
  inventory: {
    quantity: { type: Number, default: 0 },
    lowStockThreshold: { type: Number, default: 5 },
    trackQuantity: { type: Boolean, default: true },
    allowBackorder: { type: Boolean, default: false }
  },
  shipping: {
    weight: { type: Number, required: true },
    dimensions: {
      length: { type: Number, required: true },
      width: { type: Number, required: true },
      height: { type: Number, required: true }
    },
    freeShipping: { type: Boolean, default: false },
    shippingClass: String
  },
  seo: {
    title: String,
    description: String,
    keywords: [String]
  },
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'published' },
  featured: { type: Boolean, default: false },
  visibility: { type: String, enum: ['public', 'private', 'password'], default: 'public' },
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0, min: 0 }
  },
  sales: {
    totalSold: { type: Number, default: 0, min: 0 },
    revenue: { type: Number, default: 0, min: 0 }
  },
  isOnSale: { type: Boolean, default: false },
  saleStartDate: Date,
  saleEndDate: Date
}, { timestamps: true });

// Category Schema
const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: String,
  image: String,
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  children: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
  seo: {
    title: String,
    description: String,
    keywords: [String]
  }
}, { timestamps: true });

const Product = mongoose.model('Product', ProductSchema);
const Category = mongoose.model('Category', CategorySchema);

async function seedData() {
  try {
    console.log('🌱 Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await Product.deleteMany({});
    await Category.deleteMany({});
    console.log('✅ Cleared existing data');

    // Create categories
    console.log('📁 Creating categories...');
    const categories = await Category.insertMany([
      {
        name: 'Electronics',
        slug: 'electronics',
        description: 'Electronic devices and gadgets',
        image: 'https://via.placeholder.com/300x200/007ACC/FFFFFF?text=Electronics',
        isActive: true,
        sortOrder: 1
      },
      {
        name: 'Clothing',
        slug: 'clothing',
        description: 'Fashion and apparel',
        image: 'https://via.placeholder.com/300x200/FF6B9D/FFFFFF?text=Clothing',
        isActive: true,
        sortOrder: 2
      },
      {
        name: 'Home & Garden',
        slug: 'home-garden',
        description: 'Home improvement and garden supplies',
        image: 'https://via.placeholder.com/300x200/4ECDC4/FFFFFF?text=Home+Garden',
        isActive: true,
        sortOrder: 3
      },
      {
        name: 'Sports & Fitness',
        slug: 'sports-fitness',
        description: 'Sports equipment and fitness gear',
        image: 'https://via.placeholder.com/300x200/45B7D1/FFFFFF?text=Sports+Fitness',
        isActive: true,
        sortOrder: 4
      },
      {
        name: 'Books & Media',
        slug: 'books-media',
        description: 'Books and educational materials',
        image: 'https://via.placeholder.com/300x200/96CEB4/FFFFFF?text=Books+Media',
        isActive: true,
        sortOrder: 5
      },
      {
        name: 'Health & Beauty',
        slug: 'health-beauty',
        description: 'Health and beauty products',
        image: 'https://via.placeholder.com/300x200/FFEAA7/000000?text=Health+Beauty',
        isActive: true,
        sortOrder: 6
      },
      {
        name: 'Food & Beverages',
        slug: 'food-beverages',
        description: 'Food and beverage products',
        image: 'https://via.placeholder.com/300x200/DDA0DD/FFFFFF?text=Food+Beverages',
        isActive: true,
        sortOrder: 7
      },
      {
        name: 'Automotive',
        slug: 'automotive',
        description: 'Automotive parts and accessories',
        image: 'https://via.placeholder.com/300x200/2C3E50/FFFFFF?text=Automotive',
        isActive: true,
        sortOrder: 8
      }
    ]);
    console.log(`✅ Created ${categories.length} categories`);

    // Create products
    console.log('📦 Creating products...');
    const products = await Product.insertMany([
      {
        name: 'Wireless Bluetooth Headphones',
        slug: 'wireless-bluetooth-headphones',
        description: 'High-quality wireless headphones with noise cancellation and 30-hour battery life. Perfect for music lovers and professionals.',
        shortDescription: 'Premium wireless headphones with noise cancellation',
        sku: 'WBH-001',
        price: 199.99,
        originalPrice: 249.99,
        currency: 'USD',
        images: [
          '/images/products/headphones-1.jpg',
          '/images/products/headphones-2.jpg',
          '/images/products/headphones-3.jpg'
        ],
        thumbnailImage: '/images/products/headphones-1.jpg',
        category: categories[0]._id,
        brand: 'TechSound',
        tags: ['wireless', 'bluetooth', 'headphones', 'noise-cancellation'],
        attributes: [
          { name: 'Color', value: 'Black' },
          { name: 'Battery Life', value: '30 hours' },
          { name: 'Connectivity', value: 'Bluetooth 5.0' }
        ],
        inventory: {
          quantity: 50,
          lowStockThreshold: 5,
          trackQuantity: true,
          allowBackorder: false
        },
        shipping: {
          weight: 0.5,
          dimensions: { length: 20, width: 15, height: 8 },
          freeShipping: true
        },
        status: 'published',
        featured: true,
        rating: { average: 4.5, count: 128 },
        sales: { totalSold: 45, revenue: 8999.55 },
        isOnSale: true,
        saleStartDate: new Date(),
        saleEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      {
        name: 'Smart Fitness Watch',
        slug: 'smart-fitness-watch',
        description: 'Advanced fitness tracking watch with heart rate monitoring, GPS, and water resistance. Track your workouts and health metrics.',
        shortDescription: 'Advanced fitness tracking watch with GPS',
        sku: 'SFW-002',
        price: 299.99,
        currency: 'USD',
        images: [
          '/images/products/smartwatch-1.jpg',
          '/images/products/smartwatch-2.jpg'
        ],
        thumbnailImage: '/images/products/smartwatch-1.jpg',
        category: categories[0]._id,
        brand: 'FitTech',
        tags: ['smartwatch', 'fitness', 'gps', 'heart-rate'],
        attributes: [
          { name: 'Color', value: 'Silver' },
          { name: 'Water Resistance', value: '50m' },
          { name: 'Battery Life', value: '7 days' }
        ],
        inventory: {
          quantity: 30,
          lowStockThreshold: 5,
          trackQuantity: true,
          allowBackorder: true
        },
        shipping: {
          weight: 0.3,
          dimensions: { length: 4, width: 4, height: 1 },
          freeShipping: true
        },
        status: 'published',
        featured: true,
        rating: { average: 4.7, count: 89 },
        sales: { totalSold: 23, revenue: 6899.77 }
      },
      {
        name: 'Organic Cotton T-Shirt',
        slug: 'organic-cotton-t-shirt',
        description: 'Comfortable and sustainable organic cotton t-shirt. Available in multiple colors and sizes. Perfect for everyday wear.',
        shortDescription: 'Sustainable organic cotton t-shirt',
        sku: 'OCT-003',
        price: 29.99,
        currency: 'USD',
        images: [
          '/images/products/tshirt-1.jpg',
          '/images/products/tshirt-2.jpg'
        ],
        thumbnailImage: '/images/products/tshirt-1.jpg',
        category: categories[1]._id,
        brand: 'EcoWear',
        tags: ['organic', 'cotton', 'sustainable', 'casual'],
        attributes: [
          { name: 'Material', value: '100% Organic Cotton' },
          { name: 'Sizes', value: 'S, M, L, XL' },
          { name: 'Colors', value: 'White, Black, Navy, Green' }
        ],
        inventory: {
          quantity: 100,
          lowStockThreshold: 10,
          trackQuantity: true,
          allowBackorder: false
        },
        shipping: {
          weight: 0.2,
          dimensions: { length: 30, width: 25, height: 2 },
          freeShipping: false
        },
        status: 'published',
        featured: false,
        rating: { average: 4.3, count: 67 },
        sales: { totalSold: 89, revenue: 2669.11 }
      },
      {
        name: 'Garden Tool Set',
        slug: 'garden-tool-set',
        description: 'Complete garden tool set with ergonomic handles. Includes trowel, pruners, weeder, and garden fork. Perfect for gardening enthusiasts.',
        shortDescription: 'Complete garden tool set with ergonomic handles',
        sku: 'GTS-004',
        price: 79.99,
        currency: 'USD',
        images: [
          '/images/products/garden-tools-1.jpg',
          '/images/products/garden-tools-2.jpg'
        ],
        thumbnailImage: '/images/products/garden-tools-1.jpg',
        category: categories[2]._id,
        brand: 'GardenPro',
        tags: ['garden', 'tools', 'outdoor', 'gardening'],
        attributes: [
          { name: 'Material', value: 'Stainless Steel' },
          { name: 'Handle', value: 'Ergonomic Rubber' },
          { name: 'Set Includes', value: '4 Tools' }
        ],
        inventory: {
          quantity: 25,
          lowStockThreshold: 5,
          trackQuantity: true,
          allowBackorder: false
        },
        shipping: {
          weight: 2.5,
          dimensions: { length: 40, width: 15, height: 8 },
          freeShipping: false
        },
        status: 'published',
        featured: false,
        rating: { average: 4.6, count: 34 },
        sales: { totalSold: 12, revenue: 959.88 }
      },
      {
        name: 'Yoga Mat Premium',
        slug: 'yoga-mat-premium',
        description: 'Non-slip premium yoga mat with extra cushioning. Perfect for yoga, pilates, and fitness workouts. Eco-friendly materials.',
        shortDescription: 'Non-slip premium yoga mat with extra cushioning',
        sku: 'YMP-005',
        price: 49.99,
        currency: 'USD',
        images: [
          '/images/products/yoga-mat-1.jpg',
          '/images/products/yoga-mat-2.jpg'
        ],
        thumbnailImage: '/images/products/yoga-mat-1.jpg',
        category: categories[3]._id,
        brand: 'ZenFit',
        tags: ['yoga', 'fitness', 'mat', 'eco-friendly'],
        attributes: [
          { name: 'Thickness', value: '6mm' },
          { name: 'Material', value: 'Eco-friendly TPE' },
          { name: 'Size', value: '72" x 24"' }
        ],
        inventory: {
          quantity: 75,
          lowStockThreshold: 10,
          trackQuantity: true,
          allowBackorder: false
        },
        shipping: {
          weight: 1.8,
          dimensions: { length: 72, width: 24, height: 0.6 },
          freeShipping: true
        },
        status: 'published',
        featured: true,
        rating: { average: 4.4, count: 156 },
        sales: { totalSold: 78, revenue: 3899.22 }
      }
    ]);
    console.log(`✅ Created ${products.length} products`);

    console.log('🎉 Data seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Categories: ${categories.length}`);
    console.log(`   - Products: ${products.length}`);
    console.log(`   - Database: MongoDB Atlas`);

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB Atlas');
    process.exit(0);
  }
}

// Run the seeding
seedData();
