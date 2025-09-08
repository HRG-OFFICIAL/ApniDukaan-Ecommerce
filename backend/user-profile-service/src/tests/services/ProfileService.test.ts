import ProfileService from '../../services/ProfileService';
import { UserProfile } from '../../models/UserProfile';
import {
  createMockUserProfile,
  createMockCreateProfileRequest,
  createMockUpdateProfileRequest,
  createMockAddress,
  createMockWishlistItem,
  generateObjectId,
  mockExternalServices
} from '../testUtils';
import { mockRedisClient } from '../setup';

describe('ProfileService', () => {
  let profileService: ProfileService;

  beforeEach(async () => {
    await UserProfile.deleteMany({});
    profileService = new ProfileService();
    jest.clearAllMocks();
  });

  describe('createProfile', () => {
    it('should create a new profile successfully', async () => {
      const createRequest = createMockCreateProfileRequest();
      
      const result = await profileService.createProfile(createRequest);
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Profile created successfully');
      expect(result.data?.profile).toBeDefined();
      expect(result.data?.profile.userId).toBe(createRequest.userId);
      expect(result.data?.profile.personalInfo.firstName).toBe(createRequest.personalInfo.firstName);
      expect(result.data?.profile.personalInfo.email).toBe(createRequest.personalInfo.email);
    });

    it('should return error if profile already exists for user', async () => {
      const createRequest = createMockCreateProfileRequest();
      
      // Create first profile
      await profileService.createProfile(createRequest);
      
      // Try to create another profile with same userId
      const result = await profileService.createProfile(createRequest);
      
      expect(result.success).toBe(false);
      expect(result.code).toBe('PROFILE_EXISTS');
      expect(result.error).toBe('Profile already exists for this user');
    });

    it('should return error if email already exists', async () => {
      const email = 'test@example.com';
      
      // Create first profile
      const createRequest1 = createMockCreateProfileRequest();
      createRequest1.personalInfo.email = email;
      await profileService.createProfile(createRequest1);
      
      // Try to create another profile with same email
      const createRequest2 = createMockCreateProfileRequest();
      createRequest2.personalInfo.email = email;
      
      const result = await profileService.createProfile(createRequest2);
      
      expect(result.success).toBe(false);
      expect(result.code).toBe('EMAIL_EXISTS');
      expect(result.error).toBe('Email already registered with another profile');
    });

    it('should handle database errors gracefully', async () => {
      const createRequest = createMockCreateProfileRequest();
      createRequest.personalInfo.email = 'invalid-email'; // This will cause validation error
      
      const result = await profileService.createProfile(createRequest);
      
      expect(result.success).toBe(false);
      expect(result.code).toBe('VALIDATION_ERROR');
    });

    it('should emit profile created event', async () => {
      const createRequest = createMockCreateProfileRequest();
      
      await profileService.createProfile(createRequest);
      
      expect(mockExternalServices.eventBus.emit).toHaveBeenCalledWith('profile.created', expect.any(Object));
    });
  });

  describe('getProfile', () => {
    it('should return profile for valid userId', async () => {
      const profileData = createMockUserProfile();
      const profile = new UserProfile(profileData);
      await profile.save();
      
      const result = await profileService.getProfile(profileData.userId);
      
      expect(result.success).toBe(true);
      expect(result.data?.profile).toBeDefined();
      expect(result.data?.profile.userId).toBe(profileData.userId);
    });

    it('should return error for non-existent userId', async () => {
      const nonExistentUserId = generateObjectId();
      
      const result = await profileService.getProfile(nonExistentUserId);
      
      expect(result.success).toBe(false);
      expect(result.code).toBe('PROFILE_NOT_FOUND');
      expect(result.error).toBe('Profile not found');
    });

    it('should cache profile data in Redis', async () => {
      const profileData = createMockUserProfile();
      const profile = new UserProfile(profileData);
      await profile.save();
      
      mockRedisClient.get.mockResolvedValue(null); // First call - not cached
      mockRedisClient.set.mockResolvedValue('OK');
      
      const result = await profileService.getProfile(profileData.userId);
      
      expect(result.success).toBe(true);
      expect(mockRedisClient.get).toHaveBeenCalledWith(`profile:${profileData.userId}`);
      expect(mockRedisClient.set).toHaveBeenCalledWith(
        `profile:${profileData.userId}`,
        expect.any(String),
        'EX',
        1800 // 30 minutes
      );
    });

    it('should return cached profile data from Redis', async () => {
      const profileData = createMockUserProfile();
      const cachedProfile = JSON.stringify({ userId: profileData.userId, cached: true });
      
      mockRedisClient.get.mockResolvedValue(cachedProfile);
      
      const result = await profileService.getProfile(profileData.userId);
      
      expect(result.success).toBe(true);
      expect(result.data?.profile.cached).toBe(true);
      expect(mockRedisClient.get).toHaveBeenCalledWith(`profile:${profileData.userId}`);
    });
  });

  describe('updateProfile', () => {
    let existingProfile: any;

    beforeEach(async () => {
      const profileData = createMockUserProfile();
      existingProfile = new UserProfile(profileData);
      await existingProfile.save();
    });

    it('should update profile successfully', async () => {
      const updateRequest = createMockUpdateProfileRequest();
      
      const result = await profileService.updateProfile(existingProfile.userId, updateRequest);
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Profile updated successfully');
      expect(result.data?.profile.personalInfo.firstName).toBe(updateRequest.personalInfo!.firstName);
      expect(result.data?.profile.personalInfo.bio).toBe(updateRequest.personalInfo!.bio);
    });

    it('should return error for non-existent profile', async () => {
      const nonExistentUserId = generateObjectId();
      const updateRequest = createMockUpdateProfileRequest();
      
      const result = await profileService.updateProfile(nonExistentUserId, updateRequest);
      
      expect(result.success).toBe(false);
      expect(result.code).toBe('PROFILE_NOT_FOUND');
    });

    it('should return error if email already exists for another user', async () => {
      // Create another profile with different email
      const anotherProfile = new UserProfile(createMockUserProfile({
        personalInfo: { ...createMockUserProfile().personalInfo, email: 'another@example.com' }
      }));
      await anotherProfile.save();
      
      // Try to update existing profile with the other profile's email
      const updateRequest = createMockUpdateProfileRequest();
      updateRequest.personalInfo!.email = anotherProfile.personalInfo.email;
      
      const result = await profileService.updateProfile(existingProfile.userId, updateRequest);
      
      expect(result.success).toBe(false);
      expect(result.code).toBe('EMAIL_EXISTS');
    });

    it('should invalidate cache after update', async () => {
      const updateRequest = createMockUpdateProfileRequest();
      mockRedisClient.del.mockResolvedValue(1);
      
      await profileService.updateProfile(existingProfile.userId, updateRequest);
      
      expect(mockRedisClient.del).toHaveBeenCalledWith(`profile:${existingProfile.userId}`);
    });

    it('should emit profile updated event', async () => {
      const updateRequest = createMockUpdateProfileRequest();
      
      await profileService.updateProfile(existingProfile.userId, updateRequest);
      
      expect(mockExternalServices.eventBus.emit).toHaveBeenCalledWith('profile.updated', expect.any(Object));
    });
  });

  describe('deleteProfile', () => {
    let existingProfile: any;

    beforeEach(async () => {
      const profileData = createMockUserProfile();
      existingProfile = new UserProfile(profileData);
      await existingProfile.save();
    });

    it('should delete profile successfully', async () => {
      const result = await profileService.deleteProfile(existingProfile.userId);
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Profile deleted successfully');
      
      // Verify profile is deleted from database
      const deletedProfile = await UserProfile.findByUserId(existingProfile.userId);
      expect(deletedProfile).toBeNull();
    });

    it('should return error for non-existent profile', async () => {
      const nonExistentUserId = generateObjectId();
      
      const result = await profileService.deleteProfile(nonExistentUserId);
      
      expect(result.success).toBe(false);
      expect(result.code).toBe('PROFILE_NOT_FOUND');
    });

    it('should invalidate cache after deletion', async () => {
      mockRedisClient.del.mockResolvedValue(1);
      
      await profileService.deleteProfile(existingProfile.userId);
      
      expect(mockRedisClient.del).toHaveBeenCalledWith(`profile:${existingProfile.userId}`);
    });

    it('should emit profile deleted event', async () => {
      await profileService.deleteProfile(existingProfile.userId);
      
      expect(mockExternalServices.eventBus.emit).toHaveBeenCalledWith('profile.deleted', expect.any(Object));
    });
  });

  describe('Address Management', () => {
    let existingProfile: any;

    beforeEach(async () => {
      const profileData = createMockUserProfile();
      existingProfile = new UserProfile(profileData);
      await existingProfile.save();
    });

    describe('addAddress', () => {
      it('should add address successfully', async () => {
        const addressData = createMockAddress();
        delete (addressData as any)._id;
        
        const result = await profileService.addAddress(existingProfile.userId, addressData);
        
        expect(result.success).toBe(true);
        expect(result.message).toBe('Address added successfully');
        expect(result.data?.address).toBeDefined();
        expect(result.data?.address.firstName).toBe(addressData.firstName);
      });

      it('should return error for non-existent profile', async () => {
        const nonExistentUserId = generateObjectId();
        const addressData = createMockAddress();
        
        const result = await profileService.addAddress(nonExistentUserId, addressData);
        
        expect(result.success).toBe(false);
        expect(result.code).toBe('PROFILE_NOT_FOUND');
      });
    });

    describe('updateAddress', () => {
      it('should update address successfully', async () => {
        // Add an address first
        const addressData = createMockAddress();
        delete (addressData as any)._id;
        await existingProfile.addAddress(addressData);
        await existingProfile.save();
        
        const addressId = existingProfile.addresses[0]._id.toString();
        const updateData = { firstName: 'Updated Name', city: 'Updated City' };
        
        const result = await profileService.updateAddress(existingProfile.userId, addressId, updateData);
        
        expect(result.success).toBe(true);
        expect(result.message).toBe('Address updated successfully');
      });

      it('should return error for non-existent address', async () => {
        const nonExistentAddressId = generateObjectId();
        const updateData = { firstName: 'Updated Name' };
        
        const result = await profileService.updateAddress(existingProfile.userId, nonExistentAddressId, updateData);
        
        expect(result.success).toBe(false);
        expect(result.code).toBe('ADDRESS_NOT_FOUND');
      });
    });

    describe('removeAddress', () => {
      it('should remove address successfully', async () => {
        // Add an address first
        const addressData = createMockAddress();
        delete (addressData as any)._id;
        await existingProfile.addAddress(addressData);
        await existingProfile.save();
        
        const addressId = existingProfile.addresses[0]._id.toString();
        
        const result = await profileService.removeAddress(existingProfile.userId, addressId);
        
        expect(result.success).toBe(true);
        expect(result.message).toBe('Address removed successfully');
      });
    });

    describe('setDefaultAddress', () => {
      it('should set default address successfully', async () => {
        // Add two addresses
        const address1 = createMockAddress({ type: 'home' });
        const address2 = createMockAddress({ type: 'work' });
        delete (address1 as any)._id;
        delete (address2 as any)._id;
        
        await existingProfile.addAddress(address1);
        await existingProfile.addAddress(address2);
        await existingProfile.save();
        
        const address2Id = existingProfile.addresses[1]._id.toString();
        
        const result = await profileService.setDefaultAddress(existingProfile.userId, address2Id);
        
        expect(result.success).toBe(true);
        expect(result.message).toBe('Default address set successfully');
      });
    });
  });

  describe('Wishlist Management', () => {
    let existingProfile: any;

    beforeEach(async () => {
      const profileData = createMockUserProfile();
      existingProfile = new UserProfile(profileData);
      await existingProfile.save();
    });

    describe('addToWishlist', () => {
      it('should add item to wishlist successfully', async () => {
        const wishlistData = createMockWishlistItem();
        delete (wishlistData as any)._id;
        
        mockExternalServices.catalogService.validateProduct.mockResolvedValue(true);
        
        const result = await profileService.addToWishlist(existingProfile.userId, wishlistData);
        
        expect(result.success).toBe(true);
        expect(result.message).toBe('Item added to wishlist successfully');
        expect(result.data?.item).toBeDefined();
        expect(result.data?.item.productId).toBe(wishlistData.productId);
      });

      it('should return error for invalid product', async () => {
        const wishlistData = createMockWishlistItem();
        delete (wishlistData as any)._id;
        
        mockExternalServices.catalogService.validateProduct.mockResolvedValue(false);
        
        const result = await profileService.addToWishlist(existingProfile.userId, wishlistData);
        
        expect(result.success).toBe(false);
        expect(result.code).toBe('PRODUCT_NOT_FOUND');
      });
    });

    describe('updateWishlistItem', () => {
      it('should update wishlist item successfully', async () => {
        // Add item to wishlist first
        const wishlistData = createMockWishlistItem();
        delete (wishlistData as any)._id;
        await existingProfile.addToWishlist(wishlistData);
        await existingProfile.save();
        
        const itemId = existingProfile.wishlist[0]._id.toString();
        const updateData = { priority: 'high', notes: 'Updated notes' };
        
        const result = await profileService.updateWishlistItem(existingProfile.userId, itemId, updateData);
        
        expect(result.success).toBe(true);
        expect(result.message).toBe('Wishlist item updated successfully');
      });
    });

    describe('removeFromWishlist', () => {
      it('should remove item from wishlist successfully', async () => {
        // Add item to wishlist first
        const wishlistData = createMockWishlistItem();
        delete (wishlistData as any)._id;
        await existingProfile.addToWishlist(wishlistData);
        await existingProfile.save();
        
        const itemId = existingProfile.wishlist[0]._id.toString();
        
        const result = await profileService.removeFromWishlist(existingProfile.userId, itemId);
        
        expect(result.success).toBe(true);
        expect(result.message).toBe('Item removed from wishlist successfully');
      });
    });

    describe('getWishlistWithDetails', () => {
      it('should return wishlist with product details', async () => {
        // Add item to wishlist first
        const wishlistData = createMockWishlistItem();
        delete (wishlistData as any)._id;
        await existingProfile.addToWishlist(wishlistData);
        await existingProfile.save();
        
        mockExternalServices.catalogService.getProduct.mockResolvedValue({
          success: true,
          data: { product: { id: wishlistData.productId, name: 'Test Product' } }
        });
        
        const result = await profileService.getWishlistWithDetails(existingProfile.userId);
        
        expect(result.success).toBe(true);
        expect(result.data?.wishlist).toBeDefined();
        expect(result.data?.wishlist).toHaveLength(1);
        expect(mockExternalServices.catalogService.getProduct).toHaveBeenCalledWith(wishlistData.productId);
      });
    });
  });

  describe('Preferences and Settings', () => {
    let existingProfile: any;

    beforeEach(async () => {
      const profileData = createMockUserProfile();
      existingProfile = new UserProfile(profileData);
      await existingProfile.save();
    });

    describe('updatePreferences', () => {
      it('should update preferences successfully', async () => {
        const newPreferences = {
          display: {
            language: 'es',
            theme: 'dark'
          },
          notifications: {
            email: {
              promotions: false
            }
          }
        };
        
        const result = await profileService.updatePreferences(existingProfile.userId, newPreferences);
        
        expect(result.success).toBe(true);
        expect(result.message).toBe('Preferences updated successfully');
      });
    });

    describe('updateAccountSettings', () => {
      it('should update account settings successfully', async () => {
        const newSettings = {
          twoFactorEnabled: true,
          sessionTimeout: 60
        };
        
        const result = await profileService.updateAccountSettings(existingProfile.userId, newSettings);
        
        expect(result.success).toBe(true);
        expect(result.message).toBe('Account settings updated successfully');
      });
    });
  });

  describe('Loyalty Points', () => {
    let existingProfile: any;

    beforeEach(async () => {
      const profileData = createMockUserProfile();
      existingProfile = new UserProfile(profileData);
      await existingProfile.save();
    });

    it('should add loyalty points successfully', async () => {
      const points = 100;
      const reason = 'Test purchase';
      
      const result = await profileService.addLoyaltyPoints(existingProfile.userId, points, reason);
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Loyalty points added successfully');
      expect(result.data?.points.added).toBe(points);
    });

    it('should send notification for tier upgrade', async () => {
      mockExternalServices.notificationService.sendNotification.mockResolvedValue({
        success: true,
        messageId: 'notification-123'
      });
      
      // Add enough points to trigger tier upgrade
      await profileService.addLoyaltyPoints(existingProfile.userId, 1500, 'Large purchase');
      
      expect(mockExternalServices.notificationService.sendNotification).toHaveBeenCalled();
    });
  });

  describe('Profile Statistics', () => {
    it('should return profile statistics', async () => {
      const profileData = createMockUserProfile();
      profileData.addresses = [createMockAddress()];
      profileData.wishlist = [createMockWishlistItem(), createMockWishlistItem()];
      
      const profile = new UserProfile(profileData);
      await profile.save();
      
      const statistics = await profileService.getProfileStatistics(profile.userId);
      
      expect(statistics).toBeDefined();
      expect(statistics?.totalAddresses).toBe(1);
      expect(statistics?.wishlistItems).toBe(2);
      expect(statistics?.profileCompletion).toBeDefined();
      expect(statistics?.accountAge).toBeDefined();
    });

    it('should return null for non-existent profile', async () => {
      const nonExistentUserId = generateObjectId();
      
      const statistics = await profileService.getProfileStatistics(nonExistentUserId);
      
      expect(statistics).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      // Mock a database error
      jest.spyOn(UserProfile, 'findOne').mockRejectedValue(new Error('Database connection failed'));
      
      const result = await profileService.getProfile(generateObjectId());
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Internal server error');
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedisClient.get.mockRejectedValue(new Error('Redis connection failed'));
      
      const profileData = createMockUserProfile();
      const profile = new UserProfile(profileData);
      await profile.save();
      
      // Should still work even if Redis fails
      const result = await profileService.getProfile(profileData.userId);
      
      expect(result.success).toBe(true);
    });

    it('should handle external service failures', async () => {
      mockExternalServices.catalogService.validateProduct.mockRejectedValue(new Error('Service unavailable'));
      
      const profileData = createMockUserProfile();
      const profile = new UserProfile(profileData);
      await profile.save();
      
      const wishlistData = createMockWishlistItem();
      delete (wishlistData as any)._id;
      
      const result = await profileService.addToWishlist(profile.userId, wishlistData);
      
      // Should still add to wishlist even if validation service fails
      expect(result.success).toBe(true);
    });
  });
});
