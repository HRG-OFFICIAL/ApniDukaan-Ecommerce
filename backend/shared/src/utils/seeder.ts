import mongoose from 'mongoose';
import { connectDatabase } from './database';
import { logger } from './logger';

// Sample data interfaces
interface SampleCategory {
  name: string;
  description: string;
  image?: string;
  icon?: string;
  parentCategory?: string; // slug reference
  sortOrder: number;
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    keywords: string[];
  };
}

interface SampleProduct {
  name: string;
  description: string;
  shortDescription?: string;
  sku: string;
  price: number;
  originalPrice?: number;
  images: string[];
  thumbnailImage?: string;
  category: string; // slug reference
  subcategory?: string;
  brand?: string;
  tags: string[];
  attributes: Array<{
    name: string;
    value: string;
    type: 'text' | 'number' | 'color' | 'size' | 'material';
  }>;
  inventory: {
    stock: number;
    lowStockThreshold: number;
    trackInventory: boolean;
  };
  shipping: {
    weight: number;
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
    freeShipping: boolean;
  };
  featured: boolean;
  status: 'active' | 'draft';
  isOnSale: boolean;
}

// Sample Categories Data
const sampleCategories: SampleCategory[] = [
  // Root Categories
  {
    name: 'Electronics',
    description: 'Latest electronic devices and gadgets',
    icon: '📱',
    sortOrder: 1,
    seo: {
      metaTitle: 'Electronics - Latest Devices & Gadgets',
      metaDescription: 'Shop the latest electronics including smartphones, laptops, tablets, and smart devices.',
      keywords: ['electronics', 'devices', 'gadgets', 'technology']
    }
  },
  {
    name: 'Clothing',
    description: 'Fashion and apparel for all styles',
    icon: '👕',
    sortOrder: 2,
    seo: {
      metaTitle: 'Clothing & Fashion - Trendy Apparel',
      metaDescription: 'Discover trendy clothing and fashion items for men, women, and kids.',
      keywords: ['clothing', 'fashion', 'apparel', 'style']
    }
  },
  {
    name: 'Home & Garden',
    description: 'Everything for your home and garden',
    icon: '🏠',
    sortOrder: 3,
    seo: {
      metaTitle: 'Home & Garden - Furniture, Decor & More',
      metaDescription: 'Transform your home and garden with our quality furniture, decor, and gardening supplies.',
      keywords: ['home', 'garden', 'furniture', 'decor']
    }
  },
  {
    name: 'Sports & Fitness',
    description: 'Sports equipment and fitness gear',
    icon: '🏋️',
    sortOrder: 4,
    seo: {
      metaTitle: 'Sports & Fitness - Equipment & Gear',
      metaDescription: 'Get fit with our sports equipment, fitness gear, and outdoor activity essentials.',
      keywords: ['sports', 'fitness', 'equipment', 'exercise']
    }
  },
  {
    name: 'Books',
    description: 'Books and educational materials',
    icon: '📚',
    sortOrder: 5,
    seo: {
      metaTitle: 'Books - Fiction, Non-Fiction & Educational',
      metaDescription: 'Explore our vast collection of books including fiction, non-fiction, and educational materials.',
      keywords: ['books', 'reading', 'fiction', 'educational']
    }
  },

  // Electronics Subcategories
  {
    name: 'Smartphones',
    description: 'Latest smartphones and mobile devices',
    parentCategory: 'electronics',
    sortOrder: 1,
    seo: {
      metaTitle: 'Smartphones - Latest Mobile Devices',
      metaDescription: 'Shop the latest smartphones from top brands with best prices and features.',
      keywords: ['smartphones', 'mobile', 'phones', 'android', 'iphone']
    }
  },
  {
    name: 'Laptops',
    description: 'Laptops and portable computers',
    parentCategory: 'electronics',
    sortOrder: 2,
    seo: {
      metaTitle: 'Laptops - Portable Computers & Notebooks',
      metaDescription: 'Find the perfect laptop for work, gaming, or personal use from top brands.',
      keywords: ['laptops', 'computers', 'notebooks', 'portable']
    }
  },
  {
    name: 'Headphones',
    description: 'Audio devices and headphones',
    parentCategory: 'electronics',
    sortOrder: 3,
    seo: {
      metaTitle: 'Headphones - Audio Devices & Accessories',
      metaDescription: 'Premium headphones and audio devices for music lovers and professionals.',
      keywords: ['headphones', 'audio', 'wireless', 'bluetooth']
    }
  },

  // Clothing Subcategories
  {
    name: "Men's Clothing",
    description: 'Fashion and apparel for men',
    parentCategory: 'clothing',
    sortOrder: 1,
    seo: {
      metaTitle: "Men's Clothing - Fashion & Apparel",
      metaDescription: 'Stylish clothing and fashion items for men including shirts, pants, and accessories.',
      keywords: ['mens clothing', 'mens fashion', 'mens apparel']
    }
  },
  {
    name: "Women's Clothing",
    description: 'Fashion and apparel for women',
    parentCategory: 'clothing',
    sortOrder: 2,
    seo: {
      metaTitle: "Women's Clothing - Fashion & Apparel",
      metaDescription: 'Trendy clothing and fashion items for women including dresses, tops, and accessories.',
      keywords: ['womens clothing', 'womens fashion', 'womens apparel']
    }
  }
];

// Sample Products Data
const sampleProducts: SampleProduct[] = [
  {
    name: 'iPhone 15 Pro',
    description: 'The most advanced iPhone ever with A17 Pro chip, titanium design, and pro camera system.',
    shortDescription: 'Advanced iPhone with A17 Pro chip and titanium design',
    sku: 'IPH15P-128-TIT',
    price: 999.99,
    originalPrice: 1099.99,
    images: [
      'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800',
      'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=800'
    ],
    thumbnailImage: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400',
    category: 'smartphones',
    brand: 'Apple',
    tags: ['smartphone', 'ios', 'premium', 'camera'],
    attributes: [
      { name: 'Storage', value: '128GB', type: 'text' },
      { name: 'Color', value: 'Titanium', type: 'color' },
      { name: 'Screen Size', value: '6.1"', type: 'text' },
      { name: 'RAM', value: '8GB', type: 'text' }
    ],
    inventory: {
      stock: 25,
      lowStockThreshold: 5,
      trackInventory: true
    },
    shipping: {
      weight: 0.4,
      dimensions: { length: 15, width: 7.5, height: 0.8 },
      freeShipping: true
    },
    featured: true,
    status: 'active',
    isOnSale: true
  },
  {
    name: 'MacBook Air M2',
    description: 'Supercharged by M2 chip, the redesigned MacBook Air is incredibly thin and delivers exceptional performance.',
    shortDescription: 'Thin, light, and powerful with M2 chip',
    sku: 'MBA-M2-256-SG',
    price: 1199.99,
    images: [
      'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800',
      'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800'
    ],
    thumbnailImage: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400',
    category: 'laptops',
    brand: 'Apple',
    tags: ['laptop', 'macos', 'productivity', 'portable'],
    attributes: [
      { name: 'Processor', value: 'Apple M2', type: 'text' },
      { name: 'Storage', value: '256GB SSD', type: 'text' },
      { name: 'RAM', value: '8GB', type: 'text' },
      { name: 'Color', value: 'Space Gray', type: 'color' }
    ],
    inventory: {
      stock: 15,
      lowStockThreshold: 3,
      trackInventory: true
    },
    shipping: {
      weight: 1.24,
      dimensions: { length: 30.4, width: 21.5, height: 1.6 },
      freeShipping: true
    },
    featured: true,
    status: 'active',
    isOnSale: false
  },
  {
    name: 'Sony WH-1000XM4 Wireless Headphones',
    description: 'Industry-leading noise canceling wireless headphones with premium sound quality and long battery life.',
    shortDescription: 'Premium noise-canceling wireless headphones',
    sku: 'SONY-WH1000XM4-BLK',
    price: 349.99,
    originalPrice: 399.99,
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800'
    ],
    thumbnailImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
    category: 'headphones',
    brand: 'Sony',
    tags: ['headphones', 'wireless', 'noise-canceling', 'premium'],
    attributes: [
      { name: 'Type', value: 'Over-ear', type: 'text' },
      { name: 'Color', value: 'Black', type: 'color' },
      { name: 'Battery Life', value: '30 hours', type: 'text' },
      { name: 'Connectivity', value: 'Bluetooth 5.0', type: 'text' }
    ],
    inventory: {
      stock: 50,
      lowStockThreshold: 10,
      trackInventory: true
    },
    shipping: {
      weight: 0.7,
      dimensions: { length: 25, width: 20, height: 8 },
      freeShipping: true
    },
    featured: true,
    status: 'active',
    isOnSale: true
  },
  {
    name: 'Organic Cotton T-Shirt',
    description: 'Premium organic cotton t-shirt with comfortable fit and sustainable materials.',
    shortDescription: 'Comfortable organic cotton t-shirt',
    sku: 'TSHIRT-ORG-M-WHT',
    price: 29.99,
    images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
      'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=800'
    ],
    thumbnailImage: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
    category: 'mens-clothing',
    brand: 'EcoWear',
    tags: ['t-shirt', 'organic', 'cotton', 'sustainable'],
    attributes: [
      { name: 'Size', value: 'M', type: 'size' },
      { name: 'Color', value: 'White', type: 'color' },
      { name: 'Material', value: '100% Organic Cotton', type: 'material' },
      { name: 'Fit', value: 'Regular', type: 'text' }
    ],
    inventory: {
      stock: 100,
      lowStockThreshold: 20,
      trackInventory: true
    },
    shipping: {
      weight: 0.2,
      dimensions: { length: 30, width: 25, height: 2 },
      freeShipping: false
    },
    featured: false,
    status: 'active',
    isOnSale: false
  },
  {
    name: 'Yoga Mat Pro',
    description: 'Professional-grade yoga mat with superior grip and cushioning for all yoga practices.',
    shortDescription: 'Professional yoga mat with superior grip',
    sku: 'YOGA-MAT-PRO-PUR',
    price: 79.99,
    images: [
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800',
      'https://images.unsplash.com/photo-1506629905136-b5e45ca39747?w=800'
    ],
    thumbnailImage: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400',
    category: 'sports-fitness',
    brand: 'YogaPro',
    tags: ['yoga', 'fitness', 'exercise', 'mat'],
    attributes: [
      { name: 'Thickness', value: '6mm', type: 'text' },
      { name: 'Color', value: 'Purple', type: 'color' },
      { name: 'Material', value: 'TPE', type: 'material' },
      { name: 'Size', value: '183cm x 61cm', type: 'text' }
    ],
    inventory: {
      stock: 75,
      lowStockThreshold: 15,
      trackInventory: true
    },
    shipping: {
      weight: 1.2,
      dimensions: { length: 183, width: 61, height: 0.6 },
      freeShipping: true
    },
    featured: false,
    status: 'active',
    isOnSale: false
  }
];

export class DatabaseSeeder {
  private models: { [key: string]: mongoose.Model<any> } = {};

  constructor() {
    // We'll load models dynamically based on available services
  }

  async seedDatabase(options: {
    dropFirst?: boolean;
    seedCategories?: boolean;
    seedProducts?: boolean;
    seedUsers?: boolean;
  } = {}) {
    const {
      dropFirst = false,
      seedCategories = true,
      seedProducts = true,
      seedUsers = false
    } = options;

    try {
      logger.info('Starting database seeding process...');

      if (dropFirst) {
        await this.dropCollections();
      }

      if (seedCategories) {
        await this.seedCategories();
      }

      if (seedProducts) {
        await this.seedProducts();
      }

      if (seedUsers) {
        await this.seedUsers();
      }

      logger.info('Database seeding completed successfully');
    } catch (error) {
      logger.error('Database seeding failed:', error);
      throw error;
    }
  }

  private async dropCollections() {
    logger.info('Dropping existing collections...');
    
    const collections = await mongoose.connection.db?.collections() || [];
    
    for (const collection of collections) {
      try {
        await collection.drop();
        logger.info(`Dropped collection: ${collection.collectionName}`);
      } catch (error: any) {
        // Ignore "ns not found" errors
        if (!error?.message?.includes('ns not found')) {
          logger.error(`Error dropping collection ${collection.collectionName}:`, error);
        }
      }
    }
  }

  private async seedCategories() {
    try {
      const Category = mongoose.model('Category');
      logger.info('Seeding categories...');

      const categoryMap = new Map<string, any>();

      // First pass: create root categories
      for (const categoryData of sampleCategories.filter(cat => !cat.parentCategory)) {
        const category = new Category({
          ...categoryData,
          slug: this.generateSlug(categoryData.name),
          path: this.generateSlug(categoryData.name)
        });
        
        const saved = await category.save();
        categoryMap.set(this.generateSlug(categoryData.name), saved);
        logger.info(`Created category: ${categoryData.name}`);
      }

      // Second pass: create subcategories
      for (const categoryData of sampleCategories.filter(cat => cat.parentCategory)) {
        const parentCategory = categoryMap.get(categoryData.parentCategory!);
        if (parentCategory) {
          const category = new Category({
            ...categoryData,
            slug: this.generateSlug(categoryData.name),
            parentCategory: parentCategory._id
          });
          
          const saved = await category.save();
          categoryMap.set(this.generateSlug(categoryData.name), saved);
          logger.info(`Created subcategory: ${categoryData.name}`);
        }
      }

      logger.info(`Seeded ${sampleCategories.length} categories`);
      return categoryMap;
    } catch (error) {
      logger.error('Error seeding categories:', error);
      throw error;
    }
  }

  private async seedProducts() {
    try {
      const Product = mongoose.model('Product');
      const Category = mongoose.model('Category');
      logger.info('Seeding products...');

      // Get all categories for reference
      const categories = await Category.find({}).lean();
      const categoryMap = new Map();
      categories.forEach((cat: any) => categoryMap.set(cat.slug, cat));

      for (const productData of sampleProducts) {
        const category = categoryMap.get(productData.category);
        if (!category) {
          logger.warn(`Category not found for product ${productData.name}: ${productData.category}`);
          continue;
        }

        const product = new Product({
          ...productData,
          slug: this.generateSlug(productData.name),
          category: category._id,
          subcategory: productData.subcategory ? categoryMap.get(productData.subcategory)?._id : undefined
        });

        await product.save();
        logger.info(`Created product: ${productData.name}`);
      }

      // Update category product counts (if method exists)
      // await Category.updateProductCounts();
      
      logger.info(`Seeded ${sampleProducts.length} products`);
    } catch (error) {
      logger.error('Error seeding products:', error);
      throw error;
    }
  }

  private async seedUsers() {
    try {
      // This would seed users if User model is available
      logger.info('User seeding skipped - implement when User service is ready');
    } catch (error) {
      logger.error('Error seeding users:', error);
      throw error;
    }
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  // Utility method to add more sample data
  async addSampleReviews(productCount: number = 5) {
    try {
      const Product = mongoose.model('Product');
      const Review = mongoose.model('Review');
      
      const products = await Product.find({}).limit(productCount);
      
      const sampleReviews = [
        {
          rating: 5,
          title: 'Excellent product!',
          comment: 'Really happy with this purchase. Great quality and fast delivery.',
          pros: ['Great quality', 'Fast delivery', 'Good value'],
          cons: [],
          isVerifiedPurchase: true
        },
        {
          rating: 4,
          title: 'Good purchase',
          comment: 'Good product overall, meets expectations.',
          pros: ['Works well', 'Good design'],
          cons: ['Could be cheaper'],
          isVerifiedPurchase: true
        },
        {
          rating: 5,
          title: 'Highly recommended',
          comment: 'Would definitely buy again. Exceeded my expectations.',
          pros: ['Excellent quality', 'Easy to use', 'Great customer service'],
          cons: [],
          isVerifiedPurchase: true
        }
      ];

      for (const product of products) {
        // Add 2-3 reviews per product
        const reviewCount = Math.floor(Math.random() * 2) + 2;
        
        for (let i = 0; i < reviewCount; i++) {
          const reviewData = sampleReviews[Math.floor(Math.random() * sampleReviews.length)];
          
          // Create a mock user ID (in real scenario, this would be actual user IDs)
          const mockUserId = new mongoose.Types.ObjectId();
          
          const review = new Review({
            ...reviewData,
            product: product._id,
            user: mockUserId,
            status: 'approved'
          });
          
          await review.save();
        }
      }
      
      logger.info(`Added sample reviews for ${products.length} products`);
    } catch (error) {
      logger.error('Error adding sample reviews:', error);
      throw error;
    }
  }
}

// Standalone seeding function
export async function seedDatabase(
  mongoUri: string,
  dbName: string,
  options: Parameters<DatabaseSeeder['seedDatabase']>[0] = {}
) {
  try {
    await connectDatabase({ uri: mongoUri, dbName });
    
    const seeder = new DatabaseSeeder();
    await seeder.seedDatabase(options);
    
    logger.info('Database seeding completed');
  } catch (error) {
    logger.error('Database seeding failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
  }
}

export default DatabaseSeeder;
