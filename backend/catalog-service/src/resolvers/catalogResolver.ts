import { AuthenticationError, ForbiddenError, UserInputError } from 'apollo-server-express';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';
import { reviewService } from '../services/reviewService';
import { authenticate, authorize, UserRole } from '@shopsphere/shared';

export const catalogResolvers = {
  Query: {
    products: async (parent: any, args: { input?: any }) => {
      return await productService.searchProducts(args.input || {});
    },

    product: async (parent: any, args: { id?: string; slug?: string; sku?: string }) => {
      if (args.id) {
        return await productService.getProductById(args.id);
      } else if (args.slug) {
        return await productService.getProductBySlug(args.slug);
      } else if (args.sku) {
        return await productService.getProductBySku(args.sku);
      }
      throw new UserInputError('Must provide id, slug, or sku');
    },

    featuredProducts: async (parent: any, args: { limit?: number }) => {
      return await productService.getFeaturedProducts(args.limit);
    },

    categories: async () => {
      return await categoryService.getAllCategories();
    },

    category: async (parent: any, args: { id?: string; slug?: string }) => {
      if (args.id) {
        return await categoryService.getCategoryById(args.id);
      } else if (args.slug) {
        return await categoryService.getCategoryBySlug(args.slug);
      }
      throw new UserInputError('Must provide id or slug');
    },

    categoryTree: async () => {
      return await categoryService.getCategoryTree();
    },

    featuredCategories: async (parent: any, args: { limit?: number }) => {
      return await categoryService.getFeaturedCategories(args.limit);
    },

    reviews: async (parent: any, args: { productId: string; limit?: number; offset?: number }) => {
      return await reviewService.getProductReviews(
        args.productId,
        undefined,
        args.limit,
        args.offset
      );
    },

    review: async (parent: any, args: { id: string }) => {
      const review = await reviewService.getReviewById(args.id);
      if (!review) {
        throw new UserInputError('Review not found');
      }
      return review;
    },

    productRatingStats: async (parent: any, args: { productId: string }) => {
      return await reviewService.getProductRatingStats(args.productId);
    },

    userReviews: authenticate(async (parent: any, args: { limit?: number; offset?: number }, context: any) => {
      return await reviewService.getUserReviews(
        context.user.userId,
        args.limit,
        args.offset
      );
    })
  },

  Mutation: {
    createProduct: authenticate(authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN])(
      async (parent: any, args: { input: any }, context: any) => {
        return await productService.createProduct(args.input, context.user.userId);
      }
    )),

    updateProduct: authenticate(authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN])(
      async (parent: any, args: { id: string; input: any }, context: any) => {
        return await productService.updateProduct(args.id, args.input, context.user.userId);
      }
    )),

    deleteProduct: authenticate(authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN])(
      async (parent: any, args: { id: string }, context: any) => {
        return await productService.deleteProduct(args.id, context.user.userId);
      }
    )),

    updateProductInventory: authenticate(authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN])(
      async (parent: any, args: { id: string; quantity: number }, context: any) => {
        return await productService.updateInventory(args.id, args.quantity, context.user.userId);
      }
    )),

    createCategory: authenticate(authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN])(
      async (parent: any, args: { input: any }, context: any) => {
        return await categoryService.createCategory(args.input, context.user.userId);
      }
    )),

    updateCategory: authenticate(authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN])(
      async (parent: any, args: { id: string; input: any }, context: any) => {
        return await categoryService.updateCategory(args.id, args.input, context.user.userId);
      }
    )),

    deleteCategory: authenticate(authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN])(
      async (parent: any, args: { id: string }, context: any) => {
        return await categoryService.deleteCategory(args.id, context.user.userId);
      }
    )),

    createReview: authenticate(async (parent: any, args: { input: any }, context: any) => {
      return await reviewService.createReview(
        args.input,
        context.user.userId,
        context.user.firstName + ' ' + context.user.lastName
      );
    }),

    updateReviewStatus: authenticate(authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN])(
      async (parent: any, args: { id: string; status: any }, context: any) => {
        return await reviewService.updateReviewStatus(args.id, args.status, context.user.userId);
      }
    )),

    markReviewHelpful: authenticate(async (parent: any, args: { id: string }, context: any) => {
      return await reviewService.markReviewHelpful(args.id, context.user.userId);
    }),

    markReviewUnhelpful: authenticate(async (parent: any, args: { id: string }, context: any) => {
      return await reviewService.markReviewUnhelpful(args.id, context.user.userId);
    }),

    deleteReview: authenticate(async (parent: any, args: { id: string }, context: any) => {
      const isAdmin = [UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(context.user.role);
      return await reviewService.deleteReview(args.id, context.user.userId, isAdmin);
    })
  },

  Product: {
    category: async (parent: any) => {
      return await categoryService.getCategoryById(parent.category);
    },
    subcategory: async (parent: any) => {
      return parent.subcategory ? await categoryService.getCategoryById(parent.subcategory) : null;
    }
  },

  Category: {
    parent: async (parent: any) => {
      return parent.parent ? await categoryService.getCategoryById(parent.parent) : null;
    },
    children: async (parent: any) => {
      return await categoryService.getCategoryChildren(parent.id);
    }
  },

  Review: {
    product: async (parent: any) => {
      return await productService.getProductById(parent.product);
    }
  }
};
