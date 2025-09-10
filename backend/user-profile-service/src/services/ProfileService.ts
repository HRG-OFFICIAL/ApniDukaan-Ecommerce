import { EventEmitter } from 'events';
import UserProfile from '../models/UserProfile';
import {
  IUserProfile,
  ICreateProfileRequest,
  IUpdateProfileRequest,
  IAddAddressRequest,
  IUpdateAddressRequest,
  IAddWishlistItemRequest,
  IUpdateWishlistItemRequest,
  IShareWishlistRequest,
  IProfileResponse,
  IAddressResponse,
  IWishlistResponse,
  IAddressValidationResult,
  IProfileStatistics,
  IProfileEvent,
  ProfileEventType,
  IUserPreferences,
  IAccountSettings
} from '../types/profile.types';
import { logger } from '@apnidukaan/shared';

// Mock interfaces for external services (replace with actual service calls)
interface IProductInfo {
  _id: string;
  name: string;
  price: number;
  images: string[];
  inStock: boolean;
  category: string;
}

interface IOrderStats {
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  favoriteCategories: Array<{
    category: string;
    orderCount: number;
    totalSpent: number;
  }>;
  lastOrderDate?: Date;
}

class ProfileService extends EventEmitter {
  constructor() {
    super();
  }

  /**
   * Create a new user profile
   */
  async createProfile(profileData: ICreateProfileRequest): Promise<IProfileResponse> {
    try {
      // Check if profile already exists
      const existingProfile = await (UserProfile as any).findByUserId(profileData.userId);
      if (existingProfile) {
        return {
          success: false,
          error: 'Profile already exists for this user',
          code: 'PROFILE_EXISTS'
        };
      }

      // Check if email is already in use
      const existingEmail = await (UserProfile as any).findByEmail(profileData.personalInfo.email);
      if (existingEmail) {
        return {
          success: false,
          error: 'Email already registered with another profile',
          code: 'EMAIL_EXISTS'
        };
      }

      // Create new profile with default preferences and settings
      const profile = new UserProfile({
        userId: profileData.userId,
        personalInfo: profileData.personalInfo,
        preferences: profileData.preferences || this.getDefaultPreferences(),
        accountSettings: this.getDefaultAccountSettings(),
        metadata: {
          loginCount: 0,
          registrationSource: profileData.registrationSource || 'web',
          referralCode: profileData.referralCode,
          isEmailVerified: false,
          isPhoneVerified: false
        },
        status: 'active'
      });

      await profile.save();

      this.emitProfileEvent('profile:created', profile, {
        registrationSource: profileData.registrationSource,
        referralCode: profileData.referralCode
      });

      logger.info('User profile created', {
        userId: profileData.userId,
        email: profileData.personalInfo.email,
        action: 'create_profile'
      });

      return {
        success: true,
        data: { profile },
        message: 'Profile created successfully'
      };
    } catch (error) {
      logger.error('Error creating profile:', error);
      
      // Check if it's a validation error
      if (error instanceof Error && error.name === 'ValidationError') {
        return {
          success: false,
          error: 'Validation failed',
          code: 'VALIDATION_ERROR'
        };
      }
      
      return {
        success: false,
        error: 'Failed to create profile',
        code: 'CREATE_PROFILE_ERROR'
      };
    }
  }

  /**
   * Get user profile by user ID
   */
  async getProfile(userId: string): Promise<IProfileResponse> {
    try {
      const profile = await (UserProfile as any).findByUserId(userId);

      if (!profile) {
        return {
          success: false,
          error: 'Profile not found',
          code: 'PROFILE_NOT_FOUND'
        };
      }

      return {
        success: true,
        message: 'Profile retrieved successfully',
        data: { profile }
      };
    } catch (error) {
      logger.error('Error getting profile:', error);
      return {
        success: false,
        error: 'Failed to retrieve profile',
        code: 'GET_PROFILE_ERROR'
      };
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    updateData: IUpdateProfileRequest
  ): Promise<IProfileResponse> {
    try {
      const profile = await (UserProfile as any).findByUserId(userId);
      if (!profile) {
        return {
          success: false,
          error: 'Profile not found',
          code: 'PROFILE_NOT_FOUND'
        };
      }

      // Check if email is being changed and if it's already in use
      if (updateData.personalInfo?.email && 
          updateData.personalInfo.email !== profile.personalInfo.email) {
        const existingEmail = await (UserProfile as any).findByEmail(updateData.personalInfo.email);
        if (existingEmail) {
          return {
            success: false,
            error: 'Email already registered with another profile',
            code: 'EMAIL_EXISTS'
          };
        }
      }

      // Update profile fields
      if (updateData.personalInfo) {
        Object.assign(profile.personalInfo, updateData.personalInfo);
      }

      if (updateData.preferences) {
        profile.preferences = { ...profile.preferences, ...updateData.preferences };
      }

      if (updateData.accountSettings) {
        profile.accountSettings = { ...profile.accountSettings, ...updateData.accountSettings };
      }

      await profile.save();

      this.emitProfileEvent('profile:updated', profile, {
        updatedFields: Object.keys(updateData)
      });

      logger.info('User profile updated', {
        userId,
        updatedFields: Object.keys(updateData),
        action: 'update_profile'
      });

      return {
        success: true,
        data: { profile },
        message: 'Profile updated successfully'
      };
    } catch (error) {
      logger.error('Error updating profile:', error);
      return {
        success: false,
        error: 'Failed to update profile',
        code: 'UPDATE_PROFILE_ERROR'
      };
    }
  }

  /**
   * Delete user profile (soft delete)
   */
  async deleteProfile(userId: string): Promise<IProfileResponse> {
    try {
      const profile = await (UserProfile as any).findByUserId(userId);
      if (!profile) {
        return {
          success: false,
          error: 'Profile not found',
          code: 'PROFILE_NOT_FOUND'
        };
      }

      profile.status = 'deleted';
      profile.personalInfo.email = `deleted_${Date.now()}@${profile.personalInfo.email}`;
      await profile.save();

      this.emitProfileEvent('profile:deleted', profile);

      logger.info('User profile deleted', {
        userId,
        action: 'delete_profile'
      });

      return {
        success: true,
        message: 'Profile deleted successfully'
      };
    } catch (error) {
      logger.error('Error deleting profile:', error);
      return {
        success: false,
        error: 'Failed to delete profile',
        code: 'DELETE_PROFILE_ERROR'
      };
    }
  }

  /**
   * Add address to user profile
   */
  async addAddress(userId: string, addressData: IAddAddressRequest): Promise<IAddressResponse> {
    try {
      const profile = await (UserProfile as any).findByUserId(userId);
      if (!profile) {
        return {
          success: false,
          error: 'Profile not found',
          code: 'PROFILE_NOT_FOUND'
        };
      }

      // Validate address if validation is enabled
      if (process.env.ADDRESS_VALIDATION_ENABLED === 'true') {
        const validationResult = await this.validateAddress(addressData);
        if (!validationResult.isValid) {
          return {
            success: false,
            error: 'Invalid address',
            code: 'INVALID_ADDRESS'
          };
        }
      }

      await profile.addAddress(addressData);

      const addedAddress = profile.addresses[profile.addresses.length - 1];

      this.emitProfileEvent('address:added', profile, {
        addressType: addressData.type,
        isDefault: addressData.isDefault
      });

      logger.info('Address added to profile', {
        userId,
        addressType: addressData.type,
        isDefault: addressData.isDefault,
        action: 'add_address'
      });

      return {
        success: true,
        message: 'Address added successfully',
        data: { 
          address: addedAddress,
          addresses: profile.addresses
        }
      };
    } catch (error) {
      logger.error('Error adding address:', error);
      return {
        success: false,
        error: 'Failed to add address',
        code: 'ADD_ADDRESS_ERROR'
      };
    }
  }

  /**
   * Update address in user profile
   */
  async updateAddress(
    userId: string,
    addressId: string,
    updateData: IUpdateAddressRequest
  ): Promise<IAddressResponse> {
    try {
      const profile = await (UserProfile as any).findByUserId(userId);
      if (!profile) {
        return {
          success: false,
          error: 'Profile not found',
          code: 'PROFILE_NOT_FOUND'
        };
      }

      await profile.updateAddress(addressId, updateData);

      const updatedAddress = profile.addresses.id(addressId);

      this.emitProfileEvent('address:updated', profile, {
        addressId,
        updatedFields: Object.keys(updateData)
      });

      logger.info('Address updated', {
        userId,
        addressId,
        updatedFields: Object.keys(updateData),
        action: 'update_address'
      });

      return {
        success: true,
        message: 'Address updated successfully',
        data: { 
          address: updatedAddress!,
          addresses: profile.addresses
        }
      };
    } catch (error) {
      logger.error('Error updating address:', error);
      return {
        success: false,
        error: (error as Error).message || 'Failed to update address',
        code: 'UPDATE_ADDRESS_ERROR'
      };
    }
  }

  /**
   * Remove address from user profile
   */
  async removeAddress(userId: string, addressId: string): Promise<IAddressResponse> {
    try {
      const profile = await (UserProfile as any).findByUserId(userId);
      if (!profile) {
        return {
          success: false,
          error: 'Profile not found',
          code: 'PROFILE_NOT_FOUND'
        };
      }

      await profile.removeAddress(addressId);

      this.emitProfileEvent('address:deleted', profile, { addressId });

      logger.info('Address removed', {
        userId,
        addressId,
        action: 'remove_address'
      });

      return {
        success: true,
        message: 'Address removed successfully',
        data: { 
          addresses: profile.addresses,
          address: profile.addresses.find((addr: any) => addr.isDefault) || profile.addresses[0]
        }
      };
    } catch (error) {
      logger.error('Error removing address:', error);
      return {
        success: false,
        error: (error as Error).message || 'Failed to remove address',
        code: 'REMOVE_ADDRESS_ERROR'
      };
    }
  }

  /**
   * Set default address
   */
  async setDefaultAddress(userId: string, addressId: string): Promise<IAddressResponse> {
    try {
      const profile = await (UserProfile as any).findByUserId(userId);
      if (!profile) {
        return {
          success: false,
          error: 'Profile not found',
          code: 'PROFILE_NOT_FOUND'
        };
      }

      const address = profile.addresses.id(addressId);
      if (!address) {
        return {
          success: false,
          error: 'Address not found',
          code: 'ADDRESS_NOT_FOUND'
        };
      }

      await profile.updateAddress(addressId, { isDefault: true });

      this.emitProfileEvent('address:set_default', profile, {
        addressId,
        addressType: address.type
      });

      logger.info('Default address set', {
        userId,
        addressId,
        addressType: address.type,
        action: 'set_default_address'
      });

      return {
        success: true,
        message: 'Default address set successfully',
        data: { 
          address: profile.addresses.id(addressId)!,
          addresses: profile.addresses
        }
      };
    } catch (error) {
      logger.error('Error setting default address:', error);
      return {
        success: false,
        error: 'Failed to set default address',
        code: 'SET_DEFAULT_ADDRESS_ERROR'
      };
    }
  }

  /**
   * Add item to wishlist
   */
  async addToWishlist(
    userId: string,
    wishlistData: IAddWishlistItemRequest
  ): Promise<IWishlistResponse> {
    try {
      const profile = await (UserProfile as any).findByUserId(userId);
      if (!profile) {
        return {
          success: false,
          error: 'Profile not found',
          code: 'PROFILE_NOT_FOUND'
        };
      }

      // Validate product exists (mock implementation)
      const productInfo = await this.getProductInfo(wishlistData.productId);
      if (!productInfo) {
        return {
          success: false,
          error: 'Product not found',
          code: 'PRODUCT_NOT_FOUND'
        };
      }

      await profile.addToWishlist({
        productId: wishlistData.productId,
        variantId: wishlistData.variantId,
        priority: wishlistData.priority || 'medium',
        notes: wishlistData.notes,
        notifyOnSale: wishlistData.notifyOnSale ?? true,
        notifyOnRestock: wishlistData.notifyOnRestock ?? true
      });

      const addedItem = profile.wishlist[profile.wishlist.length - 1];

      this.emitProfileEvent('wishlist:item_added', profile, {
        productId: wishlistData.productId,
        variantId: wishlistData.variantId,
        priority: wishlistData.priority
      });

      logger.info('Item added to wishlist', {
        userId,
        productId: wishlistData.productId,
        variantId: wishlistData.variantId,
        action: 'add_to_wishlist'
      });

      return {
        success: true,
        message: 'Item added to wishlist successfully',
        data: { 
          item: addedItem,
          wishlist: profile.wishlist,
          totalItems: profile.wishlist.length
        }
      };
    } catch (error) {
      logger.error('Error adding to wishlist:', error);
      return {
        success: false,
        error: (error as Error).message || 'Failed to add item to wishlist',
        code: 'ADD_TO_WISHLIST_ERROR'
      };
    }
  }

  /**
   * Update wishlist item
   */
  async updateWishlistItem(
    userId: string,
    itemId: string,
    updateData: IUpdateWishlistItemRequest
  ): Promise<IWishlistResponse> {
    try {
      const profile = await (UserProfile as any).findByUserId(userId);
      if (!profile) {
        return {
          success: false,
          error: 'Profile not found',
          code: 'PROFILE_NOT_FOUND'
        };
      }

      await profile.updateWishlistItem(itemId, updateData);

      const updatedItem = profile.wishlist.id(itemId);

      this.emitProfileEvent('wishlist:item_updated', profile, {
        itemId,
        updatedFields: Object.keys(updateData)
      });

      logger.info('Wishlist item updated', {
        userId,
        itemId,
        updatedFields: Object.keys(updateData),
        action: 'update_wishlist_item'
      });

      return {
        success: true,
        message: 'Wishlist item updated successfully',
        data: { 
          item: updatedItem!,
          wishlist: profile.wishlist,
          totalItems: profile.wishlist.length
        }
      };
    } catch (error) {
      logger.error('Error updating wishlist item:', error);
      return {
        success: false,
        error: (error as Error).message || 'Failed to update wishlist item',
        code: 'UPDATE_WISHLIST_ITEM_ERROR'
      };
    }
  }

  /**
   * Remove item from wishlist
   */
  async removeFromWishlist(userId: string, itemId: string): Promise<IWishlistResponse> {
    try {
      const profile = await (UserProfile as any).findByUserId(userId);
      if (!profile) {
        return {
          success: false,
          error: 'Profile not found',
          code: 'PROFILE_NOT_FOUND'
        };
      }

      const item = profile.wishlist.id(itemId);
      if (!item) {
        return {
          success: false,
          error: 'Wishlist item not found',
          code: 'WISHLIST_ITEM_NOT_FOUND'
        };
      }

      const productId = item.productId;
      const variantId = item.variantId;

      await profile.removeFromWishlist(itemId);

      this.emitProfileEvent('wishlist:item_removed', profile, {
        itemId,
        productId,
        variantId
      });

      logger.info('Item removed from wishlist', {
        userId,
        itemId,
        productId,
        variantId,
        action: 'remove_from_wishlist'
      });

      return {
        success: true,
        message: 'Item removed from wishlist successfully',
        data: { 
          wishlist: profile.wishlist,
          totalItems: profile.wishlist.length
        }
      };
    } catch (error) {
      logger.error('Error removing from wishlist:', error);
      return {
        success: false,
        error: (error as Error).message || 'Failed to remove item from wishlist',
        code: 'REMOVE_FROM_WISHLIST_ERROR'
      };
    }
  }

  /**
   * Get wishlist with product details
   */
  async getWishlistWithDetails(userId: string): Promise<IWishlistResponse> {
    try {
      const profile = await (UserProfile as any).findByUserId(userId);
      if (!profile) {
        return {
          success: false,
          error: 'Profile not found',
          code: 'PROFILE_NOT_FOUND'
        };
      }

      // In a real implementation, this would fetch product details for each wishlist item
      const wishlistWithDetails = await Promise.all(
        profile.wishlist.map(async (item: any) => {
          const productInfo = await this.getProductInfo(item.productId);
          return {
            ...item.toObject(),
            productInfo
          };
        })
      );

      return {
        success: true,
        message: 'Wishlist with details retrieved successfully',
        data: { 
          wishlist: wishlistWithDetails as any,
          totalItems: profile.wishlist.length
        }
      };
    } catch (error) {
      logger.error('Error getting wishlist with details:', error);
      return {
        success: false,
        error: 'Failed to get wishlist',
        code: 'GET_WISHLIST_ERROR'
      };
    }
  }

  /**
   * Update user preferences
   */
  async updatePreferences(
    userId: string,
    preferences: Partial<IUserPreferences>
  ): Promise<IProfileResponse> {
    try {
      const profile = await (UserProfile as any).findByUserId(userId);
      if (!profile) {
        return {
          success: false,
          error: 'Profile not found',
          code: 'PROFILE_NOT_FOUND'
        };
      }

      profile.preferences = { ...profile.preferences, ...preferences };
      await profile.save();

      this.emitProfileEvent('preferences:updated', profile, {
        updatedPreferences: Object.keys(preferences)
      });

      logger.info('User preferences updated', {
        userId,
        updatedPreferences: Object.keys(preferences),
        action: 'update_preferences'
      });

      return {
        success: true,
        data: { profile },
        message: 'Preferences updated successfully'
      };
    } catch (error) {
      logger.error('Error updating preferences:', error);
      return {
        success: false,
        error: 'Failed to update preferences',
        code: 'UPDATE_PREFERENCES_ERROR'
      };
    }
  }

  /**
   * Update account settings
   */
  async updateAccountSettings(
    userId: string,
    settings: Partial<IAccountSettings>
  ): Promise<IProfileResponse> {
    try {
      const profile = await (UserProfile as any).findByUserId(userId);
      if (!profile) {
        return {
          success: false,
          error: 'Profile not found',
          code: 'PROFILE_NOT_FOUND'
        };
      }

      profile.accountSettings = { ...profile.accountSettings, ...settings };
      await profile.save();

      this.emitProfileEvent('settings:updated', profile, {
        updatedSettings: Object.keys(settings)
      });

      logger.info('Account settings updated', {
        userId,
        updatedSettings: Object.keys(settings),
        action: 'update_settings'
      });

      return {
        success: true,
        data: { profile },
        message: 'Account settings updated successfully'
      };
    } catch (error) {
      logger.error('Error updating account settings:', error);
      return {
        success: false,
        error: 'Failed to update account settings',
        code: 'UPDATE_SETTINGS_ERROR'
      };
    }
  }

  /**
   * Get profile statistics
   */
  async getProfileStatistics(userId: string): Promise<IProfileStatistics | null> {
    try {
      const profile = await (UserProfile as any).findByUserId(userId);
      if (!profile) {
        return null;
      }

      // Mock order statistics (replace with actual order service call)
      const orderStats = await this.getUserOrderStats(userId);

      return {
        totalOrders: orderStats.totalOrders,
        totalSpent: orderStats.totalSpent,
        averageOrderValue: orderStats.averageOrderValue,
        favoriteCategories: orderStats.favoriteCategories,
        loyaltyPoints: profile.loyaltyProgram?.points || 0,
        memberSince: profile.createdAt,
        lastOrderDate: orderStats.lastOrderDate
      };
    } catch (error) {
      logger.error('Error getting profile statistics:', error);
      return null;
    }
  }

  /**
   * Add loyalty points to user profile
   */
  async addLoyaltyPoints(userId: string, points: number, reason: string): Promise<IProfileResponse> {
    try {
      const profile = await (UserProfile as any).findByUserId(userId);
      if (!profile) {
        return {
          success: false,
          error: 'Profile not found',
          code: 'PROFILE_NOT_FOUND'
        };
      }

      const oldTier = profile.loyaltyProgram?.tier;
      await profile.addLoyaltyPoints(points);
      const newTier = profile.loyaltyProgram?.tier;

      if (oldTier !== newTier) {
        this.emitProfileEvent('loyalty:tier_changed', profile, {
          oldTier,
          newTier,
          points: profile.loyaltyProgram?.points
        });
      }

      logger.info('Loyalty points added', {
        userId,
        points,
        reason,
        totalPoints: profile.loyaltyProgram?.points,
        tier: profile.loyaltyProgram?.tier,
        action: 'add_loyalty_points'
      });

      return {
        success: true,
        data: { profile },
        message: 'Loyalty points added successfully'
      };
    } catch (error) {
      logger.error('Error adding loyalty points:', error);
      return {
        success: false,
        error: 'Failed to add loyalty points',
        code: 'ADD_LOYALTY_POINTS_ERROR'
      };
    }
  }

  // Private helper methods

  private getDefaultPreferences(): IUserPreferences {
    return {
      notifications: {
        email: {
          orderUpdates: true,
          promotions: true,
          newsletter: false,
          recommendations: true,
          reviews: true,
          wishlistAlerts: true
        },
        sms: {
          orderUpdates: false,
          promotions: false,
          deliveryUpdates: true
        },
        push: {
          orderUpdates: true,
          promotions: false,
          recommendations: true,
          abandonedCart: true
        }
      },
      privacy: {
        profileVisibility: 'private',
        showPurchaseHistory: false,
        shareWishlist: false,
        allowRecommendations: true,
        allowDataCollection: true
      },
      display: {
        language: 'en',
        currency: 'USD',
        timezone: 'UTC',
        theme: 'auto',
        itemsPerPage: 20,
        defaultView: 'grid'
      },
      shopping: {
        savePaymentMethods: true,
        autoApplyCoupons: true,
        preferredCategories: [],
        excludedCategories: []
      }
    };
  }

  private getDefaultAccountSettings(): IAccountSettings {
    return {
      twoFactorAuth: {
        enabled: false
      },
      security: {
        sessionTimeout: 30,
        loginAlerts: true
      },
      communication: {
        preferredContactMethod: 'email'
      }
    };
  }

  private async validateAddress(addressData: any): Promise<IAddressValidationResult> {
    // Mock address validation (replace with actual service)
    return {
      isValid: true,
      coordinates: {
        latitude: 40.7128,
        longitude: -74.0060
      }
    };
  }

  private async getProductInfo(productId: string): Promise<IProductInfo | null> {
    // Mock product info (replace with actual catalog service call)
    return {
      _id: productId,
      name: 'Sample Product',
      price: 99.99,
      images: ['image1.jpg'],
      inStock: true,
      category: 'Electronics'
    };
  }

  private async getUserOrderStats(userId: string): Promise<IOrderStats> {
    // Mock order statistics (replace with actual order service call)
    return {
      totalOrders: 5,
      totalSpent: 499.95,
      averageOrderValue: 99.99,
      favoriteCategories: [
        {
          category: 'Electronics',
          orderCount: 3,
          totalSpent: 299.97
        },
        {
          category: 'Books',
          orderCount: 2,
          totalSpent: 199.98
        }
      ],
      lastOrderDate: new Date('2023-12-01')
    };
  }

  private emitProfileEvent(type: ProfileEventType, profile: IUserProfile, data?: any): void {
    const event: IProfileEvent = {
      type,
      userId: profile.userId,
      profileId: profile._id,
      data: data || {},
      timestamp: new Date()
    };

    this.emit('profile:event', event);
    this.emit(type, event);

    logger.info('Profile event emitted', {
      type,
      userId: profile.userId,
      profileId: profile._id
    });
  }
}

export default ProfileService;
