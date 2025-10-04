// MongoDB-integrated API Gateway
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/apnidukaan';
let db;

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db();
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    // Fallback to mock data if MongoDB fails
    console.log('🔄 Falling back to mock data');
  }
}

// Initialize MongoDB connection
connectToMongoDB();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'ApniDukaan API Gateway',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: db ? 'connected' : 'disconnected'
  });
});

// API status
app.get('/api/status', (req, res) => {
  res.json({
    service: 'ApniDukaan API Gateway',
    status: 'running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: db ? 'connected' : 'disconnected'
  });
});

// Mock data fallback
const mockProducts = [
  {
    id: '1',
    name: 'boAt Rockerz 450 Bluetooth Headphones',
    price: 1499,
    originalPrice: 2990,
    discount: 50,
    rating: 4.2,
    reviews: 1284,
    image: 'https://via.placeholder.com/300x300?text=Headphones',
    category: 'electronics',
    inStock: true
  },
  {
    id: '2',
    name: 'Fire-Boltt Phoenix Pro Smartwatch',
    price: 1999,
    originalPrice: 7999,
    discount: 75,
    rating: 4.1,
    reviews: 8924,
    image: 'https://via.placeholder.com/300x300?text=Smartwatch',
    category: 'electronics',
    inStock: true
  },
  {
    id: '3',
    name: 'American Tourister Laptop Backpack',
    price: 899,
    originalPrice: 2175,
    discount: 59,
    rating: 4.3,
    reviews: 15647,
    image: 'https://via.placeholder.com/300x300?text=Backpack',
    category: 'fashion',
    inStock: true
  },
  {
    id: '4',
    name: 'GoPro HERO11 Black Action Camera',
    price: 37999,
    originalPrice: 54500,
    discount: 30,
    rating: 4.4,
    reviews: 1573,
    image: 'https://via.placeholder.com/300x300?text=Camera',
    category: 'electronics',
    inStock: true
  }
];

const mockCategories = [
  { id: 'electronics', name: 'Electronics', count: 245, image: 'https://via.placeholder.com/200x200?text=Electronics' },
  { id: 'fashion', name: 'Fashion', count: 189, image: 'https://via.placeholder.com/200x200?text=Fashion' },
  { id: 'home-garden', name: 'Home & Garden', count: 156, image: 'https://via.placeholder.com/200x200?text=Home' },
  { id: 'sports', name: 'Sports', count: 134, image: 'https://via.placeholder.com/200x200?text=Sports' },
  { id: 'books', name: 'Books', count: 98, image: 'https://via.placeholder.com/200x200?text=Books' },
  { id: 'toys', name: 'Toys', count: 87, image: 'https://via.placeholder.com/200x200?text=Toys' }
];

// Products API endpoint
app.get('/api/catalog/products', async (req, res) => {
  try {
    const { page = 1, limit = 12, category, sortField = 'createdAt', sortOrder = 'desc' } = req.query;
    
    let products = [];
    let total = 0;
    
    if (db) {
      // Use MongoDB
      const collection = db.collection('products');
      
      // Build query
      const query = {};
      if (category) {
        query.category = category.toLowerCase();
      }
      
      // Build sort
      const sort = {};
      if (sortField === 'price') {
        sort.price = sortOrder === 'asc' ? 1 : -1;
      } else if (sortField === 'rating') {
        sort.rating = sortOrder === 'asc' ? 1 : -1;
      } else {
        sort.createdAt = sortOrder === 'asc' ? 1 : -1;
      }
      
      // Get total count
      total = await collection.countDocuments(query);
      
      // Get products with pagination
      products = await collection
        .find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .toArray();
      
      // Convert MongoDB _id to id for frontend compatibility
      products = products.map(product => ({
        ...product,
        id: product._id.toString()
      }));
    } else {
      // Use mock data
      let filteredProducts = [...mockProducts];
      
      if (category) {
        filteredProducts = filteredProducts.filter(product => 
          product.category.toLowerCase() === category.toLowerCase()
        );
      }
      
      // Sort products
      filteredProducts.sort((a, b) => {
        if (sortField === 'price') {
          return sortOrder === 'asc' ? a.price - b.price : b.price - a.price;
        }
        if (sortField === 'rating') {
          return sortOrder === 'asc' ? a.rating - b.rating : b.rating - a.rating;
        }
        return 0;
      });
      
      total = filteredProducts.length;
      
      // Pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      products = filteredProducts.slice(startIndex, endIndex);
    }
    
    res.json({
      success: true,
      data: {
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products'
    });
  }
});

// Categories API endpoint
app.get('/api/catalog/categories', async (req, res) => {
  try {
    let categories = [];
    
    if (db) {
      // Use MongoDB
      const collection = db.collection('categories');
      categories = await collection.find({ isActive: true }).sort({ sortOrder: 1 }).toArray();
      
      // Convert MongoDB _id to id for frontend compatibility
      categories = categories.map(category => ({
        ...category,
        id: category._id.toString()
      }));
    } else {
      // Use mock data
      categories = mockCategories;
    }
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories'
    });
  }
});

// Single product API endpoint
app.get('/api/catalog/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let product = null;
    
    if (db) {
      // Use MongoDB
      const collection = db.collection('products');
      product = await collection.findOne({ _id: new require('mongodb').ObjectId(id) });
      
      if (product) {
        product.id = product._id.toString();
        delete product._id;
      }
    } else {
      // Use mock data
      product = mockProducts.find(p => p.id === id);
    }
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product'
    });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Database: ${db ? 'MongoDB Connected' : 'Mock Data Mode'}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});
