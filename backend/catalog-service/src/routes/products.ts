import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { ProductService } from '../services/productService';
import { logger } from '@apnidukaan/shared';

const router = express.Router();
const productService = new ProductService();

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

// GET /api/products - Get all products with filters
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('category').optional().isMongoId().withMessage('Category must be a valid MongoDB ID'),
  query('subcategory').optional().isMongoId().withMessage('Subcategory must be a valid MongoDB ID'),
  query('brand').optional().isString().withMessage('Brand must be a string'),
  query('minPrice').optional().isFloat({ min: 0 }).withMessage('Min price must be a positive number'),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Max price must be a positive number'),
  query('tags').optional().isString().withMessage('Tags must be a string'),
  query('status').optional().isIn(['draft', 'published', 'archived']).withMessage('Status must be draft, published, or archived'),
  query('featured').optional().isBoolean().withMessage('Featured must be a boolean'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('sortField').optional().isIn(['name', 'price', 'rating', 'createdAt', 'sales']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
  handleValidationErrors
], async (req: express.Request, res: express.Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      subcategory,
      brand,
      minPrice,
      maxPrice,
      tags,
      status,
      featured,
      search,
      sortField = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filters = {
      category: category as string,
      subcategory: subcategory as string,
      brand: brand as string,
      minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
      tags: tags ? (tags as string).split(',') : undefined,
      status: status as string,
      featured: featured ? featured === 'true' : undefined,
      search: search as string
    };

    const sort = {
      field: sortField as 'name' | 'price' | 'rating' | 'createdAt' | 'sales',
      order: sortOrder as 'asc' | 'desc'
    };

    const result = await productService.getProducts(
      filters,
      sort,
      parseInt(page as string),
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: result.products,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: result.total,
        pages: result.pages
      }
    });
  } catch (error: any) {
    logger.error('Failed to get products', {
      error: error.message,
      query: req.query,
      action: 'get_products_api_failed'
    });
    res.status(500).json({
      success: false,
      message: 'Failed to get products',
      error: error.message
    });
  }
});

// GET /api/products/featured - Get featured products
router.get('/featured', [
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  handleValidationErrors
], async (req: express.Request, res: express.Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const products = await productService.getFeaturedProducts(limit);

    res.json({
      success: true,
      data: products
    });
  } catch (error: any) {
    logger.error('Failed to get featured products', {
      error: error.message,
      query: req.query,
      action: 'get_featured_products_api_failed'
    });
    res.status(500).json({
      success: false,
      message: 'Failed to get featured products',
      error: error.message
    });
  }
});

// GET /api/products/:id - Get product by ID
router.get('/:id', [
  param('id').isMongoId().withMessage('Product ID must be a valid MongoDB ID'),
  handleValidationErrors
], async (req: express.Request, res: express.Response) => {
  try {
    const product = await productService.getProductById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error: any) {
    logger.error('Failed to get product by ID', {
      error: error.message,
      productId: req.params.id,
      action: 'get_product_by_id_api_failed'
    });
    res.status(500).json({
      success: false,
      message: 'Failed to get product',
      error: error.message
    });
  }
});

// GET /api/products/slug/:slug - Get product by slug
router.get('/slug/:slug', [
  param('slug').isSlug().withMessage('Slug must be a valid slug'),
  handleValidationErrors
], async (req: express.Request, res: express.Response) => {
  try {
    const product = await productService.getProductBySlug(req.params.slug);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error: any) {
    logger.error('Failed to get product by slug', {
      error: error.message,
      slug: req.params.slug,
      action: 'get_product_by_slug_api_failed'
    });
    res.status(500).json({
      success: false,
      message: 'Failed to get product',
      error: error.message
    });
  }
});

// GET /api/products/:id/related - Get related products
router.get('/:id/related', [
  param('id').isMongoId().withMessage('Product ID must be a valid MongoDB ID'),
  query('limit').optional().isInt({ min: 1, max: 20 }).withMessage('Limit must be between 1 and 20'),
  handleValidationErrors
], async (req: express.Request, res: express.Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;
    const products = await productService.getRelatedProducts(req.params.id, limit);

    res.json({
      success: true,
      data: products
    });
  } catch (error: any) {
    logger.error('Failed to get related products', {
      error: error.message,
      productId: req.params.id,
      query: req.query,
      action: 'get_related_products_api_failed'
    });
    res.status(500).json({
      success: false,
      message: 'Failed to get related products',
      error: error.message
    });
  }
});

// POST /api/products - Create new product
router.post('/', [
  body('name').notEmpty().withMessage('Product name is required'),
  body('slug').isSlug().withMessage('Slug must be a valid slug'),
  body('description').notEmpty().withMessage('Description is required'),
  body('sku').notEmpty().withMessage('SKU is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('currency').optional().isString().withMessage('Currency must be a string'),
  body('images').isArray({ min: 1 }).withMessage('At least one image is required'),
  body('category').isMongoId().withMessage('Category must be a valid MongoDB ID'),
  body('inventory.quantity').isInt({ min: 0 }).withMessage('Inventory quantity must be a non-negative integer'),
  body('shipping.weight').isFloat({ min: 0 }).withMessage('Shipping weight must be a positive number'),
  handleValidationErrors
], async (req: express.Request, res: express.Response) => {
  try {
    const product = await productService.createProduct(req.body);

    res.status(201).json({
      success: true,
      data: product,
      message: 'Product created successfully'
    });
  } catch (error: any) {
    logger.error('Failed to create product', {
      error: error.message,
      productData: req.body,
      action: 'create_product_api_failed'
    });
    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: error.message
    });
  }
});

// PUT /api/products/:id - Update product
router.put('/:id', [
  param('id').isMongoId().withMessage('Product ID must be a valid MongoDB ID'),
  body('name').optional().notEmpty().withMessage('Product name cannot be empty'),
  body('slug').optional().isSlug().withMessage('Slug must be a valid slug'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('status').optional().isIn(['draft', 'published', 'archived']).withMessage('Invalid status'),
  handleValidationErrors
], async (req: express.Request, res: express.Response) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.body);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product,
      message: 'Product updated successfully'
    });
  } catch (error: any) {
    logger.error('Failed to update product', {
      error: error.message,
      productId: req.params.id,
      updateData: req.body,
      action: 'update_product_api_failed'
    });
    res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: error.message
    });
  }
});

// DELETE /api/products/:id - Delete product
router.delete('/:id', [
  param('id').isMongoId().withMessage('Product ID must be a valid MongoDB ID'),
  handleValidationErrors
], async (req: express.Request, res: express.Response) => {
  try {
    const deleted = await productService.deleteProduct(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error: any) {
    logger.error('Failed to delete product', {
      error: error.message,
      productId: req.params.id,
      action: 'delete_product_api_failed'
    });
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: error.message
    });
  }
});

// PUT /api/products/:id/inventory - Update product inventory
router.put('/:id/inventory', [
  param('id').isMongoId().withMessage('Product ID must be a valid MongoDB ID'),
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
  handleValidationErrors
], async (req: express.Request, res: express.Response) => {
  try {
    const product = await productService.updateInventory(req.params.id, req.body.quantity);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product,
      message: 'Product inventory updated successfully'
    });
  } catch (error: any) {
    logger.error('Failed to update product inventory', {
      error: error.message,
      productId: req.params.id,
      quantity: req.body.quantity,
      action: 'update_product_inventory_api_failed'
    });
    res.status(500).json({
      success: false,
      message: 'Failed to update product inventory',
      error: error.message
    });
  }
});

export default router;
