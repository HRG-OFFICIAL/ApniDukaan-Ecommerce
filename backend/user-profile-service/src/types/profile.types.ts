import { Document } from 'mongoose';

// Base User Profile Interface
export interface IUserProfile extends Document {
  _id: string;
  userId: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    dateOfBirth?: Date;
    gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
    avatar?: string;
    bio?: string;
  };
  addresses: IAddress[];
  wishlist: IWishlistItem[];
  preferences: IUserPreferences;
  accountSettings: IAccountSettings;
  loyaltyProgram?: {
    tier: 'bronze' | 'silver' | 'gold' | 'platinum';
    points: number;
    joinedDate: Date;
    expiryDate?: Date;
  };
  socialProfiles?: {
    platform: 'facebook' | 'google' | 'twitter' | 'instagram';
    profileId: string;
    username?: string;
  }[];
  metadata: {
    lastLoginAt?: Date;
    loginCount: number;
    registrationSource: string;
    referralCode?: string;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
  };
  status: 'active' | 'inactive' | 'suspended' | 'deleted';
  createdAt: Date;
  updatedAt: Date;
}

// Address Interface
export interface IAddress {
  _id?: string;
  type: 'home' | 'work' | 'billing' | 'shipping' | 'other';
  label?: string;
  firstName: string;
  lastName: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  isDefault: boolean;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  deliveryInstructions?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Wishlist Item Interface
export interface IWishlistItem {
  _id?: string;
  productId: string;
  variantId?: string;
  addedAt: Date;
  priority?: 'low' | 'medium' | 'high';
  notes?: string;
  sharedWith?: string[]; // User IDs
  notifyOnSale: boolean;
  notifyOnRestock: boolean;
}

// User Preferences Interface
export interface IUserPreferences {
  notifications: {
    email: {
      orderUpdates: boolean;
      promotions: boolean;
      newsletter: boolean;
      recommendations: boolean;
      reviews: boolean;
      wishlistAlerts: boolean;
    };
    sms: {
      orderUpdates: boolean;
      promotions: boolean;
      deliveryUpdates: boolean;
    };
    push: {
      orderUpdates: boolean;
      promotions: boolean;
      recommendations: boolean;
      abandonedCart: boolean;
    };
  };
  privacy: {
    profileVisibility: 'public' | 'friends' | 'private';
    showPurchaseHistory: boolean;
    shareWishlist: boolean;
    allowRecommendations: boolean;
    allowDataCollection: boolean;
  };
  display: {
    language: string;
    currency: string;
    timezone: string;
    theme: 'light' | 'dark' | 'auto';
    itemsPerPage: number;
    defaultView: 'grid' | 'list';
  };
  shopping: {
    defaultShippingAddress?: string;
    defaultBillingAddress?: string;
    savePaymentMethods: boolean;
    autoApplyCoupons: boolean;
    preferredCategories: string[];
    excludedCategories: string[];
  };
}

// Account Settings Interface
export interface IAccountSettings {
  twoFactorAuth: {
    enabled: boolean;
    method?: 'sms' | 'email' | 'authenticator';
    backupCodes?: string[];
  };
  security: {
    lastPasswordChange?: Date;
    sessionTimeout: number; // in minutes
    loginAlerts: boolean;
  };
  communication: {
    preferredContactMethod: 'email' | 'sms' | 'phone';
    bestTimeToContact?: {
      start: string; // HH:MM format
      end: string;   // HH:MM format
      timezone: string;
    };
  };
  subscription?: {
    plan: 'free' | 'premium' | 'vip';
    startDate: Date;
    renewalDate: Date;
    autoRenew: boolean;
    billingCycle: 'monthly' | 'yearly';
  };
}

// Request/Response Types
export interface ICreateProfileRequest {
  userId: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    dateOfBirth?: Date;
    gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  };
  preferences?: Partial<IUserPreferences>;
  registrationSource?: string;
  referralCode?: string;
}

export interface IUpdateProfileRequest {
  personalInfo?: Partial<IUserProfile['personalInfo']>;
  preferences?: Partial<IUserPreferences>;
  accountSettings?: Partial<IAccountSettings>;
}

export interface IAddAddressRequest {
  type: IAddress['type'];
  label?: string;
  firstName: string;
  lastName: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  isDefault?: boolean;
  deliveryInstructions?: string;
}

export interface IUpdateAddressRequest {
  type?: IAddress['type'];
  label?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  isDefault?: boolean;
  deliveryInstructions?: string;
}

export interface IAddWishlistItemRequest {
  productId: string;
  variantId?: string;
  priority?: 'low' | 'medium' | 'high';
  notes?: string;
  notifyOnSale?: boolean;
  notifyOnRestock?: boolean;
}

export interface IUpdateWishlistItemRequest {
  priority?: 'low' | 'medium' | 'high';
  notes?: string;
  notifyOnSale?: boolean;
  notifyOnRestock?: boolean;
}

export interface IShareWishlistRequest {
  userIds: string[];
  message?: string;
  expiryDate?: Date;
}

// Response Types
export interface IProfileResponse {
  success: boolean;
  data?: {
    profile: IUserProfile;
  };
  message?: string;
  error?: string;
  code?: string;
}

export interface IAddressResponse {
  success: boolean;
  data?: {
    address: IAddress;
    addresses?: IAddress[];
  };
  message?: string;
  error?: string;
  code?: string;
}

export interface IWishlistResponse {
  success: boolean;
  data?: {
    wishlist: IWishlistItem[];
    item?: IWishlistItem;
    totalItems?: number;
  };
  message?: string;
  error?: string;
  code?: string;
}

// Utility Types
export interface IAddressValidationResult {
  isValid: boolean;
  suggestions?: IAddress[];
  errors?: string[];
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface IProfileStatistics {
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  favoriteCategories: Array<{
    category: string;
    orderCount: number;
    totalSpent: number;
  }>;
  loyaltyPoints: number;
  memberSince: Date;
  lastOrderDate?: Date;
}

export interface IWishlistShare {
  _id: string;
  sharedBy: string;
  sharedWith: string[];
  shareLink: string;
  message?: string;
  expiryDate?: Date;
  viewCount: number;
  isActive: boolean;
  createdAt: Date;
}

export interface IProfileActivity {
  _id: string;
  userId: string;
  activity: string;
  description: string;
  metadata?: {
    [key: string]: any;
  };
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// Event Types
export type ProfileEventType = 
  | 'profile:created'
  | 'profile:updated'
  | 'profile:deleted'
  | 'address:added'
  | 'address:updated'
  | 'address:deleted'
  | 'address:set_default'
  | 'wishlist:item_added'
  | 'wishlist:item_removed'
  | 'wishlist:item_updated'
  | 'wishlist:shared'
  | 'preferences:updated'
  | 'settings:updated'
  | 'avatar:uploaded'
  | 'loyalty:tier_changed'
  | 'profile:verified';

export interface IProfileEvent {
  type: ProfileEventType;
  userId: string;
  profileId: string;
  data: {
    [key: string]: any;
  };
  timestamp: Date;
}

// Search and Filter Types
export interface IProfileSearchFilters {
  status?: IUserProfile['status'];
  loyaltyTier?: IUserProfile['loyaltyProgram']['tier'];
  registrationDateFrom?: Date;
  registrationDateTo?: Date;
  lastLoginFrom?: Date;
  lastLoginTo?: Date;
  hasOrders?: boolean;
  totalSpentMin?: number;
  totalSpentMax?: number;
  country?: string;
  state?: string;
  city?: string;
}

export interface IProfileSearchResult {
  profiles: IUserProfile[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Configuration Types
export interface IProfileServiceConfig {
  avatarUpload: {
    maxSize: number; // in bytes
    allowedFormats: string[];
    dimensions: {
      width: number;
      height: number;
    };
  };
  addressValidation: {
    enabled: boolean;
    provider: 'google' | 'mapbox' | 'here';
    apiKey: string;
  };
  notifications: {
    welcomeEmail: boolean;
    profileUpdateEmail: boolean;
    wishlistAlerts: boolean;
  };
  loyaltyProgram: {
    enabled: boolean;
    pointsPerDollar: number;
    tierThresholds: {
      silver: number;
      gold: number;
      platinum: number;
    };
  };
}
