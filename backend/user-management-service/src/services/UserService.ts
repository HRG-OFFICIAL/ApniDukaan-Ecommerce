import { Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { v2 as cloudinary } from 'cloudinary';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import fs from 'fs';
import path from 'path';
import { createClient } from 'redis';

import User, { IUserDocument } from '../models/User';
import {
  IUserService,
  IUser,
  IProfileUpdateRequest,
  IAddressRequest,
  IUserPreferences,
  IAddress,
  UserStatus,
  AccountAction,
  AddressType
} from '../types/user.types';

import { logger } from '../utils/logger';

export class UserService implements IUserService {
  private redisClient: any;
  private s3Client: S3Client | null = null;

  constructor() {
    this.initializeRedis();
    this.initializeStorageProviders();
  }

  private async initializeRedis(): Promise<void> {
    try {
      this.redisClient = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      });
      await this.redisClient.connect();
      logger.info('Redis connected for UserService');
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      this.redisClient = null;
    }
  }

  private initializeStorageProviders(): void {
    // Initialize Cloudinary
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true
      });
    }

    // Initialize AWS S3 client
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      this.s3Client = new S3Client({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
      });
    }
  }

  // ==================== USER RETRIEVAL ====================

  async getUserById(userId: string): Promise<{ success: boolean; user?: IUser; error?: string }> {
    try {
      // Check cache first
      if (this.redisClient) {
        const cached = await this.redisClient.get(`user:${userId}`);
        if (cached) {
          return {
            success: true,
            user: JSON.parse(cached)
          };
        }
      }

      const user = await User.findById(userId) as IUserDocument;
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Cache user data
      if (this.redisClient) {
        await this.cacheUser(user);
      }

      logger.info('User retrieved successfully', { userId });

      return {
        success: true,
        user: user as IUser
      };

    } catch (error: any) {
      logger.error('Failed to get user:', error);
      return {
        success: false,
        error: 'Failed to retrieve user'
      };
    }
  }

  async getUserByEmail(email: string): Promise<{ success: boolean; user?: IUser; error?: string }> {
    try {
      const user = await User.findByEmail(email) as IUserDocument;
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      return {
        success: true,
        user: user as IUser
      };

    } catch (error: any) {
      logger.error('Failed to get user by email:', error);
      return {
        success: false,
        error: 'Failed to retrieve user'
      };
    }
  }

  // ==================== PROFILE MANAGEMENT ====================

  async updateProfile(userId: string, profileData: IProfileUpdateRequest): Promise<{ success: boolean; user?: IUser; error?: string }> {
    try {
      const user = await User.findById(userId) as IUserDocument;
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Update profile fields
      if (profileData.firstName) {
        user.profile.firstName = profileData.firstName.trim();
      }
      
      if (profileData.lastName) {
        user.profile.lastName = profileData.lastName.trim();
      }
      
      if (profileData.displayName !== undefined) {
        user.profile.displayName = profileData.displayName ? profileData.displayName.trim() : undefined;
      }
      
      if (profileData.bio !== undefined) {
        user.profile.bio = profileData.bio ? profileData.bio.trim() : undefined;
      }
      
      if (profileData.dateOfBirth !== undefined) {
        user.profile.dateOfBirth = profileData.dateOfBirth;
      }
      
      if (profileData.gender) {
        user.profile.gender = profileData.gender as any;
      }
      
      if (profileData.website !== undefined) {
        user.profile.website = profileData.website ? profileData.website.trim() : undefined;
      }

      // Update phone number
      if (profileData.phone) {
        user.profile.phone = {
          number: profileData.phone.number,
          countryCode: profileData.phone.countryCode,
          isVerified: user.profile.phone?.number === profileData.phone.number ? 
            (user.profile.phone?.isVerified || false) : false,
          verifiedAt: user.profile.phone?.number === profileData.phone.number ? 
            user.profile.phone?.verifiedAt : undefined
        };
      }

      // Update social links
      if (profileData.socialLinks) {
        user.profile.socialLinks = {
          ...user.profile.socialLinks,
          ...profileData.socialLinks
        };
      }

      // Update preferences
      if (profileData.preferences) {
        user.profile.preferences = this.mergePreferences(user.profile.preferences, profileData.preferences);
      }

      // Log profile update activity
      user.addActivity({
        action: AccountAction.PROFILE_UPDATE,
        timestamp: new Date(),
        success: true,
        metadata: {
          updatedFields: Object.keys(profileData)
        }
      });

      await user.save();

      // Update cache
      if (this.redisClient) {
        await this.cacheUser(user);
        await this.redisClient.del(`user_profile:${userId}`);
      }

      logger.info('Profile updated successfully', { userId, fields: Object.keys(profileData) });

      return {
        success: true,
        user: user as IUser
      };

    } catch (error: any) {
      logger.error('Failed to update profile:', error);
      return {
        success: false,
        error: 'Failed to update profile'
      };
    }
  }

  // ==================== AVATAR MANAGEMENT ====================

  async uploadAvatar(userId: string, file: any): Promise<{ success: boolean; avatar?: any; error?: string }> {
    try {
      const user = await User.findById(userId) as IUserDocument;
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Validate file
      const validationResult = this.validateImageFile(file);
      if (!validationResult.isValid) {
        return {
          success: false,
          error: validationResult.error
        };
      }

      // Process image with sharp
      const processedImageBuffer = await sharp(file.buffer)
        .resize(400, 400, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({
          quality: 85,
          progressive: true
        })
        .toBuffer();

      // Upload to configured storage provider
      const uploadResult = await this.uploadImageToStorage(processedImageBuffer, userId, 'avatar');
      if (!uploadResult.success) {
        return {
          success: false,
          error: uploadResult.error
        };
      }

      // Delete old avatar if exists
      if (user.profile.avatar?.publicId && user.profile.avatar?.provider) {
        await this.deleteImageFromStorage(user.profile.avatar.publicId, user.profile.avatar.provider);
      }

      // Update user avatar
      user.profile.avatar = {
        url: uploadResult.url!,
        publicId: uploadResult.publicId!,
        provider: uploadResult.provider!
      };

      // Log avatar update
      user.addActivity({
        action: AccountAction.PROFILE_UPDATE,
        timestamp: new Date(),
        success: true,
        metadata: {
          updatedFields: ['avatar'],
          provider: uploadResult.provider
        }
      });

      await user.save();

      // Update cache
      if (this.redisClient) {
        await this.cacheUser(user);
      }

      logger.info('Avatar uploaded successfully', { 
        userId, 
        provider: uploadResult.provider,
        publicId: uploadResult.publicId 
      });

      return {
        success: true,
        avatar: user.profile.avatar
      };

    } catch (error: any) {
      logger.error('Failed to upload avatar:', error);
      return {
        success: false,
        error: 'Failed to upload avatar'
      };
    }
  }

  // ==================== ADDRESS MANAGEMENT ====================

  async addAddress(userId: string, addressData: IAddressRequest): Promise<{ success: boolean; address?: IAddress; error?: string }> {
    try {
      const user = await User.findById(userId) as IUserDocument;
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Validate address data
      const validationResult = this.validateAddressData(addressData);
      if (!validationResult.isValid) {
        return {
          success: false,
          error: validationResult.error
        };
      }

      // Check if making this address default and remove default from others of same type
      if (addressData.isDefault) {
        user.profile.addresses.forEach(addr => {
          if (addr.type === addressData.type) {
            addr.isDefault = false;
          }
        });
      }

      // Create new address
      const newAddress: IAddress = {
        _id: new Types.ObjectId().toString(),
        type: addressData.type,
        firstName: addressData.firstName.trim(),
        lastName: addressData.lastName.trim(),
        company: addressData.company ? addressData.company.trim() : undefined,
        addressLine1: addressData.addressLine1.trim(),
        addressLine2: addressData.addressLine2 ? addressData.addressLine2.trim() : undefined,
        city: addressData.city.trim(),
        state: addressData.state.trim(),
        postalCode: addressData.postalCode.trim(),
        country: addressData.country.trim(),
        phone: addressData.phone ? addressData.phone.trim() : undefined,
        isDefault: addressData.isDefault || false,
        isVerified: false,
        metadata: {}
      } as IAddress;

      user.profile.addresses.push(newAddress);

      // Log address addition
      user.addActivity({
        action: AccountAction.PROFILE_UPDATE,
        timestamp: new Date(),
        success: true,
        metadata: {
          action: 'add_address',
          addressType: addressData.type
        }
      });

      await user.save();

      // Update cache
      if (this.redisClient) {
        await this.cacheUser(user);
      }

      // Return the newly added address (get it from the saved document)
      const addedAddress = user.profile.addresses[user.profile.addresses.length - 1];

      logger.info('Address added successfully', { userId, addressType: addressData.type });

      return {
        success: true,
        address: addedAddress
      };

    } catch (error: any) {
      logger.error('Failed to add address:', error);
      return {
        success: false,
        error: 'Failed to add address'
      };
    }
  }

  async updateAddress(userId: string, addressId: string, addressData: Partial<IAddressRequest>): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await User.findById(userId) as IUserDocument;
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      const addressIndex = user.profile.addresses.findIndex(
        addr => addr._id?.toString() === addressId
      );

      if (addressIndex === -1) {
        return {
          success: false,
          error: 'Address not found'
        };
      }

      const address = user.profile.addresses[addressIndex];

      // Update address fields
      if (addressData.firstName) address.firstName = addressData.firstName.trim();
      if (addressData.lastName) address.lastName = addressData.lastName.trim();
      if (addressData.company !== undefined) {
        address.company = addressData.company ? addressData.company.trim() : undefined;
      }
      if (addressData.addressLine1) address.addressLine1 = addressData.addressLine1.trim();
      if (addressData.addressLine2 !== undefined) {
        address.addressLine2 = addressData.addressLine2 ? addressData.addressLine2.trim() : undefined;
      }
      if (addressData.city) address.city = addressData.city.trim();
      if (addressData.state) address.state = addressData.state.trim();
      if (addressData.postalCode) address.postalCode = addressData.postalCode.trim();
      if (addressData.country) address.country = addressData.country.trim();
      if (addressData.phone !== undefined) {
        address.phone = addressData.phone ? addressData.phone.trim() : undefined;
      }

      // Handle default address setting
      if (addressData.isDefault === true && !address.isDefault) {
        // Remove default from other addresses of same type
        user.profile.addresses.forEach((addr, index) => {
          if (index !== addressIndex && addr.type === address.type) {
            addr.isDefault = false;
          }
        });
        address.isDefault = true;
      } else if (addressData.isDefault === false) {
        address.isDefault = false;
      }

      // Mark address as unverified if key fields changed
      const keyFields = ['addressLine1', 'city', 'state', 'postalCode', 'country'];
      if (keyFields.some(field => addressData[field as keyof IAddressRequest])) {
        address.isVerified = false;
      }

      // Log address update
      user.addActivity({
        action: AccountAction.PROFILE_UPDATE,
        timestamp: new Date(),
        success: true,
        metadata: {
          action: 'update_address',
          addressId,
          updatedFields: Object.keys(addressData)
        }
      });

      await user.save();

      // Update cache
      if (this.redisClient) {
        await this.cacheUser(user);
      }

      logger.info('Address updated successfully', { userId, addressId });

      return {
        success: true
      };

    } catch (error: any) {
      logger.error('Failed to update address:', error);
      return {
        success: false,
        error: 'Failed to update address'
      };
    }
  }

  async deleteAddress(userId: string, addressId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await User.findById(userId) as IUserDocument;
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      const addressIndex = user.profile.addresses.findIndex(
        addr => addr._id?.toString() === addressId
      );

      if (addressIndex === -1) {
        return {
          success: false,
          error: 'Address not found'
        };
      }

      const deletedAddress = user.profile.addresses[addressIndex];
      user.profile.addresses.splice(addressIndex, 1);

      // Log address deletion
      user.addActivity({
        action: AccountAction.PROFILE_UPDATE,
        timestamp: new Date(),
        success: true,
        metadata: {
          action: 'delete_address',
          addressId,
          addressType: deletedAddress.type
        }
      });

      await user.save();

      // Update cache
      if (this.redisClient) {
        await this.cacheUser(user);
      }

      logger.info('Address deleted successfully', { userId, addressId });

      return {
        success: true
      };

    } catch (error: any) {
      logger.error('Failed to delete address:', error);
      return {
        success: false,
        error: 'Failed to delete address'
      };
    }
  }

  // ==================== PREFERENCES MANAGEMENT ====================

  async updatePreferences(userId: string, preferences: Partial<IUserPreferences>): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await User.findById(userId) as IUserDocument;
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Merge preferences
      user.profile.preferences = this.mergePreferences(user.profile.preferences, preferences);

      // Log preferences update
      user.addActivity({
        action: AccountAction.PROFILE_UPDATE,
        timestamp: new Date(),
        success: true,
        metadata: {
          action: 'update_preferences',
          updatedFields: Object.keys(preferences)
        }
      });

      await user.save();

      // Update cache
      if (this.redisClient) {
        await this.cacheUser(user);
      }

      logger.info('Preferences updated successfully', { userId, fields: Object.keys(preferences) });

      return {
        success: true
      };

    } catch (error: any) {
      logger.error('Failed to update preferences:', error);
      return {
        success: false,
        error: 'Failed to update preferences'
      };
    }
  }

  // ==================== USER STATUS MANAGEMENT ====================

  async deactivateUser(userId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await User.findById(userId) as IUserDocument;
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      if (user.status === UserStatus.DEACTIVATED) {
        return {
          success: false,
          error: 'User is already deactivated'
        };
      }

      // Update user status
      user.status = UserStatus.DEACTIVATED;
      user.isOnline = false;

      // Log deactivation
      user.addActivity({
        action: AccountAction.ACCOUNT_SUSPENSION,
        timestamp: new Date(),
        success: true,
        metadata: {
          reason: reason || 'User requested deactivation',
          previousStatus: user.status
        }
      });

      await user.save();

      // Revoke all active sessions
      const Session = require('../models/Session').default;
      await Session.revokeAllByUserId(userId);

      // Update cache
      if (this.redisClient) {
        await this.redisClient.del(`user:${userId}`);
        await this.redisClient.del(`user_profile:${userId}`);
      }

      logger.info('User deactivated successfully', { userId, reason });

      return {
        success: true
      };

    } catch (error: any) {
      logger.error('Failed to deactivate user:', error);
      return {
        success: false,
        error: 'Failed to deactivate user'
      };
    }
  }

  async reactivateUser(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await User.findById(userId) as IUserDocument;
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      if (user.status !== UserStatus.DEACTIVATED) {
        return {
          success: false,
          error: 'User is not deactivated'
        };
      }

      // Update user status
      const newStatus = user.security.isEmailVerified ? UserStatus.ACTIVE : UserStatus.PENDING_VERIFICATION;
      user.status = newStatus;

      // Log reactivation
      user.addActivity({
        action: AccountAction.ACCOUNT_REACTIVATION,
        timestamp: new Date(),
        success: true,
        metadata: {
          newStatus
        }
      });

      await user.save();

      // Update cache
      if (this.redisClient) {
        await this.cacheUser(user);
      }

      logger.info('User reactivated successfully', { userId, newStatus });

      return {
        success: true
      };

    } catch (error: any) {
      logger.error('Failed to reactivate user:', error);
      return {
        success: false,
        error: 'Failed to reactivate user'
      };
    }
  }

  // ==================== UTILITY METHODS ====================

  private mergePreferences(current: IUserPreferences, updates: Partial<IUserPreferences>): IUserPreferences {
    const merged = { ...current };

    if (updates.language) merged.language = updates.language;
    if (updates.timezone) merged.timezone = updates.timezone;
    if (updates.currency) merged.currency = updates.currency;
    if (updates.theme) merged.theme = updates.theme;
    if (updates.newsletter !== undefined) merged.newsletter = updates.newsletter;
    if (updates.marketing !== undefined) merged.marketing = updates.marketing;

    if (updates.notifications) {
      merged.notifications = updates.notifications;
    }

    if (updates.privacy) {
      merged.privacy = { ...merged.privacy, ...updates.privacy };
    }

    if (updates.twoFactorAuth) {
      merged.twoFactorAuth = { ...merged.twoFactorAuth, ...updates.twoFactorAuth };
    }

    return merged;
  }

  private validateImageFile(file: any): { isValid: boolean; error?: string } {
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return {
        isValid: false,
        error: 'File size must be less than 10MB'
      };
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return {
        isValid: false,
        error: 'File type must be JPEG, PNG, or WebP'
      };
    }

    return { isValid: true };
  }

  private validateAddressData(addressData: IAddressRequest): { isValid: boolean; error?: string } {
    // Required fields validation
    const requiredFields = ['firstName', 'lastName', 'addressLine1', 'city', 'state', 'postalCode', 'country'];
    
    for (const field of requiredFields) {
      if (!addressData[field as keyof IAddressRequest]) {
        return {
          isValid: false,
          error: `${field} is required`
        };
      }
    }

    // Validate address type
    if (!Object.values(AddressType).includes(addressData.type)) {
      return {
        isValid: false,
        error: 'Invalid address type'
      };
    }

    // Validate postal code format (basic validation)
    if (addressData.postalCode.length < 3 || addressData.postalCode.length > 20) {
      return {
        isValid: false,
        error: 'Invalid postal code format'
      };
    }

    // Validate phone number format if provided
    if (addressData.phone && !/^[+]?[\d\s\-\(\)]{10,20}$/.test(addressData.phone)) {
      return {
        isValid: false,
        error: 'Invalid phone number format'
      };
    }

    return { isValid: true };
  }

  private async uploadImageToStorage(
    imageBuffer: Buffer, 
    userId: string, 
    type: 'avatar' | 'document'
  ): Promise<{ success: boolean; url?: string; publicId?: string; provider?: 'local' | 'cloudinary' | 'aws'; error?: string }> {
    const filename = `${type}_${userId}_${Date.now()}.jpg`;

    // Try Cloudinary first
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      try {
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              resource_type: 'image',
              public_id: `users/${userId}/${filename}`,
              folder: `users/${userId}`,
              transformation: [
                { width: 400, height: 400, crop: 'fill' },
                { quality: 'auto' },
                { format: 'jpg' }
              ]
            },
            (error: any, result: any) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(imageBuffer);
        });

        return {
          success: true,
          url: (result as any).secure_url,
          publicId: (result as any).public_id,
          provider: 'cloudinary'
        };
      } catch (error) {
        logger.warn('Cloudinary upload failed:', error);
      }
    }

    // Try AWS S3
    if (this.s3Client && process.env.AWS_S3_BUCKET) {
      try {
        const key = `users/${userId}/${filename}`;
        const upload = new Upload({
          client: this.s3Client,
          params: {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: key,
            Body: imageBuffer,
            ContentType: 'image/jpeg',
            ACL: 'public-read'
          }
        });
        
        const result = await upload.done();
        const url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;

        return {
          success: true,
          url: url,
          publicId: key,
          provider: 'aws'
        };
      } catch (error) {
        logger.warn('AWS S3 upload failed:', error);
      }
    }

    // Fallback to local storage
    try {
      const uploadsDir = path.join(process.cwd(), 'uploads', 'users', userId);
      
      // Ensure directory exists
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const filePath = path.join(uploadsDir, filename);
      fs.writeFileSync(filePath, imageBuffer);

      const baseUrl = process.env.API_BASE_URL || 'http://localhost:3003';
      const url = `${baseUrl}/uploads/users/${userId}/${filename}`;

      return {
        success: true,
        url,
        publicId: filename,
        provider: 'local'
      };
    } catch (error) {
      logger.error('Local storage upload failed:', error);
      return {
        success: false,
        error: 'Failed to upload image'
      };
    }
  }

  private async deleteImageFromStorage(publicId: string, provider: string): Promise<void> {
    try {
      switch (provider) {
        case 'cloudinary':
          if (process.env.CLOUDINARY_CLOUD_NAME) {
            await cloudinary.uploader.destroy(publicId);
          }
          break;

        case 'aws':
          if (this.s3Client && process.env.AWS_S3_BUCKET) {
            const command = new DeleteObjectCommand({
              Bucket: process.env.AWS_S3_BUCKET,
              Key: publicId
            });
            await this.s3Client.send(command);
          }
          break;

        case 'local':
          const filePath = path.join(process.cwd(), 'uploads', publicId);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
          break;
      }
    } catch (error) {
      logger.warn('Failed to delete old image:', error);
    }
  }

  private async cacheUser(user: any): Promise<void> {
    if (!this.redisClient) return;
    
    try {
      const cacheKey = `user:${user._id}`;
      const userData = {
        id: user._id,
        email: user.email,
        roles: user.roles,
        status: user.status,
        isEmailVerified: user.security.isEmailVerified,
        profile: user.profile
      };

      await this.redisClient.setEx(cacheKey, 3600, JSON.stringify(userData)); // 1 hour

      // Also cache just the profile for quick access
      const profileCacheKey = `user_profile:${user._id}`;
      await this.redisClient.setEx(profileCacheKey, 1800, JSON.stringify(user.profile)); // 30 minutes
      
    } catch (error) {
      logger.warn('Failed to cache user:', error);
    }
  }

  // ==================== BULK OPERATIONS ====================

  async getUsers(query: any = {}): Promise<{ success: boolean; users?: any[]; total?: number; error?: string }> {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        status,
        role,
        sort = { field: 'createdAt', direction: 'desc' }
      } = query;

      const filter: any = {};

      // Add status filter
      if (status) {
        filter.status = status;
      }

      // Add role filter
      if (role) {
        filter.roles = { $in: [role] };
      }

      // Add search filter
      if (search) {
        filter.$or = [
          { email: { $regex: search, $options: 'i' } },
          { username: { $regex: search, $options: 'i' } },
          { 'profile.firstName': { $regex: search, $options: 'i' } },
          { 'profile.lastName': { $regex: search, $options: 'i' } }
        ];
      }

      const sortField = sort.field || 'createdAt';
      const sortDirection = sort.direction === 'asc' ? 1 : -1;

      const [users, total] = await Promise.all([
        User.find(filter)
          .select('-security.passwordHash -security.passwordSalt -security.passwordResetToken -security.emailVerificationToken -security.mfaSettings.secret -security.mfaSettings.backupCodes')
          .sort({ [sortField]: sortDirection })
          .limit(limit * 1)
          .skip((page - 1) * limit)
          .lean(),
        User.countDocuments(filter)
      ]);

      return {
        success: true,
        users,
        total
      };

    } catch (error: any) {
      logger.error('Failed to get users:', error);
      return {
        success: false,
        error: 'Failed to retrieve users'
      };
    }
  }

  async getUserStats(): Promise<{ success: boolean; stats?: any; error?: string }> {
    try {
      const stats = await User.aggregate([
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            activeUsers: {
              $sum: {
                $cond: [{ $eq: ['$status', UserStatus.ACTIVE] }, 1, 0]
              }
            },
            verifiedUsers: {
              $sum: {
                $cond: ['$security.isEmailVerified', 1, 0]
              }
            },
            newUsersToday: {
              $sum: {
                $cond: [
                  {
                    $gte: [
                      '$createdAt',
                      new Date(new Date().setHours(0, 0, 0, 0))
                    ]
                  },
                  1,
                  0
                ]
              }
            }
          }
        }
      ]);

      const usersByStatus = await User.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const usersByRole = await User.aggregate([
        { $unwind: '$roles' },
        {
          $group: {
            _id: '$roles',
            count: { $sum: 1 }
          }
        }
      ]);

      return {
        success: true,
        stats: {
          overview: stats[0] || {
            totalUsers: 0,
            activeUsers: 0,
            verifiedUsers: 0,
            newUsersToday: 0
          },
          byStatus: usersByStatus.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {}),
          byRole: usersByRole.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {})
        }
      };

    } catch (error: any) {
      logger.error('Failed to get user stats:', error);
      return {
        success: false,
        error: 'Failed to retrieve user statistics'
      };
    }
  }

  // ==================== ADMIN METHODS ====================

  async searchUsers(searchParams: any): Promise<{ success: boolean; users?: any[]; pagination?: any; error?: string }> {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        status,
        role,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        startDate,
        endDate,
        isEmailVerified,
        hasMfaEnabled
      } = searchParams;

      const filter: any = {};

      // Status filter
      if (status) {
        filter.status = status;
      }

      // Role filter
      if (role) {
        filter.roles = { $in: [role] };
      }

      // Search filter
      if (search) {
        filter.$or = [
          { email: { $regex: search, $options: 'i' } },
          { username: { $regex: search, $options: 'i' } },
          { 'profile.firstName': { $regex: search, $options: 'i' } },
          { 'profile.lastName': { $regex: search, $options: 'i' } },
          { 'profile.displayName': { $regex: search, $options: 'i' } }
        ];
      }

      // Date range filter
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
      }

      // Email verification filter
      if (isEmailVerified !== undefined) {
        filter['security.isEmailVerified'] = isEmailVerified;
      }

      // MFA enabled filter
      if (hasMfaEnabled !== undefined) {
        filter['security.mfaSettings.isEnabled'] = hasMfaEnabled;
      }

      const sortDirection = sortOrder === 'asc' ? 1 : -1;
      const skip = (page - 1) * limit;

      const [users, total] = await Promise.all([
        User.find(filter)
          .select('-security.passwordHash -security.passwordSalt -security.passwordResetToken -security.emailVerificationToken -security.mfaSettings.secret -security.mfaSettings.backupCodes')
          .sort({ [sortBy]: sortDirection })
          .limit(Number(limit))
          .skip(skip)
          .lean(),
        User.countDocuments(filter)
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        users,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };

    } catch (error: any) {
      logger.error('Failed to search users:', error);
      return {
        success: false,
        error: 'Failed to search users'
      };
    }
  }

  async updateUserAsAdmin(userId: string, updateData: any, adminUserId: string): Promise<{ success: boolean; user?: IUser; error?: string }> {
    try {
      const user = await User.findById(userId) as IUserDocument;
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Update allowed fields
      if (updateData.status && Object.values(UserStatus).includes(updateData.status)) {
        user.status = updateData.status;
      }

      if (updateData.roles && Array.isArray(updateData.roles)) {
        user.roles = updateData.roles;
      }

      if (updateData.profile) {
        if (updateData.profile.firstName) user.profile.firstName = updateData.profile.firstName;
        if (updateData.profile.lastName) user.profile.lastName = updateData.profile.lastName;
        if (updateData.profile.displayName !== undefined) user.profile.displayName = updateData.profile.displayName;
        if (updateData.profile.bio !== undefined) user.profile.bio = updateData.profile.bio;
      }

      // Log admin action
      user.addActivity({
        action: AccountAction.ADMIN_UPDATE,
        timestamp: new Date(),
        success: true,
        metadata: {
          adminUserId,
          updatedFields: Object.keys(updateData),
          updatedBy: 'admin'
        }
      });

      await user.save();

      // Update cache
      if (this.redisClient) {
        await this.cacheUser(user);
      }

      logger.info('User updated by admin', { userId, adminUserId, fields: Object.keys(updateData) });

      return {
        success: true,
        user: user as IUser
      };

    } catch (error: any) {
      logger.error('Failed to update user as admin:', error);
      return {
        success: false,
        error: 'Failed to update user'
      };
    }
  }

  async suspendUser(userId: string, reason: string, duration?: number, adminUserId?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await User.findById(userId) as IUserDocument;
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      const previousStatus = user.status;
      user.status = UserStatus.SUSPENDED;
      user.isOnline = false;

      // Set suspension end date if duration provided
      let suspensionEndDate;
      if (duration) {
        suspensionEndDate = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);
        user.suspensionEndDate = suspensionEndDate;
      }

      // Log suspension
      user.addActivity({
        action: AccountAction.ACCOUNT_SUSPENSION,
        timestamp: new Date(),
        success: true,
        metadata: {
          reason,
          duration,
          suspensionEndDate,
          adminUserId,
          previousStatus
        }
      });

      await user.save();

      // Revoke all active sessions
      const Session = require('../models/Session').default;
      await Session.revokeAllByUserId(userId);

      // Update cache
      if (this.redisClient) {
        await this.redisClient.del(`user:${userId}`);
      }

      logger.info('User suspended', { userId, reason, duration, adminUserId });

      return {
        success: true
      };

    } catch (error: any) {
      logger.error('Failed to suspend user:', error);
      return {
        success: false,
        error: 'Failed to suspend user'
      };
    }
  }

  async deleteUser(userId: string, reason: string, adminUserId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await User.findById(userId) as IUserDocument;
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Log deletion before removing
      user.addActivity({
        action: AccountAction.ACCOUNT_DELETION,
        timestamp: new Date(),
        success: true,
        metadata: {
          reason,
          adminUserId,
          deletedBy: 'admin'
        }
      });

      await user.save();

      // Remove from all sessions
      const Session = require('../models/Session').default;
      await Session.revokeAllByUserId(userId);

      // Delete user
      await User.findByIdAndDelete(userId);

      // Remove from cache
      if (this.redisClient) {
        await this.redisClient.del(`user:${userId}`);
        await this.redisClient.del(`user_profile:${userId}`);
      }

      logger.info('User deleted by admin', { userId, reason, adminUserId });

      return {
        success: true
      };

    } catch (error: any) {
      logger.error('Failed to delete user:', error);
      return {
        success: false,
        error: 'Failed to delete user'
      };
    }
  }

  async performBulkAction(bulkRequest: any, adminUserId: string): Promise<{ success: boolean; results?: any; error?: string }> {
    try {
      const { action, userIds, reason, metadata } = bulkRequest;
      const results = {
        successful: [] as string[],
        failed: [] as { userId: string; error: string }[],
        total: userIds.length
      };

      for (const userId of userIds) {
        try {
          let result;
          switch (action) {
            case 'activate':
              result = await this.reactivateUser(userId);
              break;
            case 'suspend':
              result = await this.suspendUser(userId, reason, metadata?.duration, adminUserId);
              break;
            case 'deactivate':
              result = await this.deactivateUser(userId, reason);
              break;
            default:
              throw new Error(`Unsupported bulk action: ${action}`);
          }

          if (result.success) {
            results.successful.push(userId);
          } else {
            results.failed.push({ userId, error: result.error || 'Unknown error' });
          }
        } catch (error: any) {
          results.failed.push({ userId, error: error.message });
        }
      }

      logger.info('Bulk action completed', {
        action,
        adminUserId,
        total: results.total,
        successful: results.successful.length,
        failed: results.failed.length
      });

      return {
        success: true,
        results
      };

    } catch (error: any) {
      logger.error('Failed to perform bulk action:', error);
      return {
        success: false,
        error: 'Failed to perform bulk action'
      };
    }
  }

  async getUserAnalytics(params: any): Promise<{ success: boolean; analytics?: any; error?: string }> {
    try {
      const { period, startDate, endDate } = params;
      
      let dateFilter: any = {};
      if (startDate && endDate) {
        dateFilter = {
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        };
      } else if (period) {
        const now = new Date();
        const periodDays = {
          '7d': 7,
          '30d': 30,
          '90d': 90,
          '1y': 365
        };
        
        const days = periodDays[period as keyof typeof periodDays] || 30;
        dateFilter = {
          createdAt: {
            $gte: new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
          }
        };
      }

      const [registrationTrend, statusDistribution, roleDistribution, activityStats] = await Promise.all([
        // Registration trend
        User.aggregate([
          { $match: dateFilter },
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
                day: { $dayOfMonth: '$createdAt' }
              },
              count: { $sum: 1 }
            }
          },
          { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]),

        // Status distribution
        User.aggregate([
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 }
            }
          }
        ]),

        // Role distribution
        User.aggregate([
          { $unwind: '$roles' },
          {
            $group: {
              _id: '$roles',
              count: { $sum: 1 }
            }
          }
        ]),

        // Activity stats
        User.aggregate([
          {
            $group: {
              _id: null,
              totalUsers: { $sum: 1 },
              verifiedUsers: {
                $sum: { $cond: ['$security.isEmailVerified', 1, 0] }
              },
              mfaEnabledUsers: {
                $sum: { $cond: ['$security.mfaSettings.isEnabled', 1, 0] }
              },
              onlineUsers: {
                $sum: { $cond: ['$isOnline', 1, 0] }
              }
            }
          }
        ])
      ]);

      return {
        success: true,
        analytics: {
          registrationTrend,
          statusDistribution: statusDistribution.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {}),
          roleDistribution: roleDistribution.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {}),
          activityStats: activityStats[0] || {
            totalUsers: 0,
            verifiedUsers: 0,
            mfaEnabledUsers: 0,
            onlineUsers: 0
          }
        }
      };

    } catch (error: any) {
      logger.error('Failed to get user analytics:', error);
      return {
        success: false,
        error: 'Failed to get user analytics'
      };
    }
  }

  async getAuditLogs(params: any): Promise<{ success: boolean; logs?: any[]; pagination?: any; error?: string }> {
    try {
      const {
        page = 1,
        limit = 50,
        action,
        userId,
        startDate,
        endDate
      } = params;

      const filter: any = {};

      if (action) {
        filter['activityLog.action'] = action;
      }

      if (userId) {
        filter._id = userId;
      }

      if (startDate || endDate) {
        filter['activityLog.timestamp'] = {};
        if (startDate) filter['activityLog.timestamp'].$gte = new Date(startDate);
        if (endDate) filter['activityLog.timestamp'].$lte = new Date(endDate);
      }

      const skip = (page - 1) * limit;

      const [logs, total] = await Promise.all([
        User.aggregate([
          { $unwind: '$activityLog' },
          { $match: filter },
          {
            $project: {
              userId: '$_id',
              email: '$email',
              action: '$activityLog.action',
              timestamp: '$activityLog.timestamp',
              success: '$activityLog.success',
              ipAddress: '$activityLog.ipAddress',
              userAgent: '$activityLog.userAgent',
              metadata: '$activityLog.metadata'
            }
          },
          { $sort: { timestamp: -1 } },
          { $skip: skip },
          { $limit: Number(limit) }
        ]),
        User.aggregate([
          { $unwind: '$activityLog' },
          { $match: filter },
          { $count: 'total' }
        ])
      ]);

      const totalCount = total[0]?.total || 0;
      const totalPages = Math.ceil(totalCount / limit);

      return {
        success: true,
        logs,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount,
          pages: totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };

    } catch (error: any) {
      logger.error('Failed to get audit logs:', error);
      return {
        success: false,
        error: 'Failed to get audit logs'
      };
    }
  }

  async clearSystemCache(adminUserId: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.redisClient) {
        return {
          success: false,
          error: 'Redis cache not available'
        };
      }

      const keys = await this.redisClient.keys('user:*');
      if (keys.length > 0) {
        await this.redisClient.del(keys);
      }

      const profileKeys = await this.redisClient.keys('user_profile:*');
      if (profileKeys.length > 0) {
        await this.redisClient.del(profileKeys);
      }

      logger.info('System cache cleared by admin', { adminUserId, clearedKeys: keys.length + profileKeys.length });

      return {
        success: true
      };

    } catch (error: any) {
      logger.error('Failed to clear system cache:', error);
      return {
        success: false,
        error: 'Failed to clear system cache'
      };
    }
  }
}

export default UserService;
