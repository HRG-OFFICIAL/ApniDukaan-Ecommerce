import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authenticate, authorize, optionalAuth } from '@shopsphere/shared';
import { ProductModel } from '../models/Product';
import { CategoryModel } from '../models/Category';
import { logger } from '@shopsphere/shared';

const router = express.Router();

// Validation rules
const createProductValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Product name is required and must be less than 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('Description must be between 10 and 5000 characters'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('category')
    .isMongoId()
    .withMessage('Category must be a valid ID'),
  body('brand')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Brand is required and must be less than 100 characters'),
  body('sku')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('SKU is required and must be less than 50 characters')
];

const updateProductValidation = [
  param('id')
    .isMongoId()
    .withMessage('Product ID must be valid'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Product name must be less than 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('Description must be between 10 and 5000 characters'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number')
];

const productQueryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be positive'),
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be positive'),
  query('rating')
    .optional()
    .isFloat({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5')
];

/**
 * @route GET /products
 * @desc Get products with filtering, sorting, and pagination
 * @access Public
 */
router.get('/',
  productQueryValidation,
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

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 12;
      const skip = (page - 1) * limit;

      // Build filter query
      const filter: any = { status: 'active' };

      if (req.query.category) {
        filter.category = req.query.category;
      }

      if (req.query.brand) {
        filter.brand = { $regex: req.query.brand, $options: 'i' };
      }

      if (req.query.minPrice || req.query.maxPrice) {
        filter.price = {};
        if (req.query.minPrice) filter.price.$gte = parseFloat(req.query.minPrice as string);
        if (req.query.maxPrice) filter.price.$lte = parseFloat(req.query.maxPrice as string);
      }

      if (req.query.rating) {
        filter.averageRating = { $gte: parseFloat(req.query.rating as string) };
      }

      if (req.query.search) {
        filter.$or = [
          { name: { $regex: req.query.search, $options: 'i' } },
          { description: { $regex: req.query.search, $options: 'i' } },
          { tags: { $in: [new RegExp(req.query.search as string, 'i')] } }
        ];
      }

      if (req.query.tags) {
        const tags = (req.query.tags as string).split(',');
        filter.tags = { $in: tags };
      }

      // Build sort query
      let sort: any = { createdAt: -1 }; // default sort

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
        case 'name_desc':
          sort = { name: -1 };
          break;
        case 'rating_desc':
          sort = { averageRating: -1 };
          break;
        case 'popularity':
          sort = { reviewCount: -1, averageRating: -1 };
          break;
        case 'newest':
          sort = { createdAt: -1 };
          break;
        case 'oldest':
          sort = { createdAt: 1 };
          break;
      }

      // Execute query
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
      logger.error('Error fetching products:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch products',
        code: 'FETCH_PRODUCTS_ERROR'
      });
    }
  }
);

/**
 * @route GET /products/:id
 * @desc Get single product by ID
 * @access Public
 */
router.get('/:id',
  param('id').isMongoId().withMessage('Product ID must be valid'),
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

      const product = await ProductModel.findById(req.params.id)
        .populate('category', 'name slug breadcrumb')
        .lean();

      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Product not found',
          code: 'PRODUCT_NOT_FOUND'
        });
      }

      // Increment view count (in background)
      ProductModel.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } }).exec();

      res.json({
        success: true,
        data: { product }
      });

    } catch (error) {
      logger.error('Error fetching product:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch product',
        code: 'FETCH_PRODUCT_ERROR'
      });
    }
  }
);

/**
 * @route GET /products/slug/:slug
 * @desc Get single product by slug
 * @access Public
 */
router.get('/slug/:slug',
  param('slug').notEmpty().withMessage('Product slug is required'),
  async (req, res) => {
    try {
      const product = await ProductModel.findOne({ 
        slug: req.params.slug,
        status: 'active'
      })
      .populate('category', 'name slug breadcrumb')
      .lean();

      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Product not found',
          code: 'PRODUCT_NOT_FOUND'
        });
      }

      // Increment view count (in background)
      ProductModel.findByIdAndUpdate(product._id, { $inc: { viewCount: 1 } }).exec();

      res.json({
        success: true,
        data: { product }
      });

    } catch (error) {
      logger.error('Error fetching product by slug:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch product',
        code: 'FETCH_PRODUCT_ERROR'
      });
    }
  }
);

/**
 * @route POST /products
 * @desc Create new product
 * @access Admin/Moderator
 */
router.post('/',
  authenticate,
  authorize({ roles: ['admin', 'moderator'] }),
  createProductValidation,
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

      // Check if category exists
      const category = await CategoryModel.findById(req.body.category);
      if (!category) {
        return res.status(400).json({
          success: false,
          error: 'Category not found',
          code: 'CATEGORY_NOT_FOUND'
        });
      }

      // Check for duplicate SKU
      const existingProduct = await ProductModel.findOne({ sku: req.body.sku });
      if (existingProduct) {
        return res.status(409).json({
          success: false,
          error: 'Product with this SKU already exists',
          code: 'DUPLICATE_SKU'
        });
      }

      // Create product
      const product = new ProductModel({
        ...req.body,
        createdBy: req.user!.userId,
        updatedBy: req.user!.userId
      });

      await product.save();

      logger.info('Product created', {
        productId: product._id,
        name: product.name,
        createdBy: req.user!.userId,
        action: 'create_product'
      });

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: { product }
      });

    } catch (error) {
      logger.error('Error creating product:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create product',
        code: 'CREATE_PRODUCT_ERROR'
      });
    }
  }
);

/**
 * @route PUT /products/:id
 * @desc Update product
 * @access Admin/Moderator
 */
router.put('/:id',
  authenticate,
  authorize({ roles: ['admin', 'moderator'] }),
  updateProductValidation,
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

      const product = await ProductModel.findById(req.params.id);
      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Product not found',
          code: 'PRODUCT_NOT_FOUND'
        });
      }

      // Check if category exists (if being updated)
      if (req.body.category) {
        const category = await CategoryModel.findById(req.body.category);
        if (!category) {
          return res.status(400).json({
            success: false,
            error: 'Category not found',
            code: 'CATEGORY_NOT_FOUND'
          });
        }
      }

      // Check for duplicate SKU (if being updated)
      if (req.body.sku && req.body.sku !== product.sku) {
        const existingProduct = await ProductModel.findOne({ 
          sku: req.body.sku,
          _id: { $ne: req.params.id }
        });
        if (existingProduct) {
          return res.status(409).json({
            success: false,
            error: 'Product with this SKU already exists',
            code: 'DUPLICATE_SKU'
          });
        }
      }

      // Update product
      Object.assign(product, {
        ...req.body,
        updatedBy: req.user!.userId,
        updatedAt: new Date()
      });

      await product.save();

      logger.info('Product updated', {
        productId: product._id,
        name: product.name,
        updatedBy: req.user!.userId,
        action: 'update_product'
      });

      res.json({
        success: true,
        message: 'Product updated successfully',
        data: { product }
      });

    } catch (error) {
      logger.error('Error updating product:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update product',
        code: 'UPDATE_PRODUCT_ERROR'
      });
    }
  }
);

/**
 * @route DELETE /products/:id
 * @desc Delete product (soft delete)
 * @access Admin
 */
router.delete('/:id',
  authenticate,
  authorize({ roles: ['admin'] }),
  param('id').isMongoId().withMessage('Product ID must be valid'),
  async (req, res) => {
    try {
      const product = await ProductModel.findById(req.params.id);
      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Product not found',
          code: 'PRODUCT_NOT_FOUND'
        });
      }

      // Soft delete
      product.status = 'deleted';
      product.updatedBy = req.user!.userId;
      await product.save();

      logger.info('Product deleted', {
        productId: product._id,
        name: product.name,
        deletedBy: req.user!.userId,
        action: 'delete_product'
      });

      res.json({
        success: true,
        message: 'Product deleted successfully'
      });

    } catch (error) {
      logger.error('Error deleting product:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete product',
        code: 'DELETE_PRODUCT_ERROR'
      });
    }
  }
);

/**
 * @route GET /products/:id/related
 * @desc Get related products
 * @access Public
 */
router.get('/:id/related',
  param('id').isMongoId().withMessage('Product ID must be valid'),
  async (req, res) => {
    try {
      const product = await ProductModel.findById(req.params.id);
      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Product not found',
          code: 'PRODUCT_NOT_FOUND'
        });
      }

      const limit = parseInt(req.query.limit as string) || 8;

      // Find related products based on category and tags
      const relatedProducts = await ProductModel.find({
        _id: { $ne: product._id },
        status: 'active',
        $or: [
          { category: product.category },
          { tags: { $in: product.tags } },
          { brand: product.brand }
        ]
      })
      .populate('category', 'name slug')
      .sort({ averageRating: -1, reviewCount: -1 })
      .limit(limit)
      .lean();

      res.json({
        success: true,
        data: { products: relatedProducts }
      });

    } catch (error) {
      logger.error('Error fetching related products:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch related products',
        code: 'FETCH_RELATED_ERROR'
      });
    }
  }
);

/**
 * @route GET /products/featured
 * @desc Get featured products
 * @access Public
 */
router.get('/featured',
  async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 12;

      const featuredProducts = await ProductModel.find({
        status: 'active',
        featured: true
      })
      .populate('category', 'name slug')
      .sort({ featuredOrder: 1, createdAt: -1 })
      .limit(limit)
      .lean();

      res.json({
        success: true,
        data: { products: featuredProducts }
      });

    } catch (error) {
      logger.error('Error fetching featured products:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch featured products',
        code: 'FETCH_FEATURED_ERROR'
      });
    }
  }
);

/**
 * @route PATCH /products/:id/status
 * @desc Update product status
 * @access Admin/Moderator
 */
router.patch('/:id/status',
  authenticate,
  authorize({ roles: ['admin', 'moderator'] }),
  [
    param('id').isMongoId().withMessage('Product ID must be valid'),
    body('status').isIn(['active', 'draft', 'archived']).withMessage('Invalid status')
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

      const product = await ProductModel.findByIdAndUpdate(
        req.params.id,
        {
          status: req.body.status,
          updatedBy: req.user!.userId,
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Product not found',
          code: 'PRODUCT_NOT_FOUND'
        });
      }

      logger.info('Product status updated', {
        productId: product._id,
        status: req.body.status,
        updatedBy: req.user!.userId,
        action: 'update_product_status'
      });

      res.json({
        success: true,
        message: 'Product status updated successfully',
        data: { product }
      });

    } catch (error) {
      logger.error('Error updating product status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update product status',
        code: 'UPDATE_STATUS_ERROR'
      });
    }
  }
);

export default router;
