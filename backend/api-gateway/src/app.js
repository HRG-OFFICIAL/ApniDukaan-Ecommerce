// MongoDB-integrated API Gateway - Uses your existing database!
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { MongoClient, ObjectId } = require('mongodb');

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
    console.log('✅ Connected to MongoDB - Using your existing database!');
    console.log(`📊 Database: ${db.databaseName}`);
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    console.log('🔄 Falling back to mock data');
  }
}

// Initialize MongoDB connection
connectToMongoDB();

// Middleware
app.use(helmet());
const exactAllowedOrigins = [
  'http://localhost:3000',
  'https://apni-dukaan-ecommerce-frontend.vercel.app',
  'https://apnidukaan-ecommerce.vercel.app',
  process.env.FRONTEND_URL,
  process.env.FRONTEND_ORIGIN
].filter(Boolean)

const dynamicOriginAllowlist = [
  /\.vercel\.app$/i
]

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true) // allow server-to-server / health checks
    if (exactAllowedOrigins.includes(origin)) return callback(null, true)
    if (dynamicOriginAllowlist.some(rx => rx.test(origin))) return callback(null, true)
    return callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 204
}

// Apply CORS for all routes
app.use(cors(corsOptions))
// Ensure preflight requests are handled with CORS headers
app.options('*', cors(corsOptions))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'ApniDukaan API Gateway',
    version: '1.0.0',
    database: db ? 'connected' : 'disconnected',
    collections: db ? ['products', 'categories', 'reviews'] : []
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

// Products API endpoint - Uses your real MongoDB data!
app.get('/api/catalog/products', async (req, res) => {
  try {
    const { page = 1, limit = 12, category, sortField = 'createdAt', sortOrder = 'desc' } = req.query;
    
    let products = [];
    let total = 0;
    
    if (db) {
      // Use your real MongoDB data
      const collection = db.collection('products');
      
      // Build query
      const query = {};
      if (category) {
        if (/^[a-f0-9]{24}$/i.test(category)) {
          // Provided an ObjectId string
          query.category = { $in: [new ObjectId(category), category] };
        } else {
          // Try resolving category by name/slug in categories collection
          const categoriesCol = db.collection('categories');
          const catDoc = await categoriesCol.findOne({
            $or: [
              { name: { $regex: new RegExp(`^${category}$`, 'i') } },
              { slug: { $regex: new RegExp(`^${category}$`, 'i') } }
            ]
          });
          if (catDoc && catDoc._id) {
            query.category = { $in: [catDoc._id, catDoc.name] };
          } else {
            // Try to find in children
            const parentWithChild = await categoriesCol.findOne({
              'children.slug': { $regex: new RegExp(`^${category}$`, 'i') }
            });
            if (parentWithChild) {
              const matchedChild = parentWithChild.children.find(c => 
                new RegExp(`^${category}$`, 'i').test(c.slug || '')
              );
              if (matchedChild && matchedChild.name) {
                query.category = matchedChild.name;
              } else {
                query.category = category;
              }
            } else {
              // Fallback to raw string match (for legacy datasets)
              query.category = category;
            }
          }
        }
      }
      
      // Build sort
      const sort = {};
      if (sortField === 'price') {
        sort.price = sortOrder === 'asc' ? 1 : -1;
      } else if (sortField === 'rating') {
        // dataset stores rating as an object { average, count }
        sort['rating.average'] = sortOrder === 'asc' ? 1 : -1;
      } else {
        sort.createdAt = sortOrder === 'asc' ? 1 : -1;
      }
      
      // Get total count
      total = await collection.countDocuments(query);
      
      // Get products with pagination and join category name when category is ObjectId
      products = await collection
        .aggregate([
          { $match: query },
          { $sort: sort },
          { $skip: (parseInt(page) - 1) * parseInt(limit) },
          { $limit: parseInt(limit) },
          { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'cat' } },
          { $addFields: { categoryName: { $ifNull: [ { $arrayElemAt: [ '$cat.name', 0 ] }, '$category' ] } } },
          { $project: { cat: 0 } }
        ])
        .toArray();
      
      // Convert MongoDB _id to id for frontend compatibility
      products = products.map(product => ({
        ...product,
        id: product._id.toString()
      }));
      
      console.log(`📦 Fetched ${products.length} products from MongoDB`);
    } else {
      // Fallback to mock data
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
      
      console.log(`📦 Using mock data - ${products.length} products`);
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
    console.error('❌ Error fetching products:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products'
    });
  }
});

// Fetch products by SKUs (case-insensitive), preserving requested order
app.get('/api/catalog/products/by-skus', async (req, res) => {
  try {
    const skusParam = req.query.skus
    if (!skusParam) {
      return res.status(400).json({ success: false, error: 'Missing skus query param' })
    }
    const rawSkus = Array.isArray(skusParam) ? skusParam.join(',') : String(skusParam)
    const requestedSkus = rawSkus
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
    if (requestedSkus.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid skus provided' })
    }

    let products = []
    if (db) {
      const collection = db.collection('products')
      // Case-insensitive exact match via regexes
      const skuRegexes = requestedSkus.map(s => new RegExp(`^${s}$`, 'i'))
      const found = await collection
        .find({ sku: { $in: skuRegexes } })
        .project({})
        .toArray()

      // Map by lowercase sku for ordering
      const map = new Map()
      for (const p of found) {
        if (!p || !p.sku) continue
        map.set(String(p.sku).toLowerCase(), p)
      }

      // Preserve requested order
      products = requestedSkus
        .map(s => map.get(s.toLowerCase()))
        .filter(Boolean)

      // Normalize id
      products = products.map(p => ({ ...p, id: p._id ? String(p._id) : p.id }))
    } else {
      // No DB connected; return empty set rather than mock
      products = []
    }

    res.json({ success: true, data: products })
  } catch (error) {
    console.error('❌ Error fetching products by skus:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch products by skus' })
  }
})

// Fetch products by MongoDB _ids, preserving requested order (v2)
app.get('/api/catalog/products/by-ids', async (req, res) => {
  try {
    const idsParam = req.query.ids
    if (!idsParam) {
      return res.status(400).json({ success: false, error: 'Missing ids query param' })
    }
    const rawIds = Array.isArray(idsParam) ? idsParam.join(',') : String(idsParam)
    const requestedIds = rawIds.split(',').map(s => s.trim()).filter(Boolean)
    if (requestedIds.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid ids provided' })
    }

    let products = []
    if (db) {
      const collection = db.collection('products')
      const objectIds = []
      for (const id of requestedIds) {
        try { objectIds.push(new ObjectId(id)) } catch {}
      }
      const found = await collection.find({ _id: { $in: objectIds } }).toArray()
      const map = new Map()
      for (const p of found) {
        if (p && p._id) map.set(String(p._id), p)
      }
      products = requestedIds.map(id => map.get(id)).filter(Boolean)
      products = products.map(p => ({ ...p, id: String(p._id) }))
    } else {
      products = []
    }

    res.json({ success: true, data: products })
  } catch (error) {
    console.error('❌ Error fetching products by ids:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch products by ids' })
  }
})

// Categories API endpoint - Uses your real MongoDB data!
app.get('/api/catalog/categories', async (req, res) => {
  try {
    let categories = [];
    
    if (db) {
      // Use your real MongoDB data
      const collection = db.collection('categories');
      categories = await collection.find({}).toArray();
      
      // Convert MongoDB _id to id for frontend compatibility
      categories = categories.map(category => ({
        ...category,
        id: category._id.toString()
      }));
      
      console.log(`📂 Fetched ${categories.length} categories from MongoDB`);
    } else {
      // Fallback to mock data
      categories = [
        { id: 'electronics', name: 'Electronics', count: 245, image: 'https://via.placeholder.com/200x200?text=Electronics' },
        { id: 'fashion', name: 'Fashion', count: 189, image: 'https://via.placeholder.com/200x200?text=Fashion' },
        { id: 'home-garden', name: 'Home & Garden', count: 156, image: 'https://via.placeholder.com/200x200?text=Home' },
        { id: 'sports', name: 'Sports', count: 134, image: 'https://via.placeholder.com/200x200?text=Sports' },
        { id: 'books', name: 'Books', count: 98, image: 'https://via.placeholder.com/200x200?text=Books' },
        { id: 'toys', name: 'Toys', count: 87, image: 'https://via.placeholder.com/200x200?text=Toys' }
      ];
      
      console.log(`📂 Using mock data - ${categories.length} categories`);
    }
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('❌ Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories'
    });
  }
});

// Single product API endpoint - Uses your real MongoDB data!
app.get('/api/catalog/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let product = null;
    
    if (db) {
      // Use your real MongoDB data
      const collection = db.collection('products');
      const ObjectId = require('mongodb').ObjectId;
      
      try {
        product = await collection.findOne({ _id: new ObjectId(id) });
        if (product) {
          product.id = product._id.toString();
          delete product._id;
        }
        console.log(`📦 Fetched product ${id} from MongoDB`);
      } catch (error) {
        console.log(`❌ Invalid product ID format: ${id}`);
      }
    } else {
      // Fallback to mock data
      product = mockProducts.find(p => p.id === id);
      console.log(`📦 Using mock data for product ${id}`);
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
    console.error('❌ Error fetching product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product'
    });
  }
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
  console.log(`📊 Database: ${db ? 'MongoDB Connected' : 'Mock Data Mode'}`);
  console.log(`🗄️ Collections: ${db ? 'products, categories, reviews' : 'mock data'}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`📦 Products API: http://localhost:${PORT}/api/catalog/products`);
  console.log(`📂 Categories API: http://localhost:${PORT}/api/catalog/categories`);
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
