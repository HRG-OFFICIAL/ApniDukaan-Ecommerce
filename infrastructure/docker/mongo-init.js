// MongoDB Initialization Script for ApniDukaan
// This script creates databases and initial collections for all microservices

// Create databases and collections for each service
db = db.getSiblingDB('ApniDukaan_catalog');
db.createCollection('products');
db.createCollection('categories');
db.createCollection('reviews');

// Create indexes for catalog service
db.products.createIndex({ "name": "text", "description": "text" });
db.products.createIndex({ "category": 1 });
db.products.createIndex({ "price": 1 });
db.products.createIndex({ "rating": -1 });
db.products.createIndex({ "createdAt": -1 });
db.products.createIndex({ "sku": 1 }, { unique: true });

db.categories.createIndex({ "name": 1 }, { unique: true });
db.reviews.createIndex({ "productId": 1 });
db.reviews.createIndex({ "userId": 1 });

// Insert sample categories
db.categories.insertMany([
  {
    _id: ObjectId(),
    name: "Electronics",
    description: "Electronic devices and gadgets",
    image: "https://via.placeholder.com/300x200/007acc/ffffff?text=Electronics",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: ObjectId(),
    name: "Clothing",
    description: "Fashion and apparel",
    image: "https://via.placeholder.com/300x200/28a745/ffffff?text=Clothing",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: ObjectId(),
    name: "Home & Garden",
    description: "Home improvement and garden supplies",
    image: "https://via.placeholder.com/300x200/17a2b8/ffffff?text=Home+Garden",
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

// User service database
db = db.getSiblingDB('ApniDukaan_users');
db.createCollection('users');
db.createCollection('profiles');
db.createCollection('wishlists');

// Create indexes for user service
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "username": 1 }, { unique: true });
db.profiles.createIndex({ "userId": 1 }, { unique: true });
db.wishlists.createIndex({ "userId": 1 });

// Order service database
db = db.getSiblingDB('ApniDukaan_orders');
db.createCollection('orders');
db.createCollection('carts');
db.createCollection('order_items');

// Create indexes for order service
db.orders.createIndex({ "userId": 1 });
db.orders.createIndex({ "status": 1 });
db.orders.createIndex({ "createdAt": -1 });
db.carts.createIndex({ "userId": 1 }, { unique: true });
db.order_items.createIndex({ "orderId": 1 });

// Payment service database
db = db.getSiblingDB('ApniDukaan_payments');
db.createCollection('payments');
db.createCollection('payment_methods');
db.createCollection('transactions');

// Create indexes for payment service
db.payments.createIndex({ "orderId": 1 });
db.payments.createIndex({ "userId": 1 });
db.payments.createIndex({ "status": 1 });
db.payment_methods.createIndex({ "userId": 1 });
db.transactions.createIndex({ "paymentId": 1 });

print('MongoDB initialization completed successfully!');
