import { Schema, model, Document, Types } from 'mongoose';
import { IRole, IPermission } from '../types/user.types';

// ==================== PERMISSION SCHEMA ====================

const PermissionSchema = new Schema<IPermission>({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: /^[a-z][a-z0-9_]*[a-z0-9]$/,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  resource: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    maxlength: 50
  },
  action: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    enum: ['create', 'read', 'update', 'delete', 'manage', 'execute'],
    maxlength: 20
  },
  attributes: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  conditions: {
    type: Schema.Types.Mixed,
    default: {}
  },
  isActive: {
    type: Boolean,
    default: true
  },
  category: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  createdBy: String,
  updatedBy: String,
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  },
  toObject: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// ==================== ROLE SCHEMA ====================

const RoleSchema = new Schema<IRole>({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    match: /^[A-Z][A-Z0-9_]*[A-Z0-9]$/,
    maxlength: 50
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  permissions: [{
    type: Schema.Types.ObjectId,
    ref: 'Permission',
    required: true
  }],
  isSystem: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  hierarchy: {
    type: Number,
    required: true,
    min: 1,
    max: 100,
    default: 50
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  createdBy: String,
  updatedBy: String,
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  },
  toObject: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// ==================== INDEXES ====================

// Permission indexes
PermissionSchema.index({ name: 1 }, { unique: true });
PermissionSchema.index({ resource: 1, action: 1 });
PermissionSchema.index({ category: 1 });
PermissionSchema.index({ isActive: 1 });
PermissionSchema.index({ createdAt: -1 });

// Role indexes
RoleSchema.index({ name: 1 }, { unique: true });
RoleSchema.index({ hierarchy: -1 });
RoleSchema.index({ isActive: 1 });
RoleSchema.index({ isSystem: 1 });
RoleSchema.index({ createdAt: -1 });
RoleSchema.index({ permissions: 1 });

// Text search
PermissionSchema.index({
  name: 'text',
  description: 'text',
  resource: 'text',
  category: 'text'
});

RoleSchema.index({
  name: 'text',
  description: 'text'
});

// ==================== VIRTUAL PROPERTIES ====================

RoleSchema.virtual('permissionCount').get(function() {
  return this.permissions?.length || 0;
});

// ==================== INSTANCE METHODS ====================

RoleSchema.methods.hasPermission = function(permission: string | Types.ObjectId): boolean {
  const permissionId = typeof permission === 'string' 
    ? new Types.ObjectId(permission) 
    : permission;
  
  return this.permissions.some((p: Types.ObjectId) => p.equals(permissionId));
};

RoleSchema.methods.addPermission = function(permission: string | Types.ObjectId): void {
  const permissionId = typeof permission === 'string' 
    ? new Types.ObjectId(permission) 
    : permission;
  
  if (!this.hasPermission(permissionId)) {
    this.permissions.push(permissionId);
  }
};

RoleSchema.methods.removePermission = function(permission: string | Types.ObjectId): void {
  const permissionId = typeof permission === 'string' 
    ? new Types.ObjectId(permission) 
    : permission;
  
  this.permissions = this.permissions.filter((p: Types.ObjectId) => !p.equals(permissionId));
};

// ==================== STATIC METHODS ====================

RoleSchema.statics.findByName = function(name: string) {
  return this.findOne({ name: name.toUpperCase(), isActive: true });
};

RoleSchema.statics.findSystemRoles = function() {
  return this.find({ isSystem: true, isActive: true }).sort({ hierarchy: -1 });
};

RoleSchema.statics.findCustomRoles = function() {
  return this.find({ isSystem: false, isActive: true }).sort({ hierarchy: -1 });
};

RoleSchema.statics.findByHierarchy = function(minHierarchy: number, maxHierarchy?: number) {
  const query: any = { 
    hierarchy: { $gte: minHierarchy },
    isActive: true 
  };
  
  if (maxHierarchy !== undefined) {
    query.hierarchy.$lte = maxHierarchy;
  }
  
  return this.find(query).sort({ hierarchy: -1 });
};

RoleSchema.statics.getDefaultRoles = function() {
  return this.find({
    name: { $in: ['CUSTOMER', 'GUEST'] },
    isActive: true
  });
};

PermissionSchema.statics.findByResource = function(resource: string) {
  return this.find({ resource: resource.toLowerCase(), isActive: true });
};

PermissionSchema.statics.findByCategory = function(category: string) {
  return this.find({ category, isActive: true }).sort({ name: 1 });
};

PermissionSchema.statics.findByResourceAndAction = function(resource: string, action: string) {
  return this.findOne({ 
    resource: resource.toLowerCase(), 
    action: action.toLowerCase(),
    isActive: true 
  });
};

// ==================== MIDDLEWARE ====================

// Permission middleware
PermissionSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.version += 1;
  }
  next();
});

PermissionSchema.pre('save', function(next) {
  // Normalize resource and action to lowercase
  this.resource = this.resource.toLowerCase();
  this.action = this.action.toLowerCase();
  next();
});

// Role middleware
RoleSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.version += 1;
  }
  next();
});

RoleSchema.pre('save', function(next) {
  // Normalize role name to uppercase
  this.name = this.name.toUpperCase();
  next();
});

// Prevent deletion of system roles
RoleSchema.pre(['deleteOne', 'findOneAndDelete'], function(next) {
  if (this.getQuery().isSystem === true) {
    return next(new Error('Cannot delete system roles'));
  }
  next();
});

// Cascade delete permissions when role is deleted (if not system permissions)
RoleSchema.post(['deleteOne', 'findOneAndDelete'], async function(doc) {
  if (doc && !doc.isSystem) {
    // Only delete permissions that are not used by other roles
    const Permission = model('Permission');
    const Role = model('Role');
    
    for (const permissionId of doc.permissions) {
      const otherRolesCount = await Role.countDocuments({
        _id: { $ne: doc._id },
        permissions: permissionId,
        isActive: true
      });
      
      if (otherRolesCount === 0) {
        await Permission.findByIdAndUpdate(permissionId, { isActive: false });
      }
    }
  }
});

export const Permission = model<IPermission>('Permission', PermissionSchema);
export const Role = model<IRole>('Role', RoleSchema);

export default { Role, Permission };
