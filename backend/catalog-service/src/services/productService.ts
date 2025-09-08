import { Product, IProduct } from '../models/Product';
import { Category } from '../models/Category';
import { Review } from '../models/Review';
import { logger } from '@shopsphere/shared';

export interface ProductFilters {
  category?: string;
  subcategory?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
  status?: string;
  featured?: boolean;
  search?: string;
}

export interface ProductSortOptions {
  field: 'name' | 'price' | 'rating' | 'createdAt' | 'sales';
  order: 'asc' | 'desc';
}

export class ProductService {
  async createProduct(productData: Partial<IProduct>): Promise<IProduct> {
    try {
      const product = new Product(productData);
      await product.save();
      
      logger.info('Product created successfully', {
        productId: product._id,
        sku: product.sku,
        action: 'product_created'
      });
      
      return product;
    } catch (error: any) {
      logger.error('Failed to create product', {
        error: error.message,
        productData,
        action: 'product_creation_failed'
      });
      throw error;
    }
  }

  async getProductById(id: string): Promise<IProduct | null> {
    try {
      const product = await Product.findById(id)
        .populate('category', 'name slug')
        .populate('subcategory', 'name slug');
      
      return product;
    } catch (error: any) {
      logger.error('Failed to get product by ID', {
        error: error.message,
        productId: id,
        action: 'get_product_failed'
      });
      throw error;
    }
  }

  async getProductBySlug(slug: string): Promise<IProduct | null> {
    try {
      const product = await Product.findOne({ slug })
        .populate('category', 'name slug')
        .populate('subcategory', 'name slug');
      
      return product;
    } catch (error: any) {
      logger.error('Failed to get product by slug', {
        error: error.message,
        slug,
        action: 'get_product_by_slug_failed'
      });
      throw error;
    }
  }

  async getProducts(
    filters: ProductFilters = {},
    sort: ProductSortOptions = { field: 'createdAt', order: 'desc' },
    page: number = 1,
    limit: number = 20
  ): Promise<{ products: IProduct[]; total: number; pages: number }> {
    try {
      const query: any = {};

      // Apply filters
      if (filters.category) {
        query.category = filters.category;
      }
      if (filters.subcategory) {
        query.subcategory = filters.subcategory;
      }
      if (filters.brand) {
        query.brand = new RegExp(filters.brand, 'i');
      }
      if (filters.minPrice || filters.maxPrice) {
        query.price = {};
        if (filters.minPrice) query.price.$gte = filters.minPrice;
        if (filters.maxPrice) query.price.$lte = filters.maxPrice;
      }
      if (filters.tags && filters.tags.length > 0) {
        query.tags = { $in: filters.tags };
      }
      if (filters.status) {
        query.status = filters.status;
      }
      if (filters.featured !== undefined) {
        query.featured = filters.featured;
      }
      if (filters.search) {
        query.$text = { $search: filters.search };
      }

      // Build sort object
      const sortObj: any = {};
      sortObj[sort.field] = sort.order === 'asc' ? 1 : -1;

      // Execute query
      const skip = (page - 1) * limit;
      const [products, total] = await Promise.all([
        Product.find(query)
          .populate('category', 'name slug')
          .populate('subcategory', 'name slug')
          .sort(sortObj)
          .skip(skip)
          .limit(limit),
        Product.countDocuments(query)
      ]);

      const pages = Math.ceil(total / limit);

      return { products, total, pages };
    } catch (error: any) {
      logger.error('Failed to get products', {
        error: error.message,
        filters,
        sort,
        page,
        limit,
        action: 'get_products_failed'
      });
      throw error;
    }
  }

  async updateProduct(id: string, updateData: Partial<IProduct>): Promise<IProduct | null> {
    try {
      const product = await Product.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).populate('category', 'name slug')
       .populate('subcategory', 'name slug');

      if (product) {
        logger.info('Product updated successfully', {
          productId: id,
          action: 'product_updated'
        });
      }

      return product;
    } catch (error: any) {
      logger.error('Failed to update product', {
        error: error.message,
        productId: id,
        updateData,
        action: 'product_update_failed'
      });
      throw error;
    }
  }

  async deleteProduct(id: string): Promise<boolean> {
    try {
      const result = await Product.findByIdAndDelete(id);
      
      if (result) {
        // Also delete related reviews
        await Review.deleteMany({ product: id });
        
        logger.info('Product deleted successfully', {
          productId: id,
          action: 'product_deleted'
        });
        return true;
      }
      
      return false;
    } catch (error: any) {
      logger.error('Failed to delete product', {
        error: error.message,
        productId: id,
        action: 'product_deletion_failed'
      });
      throw error;
    }
  }

  async getFeaturedProducts(limit: number = 10): Promise<IProduct[]> {
    try {
      const products = await Product.find({
        featured: true,
        status: 'published'
      })
        .populate('category', 'name slug')
        .populate('subcategory', 'name slug')
        .sort({ createdAt: -1 })
        .limit(limit);

      return products;
    } catch (error: any) {
      logger.error('Failed to get featured products', {
        error: error.message,
        limit,
        action: 'get_featured_products_failed'
      });
      throw error;
    }
  }

  async getRelatedProducts(productId: string, limit: number = 5): Promise<IProduct[]> {
    try {
      const product = await Product.findById(productId);
      if (!product) return [];

      const relatedProducts = await Product.find({
        _id: { $ne: productId },
        category: product.category,
        status: 'published'
      })
        .populate('category', 'name slug')
        .limit(limit);

      return relatedProducts;
    } catch (error: any) {
      logger.error('Failed to get related products', {
        error: error.message,
        productId,
        limit,
        action: 'get_related_products_failed'
      });
      throw error;
    }
  }

  async updateProductRating(productId: string): Promise<void> {
    try {
      const reviews = await Review.find({
        product: productId,
        status: 'approved'
      });

      if (reviews.length === 0) return;

      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / reviews.length;

      await Product.findByIdAndUpdate(productId, {
        'rating.average': Math.round(averageRating * 10) / 10,
        'rating.count': reviews.length
      });

      logger.info('Product rating updated', {
        productId,
        averageRating,
        reviewCount: reviews.length,
        action: 'product_rating_updated'
      });
    } catch (error: any) {
      logger.error('Failed to update product rating', {
        error: error.message,
        productId,
        action: 'product_rating_update_failed'
      });
      throw error;
    }
  }

  async updateInventory(productId: string, quantity: number): Promise<IProduct | null> {
    try {
      const product = await Product.findByIdAndUpdate(
        productId,
        { 'inventory.quantity': quantity },
        { new: true }
      );

      if (product) {
        logger.info('Product inventory updated', {
          productId,
          quantity,
          action: 'inventory_updated'
        });
      }

      return product;
    } catch (error: any) {
      logger.error('Failed to update product inventory', {
        error: error.message,
        productId,
        quantity,
        action: 'inventory_update_failed'
      });
      throw error;
    }
  }
}
