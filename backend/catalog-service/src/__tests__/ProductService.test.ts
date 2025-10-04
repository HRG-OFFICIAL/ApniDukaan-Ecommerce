import { ProductService } from '../services/ProductService';
import { Product } from '../models/Product';

// Mock the Product model
jest.mock('../models/Product');

describe('ProductService', () => {
  let productService: ProductService;
  let mockProduct: any;

  beforeEach(() => {
    productService = new ProductService();
    mockProduct = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Test Product',
      price: 1000,
      category: '507f1f77bcf86cd799439012',
      save: jest.fn().mockResolvedValue(true),
      findById: jest.fn(),
      find: jest.fn(),
      countDocuments: jest.fn(),
      findOneAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn()
    };
  });

  describe('createProduct', () => {
    it('should create a product successfully', async () => {
      const productData = {
        name: 'Test Product',
        price: 1000,
        category: '507f1f77bcf86cd799439012'
      };

      (Product as any).mockImplementation(() => mockProduct);

      const result = await productService.createProduct(productData);

      expect(Product).toHaveBeenCalledWith(productData);
      expect(mockProduct.save).toHaveBeenCalled();
      expect(result).toBe(mockProduct);
    });

    it('should throw error when product creation fails', async () => {
      const productData = {
        name: 'Test Product',
        price: 1000,
        category: '507f1f77bcf86cd799439012'
      };

      const error = new Error('Database error');
      (Product as any).mockImplementation(() => {
        throw error;
      });

      await expect(productService.createProduct(productData)).rejects.toThrow('Database error');
    });
  });

  describe('getProductById', () => {
    it('should return product when found', async () => {
      (Product.findById as any).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockProduct)
        })
      });

      const result = await productService.getProductById('507f1f77bcf86cd799439011');

      expect(Product.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(result).toBe(mockProduct);
    });

    it('should return null when product not found', async () => {
      (Product.findById as any).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(null)
        })
      });

      const result = await productService.getProductById('507f1f77bcf86cd799439011');

      expect(result).toBeNull();
    });
  });

  describe('getProducts', () => {
    it('should return products with pagination', async () => {
      const mockProducts = [mockProduct];
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockProducts)
      };

      (Product.find as any).mockReturnValue(mockQuery);
      (Product.countDocuments as any).mockResolvedValue(1);

      const filters = {};
      const sort = { field: 'name', order: 'asc' as const };
      const page = 1;
      const limit = 10;

      const result = await productService.getProducts(filters, sort, page, limit);

      expect(result.products).toEqual(mockProducts);
      expect(result.total).toBe(1);
      expect(result.pages).toBe(1);
    });
  });

  describe('updateProduct', () => {
    it('should update product successfully', async () => {
      const updateData = { name: 'Updated Product' };
      const updatedProduct = { ...mockProduct, ...updateData };

      (Product.findOneAndUpdate as any).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(updatedProduct)
        })
      });

      const result = await productService.updateProduct('507f1f77bcf86cd799439011', updateData);

      expect(Product.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: '507f1f77bcf86cd799439011' },
        updateData,
        { new: true, runValidators: true }
      );
      expect(result).toBe(updatedProduct);
    });

    it('should return null when product not found', async () => {
      (Product.findOneAndUpdate as any).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(null)
        })
      });

      const result = await productService.updateProduct('507f1f77bcf86cd799439011', {});

      expect(result).toBeNull();
    });
  });

  describe('deleteProduct', () => {
    it('should delete product successfully', async () => {
      (Product.findByIdAndDelete as any).mockResolvedValue(mockProduct);

      const result = await productService.deleteProduct('507f1f77bcf86cd799439011');

      expect(Product.findByIdAndDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(result).toBe(mockProduct);
    });

    it('should return null when product not found', async () => {
      (Product.findByIdAndDelete as any).mockResolvedValue(null);

      const result = await productService.deleteProduct('507f1f77bcf86cd799439011');

      expect(result).toBeNull();
    });
  });
});
