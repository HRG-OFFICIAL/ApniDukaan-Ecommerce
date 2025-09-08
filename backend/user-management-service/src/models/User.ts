import { Schema, model, Document, Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { 
  IUser, 
  IUserProfile, 
  IUserSecurity, 
  IUserActivity,
  IAddress,
  ISocialAccount,
  IMfaSettings,
  IUserPreferences,
  INotificationPreferences,
  IPrivacySettings,
  UserStatus,
  AuthProvider,
  MfaMethod,
  AddressType,
  NotificationChannel,
  PrivacyLevel,
  AccountAction
} from '../types/user.types';

// ==================== SUB-SCHEMAS ====================

const AddressSchema = new Schema<IAddress>({
  type: {
    type: String,
    enum: Object.values(AddressType),
    required: true,
    default: AddressType.HOME
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  company: {
    type: String,
    trim: true,
    maxlength: 100
  },
  addressLine1: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  addressLine2: {
    type: String,
    trim: true,
    maxlength: 100
  },
  city: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  state: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  postalCode: {
    type: String,
    required: true,
    trim: true,
    maxlength: 20
  },
  country: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
    default: 'US'
  },
  phone: {
    type: String,
    trim: true,
    match: /^[+]?[\d\s\-\(\)]{10,20}$/
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, { 
  _id: true,
  timestamps: true 
});

const SocialAccountSchema = new Schema<ISocialAccount>({
  provider: {
    type: String,
    enum: Object.values(AuthProvider),
    required: true
  },
  providerId: {
    type: String,
    required: true
  },
  email: String,
  name: String,
  avatar: String,
  accessToken: String,
  refreshToken: String,
  connectedAt: {
    type: Date,
    default: Date.now
  },
  lastUsed: Date,
  isVerified: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const MfaSettingsSchema = new Schema<IMfaSettings>({
  method: {
    type: String,
    enum: Object.values(MfaMethod),
    default: MfaMethod.NONE
  },
  isEnabled: {
    type: Boolean,
    default: false
  },
  secret: String,
  backupCodes: [String],
  phoneNumber: String,
  lastUsed: Date,
  setupAt: Date
}, { _id: false });

const NotificationPreferencesSchema = new Schema<INotificationPreferences>({
  channel: {
    type: String,
    enum: Object.values(NotificationChannel),
    required: true
  },
  enabled: {
    type: Boolean,
    default: true
  },
  categories: {
    orderUpdates: {
      type: Boolean,
      default: true
    },
    promotions: {
      type: Boolean,
      default: false
    },
    security: {
      type: Boolean,
      default: true
    },
    newsletter: {
      type: Boolean,
      default: false
    },
    accountActivity: {
      type: Boolean,
      default: true
    }
  }
}, { _id: false });

const PrivacySettingsSchema = new Schema<IPrivacySettings>({
  profileVisibility: {
    type: String,
    enum: Object.values(PrivacyLevel),
    default: PrivacyLevel.PUBLIC
  },
  emailVisibility: {
    type: String,
    enum: Object.values(PrivacyLevel),
    default: PrivacyLevel.PRIVATE
  },
  phoneVisibility: {
    type: String,
    enum: Object.values(PrivacyLevel),
    default: PrivacyLevel.PRIVATE
  },
  addressVisibility: {
    type: String,
    enum: Object.values(PrivacyLevel),
    default: PrivacyLevel.PRIVATE
  },
  allowDataCollection: {
    type: Boolean,
    default: true
  },
  allowMarketing: {
    type: Boolean,
    default: false
  },
  allowThirdPartySharing: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const UserPreferencesSchema = new Schema<IUserPreferences>({
  language: {
    type: String,
    default: 'en',
    match: /^[a-z]{2}$/
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  currency: {
    type: String,
    default: 'USD',
    match: /^[A-Z]{3}$/
  },
  theme: {
    type: String,
    enum: ['light', 'dark', 'auto'],
    default: 'light'
  },
  notifications: [NotificationPreferencesSchema],
  privacy: {
    type: PrivacySettingsSchema,
    default: () => ({})
  },
  twoFactorAuth: {
    type: MfaSettingsSchema,
    default: () => ({})
  },
  newsletter: {
    type: Boolean,
    default: false
  },
  marketing: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const UserProfileSchema = new Schema<IUserProfile>({
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  displayName: {
    type: String,
    trim: true,
    maxlength: 100
  },
  bio: {
    type: String,
    maxlength: 500
  },
  avatar: {
    url: String,
    publicId: String,
    provider: {
      type: String,
      enum: ['local', 'cloudinary', 'aws'],
      default: 'local'
    }
  },
  dateOfBirth: Date,
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say']
  },
  phone: {
    number: {
      type: String,
      match: /^[+]?[\d\s\-\(\)]{10,20}$/
    },
    countryCode: {
      type: String,
      match: /^[+]?\d{1,4}$/
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedAt: Date
  },
  addresses: [AddressSchema],
  website: {
    type: String,
    validate: {
      validator: function(v: string) {
        return !v || /^https?:\/\/[^\s$.?#].[^\s]*$/.test(v);
      },
      message: 'Invalid website URL'
    }
  },
  socialLinks: {
    facebook: String,
    twitter: String,
    instagram: String,
    linkedin: String
  },
  preferences: {
    type: UserPreferencesSchema,
    default: () => ({})
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, { _id: false });

const UserSecuritySchema = new Schema<IUserSecurity>({
  passwordHash: {
    type: String,
    required: true
  },
  passwordSalt: String,
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerifiedAt: Date,
  mfaSettings: {
    type: MfaSettingsSchema,
    default: () => ({})
  },
  loginAttempts: {
    type: Number,
    default: 0,
    max: 10
  },
  lockUntil: Date,
  lastLogin: Date,
  lastLoginIp: String,
  lastLoginUserAgent: String,
  securityQuestions: [{
    question: String,
    answerHash: String
  }]
}, { _id: false });

const UserActivitySchema = new Schema<IUserActivity>({
  action: {
    type: String,
    enum: Object.values(AccountAction),
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  ipAddress: String,
  userAgent: String,
  location: {
    country: String,
    region: String,
    city: String,
    coordinates: [Number] // [longitude, latitude]
  },
  deviceInfo: {
    type: String,
    browser: String,
    os: String
  },
  success: {
    type: Boolean,
    required: true
  },
  errorMessage: String,
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, { _id: false });

// ==================== MAIN USER SCHEMA ====================

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    maxlength: 255
  },
  username: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    match: /^[a-zA-Z0-9_]+$/
  },
  profile: {
    type: UserProfileSchema,
    required: true
  },
  security: {
    type: UserSecuritySchema,
    required: true
  },
  roles: [{
    type: String,
    default: 'customer'
  }],
  status: {
    type: String,
    enum: Object.values(UserStatus),
    default: UserStatus.PENDING_VERIFICATION
  },
  authProviders: [SocialAccountSchema],
  activityLog: {
    type: [UserActivitySchema],
    default: [],
    validate: {
      validator: function(activities: IUserActivity[]) {
        return activities.length <= 1000; // Limit to last 1000 activities
      },
      message: 'Activity log cannot exceed 1000 entries'
    }
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  stripeCustomerId: String,
  loyaltyPoints: {
    type: Number,
    default: 0,
    min: 0
  },
  referralCode: {
    type: String,
    unique: true,
    sparse: true,
    uppercase: true
  },
  referredBy: String,
  tags: [{
    type: String,
    trim: true
  }],
  notes: String,
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
      delete ret.security.passwordHash;
      delete ret.security.passwordSalt;
      delete ret.security.passwordResetToken;
      delete ret.security.emailVerificationToken;
      delete ret.security.mfaSettings.secret;
      delete ret.security.mfaSettings.backupCodes;
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

// Compound indexes for efficient queries
UserSchema.index({ email: 1, status: 1 });
UserSchema.index({ username: 1 }, { sparse: true });
UserSchema.index({ 'profile.firstName': 1, 'profile.lastName': 1 });
UserSchema.index({ roles: 1, status: 1 });
UserSchema.index({ lastActive: -1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ referralCode: 1 }, { sparse: true });
UserSchema.index({ stripeCustomerId: 1 }, { sparse: true });
UserSchema.index({ tags: 1 });
UserSchema.index({ 'security.isEmailVerified': 1 });
UserSchema.index({ 'security.lastLogin': -1 });
UserSchema.index({ 'authProviders.provider': 1, 'authProviders.providerId': 1 });

// Text search index
UserSchema.index({
  email: 'text',
  username: 'text',
  'profile.firstName': 'text',
  'profile.lastName': 'text',
  'profile.displayName': 'text'
});

// TTL index for password reset tokens
UserSchema.index({ 'security.passwordResetExpires': 1 }, { expireAfterSeconds: 0 });
UserSchema.index({ 'security.emailVerificationExpires': 1 }, { expireAfterSeconds: 0 });

// ==================== VIRTUAL PROPERTIES ====================

UserSchema.virtual('profile.fullName').get(function() {
  return `${this.profile.firstName} ${this.profile.lastName}`;
});

UserSchema.virtual('isLocked').get(function() {
  return !!(this.security.lockUntil && this.security.lockUntil > new Date());
});

UserSchema.virtual('isActive').get(function() {
  return this.status === UserStatus.ACTIVE;
});

UserSchema.virtual('hasVerifiedEmail').get(function() {
  return this.security.isEmailVerified;
});

UserSchema.virtual('daysSinceRegistration').get(function() {
  return Math.floor((Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24));
});

// ==================== INSTANCE METHODS ====================

UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.security.passwordHash);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

UserSchema.methods.generatePasswordResetToken = function(): string {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.security.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.security.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  return resetToken;
};

UserSchema.methods.generateEmailVerificationToken = function(): string {
  const verificationToken = crypto.randomBytes(32).toString('hex');
  this.security.emailVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
  this.security.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  return verificationToken;
};

UserSchema.methods.generateAccessToken = function(sessionId: string): string {
  const payload = {
    sub: this._id.toString(),
    email: this.email,
    roles: this.roles,
    sessionId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    iss: process.env.JWT_ISSUER || 'shopsphere-user-service',
    aud: process.env.JWT_AUDIENCE || 'shopsphere-app'
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET!);
};

UserSchema.methods.generateRefreshToken = function(): string {
  return crypto.randomBytes(40).toString('hex');
};

UserSchema.methods.incrementLoginAttempts = function(): Promise<IUser> {
  // If we have a previous lock that has expired, restart at 1
  if (this.security.lockUntil && this.security.lockUntil < new Date()) {
    return this.updateOne({
      $unset: { 'security.lockUntil': 1 },
      $set: { 'security.loginAttempts': 1 }
    });
  }
  
  const updates: any = { $inc: { 'security.loginAttempts': 1 } };
  
  // Lock account after 5 failed attempts
  if (this.security.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { 'security.lockUntil': new Date(Date.now() + 2 * 60 * 60 * 1000) }; // 2 hours
  }
  
  return this.updateOne(updates);
};

UserSchema.methods.resetLoginAttempts = function(): Promise<IUser> {
  return this.updateOne({
    $unset: { 
      'security.loginAttempts': 1, 
      'security.lockUntil': 1 
    }
  });
};

UserSchema.methods.updateLastLogin = function(ipAddress: string, userAgent: string): Promise<IUser> {
  return this.updateOne({
    $set: {
      'security.lastLogin': new Date(),
      'security.lastLoginIp': ipAddress,
      'security.lastLoginUserAgent': userAgent,
      lastActive: new Date(),
      isOnline: true
    }
  });
};

UserSchema.methods.addActivity = function(activity: Partial<IUserActivity>): void {
  this.activityLog.unshift({
    ...activity,
    timestamp: new Date()
  } as IUserActivity);
  
  // Keep only last 1000 activities
  if (this.activityLog.length > 1000) {
    this.activityLog = this.activityLog.slice(0, 1000);
  }
};

UserSchema.methods.hasRole = function(role: string): boolean {
  return this.roles.includes(role);
};

UserSchema.methods.hasAnyRole = function(roles: string[]): boolean {
  return roles.some(role => this.roles.includes(role));
};

UserSchema.methods.addRole = function(role: string): void {
  if (!this.hasRole(role)) {
    this.roles.push(role);
  }
};

UserSchema.methods.removeRole = function(role: string): void {
  this.roles = this.roles.filter(r => r !== role);
};

UserSchema.methods.generateReferralCode = function(): string {
  if (!this.referralCode) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    this.referralCode = `${this.profile.firstName.substring(0, 2).toUpperCase()}${code}`;
  }
  return this.referralCode;
};

UserSchema.methods.getSocialAccount = function(provider: AuthProvider): ISocialAccount | undefined {
  return this.authProviders.find(account => account.provider === provider);
};

UserSchema.methods.addSocialAccount = function(socialAccount: ISocialAccount): void {
  const existingIndex = this.authProviders.findIndex(
    account => account.provider === socialAccount.provider
  );
  
  if (existingIndex >= 0) {
    this.authProviders[existingIndex] = socialAccount;
  } else {
    this.authProviders.push(socialAccount);
  }
};

UserSchema.methods.removeSocialAccount = function(provider: AuthProvider): void {
  this.authProviders = this.authProviders.filter(account => account.provider !== provider);
};

// ==================== STATIC METHODS ====================

UserSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

UserSchema.statics.findByUsername = function(username: string) {
  return this.findOne({ username });
};

UserSchema.statics.findByPasswordResetToken = function(token: string) {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  return this.findOne({
    'security.passwordResetToken': hashedToken,
    'security.passwordResetExpires': { $gt: new Date() }
  });
};

UserSchema.statics.findByEmailVerificationToken = function(token: string) {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  return this.findOne({
    'security.emailVerificationToken': hashedToken,
    'security.emailVerificationExpires': { $gt: new Date() }
  });
};

UserSchema.statics.findBySocialProvider = function(provider: AuthProvider, providerId: string) {
  return this.findOne({
    'authProviders.provider': provider,
    'authProviders.providerId': providerId
  });
};

UserSchema.statics.findActiveUsers = function(limit: number = 100) {
  return this.find({ 
    status: UserStatus.ACTIVE,
    lastActive: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
  })
  .limit(limit)
  .sort({ lastActive: -1 });
};

// ==================== MIDDLEWARE ====================

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('security.passwordHash') || !this.security.passwordHash) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.security.passwordHash = await bcrypt.hash(this.security.passwordHash, salt);
    this.security.passwordSalt = salt;
    this.security.passwordChangedAt = new Date();
    next();
  } catch (error: any) {
    next(error);
  }
});

// Generate referral code if not exists
UserSchema.pre('save', function(next) {
  if (this.isNew && !this.referralCode) {
    this.generateReferralCode();
  }
  next();
});

// Update version on save
UserSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.version += 1;
  }
  next();
});

// Ensure only one default address per type
UserSchema.pre('save', function(next) {
  if (this.isModified('profile.addresses')) {
    const addressTypes: { [key: string]: boolean } = {};
    
    this.profile.addresses.forEach((address) => {
      if (address.isDefault) {
        if (addressTypes[address.type]) {
          address.isDefault = false; // Remove default from duplicate
        } else {
          addressTypes[address.type] = true;
        }
      }
    });
  }
  next();
});

// Update lastActive timestamp
UserSchema.pre(['updateOne', 'findOneAndUpdate'], function(next) {
  this.set({ lastActive: new Date() });
  next();
});

export default model<IUser>('User', UserSchema);
