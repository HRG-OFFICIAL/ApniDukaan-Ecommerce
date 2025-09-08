import { Category, ICategory } from '../models/Category';
import { Product } from '../models/Product';
import { logger } from '@shopsphere/shared';

export interface CategoryFilters {
  parent?: string;
  level?: number;
  isActive?: boolean;
  search?: string;
}

export class CategoryService {
  async createCategory(categoryData: Partial<ICategory>): Promise<ICategory> {
    try {
      const category = new Category(categoryData);
      await category.save();

      // Update parent's children array
      if (category.parent) {
        await Category.findByIdAndUpdate(
          category.parent,
          { $addToSet: { children: category._id } }
        );
      }

      logger.info('Category created successfully', {
        categoryId: category._id,
        slug: category.slug,
        action: 'category_created'
      });

      return category;
    } catch (error: any) {
      logger.error('Failed to create category', {
        error: error.message,
        categoryData,
        action: 'category_creation_failed'
      });
      throw error;
    }
  }

  async getCategoryById(id: string): Promise<ICategory | null> {
    try {
      const category = await Category.findById(id)
        .populate('parent', 'name slug')
        .populate('children', 'name slug isActive');

      return category;
    } catch (error: any) {
      logger.error('Failed to get category by ID', {
        error: error.message,
        categoryId: id,
        action: 'get_category_failed'
      });
      throw error;
    }
  }

  async getCategoryBySlug(slug: string): Promise<ICategory | null> {
    try {
      const category = await Category.findOne({ slug })
        .populate('parent', 'name slug')
        .populate('children', 'name slug isActive');

      return category;
    } catch (error: any) {
      logger.error('Failed to get category by slug', {
        error: error.message,
        slug,
        action: 'get_category_by_slug_failed'
      });
      throw error;
    }
  }

  async getCategories(
    filters: CategoryFilters = {},
    page: number = 1,
    limit: number = 50
  ): Promise<{ categories: ICategory[]; total: number; pages: number }> {
    try {
      const query: any = {};

      // Apply filters
      if (filters.parent !== undefined) {
        if (filters.parent === null) {
          query.parent = null;
        } else {
          query.parent = filters.parent;
        }
      }
      if (filters.level !== undefined) {
        query.level = filters.level;
      }
      if (filters.isActive !== undefined) {
        query.isActive = filters.isActive;
      }
      if (filters.search) {
        query.$or = [
          { name: new RegExp(filters.search, 'i') },
          { description: new RegExp(filters.search, 'i') }
        ];
      }

      // Execute query
      const skip = (page - 1) * limit;
      const [categories, total] = await Promise.all([
        Category.find(query)
          .populate('parent', 'name slug')
          .populate('children', 'name slug isActive')
          .sort({ sortOrder: 1, name: 1 })
          .skip(skip)
          .limit(limit),
        Category.countDocuments(query)
      ]);

      const pages = Math.ceil(total / limit);

      return { categories, total, pages };
    } catch (error: any) {
      logger.error('Failed to get categories', {
        error: error.message,
        filters,
        page,
        limit,
        action: 'get_categories_failed'
      });
      throw error;
    }
  }

  async getCategoryTree(): Promise<ICategory[]> {
    try {
      const categories = await Category.find({ isActive: true })
        .populate('parent', 'name slug')
        .populate('children', 'name slug isActive')
        .sort({ level: 1, sortOrder: 1, name: 1 });

      return categories;
    } catch (error: any) {
      logger.error('Failed to get category tree', {
        error: error.message,
        action: 'get_category_tree_failed'
      });
      throw error;
    }
  }

  async updateCategory(id: string, updateData: Partial<ICategory>): Promise<ICategory | null> {
    try {
      const category = await Category.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).populate('parent', 'name slug')
       .populate('children', 'name slug isActive');

      if (category) {
        logger.info('Category updated successfully', {
          categoryId: id,
          action: 'category_updated'
        });
      }

      return category;
    } catch (error: any) {
      logger.error('Failed to update category', {
        error: error.message,
        categoryId: id,
        updateData,
        action: 'category_update_failed'
      });
      throw error;
    }
  }

  async deleteCategory(id: string): Promise<boolean> {
    try {
      const category = await Category.findById(id);
      if (!category) return false;

      // Check if category has children
      if (category.children.length > 0) {
        throw new Error('Cannot delete category with children');
      }

      // Check if category has products
      const productCount = await Product.countDocuments({ category: id });
      if (productCount > 0) {
        throw new Error('Cannot delete category with products');
      }

      // Remove from parent's children array
      if (category.parent) {
        await Category.findByIdAndUpdate(
          category.parent,
          { $pull: { children: id } }
        );
      }

      await Category.findByIdAndDelete(id);

      logger.info('Category deleted successfully', {
        categoryId: id,
        action: 'category_deleted'
      });

      return true;
    } catch (error: any) {
      logger.error('Failed to delete category', {
        error: error.message,
        categoryId: id,
        action: 'category_deletion_failed'
      });
      throw error;
    }
  }

  async getCategoryWithProducts(
    categoryId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ category: ICategory | null; products: any[]; total: number; pages: number }> {
    try {
      const category = await Category.findById(categoryId)
        .populate('parent', 'name slug')
        .populate('children', 'name slug isActive');

      if (!category) {
        return { category: null, products: [], total: 0, pages: 0 };
      }

      const skip = (page - 1) * limit;
      const [products, total] = await Promise.all([
        Product.find({ category: categoryId, status: 'published' })
          .populate('category', 'name slug')
          .populate('subcategory', 'name slug')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Product.countDocuments({ category: categoryId, status: 'published' })
      ]);

      const pages = Math.ceil(total / limit);

      return { category, products, total, pages };
    } catch (error: any) {
      logger.error('Failed to get category with products', {
        error: error.message,
        categoryId,
        page,
        limit,
        action: 'get_category_with_products_failed'
      });
      throw error;
    }
  }

  async getPopularCategories(limit: number = 10): Promise<any[]> {
    try {
      const popularCategories = await Product.aggregate([
        { $match: { status: 'published' } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: limit },
        {
          $lookup: {
            from: 'categories',
            localField: '_id',
            foreignField: '_id',
            as: 'category'
          }
        },
        { $unwind: '$category' },
        { $project: { _id: 1, name: '$category.name', slug: '$category.slug', productCount: '$count' } }
      ]);

      return popularCategories;
    } catch (error: any) {
      logger.error('Failed to get popular categories', {
        error: error.message,
        limit,
        action: 'get_popular_categories_failed'
      });
      throw error;
    }
  }
}
