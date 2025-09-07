import { User, IUserDocument } from '../models/User';
import { UserRole, logger, ValidationError, AuthenticationError, ForbiddenError } from '@shopsphere/shared';

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

export interface UserFilters {
  role?: UserRole;
  limit?: number;
  offset?: number;
}

class UserService {
  async getUserById(id: string): Promise<IUserDocument | null> {
    try {
      const user = await User.findById(id);
      
      if (user) {
        logger.info('User retrieved successfully', {
          userId: id,
          action: 'get_user_by_id'
        });
      }

      return user;
    } catch (error) {
      logger.error('Failed to get user by ID', {
        userId: id,
        error: error.message,
        action: 'get_user_by_id'
      });
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<IUserDocument | null> {
    try {
      const user = await User.findByEmail(email);
      
      if (user) {
        logger.info('User retrieved by email', {
          userId: user._id,
          email,
          action: 'get_user_by_email'
        });
      }

      return user;
    } catch (error) {
      logger.error('Failed to get user by email', {
        email,
        error: error.message,
        action: 'get_user_by_email'
      });
      throw error;
    }
  }

  async getUsers(filters: UserFilters = {}): Promise<IUserDocument[]> {
    try {
      const { role, limit = 50, offset = 0 } = filters;
      
      const query: any = {};
      if (role) {
        query.role = role;
      }

      const users = await User.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset)
        .exec();

      logger.info('Users retrieved successfully', {
        count: users.length,
        filters,
        action: 'get_users'
      });

      return users;
    } catch (error) {
      logger.error('Failed to get users', {
        filters,
        error: error.message,
        action: 'get_users'
      });
      throw error;
    }
  }

  async updateProfile(userId: string, data: UpdateProfileData): Promise<IUserDocument> {
    const { firstName, lastName, avatar } = data;

    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new AuthenticationError('User not found');
      }

      // Update fields if provided
      if (firstName !== undefined) {
        if (!firstName.trim()) {
          throw new ValidationError('First name cannot be empty');
        }
        user.firstName = firstName.trim();
      }

      if (lastName !== undefined) {
        if (!lastName.trim()) {
          throw new ValidationError('Last name cannot be empty');
        }
        user.lastName = lastName.trim();
      }

      if (avatar !== undefined) {
        user.avatar = avatar;
      }

      await user.save();

      logger.info('User profile updated successfully', {
        userId: user._id,
        updatedFields: Object.keys(data),
        action: 'update_profile'
      });

      return user;
    } catch (error) {
      logger.error('Failed to update user profile', {
        userId,
        error: error.message,
        action: 'update_profile'
      });
      throw error;
    }
  }

  async updateUserRole(adminUserId: string, targetUserId: string, newRole: UserRole): Promise<IUserDocument> {
    try {
      // Check if admin user exists and has permission
      const adminUser = await User.findById(adminUserId);
      if (!adminUser) {
        throw new AuthenticationError('Admin user not found');
      }

      if (adminUser.role !== UserRole.ADMIN && adminUser.role !== UserRole.SUPER_ADMIN) {
        throw new ForbiddenError('Insufficient permissions to update user role');
      }

      // Super admin can update any role, admin can only update to customer
      if (adminUser.role === UserRole.ADMIN && newRole !== UserRole.CUSTOMER) {
        throw new ForbiddenError('Admin can only assign customer role');
      }

      // Find target user
      const targetUser = await User.findById(targetUserId);
      if (!targetUser) {
        throw new ValidationError('Target user not found');
      }

      // Prevent self-demotion for super admin
      if (adminUserId === targetUserId && adminUser.role === UserRole.SUPER_ADMIN && newRole !== UserRole.SUPER_ADMIN) {
        throw new ValidationError('Super admin cannot demote themselves');
      }

      // Update role
      targetUser.role = newRole;
      
      // Increment token version to force re-authentication with new role
      targetUser.tokenVersion += 1;
      
      await targetUser.save();

      logger.info('User role updated successfully', {
        adminUserId,
        targetUserId,
        oldRole: targetUser.role,
        newRole,
        action: 'update_user_role'
      });

      return targetUser;
    } catch (error) {
      logger.error('Failed to update user role', {
        adminUserId,
        targetUserId,
        newRole,
        error: error.message,
        action: 'update_user_role'
      });
      throw error;
    }
  }

  async deleteUser(adminUserId: string, targetUserId: string): Promise<boolean> {
    try {
      // Check if admin user exists and has permission
      const adminUser = await User.findById(adminUserId);
      if (!adminUser) {
        throw new AuthenticationError('Admin user not found');
      }

      if (adminUser.role !== UserRole.ADMIN && adminUser.role !== UserRole.SUPER_ADMIN) {
        throw new ForbiddenError('Insufficient permissions to delete user');
      }

      // Prevent self-deletion
      if (adminUserId === targetUserId) {
        throw new ValidationError('Cannot delete your own account');
      }

      // Find target user
      const targetUser = await User.findById(targetUserId);
      if (!targetUser) {
        throw new ValidationError('Target user not found');
      }

      // Admin cannot delete other admins or super admins
      if (adminUser.role === UserRole.ADMIN && 
          (targetUser.role === UserRole.ADMIN || targetUser.role === UserRole.SUPER_ADMIN)) {
        throw new ForbiddenError('Admin cannot delete other admin users');
      }

      // Delete user
      await User.findByIdAndDelete(targetUserId);

      logger.info('User deleted successfully', {
        adminUserId,
        targetUserId,
        deletedUserRole: targetUser.role,
        action: 'delete_user'
      });

      return true;
    } catch (error) {
      logger.error('Failed to delete user', {
        adminUserId,
        targetUserId,
        error: error.message,
        action: 'delete_user'
      });
      throw error;
    }
  }

  async getUserStats(): Promise<{
    totalUsers: number;
    verifiedUsers: number;
    adminUsers: number;
    recentUsers: number;
  }> {
    try {
      const [
        totalUsers,
        verifiedUsers,
        adminUsers,
        recentUsers
      ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ isEmailVerified: true }),
        User.countDocuments({ 
          role: { $in: [UserRole.ADMIN, UserRole.SUPER_ADMIN] } 
        }),
        User.countDocuments({
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
        })
      ]);

      const stats = {
        totalUsers,
        verifiedUsers,
        adminUsers,
        recentUsers
      };

      logger.info('User stats retrieved', {
        stats,
        action: 'get_user_stats'
      });

      return stats;
    } catch (error) {
      logger.error('Failed to get user stats', {
        error: error.message,
        action: 'get_user_stats'
      });
      throw error;
    }
  }

  async searchUsers(query: string, limit: number = 20): Promise<IUserDocument[]> {
    try {
      if (!query.trim()) {
        return [];
      }

      const searchRegex = new RegExp(query.trim(), 'i');
      
      const users = await User.find({
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { email: searchRegex }
        ]
      })
      .limit(limit)
      .sort({ createdAt: -1 })
      .exec();

      logger.info('User search completed', {
        query,
        resultCount: users.length,
        action: 'search_users'
      });

      return users;
    } catch (error) {
      logger.error('Failed to search users', {
        query,
        error: error.message,
        action: 'search_users'
      });
      throw error;
    }
  }
}

export const userService = new UserService();
