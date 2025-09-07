import { AuthenticationError, ForbiddenError, UserInputError } from 'apollo-server-express';
import { orderService } from '../services/orderService';
import { cartService } from '../services/cartService';
import { authenticate, authorize, UserRole } from '@shopsphere/shared';

export const orderResolvers = {
  Query: {
    order: authenticate(async (parent: any, args: { id?: string; orderNumber?: string }, context: any) => {
      const isAdmin = [UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(context.user.role);
      const userId = isAdmin ? undefined : context.user.userId;

      if (args.id) {
        return await orderService.getOrderById(args.id, userId);
      } else if (args.orderNumber) {
        return await orderService.getOrderByNumber(args.orderNumber, userId);
      }
      throw new UserInputError('Must provide id or orderNumber');
    }),

    orders: authenticate(authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN])(
      async (parent: any, args: { limit?: number; offset?: number }) => {
        // Admin can see all orders - implement pagination logic here
        throw new Error('Not implemented - use ordersByStatus instead');
      }
    )),

    userOrders: authenticate(async (parent: any, args: { limit?: number; offset?: number }, context: any) => {
      return await orderService.getUserOrders(
        context.user.userId,
        args.limit,
        args.offset
      );
    }),

    ordersByStatus: authenticate(authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN])(
      async (parent: any, args: { status: any; limit?: number; offset?: number }) => {
        // Implementation would go here for admin to filter orders by status
        throw new Error('Not implemented');
      }
    )),

    orderStats: authenticate(authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN])(
      async (parent: any, args: { startDate?: Date; endDate?: Date }) => {
        // Implementation would go here for admin dashboard stats
        throw new Error('Not implemented');
      }
    )),

    cart: authenticate(async (parent: any, args: any, context: any) => {
      return await cartService.getCart(context.user.userId);
    }),

    cartItemCount: authenticate(async (parent: any, args: any, context: any) => {
      return await cartService.getCartItemCount(context.user.userId);
    })
  },

  Mutation: {
    createOrder: authenticate(async (parent: any, args: { input: any }, context: any) => {
      // Validate cart before creating order
      const validation = await cartService.validateCartForCheckout(context.user.userId);
      if (!validation.valid) {
        throw new UserInputError(`Cart validation failed: ${validation.errors.join(', ')}`);
      }

      return await orderService.createOrder(
        args.input,
        context.user.userId,
        context.user.email
      );
    }),

    updateOrderStatus: authenticate(authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN])(
      async (parent: any, args: { id: string; status: any }, context: any) => {
        return await orderService.updateOrderStatus(args.id, args.status, context.user.userId);
      }
    )),

    cancelOrder: authenticate(async (parent: any, args: { id: string; reason: string }, context: any) => {
      const isAdmin = [UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(context.user.role);
      return await orderService.cancelOrder(args.id, args.reason, context.user.userId, isAdmin);
    }),

    addTrackingInfo: authenticate(authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN])(
      async (parent: any, args: { id: string; input: any }, context: any) => {
        return await orderService.addTrackingInfo(
          args.id,
          args.input.trackingNumber,
          args.input.carrier,
          context.user.userId
        );
      }
    )),

    addToCart: authenticate(async (parent: any, args: { input: any }, context: any) => {
      return await cartService.addToCart(context.user.userId, {
        productId: args.input.productId,
        quantity: args.input.quantity,
        price: args.input.price,
        productData: args.input.productData
      });
    }),

    updateCartItem: authenticate(async (parent: any, args: { input: any }, context: any) => {
      return await cartService.updateCartItem(
        context.user.userId,
        args.input.productId,
        args.input.quantity
      );
    }),

    removeFromCart: authenticate(async (parent: any, args: { productId: string }, context: any) => {
      return await cartService.removeFromCart(context.user.userId, args.productId);
    }),

    clearCart: authenticate(async (parent: any, args: any, context: any) => {
      return await cartService.clearCart(context.user.userId);
    })
  }
};
