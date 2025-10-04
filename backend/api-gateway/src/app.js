// Ultra-simple API Gateway - No TypeScript, No Dependencies, Just Works!
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'ApniDukaan API Gateway',
    version: '1.0.0'
  });
});

// API status
app.get('/api/status', (req, res) => {
  res.json({
    service: 'ApniDukaan API Gateway',
    status: 'running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Mock product data
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

// Products API endpoint
app.get('/api/catalog/products', (req, res) => {
  const { page = 1, limit = 12, category, sortField = 'createdAt', sortOrder = 'desc' } = req.query;
  
  let filteredProducts = [...mockProducts];
  
  // Filter by category if provided
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
  
  // Pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
  
  res.json({
    success: true,
    data: {
      products: paginatedProducts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredProducts.length,
        totalPages: Math.ceil(filteredProducts.length / limit)
      }
    }
  });
});

// Categories API endpoint
app.get('/api/catalog/categories', (req, res) => {
  const categories = [
    { id: 'electronics', name: 'Electronics', count: 245, image: 'https://via.placeholder.com/200x200?text=Electronics' },
    { id: 'fashion', name: 'Fashion', count: 189, image: 'https://via.placeholder.com/200x200?text=Fashion' },
    { id: 'home-garden', name: 'Home & Garden', count: 156, image: 'https://via.placeholder.com/200x200?text=Home' },
    { id: 'sports', name: 'Sports', count: 134, image: 'https://via.placeholder.com/200x200?text=Sports' },
    { id: 'books', name: 'Books', count: 98, image: 'https://via.placeholder.com/200x200?text=Books' },
    { id: 'toys', name: 'Toys', count: 87, image: 'https://via.placeholder.com/200x200?text=Toys' }
  ];
  
  res.json({
    success: true,
    data: categories
  });
});

// Single product API endpoint
app.get('/api/catalog/products/:id', (req, res) => {
  const { id } = req.params;
  const product = mockProducts.find(p => p.id === id);
  
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
});

// GraphQL placeholder
app.get('/graphql', (req, res) => {
  res.json({
    message: 'GraphQL endpoint ready',
    status: 'available',
    timestamp: new Date().toISOString()
  });
});

// Root
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to ApniDukaan API Gateway',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 ApniDukaan API Gateway running on port ${PORT}`);
  console.log(`🏥 Health: http://localhost:${PORT}/health`);
  console.log(`📈 Status: http://localhost:${PORT}/api/status`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});
