# 🗄️ Database Setup Guide for ApniDukaan

## Overview
This guide explains how to set up MongoDB for the ApniDukaan e-commerce platform with proper data structure and seeding.

## 📋 Prerequisites
- MongoDB Atlas account (recommended) or local MongoDB installation
- Node.js installed
- Environment variables configured

## 🚀 Quick Setup

### 1. **MongoDB Atlas Setup (Recommended)**

#### Step 1: Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Sign up for a free account
3. Create a new cluster (M0 Sandbox is free)

#### Step 2: Get Connection String
1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Copy the connection string
4. Replace `<password>` with your database user password

#### Step 3: Update Environment Variables
```bash
# In your .env file
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/apnidukaan?retryWrites=true&w=majority
```

### 2. **Local MongoDB Setup (Alternative)**

#### Install MongoDB
```bash
# Windows (using Chocolatey)
choco install mongodb

# macOS (using Homebrew)
brew install mongodb-community

# Ubuntu/Debian
sudo apt-get install mongodb
```

#### Start MongoDB
```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
# or
mongod --config /usr/local/etc/mongod.conf
```

#### Update Environment Variables
```bash
# In your .env file
MONGODB_URI=mongodb://localhost:27017/apnidukaan
```

## 🗂️ Database Structure

### Collections Overview
```
apnidukaan/
├── products/          # Product catalog
├── categories/        # Product categories
├── users/            # User accounts
├── orders/           # Order history
├── cart/             # Shopping cart (Redis)
└── sessions/         # User sessions (Redis)
```

### 1. **Products Collection**
```javascript
{
  _id: ObjectId,
  name: String,                    // Product name
  price: Number,                   // Current price
  originalPrice: Number,           // Original price
  discount: Number,                // Discount percentage
  rating: Number,                  // Average rating (1-5)
  reviews: Number,                 // Number of reviews
  images: [String],                // Product images array
  category: String,                // Main category
  subcategory: String,             // Subcategory
  brand: String,                   // Brand name
  description: String,             // Product description
  specifications: Object,          // Technical specs
  inStock: Boolean,                // Availability
  stockQuantity: Number,           // Stock count
  tags: [String],                  // Search tags
  createdAt: Date,                 // Creation date
  updatedAt: Date                  // Last update
}
```

### 2. **Categories Collection**
```javascript
{
  _id: ObjectId,
  name: String,                    // Category name
  slug: String,                    // URL-friendly name
  description: String,             // Category description
  image: String,                   // Category image
  parentCategory: ObjectId,        // Parent category (for subcategories)
  isActive: Boolean,               // Active status
  sortOrder: Number                // Display order
}
```

### 3. **Users Collection**
```javascript
{
  _id: ObjectId,
  email: String,                   // User email (unique)
  password: String,                // Hashed password
  firstName: String,               // First name
  lastName: String,                // Last name
  phone: String,                   // Phone number
  addresses: [Object],             // Shipping addresses
  role: String,                    // User role (user/admin)
  isActive: Boolean,               // Account status
  createdAt: Date,                 // Registration date
  updatedAt: Date                  // Last update
}
```

### 4. **Orders Collection**
```javascript
{
  _id: ObjectId,
  userId: ObjectId,                // User reference
  orderNumber: String,             // Unique order number
  items: [Object],                 // Order items
  totalAmount: Number,             // Total order amount
  status: String,                  // Order status
  paymentMethod: String,           // Payment method used
  paymentStatus: String,           // Payment status
  shippingAddress: Object,         // Delivery address
  trackingNumber: String,          // Shipping tracking
  createdAt: Date,                 // Order date
  updatedAt: Date                  // Last update
}
```

## 🌱 Database Seeding

### 1. **Run the Seeding Script**
```bash
# Navigate to project root
cd /path/to/apnidukaan-ecommerce

# Install dependencies (if not already done)
npm install

# Run the seeding script
node scripts/seed-database.js
```

### 2. **What Gets Seeded**
- **5 Categories**: Electronics, Fashion, Home & Garden, Sports, Books
- **5 Sample Products**: Headphones, Smartwatch, Backpack, Camera, Shoes
- **Database Indexes**: For optimal query performance
- **Sample Data**: Ready for testing

### 3. **Verify Seeding**
```bash
# Check if data was inserted
# You can use MongoDB Compass or Atlas UI to verify
```

## 🔧 API Integration

### 1. **Update API Gateway**
The API Gateway automatically detects MongoDB connection and uses real data when available, falls back to mock data when MongoDB is unavailable.

### 2. **Environment Variables Required**
```bash
# Backend (.env)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/apnidukaan
REDIS_URL=redis://default:password@redis-cloud-url:port

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=https://your-api-gateway-url.com
```

## 📊 Database Indexes

The seeding script automatically creates these indexes for optimal performance:

### Products Collection
- `{ category: 1 }` - Category filtering
- `{ name: "text", description: "text" }` - Text search
- `{ price: 1 }` - Price sorting
- `{ rating: -1 }` - Rating sorting

### Categories Collection
- `{ slug: 1 }` - Category lookup by slug

### Users Collection
- `{ email: 1 }` - Unique email constraint

### Orders Collection
- `{ userId: 1 }` - User order lookup
- `{ createdAt: -1 }` - Recent orders

## 🚨 Troubleshooting

### Common Issues

#### 1. **Connection Failed**
```
Error: MongoDB connection failed
```
**Solution**: Check your `MONGODB_URI` in `.env` file

#### 2. **Authentication Failed**
```
Error: Authentication failed
```
**Solution**: Verify username/password in connection string

#### 3. **Network Timeout**
```
Error: Server selection timed out
```
**Solution**: Check your IP whitelist in MongoDB Atlas

#### 4. **Database Not Found**
```
Error: Database does not exist
```
**Solution**: The database will be created automatically on first write

### Debug Mode
```bash
# Enable debug logging
DEBUG=mongodb:* node scripts/seed-database.js
```

## 🔄 Data Management

### Adding New Products
```javascript
// Use the API endpoint
POST /api/catalog/products
{
  "name": "New Product",
  "price": 999,
  "category": "electronics",
  // ... other fields
}
```

### Updating Products
```javascript
// Use the API endpoint
PUT /api/catalog/products/:id
{
  "price": 899,
  "stockQuantity": 50
}
```

### Bulk Operations
```javascript
// Use MongoDB directly for bulk operations
const products = await db.collection('products').insertMany([
  { name: 'Product 1', price: 100 },
  { name: 'Product 2', price: 200 }
]);
```

## 📈 Performance Optimization

### 1. **Connection Pooling**
The MongoDB driver automatically handles connection pooling.

### 2. **Query Optimization**
- Use indexes for filtering and sorting
- Limit results with pagination
- Use projection to select only needed fields

### 3. **Caching**
- Redis is used for session storage
- Product data can be cached for better performance

## 🔒 Security Considerations

### 1. **Database Access**
- Use strong passwords
- Enable IP whitelisting
- Use MongoDB Atlas security features

### 2. **Data Validation**
- Validate all input data
- Use MongoDB schema validation
- Sanitize user inputs

### 3. **Backup Strategy**
- Enable automatic backups in MongoDB Atlas
- Test restore procedures regularly

## 📚 Next Steps

1. **Run the seeding script** to populate your database
2. **Test the API endpoints** to ensure data is being served
3. **Add more products** through the admin interface
4. **Monitor performance** and optimize as needed
5. **Set up regular backups** for production

## 🆘 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify your environment variables
3. Test MongoDB connection independently
4. Check the application logs for detailed error messages

---

**Ready to seed your database? Run:**
```bash
node scripts/seed-database.js
```
