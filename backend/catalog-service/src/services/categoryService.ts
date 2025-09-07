import { Category, ICategoryDocument } from '../models/Category';
import { Product } from '../models/Product';
import { logger, ValidationError, NotFoundError, ConflictError } from '@shopsphere/shared';
import { redisClient } from '@shopsphere/shared';

class CategoryService {
  private readonly CACHE_TTL = 600; // 10 minutes

  async getAllCategories(): Promise<ICategoryDocument[]> {
    try {
      const cacheKey = 'categories:all';
      
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const categories = await Category.find({ isActive: true })
        .populate('parent', 'name slug')
        .sort({ level: 1, sortOrder: 1, name: 1 })
        .exec();

      await redisClient.setex(cacheKey, this.CACHE_TTL, JSON.stringify(categories));

      return categories;
    } catch (error) {
      logger.error('Failed to get all categories', {
        error: error.message,
        action: 'get_all_categories'
      });
      throw error;
    }
  }

  async getCategoryById(id: string): Promise<ICategoryDocument | null> {
    try {
      const cacheKey = `category:${id}`;
      
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const category = await Category.findById(id)
        .populate('parent', 'name slug')
        .exec();

      if (category) {
        await redisClient.setex(cacheKey, this.CACHE_TTL, JSON.stringify(category));
      }

      return category;
    } catch (error) {
      logger.error('Failed to get category by ID', {
        categoryId: id,
        error: error.message,
        action: 'get_category_by_id'
      });
      throw error;
    }
  }

  async getCategoryBySlug(slug: string): Promise<ICategoryDocument | null> {
    try {
      const cacheKey = `category:slug:${slug}`;
      
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const category = await Category.findBySlug(slug)
        .populate('parent', 'name slug')
        .exec();

      if (category) {
        await redisClient.setex(cacheKey, this.CACHE_TTL, JSON.stringify(category));
      }

      return category;
    } catch (error) {
      logger.error('Failed to get category by slug', {
        slug,
        error: error.message,
        action: 'get_category_by_slug'
      });
      throw error;
    }
  }

  async getCategoryTree(): Promise<any[]> {
    try {
      const cacheKey = 'categories:tree';
      
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const tree = await Category.buildTree();
      
      await redisClient.setex(cacheKey, this.CACHE_TTL, JSON.stringify(tree));

      return tree;
    } catch (error) {
      logger.error('Failed to get category tree', {
        error: error.message,
        action: 'get_category_tree'
      });
      throw error;
    }
  }

  async getFeaturedCategories(limit: number = 10): Promise<ICategoryDocument[]> {
    try {
      const cacheKey = `categories:featured:${limit}`;
      
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const categories = await Category.findFeatured(limit)
        .populate('parent', 'name slug')
        .exec();

      await redisClient.setex(cacheKey, this.CACHE_TTL, JSON.stringify(categories));

      return categories;
    } catch (error) {
      logger.error('Failed to get featured categories', {
        limit,
        error: error.message,
        action: 'get_featured_categories'
      });
      throw error;
    }
  }

  async getCategoryChildren(categoryId: string): Promise<ICategoryDocument[]> {
    try {
      const category = await Category.findById(categoryId);
      if (!category) {
        throw new NotFoundError('Category not found');
      }

      return await category.getChildren();
    } catch (error) {
      logger.error('Failed to get category children', {
        categoryId,
        error: error.message,
        action: 'get_category_children'
      });
      throw error;
    }
  }

  async createCategory(categoryData: any, userId: string): Promise<ICategoryDocument> {
    try {
      // Check slug uniqueness
      if (categoryData.slug) {
        const existingCategory = await Category.findBySlug(categoryData.slug);
        if (existingCategory) {
          throw new ConflictError('Category slug already exists');
        }
      }

      // Validate parent category if provided
      if (categoryData.parent) {
        const parentCategory = await Category.findById(categoryData.parent);
        if (!parentCategory) {
          throw new ValidationError('Parent category not found');
        }
        
        // Check depth limit (max 5 levels)
        if (parentCategory.level >= 4) {
          throw new ValidationError('Maximum category depth exceeded');
        }
      }

      const category = new Category(categoryData);
      await category.save();

      // Clear caches
      await this.clearCategoryCaches();

      logger.info('Category created successfully', {
        categoryId: category._id,
        name: category.name,
        userId,
        action: 'create_category'
      });

      return category;
    } catch (error) {
      logger.error('Failed to create category', {
        categoryData,
        userId,
        error: error.message,
        action: 'create_category'
      });
      throw error;
    }
  }

  async updateCategory(id: string, updateData: any, userId: string): Promise<ICategoryDocument> {
    try {
      const category = await Category.findById(id);
      if (!category) {
        throw new NotFoundError('Category not found');
      }

      // Check slug uniqueness if being updated
      if (updateData.slug && updateData.slug !== category.slug) {
        const existingCategory = await Category.findBySlug(updateData.slug);
        if (existingCategory) {
          throw new ConflictError('Category slug already exists');
        }
      }

      // Validate parent category if being updated
      if (updateData.parent && updateData.parent !== category.parent?.toString()) {
        const parentCategory = await Category.findById(updateData.parent);
        if (!parentCategory) {
          throw new ValidationError('Parent category not found');
        }
        
        // Prevent circular reference
        if (parentCategory.path.includes(id)) {
          throw new ValidationError('Cannot set child category as parent');
        }
        
        // Check depth limit
        if (parentCategory.level >= 4) {
          throw new ValidationError('Maximum category depth exceeded');
        }
      }

      Object.assign(category, updateData);
      await category.save();

      // Update product counts for affected categories
      await this.updateProductCounts([id]);

      // Clear caches
      await this.clearCategoryCaches();

      logger.info('Category updated successfully', {
        categoryId: id,
        userId,
        action: 'update_category'
      });

      return category;
    } catch (error) {
      logger.error('Failed to update category', {
        categoryId: id,
        userId,
        error: error.message,
        action: 'update_category'
      });
      throw error;
    }
  }

  async deleteCategory(id: string, userId: string): Promise<boolean> {
    try {
      const category = await Category.findById(id);
      if (!category) {
        throw new NotFoundError('Category not found');
      }

      // Check if category has products
      const productCount = await Product.countDocuments({ category: id });
      if (productCount > 0) {
        throw new ValidationError('Cannot delete category with products');
      }

      // Check if category has children
      const children = await category.getChildren();
      if (children.length > 0) {
        throw new ValidationError('Cannot delete category with subcategories');
      }

      await Category.findByIdAndDelete(id);

      // Clear caches
      await this.clearCategoryCaches();

      logger.info('Category deleted successfully', {
        categoryId: id,
        userId,
        action: 'delete_category'
      });

      return true;
    } catch (error) {
      logger.error('Failed to delete category', {
        categoryId: id,
        userId,
        error: error.message,
        action: 'delete_category'
      });
      throw error;
    }
  }

  async updateProductCounts(categoryIds?: string[]): Promise<void> {
    try {
      let categories: ICategoryDocument[];
      
      if (categoryIds) {
        categories = await Category.find({ _id: { $in: categoryIds } });
      } else {
        categories = await Category.find();
      }

      for (const category of categories) {
        const productCount = await category.getProductCount();
        await Category.findByIdAndUpdate(category._id, { productCount });
      }

      logger.info('Product counts updated', {
        categoryCount: categories.length,
        action: 'update_product_counts'
      });
    } catch (error) {
      logger.error('Failed to update product counts', {
        categoryIds,
        error: error.message,
        action: 'update_product_counts'
      });
    }
  }

  private async clearCategoryCaches(): Promise<void> {
    try {
      const patterns = [
        'categories:*',
        'category:*'
      ];

      for (const pattern of patterns) {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
          await redisClient.del(...keys);
        }
      }
    } catch (error) {
      logger.error('Failed to clear category caches', {
        error: error.message,
        action: 'clear_category_caches'
      });
    }
  }
}

export const categoryService = new CategoryService();
