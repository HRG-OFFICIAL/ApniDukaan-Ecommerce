import { Product, IProductDocument } from '../models/Product';
import { Category } from '../models/Category';
import { ProductStatus, logger, ValidationError, NotFoundError, ForbiddenError } from '@shopsphere/shared';
import { redisClient } from '@shopsphere/shared';

export interface ProductSearchFilters {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  brand?: string;
  tags?: string[];
  inStock?: boolean;
  featured?: boolean;
  sortBy?: string;
  page?: number;
  limit?: number;
}

export interface ProductSearchResult {
  products: IProductDocument[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

class ProductService {
  private readonly CACHE_TTL = 300; // 5 minutes

  async searchProducts(filters: ProductSearchFilters): Promise<ProductSearchResult> {
    const {
      query,
      category,
      minPrice,
      maxPrice,
      brand,
      tags,
      inStock,
      featured,
      sortBy = 'NEWEST',
      page = 1,
      limit = 20
    } = filters;

    try {
      // Build cache key
      const cacheKey = `products:search:${JSON.stringify(filters)}`;
      
      // Try to get from cache first
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        logger.info('Products retrieved from cache', {
          filters,
          action: 'search_products_cached'
        });
        return JSON.parse(cached);
      }

      // Build MongoDB query
      const mongoQuery: any = { status: ProductStatus.ACTIVE };

      if (query) {
        mongoQuery.$text = { $search: query };
      }

      if (category) {
        mongoQuery.category = category;
      }

      if (minPrice !== undefined || maxPrice !== undefined) {
        mongoQuery.price = {};
        if (minPrice !== undefined) mongoQuery.price.$gte = minPrice;
        if (maxPrice !== undefined) mongoQuery.price.$lte = maxPrice;
      }

      if (brand) {
        mongoQuery.brand = new RegExp(brand, 'i');
      }

      if (tags && tags.length > 0) {
        mongoQuery.tags = { $in: tags };
      }

      if (inStock) {
        mongoQuery['inventory.quantity'] = { $gt: 0 };
      }

      if (featured !== undefined) {
        mongoQuery.featured = featured;
      }

      // Build sort criteria
      let sortCriteria: any = {};
      switch (sortBy) {
        case 'PRICE_LOW_HIGH':
          sortCriteria = { price: 1 };
          break;
        case 'PRICE_HIGH_LOW':
          sortCriteria = { price: -1 };
          break;
        case 'RATING':
          sortCriteria = { 'rating.average': -1, 'rating.count': -1 };
          break;
        case 'POPULARITY':
          sortCriteria = { views: -1, salesCount: -1 };
          break;
        case 'NAME_A_Z':
          sortCriteria = { name: 1 };
          break;
        case 'NAME_Z_A':
          sortCriteria = { name: -1 };
          break;
        case 'OLDEST':
          sortCriteria = { createdAt: 1 };
          break;
        default: // NEWEST
          sortCriteria = { createdAt: -1 };
      }

      // Add text score for text search
      if (query) {
        sortCriteria = { score: { $meta: 'textScore' }, ...sortCriteria };
      }

      const skip = (page - 1) * limit;

      // Execute query
      const [products, total] = await Promise.all([
        Product.find(mongoQuery)
          .populate('category', 'name slug')
          .populate('subcategory', 'name slug')
          .sort(sortCriteria)
          .skip(skip)
          .limit(limit)
          .exec(),
        Product.countDocuments(mongoQuery)
      ]);

      const result: ProductSearchResult = {
        products,
        total,
        page,
        limit,
        hasMore: skip + products.length < total
      };

      // Cache the result
      await redisClient.setex(cacheKey, this.CACHE_TTL, JSON.stringify(result));

      logger.info('Products searched successfully', {
        filters,
        resultCount: products.length,
        total,
        action: 'search_products'
      });

      return result;
    } catch (error) {
      logger.error('Product search failed', {
        filters,
        error: error.message,
        action: 'search_products'
      });
      throw error;
    }
  }

  async getProductById(id: string): Promise<IProductDocument | null> {
    try {
      const cacheKey = `product:${id}`;
      
      // Try cache first
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const product = await Product.findById(id)
        .populate('category', 'name slug')
        .populate('subcategory', 'name slug')
        .exec();

      if (product) {
        // Cache the product
        await redisClient.setex(cacheKey, this.CACHE_TTL, JSON.stringify(product));
        
        // Increment views asynchronously
        product.incrementViews().catch(err => 
          logger.error('Failed to increment product views', { productId: id, error: err.message })
        );
      }

      return product;
    } catch (error) {
      logger.error('Failed to get product by ID', {
        productId: id,
        error: error.message,
        action: 'get_product_by_id'
      });
      throw error;
    }
  }

  async getProductBySlug(slug: string): Promise<IProductDocument | null> {
    try {
      const cacheKey = `product:slug:${slug}`;
      
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const product = await Product.findBySlug(slug)
        .populate('category', 'name slug')
        .populate('subcategory', 'name slug')
        .exec();

      if (product) {
        await redisClient.setex(cacheKey, this.CACHE_TTL, JSON.stringify(product));
        
        product.incrementViews().catch(err => 
          logger.error('Failed to increment product views', { slug, error: err.message })
        );
      }

      return product;
    } catch (error) {
      logger.error('Failed to get product by slug', {
        slug,
        error: error.message,
        action: 'get_product_by_slug'
      });
      throw error;
    }
  }

  async getProductBySku(sku: string): Promise<IProductDocument | null> {
    try {
      const product = await Product.findBySku(sku)
        .populate('category', 'name slug')
        .populate('subcategory', 'name slug')
        .exec();

      return product;
    } catch (error) {
      logger.error('Failed to get product by SKU', {
        sku,
        error: error.message,
        action: 'get_product_by_sku'
      });
      throw error;
    }
  }

  async getFeaturedProducts(limit: number = 10): Promise<IProductDocument[]> {
    try {
      const cacheKey = `products:featured:${limit}`;
      
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const products = await Product.findFeatured(limit)
        .populate('category', 'name slug')
        .exec();

      await redisClient.setex(cacheKey, this.CACHE_TTL, JSON.stringify(products));

      return products;
    } catch (error) {
      logger.error('Failed to get featured products', {
        limit,
        error: error.message,
        action: 'get_featured_products'
      });
      throw error;
    }
  }

  async createProduct(productData: any, userId: string): Promise<IProductDocument> {
    try {
      // Validate category exists
      const category = await Category.findById(productData.category);
      if (!category) {
        throw new ValidationError('Category not found');
      }

      // Validate subcategory if provided
      if (productData.subcategory) {
        const subcategory = await Category.findById(productData.subcategory);
        if (!subcategory) {
          throw new ValidationError('Subcategory not found');
        }
      }

      // Check SKU uniqueness
      const existingProduct = await Product.findBySku(productData.sku);
      if (existingProduct) {
        throw new ValidationError('SKU already exists');
      }

      const product = new Product(productData);
      await product.save();

      // Clear related caches
      await this.clearProductCaches();

      logger.info('Product created successfully', {
        productId: product._id,
        sku: product.sku,
        userId,
        action: 'create_product'
      });

      return product;
    } catch (error) {
      logger.error('Failed to create product', {
        productData: { ...productData, costPrice: undefined },
        userId,
        error: error.message,
        action: 'create_product'
      });
      throw error;
    }
  }

  async updateProduct(id: string, updateData: any, userId: string): Promise<IProductDocument> {
    try {
      const product = await Product.findById(id);
      if (!product) {
        throw new NotFoundError('Product not found');
      }

      // Validate category if being updated
      if (updateData.category) {
        const category = await Category.findById(updateData.category);
        if (!category) {
          throw new ValidationError('Category not found');
        }
      }

      // Validate subcategory if being updated
      if (updateData.subcategory) {
        const subcategory = await Category.findById(updateData.subcategory);
        if (!subcategory) {
          throw new ValidationError('Subcategory not found');
        }
      }

      // Check SKU uniqueness if being updated
      if (updateData.sku && updateData.sku !== product.sku) {
        const existingProduct = await Product.findBySku(updateData.sku);
        if (existingProduct) {
          throw new ValidationError('SKU already exists');
        }
      }

      Object.assign(product, updateData);
      await product.save();

      // Clear caches
      await this.clearProductCaches(id);

      logger.info('Product updated successfully', {
        productId: id,
        userId,
        action: 'update_product'
      });

      return product;
    } catch (error) {
      logger.error('Failed to update product', {
        productId: id,
        userId,
        error: error.message,
        action: 'update_product'
      });
      throw error;
    }
  }

  async deleteProduct(id: string, userId: string): Promise<boolean> {
    try {
      const product = await Product.findById(id);
      if (!product) {
        throw new NotFoundError('Product not found');
      }

      await Product.findByIdAndDelete(id);

      // Clear caches
      await this.clearProductCaches(id);

      logger.info('Product deleted successfully', {
        productId: id,
        userId,
        action: 'delete_product'
      });

      return true;
    } catch (error) {
      logger.error('Failed to delete product', {
        productId: id,
        userId,
        error: error.message,
        action: 'delete_product'
      });
      throw error;
    }
  }

  async updateInventory(id: string, quantity: number, userId: string): Promise<IProductDocument> {
    try {
      const product = await Product.findById(id);
      if (!product) {
        throw new NotFoundError('Product not found');
      }

      await product.updateInventory(quantity);

      // Clear caches
      await this.clearProductCaches(id);

      logger.info('Product inventory updated', {
        productId: id,
        quantity,
        newQuantity: product.inventory.quantity,
        userId,
        action: 'update_inventory'
      });

      return product;
    } catch (error) {
      logger.error('Failed to update product inventory', {
        productId: id,
        quantity,
        userId,
        error: error.message,
        action: 'update_inventory'
      });
      throw error;
    }
  }

  private async clearProductCaches(productId?: string): Promise<void> {
    try {
      const patterns = [
        'products:search:*',
        'products:featured:*'
      ];

      if (productId) {
        patterns.push(`product:${productId}`);
        patterns.push('product:slug:*');
      }

      for (const pattern of patterns) {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
          await redisClient.del(...keys);
        }
      }
    } catch (error) {
      logger.error('Failed to clear product caches', {
        productId,
        error: error.message,
        action: 'clear_product_caches'
      });
    }
  }
}

export const productService = new ProductService();
