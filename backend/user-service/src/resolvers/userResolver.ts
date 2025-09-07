import { AuthenticationError, ForbiddenError, UserInputError } from 'apollo-server-express';
import { userService } from '../services/userService';
import { authService } from '../services/authService';
import { authenticate, authorize, UserRole } from '@shopsphere/shared';

export const userResolvers = {
  Query: {
    me: authenticate(async (parent: any, args: any, context: any) => {
      return await userService.getUserById(context.user.userId);
    }),

    users: authenticate(authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN])(
      async (parent: any, args: { limit?: number; offset?: number; role?: UserRole }) => {
        return await userService.getUsers({
          limit: args.limit,
          offset: args.offset,
          role: args.role
        });
      }
    )),

    user: authenticate(authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN])(
      async (parent: any, args: { id: string }) => {
        const user = await userService.getUserById(args.id);
        if (!user) {
          throw new UserInputError('User not found');
        }
        return user;
      }
    )),

    verifyToken: async (parent: any, args: { token: string }) => {
      try {
        // This is a public endpoint to verify JWT tokens
        const { jwtService } = await import('@shopsphere/shared');
        const payload = jwtService.verifyAccessToken(args.token);
        return !!payload;
      } catch (error) {
        return false;
      }
    }
  },

  Mutation: {
    register: async (parent: any, args: { input: any }) => {
      return await authService.register(args.input);
    },

    login: async (parent: any, args: { input: any }) => {
      return await authService.login(args.input);
    },

    refreshToken: async (parent: any, args: { refreshToken: string }) => {
      return await authService.refreshToken(args.refreshToken);
    },

    logout: authenticate(async (parent: any, args: any, context: any) => {
      return await authService.logout(context.user.userId);
    }),

    logoutAll: authenticate(async (parent: any, args: any, context: any) => {
      return await authService.logoutAll(context.user.userId);
    }),

    updateProfile: authenticate(async (parent: any, args: { input: any }, context: any) => {
      return await userService.updateProfile(context.user.userId, args.input);
    }),

    changePassword: authenticate(async (parent: any, args: { input: any }, context: any) => {
      const { currentPassword, newPassword } = args.input;
      return await authService.changePassword(context.user.userId, currentPassword, newPassword);
    }),

    forgotPassword: async (parent: any, args: { input: { email: string } }) => {
      return await authService.forgotPassword(args.input.email);
    },

    resetPassword: async (parent: any, args: { input: { token: string; newPassword: string } }) => {
      const { token, newPassword } = args.input;
      return await authService.resetPassword(token, newPassword);
    },

    verifyEmail: async (parent: any, args: { input: { token: string } }) => {
      return await authService.verifyEmail(args.input.token);
    },

    resendVerificationEmail: authenticate(async (parent: any, args: any, context: any) => {
      return await authService.resendVerificationEmail(context.user.userId);
    }),

    updateUserRole: authenticate(authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN])(
      async (parent: any, args: { userId: string; role: UserRole }, context: any) => {
        return await userService.updateUserRole(context.user.userId, args.userId, args.role);
      }
    )),

    deleteUser: authenticate(authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN])(
      async (parent: any, args: { userId: string }, context: any) => {
        await userService.deleteUser(context.user.userId, args.userId);
        return true;
      }
    ))
  },

  User: {
    fullName: (parent: any) => {
      return `${parent.firstName} ${parent.lastName}`;
    }
  }
};
