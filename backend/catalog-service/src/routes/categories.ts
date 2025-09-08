import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { CategoryService } from '../services/categoryService';
import { logger } from '@shopsphere/shared';

const router = express.Router();
const categoryService = new CategoryService();

// Validation middleware
const handleValidationErrors = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// GET /api/categories - Get all categories
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('parent').optional().isMongoId().withMessage('Parent must be a valid MongoDB ID'),
  query('level').optional().isInt({ min: 0 }).withMessage('Level must be a non-negative integer'),
  query('isActive').optional().isBoolean().withMessage('IsActive must be a boolean'),
  query('search').optional().isString().withMessage('Search must be a string'),
  handleValidationErrors
], async (req: express.Request, res: express.Response) => {
  try {
    const {
      page = 1,
      limit = 50,
      parent,
      level,
      isActive,
      search
    } = req.query;

    const filters = {
      parent: parent as string,
      level: level ? parseInt(level as string) : undefined,
      isActive: isActive ? isActive === 'true' : undefined,
      search: search as string
    };

    const result = await categoryService.getCategories(
      filters,
      parseInt(page as string),
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: result.categories,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: result.total,
        pages: result.pages
      }
    });
  } catch (error: any) {
    logger.error('Failed to get categories', {
      error: error.message,
      query: req.query,
      action: 'get_categories_api_failed'
    });
    res.status(500).json({
      success: false,
      message: 'Failed to get categories',
      error: error.message
    });
  }
});

// GET /api/categories/tree - Get category tree
router.get('/tree', async (req: express.Request, res: express.Response) => {
  try {
    const categories = await categoryService.getCategoryTree();

    res.json({
      success: true,
      data: categories
    });
  } catch (error: any) {
    logger.error('Failed to get category tree', {
      error: error.message,
      action: 'get_category_tree_api_failed'
    });
    res.status(500).json({
      success: false,
      message: 'Failed to get category tree',
      error: error.message
    });
  }
});

// GET /api/categories/popular - Get popular categories
router.get('/popular', [
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  handleValidationErrors
], async (req: express.Request, res: express.Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const categories = await categoryService.getPopularCategories(limit);

    res.json({
      success: true,
      data: categories
    });
  } catch (error: any) {
    logger.error('Failed to get popular categories', {
      error: error.message,
      query: req.query,
      action: 'get_popular_categories_api_failed'
    });
    res.status(500).json({
      success: false,
      message: 'Failed to get popular categories',
      error: error.message
    });
  }
});

// GET /api/categories/:id - Get category by ID
router.get('/:id', [
  param('id').isMongoId().withMessage('Category ID must be a valid MongoDB ID'),
  handleValidationErrors
], async (req: express.Request, res: express.Response) => {
  try {
    const category = await categoryService.getCategoryById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error: any) {
    logger.error('Failed to get category by ID', {
      error: error.message,
      categoryId: req.params.id,
      action: 'get_category_by_id_api_failed'
    });
    res.status(500).json({
      success: false,
      message: 'Failed to get category',
      error: error.message
    });
  }
});

// GET /api/categories/slug/:slug - Get category by slug
router.get('/slug/:slug', [
  param('slug').isSlug().withMessage('Slug must be a valid slug'),
  handleValidationErrors
], async (req: express.Request, res: express.Response) => {
  try {
    const category = await categoryService.getCategoryBySlug(req.params.slug);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error: any) {
    logger.error('Failed to get category by slug', {
      error: error.message,
      slug: req.params.slug,
      action: 'get_category_by_slug_api_failed'
    });
    res.status(500).json({
      success: false,
      message: 'Failed to get category',
      error: error.message
    });
  }
});

// GET /api/categories/:id/products - Get category with products
router.get('/:id/products', [
  param('id').isMongoId().withMessage('Category ID must be a valid MongoDB ID'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
], async (req: express.Request, res: express.Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await categoryService.getCategoryWithProducts(
      req.params.id,
      page,
      limit
    );

    if (!result.category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: {
        category: result.category,
        products: result.products,
        pagination: {
          page,
          limit,
          total: result.total,
          pages: result.pages
        }
      }
    });
  } catch (error: any) {
    logger.error('Failed to get category with products', {
      error: error.message,
      categoryId: req.params.id,
      query: req.query,
      action: 'get_category_with_products_api_failed'
    });
    res.status(500).json({
      success: false,
      message: 'Failed to get category with products',
      error: error.message
    });
  }
});

// POST /api/categories - Create new category
router.post('/', [
  body('name').notEmpty().withMessage('Category name is required'),
  body('slug').isSlug().withMessage('Slug must be a valid slug'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('parent').optional().isMongoId().withMessage('Parent must be a valid MongoDB ID'),
  body('isActive').optional().isBoolean().withMessage('IsActive must be a boolean'),
  body('sortOrder').optional().isInt().withMessage('Sort order must be an integer'),
  handleValidationErrors
], async (req: express.Request, res: express.Response) => {
  try {
    const category = await categoryService.createCategory(req.body);

    res.status(201).json({
      success: true,
      data: category,
      message: 'Category created successfully'
    });
  } catch (error: any) {
    logger.error('Failed to create category', {
      error: error.message,
      categoryData: req.body,
      action: 'create_category_api_failed'
    });
    res.status(500).json({
      success: false,
      message: 'Failed to create category',
      error: error.message
    });
  }
});

// PUT /api/categories/:id - Update category
router.put('/:id', [
  param('id').isMongoId().withMessage('Category ID must be a valid MongoDB ID'),
  body('name').optional().notEmpty().withMessage('Category name cannot be empty'),
  body('slug').optional().isSlug().withMessage('Slug must be a valid slug'),
  body('isActive').optional().isBoolean().withMessage('IsActive must be a boolean'),
  body('sortOrder').optional().isInt().withMessage('Sort order must be an integer'),
  handleValidationErrors
], async (req: express.Request, res: express.Response) => {
  try {
    const category = await categoryService.updateCategory(req.params.id, req.body);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: category,
      message: 'Category updated successfully'
    });
  } catch (error: any) {
    logger.error('Failed to update category', {
      error: error.message,
      categoryId: req.params.id,
      updateData: req.body,
      action: 'update_category_api_failed'
    });
    res.status(500).json({
      success: false,
      message: 'Failed to update category',
      error: error.message
    });
  }
});

// DELETE /api/categories/:id - Delete category
router.delete('/:id', [
  param('id').isMongoId().withMessage('Category ID must be a valid MongoDB ID'),
  handleValidationErrors
], async (req: express.Request, res: express.Response) => {
  try {
    const deleted = await categoryService.deleteCategory(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error: any) {
    logger.error('Failed to delete category', {
      error: error.message,
      categoryId: req.params.id,
      action: 'delete_category_api_failed'
    });
    
    const statusCode = error.message.includes('children') || error.message.includes('products') ? 400 : 500;
    
    res.status(statusCode).json({
      success: false,
      message: 'Failed to delete category',
      error: error.message
    });
  }
});

export default router;
