import mongoose, { Schema, Document, Model } from 'mongoose';
import { logger } from '../../shared/src/utils/logger';

export interface IRole extends Document {
  _id: string;
  name: string;
  displayName: string;
  description: string;
  permissions: string[];
  isSystemRole: boolean;
  hierarchy: number; // Lower numbers have higher priority
  color?: string; // For UI display
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;

  // Methods
  hasPermission(permission: string): boolean;
  addPermission(permission: string): void;
  removePermission(permission: string): void;
  canManageRole(otherRole: IRole): boolean;
}

export interface IRoleModel extends Model<IRole> {
  // Static methods
  findByName(name: string): Promise<IRole | null>;
  getSystemRoles(): Promise<IRole[]>;
  getUserRoles(): Promise<IRole[]>;
  createDefaultRoles(): Promise<void>;
  checkHierarchy(roleA: string, roleB: string): Promise<number>; // Returns -1, 0, 1 for comparison
}

const RoleSchema = new Schema<IRole>({
  name: {
    type: String,
    required: [true, 'Role name is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[a-z_]+$/, 'Role name can only contain lowercase letters and underscores'],
    minlength: [2, 'Role name must be at least 2 characters'],
    maxlength: [50, 'Role name cannot exceed 50 characters']
  },
  displayName: {
    type: String,
    required: [true, 'Display name is required'],
    trim: true,
    minlength: [2, 'Display name must be at least 2 characters'],
    maxlength: [100, 'Display name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  permissions: [{
    type: String,
    trim: true,
    match: [/^[a-z_:*]+$/, 'Permission must be in format: resource:action or resource:*']
  }],
  isSystemRole: {
    type: Boolean,
    default: false
  },
  hierarchy: {
    type: Number,
    required: [true, 'Hierarchy level is required'],
    min: [0, 'Hierarchy cannot be negative'],
    max: [100, 'Hierarchy cannot exceed 100']
  },
  color: {
    type: String,
    match: [/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color code']
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
      return ret;
    }
  },
  toObject: {
    transform(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes
RoleSchema.index({ name: 1 }, { unique: true });
RoleSchema.index({ hierarchy: 1 });
RoleSchema.index({ active: 1 });
RoleSchema.index({ isSystemRole: 1 });

// Instance methods
RoleSchema.methods.hasPermission = function(permission: string): boolean {
  // Check for exact match
  if (this.permissions.includes(permission)) {
    return true;
  }

  // Check for wildcard permissions
  const permissionParts = permission.split(':');
  for (let i = permissionParts.length; i > 0; i--) {
    const wildcardPermission = permissionParts.slice(0, i).join(':') + ':*';
    if (this.permissions.includes(wildcardPermission)) {
      return true;
    }
  }

  // Check for global admin permission
  return this.permissions.includes('*');
};

RoleSchema.methods.addPermission = function(permission: string): void {
  if (!this.permissions.includes(permission)) {
    this.permissions.push(permission);
    this.markModified('permissions');
  }
};

RoleSchema.methods.removePermission = function(permission: string): void {
  const index = this.permissions.indexOf(permission);
  if (index > -1) {
    this.permissions.splice(index, 1);
    this.markModified('permissions');
  }
};

RoleSchema.methods.canManageRole = function(otherRole: IRole): boolean {
  // System roles cannot be managed unless by another system role with higher hierarchy
  if (otherRole.isSystemRole && (!this.isSystemRole || this.hierarchy >= otherRole.hierarchy)) {
    return false;
  }

  // Higher hierarchy roles can manage lower hierarchy roles
  return this.hierarchy < otherRole.hierarchy;
};

// Static methods
RoleSchema.statics.findByName = function(name: string): Promise<IRole | null> {
  return this.findOne({ name: name.toLowerCase(), active: true });
};

RoleSchema.statics.getSystemRoles = function(): Promise<IRole[]> {
  return this.find({ isSystemRole: true, active: true }).sort({ hierarchy: 1 });
};

RoleSchema.statics.getUserRoles = function(): Promise<IRole[]> {
  return this.find({ isSystemRole: false, active: true }).sort({ hierarchy: 1 });
};

RoleSchema.statics.checkHierarchy = async function(roleA: string, roleB: string): Promise<number> {
  const roles = await this.find({ 
    name: { $in: [roleA.toLowerCase(), roleB.toLowerCase()] },
    active: true 
  }).select('name hierarchy');

  const roleAData = roles.find(r => r.name === roleA.toLowerCase());
  const roleBData = roles.find(r => r.name === roleB.toLowerCase());

  if (!roleAData || !roleBData) {
    throw new Error('One or both roles not found');
  }

  if (roleAData.hierarchy < roleBData.hierarchy) return -1;
  if (roleAData.hierarchy > roleBData.hierarchy) return 1;
  return 0;
};

RoleSchema.statics.createDefaultRoles = async function(): Promise<void> {
  const defaultRoles = [
    {
      name: 'admin',
      displayName: 'Administrator',
      description: 'Full system access with all permissions',
      permissions: ['*'],
      isSystemRole: true,
      hierarchy: 0,
      color: '#DC2626',
      createdBy: 'system'
    },
    {
      name: 'moderator',
      displayName: 'Moderator',
      description: 'Content moderation and user management permissions',
      permissions: [
        'product:read',
        'product:moderate',
        'category:read',
        'review:*',
        'user:read',
        'user:moderate',
        'order:read:any',
        'analytics:read:basic'
      ],
      isSystemRole: true,
      hierarchy: 10,
      color: '#2563EB',
      createdBy: 'system'
    },
    {
      name: 'user',
      displayName: 'User',
      description: 'Standard user permissions for shopping and account management',
      permissions: [
        'product:read',
        'category:read',
        'review:create',
        'review:read',
        'review:update:own',
        'review:delete:own',
        'cart:manage:own',
        'order:create:own',
        'order:read:own',
        'profile:read:own',
        'profile:update:own',
        'wishlist:manage:own'
      ],
      isSystemRole: true,
      hierarchy: 20,
      color: '#059669',
      createdBy: 'system'
    },
    {
      name: 'guest',
      displayName: 'Guest',
      description: 'Limited permissions for unauthenticated users',
      permissions: [
        'product:read',
        'category:read',
        'review:read'
      ],
      isSystemRole: true,
      hierarchy: 30,
      color: '#6B7280',
      createdBy: 'system'
    }
  ];

  for (const roleData of defaultRoles) {
    try {
      const existingRole = await this.findOne({ name: roleData.name });
      if (!existingRole) {
        await this.create(roleData);
        logger.info(`Created default role: ${roleData.name}`);
      }
    } catch (error) {
      logger.error(`Error creating default role ${roleData.name}:`, error);
    }
  }
};

// Pre-save middleware
RoleSchema.pre('save', function(next) {
  if (this.isModified('permissions')) {
    // Remove duplicate permissions
    this.permissions = [...new Set(this.permissions)];
    
    // Sort permissions for consistency
    this.permissions.sort();
  }

  if (this.isModified('name')) {
    this.name = this.name.toLowerCase();
  }

  next();
});

// Pre-remove middleware
RoleSchema.pre('deleteOne', { document: true }, async function() {
  if (this.isSystemRole) {
    throw new Error('Cannot delete system roles');
  }

  // Check if any users have this role
  const UserModel = mongoose.model('User');
  const usersWithRole = await UserModel.countDocuments({ role: this.name });
  
  if (usersWithRole > 0) {
    throw new Error(`Cannot delete role: ${usersWithRole} users are assigned this role`);
  }
});

// Post-save middleware
RoleSchema.post('save', function(doc) {
  logger.info('Role saved', {
    roleId: doc._id,
    name: doc.name,
    permissions: doc.permissions.length,
    hierarchy: doc.hierarchy
  });
});

export const RoleModel = mongoose.model<IRole, IRoleModel>('Role', RoleSchema);

// Default permissions available in the system
export const SYSTEM_PERMISSIONS = {
  // Product permissions
  'product:create': 'Create new products',
  'product:read': 'View products',
  'product:update': 'Update existing products',
  'product:delete': 'Delete products',
  'product:moderate': 'Moderate product content',
  'product:*': 'All product permissions',

  // Category permissions
  'category:create': 'Create new categories',
  'category:read': 'View categories',
  'category:update': 'Update existing categories',
  'category:delete': 'Delete categories',
  'category:*': 'All category permissions',

  // Review permissions
  'review:create': 'Create reviews',
  'review:read': 'View reviews',
  'review:update:own': 'Update own reviews',
  'review:update:any': 'Update any review',
  'review:delete:own': 'Delete own reviews',
  'review:delete:any': 'Delete any review',
  'review:moderate': 'Moderate reviews',
  'review:*': 'All review permissions',

  // User permissions
  'user:create': 'Create new users',
  'user:read': 'View user profiles',
  'user:update:own': 'Update own profile',
  'user:update:any': 'Update any user profile',
  'user:delete': 'Delete users',
  'user:moderate': 'Moderate users (ban, suspend)',
  'user:*': 'All user permissions',

  // Order permissions
  'order:create:own': 'Create own orders',
  'order:read:own': 'View own orders',
  'order:read:any': 'View any order',
  'order:update': 'Update orders',
  'order:cancel': 'Cancel orders',
  'order:refund': 'Process refunds',
  'order:*': 'All order permissions',

  // Cart permissions
  'cart:manage:own': 'Manage own cart',
  'cart:*': 'All cart permissions',

  // Profile permissions
  'profile:read:own': 'View own profile',
  'profile:update:own': 'Update own profile',
  'profile:*': 'All profile permissions',

  // Wishlist permissions
  'wishlist:manage:own': 'Manage own wishlist',
  'wishlist:*': 'All wishlist permissions',

  // Analytics permissions
  'analytics:read:basic': 'View basic analytics',
  'analytics:read:advanced': 'View advanced analytics',
  'analytics:*': 'All analytics permissions',

  // System permissions
  'system:backup': 'Create system backups',
  'system:restore': 'Restore from backups',
  'system:config': 'Modify system configuration',
  'system:*': 'All system permissions',

  // Global permission
  '*': 'All permissions (Super Admin)'
};

// Utility functions
export const createRole = async (roleData: Partial<IRole>): Promise<IRole> => {
  try {
    const role = new RoleModel(roleData);
    return await role.save();
  } catch (error) {
    logger.error('Error creating role:', error);
    throw error;
  }
};

export const getRoleByName = async (name: string): Promise<IRole | null> => {
  return await RoleModel.findByName(name);
};

export const getAllRoles = async (includeInactive: boolean = false): Promise<IRole[]> => {
  const query = includeInactive ? {} : { active: true };
  return await RoleModel.find(query).sort({ hierarchy: 1 });
};

export const updateRole = async (roleId: string, updates: Partial<IRole>): Promise<IRole | null> => {
  try {
    const role = await RoleModel.findById(roleId);
    if (!role) return null;

    if (role.isSystemRole && updates.permissions) {
      throw new Error('Cannot modify permissions of system roles');
    }

    return await RoleModel.findByIdAndUpdate(roleId, updates, { new: true, runValidators: true });
  } catch (error) {
    logger.error('Error updating role:', error);
    throw error;
  }
};

export const deleteRole = async (roleId: string): Promise<boolean> => {
  try {
    const role = await RoleModel.findById(roleId);
    if (!role) return false;

    await role.deleteOne();
    return true;
  } catch (error) {
    logger.error('Error deleting role:', error);
    throw error;
  }
};

// Initialize default roles on module load
export const initializeDefaultRoles = async (): Promise<void> => {
  try {
    await RoleModel.createDefaultRoles();
    logger.info('Default roles initialized');
  } catch (error) {
    logger.error('Error initializing default roles:', error);
  }
};
