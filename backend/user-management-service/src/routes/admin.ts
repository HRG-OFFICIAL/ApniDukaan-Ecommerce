import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';

import AuthService from '../services/AuthService';
import UserService from '../services/UserService';
import RoleService from '../services/RoleService';

import {
  IUser,
  IRoleRequest,
  IRoleUpdateRequest,
  IUserSearchRequest,
  IUserBulkActionRequest,
  UserStatus,
  UserRole,
  RoleType,
  BulkAction
} from '../types/user.types';

import { logger } from '../utils/logger';

const router = express.Router();

// Initialize services
const authService = new AuthService();
const userService = new UserService();
const roleService = new RoleService();

// Admin-specific rate limiting
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs for admin endpoints
  message: {
    success: false,
    error: 'Too many admin requests, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});

// Authentication middleware
const authenticate = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    const sessionId = req.headers['x-session-id'] as string;

    if (!authHeader || !sessionId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const sessionValidation = await authService.validateSession(sessionId);

    if (!sessionValidation.valid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid session',
        code: 'INVALID_SESSION'
      });
    }

    req.user = sessionValidation.user;
    req.session = sessionValidation.session;
    next();
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication error',
      code: 'AUTHENTICATION_ERROR'
    });
  }
};

// Authorization middleware for admin roles
const requireAdminRole = (allowedRoles: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.ADMIN]) => {
  return async (req: any, res: any, next: any) => {
    try {
      const user = req.user;
      
      if (!user.roles || !user.roles.some((role: string) => allowedRoles.includes(role as UserRole))) {
        return res.status(403).json({
          success: false,
          error: 'Admin privileges required',
          code: 'ADMIN_ACCESS_DENIED'
        });
      }

      next();
    } catch (error) {
      logger.error('Admin authorization error:', error);
      res.status(500).json({
        success: false,
        error: 'Authorization error',
        code: 'AUTHORIZATION_ERROR'
      });
    }
  };
};

// Permission-based authorization
const requirePermission = (permission: string) => {
  return async (req: any, res: any, next: any) => {
    try {
      const hasPermission = await roleService.hasPermission(req.user.id, permission);
      
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          error: `Permission '${permission}' required`,
          code: 'INSUFFICIENT_PERMISSION'
        });
      }

      next();
    } catch (error) {
      logger.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        error: 'Permission check failed',
        code: 'AUTHORIZATION_ERROR'
      });
    }
  };
};

// ==================== USER MANAGEMENT ====================

/**
 * @route GET /api/admin/users
 * @desc Get all users with pagination and filtering
 * @access Admin
 */
router.get('/users',
  adminLimiter,
  authenticate,
  requireAdminRole([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MODERATOR]),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('search').optional().isString().trim(),
    query('status').optional().isIn(Object.values(UserStatus)),
    query('role').optional().isIn(Object.values(UserRole)),
    query('sortBy').optional().isIn(['createdAt', 'lastLoginAt', 'email', 'firstName', 'lastName']),
    query('sortOrder').optional().isIn(['asc', 'desc'])
  ],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const searchParams: IUserSearchRequest = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        search: req.query.search,
        status: req.query.status as UserStatus,
        role: req.query.role as UserRole,
        sortBy: req.query.sortBy || 'createdAt',
        sortOrder: req.query.sortOrder || 'desc',
        startDate: req.query.startDate ? new Date(req.query.startDate) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate) : undefined,
        isEmailVerified: req.query.isEmailVerified === 'true',
        hasMfaEnabled: req.query.hasMfaEnabled === 'true'
      };

      const result = await userService.searchUsers(searchParams);
      
      res.json({
        ...result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Get users error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve users',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * @route GET /api/admin/users/:userId
 * @desc Get user details by ID
 * @access Admin
 */
router.get('/users/:userId',
  authenticate,
  requireAdminRole([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MODERATOR]),
  param('userId').isMongoId().withMessage('Valid user ID is required'),
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const result = await userService.getUserById(req.params.userId, true); // Include sensitive data
      
      if (!result.success) {
        return res.status(404).json({
          ...result,
          timestamp: new Date().toISOString()
        });
      }

      res.json({
        success: true,
        data: { user: result.user },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Get user details error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get user details',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * @route PUT /api/admin/users/:userId
 * @desc Update user details (admin override)
 * @access Admin
 */
router.put('/users/:userId',
  authenticate,
  requireAdminRole([UserRole.SUPER_ADMIN, UserRole.ADMIN]),
  requirePermission('users.update'),
  param('userId').isMongoId().withMessage('Valid user ID is required'),
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const result = await userService.updateUserAsAdmin(req.params.userId, req.body, req.user.id);
      
      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json({
        ...result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Update user error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update user',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * @route POST /api/admin/users/:userId/activate
 * @desc Activate user account
 * @access Admin
 */
router.post('/users/:userId/activate',
  authenticate,
  requireAdminRole([UserRole.SUPER_ADMIN, UserRole.ADMIN]),
  requirePermission('users.activate'),
  param('userId').isMongoId().withMessage('Valid user ID is required'),
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const result = await userService.reactivateUser(req.params.userId, req.user.id);
      
      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json({
        ...result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Activate user error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to activate user',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * @route POST /api/admin/users/:userId/suspend
 * @desc Suspend user account
 * @access Admin
 */
router.post('/users/:userId/suspend',
  authenticate,
  requireAdminRole([UserRole.SUPER_ADMIN, UserRole.ADMIN]),
  requirePermission('users.suspend'),
  [
    param('userId').isMongoId().withMessage('Valid user ID is required'),
    body('reason').notEmpty().withMessage('Suspension reason is required'),
    body('duration').optional().isInt({ min: 1 }).withMessage('Duration must be positive number of days')
  ],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const result = await userService.suspendUser(
        req.params.userId,
        req.body.reason,
        req.body.duration,
        req.user.id
      );
      
      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json({
        ...result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Suspend user error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to suspend user',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * @route DELETE /api/admin/users/:userId
 * @desc Delete user account
 * @access Super Admin
 */
router.delete('/users/:userId',
  authenticate,
  requireAdminRole([UserRole.SUPER_ADMIN]),
  requirePermission('users.delete'),
  [
    param('userId').isMongoId().withMessage('Valid user ID is required'),
    body('reason').notEmpty().withMessage('Deletion reason is required'),
    body('confirmation').equals('DELETE').withMessage('Confirmation must be "DELETE"')
  ],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      // Prevent deleting yourself
      if (req.params.userId === req.user.id) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete your own account',
          code: 'CANNOT_DELETE_SELF'
        });
      }

      const result = await userService.deleteUser(req.params.userId, req.body.reason, req.user.id);
      
      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json({
        ...result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Delete user error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete user',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * @route POST /api/admin/users/bulk-action
 * @desc Perform bulk actions on users
 * @access Admin
 */
router.post('/users/bulk-action',
  authenticate,
  requireAdminRole([UserRole.SUPER_ADMIN, UserRole.ADMIN]),
  requirePermission('users.bulk_action'),
  [
    body('action').isIn(Object.values(BulkAction)).withMessage('Valid bulk action is required'),
    body('userIds').isArray({ min: 1 }).withMessage('User IDs array is required'),
    body('userIds.*').isMongoId().withMessage('Valid user IDs are required'),
    body('reason').optional().isString().withMessage('Reason must be a string')
  ],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      // Prevent bulk actions on yourself
      if (req.body.userIds.includes(req.user.id)) {
        return res.status(400).json({
          success: false,
          error: 'Cannot perform bulk actions on your own account',
          code: 'CANNOT_BULK_ACTION_SELF'
        });
      }

      const bulkRequest: IUserBulkActionRequest = {
        action: req.body.action,
        userIds: req.body.userIds,
        reason: req.body.reason,
        metadata: req.body.metadata
      };

      const result = await userService.performBulkAction(bulkRequest, req.user.id);
      
      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json({
        ...result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Bulk action error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to perform bulk action',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

// ==================== ROLE MANAGEMENT ====================

/**
 * @route GET /api/admin/roles
 * @desc Get all roles
 * @access Admin
 */
router.get('/roles',
  authenticate,
  requireAdminRole([UserRole.SUPER_ADMIN, UserRole.ADMIN]),
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('type').optional().isIn(Object.values(RoleType))
  ],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const result = await roleService.getRoles({
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        type: req.query.type as RoleType
      });
      
      res.json({
        ...result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Get roles error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get roles',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * @route POST /api/admin/roles
 * @desc Create a new role
 * @access Super Admin
 */
router.post('/roles',
  authenticate,
  requireAdminRole([UserRole.SUPER_ADMIN]),
  requirePermission('roles.create'),
  [
    body('name').trim().isLength({ min: 1, max: 50 }).withMessage('Role name is required (1-50 characters)'),
    body('displayName').trim().isLength({ min: 1, max: 100 }).withMessage('Display name is required (1-100 characters)'),
    body('description').optional().isLength({ max: 200 }).withMessage('Description must be less than 200 characters'),
    body('type').isIn(Object.values(RoleType)).withMessage('Valid role type is required'),
    body('permissions').isArray().withMessage('Permissions must be an array'),
    body('permissions.*').isString().withMessage('Each permission must be a string'),
    body('isActive').optional().isBoolean().withMessage('isActive must be boolean')
  ],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const roleData: IRoleRequest = {
        name: req.body.name,
        displayName: req.body.displayName,
        description: req.body.description,
        type: req.body.type,
        permissions: req.body.permissions,
        isActive: req.body.isActive !== false,
        metadata: req.body.metadata
      };

      const result = await roleService.createRole(roleData, req.user.id);
      
      const statusCode = result.success ? 201 : 400;
      res.status(statusCode).json({
        ...result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Create role error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create role',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * @route PUT /api/admin/roles/:roleId
 * @desc Update role
 * @access Super Admin
 */
router.put('/roles/:roleId',
  authenticate,
  requireAdminRole([UserRole.SUPER_ADMIN]),
  requirePermission('roles.update'),
  param('roleId').isMongoId().withMessage('Valid role ID is required'),
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const updateData: IRoleUpdateRequest = {
        displayName: req.body.displayName,
        description: req.body.description,
        permissions: req.body.permissions,
        isActive: req.body.isActive,
        metadata: req.body.metadata
      };

      const result = await roleService.updateRole(req.params.roleId, updateData, req.user.id);
      
      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json({
        ...result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Update role error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update role',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * @route DELETE /api/admin/roles/:roleId
 * @desc Delete role
 * @access Super Admin
 */
router.delete('/roles/:roleId',
  authenticate,
  requireAdminRole([UserRole.SUPER_ADMIN]),
  requirePermission('roles.delete'),
  [
    param('roleId').isMongoId().withMessage('Valid role ID is required'),
    body('confirmation').equals('DELETE').withMessage('Confirmation must be "DELETE"')
  ],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const result = await roleService.deleteRole(req.params.roleId, req.user.id);
      
      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json({
        ...result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Delete role error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete role',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

// ==================== ROLE ASSIGNMENT ====================

/**
 * @route POST /api/admin/users/:userId/roles/:roleId
 * @desc Assign role to user
 * @access Admin
 */
router.post('/users/:userId/roles/:roleId',
  authenticate,
  requireAdminRole([UserRole.SUPER_ADMIN, UserRole.ADMIN]),
  requirePermission('roles.assign'),
  [
    param('userId').isMongoId().withMessage('Valid user ID is required'),
    param('roleId').isMongoId().withMessage('Valid role ID is required')
  ],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      // Check if assigner can assign this role
      const canAssign = await roleService.canAssignRole(req.user.id, req.params.roleId);
      if (!canAssign) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions to assign this role',
          code: 'CANNOT_ASSIGN_ROLE'
        });
      }

      const result = await roleService.assignRole(
        req.params.userId,
        req.params.roleId,
        req.user.id
      );
      
      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json({
        ...result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Assign role error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to assign role',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * @route DELETE /api/admin/users/:userId/roles/:roleId
 * @desc Remove role from user
 * @access Admin
 */
router.delete('/users/:userId/roles/:roleId',
  authenticate,
  requireAdminRole([UserRole.SUPER_ADMIN, UserRole.ADMIN]),
  requirePermission('roles.remove'),
  [
    param('userId').isMongoId().withMessage('Valid user ID is required'),
    param('roleId').isMongoId().withMessage('Valid role ID is required')
  ],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const result = await roleService.removeRole(
        req.params.userId,
        req.params.roleId,
        req.user.id
      );
      
      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json({
        ...result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Remove role error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to remove role',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

// ==================== ANALYTICS & REPORTING ====================

/**
 * @route GET /api/admin/analytics/users
 * @desc Get user analytics
 * @access Admin
 */
router.get('/analytics/users',
  authenticate,
  requireAdminRole([UserRole.SUPER_ADMIN, UserRole.ADMIN]),
  requirePermission('analytics.view'),
  [
    query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Valid period is required'),
    query('startDate').optional().isISO8601().withMessage('Valid start date is required'),
    query('endDate').optional().isISO8601().withMessage('Valid end date is required')
  ],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const analyticsParams = {
        period: req.query.period || '30d',
        startDate: req.query.startDate ? new Date(req.query.startDate) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate) : undefined
      };

      const result = await userService.getUserAnalytics(analyticsParams);
      
      res.json({
        ...result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Get user analytics error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get user analytics',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * @route GET /api/admin/audit/logs
 * @desc Get audit logs
 * @access Super Admin
 */
router.get('/audit/logs',
  authenticate,
  requireAdminRole([UserRole.SUPER_ADMIN]),
  requirePermission('audit.view'),
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('action').optional().isString(),
    query('userId').optional().isMongoId(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
  ],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const auditParams = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 50,
        action: req.query.action,
        userId: req.query.userId,
        startDate: req.query.startDate ? new Date(req.query.startDate) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate) : undefined
      };

      const result = await userService.getAuditLogs(auditParams);
      
      res.json({
        ...result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Get audit logs error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get audit logs',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

// ==================== SYSTEM CONFIGURATION ====================

/**
 * @route GET /api/admin/system/permissions
 * @desc Get available permissions
 * @access Admin
 */
router.get('/system/permissions',
  authenticate,
  requireAdminRole([UserRole.SUPER_ADMIN, UserRole.ADMIN]),
  async (req: any, res) => {
    try {
      const result = await roleService.getAvailablePermissions();
      
      res.json({
        success: true,
        data: { permissions: result },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Get permissions error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get permissions',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * @route POST /api/admin/system/cache/clear
 * @desc Clear system cache
 * @access Super Admin
 */
router.post('/system/cache/clear',
  authenticate,
  requireAdminRole([UserRole.SUPER_ADMIN]),
  requirePermission('system.cache_clear'),
  async (req: any, res) => {
    try {
      const result = await userService.clearSystemCache(req.user.id);
      
      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json({
        ...result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Clear cache error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to clear cache',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

// ==================== ERROR HANDLING ====================

router.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Admin router error:', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method
  });

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
});

export default router;
