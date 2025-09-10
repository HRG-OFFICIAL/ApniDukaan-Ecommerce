import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import reviewsRouter from '../../routes/reviews';
import { Review } from '../../models/Review';
import { Product } from '../../models/Product';
// Imports are mocked below

// Mock authentication middleware
jest.mock('@apnidukaan/shared', () => ({
  authenticate: jest.fn((req, res, next) => {
    req.user = {
      userId: 'user123',
      email: 'test@example.com',
      role: 'user'
    };
    next();
  }),
  authorize: jest.fn((options: any) => (req: any, res: any, next: any) => {
    if (options.roles && options.roles.includes(req.user?.role)) {
      next();
    } else {
      res.status(403).json({ success: false, error: 'Access denied' });
    }
  }),
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

describe('Reviews Routes', () => {
  let app: express.Application;
  let mongoServer: MongoMemoryServer;
  let testProduct: any;
  let testReview: any;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    app = express();
    app.use(express.json());
    app.use('/reviews', reviewsRouter);
  });

  beforeEach(async () => {
    // Create test product
    testProduct = await Product.create({
      name: 'Test Product',
      slug: 'test-product',
      description: 'Test product description',
      sku: 'TEST001',
      price: 99.99,
      currency: 'USD',
      images: ['test-image.jpg'],
      category: {
        id: new mongoose.Types.ObjectId().toString(),
        name: 'Test Category',
        slug: 'test-category'
      },
      tags: ['test', 'product'],
      inventory: {
        quantity: 100,
        lowStockThreshold: 10,
        trackQuantity: true,
        allowBackorder: false,
        sku: 'TEST001'
      },
      hasVariants: false,
      reviews: [],
      rating: {
        average: 0,
        count: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      },
      sales: {
        totalSold: 0,
        revenue: 0
      },
      isOnSale: false,
      featured: false,
      status: 'published',
      visibility: 'public',
      isDigital: false,
      isSubscription: false,
      isBundle: false,
      analytics: {
        views: 0,
        clicks: 0,
        addToCart: 0,
        wishlist: 0,
        share: 0
      }
    });

    // Create test review
    testReview = await Review.create({
      product: testProduct._id,
      user: new mongoose.Types.ObjectId(),
      userEmail: 'test@example.com',
      rating: 5,
      title: 'Great product!',
      comment: 'I love this product. Highly recommended for everyone.',
      status: 'approved'
    });
  });

  afterEach(async () => {
    await Review.deleteMany({});
    await Product.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe('GET /reviews', () => {
    it('should get all approved reviews with pagination', async () => {
      const response = await request(app)
        .get('/reviews')
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.reviews).toHaveLength(1);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.total).toBe(1);
    });

    it('should filter reviews by product', async () => {
      const response = await request(app)
        .get('/reviews')
        .query({ product: testProduct._id.toString() });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.reviews).toHaveLength(1);
    });

    it('should filter reviews by rating', async () => {
      const response = await request(app)
        .get('/reviews')
        .query({ rating: 5 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.reviews).toHaveLength(1);
      expect(response.body.data.reviews[0].rating).toBe(5);
    });

    it('should sort reviews correctly', async () => {
      const response = await request(app)
        .get('/reviews')
        .query({ sort: 'rating_desc' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /reviews/:id', () => {
    it('should get a single review by ID', async () => {
      const response = await request(app)
        .get(`/reviews/${testReview._id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.review._id).toBe(testReview._id.toString());
    });

    it('should return 404 for non-existent review', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/reviews/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('REVIEW_NOT_FOUND');
    });

    it('should return 400 for invalid review ID', async () => {
      const response = await request(app)
        .get('/reviews/invalid-id');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /reviews', () => {
    const newReviewData = {
      product: '', // Will be set in test
      rating: 4,
      title: 'Good product',
      comment: 'This is a good product with nice quality and fast delivery.'
    };

    beforeEach(() => {
      newReviewData.product = testProduct._id.toString();
    });

    it('should create a new review', async () => {
      const response = await request(app)
        .post('/reviews')
        .send(newReviewData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.review.status).toBe('pending');
      expect(response.body.message).toContain('pending moderation');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/reviews')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.details).toBeDefined();
    });

    it('should prevent duplicate reviews', async () => {
      // First review should succeed
      await request(app)
        .post('/reviews')
        .send(newReviewData);

      // Second review should fail
      const response = await request(app)
        .post('/reviews')
        .send(newReviewData);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('REVIEW_EXISTS');
    });

    it('should validate rating range', async () => {
      const response = await request(app)
        .post('/reviews')
        .send({
          ...newReviewData,
          rating: 6
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate comment length', async () => {
      const response = await request(app)
        .post('/reviews')
        .send({
          ...newReviewData,
          comment: 'Short'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /reviews/:id', () => {
    it('should update own review', async () => {
      const updateData = {
        rating: 4,
        title: 'Updated title',
        comment: 'Updated comment with more details about the product.'
      };

      const response = await request(app)
        .put(`/reviews/${testReview._id}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.review.title).toBe('Updated title');
    });

    it('should return 404 for non-existent review', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/reviews/${fakeId}`)
        .send({ title: 'Updated' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /reviews/:id', () => {
    it('should delete own review', async () => {
      const response = await request(app)
        .delete(`/reviews/${testReview._id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');
    });

    it('should return 404 for non-existent review', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/reviews/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /reviews/:id/helpful', () => {
    it('should mark review as helpful', async () => {
      const response = await request(app)
        .post(`/reviews/${testReview._id}/helpful`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.helpfulVotes).toBe(1);
      expect(response.body.data.userVoted).toBe(true);
    });

    it('should prevent duplicate helpful votes', async () => {
      // First vote should succeed
      await request(app)
        .post(`/reviews/${testReview._id}/helpful`);

      // Second vote should fail
      const response = await request(app)
        .post(`/reviews/${testReview._id}/helpful`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('ALREADY_VOTED');
    });
  });

  describe('DELETE /reviews/:id/helpful', () => {
    beforeEach(async () => {
      // Add helpful vote first
      await request(app)
        .post(`/reviews/${testReview._id}/helpful`);
    });

    it('should remove helpful mark', async () => {
      const response = await request(app)
        .delete(`/reviews/${testReview._id}/helpful`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.helpfulVotes).toBe(0);
      expect(response.body.data.userVoted).toBe(false);
    });

    it('should return error if not voted', async () => {
      // Remove vote first
      await request(app)
        .delete(`/reviews/${testReview._id}/helpful`);

      // Try to remove again
      const response = await request(app)
        .delete(`/reviews/${testReview._id}/helpful`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('NOT_VOTED');
    });
  });

  describe('GET /reviews/product/:productId/summary', () => {
    it('should get review summary for a product', async () => {
      const response = await request(app)
        .get(`/reviews/product/${testProduct._id}/summary`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.summary).toBeDefined();
      expect(response.body.data.summary.totalReviews).toBeGreaterThan(0);
      expect(response.body.data.summary.averageRating).toBeGreaterThan(0);
      expect(response.body.data.summary.ratingDistribution).toBeDefined();
    });

    it('should return empty summary for product with no reviews', async () => {
      const newProduct = await Product.create({
        name: 'Product Without Reviews',
        slug: 'no-reviews',
        description: 'Test product',
        sku: 'TEST002',
        price: 49.99,
        currency: 'USD',
        images: ['test.jpg'],
        category: {
          id: new mongoose.Types.ObjectId().toString(),
          name: 'Test Category 2',
          slug: 'test-category-2'
        },
        tags: ['test', 'no-reviews'],
        inventory: {
          quantity: 50,
          lowStockThreshold: 5,
          trackQuantity: true,
          allowBackorder: false,
          sku: 'TEST002'
        },
        hasVariants: false,
        reviews: [],
        rating: {
          average: 0,
          count: 0,
          distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        },
        sales: {
          totalSold: 0,
          revenue: 0
        },
        isOnSale: false,
        featured: false,
        status: 'published',
        visibility: 'public',
        isDigital: false,
        isSubscription: false,
        isBundle: false,
        analytics: {
          views: 0,
          clicks: 0,
          addToCart: 0,
          wishlist: 0,
          share: 0
        }
      });

      const response = await request(app)
        .get(`/reviews/product/${newProduct._id}/summary`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.summary.totalReviews).toBe(0);
      expect(response.body.data.summary.averageRating).toBe(0);
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/reviews/product/${fakeId}/summary`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('PRODUCT_NOT_FOUND');
    });
  });

  describe('Admin/Moderator Routes', () => {
    let adminApp: express.Application;

    beforeAll(() => {
      // Mock admin user
      jest.clearAllMocks();
      jest.mock('@apnidukaan/shared', () => ({
        authenticate: (req: any, res: any, next: any) => {
          req.user = {
            userId: 'admin123',
            email: 'admin@example.com',
            role: 'admin'
          };
          next();
        },
        authorize: (options: { roles: string[] }) => (req: any, res: any, next: any) => {
          if (options.roles.includes(req.user?.role)) {
            next();
          } else {
            res.status(403).json({ success: false, error: 'Access denied' });
          }
        },
        logger: {
          info: jest.fn(),
          error: jest.fn(),
          warn: jest.fn(),
          debug: jest.fn()
        }
      }));

      adminApp = express();
      adminApp.use(express.json());
      adminApp.use('/reviews', reviewsRouter);
    });

    describe('POST /reviews/:id/reply', () => {
      it('should add reply to review', async () => {
        const replyData = {
          comment: 'Thank you for your feedback!'
        };

        const response = await request(adminApp)
          .post(`/reviews/${testReview._id}/reply`)
          .send(replyData);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.reply).toBeDefined();
      });

      it('should validate reply comment', async () => {
        const response = await request(adminApp)
          .post(`/reviews/${testReview._id}/reply`)
          .send({ comment: '' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });

    describe('PATCH /reviews/:id/status', () => {
      it('should update review status', async () => {
        const statusData = {
          status: 'approved',
          moderationNote: 'Review approved after verification'
        };

        const response = await request(adminApp)
          .patch(`/reviews/${testReview._id}/status`)
          .send(statusData);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.review.status).toBe('approved');
      });

      it('should validate status values', async () => {
        const response = await request(adminApp)
          .patch(`/reviews/${testReview._id}/status`)
          .send({ status: 'invalid-status' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });
  });
});
