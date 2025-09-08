import request from 'supertest';
import { app } from '../../server';
import { UserProfile } from '../../models/UserProfile';
import {
  createMockUserProfile,
  createMockCreateProfileRequest,
  createMockUpdateProfileRequest,
  createMockAddress,
  createMockWishlistItem,
  generateObjectId,
  assertSuccessResponse,
  assertErrorResponse,
  mockExternalServices
} from '../testUtils';

describe('Profile Routes Integration Tests', () => {
  const mockUserId = generateObjectId();
  const authHeaders = {
    'x-user-id': mockUserId,
    'x-user-role': 'user'
  };

  beforeEach(async () => {
    await UserProfile.deleteMany({});
    jest.clearAllMocks();
  });

  describe('POST /profile', () => {
    it('should create a new profile successfully', async () => {
      const profileData = createMockCreateProfileRequest({ userId: mockUserId });

      const response = await request(app)
        .post('/profile')
        .set(authHeaders)
        .send(profileData)
        .expect(201);

      assertSuccessResponse(response.body);
      expect(response.body.data.profile.userId).toBe(mockUserId);
      expect(response.body.data.profile.personalInfo.firstName).toBe(profileData.personalInfo.firstName);
    });

    it('should return validation error for missing required fields', async () => {
      const invalidData = {
        userId: mockUserId,
        personalInfo: {
          firstName: '', // Empty required field
          lastName: 'Doe',
          email: 'invalid-email' // Invalid email
        }
      };

      const response = await request(app)
        .post('/profile')
        .set(authHeaders)
        .send(invalidData)
        .expect(400);

      assertErrorResponse(response.body);
      expect(response.body.details).toBeDefined();
    });

    it('should return 401 without authentication headers', async () => {
      const profileData = createMockCreateProfileRequest();

      const response = await request(app)
        .post('/profile')
        .send(profileData)
        .expect(401);

      assertErrorResponse(response.body, 'AUTHENTICATION_REQUIRED');
    });

    it('should return 409 for duplicate profile', async () => {
      const profileData = createMockCreateProfileRequest({ userId: mockUserId });
      
      // Create first profile
      await request(app)
        .post('/profile')
        .set(authHeaders)
        .send(profileData)
        .expect(201);

      // Try to create duplicate
      const response = await request(app)
        .post('/profile')
        .set(authHeaders)
        .send(profileData)
        .expect(409);

      assertErrorResponse(response.body, 'PROFILE_EXISTS');
    });
  });

  describe('GET /profile', () => {
    let existingProfile: any;

    beforeEach(async () => {
      const profileData = createMockUserProfile({ userId: mockUserId });
      existingProfile = new UserProfile(profileData);
      await existingProfile.save();
    });

    it('should return profile for authenticated user', async () => {
      const response = await request(app)
        .get('/profile')
        .set(authHeaders)
        .expect(200);

      assertSuccessResponse(response.body);
      expect(response.body.data.profile.userId).toBe(mockUserId);
    });

    it('should return 404 for non-existent profile', async () => {
      const nonExistentUserId = generateObjectId();

      const response = await request(app)
        .get('/profile')
        .set({ ...authHeaders, 'x-user-id': nonExistentUserId })
        .expect(404);

      assertErrorResponse(response.body, 'PROFILE_NOT_FOUND');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/profile')
        .expect(401);

      assertErrorResponse(response.body, 'AUTHENTICATION_REQUIRED');
    });
  });

  describe('PUT /profile', () => {
    let existingProfile: any;

    beforeEach(async () => {
      const profileData = createMockUserProfile({ userId: mockUserId });
      existingProfile = new UserProfile(profileData);
      await existingProfile.save();
    });

    it('should update profile successfully', async () => {
      const updateData = createMockUpdateProfileRequest();

      const response = await request(app)
        .put('/profile')
        .set(authHeaders)
        .send(updateData)
        .expect(200);

      assertSuccessResponse(response.body);
      expect(response.body.data.profile.personalInfo.firstName).toBe(updateData.personalInfo!.firstName);
    });

    it('should return validation error for invalid data', async () => {
      const invalidData = {
        personalInfo: {
          email: 'invalid-email',
          bio: 'x'.repeat(1001) // Too long
        }
      };

      const response = await request(app)
        .put('/profile')
        .set(authHeaders)
        .send(invalidData)
        .expect(400);

      assertErrorResponse(response.body);
    });

    it('should return 404 for non-existent profile', async () => {
      const nonExistentUserId = generateObjectId();
      const updateData = createMockUpdateProfileRequest();

      const response = await request(app)
        .put('/profile')
        .set({ ...authHeaders, 'x-user-id': nonExistentUserId })
        .send(updateData)
        .expect(404);

      assertErrorResponse(response.body, 'PROFILE_NOT_FOUND');
    });
  });

  describe('DELETE /profile', () => {
    let existingProfile: any;

    beforeEach(async () => {
      const profileData = createMockUserProfile({ userId: mockUserId });
      existingProfile = new UserProfile(profileData);
      await existingProfile.save();
    });

    it('should delete profile successfully', async () => {
      const response = await request(app)
        .delete('/profile')
        .set(authHeaders)
        .expect(200);

      assertSuccessResponse(response.body);

      // Verify profile is deleted
      const deletedProfile = await UserProfile.findByUserId(mockUserId);
      expect(deletedProfile).toBeNull();
    });

    it('should return 404 for non-existent profile', async () => {
      const nonExistentUserId = generateObjectId();

      const response = await request(app)
        .delete('/profile')
        .set({ ...authHeaders, 'x-user-id': nonExistentUserId })
        .expect(404);

      assertErrorResponse(response.body, 'PROFILE_NOT_FOUND');
    });
  });

  describe('POST /profile/avatar', () => {
    let existingProfile: any;

    beforeEach(async () => {
      const profileData = createMockUserProfile({ userId: mockUserId });
      existingProfile = new UserProfile(profileData);
      await existingProfile.save();
    });

    it('should upload avatar successfully', async () => {
      const response = await request(app)
        .post('/profile/avatar')
        .set(authHeaders)
        .attach('avatar', Buffer.from('fake-image-data'), 'test.jpg')
        .expect(200);

      assertSuccessResponse(response.body);
      expect(response.body.data.avatarUrl).toBeDefined();
    });

    it('should return 400 without file', async () => {
      const response = await request(app)
        .post('/profile/avatar')
        .set(authHeaders)
        .expect(400);

      assertErrorResponse(response.body, 'FILE_REQUIRED');
    });
  });

  describe('GET /profile/statistics', () => {
    let existingProfile: any;

    beforeEach(async () => {
      const profileData = createMockUserProfile({ 
        userId: mockUserId,
        addresses: [createMockAddress()],
        wishlist: [createMockWishlistItem()]
      });
      existingProfile = new UserProfile(profileData);
      await existingProfile.save();
    });

    it('should return profile statistics', async () => {
      const response = await request(app)
        .get('/profile/statistics')
        .set(authHeaders)
        .expect(200);

      assertSuccessResponse(response.body);
      expect(response.body.data.statistics).toBeDefined();
      expect(response.body.data.statistics.totalAddresses).toBe(1);
      expect(response.body.data.statistics.wishlistItems).toBe(1);
    });
  });

  describe('Address Management', () => {
    let existingProfile: any;

    beforeEach(async () => {
      const profileData = createMockUserProfile({ userId: mockUserId });
      existingProfile = new UserProfile(profileData);
      await existingProfile.save();
    });

    describe('GET /profile/addresses', () => {
      it('should return empty addresses array initially', async () => {
        const response = await request(app)
          .get('/profile/addresses')
          .set(authHeaders)
          .expect(200);

        assertSuccessResponse(response.body);
        expect(response.body.data.addresses).toEqual([]);
        expect(response.body.data.totalAddresses).toBe(0);
      });
    });

    describe('POST /profile/addresses', () => {
      it('should add address successfully', async () => {
        const addressData = createMockAddress();
        delete (addressData as any)._id;

        const response = await request(app)
          .post('/profile/addresses')
          .set(authHeaders)
          .send(addressData)
          .expect(201);

        assertSuccessResponse(response.body);
        expect(response.body.data.address.firstName).toBe(addressData.firstName);
      });

      it('should return validation error for invalid address', async () => {
        const invalidAddress = {
          type: 'invalid-type',
          firstName: '',
          addressLine1: ''
        };

        const response = await request(app)
          .post('/profile/addresses')
          .set(authHeaders)
          .send(invalidAddress)
          .expect(400);

        assertErrorResponse(response.body);
      });
    });

    describe('PUT /profile/addresses/:addressId', () => {
      let addressId: string;

      beforeEach(async () => {
        const addressData = createMockAddress();
        delete (addressData as any)._id;
        await existingProfile.addAddress(addressData);
        await existingProfile.save();
        addressId = existingProfile.addresses[0]._id.toString();
      });

      it('should update address successfully', async () => {
        const updateData = {
          firstName: 'Updated Name',
          city: 'Updated City'
        };

        const response = await request(app)
          .put(`/profile/addresses/${addressId}`)
          .set(authHeaders)
          .send(updateData)
          .expect(200);

        assertSuccessResponse(response.body);
      });

      it('should return validation error for invalid addressId', async () => {
        const response = await request(app)
          .put('/profile/addresses/invalid-id')
          .set(authHeaders)
          .send({ firstName: 'Test' })
          .expect(400);

        assertErrorResponse(response.body);
      });
    });

    describe('DELETE /profile/addresses/:addressId', () => {
      let addressId: string;

      beforeEach(async () => {
        const addressData = createMockAddress();
        delete (addressData as any)._id;
        await existingProfile.addAddress(addressData);
        await existingProfile.save();
        addressId = existingProfile.addresses[0]._id.toString();
      });

      it('should delete address successfully', async () => {
        const response = await request(app)
          .delete(`/profile/addresses/${addressId}`)
          .set(authHeaders)
          .expect(200);

        assertSuccessResponse(response.body);
      });
    });

    describe('POST /profile/addresses/:addressId/default', () => {
      let addressId: string;

      beforeEach(async () => {
        const addressData = createMockAddress();
        delete (addressData as any)._id;
        await existingProfile.addAddress(addressData);
        await existingProfile.save();
        addressId = existingProfile.addresses[0]._id.toString();
      });

      it('should set default address successfully', async () => {
        const response = await request(app)
          .post(`/profile/addresses/${addressId}/default`)
          .set(authHeaders)
          .expect(200);

        assertSuccessResponse(response.body);
      });
    });
  });

  describe('Wishlist Management', () => {
    let existingProfile: any;

    beforeEach(async () => {
      const profileData = createMockUserProfile({ userId: mockUserId });
      existingProfile = new UserProfile(profileData);
      await existingProfile.save();
    });

    describe('GET /profile/wishlist', () => {
      it('should return empty wishlist initially', async () => {
        const response = await request(app)
          .get('/profile/wishlist')
          .set(authHeaders)
          .expect(200);

        assertSuccessResponse(response.body);
        expect(response.body.data.wishlist).toEqual([]);
        expect(response.body.data.totalItems).toBe(0);
      });

      it('should return wishlist with details when requested', async () => {
        // Add item to wishlist first
        const wishlistData = createMockWishlistItem();
        delete (wishlistData as any)._id;
        await existingProfile.addToWishlist(wishlistData);
        await existingProfile.save();

        mockExternalServices.catalogService.getProduct.mockResolvedValue({
          success: true,
          data: { product: { id: wishlistData.productId, name: 'Test Product' } }
        });

        const response = await request(app)
          .get('/profile/wishlist?includeDetails=true')
          .set(authHeaders)
          .expect(200);

        assertSuccessResponse(response.body);
        expect(mockExternalServices.catalogService.getProduct).toHaveBeenCalled();
      });
    });

    describe('POST /profile/wishlist', () => {
      it('should add item to wishlist successfully', async () => {
        const wishlistData = createMockWishlistItem();
        delete (wishlistData as any)._id;

        mockExternalServices.catalogService.validateProduct.mockResolvedValue(true);

        const response = await request(app)
          .post('/profile/wishlist')
          .set(authHeaders)
          .send(wishlistData)
          .expect(201);

        assertSuccessResponse(response.body);
        expect(response.body.data.item.productId).toBe(wishlistData.productId);
      });

      it('should return validation error for invalid wishlist item', async () => {
        const invalidData = {
          productId: 'invalid-id',
          priority: 'invalid-priority'
        };

        const response = await request(app)
          .post('/profile/wishlist')
          .set(authHeaders)
          .send(invalidData)
          .expect(400);

        assertErrorResponse(response.body);
      });
    });

    describe('PUT /profile/wishlist/:itemId', () => {
      let itemId: string;

      beforeEach(async () => {
        const wishlistData = createMockWishlistItem();
        delete (wishlistData as any)._id;
        await existingProfile.addToWishlist(wishlistData);
        await existingProfile.save();
        itemId = existingProfile.wishlist[0]._id.toString();
      });

      it('should update wishlist item successfully', async () => {
        const updateData = {
          priority: 'high',
          notes: 'Updated notes'
        };

        const response = await request(app)
          .put(`/profile/wishlist/${itemId}`)
          .set(authHeaders)
          .send(updateData)
          .expect(200);

        assertSuccessResponse(response.body);
      });
    });

    describe('DELETE /profile/wishlist/:itemId', () => {
      let itemId: string;

      beforeEach(async () => {
        const wishlistData = createMockWishlistItem();
        delete (wishlistData as any)._id;
        await existingProfile.addToWishlist(wishlistData);
        await existingProfile.save();
        itemId = existingProfile.wishlist[0]._id.toString();
      });

      it('should remove item from wishlist successfully', async () => {
        const response = await request(app)
          .delete(`/profile/wishlist/${itemId}`)
          .set(authHeaders)
          .expect(200);

        assertSuccessResponse(response.body);
      });
    });
  });

  describe('Preferences and Settings', () => {
    let existingProfile: any;

    beforeEach(async () => {
      const profileData = createMockUserProfile({ userId: mockUserId });
      existingProfile = new UserProfile(profileData);
      await existingProfile.save();
    });

    describe('GET /profile/preferences', () => {
      it('should return user preferences', async () => {
        const response = await request(app)
          .get('/profile/preferences')
          .set(authHeaders)
          .expect(200);

        assertSuccessResponse(response.body);
        expect(response.body.data.preferences).toBeDefined();
      });
    });

    describe('PUT /profile/preferences', () => {
      it('should update preferences successfully', async () => {
        const newPreferences = {
          display: {
            language: 'es',
            theme: 'dark'
          }
        };

        const response = await request(app)
          .put('/profile/preferences')
          .set(authHeaders)
          .send(newPreferences)
          .expect(200);

        assertSuccessResponse(response.body);
      });
    });

    describe('GET /profile/settings', () => {
      it('should return account settings', async () => {
        const response = await request(app)
          .get('/profile/settings')
          .set(authHeaders)
          .expect(200);

        assertSuccessResponse(response.body);
        expect(response.body.data.settings).toBeDefined();
      });
    });

    describe('PUT /profile/settings', () => {
      it('should update account settings successfully', async () => {
        const newSettings = {
          twoFactorEnabled: true,
          sessionTimeout: 60
        };

        const response = await request(app)
          .put('/profile/settings')
          .set(authHeaders)
          .send(newSettings)
          .expect(200);

        assertSuccessResponse(response.body);
      });
    });
  });

  describe('Loyalty Points', () => {
    let existingProfile: any;

    beforeEach(async () => {
      const profileData = createMockUserProfile({ userId: mockUserId });
      existingProfile = new UserProfile(profileData);
      await existingProfile.save();
    });

    describe('POST /profile/loyalty/points', () => {
      it('should add loyalty points for admin user', async () => {
        const pointsData = {
          points: 100,
          reason: 'Test reward'
        };

        const adminHeaders = {
          ...authHeaders,
          'x-user-role': 'admin'
        };

        const response = await request(app)
          .post('/profile/loyalty/points')
          .set(adminHeaders)
          .send(pointsData)
          .expect(200);

        assertSuccessResponse(response.body);
      });

      it('should return 403 for non-admin user', async () => {
        const pointsData = {
          points: 100,
          reason: 'Test reward'
        };

        const response = await request(app)
          .post('/profile/loyalty/points')
          .set(authHeaders)
          .send(pointsData)
          .expect(403);

        assertErrorResponse(response.body, 'ACCESS_DENIED');
      });

      it('should return validation error for invalid data', async () => {
        const invalidData = {
          points: -10, // Invalid negative points
          reason: ''   // Empty reason
        };

        const adminHeaders = {
          ...authHeaders,
          'x-user-role': 'admin'
        };

        const response = await request(app)
          .post('/profile/loyalty/points')
          .set(adminHeaders)
          .send(invalidData)
          .expect(400);

        assertErrorResponse(response.body);
      });
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/profile/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.service).toBe('user-profile-service');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeDefined();
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to sensitive endpoints', async () => {
      const profileData = createMockUserProfile({ userId: mockUserId });
      const profile = new UserProfile(profileData);
      await profile.save();

      // Make multiple rapid requests to avatar upload endpoint
      const promises = Array.from({ length: 25 }, () =>
        request(app)
          .post('/profile/avatar')
          .set(authHeaders)
          .attach('avatar', Buffer.from('fake-image-data'), 'test.jpg')
      );

      const responses = await Promise.allSettled(promises);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(
        result => result.status === 'fulfilled' && 
        result.value.status === 429
      );

      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/profile/non-existent-route')
        .set(authHeaders)
        .expect(404);

      assertErrorResponse(response.body, 'NOT_FOUND');
    });

    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/profile')
        .set(authHeaders)
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      // Should return a structured error response
      expect(response.body.success).toBe(false);
    });

    it('should handle large request body', async () => {
      const largeData = {
        userId: mockUserId,
        personalInfo: {
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          bio: 'x'.repeat(15 * 1024 * 1024) // 15MB string
        }
      };

      const response = await request(app)
        .post('/profile')
        .set(authHeaders)
        .send(largeData)
        .expect(413);

      // Should return payload too large error
      expect(response.status).toBe(413);
    });
  });

  describe('CORS and Security Headers', () => {
    it('should include security headers in responses', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      // Check for security headers
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('0');
    });

    it('should handle CORS preflight requests', async () => {
      const response = await request(app)
        .options('/profile')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type, Authorization')
        .expect(204);

      expect(response.headers['access-control-allow-origin']).toBeTruthy();
      expect(response.headers['access-control-allow-methods']).toBeTruthy();
    });
  });
});
