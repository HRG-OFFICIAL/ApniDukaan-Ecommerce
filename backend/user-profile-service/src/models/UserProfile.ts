import mongoose, { Schema, Model } from 'mongoose';
import {
  IUserProfile,
  IAddress,
  IWishlistItem,
  IUserPreferences,
  IAccountSettings
} from '../types/profile.types';

// Address Schema
const AddressSchema = new Schema<IAddress>({
  type: {
    type: String,
    enum: ['home', 'work', 'billing', 'shipping', 'other'],
    required: true
  },
  label: {
    type: String,
    trim: true,
    maxlength: [50, 'Address label cannot exceed 50 characters']
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  company: {
    type: String,
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  addressLine1: {
    type: String,
    required: [true, 'Address line 1 is required'],
    trim: true,
    maxlength: [200, 'Address line 1 cannot exceed 200 characters']
  },
  addressLine2: {
    type: String,
    trim: true,
    maxlength: [200, 'Address line 2 cannot exceed 200 characters']
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true,
    maxlength: [100, 'City name cannot exceed 100 characters']
  },
  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true,
    maxlength: [100, 'State name cannot exceed 100 characters']
  },
  postalCode: {
    type: String,
    required: [true, 'Postal code is required'],
    trim: true,
    maxlength: [20, 'Postal code cannot exceed 20 characters']
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    trim: true,
    maxlength: [100, 'Country name cannot exceed 100 characters']
  },
  phone: {
    type: String,
    trim: true,
    maxlength: [20, 'Phone number cannot exceed 20 characters']
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  coordinates: {
    latitude: {
      type: Number,
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90']
    },
    longitude: {
      type: Number,
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180']
    }
  },
  deliveryInstructions: {
    type: String,
    trim: true,
    maxlength: [500, 'Delivery instructions cannot exceed 500 characters']
  }
}, {
  timestamps: true,
  _id: true
});

// Wishlist Item Schema
const WishlistItemSchema = new Schema<IWishlistItem>({
  productId: {
    type: String,
    required: [true, 'Product ID is required'],
    index: true
  },
  variantId: {
    type: String,
    index: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  sharedWith: [{
    type: String,
    index: true
  }],
  notifyOnSale: {
    type: Boolean,
    default: true
  },
  notifyOnRestock: {
    type: Boolean,
    default: true
  }
}, {
  _id: true
});

// User Preferences Schema
const UserPreferencesSchema = new Schema<IUserPreferences>({
  notifications: {
    email: {
      orderUpdates: { type: Boolean, default: true },
      promotions: { type: Boolean, default: true },
      newsletter: { type: Boolean, default: false },
      recommendations: { type: Boolean, default: true },
      reviews: { type: Boolean, default: true },
      wishlistAlerts: { type: Boolean, default: true }
    },
    sms: {
      orderUpdates: { type: Boolean, default: false },
      promotions: { type: Boolean, default: false },
      deliveryUpdates: { type: Boolean, default: true }
    },
    push: {
      orderUpdates: { type: Boolean, default: true },
      promotions: { type: Boolean, default: false },
      recommendations: { type: Boolean, default: true },
      abandonedCart: { type: Boolean, default: true }
    }
  },
  privacy: {
    profileVisibility: {
      type: String,
      enum: ['public', 'friends', 'private'],
      default: 'private'
    },
    showPurchaseHistory: { type: Boolean, default: false },
    shareWishlist: { type: Boolean, default: false },
    allowRecommendations: { type: Boolean, default: true },
    allowDataCollection: { type: Boolean, default: true }
  },
  display: {
    language: { type: String, default: 'en' },
    currency: { type: String, default: 'USD' },
    timezone: { type: String, default: 'UTC' },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    },
    itemsPerPage: {
      type: Number,
      default: 20,
      min: [5, 'Items per page must be at least 5'],
      max: [100, 'Items per page cannot exceed 100']
    },
    defaultView: {
      type: String,
      enum: ['grid', 'list'],
      default: 'grid'
    }
  },
  shopping: {
    defaultShippingAddress: String,
    defaultBillingAddress: String,
    savePaymentMethods: { type: Boolean, default: true },
    autoApplyCoupons: { type: Boolean, default: true },
    preferredCategories: [String],
    excludedCategories: [String]
  }
}, { _id: false });

// Account Settings Schema
const AccountSettingsSchema = new Schema<IAccountSettings>({
  twoFactorAuth: {
    enabled: { type: Boolean, default: false },
    method: {
      type: String,
      enum: ['sms', 'email', 'authenticator']
    },
    backupCodes: [String]
  },
  security: {
    lastPasswordChange: Date,
    sessionTimeout: {
      type: Number,
      default: 30, // 30 minutes
      min: [5, 'Session timeout must be at least 5 minutes'],
      max: [480, 'Session timeout cannot exceed 8 hours']
    },
    loginAlerts: { type: Boolean, default: true }
  },
  communication: {
    preferredContactMethod: {
      type: String,
      enum: ['email', 'sms', 'phone'],
      default: 'email'
    },
    bestTimeToContact: {
      start: {
        type: String,
        match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (use HH:MM)']
      },
      end: {
        type: String,
        match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (use HH:MM)']
      },
      timezone: String
    }
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'premium', 'vip'],
      default: 'free'
    },
    startDate: Date,
    renewalDate: Date,
    autoRenew: { type: Boolean, default: true },
    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly'
    }
  }
}, { _id: false });

// Main User Profile Schema
const UserProfileSchema = new Schema<IUserProfile>({
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    unique: true,
    index: true
  },
  personalInfo: {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      index: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [20, 'Phone number cannot exceed 20 characters']
    },
    dateOfBirth: {
      type: Date,
      validate: {
        validator: function(date: Date) {
          return date <= new Date();
        },
        message: 'Date of birth cannot be in the future'
      }
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say']
    },
    avatar: {
      type: String,
      trim: true
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [1000, 'Bio cannot exceed 1000 characters']
    }
  },
  addresses: {
    type: [AddressSchema],
    default: [],
    validate: {
      validator: function(addresses: IAddress[]) {
        return addresses.length <= 10; // Maximum 10 addresses
      },
      message: 'Cannot have more than 10 addresses'
    }
  },
  wishlist: {
    type: [WishlistItemSchema],
    default: [],
    validate: {
      validator: function(wishlist: IWishlistItem[]) {
        return wishlist.length <= 500; // Maximum 500 wishlist items
      },
      message: 'Wishlist cannot contain more than 500 items'
    }
  },
  preferences: {
    type: UserPreferencesSchema,
    default: () => ({})
  },
  accountSettings: {
    type: AccountSettingsSchema,
    default: () => ({})
  },
  loyaltyProgram: {
    tier: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum'],
      default: 'bronze'
    },
    points: {
      type: Number,
      default: 0,
      min: [0, 'Loyalty points cannot be negative']
    },
    joinedDate: {
      type: Date,
      default: Date.now
    },
    expiryDate: Date
  },
  socialProfiles: [{
    platform: {
      type: String,
      enum: ['facebook', 'google', 'twitter', 'instagram'],
      required: true
    },
    profileId: {
      type: String,
      required: true
    },
    username: String
  }],
  metadata: {
    lastLoginAt: Date,
    loginCount: {
      type: Number,
      default: 0,
      min: [0, 'Login count cannot be negative']
    },
    registrationSource: {
      type: String,
      required: true,
      default: 'web'
    },
    referralCode: String,
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    isPhoneVerified: {
      type: Boolean,
      default: false
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'deleted'],
    default: 'active',
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
UserProfileSchema.index({ 'personalInfo.email': 1 }, { unique: true, sparse: true });
UserProfileSchema.index({ 'personalInfo.phone': 1 }, { sparse: true });
UserProfileSchema.index({ 'loyaltyProgram.tier': 1 });
UserProfileSchema.index({ 'loyaltyProgram.points': -1 });
UserProfileSchema.index({ 'addresses.country': 1 });
UserProfileSchema.index({ 'addresses.state': 1 });
UserProfileSchema.index({ 'addresses.city': 1 });
UserProfileSchema.index({ 'wishlist.productId': 1 });
UserProfileSchema.index({ createdAt: -1 });
UserProfileSchema.index({ updatedAt: -1 });

// Virtual for full name
UserProfileSchema.virtual('fullName').get(function(this: IUserProfile) {
  return `${this.personalInfo.firstName} ${this.personalInfo.lastName}`;
});

// Virtual for age
UserProfileSchema.virtual('age').get(function(this: IUserProfile) {
  if (!this.personalInfo.dateOfBirth) return null;
  
  const today = new Date();
  const birthDate = new Date(this.personalInfo.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Virtual for wishlist count
UserProfileSchema.virtual('wishlistCount').get(function(this: IUserProfile) {
  return this.wishlist.length;
});

// Virtual for address count
UserProfileSchema.virtual('addressCount').get(function(this: IUserProfile) {
  return this.addresses.length;
});

// Virtual for default shipping address
UserProfileSchema.virtual('defaultShippingAddress').get(function(this: IUserProfile) {
  return this.addresses.find(addr => addr.isDefault && 
    (addr.type === 'shipping' || addr.type === 'home'));
});

// Virtual for default billing address
UserProfileSchema.virtual('defaultBillingAddress').get(function(this: IUserProfile) {
  return this.addresses.find(addr => addr.isDefault && 
    (addr.type === 'billing' || addr.type === 'home'));
});

// Pre-save middleware
UserProfileSchema.pre('save', function(this: IUserProfile) {
  // Ensure only one default address per type
  if (this.isModified('addresses')) {
    const addressTypes = ['home', 'work', 'billing', 'shipping'];
    
    addressTypes.forEach(type => {
      const defaultAddresses = this.addresses.filter(addr => 
        addr.type === type && addr.isDefault
      );
      
      if (defaultAddresses.length > 1) {
        // Keep the first one as default, set others to false
        for (let i = 1; i < defaultAddresses.length; i++) {
          defaultAddresses[i].isDefault = false;
        }
      }
    });
  }

  // Update loyalty tier based on points
  if (this.loyaltyProgram && this.isModified('loyaltyProgram.points')) {
    const points = this.loyaltyProgram.points;
    
    if (points >= 10000) {
      this.loyaltyProgram.tier = 'platinum';
    } else if (points >= 5000) {
      this.loyaltyProgram.tier = 'gold';
    } else if (points >= 1000) {
      this.loyaltyProgram.tier = 'silver';
    } else {
      this.loyaltyProgram.tier = 'bronze';
    }
  }
});

// Instance Methods
UserProfileSchema.methods.addAddress = function(
  this: IUserProfile,
  addressData: Omit<IAddress, '_id' | 'createdAt' | 'updatedAt'>
) {
  // If this is the first address or marked as default, set it as default
  if (this.addresses.length === 0 || addressData.isDefault) {
    // Remove default from other addresses of the same type
    this.addresses.forEach(addr => {
      if (addr.type === addressData.type) {
        addr.isDefault = false;
      }
    });
  }

  this.addresses.push(addressData as IAddress);
  return this.save();
};

UserProfileSchema.methods.updateAddress = function(
  this: IUserProfile,
  addressId: string,
  updateData: Partial<IAddress>
) {
  const address = this.addresses.id(addressId);
  if (!address) {
    throw new Error('Address not found');
  }

  // If setting as default, remove default from other addresses of the same type
  if (updateData.isDefault) {
    this.addresses.forEach(addr => {
      if (addr.type === (updateData.type || address.type) && addr._id?.toString() !== addressId) {
        addr.isDefault = false;
      }
    });
  }

  Object.assign(address, updateData);
  address.updatedAt = new Date();
  return this.save();
};

UserProfileSchema.methods.removeAddress = function(
  this: IUserProfile,
  addressId: string
) {
  const address = this.addresses.id(addressId);
  if (!address) {
    throw new Error('Address not found');
  }

  this.addresses.pull(addressId);
  return this.save();
};

UserProfileSchema.methods.addToWishlist = function(
  this: IUserProfile,
  wishlistData: Omit<IWishlistItem, '_id' | 'addedAt'>
) {
  // Check if item already exists
  const existingItem = this.wishlist.find(item => 
    item.productId === wishlistData.productId && 
    item.variantId === wishlistData.variantId
  );

  if (existingItem) {
    throw new Error('Item already in wishlist');
  }

  this.wishlist.push({
    ...wishlistData,
    addedAt: new Date()
  } as IWishlistItem);

  return this.save();
};

UserProfileSchema.methods.updateWishlistItem = function(
  this: IUserProfile,
  itemId: string,
  updateData: Partial<IWishlistItem>
) {
  const item = this.wishlist.id(itemId);
  if (!item) {
    throw new Error('Wishlist item not found');
  }

  Object.assign(item, updateData);
  return this.save();
};

UserProfileSchema.methods.removeFromWishlist = function(
  this: IUserProfile,
  itemId: string
) {
  const item = this.wishlist.id(itemId);
  if (!item) {
    throw new Error('Wishlist item not found');
  }

  this.wishlist.pull(itemId);
  return this.save();
};

UserProfileSchema.methods.addLoyaltyPoints = function(
  this: IUserProfile,
  points: number
) {
  if (!this.loyaltyProgram) {
    this.loyaltyProgram = {
      tier: 'bronze',
      points: 0,
      joinedDate: new Date()
    };
  }

  this.loyaltyProgram.points += points;
  return this.save();
};

// Static Methods
UserProfileSchema.statics.findByUserId = function(userId: string) {
  return this.findOne({ userId, status: { $ne: 'deleted' } });
};

UserProfileSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ 
    'personalInfo.email': email.toLowerCase(),
    status: { $ne: 'deleted' }
  });
};

UserProfileSchema.statics.searchProfiles = function(
  filters: any,
  page: number = 1,
  limit: number = 20
) {
  const query: any = { status: { $ne: 'deleted' } };

  if (filters.status) query.status = filters.status;
  if (filters.loyaltyTier) query['loyaltyProgram.tier'] = filters.loyaltyTier;
  if (filters.country) query['addresses.country'] = filters.country;
  if (filters.state) query['addresses.state'] = filters.state;
  if (filters.city) query['addresses.city'] = filters.city;

  if (filters.registrationDateFrom || filters.registrationDateTo) {
    query.createdAt = {};
    if (filters.registrationDateFrom) query.createdAt.$gte = filters.registrationDateFrom;
    if (filters.registrationDateTo) query.createdAt.$lte = filters.registrationDateTo;
  }

  const skip = (page - 1) * limit;

  return Promise.all([
    this.find(query).skip(skip).limit(limit).exec(),
    this.countDocuments(query)
  ]).then(([profiles, total]) => ({
    profiles,
    totalCount: total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  }));
};

UserProfileSchema.statics.getLoyaltyLeaderboard = function(limit: number = 10) {
  return this.find(
    { status: 'active' },
    { 
      personalInfo: 1, 
      loyaltyProgram: 1,
      createdAt: 1
    }
  )
  .sort({ 'loyaltyProgram.points': -1 })
  .limit(limit)
  .exec();
};

// Create and export the model
const UserProfile: Model<IUserProfile> = mongoose.model<IUserProfile>('UserProfile', UserProfileSchema);

export default UserProfile;
export { UserProfileSchema };
