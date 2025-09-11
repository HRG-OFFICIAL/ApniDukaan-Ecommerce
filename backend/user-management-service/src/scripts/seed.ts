#!/usr/bin/env ts-node

import dotenv from 'dotenv';
import { Types } from 'mongoose';
import { connectDB } from '../config/database';
import { initializeRedis } from '../config/redis';
import User from '../models/User';
import { Role } from '../models/Role';
import { 
  UserRole, 
  RoleType, 
  UserStatus 
} from '../types/user.types';
import { logger } from '../utils/logger';
import bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config();

// Default permissions for different role types
const PERMISSIONS = {
  SYSTEM: [
    'system.all',
    'system.cache_clear',
    'system.health_check',
    'system.metrics_view',
    'system.logs_view',
    'system.backup',
    'system.restore'
  ],
  USER_MANAGEMENT: [
    'users.view',
    'users.create',
    'users.update',
    'users.delete',
    'users.suspend',
    'users.activate',
    'users.bulk_action',
    'users.profile_view',
    'users.profile_update'
  ],
  ROLE_MANAGEMENT: [
    'roles.view',
    'roles.create',
    'roles.update',
    'roles.delete',
    'roles.assign',
    'roles.remove'
  ],
  CONTENT_MANAGEMENT: [
    'content.view',
    'content.create',
    'content.update',
    'content.delete',
    'content.publish',
    'content.moderate'
  ],
  ANALYTICS: [
    'analytics.view',
    'analytics.export',
    'analytics.user_stats',
    'analytics.system_stats'
  ],
  AUDIT: [
    'audit.view',
    'audit.export'
  ],
  SUPPORT: [
    'support.view_tickets',
    'support.create_tickets',
    'support.update_tickets',
    'support.delete_tickets'
  ]
};

// Default roles configuration
const DEFAULT_ROLES = [
  {
    name: 'super_admin',
    displayName: 'Super Administrator',
    description: 'Full system access with all permissions',
    type: RoleType.SYSTEM,
    permissions: [
      ...PERMISSIONS.SYSTEM,
      ...PERMISSIONS.USER_MANAGEMENT,
      ...PERMISSIONS.ROLE_MANAGEMENT,
      ...PERMISSIONS.CONTENT_MANAGEMENT,
      ...PERMISSIONS.ANALYTICS,
      ...PERMISSIONS.AUDIT,
      ...PERMISSIONS.SUPPORT
    ],
    isSystem: true,
    isActive: true,
    priority: 1000
  },
  {
    name: 'admin',
    displayName: 'Administrator',
    description: 'Administrative access with user and content management',
    type: RoleType.SYSTEM,
    permissions: [
      ...PERMISSIONS.USER_MANAGEMENT,
      ...PERMISSIONS.CONTENT_MANAGEMENT,
      ...PERMISSIONS.ANALYTICS,
      ...PERMISSIONS.AUDIT,
      ...PERMISSIONS.SUPPORT
    ],
    isSystem: true,
    isActive: true,
    priority: 800
  },
  {
    name: 'moderator',
    displayName: 'Moderator',
    description: 'Content moderation and user support',
    type: RoleType.SYSTEM,
    permissions: [
      'users.view',
      'users.suspend',
      'users.activate',
      ...PERMISSIONS.CONTENT_MANAGEMENT,
      ...PERMISSIONS.SUPPORT
    ],
    isSystem: true,
    isActive: true,
    priority: 600
  },
  {
    name: 'support',
    displayName: 'Support Agent',
    description: 'Customer support and basic user assistance',
    type: RoleType.SYSTEM,
    permissions: [
      'users.view',
      'users.profile_view',
      ...PERMISSIONS.SUPPORT
    ],
    isSystem: true,
    isActive: true,
    priority: 400
  },
  {
    name: 'customer',
    displayName: 'Customer',
    description: 'Standard customer account with basic permissions',
    type: RoleType.CUSTOM,
    permissions: [
      'profile.view',
      'profile.update',
      'orders.view',
      'orders.create',
      'wishlist.manage',
      'reviews.create'
    ],
    isSystem: true,
    isActive: true,
    priority: 100
  },
  {
    name: 'vendor',
    displayName: 'Vendor',
    description: 'Vendor account with product and order management',
    type: RoleType.CUSTOM,
    permissions: [
      'profile.view',
      'profile.update',
      'products.view',
      'products.create',
      'products.update',
      'orders.view',
      'orders.manage',
      'analytics.view_own'
    ],
    isSystem: true,
    isActive: true,
    priority: 200
  },
  {
    name: 'guest',
    displayName: 'Guest',
    description: 'Limited access for non-registered users',
    type: RoleType.CUSTOM,
    permissions: [
      'products.view',
      'categories.view'
    ],
    isSystem: true,
    isActive: true,
    priority: 50
  }
];

// Default admin user
const DEFAULT_ADMIN = {
  email: 'admin@ApniDukaan.com',
  username: 'superadmin',
  password: 'SuperAdmin123!',
  profile: {
    firstName: 'Super',
    lastName: 'Administrator',
    displayName: 'Super Admin'
  },
  roles: [UserRole.SUPER_ADMIN],
  status: UserStatus.ACTIVE,
  security: {
    isEmailVerified: true,
    emailVerifiedAt: new Date(),
    passwordChangedAt: new Date()
  },
  isOnline: false
};

class DatabaseSeeder {
  private async seedRoles(): Promise<void> {
    logger.info('🌱 Seeding roles and permissions...');

    for (const roleData of DEFAULT_ROLES) {
      try {
        const existingRole = await Role.findOne({ name: roleData.name });
        
        if (existingRole) {
          logger.info(`⚠️  Role '${roleData.name}' already exists, updating...`);
          
          // Update existing role with new permissions
          existingRole.permissions = roleData.permissions.map((p: string) => new Types.ObjectId(p));
          existingRole.description = roleData.description;
          existingRole.isActive = roleData.isActive;
          existingRole.updatedAt = new Date();
          
          await existingRole.save();
          logger.info(`✅ Updated role '${roleData.name}'`);
        } else {
          const role = new Role({
            ...roleData,
            permissions: roleData.permissions.map((p: string) => new Types.ObjectId(p)),
            createdBy: 'system_seeder',
            createdAt: new Date(),
            updatedAt: new Date()
          });
          
          await role.save();
          logger.info(`✅ Created role '${roleData.name}' with ${roleData.permissions.length} permissions`);
        }
      } catch (error) {
        logger.error(`❌ Failed to seed role '${roleData.name}':`, error);
      }
    }
  }

  private async seedAdminUser(): Promise<void> {
    logger.info('🌱 Seeding default admin user...');

    try {
      const existingAdmin = await User.findOne({ 
        $or: [
          { email: DEFAULT_ADMIN.email },
          { username: DEFAULT_ADMIN.username }
        ]
      });

      if (existingAdmin) {
        logger.info(`⚠️  Admin user already exists: ${existingAdmin.email}`);
        
        // Ensure admin has super_admin role
        if (!existingAdmin.roles.includes(UserRole.SUPER_ADMIN)) {
          existingAdmin.roles.push(UserRole.SUPER_ADMIN);
          await existingAdmin.save();
          logger.info('✅ Added super_admin role to existing admin');
        }
        return;
      }

      // Hash password
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');
      const passwordHash = await bcrypt.hash(DEFAULT_ADMIN.password, saltRounds);

      const adminUser = new User({
        ...DEFAULT_ADMIN,
        security: {
          ...DEFAULT_ADMIN.security,
          passwordHash,
          passwordSalt: saltRounds
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Remove plain password
      delete (adminUser as any).password;

      await adminUser.save();
      logger.info(`✅ Created default admin user: ${DEFAULT_ADMIN.email}`);
      logger.info(`🔐 Default admin password: ${DEFAULT_ADMIN.password}`);
      logger.warn('🚨 IMPORTANT: Change the default admin password after first login!');
      
    } catch (error) {
      logger.error('❌ Failed to seed admin user:', error);
    }
  }

  async run(): Promise<void> {
    const startTime = Date.now();
    logger.info('🚀 Starting database seeding...');

    try {
      // Connect to database
      await connectDB();
      logger.info('✅ Database connected');

      // Run seeding operations
      await this.seedRoles();
      await this.seedAdminUser();

      const duration = Date.now() - startTime;
      logger.info(`🎉 Database seeding completed successfully in ${duration}ms`);

    } catch (error) {
      logger.error('❌ Database seeding failed:', error);
      process.exit(1);
    }
  }
}

// Run seeder if called directly
if (require.main === module) {
  const seeder = new DatabaseSeeder();
  
  seeder.run()
    .then(() => {
      logger.info('✅ Seeding process completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('❌ Seeding process failed:', error);
      process.exit(1);
    });
}

export default DatabaseSeeder;
