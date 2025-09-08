import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import nodemailer from 'nodemailer';
import geoip from 'geoip-lite';
import UAParser from 'ua-parser-js';
import { createClient } from 'redis';

import User from '../models/User';
import Session from '../models/Session';
import { Role } from '../models/Role';

import {
  IAuthService,
  IRegisterRequest,
  ILoginRequest,
  ILoginResponse,
  IPasswordResetRequest,
  IPasswordUpdateRequest,
  IMfaSetupRequest,
  IMfaVerifyRequest,
  UserStatus,
  AccountAction,
  MfaMethod,
  SessionStatus,
  AuthProvider
} from '../types/user.types';

import { logger } from '../utils/logger';

export class AuthService implements IAuthService {
  private redisClient: any;
  private emailTransporter: any;

  constructor() {
    this.initializeRedis();
    this.initializeEmailTransporter();
  }

  private async initializeRedis(): Promise<void> {
    try {
      this.redisClient = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      });
      await this.redisClient.connect();
      logger.info('Redis connected for AuthService');
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      this.redisClient = null;
    }
  }

  private initializeEmailTransporter(): void {
    if (process.env.SMTP_HOST) {
      this.emailTransporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    }
  }

  // ==================== REGISTRATION ====================

  async register(userData: IRegisterRequest): Promise<{ success: boolean; message: string; user?: any; error?: string }> {
    try {
      // Check if user already exists
      const existingUser = await User.findByEmail(userData.email);
      if (existingUser) {
        return {
          success: false,
          error: 'User already exists with this email address'
        };
      }

      // Check username uniqueness if provided
      if (userData.username) {
        const existingUsername = await User.findByUsername(userData.username);
        if (existingUsername) {
          return {
            success: false,
            error: 'Username is already taken'
          };
        }
      }

      // Validate password strength
      const passwordValidation = this.validatePasswordStrength(userData.password);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          error: `Password validation failed: ${passwordValidation.errors.join(', ')}`
        };
      }

      // Get default role
      const customerRole = await Role.findByName('CUSTOMER');
      const defaultRoles = customerRole ? ['customer'] : ['customer'];

      // Create user object
      const newUser = new User({
        email: userData.email,
        username: userData.username,
        profile: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phone,
          dateOfBirth: userData.dateOfBirth,
          addresses: [],
          preferences: {
            language: 'en',
            timezone: 'UTC',
            currency: 'USD',
            theme: 'light',
            notifications: [
              {
                channel: 'email',
                enabled: true,
                categories: {
                  orderUpdates: true,
                  promotions: userData.acceptMarketing || false,
                  security: true,
                  newsletter: userData.acceptMarketing || false,
                  accountActivity: true
                }
              }
            ],
            privacy: {
              profileVisibility: 'public',
              emailVisibility: 'private',
              phoneVisibility: 'private',
              addressVisibility: 'private',
              allowDataCollection: userData.acceptTerms,
              allowMarketing: userData.acceptMarketing || false,
              allowThirdPartySharing: false
            },
            twoFactorAuth: {
              method: MfaMethod.NONE,
              isEnabled: false
            },
            newsletter: userData.acceptMarketing || false,
            marketing: userData.acceptMarketing || false
          },
          metadata: userData.metadata || {}
        },
        security: {
          passwordHash: userData.password, // Will be hashed by pre-save middleware
          isEmailVerified: false,
          mfaSettings: {
            method: MfaMethod.NONE,
            isEnabled: false
          },
          loginAttempts: 0
        },
        roles: defaultRoles,
        status: UserStatus.PENDING_VERIFICATION,
        authProviders: [{
          provider: AuthProvider.LOCAL,
          providerId: userData.email,
          email: userData.email,
          connectedAt: new Date(),
          isVerified: false
        }],
        activityLog: [],
        lastActive: new Date(),
        isOnline: false,
        loyaltyPoints: 0,
        referredBy: userData.referralCode,
        tags: ['new_user'],
        metadata: userData.metadata || {}
      });

      // Generate referral code
      newUser.generateReferralCode();

      // Generate email verification token
      const verificationToken = newUser.generateEmailVerificationToken();

      // Save user
      await newUser.save();

      // Log registration activity
      newUser.addActivity({
        action: AccountAction.REGISTER,
        timestamp: new Date(),
        success: true,
        metadata: {
          registrationSource: 'direct',
          referralCode: userData.referralCode
        }
      });

      await newUser.save();

      // Send verification email
      if (this.emailTransporter) {
        await this.sendVerificationEmail(newUser, verificationToken);
      }

      // Handle referral rewards
      if (userData.referralCode) {
        await this.processReferralReward(userData.referralCode, newUser._id.toString());
      }

      // Cache user data
      if (this.redisClient) {
        await this.cacheUser(newUser);
      }

      logger.info('User registered successfully', { userId: newUser._id, email: userData.email });

      return {
        success: true,
        message: 'User registered successfully. Please check your email to verify your account.',
        user: {
          id: newUser._id,
          email: newUser.email,
          profile: {
            firstName: newUser.profile.firstName,
            lastName: newUser.profile.lastName
          },
          status: newUser.status,
          roles: newUser.roles
        }
      };

    } catch (error: any) {
      logger.error('Registration failed:', error);
      return {
        success: false,
        error: 'Registration failed. Please try again.'
      };
    }
  }

  // ==================== LOGIN ====================

  async login(credentials: ILoginRequest, req: any): Promise<ILoginResponse> {
    try {
      // Find user by email or username
      let user;
      if (credentials.email) {
        user = await User.findByEmail(credentials.email);
      } else if (credentials.username) {
        user = await User.findByUsername(credentials.username);
      }

      if (!user) {
        return {
          success: false,
          message: 'Invalid credentials'
        };
      }

      // Check if account is locked
      if (user.isLocked) {
        await user.addActivity({
          action: AccountAction.LOGIN,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          success: false,
          errorMessage: 'Account locked due to too many failed attempts'
        });

        return {
          success: false,
          message: 'Account is temporarily locked due to too many failed login attempts'
        };
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(credentials.password);
      if (!isPasswordValid) {
        await user.incrementLoginAttempts();
        await user.addActivity({
          action: AccountAction.LOGIN,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          success: false,
          errorMessage: 'Invalid password'
        });

        return {
          success: false,
          message: 'Invalid credentials'
        };
      }

      // Check account status
      if (user.status === UserStatus.SUSPENDED) {
        return {
          success: false,
          message: 'Account is suspended. Please contact support.'
        };
      }

      if (user.status === UserStatus.DEACTIVATED) {
        return {
          success: false,
          message: 'Account is deactivated. Please contact support to reactivate.'
        };
      }

      // Check if MFA is required
      if (user.security.mfaSettings.isEnabled && !credentials.mfaToken) {
        // Store temporary login data in Redis
        const tempLoginId = uuidv4();
        if (this.redisClient) {
          await this.redisClient.setEx(
            `temp_login:${tempLoginId}`,
            300, // 5 minutes
            JSON.stringify({
              userId: user._id.toString(),
              timestamp: new Date().toISOString()
            })
          );
        }

        return {
          success: false,
          message: 'Multi-factor authentication required',
          requiresMfa: true,
          user: {
            id: user._id.toString(),
            email: user.email,
            profile: {
              firstName: user.profile.firstName,
              lastName: user.profile.lastName
            },
            roles: user.roles,
            status: user.status,
            isEmailVerified: user.security.isEmailVerified,
            mfaRequired: true
          }
        };
      }

      // Verify MFA token if provided
      if (user.security.mfaSettings.isEnabled && credentials.mfaToken) {
        const mfaValid = await this.verifyMfaToken(user, credentials.mfaToken);
        if (!mfaValid) {
          await user.addActivity({
            action: AccountAction.LOGIN,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            success: false,
            errorMessage: 'Invalid MFA token'
          });

          return {
            success: false,
            message: 'Invalid multi-factor authentication token'
          };
        }
      }

      // Parse device information
      const deviceInfo = this.parseDeviceInfo(req.get('User-Agent') || '');
      const location = this.getLocationFromIP(req.ip);

      // Create session
      const sessionId = uuidv4();
      const accessToken = user.generateAccessToken(sessionId);
      const refreshToken = user.generateRefreshToken();
      
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + (credentials.rememberMe ? 24 * 30 : 24)); // 30 days or 24 hours

      const session = new Session({
        userId: user._id,
        sessionId,
        accessToken,
        refreshToken,
        deviceInfo,
        ipAddress: req.ip,
        location,
        status: SessionStatus.ACTIVE,
        expiresAt,
        lastAccessedAt: new Date(),
        issuedAt: new Date()
      });

      await session.save();

      // Update user login information
      await user.updateLastLogin(req.ip, req.get('User-Agent') || '');
      await user.resetLoginAttempts();

      // Log successful login
      await user.addActivity({
        action: AccountAction.LOGIN,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        location,
        deviceInfo,
        success: true
      });

      await user.save();

      // Cache session
      if (this.redisClient) {
        await this.cacheSession(session);
      }

      logger.info('User logged in successfully', { 
        userId: user._id, 
        email: user.email,
        sessionId,
        deviceType: deviceInfo.type
      });

      return {
        success: true,
        message: 'Login successful',
        user: {
          id: user._id.toString(),
          email: user.email,
          profile: {
            firstName: user.profile.firstName,
            lastName: user.profile.lastName,
            displayName: user.profile.displayName,
            avatar: user.profile.avatar
          },
          roles: user.roles,
          status: user.status,
          isEmailVerified: user.security.isEmailVerified
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: credentials.rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60, // seconds
          tokenType: 'Bearer'
        },
        sessionId
      };

    } catch (error: any) {
      logger.error('Login failed:', error);
      return {
        success: false,
        message: 'Login failed. Please try again.'
      };
    }
  }

  // ==================== LOGOUT ====================

  async logout(sessionId: string): Promise<{ success: boolean; message: string }> {
    try {
      const session = await Session.findBySessionId(sessionId);
      if (!session) {
        return {
          success: false,
          message: 'Session not found'
        };
      }

      // Revoke session
      await session.revoke();

      // Update user status
      const user = await User.findById(session.userId);
      if (user) {
        user.isOnline = false;
        await user.addActivity({
          action: AccountAction.LOGOUT,
          timestamp: new Date(),
          success: true
        });
        await user.save();
      }

      // Remove from cache
      if (this.redisClient) {
        await this.redisClient.del(`session:${sessionId}`);
        await this.redisClient.del(`user:${session.userId}`);
      }

      logger.info('User logged out successfully', { sessionId, userId: session.userId });

      return {
        success: true,
        message: 'Logout successful'
      };

    } catch (error: any) {
      logger.error('Logout failed:', error);
      return {
        success: false,
        message: 'Logout failed. Please try again.'
      };
    }
  }

  // ==================== TOKEN MANAGEMENT ====================

  async refreshToken(refreshToken: string): Promise<{ success: boolean; tokens?: any; error?: string }> {
    try {
      const session = await Session.findByRefreshToken(refreshToken);
      if (!session || !session.isValid()) {
        return {
          success: false,
          error: 'Invalid or expired refresh token'
        };
      }

      const user = await User.findById(session.userId);
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Generate new tokens
      const newAccessToken = user.generateAccessToken(session.sessionId);
      const newRefreshToken = user.generateRefreshToken();

      // Update session
      session.accessToken = newAccessToken;
      session.refreshToken = newRefreshToken;
      await session.updateLastAccessed();
      await session.save();

      // Update cache
      if (this.redisClient) {
        await this.cacheSession(session);
      }

      return {
        success: true,
        tokens: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          expiresIn: 24 * 60 * 60, // 24 hours in seconds
          tokenType: 'Bearer'
        }
      };

    } catch (error: any) {
      logger.error('Token refresh failed:', error);
      return {
        success: false,
        error: 'Token refresh failed'
      };
    }
  }

  // ==================== EMAIL VERIFICATION ====================

  async verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
    try {
      const user = await User.findByEmailVerificationToken(token);
      if (!user) {
        return {
          success: false,
          message: 'Invalid or expired verification token'
        };
      }

      // Update user status
      user.security.isEmailVerified = true;
      user.security.emailVerifiedAt = new Date();
      user.security.emailVerificationToken = undefined;
      user.security.emailVerificationExpires = undefined;
      user.status = UserStatus.ACTIVE;

      // Log verification activity
      user.addActivity({
        action: AccountAction.EMAIL_VERIFICATION,
        timestamp: new Date(),
        success: true
      });

      await user.save();

      // Send welcome email
      if (this.emailTransporter) {
        await this.sendWelcomeEmail(user);
      }

      logger.info('Email verified successfully', { userId: user._id, email: user.email });

      return {
        success: true,
        message: 'Email verified successfully'
      };

    } catch (error: any) {
      logger.error('Email verification failed:', error);
      return {
        success: false,
        message: 'Email verification failed'
      };
    }
  }

  async resendVerification(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const user = await User.findByEmail(email);
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      if (user.security.isEmailVerified) {
        return {
          success: false,
          message: 'Email is already verified'
        };
      }

      // Generate new verification token
      const verificationToken = user.generateEmailVerificationToken();
      await user.save();

      // Send verification email
      if (this.emailTransporter) {
        await this.sendVerificationEmail(user, verificationToken);
      }

      return {
        success: true,
        message: 'Verification email sent successfully'
      };

    } catch (error: any) {
      logger.error('Resend verification failed:', error);
      return {
        success: false,
        message: 'Failed to send verification email'
      };
    }
  }

  // ==================== PASSWORD MANAGEMENT ====================

  async requestPasswordReset(data: IPasswordResetRequest): Promise<{ success: boolean; message: string }> {
    try {
      const user = await User.findByEmail(data.email);
      if (!user) {
        // Don't reveal that email doesn't exist
        return {
          success: true,
          message: 'If an account with this email exists, a password reset link has been sent.'
        };
      }

      // Generate reset token
      const resetToken = user.generatePasswordResetToken();
      await user.save();

      // Send reset email
      if (this.emailTransporter) {
        await this.sendPasswordResetEmail(user, resetToken, data.redirectUrl);
      }

      // Log password reset request
      user.addActivity({
        action: AccountAction.PASSWORD_RESET,
        timestamp: new Date(),
        success: true,
        metadata: { type: 'request' }
      });
      await user.save();

      logger.info('Password reset requested', { userId: user._id, email: data.email });

      return {
        success: true,
        message: 'If an account with this email exists, a password reset link has been sent.'
      };

    } catch (error: any) {
      logger.error('Password reset request failed:', error);
      return {
        success: false,
        message: 'Failed to process password reset request'
      };
    }
  }

  async resetPassword(data: IPasswordUpdateRequest): Promise<{ success: boolean; message: string }> {
    try {
      if (!data.resetToken) {
        return {
          success: false,
          message: 'Reset token is required'
        };
      }

      const user = await User.findByPasswordResetToken(data.resetToken);
      if (!user) {
        return {
          success: false,
          message: 'Invalid or expired reset token'
        };
      }

      // Validate password
      const passwordValidation = this.validatePasswordStrength(data.newPassword);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          message: `Password validation failed: ${passwordValidation.errors.join(', ')}`
        };
      }

      // Update password
      user.security.passwordHash = data.newPassword; // Will be hashed by middleware
      user.security.passwordResetToken = undefined;
      user.security.passwordResetExpires = undefined;
      user.security.passwordChangedAt = new Date();

      // Revoke all existing sessions
      await Session.revokeAllByUserId(user._id.toString());

      // Log password change
      user.addActivity({
        action: AccountAction.PASSWORD_CHANGE,
        timestamp: new Date(),
        success: true,
        metadata: { type: 'reset' }
      });

      await user.save();

      logger.info('Password reset successfully', { userId: user._id });

      return {
        success: true,
        message: 'Password reset successfully'
      };

    } catch (error: any) {
      logger.error('Password reset failed:', error);
      return {
        success: false,
        message: 'Password reset failed'
      };
    }
  }

  async changePassword(userId: string, data: IPasswordUpdateRequest): Promise<{ success: boolean; message: string }> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      // Verify current password
      if (data.currentPassword) {
        const isCurrentPasswordValid = await user.comparePassword(data.currentPassword);
        if (!isCurrentPasswordValid) {
          return {
            success: false,
            message: 'Current password is incorrect'
          };
        }
      }

      // Validate new password
      const passwordValidation = this.validatePasswordStrength(data.newPassword);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          message: `Password validation failed: ${passwordValidation.errors.join(', ')}`
        };
      }

      // Update password
      user.security.passwordHash = data.newPassword; // Will be hashed by middleware
      user.security.passwordChangedAt = new Date();

      // Log password change
      user.addActivity({
        action: AccountAction.PASSWORD_CHANGE,
        timestamp: new Date(),
        success: true,
        metadata: { type: 'change' }
      });

      await user.save();

      logger.info('Password changed successfully', { userId });

      return {
        success: true,
        message: 'Password changed successfully'
      };

    } catch (error: any) {
      logger.error('Password change failed:', error);
      return {
        success: false,
        message: 'Password change failed'
      };
    }
  }

  // ==================== SESSION VALIDATION ====================

  async validateSession(sessionId: string): Promise<{ valid: boolean; user?: any; session?: any }> {
    try {
      // Check cache first
      if (this.redisClient) {
        const cachedSession = await this.redisClient.get(`session:${sessionId}`);
        if (cachedSession) {
          const sessionData = JSON.parse(cachedSession);
          if (sessionData.expiresAt > new Date().toISOString()) {
            return {
              valid: true,
              session: sessionData,
              user: await this.getCachedUser(sessionData.userId)
            };
          }
        }
      }

      const session = await Session.findBySessionId(sessionId);
      if (!session || !session.isValid()) {
        return { valid: false };
      }

      const user = await User.findById(session.userId);
      if (!user || user.status === UserStatus.SUSPENDED || user.status === UserStatus.DEACTIVATED) {
        return { valid: false };
      }

      // Update last accessed
      await session.updateLastAccessed();

      // Cache the session
      if (this.redisClient) {
        await this.cacheSession(session);
        await this.cacheUser(user);
      }

      return {
        valid: true,
        session: session.toJSON(),
        user: user.toJSON()
      };

    } catch (error: any) {
      logger.error('Session validation failed:', error);
      return { valid: false };
    }
  }

  // ==================== MULTI-FACTOR AUTHENTICATION ====================

  async setupMfa(userId: string, data: IMfaSetupRequest): Promise<{ success: boolean; secret?: string; qrCode?: string; backupCodes?: string[]; error?: string }> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      if (data.method === MfaMethod.TOTP) {
        // Generate TOTP secret
        const secret = speakeasy.generateSecret({
          name: `ShopSphere (${user.email})`,
          issuer: 'ShopSphere'
        });

        // Generate QR code
        const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

        // Generate backup codes
        const backupCodes = Array.from({ length: 8 }, () => 
          crypto.randomBytes(4).toString('hex').toUpperCase()
        );

        // Save MFA settings (but don't enable yet)
        user.security.mfaSettings = {
          method: MfaMethod.TOTP,
          isEnabled: false,
          secret: secret.base32,
          backupCodes,
          setupAt: new Date()
        };

        await user.save();

        return {
          success: true,
          secret: secret.base32,
          qrCode,
          backupCodes
        };
      }

      if (data.method === MfaMethod.SMS && data.phoneNumber) {
        // For SMS MFA, verify phone number first
        user.security.mfaSettings = {
          method: MfaMethod.SMS,
          isEnabled: false,
          phoneNumber: data.phoneNumber,
          setupAt: new Date()
        };

        await user.save();

        // In a real implementation, send SMS verification code here
        
        return {
          success: true
        };
      }

      return {
        success: false,
        error: 'Unsupported MFA method'
      };

    } catch (error: any) {
      logger.error('MFA setup failed:', error);
      return {
        success: false,
        error: 'MFA setup failed'
      };
    }
  }

  async verifyMfaSetup(userId: string, data: IMfaVerifyRequest): Promise<{ success: boolean; message: string }> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      const isValid = await this.verifyMfaToken(user, data.token, data.backupCode);
      if (!isValid) {
        return {
          success: false,
          message: 'Invalid verification code'
        };
      }

      // Enable MFA
      user.security.mfaSettings.isEnabled = true;
      user.profile.preferences.twoFactorAuth = user.security.mfaSettings;

      // Log MFA enablement
      user.addActivity({
        action: AccountAction.MFA_ENABLE,
        timestamp: new Date(),
        success: true,
        metadata: { method: user.security.mfaSettings.method }
      });

      await user.save();

      logger.info('MFA enabled successfully', { userId, method: user.security.mfaSettings.method });

      return {
        success: true,
        message: 'Multi-factor authentication enabled successfully'
      };

    } catch (error: any) {
      logger.error('MFA verification failed:', error);
      return {
        success: false,
        message: 'MFA verification failed'
      };
    }
  }

  async disableMfa(userId: string, data: IMfaVerifyRequest): Promise<{ success: boolean; message: string }> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      if (!user.security.mfaSettings.isEnabled) {
        return {
          success: false,
          message: 'MFA is not enabled'
        };
      }

      // Verify current MFA token
      const isValid = await this.verifyMfaToken(user, data.token, data.backupCode);
      if (!isValid) {
        return {
          success: false,
          message: 'Invalid verification code'
        };
      }

      // Disable MFA
      user.security.mfaSettings = {
        method: MfaMethod.NONE,
        isEnabled: false
      };
      user.profile.preferences.twoFactorAuth = user.security.mfaSettings;

      // Log MFA disablement
      user.addActivity({
        action: AccountAction.MFA_DISABLE,
        timestamp: new Date(),
        success: true
      });

      await user.save();

      logger.info('MFA disabled successfully', { userId });

      return {
        success: true,
        message: 'Multi-factor authentication disabled successfully'
      };

    } catch (error: any) {
      logger.error('MFA disable failed:', error);
      return {
        success: false,
        message: 'Failed to disable MFA'
      };
    }
  }

  // ==================== UTILITY METHODS ====================

  private validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private async verifyMfaToken(user: any, token: string, backupCode?: string): Promise<boolean> {
    if (user.security.mfaSettings.method === MfaMethod.TOTP) {
      if (backupCode) {
        // Check backup codes
        const backupCodes = user.security.mfaSettings.backupCodes || [];
        const isBackupCodeValid = backupCodes.includes(backupCode.toUpperCase());
        if (isBackupCodeValid) {
          // Remove used backup code
          user.security.mfaSettings.backupCodes = backupCodes.filter(code => code !== backupCode.toUpperCase());
          await user.save();
          return true;
        }
      }

      // Verify TOTP token
      return speakeasy.totp.verify({
        secret: user.security.mfaSettings.secret,
        encoding: 'base32',
        token,
        window: 2 // Allow 2 time steps (60 seconds) tolerance
      });
    }

    if (user.security.mfaSettings.method === MfaMethod.SMS) {
      // In a real implementation, verify SMS code from cache/database
      // For now, return true for demonstration
      return true;
    }

    return false;
  }

  private parseDeviceInfo(userAgent: string): any {
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    let deviceType = 'unknown';
    if (result.device.type === 'mobile') deviceType = 'mobile';
    else if (result.device.type === 'tablet') deviceType = 'tablet';
    else if (result.os.name) deviceType = 'desktop';

    return {
      type: deviceType,
      browser: result.browser.name || 'unknown',
      os: result.os.name || 'unknown',
      userAgent
    };
  }

  private getLocationFromIP(ipAddress: string): any {
    try {
      const geo = geoip.lookup(ipAddress);
      if (geo) {
        return {
          country: geo.country,
          region: geo.region,
          city: geo.city,
          coordinates: [geo.ll[1], geo.ll[0]] // [longitude, latitude]
        };
      }
    } catch (error) {
      logger.warn('Failed to get location from IP:', error);
    }
    return {};
  }

  private async processReferralReward(referralCode: string, newUserId: string): Promise<void> {
    try {
      const referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
      if (referrer) {
        // Award loyalty points to referrer
        referrer.loyaltyPoints = (referrer.loyaltyPoints || 0) + 100;
        
        // Log referral activity
        referrer.addActivity({
          action: AccountAction.REGISTER,
          timestamp: new Date(),
          success: true,
          metadata: {
            type: 'referral_reward',
            referredUser: newUserId,
            pointsAwarded: 100
          }
        });

        await referrer.save();
        logger.info('Referral reward processed', { referrerId: referrer._id, newUserId });
      }
    } catch (error) {
      logger.error('Failed to process referral reward:', error);
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
    } catch (error) {
      logger.warn('Failed to cache user:', error);
    }
  }

  private async getCachedUser(userId: string): Promise<any> {
    if (!this.redisClient) return null;
    
    try {
      const cached = await this.redisClient.get(`user:${userId}`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      logger.warn('Failed to get cached user:', error);
      return null;
    }
  }

  private async cacheSession(session: any): Promise<void> {
    if (!this.redisClient) return;
    
    try {
      const cacheKey = `session:${session.sessionId}`;
      await this.redisClient.setEx(cacheKey, 3600, JSON.stringify(session)); // 1 hour
    } catch (error) {
      logger.warn('Failed to cache session:', error);
    }
  }

  // ==================== EMAIL METHODS ====================

  private async sendVerificationEmail(user: any, token: string): Promise<void> {
    if (!this.emailTransporter) return;

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    
    try {
      await this.emailTransporter.sendMail({
        from: process.env.FROM_EMAIL || 'noreply@shopsphere.com',
        to: user.email,
        subject: 'Verify Your Email Address',
        html: `
          <h1>Welcome to ShopSphere!</h1>
          <p>Hello ${user.profile.firstName},</p>
          <p>Thank you for registering with ShopSphere. Please click the link below to verify your email address:</p>
          <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
          <p>If you didn't create an account with ShopSphere, please ignore this email.</p>
          <p>This link will expire in 24 hours.</p>
          <p>Best regards,<br>The ShopSphere Team</p>
        `
      });
    } catch (error) {
      logger.error('Failed to send verification email:', error);
    }
  }

  private async sendWelcomeEmail(user: any): Promise<void> {
    if (!this.emailTransporter) return;

    try {
      await this.emailTransporter.sendMail({
        from: process.env.FROM_EMAIL || 'noreply@shopsphere.com',
        to: user.email,
        subject: 'Welcome to ShopSphere!',
        html: `
          <h1>Welcome to ShopSphere!</h1>
          <p>Hello ${user.profile.firstName},</p>
          <p>Your email has been verified successfully. Welcome to the ShopSphere community!</p>
          <p>You can now start shopping and enjoying all the features we have to offer.</p>
          <a href="${process.env.FRONTEND_URL}/dashboard" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to Dashboard</a>
          <p>If you have any questions, feel free to contact our support team.</p>
          <p>Happy shopping!<br>The ShopSphere Team</p>
        `
      });
    } catch (error) {
      logger.error('Failed to send welcome email:', error);
    }
  }

  private async sendPasswordResetEmail(user: any, token: string, redirectUrl?: string): Promise<void> {
    if (!this.emailTransporter) return;

    const resetUrl = redirectUrl 
      ? `${redirectUrl}?token=${token}`
      : `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    try {
      await this.emailTransporter.sendMail({
        from: process.env.FROM_EMAIL || 'noreply@shopsphere.com',
        to: user.email,
        subject: 'Reset Your Password',
        html: `
          <h1>Password Reset Request</h1>
          <p>Hello ${user.profile.firstName},</p>
          <p>You requested a password reset for your ShopSphere account. Click the link below to reset your password:</p>
          <a href="${resetUrl}" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
          <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
          <p>This link will expire in 30 minutes.</p>
          <p>Best regards,<br>The ShopSphere Team</p>
        `
      });
    } catch (error) {
      logger.error('Failed to send password reset email:', error);
    }
  }
}

export default AuthService;
