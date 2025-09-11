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

async function seedComprehensiveData() {
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

    // Create comprehensive product data
    console.log('📦 Creating comprehensive product catalog...');
    const products = await Product.insertMany([
      // Electronics (8 products)
      {
        name: 'Wireless Bluetooth Headphones',
        slug: 'wireless-bluetooth-headphones',
        description: 'High-quality wireless headphones with noise cancellation and 30-hour battery life. Perfect for music lovers and professionals.',
        shortDescription: 'Premium wireless headphones with noise cancellation',
        sku: 'WBH-001',
        price: 199.99,
        originalPrice: 249.99,
        currency: 'USD',
        images: ['/images/products/headphones-1.jpg', '/images/products/headphones-2.jpg'],
        thumbnailImage: '/images/products/headphones-1.jpg',
        category: categories[0]._id,
        brand: 'TechSound',
        tags: ['wireless', 'bluetooth', 'headphones', 'noise-cancellation'],
        attributes: [
          { name: 'Color', value: 'Black' },
          { name: 'Battery Life', value: '30 hours' },
          { name: 'Connectivity', value: 'Bluetooth 5.0' }
        ],
        inventory: { quantity: 50, lowStockThreshold: 5, trackQuantity: true, allowBackorder: false },
        shipping: { weight: 0.5, dimensions: { length: 20, width: 15, height: 8 }, freeShipping: true },
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
        description: 'Advanced fitness tracking watch with heart rate monitoring, GPS, and water resistance.',
        shortDescription: 'Advanced fitness tracking watch with GPS',
        sku: 'SFW-002',
        price: 299.99,
        currency: 'USD',
        images: ['/images/products/smartwatch-1.jpg', '/images/products/smartwatch-2.jpg'],
        thumbnailImage: '/images/products/smartwatch-1.jpg',
        category: categories[0]._id,
        brand: 'FitTech',
        tags: ['smartwatch', 'fitness', 'gps', 'heart-rate'],
        attributes: [
          { name: 'Color', value: 'Silver' },
          { name: 'Water Resistance', value: '50m' },
          { name: 'Battery Life', value: '7 days' }
        ],
        inventory: { quantity: 30, lowStockThreshold: 5, trackQuantity: true, allowBackorder: true },
        shipping: { weight: 0.3, dimensions: { length: 4, width: 4, height: 1 }, freeShipping: true },
        status: 'published',
        featured: true,
        rating: { average: 4.7, count: 89 },
        sales: { totalSold: 23, revenue: 6899.77 }
      },
      {
        name: '4K Ultra HD Smart TV',
        slug: '4k-ultra-hd-smart-tv',
        description: '55-inch 4K Ultra HD Smart TV with HDR support and built-in streaming apps.',
        shortDescription: '55-inch 4K Smart TV with HDR',
        sku: 'TV-003',
        price: 799.99,
        originalPrice: 999.99,
        currency: 'USD',
        images: ['/images/products/tv-1.jpg', '/images/products/tv-2.jpg'],
        thumbnailImage: '/images/products/tv-1.jpg',
        category: categories[0]._id,
        brand: 'VisionTech',
        tags: ['tv', '4k', 'smart', 'hdr'],
        attributes: [
          { name: 'Screen Size', value: '55 inches' },
          { name: 'Resolution', value: '4K Ultra HD' },
          { name: 'HDR', value: 'Yes' }
        ],
        inventory: { quantity: 15, lowStockThreshold: 3, trackQuantity: true, allowBackorder: false },
        shipping: { weight: 25.0, dimensions: { length: 120, width: 70, height: 10 }, freeShipping: true },
        status: 'published',
        featured: true,
        rating: { average: 4.6, count: 156 },
        sales: { totalSold: 8, revenue: 6399.92 },
        isOnSale: true
      },
      {
        name: 'Gaming Laptop Pro',
        slug: 'gaming-laptop-pro',
        description: 'High-performance gaming laptop with RTX graphics and 16GB RAM.',
        shortDescription: 'High-performance gaming laptop',
        sku: 'GLP-004',
        price: 1299.99,
        currency: 'USD',
        images: ['/images/products/laptop-1.jpg', '/images/products/laptop-2.jpg'],
        thumbnailImage: '/images/products/laptop-1.jpg',
        category: categories[0]._id,
        brand: 'GameTech',
        tags: ['laptop', 'gaming', 'rtx', 'high-performance'],
        attributes: [
          { name: 'RAM', value: '16GB' },
          { name: 'Graphics', value: 'RTX 4060' },
          { name: 'Storage', value: '512GB SSD' }
        ],
        inventory: { quantity: 12, lowStockThreshold: 2, trackQuantity: true, allowBackorder: true },
        shipping: { weight: 2.5, dimensions: { length: 35, width: 25, height: 3 }, freeShipping: true },
        status: 'published',
        featured: false,
        rating: { average: 4.8, count: 67 },
        sales: { totalSold: 5, revenue: 6499.95 }
      },
      {
        name: 'Wireless Charging Pad',
        slug: 'wireless-charging-pad',
        description: 'Fast wireless charging pad compatible with all Qi-enabled devices.',
        shortDescription: 'Fast wireless charging pad',
        sku: 'WCP-005',
        price: 39.99,
        currency: 'USD',
        images: ['/images/products/charger-1.jpg'],
        thumbnailImage: '/images/products/charger-1.jpg',
        category: categories[0]._id,
        brand: 'ChargeTech',
        tags: ['wireless', 'charging', 'qi', 'fast-charge'],
        attributes: [
          { name: 'Power', value: '15W' },
          { name: 'Compatibility', value: 'Qi Standard' },
          { name: 'LED Indicator', value: 'Yes' }
        ],
        inventory: { quantity: 100, lowStockThreshold: 10, trackQuantity: true, allowBackorder: false },
        shipping: { weight: 0.3, dimensions: { length: 10, width: 10, height: 1 }, freeShipping: true },
        status: 'published',
        featured: false,
        rating: { average: 4.3, count: 234 },
        sales: { totalSold: 89, revenue: 3561.11 }
      },
      {
        name: 'Bluetooth Speaker',
        slug: 'bluetooth-speaker',
        description: 'Portable Bluetooth speaker with 360-degree sound and waterproof design.',
        shortDescription: 'Portable waterproof Bluetooth speaker',
        sku: 'BTS-006',
        price: 79.99,
        currency: 'USD',
        images: ['/images/products/speaker-1.jpg', '/images/products/speaker-2.jpg'],
        thumbnailImage: '/images/products/speaker-1.jpg',
        category: categories[0]._id,
        brand: 'SoundWave',
        tags: ['speaker', 'bluetooth', 'portable', 'waterproof'],
        attributes: [
          { name: 'Battery Life', value: '12 hours' },
          { name: 'Waterproof', value: 'IPX7' },
          { name: 'Connectivity', value: 'Bluetooth 5.0' }
        ],
        inventory: { quantity: 75, lowStockThreshold: 8, trackQuantity: true, allowBackorder: false },
        shipping: { weight: 0.8, dimensions: { length: 15, width: 15, height: 8 }, freeShipping: true },
        status: 'published',
        featured: false,
        rating: { average: 4.4, count: 189 },
        sales: { totalSold: 67, revenue: 5359.33 }
      },
      {
        name: 'Mechanical Gaming Keyboard',
        slug: 'mechanical-gaming-keyboard',
        description: 'RGB mechanical gaming keyboard with customizable lighting and tactile switches.',
        shortDescription: 'RGB mechanical gaming keyboard',
        sku: 'MGK-007',
        price: 149.99,
        currency: 'USD',
        images: ['/images/products/keyboard-1.jpg'],
        thumbnailImage: '/images/products/keyboard-1.jpg',
        category: categories[0]._id,
        brand: 'KeyTech',
        tags: ['keyboard', 'mechanical', 'gaming', 'rgb'],
        attributes: [
          { name: 'Switch Type', value: 'Cherry MX Blue' },
          { name: 'Backlighting', value: 'RGB' },
          { name: 'Connectivity', value: 'USB-C' }
        ],
        inventory: { quantity: 45, lowStockThreshold: 5, trackQuantity: true, allowBackorder: false },
        shipping: { weight: 1.2, dimensions: { length: 45, width: 15, height: 3 }, freeShipping: true },
        status: 'published',
        featured: false,
        rating: { average: 4.6, count: 98 },
        sales: { totalSold: 34, revenue: 5099.66 }
      },
      {
        name: 'Gaming Mouse Pro',
        slug: 'gaming-mouse-pro',
        description: 'High-precision gaming mouse with customizable DPI and RGB lighting.',
        shortDescription: 'High-precision gaming mouse',
        sku: 'GMP-008',
        price: 89.99,
        currency: 'USD',
        images: ['/images/products/mouse-1.jpg'],
        thumbnailImage: '/images/products/mouse-1.jpg',
        category: categories[0]._id,
        brand: 'MouseTech',
        tags: ['mouse', 'gaming', 'precision', 'rgb'],
        attributes: [
          { name: 'DPI', value: '16000' },
          { name: 'Buttons', value: '8 programmable' },
          { name: 'Connectivity', value: 'USB' }
        ],
        inventory: { quantity: 60, lowStockThreshold: 6, trackQuantity: true, allowBackorder: false },
        shipping: { weight: 0.2, dimensions: { length: 12, width: 6, height: 4 }, freeShipping: true },
        status: 'published',
        featured: false,
        rating: { average: 4.5, count: 145 },
        sales: { totalSold: 78, revenue: 7019.22 }
      },

      // Clothing (6 products)
      {
        name: 'Organic Cotton T-Shirt',
        slug: 'organic-cotton-t-shirt',
        description: 'Comfortable and sustainable organic cotton t-shirt. Available in multiple colors and sizes.',
        shortDescription: 'Sustainable organic cotton t-shirt',
        sku: 'OCT-009',
        price: 29.99,
        currency: 'USD',
        images: ['/images/products/tshirt-1.jpg', '/images/products/tshirt-2.jpg'],
        thumbnailImage: '/images/products/tshirt-1.jpg',
        category: categories[1]._id,
        brand: 'EcoWear',
        tags: ['organic', 'cotton', 'sustainable', 'casual'],
        attributes: [
          { name: 'Material', value: '100% Organic Cotton' },
          { name: 'Sizes', value: 'S, M, L, XL' },
          { name: 'Colors', value: 'White, Black, Navy, Green' }
        ],
        inventory: { quantity: 100, lowStockThreshold: 10, trackQuantity: true, allowBackorder: false },
        shipping: { weight: 0.2, dimensions: { length: 30, width: 25, height: 2 }, freeShipping: false },
        status: 'published',
        featured: false,
        rating: { average: 4.3, count: 67 },
        sales: { totalSold: 89, revenue: 2669.11 }
      },
      {
        name: 'Denim Jeans Classic',
        slug: 'denim-jeans-classic',
        description: 'Classic fit denim jeans made from premium cotton with stretch comfort.',
        shortDescription: 'Classic fit denim jeans',
        sku: 'DJC-010',
        price: 79.99,
        currency: 'USD',
        images: ['/images/products/jeans-1.jpg'],
        thumbnailImage: '/images/products/jeans-1.jpg',
        category: categories[1]._id,
        brand: 'DenimCo',
        tags: ['jeans', 'denim', 'classic', 'comfort'],
        attributes: [
          { name: 'Fit', value: 'Classic' },
          { name: 'Material', value: '98% Cotton, 2% Elastane' },
          { name: 'Sizes', value: '28-40' }
        ],
        inventory: { quantity: 80, lowStockThreshold: 8, trackQuantity: true, allowBackorder: false },
        shipping: { weight: 0.6, dimensions: { length: 35, width: 20, height: 3 }, freeShipping: false },
        status: 'published',
        featured: false,
        rating: { average: 4.4, count: 123 },
        sales: { totalSold: 56, revenue: 4479.44 }
      },
      {
        name: 'Winter Jacket Warm',
        slug: 'winter-jacket-warm',
        description: 'Insulated winter jacket with water-resistant outer shell and warm lining.',
        shortDescription: 'Insulated winter jacket',
        sku: 'WJW-011',
        price: 149.99,
        originalPrice: 199.99,
        currency: 'USD',
        images: ['/images/products/jacket-1.jpg'],
        thumbnailImage: '/images/products/jacket-1.jpg',
        category: categories[1]._id,
        brand: 'WinterWear',
        tags: ['jacket', 'winter', 'warm', 'water-resistant'],
        attributes: [
          { name: 'Insulation', value: 'Synthetic' },
          { name: 'Water Resistance', value: '10,000mm' },
          { name: 'Sizes', value: 'S, M, L, XL, XXL' }
        ],
        inventory: { quantity: 25, lowStockThreshold: 3, trackQuantity: true, allowBackorder: true },
        shipping: { weight: 1.2, dimensions: { length: 40, width: 30, height: 8 }, freeShipping: true },
        status: 'published',
        featured: true,
        rating: { average: 4.7, count: 89 },
        sales: { totalSold: 12, revenue: 1799.88 },
        isOnSale: true
      },
      {
        name: 'Running Shoes Pro',
        slug: 'running-shoes-pro',
        description: 'Professional running shoes with advanced cushioning and breathable upper.',
        shortDescription: 'Professional running shoes',
        sku: 'RSP-012',
        price: 129.99,
        currency: 'USD',
        images: ['/images/products/shoes-1.jpg'],
        thumbnailImage: '/images/products/shoes-1.jpg',
        category: categories[1]._id,
        brand: 'RunFast',
        tags: ['shoes', 'running', 'athletic', 'cushioning'],
        attributes: [
          { name: 'Cushioning', value: 'Advanced' },
          { name: 'Upper', value: 'Breathable Mesh' },
          { name: 'Sizes', value: '7-12' }
        ],
        inventory: { quantity: 50, lowStockThreshold: 5, trackQuantity: true, allowBackorder: false },
        shipping: { weight: 0.8, dimensions: { length: 32, width: 22, height: 12 }, freeShipping: true },
        status: 'published',
        featured: false,
        rating: { average: 4.6, count: 156 },
        sales: { totalSold: 34, revenue: 4419.66 }
      },
      {
        name: 'Summer Dress Floral',
        slug: 'summer-dress-floral',
        description: 'Light and airy summer dress with beautiful floral pattern.',
        shortDescription: 'Light summer dress with floral pattern',
        sku: 'SDF-013',
        price: 59.99,
        currency: 'USD',
        images: ['/images/products/dress-1.jpg'],
        thumbnailImage: '/images/products/dress-1.jpg',
        category: categories[1]._id,
        brand: 'SummerStyle',
        tags: ['dress', 'summer', 'floral', 'casual'],
        attributes: [
          { name: 'Material', value: '100% Cotton' },
          { name: 'Pattern', value: 'Floral' },
          { name: 'Sizes', value: 'XS, S, M, L' }
        ],
        inventory: { quantity: 40, lowStockThreshold: 4, trackQuantity: true, allowBackorder: false },
        shipping: { weight: 0.3, dimensions: { length: 25, width: 20, height: 2 }, freeShipping: false },
        status: 'published',
        featured: false,
        rating: { average: 4.2, count: 78 },
        sales: { totalSold: 23, revenue: 1379.77 }
      },
      {
        name: 'Leather Handbag',
        slug: 'leather-handbag',
        description: 'Genuine leather handbag with multiple compartments and elegant design.',
        shortDescription: 'Genuine leather handbag',
        sku: 'LHB-014',
        price: 199.99,
        currency: 'USD',
        images: ['/images/products/handbag-1.jpg'],
        thumbnailImage: '/images/products/handbag-1.jpg',
        category: categories[1]._id,
        brand: 'LeatherLux',
        tags: ['handbag', 'leather', 'elegant', 'accessories'],
        attributes: [
          { name: 'Material', value: 'Genuine Leather' },
          { name: 'Compartments', value: '3' },
          { name: 'Color', value: 'Brown' }
        ],
        inventory: { quantity: 20, lowStockThreshold: 2, trackQuantity: true, allowBackorder: true },
        shipping: { weight: 0.8, dimensions: { length: 35, width: 25, height: 15 }, freeShipping: true },
        status: 'published',
        featured: true,
        rating: { average: 4.8, count: 45 },
        sales: { totalSold: 8, revenue: 1599.92 }
      },

      // Home & Garden (4 products)
      {
        name: 'Garden Tool Set',
        slug: 'garden-tool-set',
        description: 'Complete garden tool set with ergonomic handles. Includes trowel, pruners, weeder, and garden fork.',
        shortDescription: 'Complete garden tool set with ergonomic handles',
        sku: 'GTS-015',
        price: 79.99,
        currency: 'USD',
        images: ['/images/products/garden-tools-1.jpg', '/images/products/garden-tools-2.jpg'],
        thumbnailImage: '/images/products/garden-tools-1.jpg',
        category: categories[2]._id,
        brand: 'GardenPro',
        tags: ['garden', 'tools', 'outdoor', 'gardening'],
        attributes: [
          { name: 'Material', value: 'Stainless Steel' },
          { name: 'Handle', value: 'Ergonomic Rubber' },
          { name: 'Set Includes', value: '4 Tools' }
        ],
        inventory: { quantity: 25, lowStockThreshold: 5, trackQuantity: true, allowBackorder: false },
        shipping: { weight: 2.5, dimensions: { length: 40, width: 15, height: 8 }, freeShipping: false },
        status: 'published',
        featured: false,
        rating: { average: 4.6, count: 34 },
        sales: { totalSold: 12, revenue: 959.88 }
      },
      {
        name: 'Smart Home Hub',
        slug: 'smart-home-hub',
        description: 'Central smart home hub that controls all your connected devices.',
        shortDescription: 'Central smart home hub',
        sku: 'SHH-016',
        price: 199.99,
        currency: 'USD',
        images: ['/images/products/hub-1.jpg'],
        thumbnailImage: '/images/products/hub-1.jpg',
        category: categories[2]._id,
        brand: 'SmartHome',
        tags: ['smart-home', 'hub', 'automation', 'connected'],
        attributes: [
          { name: 'Connectivity', value: 'WiFi, Zigbee, Z-Wave' },
          { name: 'Voice Control', value: 'Yes' },
          { name: 'Compatibility', value: '1000+ devices' }
        ],
        inventory: { quantity: 15, lowStockThreshold: 2, trackQuantity: true, allowBackorder: true },
        shipping: { weight: 0.5, dimensions: { length: 12, width: 12, height: 3 }, freeShipping: true },
        status: 'published',
        featured: true,
        rating: { average: 4.5, count: 67 },
        sales: { totalSold: 6, revenue: 1199.94 }
      },
      {
        name: 'Coffee Maker Deluxe',
        slug: 'coffee-maker-deluxe',
        description: 'Programmable coffee maker with built-in grinder and thermal carafe.',
        shortDescription: 'Programmable coffee maker with grinder',
        sku: 'CMD-017',
        price: 149.99,
        currency: 'USD',
        images: ['/images/products/coffee-maker-1.jpg'],
        thumbnailImage: '/images/products/coffee-maker-1.jpg',
        category: categories[2]._id,
        brand: 'BrewMaster',
        tags: ['coffee', 'maker', 'programmable', 'grinder'],
        attributes: [
          { name: 'Capacity', value: '12 cups' },
          { name: 'Grinder', value: 'Built-in' },
          { name: 'Programmable', value: 'Yes' }
        ],
        inventory: { quantity: 30, lowStockThreshold: 3, trackQuantity: true, allowBackorder: false },
        shipping: { weight: 3.5, dimensions: { length: 30, width: 20, height: 35 }, freeShipping: true },
        status: 'published',
        featured: false,
        rating: { average: 4.4, count: 89 },
        sales: { totalSold: 18, revenue: 2699.82 }
      },
      {
        name: 'Air Purifier HEPA',
        slug: 'air-purifier-hepa',
        description: 'HEPA air purifier with smart sensors and quiet operation.',
        shortDescription: 'HEPA air purifier with smart sensors',
        sku: 'APH-018',
        price: 299.99,
        currency: 'USD',
        images: ['/images/products/air-purifier-1.jpg'],
        thumbnailImage: '/images/products/air-purifier-1.jpg',
        category: categories[2]._id,
        brand: 'AirClean',
        tags: ['air-purifier', 'hepa', 'smart', 'quiet'],
        attributes: [
          { name: 'Filter Type', value: 'HEPA' },
          { name: 'Room Size', value: '500 sq ft' },
          { name: 'Smart Sensors', value: 'Yes' }
        ],
        inventory: { quantity: 12, lowStockThreshold: 2, trackQuantity: true, allowBackorder: true },
        shipping: { weight: 8.0, dimensions: { length: 25, width: 25, height: 40 }, freeShipping: true },
        status: 'published',
        featured: true,
        rating: { average: 4.7, count: 123 },
        sales: { totalSold: 7, revenue: 2099.93 }
      },

      // Sports & Fitness (2 products)
      {
        name: 'Yoga Mat Premium',
        slug: 'yoga-mat-premium',
        description: 'Non-slip premium yoga mat with extra cushioning. Perfect for yoga, pilates, and fitness workouts.',
        shortDescription: 'Non-slip premium yoga mat with extra cushioning',
        sku: 'YMP-019',
        price: 49.99,
        currency: 'USD',
        images: ['/images/products/yoga-mat-1.jpg', '/images/products/yoga-mat-2.jpg'],
        thumbnailImage: '/images/products/yoga-mat-1.jpg',
        category: categories[3]._id,
        brand: 'ZenFit',
        tags: ['yoga', 'fitness', 'mat', 'eco-friendly'],
        attributes: [
          { name: 'Thickness', value: '6mm' },
          { name: 'Material', value: 'Eco-friendly TPE' },
          { name: 'Size', value: '72" x 24"' }
        ],
        inventory: { quantity: 75, lowStockThreshold: 10, trackQuantity: true, allowBackorder: false },
        shipping: { weight: 1.8, dimensions: { length: 72, width: 24, height: 0.6 }, freeShipping: true },
        status: 'published',
        featured: true,
        rating: { average: 4.4, count: 156 },
        sales: { totalSold: 78, revenue: 3899.22 }
      },
      {
        name: 'Dumbbell Set Adjustable',
        slug: 'dumbbell-set-adjustable',
        description: 'Adjustable dumbbell set with weight range from 5-50 lbs per dumbbell.',
        shortDescription: 'Adjustable dumbbell set 5-50 lbs',
        sku: 'DSA-020',
        price: 399.99,
        currency: 'USD',
        images: ['/images/products/dumbbells-1.jpg'],
        thumbnailImage: '/images/products/dumbbells-1.jpg',
        category: categories[3]._id,
        brand: 'FitGear',
        tags: ['dumbbells', 'weights', 'fitness', 'adjustable'],
        attributes: [
          { name: 'Weight Range', value: '5-50 lbs per dumbbell' },
          { name: 'Material', value: 'Cast Iron' },
          { name: 'Grip', value: 'Ergonomic' }
        ],
        inventory: { quantity: 8, lowStockThreshold: 1, trackQuantity: true, allowBackorder: true },
        shipping: { weight: 45.0, dimensions: { length: 50, width: 20, height: 15 }, freeShipping: true },
        status: 'published',
        featured: false,
        rating: { average: 4.6, count: 45 },
        sales: { totalSold: 3, revenue: 1199.97 }
      }
    ]);

    console.log(`✅ Created ${products.length} products`);
    console.log('🎉 Comprehensive data seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Categories: ${categories.length}`);
    console.log(`   - Products: ${products.length}`);
    console.log(`   - Electronics: 8 products`);
    console.log(`   - Clothing: 6 products`);
    console.log(`   - Home & Garden: 4 products`);
    console.log(`   - Sports & Fitness: 2 products`);
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
seedComprehensiveData();
