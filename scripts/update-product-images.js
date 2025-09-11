#!/usr/bin/env node

/**
 * Update Product Images Script
 * Updates product images with real stock photos from Unsplash
 */

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

const Product = mongoose.model('Product', ProductSchema);

// Image mapping for different product types
const imageMappings = {
  'wireless-bluetooth-headphones': {
    primary: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop&crop=center',
    secondary: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&h=600&fit=crop&crop=center'
  },
  'smart-fitness-watch': {
    primary: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop&crop=center',
    secondary: 'https://images.unsplash.com/photo-1544117519-31a4b719223d?w=600&h=600&fit=crop&crop=center'
  },
  '4k-ultra-hd-smart-tv': {
    primary: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600&h=600&fit=crop&crop=center',
    secondary: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600&h=600&fit=crop&crop=center'
  },
  'gaming-laptop-pro': {
    primary: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&h=600&fit=crop&crop=center',
    secondary: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&h=600&fit=crop&crop=center'
  },
  'wireless-charging-pad': {
    primary: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&h=600&fit=crop&crop=center',
    secondary: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&h=600&fit=crop&crop=center'
  },
  'bluetooth-speaker': {
    primary: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&h=600&fit=crop&crop=center',
    secondary: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&h=600&fit=crop&crop=center'
  },
  'mechanical-gaming-keyboard': {
    primary: 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=600&h=600&fit=crop&crop=center',
    secondary: 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=600&h=600&fit=crop&crop=center'
  },
  'gaming-mouse-pro': {
    primary: 'https://images.unsplash.com/photo-1527864550417-7f91c4c0b6b4?w=600&h=600&fit=crop&crop=center',
    secondary: 'https://images.unsplash.com/photo-1527864550417-7f91c4c0b6b4?w=600&h=600&fit=crop&crop=center'
  },
  'organic-cotton-t-shirt': {
    primary: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=600&fit=crop&crop=center',
    secondary: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=600&fit=crop&crop=center'
  },
  'denim-jeans-classic': {
    primary: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&h=600&fit=crop&crop=center',
    secondary: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&h=600&fit=crop&crop=center'
  },
  'winter-jacket-warm': {
    primary: 'https://images.unsplash.com/photo-1551028719-001c3083db88?w=600&h=600&fit=crop&crop=center',
    secondary: 'https://images.unsplash.com/photo-1551028719-001c3083db88?w=600&h=600&fit=crop&crop=center'
  },
  'running-shoes-pro': {
    primary: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop&crop=center',
    secondary: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop&crop=center'
  },
  'summer-dress-floral': {
    primary: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&h=600&fit=crop&crop=center',
    secondary: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&h=600&fit=crop&crop=center'
  },
  'leather-handbag': {
    primary: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop&crop=center',
    secondary: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop&crop=center'
  },
  'garden-tool-set': {
    primary: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&h=600&fit=crop&crop=center',
    secondary: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&h=600&fit=crop&crop=center'
  },
  'smart-home-hub': {
    primary: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=600&fit=crop&crop=center',
    secondary: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=600&fit=crop&crop=center'
  },
  'coffee-maker-deluxe': {
    primary: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&h=600&fit=crop&crop=center',
    secondary: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&h=600&fit=crop&crop=center'
  },
  'air-purifier-hepa': {
    primary: 'https://images.unsplash.com/photo-1581578731548-c6a0c3f2fcc0?w=600&h=600&fit=crop&crop=center',
    secondary: 'https://images.unsplash.com/photo-1581578731548-c6a0c3f2fcc0?w=600&h=600&fit=crop&crop=center'
  },
  'yoga-mat-premium': {
    primary: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&h=600&fit=crop&crop=center',
    secondary: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&h=600&fit=crop&crop=center'
  },
  'dumbbell-set-adjustable': {
    primary: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=600&fit=crop&crop=center',
    secondary: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=600&fit=crop&crop=center'
  }
};

async function updateProductImages() {
  try {
    console.log('🌱 Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');

    console.log('🖼️ Updating product images...');
    
    const products = await Product.find({});
    let updatedCount = 0;

    for (const product of products) {
      const imageMapping = imageMappings[product.slug];
      
      if (imageMapping) {
        const updatedImages = [
          imageMapping.primary,
          imageMapping.secondary
        ];

        await Product.updateOne(
          { _id: product._id },
          {
            $set: {
              images: updatedImages,
              thumbnailImage: imageMapping.primary
            }
          }
        );

        console.log(`  ✅ Updated images for: ${product.name}`);
        updatedCount++;
      } else {
        console.log(`  ⚠️  No image mapping found for: ${product.slug}`);
      }
    }

    console.log(`🎉 Image update completed!`);
    console.log(`📊 Summary:`);
    console.log(`   - Products processed: ${products.length}`);
    console.log(`   - Images updated: ${updatedCount}`);
    console.log(`   - Using Unsplash stock photos`);

  } catch (error) {
    console.error('❌ Error updating images:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB Atlas');
    process.exit(0);
  }
}

// Run the update
updateProductImages();
