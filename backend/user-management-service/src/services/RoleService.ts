import { Types } from 'mongoose';
import { createClient } from 'redis';

import User from '../models/User';
import { Role, Permission } from '../models/Role';
import {
  IRoleService,
  IRole,
  IPermission,
  AccountAction,
  UserRole
} from '../types/user.types';

import { logger } from '../utils/logger';

export class RoleService implements IRoleService {
  private redisClient: any;

  constructor() {
    this.initializeRedis();
    this.initializeDefaultRoles();
  }

  private async initializeRedis(): Promise<void> {
    try {
      this.redisClient = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      });
      await this.redisClient.connect();
      logger.info('Redis connected for RoleService');
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      this.redisClient = null;
    }
  }

  private async initializeDefaultRoles(): Promise<void> {
    try {
      // Wait a bit for the database connection to be established
      setTimeout(async () => {
        await this.createDefaultPermissions();
        await this.createDefaultRoles();
      }, 2000);
    } catch (error) {
      logger.error('Failed to initialize default roles:', error);
    }
  }

  // ==================== ROLE MANAGEMENT ====================

  async createRole(roleData: Partial<IRole>): Promise<{ success: boolean; role?: IRole; error?: string }> {
    try {
      // Validate role data
      if (!roleData.name || !roleData.description) {
        return {
          success: false,
          error: 'Role name and description are required'
        };
      }

      // Check if role already exists
      const existingRole = await Role.findByName(roleData.name);
      if (existingRole) {
        return {
          success: false,
          error: 'Role with this name already exists'
        };
      }

      // Validate permissions if provided
      if (roleData.permissions && roleData.permissions.length > 0) {
        const permissionIds = roleData.permissions.map(p => 
          typeof p === 'string' ? new Types.ObjectId(p) : p
        );
        
        const validPermissions = await Permission.find({
          _id: { $in: permissionIds },
          isActive: true
        });

        if (validPermissions.length !== permissionIds.length) {
          return {
            success: false,
            error: 'One or more permissions are invalid'
          };
        }
      }

      // Create role
      const role = new Role({
        name: roleData.name.toUpperCase(),
        description: roleData.description,
        permissions: roleData.permissions || [],
        hierarchy: roleData.hierarchy || 50,
        isSystem: roleData.isSystem || false,
        isActive: roleData.isActive !== undefined ? roleData.isActive : true,
        metadata: roleData.metadata || {},
        createdBy: roleData.createdBy
      });

      await role.save();

      // Clear cache
      if (this.redisClient) {
        await this.clearRoleCache();
      }

      logger.info('Role created successfully', { roleId: role._id, name: role.name });

      return {
        success: true,
        role: role.toJSON()
      };

    } catch (error: any) {
      logger.error('Failed to create role:', error);
      return {
        success: false,
        error: 'Failed to create role'
      };
    }
  }

  async updateRole(roleId: string, roleData: Partial<IRole>): Promise<{ success: boolean; role?: IRole; error?: string }> {
    try {
      const role = await Role.findById(roleId);
      if (!role) {
        return {
          success: false,
          error: 'Role not found'
        };
      }

      // Prevent modification of system roles
      if (role.isSystem && roleData.isSystem === false) {
        return {
          success: false,
          error: 'Cannot modify system role properties'
        };
      }

      // Update fields
      if (roleData.name && roleData.name !== role.name) {
        const existingRole = await Role.findByName(roleData.name);
        if (existingRole && existingRole._id.toString() !== roleId) {
          return {
            success: false,
            error: 'Role with this name already exists'
          };
        }
        role.name = roleData.name.toUpperCase();
      }

      if (roleData.description) {
        role.description = roleData.description;
      }

      if (roleData.hierarchy !== undefined) {
        role.hierarchy = roleData.hierarchy;
      }

      if (roleData.isActive !== undefined) {
        role.isActive = roleData.isActive;
      }

      if (roleData.metadata) {
        role.metadata = { ...role.metadata, ...roleData.metadata };
      }

      if (roleData.permissions) {
        const permissionIds = roleData.permissions.map(p => 
          typeof p === 'string' ? new Types.ObjectId(p) : p
        );
        
        const validPermissions = await Permission.find({
          _id: { $in: permissionIds },
          isActive: true
        });

        if (validPermissions.length !== permissionIds.length) {
          return {
            success: false,
            error: 'One or more permissions are invalid'
          };
        }

        role.permissions = permissionIds as any;
      }

      role.updatedBy = roleData.updatedBy;
      await role.save();

      // Clear cache
      if (this.redisClient) {
        await this.clearRoleCache();
      }

      logger.info('Role updated successfully', { roleId, name: role.name });

      return {
        success: true,
        role: role.toJSON()
      };

    } catch (error: any) {
      logger.error('Failed to update role:', error);
      return {
        success: false,
        error: 'Failed to update role'
      };
    }
  }

  async deleteRole(roleId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const role = await Role.findById(roleId);
      if (!role) {
        return {
          success: false,
          error: 'Role not found'
        };
      }

      // Prevent deletion of system roles
      if (role.isSystem) {
        return {
          success: false,
          error: 'Cannot delete system roles'
        };
      }

      // Check if any users have this role
      const usersWithRole = await User.countDocuments({
        roles: { $in: [role.name.toLowerCase()] }
      });

      if (usersWithRole > 0) {
        return {
          success: false,
          error: `Cannot delete role. ${usersWithRole} users currently have this role.`
        };
      }

      // Soft delete (deactivate)
      role.isActive = false;
      await role.save();

      // Clear cache
      if (this.redisClient) {
        await this.clearRoleCache();
      }

      logger.info('Role deleted successfully', { roleId, name: role.name });

      return {
        success: true
      };

    } catch (error: any) {
      logger.error('Failed to delete role:', error);
      return {
        success: false,
        error: 'Failed to delete role'
      };
    }
  }

  // ==================== USER ROLE ASSIGNMENT ====================

  async assignRole(userId: string, roleId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      const role = await Role.findById(roleId);
      if (!role || !role.isActive) {
        return {
          success: false,
          error: 'Role not found or inactive'
        };
      }

      const roleName = role.name.toLowerCase();
      
      // Check if user already has this role
      if ((user as any).hasRole(roleName)) {
        return {
          success: false,
          error: 'User already has this role'
        };
      }

      // Add role to user
      (user as any).addRole(roleName);

      // Log role assignment
      (user as any).addActivity({
        action: AccountAction.ROLE_CHANGE,
        timestamp: new Date(),
        success: true,
        metadata: {
          action: 'assign',
          role: roleName,
          assignedBy: 'system' // This should be passed from the request context
        }
      });

      await user.save();

      // Clear user cache
      if (this.redisClient) {
        await this.redisClient.del(`user:${userId}`);
        await this.redisClient.del(`user_permissions:${userId}`);
      }

      logger.info('Role assigned successfully', { userId, roleId, roleName });

      return {
        success: true
      };

    } catch (error: any) {
      logger.error('Failed to assign role:', error);
      return {
        success: false,
        error: 'Failed to assign role'
      };
    }
  }

  async removeRole(userId: string, roleId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      const role = await Role.findById(roleId);
      if (!role) {
        return {
          success: false,
          error: 'Role not found'
        };
      }

      const roleName = role.name.toLowerCase();
      
      // Check if user has this role
      if (!(user as any).hasRole(roleName)) {
        return {
          success: false,
          error: 'User does not have this role'
        };
      }

      // Prevent removal of last role
      if (user.roles.length === 1) {
        return {
          success: false,
          error: 'Cannot remove the last role from user'
        };
      }

      // Remove role from user
      (user as any).removeRole(roleName);

      // Log role removal
      (user as any).addActivity({
        action: AccountAction.ROLE_CHANGE,
        timestamp: new Date(),
        success: true,
        metadata: {
          action: 'remove',
          role: roleName,
          removedBy: 'system' // This should be passed from the request context
        }
      });

      await user.save();

      // Clear user cache
      if (this.redisClient) {
        await this.redisClient.del(`user:${userId}`);
        await this.redisClient.del(`user_permissions:${userId}`);
      }

      logger.info('Role removed successfully', { userId, roleId, roleName });

      return {
        success: true
      };

    } catch (error: any) {
      logger.error('Failed to remove role:', error);
      return {
        success: false,
        error: 'Failed to remove role'
      };
    }
  }

  // ==================== PERMISSION MANAGEMENT ====================

  async getUserPermissions(userId: string): Promise<{ success: boolean; permissions?: string[]; error?: string }> {
    try {
      // Check cache first
      if (this.redisClient) {
        const cached = await this.redisClient.get(`user_permissions:${userId}`);
        if (cached) {
          return {
            success: true,
            permissions: JSON.parse(cached)
          };
        }
      }

      const user = await User.findById(userId);
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Get all roles for the user
      const userRoleNames = user.roles.map(role => role.toUpperCase());
      const roles = await Role.find({
        name: { $in: userRoleNames },
        isActive: true
      }).populate('permissions');

      // Collect all unique permissions
      const permissionSet = new Set<string>();
      
      for (const role of roles) {
        for (const permission of role.permissions as IPermission[]) {
          if (permission.isActive) {
            permissionSet.add(permission.name);
          }
        }
      }

      const permissions = Array.from(permissionSet);

      // Cache permissions for 30 minutes
      if (this.redisClient) {
        await this.redisClient.setEx(`user_permissions:${userId}`, 1800, JSON.stringify(permissions));
      }

      return {
        success: true,
        permissions
      };

    } catch (error: any) {
      logger.error('Failed to get user permissions:', error);
      return {
        success: false,
        error: 'Failed to retrieve user permissions'
      };
    }
  }

  async hasPermission(userId: string, permission: string): Promise<boolean> {
    try {
      const result = await this.getUserPermissions(userId);
      if (!result.success || !result.permissions) {
        return false;
      }

      return result.permissions.includes(permission);
    } catch (error) {
      logger.error('Failed to check permission:', error);
      return false;
    }
  }

  // ==================== PERMISSION CRUD ====================

  async createPermission(permissionData: Partial<IPermission>): Promise<{ success: boolean; permission?: IPermission; error?: string }> {
    try {
      // Validate permission data
      if (!permissionData.name || !permissionData.description || !permissionData.resource || !permissionData.action) {
        return {
          success: false,
          error: 'Name, description, resource, and action are required'
        };
      }

      // Check if permission already exists
      const existingPermission = await Permission.findOne({
        name: permissionData.name.toLowerCase()
      });

      if (existingPermission) {
        return {
          success: false,
          error: 'Permission with this name already exists'
        };
      }

      // Create permission
      const permission = new Permission({
        name: permissionData.name.toLowerCase(),
        description: permissionData.description,
        resource: permissionData.resource.toLowerCase(),
        action: permissionData.action.toLowerCase(),
        attributes: permissionData.attributes || [],
        conditions: permissionData.conditions || {},
        category: permissionData.category || 'general',
        isActive: permissionData.isActive !== undefined ? permissionData.isActive : true,
        createdBy: permissionData.createdBy
      });

      await permission.save();

      // Clear cache
      if (this.redisClient) {
        await this.clearPermissionCache();
      }

      logger.info('Permission created successfully', { permissionId: permission._id, name: permission.name });

      return {
        success: true,
        permission: permission.toJSON()
      };

    } catch (error: any) {
      logger.error('Failed to create permission:', error);
      return {
        success: false,
        error: 'Failed to create permission'
      };
    }
  }

  async updatePermission(permissionId: string, permissionData: Partial<IPermission>): Promise<{ success: boolean; permission?: IPermission; error?: string }> {
    try {
      const permission = await Permission.findById(permissionId);
      if (!permission) {
        return {
          success: false,
          error: 'Permission not found'
        };
      }

      // Update fields
      if (permissionData.name && permissionData.name !== permission.name) {
        const existingPermission = await Permission.findOne({
          name: permissionData.name.toLowerCase(),
          _id: { $ne: permissionId }
        });
        if (existingPermission) {
          return {
            success: false,
            error: 'Permission with this name already exists'
          };
        }
        permission.name = permissionData.name.toLowerCase();
      }

      if (permissionData.description) {
        permission.description = permissionData.description;
      }

      if (permissionData.resource) {
        permission.resource = permissionData.resource.toLowerCase();
      }

      if (permissionData.action) {
        permission.action = permissionData.action.toLowerCase();
      }

      if (permissionData.attributes) {
        permission.attributes = permissionData.attributes;
      }

      if (permissionData.conditions) {
        permission.conditions = permissionData.conditions;
      }

      if (permissionData.category) {
        permission.category = permissionData.category;
      }

      if (permissionData.isActive !== undefined) {
        permission.isActive = permissionData.isActive;
      }

      permission.updatedBy = permissionData.updatedBy;
      await permission.save();

      // Clear cache
      if (this.redisClient) {
        await this.clearPermissionCache();
        await this.clearUserPermissionCache();
      }

      logger.info('Permission updated successfully', { permissionId, name: permission.name });

      return {
        success: true,
        permission: permission.toJSON()
      };

    } catch (error: any) {
      logger.error('Failed to update permission:', error);
      return {
        success: false,
        error: 'Failed to update permission'
      };
    }
  }

  // ==================== BULK OPERATIONS ====================

  async getRoles(query: any = {}): Promise<{ success: boolean; roles?: any[]; total?: number; error?: string }> {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        isSystem,
        isActive = true,
        sort = { field: 'hierarchy', direction: 'desc' }
      } = query;

      const filter: any = {};

      if (isSystem !== undefined) {
        filter.isSystem = isSystem;
      }

      if (isActive !== undefined) {
        filter.isActive = isActive;
      }

      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      const sortField = sort.field || 'hierarchy';
      const sortDirection = sort.direction === 'asc' ? 1 : -1;

      const [roles, total] = await Promise.all([
        Role.find(filter)
          .populate('permissions')
          .sort({ [sortField]: sortDirection })
          .limit(limit * 1)
          .skip((page - 1) * limit)
          .lean(),
        Role.countDocuments(filter)
      ]);

      return {
        success: true,
        roles,
        total
      };

    } catch (error: any) {
      logger.error('Failed to get roles:', error);
      return {
        success: false,
        error: 'Failed to retrieve roles'
      };
    }
  }

  async getPermissions(query: any = {}): Promise<{ success: boolean; permissions?: any[]; total?: number; error?: string }> {
    try {
      const {
        page = 1,
        limit = 50,
        search,
        resource,
        action,
        category,
        isActive = true,
        sort = { field: 'name', direction: 'asc' }
      } = query;

      const filter: any = {};

      if (isActive !== undefined) {
        filter.isActive = isActive;
      }

      if (resource) {
        filter.resource = resource.toLowerCase();
      }

      if (action) {
        filter.action = action.toLowerCase();
      }

      if (category) {
        filter.category = category;
      }

      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { resource: { $regex: search, $options: 'i' } }
        ];
      }

      const sortField = sort.field || 'name';
      const sortDirection = sort.direction === 'asc' ? 1 : -1;

      const [permissions, total] = await Promise.all([
        Permission.find(filter)
          .sort({ [sortField]: sortDirection })
          .limit(limit * 1)
          .skip((page - 1) * limit)
          .lean(),
        Permission.countDocuments(filter)
      ]);

      return {
        success: true,
        permissions,
        total
      };

    } catch (error: any) {
      logger.error('Failed to get permissions:', error);
      return {
        success: false,
        error: 'Failed to retrieve permissions'
      };
    }
  }

  // ==================== UTILITY METHODS ====================

  private async clearRoleCache(): Promise<void> {
    if (!this.redisClient) return;
    
    try {
      const keys = await this.redisClient.keys('role:*');
      if (keys.length > 0) {
        await this.redisClient.del(keys);
      }
      await this.clearUserPermissionCache();
    } catch (error) {
      logger.warn('Failed to clear role cache:', error);
    }
  }

  private async clearPermissionCache(): Promise<void> {
    if (!this.redisClient) return;
    
    try {
      const keys = await this.redisClient.keys('permission:*');
      if (keys.length > 0) {
        await this.redisClient.del(keys);
      }
    } catch (error) {
      logger.warn('Failed to clear permission cache:', error);
    }
  }

  private async clearUserPermissionCache(): Promise<void> {
    if (!this.redisClient) return;
    
    try {
      const keys = await this.redisClient.keys('user_permissions:*');
      if (keys.length > 0) {
        await this.redisClient.del(keys);
      }
    } catch (error) {
      logger.warn('Failed to clear user permission cache:', error);
    }
  }

  // ==================== DEFAULT ROLES & PERMISSIONS ====================

  private async createDefaultPermissions(): Promise<void> {
    const defaultPermissions = [
      // User Management
      { name: 'user_read', description: 'View user profiles', resource: 'user', action: 'read', category: 'user_management' },
      { name: 'user_update', description: 'Update user profiles', resource: 'user', action: 'update', category: 'user_management' },
      { name: 'user_delete', description: 'Delete user accounts', resource: 'user', action: 'delete', category: 'user_management' },
      { name: 'user_manage', description: 'Full user management access', resource: 'user', action: 'manage', category: 'user_management' },
      
      // Order Management
      { name: 'order_read', description: 'View orders', resource: 'order', action: 'read', category: 'order_management' },
      { name: 'order_create', description: 'Create orders', resource: 'order', action: 'create', category: 'order_management' },
      { name: 'order_update', description: 'Update orders', resource: 'order', action: 'update', category: 'order_management' },
      { name: 'order_delete', description: 'Cancel orders', resource: 'order', action: 'delete', category: 'order_management' },
      { name: 'order_manage', description: 'Full order management access', resource: 'order', action: 'manage', category: 'order_management' },
      
      // Product Management
      { name: 'product_read', description: 'View products', resource: 'product', action: 'read', category: 'product_management' },
      { name: 'product_create', description: 'Create products', resource: 'product', action: 'create', category: 'product_management' },
      { name: 'product_update', description: 'Update products', resource: 'product', action: 'update', category: 'product_management' },
      { name: 'product_delete', description: 'Delete products', resource: 'product', action: 'delete', category: 'product_management' },
      { name: 'product_manage', description: 'Full product management access', resource: 'product', action: 'manage', category: 'product_management' },
      
      // System Administration
      { name: 'admin_read', description: 'View admin panel', resource: 'admin', action: 'read', category: 'administration' },
      { name: 'admin_manage', description: 'Full admin access', resource: 'admin', action: 'manage', category: 'administration' },
      { name: 'system_config', description: 'Configure system settings', resource: 'system', action: 'manage', category: 'administration' },
      
      // Role & Permission Management
      { name: 'role_read', description: 'View roles and permissions', resource: 'role', action: 'read', category: 'rbac' },
      { name: 'role_create', description: 'Create roles', resource: 'role', action: 'create', category: 'rbac' },
      { name: 'role_update', description: 'Update roles', resource: 'role', action: 'update', category: 'rbac' },
      { name: 'role_delete', description: 'Delete roles', resource: 'role', action: 'delete', category: 'rbac' },
      { name: 'role_manage', description: 'Full role management access', resource: 'role', action: 'manage', category: 'rbac' }
    ];

    for (const permData of defaultPermissions) {
      try {
        const existing = await Permission.findOne({ name: permData.name });
        if (!existing) {
          await new Permission({
            ...permData,
            isActive: true,
            createdBy: 'system'
          }).save();
          logger.info(`Created default permission: ${permData.name}`);
        }
      } catch (error) {
        logger.error(`Failed to create permission ${permData.name}:`, error);
      }
    }
  }

  private async createDefaultRoles(): Promise<void> {
    // Get permission IDs
    const permissions = await Permission.find({ isActive: true });
    const getPermissionIds = (names: string[]) => {
      return permissions.filter(p => names.includes(p.name)).map(p => p._id);
    };

    const defaultRoles = [
      {
        name: 'SUPER_ADMIN',
        description: 'Super Administrator with full system access',
        permissions: permissions.map(p => p._id), // All permissions
        hierarchy: 100,
        isSystem: true
      },
      {
        name: 'ADMIN',
        description: 'Administrator with management access',
        permissions: getPermissionIds([
          'user_read', 'user_update', 'user_manage',
          'order_read', 'order_update', 'order_manage',
          'product_read', 'product_create', 'product_update', 'product_delete',
          'admin_read', 'role_read'
        ]),
        hierarchy: 90,
        isSystem: true
      },
      {
        name: 'MANAGER',
        description: 'Manager with operational access',
        permissions: getPermissionIds([
          'user_read', 'user_update',
          'order_read', 'order_update',
          'product_read', 'product_update'
        ]),
        hierarchy: 70,
        isSystem: true
      },
      {
        name: 'CUSTOMER',
        description: 'Regular customer with basic access',
        permissions: getPermissionIds([
          'user_read', 'user_update',
          'order_read', 'order_create',
          'product_read'
        ]),
        hierarchy: 10,
        isSystem: true
      },
      {
        name: 'GUEST',
        description: 'Guest user with minimal access',
        permissions: getPermissionIds([
          'product_read'
        ]),
        hierarchy: 1,
        isSystem: true
      }
    ];

    for (const roleData of defaultRoles) {
      try {
        const existing = await Role.findOne({ name: roleData.name });
        if (!existing) {
          await new Role({
            ...roleData,
            isActive: true,
            createdBy: 'system'
          }).save();
          logger.info(`Created default role: ${roleData.name}`);
        } else {
          // Update permissions for existing system roles
          existing.permissions = roleData.permissions;
          await existing.save();
          logger.info(`Updated permissions for role: ${roleData.name}`);
        }
      } catch (error) {
        logger.error(`Failed to create role ${roleData.name}:`, error);
      }
    }
  }

  // ==================== ROLE HIERARCHY & VALIDATION ====================

  async canAssignRole(assignerUserId: string, targetRoleId: string): Promise<boolean> {
    try {
      const assignerUser = await User.findById(assignerUserId);
      const targetRole = await Role.findById(targetRoleId);

      if (!assignerUser || !targetRole) {
        return false;
      }

      // Get assigner's highest role hierarchy
      const assignerRoleNames = assignerUser.roles.map(role => role.toUpperCase());
      const assignerRoles = await Role.find({
        name: { $in: assignerRoleNames },
        isActive: true
      });

      const maxHierarchy = Math.max(...assignerRoles.map(role => role.hierarchy));

      // Can only assign roles with lower hierarchy
      return maxHierarchy > targetRole.hierarchy;

    } catch (error) {
      logger.error('Failed to check role assignment permission:', error);
      return false;
    }
  }

  async getUsersByRole(roleName: string): Promise<{ success: boolean; users?: any[]; error?: string }> {
    try {
      const users = await User.find({
        roles: { $in: [roleName.toLowerCase()] },
        status: { $ne: 'deactivated' }
      })
      .select('email profile.firstName profile.lastName status roles createdAt lastActive')
      .lean();

      return {
        success: true,
        users
      };

    } catch (error: any) {
      logger.error('Failed to get users by role:', error);
      return {
        success: false,
        error: 'Failed to retrieve users'
      };
    }
  }
}

export default RoleService;
