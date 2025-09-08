import mongoose, { Schema, Document, Model } from 'mongoose';
import { logger } from '../../shared/src/utils/logger';

export interface IPermission extends Document {
  _id: string;
  name: string;
  resource: string;
  action: string;
  displayName: string;
  description: string;
  category: string;
  isSystemPermission: boolean;
  conditions?: {
    [key: string]: any; // Dynamic conditions for contextual permissions
  };
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;

  // Methods
  matches(resource: string, action: string): boolean;
  checkConditions(context: any): boolean;
}

export interface IPermissionModel extends Model<IPermission> {
  // Static methods
  findByName(name: string): Promise<IPermission | null>;
  findByResource(resource: string): Promise<IPermission[]>;
  findByCategory(category: string): Promise<IPermission[]>;
  createSystemPermissions(): Promise<void>;
  validatePermissionName(name: string): boolean;
}

const PermissionSchema = new Schema<IPermission>({
  name: {
    type: String,
    required: [true, 'Permission name is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[a-z_:*]+$/, 'Permission name must be in format: resource:action or resource:*'],
    minlength: [3, 'Permission name must be at least 3 characters'],
    maxlength: [100, 'Permission name cannot exceed 100 characters']
  },
  resource: {
    type: String,
    required: [true, 'Resource is required'],
    trim: true,
    lowercase: true,
    match: [/^[a-z_]+$/, 'Resource can only contain lowercase letters and underscores']
  },
  action: {
    type: String,
    required: [true, 'Action is required'],
    trim: true,
    lowercase: true,
    match: [/^[a-z_*]+$/, 'Action can only contain lowercase letters, underscores, and asterisk']
  },
  displayName: {
    type: String,
    required: [true, 'Display name is required'],
    trim: true,
    minlength: [3, 'Display name must be at least 3 characters'],
    maxlength: [100, 'Display name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    lowercase: true,
    enum: {
      values: [
        'product',
        'category',
        'review',
        'user',
        'order',
        'cart',
        'profile',
        'wishlist',
        'analytics',
        'system',
        'payment',
        'shipping',
        'inventory',
        'content',
        'marketing',
        'security',
        'api'
      ],
      message: 'Invalid permission category'
    }
  },
  isSystemPermission: {
    type: Boolean,
    default: false
  },
  conditions: {
    type: Map,
    of: Schema.Types.Mixed,
    default: new Map()
  },
  active: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: String,
    required: [true, 'Creator ID is required']
  },
  updatedBy: {
    type: String
  }
}, {
  timestamps: true,
  toJSON: {
    transform(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      
      // Convert Map to Object for JSON
      if (ret.conditions) {
        ret.conditions = Object.fromEntries(ret.conditions);
      }
      
      return ret;
    }
  },
  toObject: {
    transform(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      
      // Convert Map to Object
      if (ret.conditions) {
        ret.conditions = Object.fromEntries(ret.conditions);
      }
      
      return ret;
    }
  }
});

// Indexes
PermissionSchema.index({ name: 1 }, { unique: true });
PermissionSchema.index({ resource: 1, action: 1 });
PermissionSchema.index({ category: 1 });
PermissionSchema.index({ active: 1 });
PermissionSchema.index({ isSystemPermission: 1 });

// Instance methods
PermissionSchema.methods.matches = function(resource: string, action: string): boolean {
  // Exact match
  if (this.resource === resource && this.action === action) {
    return true;
  }

  // Wildcard action match
  if (this.resource === resource && this.action === '*') {
    return true;
  }

  // Global wildcard
  if (this.name === '*') {
    return true;
  }

  return false;
};

PermissionSchema.methods.checkConditions = function(context: any): boolean {
  if (!this.conditions || this.conditions.size === 0) {
    return true; // No conditions means permission is granted
  }

  for (const [key, value] of this.conditions) {
    switch (key) {
      case 'ownership':
        if (value === true && context.userId !== context.resourceUserId) {
          return false;
        }
        break;
      
      case 'timeRestriction':
        const currentHour = new Date().getHours();
        if (value.startHour && value.endHour) {
          if (currentHour < value.startHour || currentHour > value.endHour) {
            return false;
          }
        }
        break;
      
      case 'ipWhitelist':
        if (Array.isArray(value) && !value.includes(context.ip)) {
          return false;
        }
        break;
      
      case 'userRole':
        if (Array.isArray(value) && !value.includes(context.userRole)) {
          return false;
        }
        break;
      
      case 'environment':
        if (value && process.env.NODE_ENV !== value) {
          return false;
        }
        break;
      
      default:
        // Custom condition evaluation
        if (context[key] !== value) {
          return false;
        }
    }
  }

  return true;
};

// Static methods
PermissionSchema.statics.findByName = function(name: string): Promise<IPermission | null> {
  return this.findOne({ name: name.toLowerCase(), active: true });
};

PermissionSchema.statics.findByResource = function(resource: string): Promise<IPermission[]> {
  return this.find({ resource: resource.toLowerCase(), active: true }).sort({ action: 1 });
};

PermissionSchema.statics.findByCategory = function(category: string): Promise<IPermission[]> {
  return this.find({ category: category.toLowerCase(), active: true }).sort({ resource: 1, action: 1 });
};

PermissionSchema.statics.validatePermissionName = function(name: string): boolean {
  const parts = name.split(':');
  if (parts.length !== 2) return false;
  
  const [resource, action] = parts;
  return /^[a-z_]+$/.test(resource) && /^[a-z_*]+$/.test(action);
};

PermissionSchema.statics.createSystemPermissions = async function(): Promise<void> {
  const systemPermissions = [
    // Product permissions
    {
      name: 'product:create',
      resource: 'product',
      action: 'create',
      displayName: 'Create Products',
      description: 'Create new products in the catalog',
      category: 'product'
    },
    {
      name: 'product:read',
      resource: 'product',
      action: 'read',
      displayName: 'View Products',
      description: 'View product details and listings',
      category: 'product'
    },
    {
      name: 'product:update',
      resource: 'product',
      action: 'update',
      displayName: 'Update Products',
      description: 'Modify existing product information',
      category: 'product'
    },
    {
      name: 'product:delete',
      resource: 'product',
      action: 'delete',
      displayName: 'Delete Products',
      description: 'Remove products from the catalog',
      category: 'product'
    },
    {
      name: 'product:moderate',
      resource: 'product',
      action: 'moderate',
      displayName: 'Moderate Products',
      description: 'Review and moderate product content',
      category: 'product'
    },

    // Category permissions
    {
      name: 'category:create',
      resource: 'category',
      action: 'create',
      displayName: 'Create Categories',
      description: 'Create new product categories',
      category: 'category'
    },
    {
      name: 'category:read',
      resource: 'category',
      action: 'read',
      displayName: 'View Categories',
      description: 'View category listings and details',
      category: 'category'
    },
    {
      name: 'category:update',
      resource: 'category',
      action: 'update',
      displayName: 'Update Categories',
      description: 'Modify existing categories',
      category: 'category'
    },
    {
      name: 'category:delete',
      resource: 'category',
      action: 'delete',
      displayName: 'Delete Categories',
      description: 'Remove categories from the system',
      category: 'category'
    },

    // Review permissions
    {
      name: 'review:create',
      resource: 'review',
      action: 'create',
      displayName: 'Create Reviews',
      description: 'Write product reviews',
      category: 'review'
    },
    {
      name: 'review:read',
      resource: 'review',
      action: 'read',
      displayName: 'View Reviews',
      description: 'Read product reviews',
      category: 'review'
    },
    {
      name: 'review:update:own',
      resource: 'review',
      action: 'update:own',
      displayName: 'Update Own Reviews',
      description: 'Modify own product reviews',
      category: 'review',
      conditions: new Map([['ownership', true]])
    },
    {
      name: 'review:delete:own',
      resource: 'review',
      action: 'delete:own',
      displayName: 'Delete Own Reviews',
      description: 'Remove own product reviews',
      category: 'review',
      conditions: new Map([['ownership', true]])
    },
    {
      name: 'review:moderate',
      resource: 'review',
      action: 'moderate',
      displayName: 'Moderate Reviews',
      description: 'Review and moderate user reviews',
      category: 'review'
    },

    // User permissions
    {
      name: 'user:read',
      resource: 'user',
      action: 'read',
      displayName: 'View Users',
      description: 'View user profiles and information',
      category: 'user'
    },
    {
      name: 'user:create',
      resource: 'user',
      action: 'create',
      displayName: 'Create Users',
      description: 'Create new user accounts',
      category: 'user'
    },
    {
      name: 'user:update:own',
      resource: 'user',
      action: 'update:own',
      displayName: 'Update Own Profile',
      description: 'Modify own user profile',
      category: 'user',
      conditions: new Map([['ownership', true]])
    },
    {
      name: 'user:moderate',
      resource: 'user',
      action: 'moderate',
      displayName: 'Moderate Users',
      description: 'Moderate user accounts (ban, suspend)',
      category: 'user'
    },

    // Order permissions
    {
      name: 'order:create:own',
      resource: 'order',
      action: 'create:own',
      displayName: 'Create Own Orders',
      description: 'Place new orders',
      category: 'order',
      conditions: new Map([['ownership', true]])
    },
    {
      name: 'order:read:own',
      resource: 'order',
      action: 'read:own',
      displayName: 'View Own Orders',
      description: 'View own order history',
      category: 'order',
      conditions: new Map([['ownership', true]])
    },
    {
      name: 'order:read:any',
      resource: 'order',
      action: 'read:any',
      displayName: 'View All Orders',
      description: 'View any user orders',
      category: 'order'
    },
    {
      name: 'order:update',
      resource: 'order',
      action: 'update',
      displayName: 'Update Orders',
      description: 'Modify order status and details',
      category: 'order'
    },

    // System permissions
    {
      name: 'system:backup',
      resource: 'system',
      action: 'backup',
      displayName: 'System Backup',
      description: 'Create system backups',
      category: 'system'
    },
    {
      name: 'system:config',
      resource: 'system',
      action: 'config',
      displayName: 'System Configuration',
      description: 'Modify system settings',
      category: 'system'
    },

    // Analytics permissions
    {
      name: 'analytics:read:basic',
      resource: 'analytics',
      action: 'read:basic',
      displayName: 'Basic Analytics',
      description: 'View basic analytics and reports',
      category: 'analytics'
    },
    {
      name: 'analytics:read:advanced',
      resource: 'analytics',
      action: 'read:advanced',
      displayName: 'Advanced Analytics',
      description: 'View detailed analytics and reports',
      category: 'analytics'
    }
  ];

  for (const permissionData of systemPermissions) {
    try {
      const existingPermission = await this.findOne({ name: permissionData.name });
      if (!existingPermission) {
        await this.create({
          ...permissionData,
          isSystemPermission: true,
          createdBy: 'system'
        });
        logger.info(`Created system permission: ${permissionData.name}`);
      }
    } catch (error) {
      logger.error(`Error creating system permission ${permissionData.name}:`, error);
    }
  }
};

// Pre-save middleware
PermissionSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.name = this.name.toLowerCase();
    
    // Extract resource and action from name
    const parts = this.name.split(':');
    if (parts.length >= 2) {
      this.resource = parts[0];
      this.action = parts.slice(1).join(':');
    }
  }

  // Validate permission name format
  if (this.isModified('name') && !this.constructor.validatePermissionName(this.name)) {
    return next(new Error('Invalid permission name format'));
  }

  next();
});

// Pre-remove middleware
PermissionSchema.pre('deleteOne', { document: true }, async function() {
  if (this.isSystemPermission) {
    throw new Error('Cannot delete system permissions');
  }

  // Check if any roles have this permission
  const RoleModel = mongoose.model('Role');
  const rolesWithPermission = await RoleModel.find({ 
    permissions: this.name,
    active: true 
  });
  
  if (rolesWithPermission.length > 0) {
    const roleNames = rolesWithPermission.map(r => r.name).join(', ');
    throw new Error(`Cannot delete permission: Used by roles: ${roleNames}`);
  }
});

// Post-save middleware
PermissionSchema.post('save', function(doc) {
  logger.info('Permission saved', {
    permissionId: doc._id,
    name: doc.name,
    resource: doc.resource,
    action: doc.action,
    category: doc.category
  });
});

export const PermissionModel = mongoose.model<IPermission, IPermissionModel>('Permission', PermissionSchema);

// Utility functions
export const createPermission = async (permissionData: Partial<IPermission>): Promise<IPermission> => {
  try {
    const permission = new PermissionModel(permissionData);
    return await permission.save();
  } catch (error) {
    logger.error('Error creating permission:', error);
    throw error;
  }
};

export const getPermissionByName = async (name: string): Promise<IPermission | null> => {
  return await PermissionModel.findByName(name);
};

export const getAllPermissions = async (includeInactive: boolean = false): Promise<IPermission[]> => {
  const query = includeInactive ? {} : { active: true };
  return await PermissionModel.find(query).sort({ category: 1, resource: 1, action: 1 });
};

export const getPermissionsByCategory = async (category: string): Promise<IPermission[]> => {
  return await PermissionModel.findByCategory(category);
};

export const getPermissionsByResource = async (resource: string): Promise<IPermission[]> => {
  return await PermissionModel.findByResource(resource);
};

export const updatePermission = async (permissionId: string, updates: Partial<IPermission>): Promise<IPermission | null> => {
  try {
    const permission = await PermissionModel.findById(permissionId);
    if (!permission) return null;

    if (permission.isSystemPermission && (updates.name || updates.resource || updates.action)) {
      throw new Error('Cannot modify core properties of system permissions');
    }

    return await PermissionModel.findByIdAndUpdate(permissionId, updates, { new: true, runValidators: true });
  } catch (error) {
    logger.error('Error updating permission:', error);
    throw error;
  }
};

export const deletePermission = async (permissionId: string): Promise<boolean> => {
  try {
    const permission = await PermissionModel.findById(permissionId);
    if (!permission) return false;

    await permission.deleteOne();
    return true;
  } catch (error) {
    logger.error('Error deleting permission:', error);
    throw error;
  }
};

// Check if user has specific permission with context
export const hasPermissionWithContext = async (
  userPermissions: string[],
  requiredPermission: string,
  context: any = {}
): Promise<boolean> => {
  // Check for exact permission match
  if (userPermissions.includes(requiredPermission)) {
    const permission = await getPermissionByName(requiredPermission);
    if (permission) {
      return permission.checkConditions(context);
    }
    return true; // If permission not found in DB, assume basic check is sufficient
  }

  // Check for wildcard permissions
  const [resource] = requiredPermission.split(':');
  const wildcardPermission = `${resource}:*`;
  
  if (userPermissions.includes(wildcardPermission)) {
    const permission = await getPermissionByName(wildcardPermission);
    if (permission) {
      return permission.checkConditions(context);
    }
    return true;
  }

  // Check for global admin permission
  if (userPermissions.includes('*')) {
    return true;
  }

  return false;
};

// Initialize system permissions on module load
export const initializeSystemPermissions = async (): Promise<void> => {
  try {
    await PermissionModel.createSystemPermissions();
    logger.info('System permissions initialized');
  } catch (error) {
    logger.error('Error initializing system permissions:', error);
  }
};

// Permission categories for UI organization
export const PERMISSION_CATEGORIES = [
  { name: 'product', displayName: 'Product Management', icon: 'package' },
  { name: 'category', displayName: 'Category Management', icon: 'folder' },
  { name: 'review', displayName: 'Review Management', icon: 'star' },
  { name: 'user', displayName: 'User Management', icon: 'users' },
  { name: 'order', displayName: 'Order Management', icon: 'shopping-cart' },
  { name: 'cart', displayName: 'Cart Management', icon: 'shopping-bag' },
  { name: 'profile', displayName: 'Profile Management', icon: 'user' },
  { name: 'wishlist', displayName: 'Wishlist Management', icon: 'heart' },
  { name: 'analytics', displayName: 'Analytics & Reports', icon: 'bar-chart' },
  { name: 'system', displayName: 'System Administration', icon: 'settings' },
  { name: 'payment', displayName: 'Payment Management', icon: 'credit-card' },
  { name: 'shipping', displayName: 'Shipping Management', icon: 'truck' },
  { name: 'inventory', displayName: 'Inventory Management', icon: 'box' },
  { name: 'content', displayName: 'Content Management', icon: 'file-text' },
  { name: 'marketing', displayName: 'Marketing Tools', icon: 'megaphone' },
  { name: 'security', displayName: 'Security Management', icon: 'shield' },
  { name: 'api', displayName: 'API Access', icon: 'code' }
];
