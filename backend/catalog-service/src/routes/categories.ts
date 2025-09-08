import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authenticate, authorize } from '@shopsphere/shared';
import { CategoryModel } from '../models/Category';
import { ProductModel } from '../models/Product';
import { logger } from '@shopsphere/shared';

const router = express.Router();

// Validation rules
const createCategoryValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Category name is required and must be less than 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('parent')
    .optional()
    .isMongoId()
    .withMessage('Parent category must be a valid ID')
];

const updateCategoryValidation = [
  param('id')
    .isMongoId()
    .withMessage('Category ID must be valid'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Category name must be less than 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters')
];

/**
 * @route GET /categories
 * @desc Get all categories with optional tree structure
 * @access Public
 */
router.get('/',
  query('tree').optional().isBoolean().withMessage('Tree must be boolean'),
  query('includeProductCount').optional().isBoolean().withMessage('includeProductCount must be boolean'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const tree = req.query.tree === 'true';
      const includeProductCount = req.query.includeProductCount === 'true';

      if (tree) {
        // Return hierarchical tree structure
        const categories = await CategoryModel.buildTree();
        
        if (includeProductCount) {
          await CategoryModel.populateProductCounts(categories);
        }

        res.json({
          success: true,
          data: { categories }
        });
      } else {
        // Return flat list of categories
        const categories = await CategoryModel.find({ active: true })
          .populate('parent', 'name slug')
          .sort({ level: 1, order: 1, name: 1 })
          .lean();

        if (includeProductCount) {
          for (const category of categories) {
            const productCount = await ProductModel.countDocuments({ 
              category: category._id,
              status: 'active'
            });
            (category as any).productCount = productCount;
          }
        }

        res.json({
          success: true,
          data: { categories }
        });
      }

    } catch (error) {
      logger.error('Error fetching categories:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch categories',
        code: 'FETCH_CATEGORIES_ERROR'
      });
    }
  }
);

/**
 * @route GET /categories/:id
 * @desc Get single category by ID
 * @access Public
 */
router.get('/:id',
  param('id').isMongoId().withMessage('Category ID must be valid'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const category = await CategoryModel.findById(req.params.id)
        .populate('parent', 'name slug')
        .lean();

      if (!category) {
        return res.status(404).json({
          success: false,
          error: 'Category not found',
          code: 'CATEGORY_NOT_FOUND'
        });
      }

      // Get product count for this category
      const productCount = await ProductModel.countDocuments({ 
        category: category._id,
        status: 'active'
      });

      res.json({
        success: true,
        data: { 
          category: {
            ...category,
            productCount
          }
        }
      });

    } catch (error) {
      logger.error('Error fetching category:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch category',
        code: 'FETCH_CATEGORY_ERROR'
      });
    }
  }
);

/**
 * @route GET /categories/slug/:slug
 * @desc Get single category by slug
 * @access Public
 */
router.get('/slug/:slug',
  param('slug').notEmpty().withMessage('Category slug is required'),
  async (req, res) => {
    try {
      const category = await CategoryModel.findOne({ 
        slug: req.params.slug,
        active: true
      })
      .populate('parent', 'name slug')
      .lean();

      if (!category) {
        return res.status(404).json({
          success: false,
          error: 'Category not found',
          code: 'CATEGORY_NOT_FOUND'
        });
      }

      // Get product count for this category
      const productCount = await ProductModel.countDocuments({ 
        category: category._id,
        status: 'active'
      });

      // Get breadcrumb
      const breadcrumb = await CategoryModel.getBreadcrumb(category._id);

      res.json({
        success: true,
        data: { 
          category: {
            ...category,
            productCount,
            breadcrumb
          }
        }
      });

    } catch (error) {
      logger.error('Error fetching category by slug:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch category',
        code: 'FETCH_CATEGORY_ERROR'
      });
    }
  }
);

/**
 * @route POST /categories
 * @desc Create new category
 * @access Admin/Moderator
 */
router.post('/',
  authenticate,
  authorize({ roles: ['admin', 'moderator'] }),
  createCategoryValidation,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      // Check if parent category exists (if specified)
      if (req.body.parent) {
        const parentCategory = await CategoryModel.findById(req.body.parent);
        if (!parentCategory) {
          return res.status(400).json({
            success: false,
            error: 'Parent category not found',
            code: 'PARENT_NOT_FOUND'
          });
        }
      }

      // Check for duplicate name at the same level
      const existingCategory = await CategoryModel.findOne({
        name: req.body.name,
        parent: req.body.parent || null
      });

      if (existingCategory) {
        return res.status(409).json({
          success: false,
          error: 'Category with this name already exists at this level',
          code: 'DUPLICATE_NAME'
        });
      }

      // Create category
      const category = new CategoryModel({
        ...req.body,
        createdBy: req.user!.userId,
        updatedBy: req.user!.userId
      });

      await category.save();

      logger.info('Category created', {
        categoryId: category._id,
        name: category.name,
        createdBy: req.user!.userId,
        action: 'create_category'
      });

      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: { category }
      });

    } catch (error) {
      logger.error('Error creating category:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create category',
        code: 'CREATE_CATEGORY_ERROR'
      });
    }
  }
);

/**
 * @route PUT /categories/:id
 * @desc Update category
 * @access Admin/Moderator
 */
router.put('/:id',
  authenticate,
  authorize({ roles: ['admin', 'moderator'] }),
  updateCategoryValidation,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const category = await CategoryModel.findById(req.params.id);
      if (!category) {
        return res.status(404).json({
          success: false,
          error: 'Category not found',
          code: 'CATEGORY_NOT_FOUND'
        });
      }

      // Check if parent category exists (if being updated)
      if (req.body.parent) {
        const parentCategory = await CategoryModel.findById(req.body.parent);
        if (!parentCategory) {
          return res.status(400).json({
            success: false,
            error: 'Parent category not found',
            code: 'PARENT_NOT_FOUND'
          });
        }

        // Prevent circular references
        if (req.body.parent === req.params.id) {
          return res.status(400).json({
            success: false,
            error: 'Category cannot be its own parent',
            code: 'CIRCULAR_REFERENCE'
          });
        }
      }

      // Check for duplicate name (if being updated)
      if (req.body.name && req.body.name !== category.name) {
        const existingCategory = await CategoryModel.findOne({
          name: req.body.name,
          parent: req.body.parent || category.parent,
          _id: { $ne: req.params.id }
        });

        if (existingCategory) {
          return res.status(409).json({
            success: false,
            error: 'Category with this name already exists at this level',
            code: 'DUPLICATE_NAME'
          });
        }
      }

      // Update category
      Object.assign(category, {
        ...req.body,
        updatedBy: req.user!.userId,
        updatedAt: new Date()
      });

      await category.save();

      logger.info('Category updated', {
        categoryId: category._id,
        name: category.name,
        updatedBy: req.user!.userId,
        action: 'update_category'
      });

      res.json({
        success: true,
        message: 'Category updated successfully',
        data: { category }
      });

    } catch (error) {
      logger.error('Error updating category:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update category',
        code: 'UPDATE_CATEGORY_ERROR'
      });
    }
  }
);

/**
 * @route DELETE /categories/:id
 * @desc Delete category
 * @access Admin
 */
router.delete('/:id',
  authenticate,
  authorize({ roles: ['admin'] }),
  param('id').isMongoId().withMessage('Category ID must be valid'),
  async (req, res) => {
    try {
      const category = await CategoryModel.findById(req.params.id);
      if (!category) {
        return res.status(404).json({
          success: false,
          error: 'Category not found',
          code: 'CATEGORY_NOT_FOUND'
        });
      }

      // Check if category has products
      const productCount = await ProductModel.countDocuments({ 
        category: req.params.id,
        status: { $ne: 'deleted' }
      });

      if (productCount > 0) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete category with products. Move or delete products first.',
          code: 'CATEGORY_HAS_PRODUCTS',
          meta: { productCount }
        });
      }

      // Check if category has subcategories
      const subcategoryCount = await CategoryModel.countDocuments({ 
        parent: req.params.id,
        active: true
      });

      if (subcategoryCount > 0) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete category with subcategories. Delete subcategories first.',
          code: 'CATEGORY_HAS_SUBCATEGORIES',
          meta: { subcategoryCount }
        });
      }

      // Soft delete
      category.active = false;
      category.updatedBy = req.user!.userId;
      await category.save();

      logger.info('Category deleted', {
        categoryId: category._id,
        name: category.name,
        deletedBy: req.user!.userId,
        action: 'delete_category'
      });

      res.json({
        success: true,
        message: 'Category deleted successfully'
      });

    } catch (error) {
      logger.error('Error deleting category:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete category',
        code: 'DELETE_CATEGORY_ERROR'
      });
    }
  }
);

/**
 * @route GET /categories/:id/children
 * @desc Get child categories
 * @access Public
 */
router.get('/:id/children',
  param('id').isMongoId().withMessage('Category ID must be valid'),
  async (req, res) => {
    try {
      const category = await CategoryModel.findById(req.params.id);
      if (!category) {
        return res.status(404).json({
          success: false,
          error: 'Category not found',
          code: 'CATEGORY_NOT_FOUND'
        });
      }

      const children = await CategoryModel.find({ 
        parent: req.params.id,
        active: true
      })
      .sort({ order: 1, name: 1 })
      .lean();

      // Add product counts if requested
      if (req.query.includeProductCount === 'true') {
        for (const child of children) {
          const productCount = await ProductModel.countDocuments({ 
            category: child._id,
            status: 'active'
          });
          (child as any).productCount = productCount;
        }
      }

      res.json({
        success: true,
        data: { categories: children }
      });

    } catch (error) {
      logger.error('Error fetching child categories:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch child categories',
        code: 'FETCH_CHILDREN_ERROR'
      });
    }
  }
);

/**
 * @route GET /categories/:id/breadcrumb
 * @desc Get category breadcrumb
 * @access Public
 */
router.get('/:id/breadcrumb',
  param('id').isMongoId().withMessage('Category ID must be valid'),
  async (req, res) => {
    try {
      const category = await CategoryModel.findById(req.params.id);
      if (!category) {
        return res.status(404).json({
          success: false,
          error: 'Category not found',
          code: 'CATEGORY_NOT_FOUND'
        });
      }

      const breadcrumb = await CategoryModel.getBreadcrumb(req.params.id);

      res.json({
        success: true,
        data: { breadcrumb }
      });

    } catch (error) {
      logger.error('Error fetching category breadcrumb:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch category breadcrumb',
        code: 'FETCH_BREADCRUMB_ERROR'
      });
    }
  }
);

/**
 * @route GET /categories/:id/products
 * @desc Get products in category
 * @access Public
 */
router.get('/:id/products',
  [
    param('id').isMongoId().withMessage('Category ID must be valid'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
    query('includeSubcategories').optional().isBoolean().withMessage('includeSubcategories must be boolean')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const category = await CategoryModel.findById(req.params.id);
      if (!category) {
        return res.status(404).json({
          success: false,
          error: 'Category not found',
          code: 'CATEGORY_NOT_FOUND'
        });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 12;
      const skip = (page - 1) * limit;
      const includeSubcategories = req.query.includeSubcategories === 'true';

      let categoryFilter: any = { category: req.params.id };

      if (includeSubcategories) {
        const subcategories = await CategoryModel.find({ 
          parent: req.params.id,
          active: true
        }).select('_id');
        
        const subcategoryIds = subcategories.map(sub => sub._id);
        categoryFilter = { 
          category: { $in: [req.params.id, ...subcategoryIds] }
        };
      }

      const filter = {
        ...categoryFilter,
        status: 'active'
      };

      // Build sort
      let sort: any = { createdAt: -1 };
      switch (req.query.sort) {
        case 'price_asc':
          sort = { price: 1 };
          break;
        case 'price_desc':
          sort = { price: -1 };
          break;
        case 'name_asc':
          sort = { name: 1 };
          break;
        case 'rating_desc':
          sort = { averageRating: -1 };
          break;
        case 'popularity':
          sort = { reviewCount: -1, averageRating: -1 };
          break;
      }

      const [products, total] = await Promise.all([
        ProductModel.find(filter)
          .populate('category', 'name slug')
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        ProductModel.countDocuments(filter)
      ]);

      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        data: {
          products,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        }
      });

    } catch (error) {
      logger.error('Error fetching category products:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch category products',
        code: 'FETCH_CATEGORY_PRODUCTS_ERROR'
      });
    }
  }
);

/**
 * @route PATCH /categories/:id/reorder
 * @desc Reorder categories
 * @access Admin/Moderator
 */
router.patch('/:id/reorder',
  authenticate,
  authorize({ roles: ['admin', 'moderator'] }),
  [
    param('id').isMongoId().withMessage('Category ID must be valid'),
    body('order').isInt({ min: 0 }).withMessage('Order must be non-negative integer')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const category = await CategoryModel.findByIdAndUpdate(
        req.params.id,
        {
          order: req.body.order,
          updatedBy: req.user!.userId,
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!category) {
        return res.status(404).json({
          success: false,
          error: 'Category not found',
          code: 'CATEGORY_NOT_FOUND'
        });
      }

      logger.info('Category reordered', {
        categoryId: category._id,
        order: req.body.order,
        updatedBy: req.user!.userId,
        action: 'reorder_category'
      });

      res.json({
        success: true,
        message: 'Category order updated successfully',
        data: { category }
      });

    } catch (error) {
      logger.error('Error reordering category:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to reorder category',
        code: 'REORDER_CATEGORY_ERROR'
      });
    }
  }
);

export default router;
