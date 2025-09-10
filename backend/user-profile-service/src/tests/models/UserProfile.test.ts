import mongoose from 'mongoose';
import UserProfile from '../../models/UserProfile';
import {
  createMockUserProfile,
  createMockAddress,
  createMockWishlistItem,
  generateObjectId,
  cleanTestData
} from '../testUtils';

describe('UserProfile Model', () => {
  beforeEach(async () => {
    await UserProfile.deleteMany({});
  });

  describe('Profile Creation', () => {
    it('should create a profile with valid data', async () => {
      const profileData = createMockUserProfile();
      const profile = new UserProfile(profileData);
      const savedProfile = await profile.save();

      expect(savedProfile._id).toBeDefined();
      expect(savedProfile.userId).toBe(profileData.userId);
      expect(savedProfile.personalInfo.firstName).toBe(profileData.personalInfo.firstName);
      expect(savedProfile.personalInfo.email).toBe(profileData.personalInfo.email);
      expect(savedProfile.isActive).toBe(true);
      expect(savedProfile.isVerified).toBe(true);
      expect(savedProfile.createdAt).toBeDefined();
      expect(savedProfile.updatedAt).toBeDefined();
    });

    it('should require userId', async () => {
      const profileData = createMockUserProfile();
      delete (profileData as any).userId;
      
      const profile = new UserProfile(profileData);
      
      await expect(profile.save()).rejects.toThrow('userId is required');
    });

    it('should require firstName in personalInfo', async () => {
      const profileData = createMockUserProfile();
      delete profileData.personalInfo.firstName;
      
      const profile = new UserProfile(profileData);
      
      await expect(profile.save()).rejects.toThrow('First name is required');
    });

    it('should require lastName in personalInfo', async () => {
      const profileData = createMockUserProfile();
      delete profileData.personalInfo.lastName;
      
      const profile = new UserProfile(profileData);
      
      await expect(profile.save()).rejects.toThrow('Last name is required');
    });

    it('should require valid email', async () => {
      const profileData = createMockUserProfile();
      profileData.personalInfo.email = 'invalid-email';
      
      const profile = new UserProfile(profileData);
      
      await expect(profile.save()).rejects.toThrow('Please enter a valid email');
    });

    it('should enforce unique email', async () => {
      const email = 'unique@example.com';
      
      // Create first profile
      const profileData1 = createMockUserProfile();
      profileData1.personalInfo.email = email;
      const profile1 = new UserProfile(profileData1);
      await profile1.save();

      // Try to create second profile with same email
      const profileData2 = createMockUserProfile();
      profileData2.personalInfo.email = email;
      const profile2 = new UserProfile(profileData2);
      
      await expect(profile2.save()).rejects.toThrow();
    });

    it('should validate phone number format', async () => {
      const profileData = createMockUserProfile();
      profileData.personalInfo.phone = 'abc123'; // Invalid phone
      
      const profile = new UserProfile(profileData);
      
      await expect(profile.save()).rejects.toThrow('Please enter a valid phone number');
    });

    it('should validate gender values', async () => {
      const profileData = createMockUserProfile();
      profileData.personalInfo.gender = 'invalid' as any;
      
      const profile = new UserProfile(profileData);
      
      await expect(profile.save()).rejects.toThrow();
    });
  });

  describe('Virtual Properties', () => {
    it('should calculate fullName virtual property', async () => {
      const profileData = createMockUserProfile();
      const profile = new UserProfile(profileData);
      const savedProfile = await profile.save();

      expect(savedProfile.fullName).toBe(`${profileData.personalInfo.firstName} ${profileData.personalInfo.lastName}`);
    });

    it('should calculate defaultShippingAddress virtual', async () => {
      const profileData = createMockUserProfile();
      const address1 = createMockAddress({ type: 'home', isDefault: false });
      const address2 = createMockAddress({ type: 'shipping', isDefault: true });
      profileData.addresses = [address1, address2];
      
      const profile = new UserProfile(profileData);
      const savedProfile = await profile.save();

      expect(savedProfile.defaultShippingAddress).toBeDefined();
      expect(savedProfile.defaultShippingAddress?._id).toEqual(address2._id);
    });

    it('should calculate activeWishlistItems virtual', async () => {
      const profileData = createMockUserProfile();
      const wishlistItem1 = createMockWishlistItem({ priority: 'high' });
      const wishlistItem2 = createMockWishlistItem({ priority: 'low' });
      profileData.wishlist = [wishlistItem1, wishlistItem2];
      
      const profile = new UserProfile(profileData);
      const savedProfile = await profile.save();

      expect(savedProfile.activeWishlistItems).toHaveLength(2);
      expect(savedProfile.activeWishlistItems[0].priority).toBe('high');
    });
  });

  describe('Instance Methods', () => {
    let profile: any;

    beforeEach(async () => {
      const profileData = createMockUserProfile();
      profile = new UserProfile(profileData);
      await profile.save();
    });

    describe('addAddress', () => {
      it('should add a new address', async () => {
        const addressData = createMockAddress();
        delete (addressData as any)._id; // Remove _id for creation
        
        await profile.addAddress(addressData);
        
        expect(profile.addresses).toHaveLength(1);
        expect(profile.addresses[0].firstName).toBe(addressData.firstName);
        expect(profile.addresses[0].addressLine1).toBe(addressData.addressLine1);
      });

      it('should set first address as default', async () => {
        const addressData = createMockAddress({ isDefault: false });
        delete (addressData as any)._id;
        
        await profile.addAddress(addressData);
        
        expect(profile.addresses[0].isDefault).toBe(true);
      });

      it('should handle multiple addresses with one default', async () => {
        const address1 = createMockAddress({ type: 'home' });
        const address2 = createMockAddress({ type: 'work', isDefault: true });
        delete (address1 as any)._id;
        delete (address2 as any)._id;
        
        await profile.addAddress(address1);
        await profile.addAddress(address2);
        
        expect(profile.addresses).toHaveLength(2);
        // First address should no longer be default
        expect(profile.addresses[0].isDefault).toBe(false);
        // Second address should be default
        expect(profile.addresses[1].isDefault).toBe(true);
      });
    });

    describe('updateAddress', () => {
      it('should update an existing address', async () => {
        const addressData = createMockAddress();
        delete (addressData as any)._id;
        await profile.addAddress(addressData);
        
        const addressId = profile.addresses[0]._id;
        const updateData = {
          firstName: 'Updated Name',
          city: 'Updated City'
        };
        
        const result = await profile.updateAddress(addressId, updateData);
        
        expect(result).toBe(true);
        expect(profile.addresses[0].firstName).toBe('Updated Name');
        expect(profile.addresses[0].city).toBe('Updated City');
      });

      it('should return false for non-existent address', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        const updateData = { firstName: 'Updated Name' };
        
        const result = await profile.updateAddress(nonExistentId, updateData);
        
        expect(result).toBe(false);
      });
    });

    describe('removeAddress', () => {
      it('should remove an address', async () => {
        const addressData = createMockAddress();
        delete (addressData as any)._id;
        await profile.addAddress(addressData);
        
        const addressId = profile.addresses[0]._id;
        const result = await profile.removeAddress(addressId);
        
        expect(result).toBe(true);
        expect(profile.addresses).toHaveLength(0);
      });

      it('should return false for non-existent address', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        const result = await profile.removeAddress(nonExistentId);
        
        expect(result).toBe(false);
      });
    });

    describe('setDefaultAddress', () => {
      it('should set an address as default', async () => {
        const address1 = createMockAddress({ type: 'home' });
        const address2 = createMockAddress({ type: 'home' });
        delete (address1 as any)._id;
        delete (address2 as any)._id;
        
        await profile.addAddress(address1);
        await profile.addAddress(address2);
        
        const address2Id = profile.addresses[1]._id;
        const result = await profile.setDefaultAddress(address2Id);
        
        expect(result).toBe(true);
        expect(profile.addresses[0].isDefault).toBe(false);
        expect(profile.addresses[1].isDefault).toBe(true);
      });
    });

    describe('addToWishlist', () => {
      it('should add item to wishlist', async () => {
        const wishlistData = createMockWishlistItem();
        delete (wishlistData as any)._id;
        
        await profile.addToWishlist(wishlistData);
        
        expect(profile.wishlist).toHaveLength(1);
        expect(profile.wishlist[0].productId).toBe(wishlistData.productId);
        expect(profile.wishlist[0].priority).toBe(wishlistData.priority);
      });

      it('should not add duplicate product to wishlist', async () => {
        const productId = generateObjectId();
        const variantId = generateObjectId();
        const wishlistData1 = createMockWishlistItem({ productId, variantId });
        const wishlistData2 = createMockWishlistItem({ productId, variantId });
        delete (wishlistData1 as any)._id;
        delete (wishlistData2 as any)._id;
        
        await profile.addToWishlist(wishlistData1);
        const result = await profile.addToWishlist(wishlistData2);
        
        expect(result).toBe(false);
        expect(profile.wishlist).toHaveLength(1);
      });
    });

    describe('updateWishlistItem', () => {
      it('should update wishlist item', async () => {
        const wishlistData = createMockWishlistItem();
        delete (wishlistData as any)._id;
        await profile.addToWishlist(wishlistData);
        
        const itemId = profile.wishlist[0]._id;
        const updateData = { priority: 'high', notes: 'Updated notes' };
        
        const result = await profile.updateWishlistItem(itemId, updateData);
        
        expect(result).toBe(true);
        expect(profile.wishlist[0].priority).toBe('high');
        expect(profile.wishlist[0].notes).toBe('Updated notes');
      });
    });

    describe('removeFromWishlist', () => {
      it('should remove item from wishlist', async () => {
        const wishlistData = createMockWishlistItem();
        delete (wishlistData as any)._id;
        await profile.addToWishlist(wishlistData);
        
        const itemId = profile.wishlist[0]._id;
        const result = await profile.removeFromWishlist(itemId);
        
        expect(result).toBe(true);
        expect(profile.wishlist).toHaveLength(0);
      });
    });

    describe('addLoyaltyPoints', () => {
      it('should add loyalty points', async () => {
        const initialPoints = profile.loyaltyProgram?.points || 0;
        const pointsToAdd = 100;
        const reason = 'Test purchase';
        
        await profile.addLoyaltyPoints(pointsToAdd, reason);
        
        expect(profile.loyaltyProgram?.points).toBe(initialPoints + pointsToAdd);
        expect(profile.loyaltyProgram?.tier).toBeDefined();
      });

      it('should update loyalty tier', async () => {
        await profile.addLoyaltyPoints(1500, 'Large purchase');
        
        expect(profile.loyaltyProgram?.tier).toBe('silver');
      });
    });
  });

  describe('Static Methods', () => {
    describe('findByUserId', () => {
      it('should find profile by userId', async () => {
        const profileData = createMockUserProfile();
        const profile = new UserProfile(profileData);
        await profile.save();
        
        const foundProfile = await UserProfile.findByUserId(profileData.userId);
        
        expect(foundProfile).toBeDefined();
        expect(foundProfile?.userId).toBe(profileData.userId);
      });

      it('should return null for non-existent userId', async () => {
        const nonExistentUserId = generateObjectId();
        const foundProfile = await UserProfile.findByUserId(nonExistentUserId);
        
        expect(foundProfile).toBeNull();
      });
    });

    describe('findByEmail', () => {
      it('should find profile by email', async () => {
        const profileData = createMockUserProfile();
        const profile = new UserProfile(profileData);
        await profile.save();
        
        const foundProfile = await UserProfile.findByEmail(profileData.personalInfo.email);
        
        expect(foundProfile).toBeDefined();
        expect(foundProfile?.personalInfo.email).toBe(profileData.personalInfo.email);
      });
    });

    describe('searchProfiles', () => {
      it('should search profiles by text', async () => {
        const profile1 = new UserProfile(createMockUserProfile({
          personalInfo: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' }
        }));
        const profile2 = new UserProfile(createMockUserProfile({
          personalInfo: { firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' }
        }));
        
        await profile1.save();
        await profile2.save();
        
        const results = await UserProfile.searchProfiles('John');
        
        expect(results.profiles).toHaveLength(1);
        expect(results.profiles[0].personalInfo.firstName).toBe('John');
      });
    });
  });

  describe('Profile Statistics', () => {
    it('should calculate profile completion percentage', async () => {
      const profileData = createMockUserProfile();
      // Remove optional fields
      delete profileData.personalInfo.phone;
      delete profileData.personalInfo.dateOfBirth;
      delete profileData.personalInfo.bio;
      profileData.addresses = [];
      
      const profile = new UserProfile(profileData);
      await profile.save();
      
      const stats = await profile.getStatistics();
      
      expect(stats.profileCompletion).toBeLessThan(100);
      expect(stats.totalAddresses).toBe(0);
      expect(stats.wishlistItems).toBe(0);
      expect(stats.loyaltyPoints).toBe(0);
    });

    it('should calculate full profile statistics', async () => {
      const profileData = createMockUserProfile();
      profileData.addresses = [createMockAddress()];
      profileData.wishlist = [createMockWishlistItem(), createMockWishlistItem()];
      profileData.loyaltyProgram = {
        points: 500,
        tier: 'silver',
        joinedDate: new Date()
      };
      
      const profile = new UserProfile(profileData);
      await profile.save();
      
      const stats = await profile.getStatistics();
      
      expect(stats.profileCompletion).toBe(100);
      expect(stats.totalAddresses).toBe(1);
      expect(stats.wishlistItems).toBe(2);
      expect(stats.loyaltyPoints).toBe(500);
      expect(stats.accountAge).toBeDefined();
    });
  });

  describe('Data Validation', () => {
    it('should validate address fields', async () => {
      const profileData = createMockUserProfile();
      const invalidAddress = createMockAddress({
        addressLine1: '', // Required field
        postalCode: '123' // Too short
      });
      profileData.addresses = [invalidAddress];
      
      const profile = new UserProfile(profileData);
      
      await expect(profile.save()).rejects.toThrow();
    });

    it('should validate wishlist item fields', async () => {
      const profileData = createMockUserProfile();
      const invalidWishlistItem = createMockWishlistItem({
        productId: 'invalid-id', // Invalid ObjectId
        priority: 'invalid' as any // Invalid priority
      });
      profileData.wishlist = [invalidWishlistItem];
      
      const profile = new UserProfile(profileData);
      
      await expect(profile.save()).rejects.toThrow();
    });
  });

  describe('Index Tests', () => {
    it('should enforce unique compound index on userId', async () => {
      const userId = generateObjectId();
      
      const profile1 = new UserProfile(createMockUserProfile({ userId }));
      const profile2 = new UserProfile(createMockUserProfile({ 
        userId,
        personalInfo: { ...createMockUserProfile().personalInfo, email: 'different@example.com' }
      }));
      
      await profile1.save();
      await expect(profile2.save()).rejects.toThrow();
    });
  });
});
