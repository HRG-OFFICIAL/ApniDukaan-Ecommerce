import { Types } from 'mongoose';
import {
  IUserProfile,
  IAddress,
  IWishlistItem,
  IUserPreferences,
  IAccountSettings,
  ICreateProfileRequest,
  IUpdateProfileRequest
} from '../types/profile.types';

/**
 * Generate a valid MongoDB ObjectId
 */
export const generateObjectId = () => new Types.ObjectId().toString();

/**
 * Create mock user profile data
 */
export const createMockUserProfile = (overrides: Partial<IUserProfile> = {}): IUserProfile => ({
  _id: generateObjectId(),
  userId: generateObjectId(),
  personalInfo: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    dateOfBirth: new Date('1990-01-01'),
    gender: 'male',
    avatar: 'https://example.com/avatar.jpg',
    bio: 'Test user bio'
  },
  addresses: [],
  wishlist: [],
  preferences: createMockPreferences(),
  accountSettings: createMockAccountSettings(),
  metadata: {
    lastLoginAt: new Date(),
    loginCount: 0,
    registrationSource: 'web',
    referralCode: 'TEST123',
    isEmailVerified: true,
    isPhoneVerified: false
  },
  status: 'active' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
} as IUserProfile);

/**
 * Create mock address data
 */
export const createMockAddress = (overrides: Partial<IAddress> = {}): IAddress => ({
  _id: new Types.ObjectId().toString(),
  type: 'home',
  firstName: 'John',
  lastName: 'Doe',
  company: 'Test Company',
  addressLine1: '123 Test Street',
  addressLine2: 'Apt 4B',
  city: 'Test City',
  state: 'Test State',
  postalCode: '12345',
  country: 'United States',
  phone: '+1234567890',
  isDefault: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

/**
 * Create mock wishlist item data
 */
export const createMockWishlistItem = (overrides: Partial<IWishlistItem> = {}): IWishlistItem => ({
  _id: new Types.ObjectId().toString(),
  productId: generateObjectId(),
  variantId: generateObjectId(),
  priority: 'medium',
  notes: 'Test wishlist item',
  addedAt: new Date(),
  notifyOnSale: true,
  notifyOnRestock: false,
  ...overrides
});

/**
 * Create mock preferences data
 */
export const createMockPreferences = (overrides: Partial<IUserPreferences> = {}): IUserPreferences => ({
  notifications: {
    email: {
      orderUpdates: true,
      promotions: true,
      newsletter: false,
      recommendations: true,
      reviews: true,
      wishlistAlerts: true
    },
    push: {
      orderUpdates: true,
      promotions: false,
      recommendations: false,
      abandonedCart: false
    },
    sms: {
      orderUpdates: false,
      promotions: false,
      deliveryUpdates: false
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
    theme: 'light' as const,
    itemsPerPage: 20,
    defaultView: 'grid' as const
  },
  shopping: {
    defaultShippingAddress: undefined,
    defaultBillingAddress: undefined,
    savePaymentMethods: true,
    autoApplyCoupons: true,
    preferredCategories: [],
    excludedCategories: []
  },
  ...overrides
});

/**
 * Create mock account settings data
 */
export const createMockAccountSettings = (overrides: Partial<IAccountSettings> = {}): IAccountSettings => ({
  twoFactorAuth: {
    enabled: false,
    method: 'sms',
    backupCodes: []
  },
  security: {
    lastPasswordChange: new Date(),
    sessionTimeout: 30,
    loginAlerts: true
  },
  communication: {
    preferredContactMethod: 'email',
    bestTimeToContact: {
      start: '09:00',
      end: '17:00',
      timezone: 'UTC'
    }
  },
  ...overrides
});

/**
 * Create mock create profile request
 */
export const createMockCreateProfileRequest = (overrides: Partial<ICreateProfileRequest> = {}): ICreateProfileRequest => ({
  userId: generateObjectId(),
  personalInfo: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    dateOfBirth: new Date('1990-01-01'),
    gender: 'male'
  },
  preferences: createMockPreferences(),
  registrationSource: 'web',
  referralCode: 'TEST123',
  ...overrides
});

/**
 * Create mock update profile request
 */
export const createMockUpdateProfileRequest = (overrides: Partial<IUpdateProfileRequest> = {}): IUpdateProfileRequest => ({
  personalInfo: {
    firstName: 'Jane',
    lastName: 'Smith',
    bio: 'Updated bio'
  },
  preferences: {
    display: {
      language: 'es',
      currency: 'USD',
      timezone: 'UTC',
      theme: 'dark' as const,
      itemsPerPage: 20,
      defaultView: 'grid' as const
    }
  },
  ...overrides
});

/**
 * Mock Express request object
 */
export const createMockRequest = (overrides: any = {}) => ({
  body: {},
  params: {},
  query: {},
  headers: {
    'x-user-id': generateObjectId(),
    'x-user-role': 'user'
  },
  file: null,
  userId: generateObjectId(),
  ...overrides
});

/**
 * Mock Express response object
 */
export const createMockResponse = () => {
  const res: any = {
    status: jest.fn(() => res),
    json: jest.fn(() => res),
    send: jest.fn(() => res),
    setHeader: jest.fn(() => res),
    cookie: jest.fn(() => res),
    clearCookie: jest.fn(() => res)
  };
  return res;
};

/**
 * Mock Express next function
 */
export const createMockNext = () => jest.fn();

/**
 * Sleep utility for async tests
 */
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Create multiple mock profiles for bulk testing
 */
export const createMockProfiles = (count: number): IUserProfile[] => {
  return Array.from({ length: count }, (_, index) => 
    createMockUserProfile({
      personalInfo: {
        firstName: `User${index}`,
        lastName: `Test${index}`,
        email: `user${index}@example.com`,
        phone: `+123456${index.toString().padStart(4, '0')}`
      }
    })
  );
};

/**
 * Validate MongoDB ObjectId
 */
export const isValidObjectId = (id: string): boolean => {
  return Types.ObjectId.isValid(id);
};

/**
 * Create mock error for testing error scenarios
 */
export const createMockError = (message: string, code?: string) => {
  const error: any = new Error(message);
  if (code) error.code = code;
  return error;
};

/**
 * Assert response structure for API tests
 */
export const assertSuccessResponse = (response: any, expectedData?: any) => {
  expect(response).toHaveProperty('success', true);
  expect(response).toHaveProperty('message');
  if (expectedData) {
    expect(response).toHaveProperty('data');
    expect(response.data).toMatchObject(expectedData);
  }
};

/**
 * Assert error response structure for API tests
 */
export const assertErrorResponse = (response: any, expectedCode?: string) => {
  expect(response).toHaveProperty('success', false);
  expect(response).toHaveProperty('error');
  if (expectedCode) {
    expect(response).toHaveProperty('code', expectedCode);
  }
};

/**
 * Clean test data - removes non-essential fields for comparison
 */
export const cleanTestData = (data: any): any => {
  if (Array.isArray(data)) {
    return data.map(cleanTestData);
  }
  
  if (data && typeof data === 'object') {
    const cleaned = { ...data };
    delete cleaned._id;
    delete cleaned.__v;
    delete cleaned.createdAt;
    delete cleaned.updatedAt;
    
    // Recursively clean nested objects
    Object.keys(cleaned).forEach(key => {
      if (cleaned[key] && typeof cleaned[key] === 'object') {
        cleaned[key] = cleanTestData(cleaned[key]);
      }
    });
    
    return cleaned;
  }
  
  return data;
};

/**
 * Mock external service responses
 */
export const mockExternalServices = {
  catalogService: {
    getProduct: jest.fn().mockResolvedValue({
      success: true,
      data: {
        product: {
          id: generateObjectId(),
          name: 'Test Product',
          price: 29.99,
          inStock: true
        }
      }
    }),
    validateProduct: jest.fn().mockResolvedValue(true)
  },
  
  notificationService: {
    sendNotification: jest.fn().mockResolvedValue({
      success: true,
      messageId: 'notification-123'
    })
  },
  
  eventBus: {
    emit: jest.fn().mockResolvedValue(undefined),
    on: jest.fn().mockResolvedValue(undefined)
  }
};
