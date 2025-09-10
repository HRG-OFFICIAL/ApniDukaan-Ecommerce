import { Document, Types } from 'mongoose';

// ==================== ENUMS ====================

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification',
  DEACTIVATED = 'deactivated'
}

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MANAGER = 'manager',
  MODERATOR = 'moderator',
  CUSTOMER = 'customer',
  GUEST = 'guest'
}

export enum AuthProvider {
  LOCAL = 'local',
  GOOGLE = 'google',
  FACEBOOK = 'facebook',
  TWITTER = 'twitter',
  GITHUB = 'github',
  APPLE = 'apple'
}

export enum MfaMethod {
  NONE = 'none',
  TOTP = 'totp',
  SMS = 'sms',
  EMAIL = 'email'
}

export enum SessionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
  INVALID = 'invalid'
}

export enum AddressType {
  HOME = 'home',
  WORK = 'work',
  BILLING = 'billing',
  SHIPPING = 'shipping',
  OTHER = 'other'
}

export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in_app'
}

export enum PrivacyLevel {
  PUBLIC = 'public',
  FRIENDS = 'friends',
  PRIVATE = 'private'
}

export enum AccountAction {
  LOGIN = 'login',
  LOGOUT = 'logout',
  REGISTER = 'register',
  PASSWORD_CHANGE = 'password_change',
  PASSWORD_RESET = 'password_reset',
  EMAIL_VERIFICATION = 'email_verification',
  PROFILE_UPDATE = 'profile_update',
  MFA_ENABLE = 'mfa_enable',
  MFA_DISABLE = 'mfa_disable',
  ROLE_CHANGE = 'role_change',
  ACCOUNT_SUSPENSION = 'account_suspension',
  ACCOUNT_REACTIVATION = 'account_reactivation',
  ADMIN_UPDATE = 'admin_update',
  ACCOUNT_DELETION = 'account_deletion'
}

// ==================== BASE INTERFACES ====================

export interface ITimestamps {
  createdAt: Date;
  updatedAt: Date;
}

export interface IAuditFields extends ITimestamps {
  createdBy?: string;
  updatedBy?: string;
  version: number;
}

// ==================== USER INTERFACES ====================

export interface IAddress {
  _id?: string;
  type: AddressType;
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
  isVerified: boolean;
  metadata?: Record<string, any>;
}

export interface ISocialAccount {
  provider: AuthProvider;
  providerId: string;
  email?: string;
  name?: string;
  avatar?: string;
  accessToken?: string;
  refreshToken?: string;
  connectedAt: Date;
  lastUsed?: Date;
  isVerified: boolean;
}

export interface IMfaSettings {
  method: MfaMethod;
  isEnabled: boolean;
  secret?: string;
  backupCodes?: string[];
  phoneNumber?: string;
  lastUsed?: Date;
  setupAt?: Date;
}

export interface INotificationPreferences {
  channel: NotificationChannel;
  enabled: boolean;
  categories: {
    orderUpdates: boolean;
    promotions: boolean;
    security: boolean;
    newsletter: boolean;
    accountActivity: boolean;
  };
}

export interface IPrivacySettings {
  profileVisibility: PrivacyLevel;
  emailVisibility: PrivacyLevel;
  phoneVisibility: PrivacyLevel;
  addressVisibility: PrivacyLevel;
  allowDataCollection: boolean;
  allowMarketing: boolean;
  allowThirdPartySharing: boolean;
}

export interface IUserPreferences {
  language: string;
  timezone: string;
  currency: string;
  theme: 'light' | 'dark' | 'auto';
  notifications: INotificationPreferences[];
  privacy: IPrivacySettings;
  twoFactorAuth: IMfaSettings;
  newsletter: boolean;
  marketing: boolean;
}

export interface IUserProfile {
  firstName: string;
  lastName: string;
  displayName?: string;
  bio?: string;
  avatar?: {
    url: string;
    publicId?: string;
    provider: 'local' | 'cloudinary' | 'aws';
  };
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  phone?: {
    number: string;
    countryCode: string;
    isVerified: boolean;
    verifiedAt?: Date;
  };
  addresses: IAddress[];
  website?: string;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
  preferences: IUserPreferences;
  metadata?: Record<string, any>;
}

export interface IUserSecurity {
  passwordHash: string;
  passwordSalt?: string;
  passwordChangedAt?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  isEmailVerified: boolean;
  emailVerifiedAt?: Date;
  mfaSettings: IMfaSettings;
  loginAttempts: number;
  lockUntil?: Date;
  lastLogin?: Date;
  lastLoginIp?: string;
  lastLoginUserAgent?: string;
  securityQuestions?: {
    question: string;
    answerHash: string;
  }[];
}

export interface IUserActivity {
  action: AccountAction;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  location?: {
    country?: string;
    region?: string;
    city?: string;
    coordinates?: [number, number]; // [longitude, latitude]
  };
  deviceInfo?: {
    type: string;
    browser: string;
    os: string;
  };
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface IUser extends Document, IAuditFields {
  _id: Types.ObjectId;
  email: string;
  username?: string;
  profile: IUserProfile;
  security: IUserSecurity;
  roles: string[];
  status: UserStatus;
  authProviders: ISocialAccount[];
  activityLog: IUserActivity[];
  lastActive: Date;
  isOnline: boolean;
  stripeCustomerId?: string;
  loyaltyPoints?: number;
  referralCode?: string;
  referredBy?: string;
  suspensionEndDate?: Date;
  tags: string[];
  notes?: string;
  metadata?: Record<string, any>;
}

// ==================== ROLE & PERMISSION INTERFACES ====================

export interface IPermission extends Document, IAuditFields {
  _id: Types.ObjectId;
  name: string;
  description: string;
  resource: string;
  action: string;
  attributes?: string[];
  conditions?: Record<string, any>;
  isActive: boolean;
  category: string;
}

export interface IRole extends Document, IAuditFields {
  _id: Types.ObjectId;
  name: string;
  description: string;
  permissions: Types.ObjectId[] | IPermission[];
  isSystem: boolean;
  isActive: boolean;
  hierarchy: number;
  metadata?: Record<string, any>;
}

// ==================== SESSION INTERFACES ====================

export interface ISession extends Document, IAuditFields {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  sessionId: string;
  accessToken: string;
  refreshToken?: string;
  deviceInfo: {
    type: string;
    browser: string;
    os: string;
    userAgent: string;
  };
  ipAddress: string;
  location?: {
    country?: string;
    region?: string;
    city?: string;
  };
  status: SessionStatus;
  expiresAt: Date;
  lastAccessedAt: Date;
  issuedAt: Date;
  revokedAt?: Date;
  revokedBy?: Types.ObjectId;
  metadata?: Record<string, any>;
  isExpired?: boolean;
  isActive?: boolean;
  durationMinutes?: number;
  timeUntilExpiry?: number;
}

// ==================== REQUEST/RESPONSE INTERFACES ====================

export interface IRegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username?: string;
  phone?: {
    number: string;
    countryCode: string;
  };
  dateOfBirth?: Date;
  acceptTerms: boolean;
  acceptMarketing?: boolean;
  referralCode?: string;
  metadata?: Record<string, any>;
}

export interface ILoginRequest {
  email?: string;
  username?: string;
  password: string;
  rememberMe?: boolean;
  mfaToken?: string;
  deviceInfo?: {
    type: string;
    browser: string;
    os: string;
    userAgent: string;
  };
}

export interface ILoginResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    profile: Partial<IUserProfile>;
    roles: string[];
    status: UserStatus;
    isEmailVerified: boolean;
    mfaRequired?: boolean;
  };
  tokens?: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: string;
  };
  sessionId?: string;
  requiresMfa?: boolean;
}

export interface ISocialAuthRequest {
  provider: AuthProvider;
  code?: string;
  accessToken?: string;
  idToken?: string;
  redirectUri?: string;
  state?: string;
}

export interface IPasswordResetRequest {
  email: string;
  redirectUrl?: string;
}

export interface IPasswordUpdateRequest {
  currentPassword?: string;
  newPassword: string;
  confirmPassword: string;
  resetToken?: string;
}

export interface IProfileUpdateRequest {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  bio?: string;
  dateOfBirth?: Date;
  gender?: string;
  phone?: {
    number: string;
    countryCode: string;
  };
  website?: string;
  socialLinks?: Record<string, string>;
  preferences?: Partial<IUserPreferences>;
}

export interface IAddressRequest {
  type: AddressType;
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
}

export interface IMfaSetupRequest {
  method: MfaMethod;
  phoneNumber?: string;
}

export interface IMfaVerifyRequest {
  token: string;
  method: MfaMethod;
  backupCode?: string;
}

export interface IUserSearchQuery {
  page?: number;
  limit?: number;
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  filters?: {
    status?: UserStatus;
    role?: string;
    emailVerified?: boolean;
    lastLogin?: {
      start: Date;
      end: Date;
    };
    registrationDate?: {
      start: Date;
      end: Date;
    };
    search?: string;
    tags?: string[];
  };
}

export interface IUserAnalytics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  usersByStatus: Record<UserStatus, number>;
  usersByRole: Record<string, number>;
  usersByProvider: Record<AuthProvider, number>;
  loginStats: {
    totalLogins: number;
    uniqueLogins: number;
    averageSessionDuration: number;
  };
  registrationTrends: {
    date: string;
    count: number;
  }[];
  topLocations: {
    country: string;
    count: number;
  }[];
  deviceStats: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
}

// ==================== SERVICE INTERFACES ====================

export interface IAuthService {
  register(userData: IRegisterRequest): Promise<{ success: boolean; message: string; user?: any; error?: string }>;
  login(credentials: ILoginRequest, req: any): Promise<ILoginResponse>;
  logout(sessionId: string): Promise<{ success: boolean; message: string }>;
  refreshToken(refreshToken: string): Promise<{ success: boolean; tokens?: any; error?: string }>;
  verifyEmail(token: string): Promise<{ success: boolean; message: string }>;
  resendVerification(email: string): Promise<{ success: boolean; message: string }>;
  requestPasswordReset(data: IPasswordResetRequest): Promise<{ success: boolean; message: string }>;
  resetPassword(data: IPasswordUpdateRequest): Promise<{ success: boolean; message: string }>;
  changePassword(userId: string, data: IPasswordUpdateRequest): Promise<{ success: boolean; message: string }>;
  validateSession(sessionId: string): Promise<{ valid: boolean; user?: any; session?: any }>;
}

export interface IUserService {
  getUserById(userId: string): Promise<{ success: boolean; user?: IUser; error?: string }>;
  getUserByEmail(email: string): Promise<{ success: boolean; user?: IUser; error?: string }>;
  updateProfile(userId: string, profileData: IProfileUpdateRequest): Promise<{ success: boolean; user?: IUser; error?: string }>;
  uploadAvatar(userId: string, file: any): Promise<{ success: boolean; avatar?: any; error?: string }>;
  addAddress(userId: string, addressData: IAddressRequest): Promise<{ success: boolean; address?: IAddress; error?: string }>;
  updateAddress(userId: string, addressId: string, addressData: Partial<IAddressRequest>): Promise<{ success: boolean; error?: string }>;
  deleteAddress(userId: string, addressId: string): Promise<{ success: boolean; error?: string }>;
  updatePreferences(userId: string, preferences: Partial<IUserPreferences>): Promise<{ success: boolean; error?: string }>;
  deactivateUser(userId: string, reason?: string): Promise<{ success: boolean; error?: string }>;
  reactivateUser(userId: string): Promise<{ success: boolean; error?: string }>;
}

export interface IRoleService {
  createRole(roleData: Partial<IRole>): Promise<{ success: boolean; role?: IRole; error?: string }>;
  updateRole(roleId: string, roleData: Partial<IRole>): Promise<{ success: boolean; role?: IRole; error?: string }>;
  deleteRole(roleId: string): Promise<{ success: boolean; error?: string }>;
  assignRole(userId: string, roleId: string): Promise<{ success: boolean; error?: string }>;
  removeRole(userId: string, roleId: string): Promise<{ success: boolean; error?: string }>;
  getUserPermissions(userId: string): Promise<{ success: boolean; permissions?: string[]; error?: string }>;
  hasPermission(userId: string, permission: string): Promise<boolean>;
}

export interface ISocialAuthService {
  authenticateWithGoogle(data: ISocialAuthRequest): Promise<ILoginResponse>;
  authenticateWithFacebook(data: ISocialAuthRequest): Promise<ILoginResponse>;
  authenticateWithTwitter(data: ISocialAuthRequest): Promise<ILoginResponse>;
  authenticateWithGitHub(data: ISocialAuthRequest): Promise<ILoginResponse>;
  linkSocialAccount(userId: string, provider: AuthProvider, data: any): Promise<{ success: boolean; error?: string }>;
  unlinkSocialAccount(userId: string, provider: AuthProvider): Promise<{ success: boolean; error?: string }>;
}

// ==================== UTILITY INTERFACES ====================

export interface IJwtPayload {
  sub: string;
  email: string;
  roles: string[];
  sessionId: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

export interface IApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  code?: string;
  timestamp: string;
  path?: string;
  method?: string;
}

export interface IPaginatedResponse<T = any> {
  success: boolean;
  message: string;
  data: {
    items: T[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
  error?: string;
  code?: string;
  timestamp: string;
  path?: string;
  method?: string;
}

export interface IValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

export interface IServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  validationErrors?: IValidationError[];
}

// ==================== ADDITIONAL REQUEST/RESPONSE INTERFACES ====================

export interface IRoleRequest {
  name: string;
  displayName: string;
  description: string;
  type: RoleType;
  permissions: string[];
  isSystem?: boolean;
  isActive?: boolean;
  hierarchy?: number;
  metadata?: Record<string, any>;
}

export interface IRoleUpdateRequest {
  name?: string;
  displayName?: string;
  description?: string;
  type?: RoleType;
  permissions?: string[];
  isActive?: boolean;
  hierarchy?: number;
  metadata?: Record<string, any>;
}

export interface IUserSearchRequest {
  page?: number;
  limit?: number;
  search?: string;
  status?: UserStatus;
  role?: UserRole;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  startDate?: Date;
  endDate?: Date;
  isEmailVerified?: boolean;
  hasMfaEnabled?: boolean;
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  filters?: {
    status?: UserStatus;
    role?: string;
    emailVerified?: boolean;
    lastLogin?: {
      start: Date;
      end: Date;
    };
    registrationDate?: {
      start: Date;
      end: Date;
    };
    search?: string;
    tags?: string[];
  };
}

export interface IUserBulkActionRequest {
  userIds: string[];
  action: BulkAction;
  reason?: string;
  metadata?: Record<string, any>;
}

export enum RoleType {
  SYSTEM = 'system',
  CUSTOM = 'custom'
}

export enum BulkAction {
  ACTIVATE = 'activate',
  DEACTIVATE = 'deactivate',
  SUSPEND = 'suspend',
  DELETE = 'delete',
  CHANGE_ROLE = 'change_role',
  SEND_EMAIL = 'send_email',
  EXPORT_DATA = 'export_data'
}
