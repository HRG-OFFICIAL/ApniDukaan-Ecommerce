import { User, IUserDocument } from '../models/User';
import { jwtService, logger, ValidationError, AuthenticationError, ConflictError } from '@shopsphere/shared';
import { emailService } from './emailService';
import crypto from 'crypto';

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResult {
  user: IUserDocument;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshResult {
  accessToken: string;
  refreshToken: string;
}

class AuthService {
  async register(data: RegisterData): Promise<AuthResult> {
    const { email, password, firstName, lastName } = data;

    // Validate input
    if (!email || !password || !firstName || !lastName) {
      throw new ValidationError('All fields are required');
    }

    if (password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters long');
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    try {
      // Create new user
      const user = new User({
        email: email.toLowerCase(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        isEmailVerified: false
      });

      await user.save();

      // Generate email verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      user.emailVerificationToken = verificationToken;
      user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      await user.save();

      // Send verification email
      await emailService.sendVerificationEmail(user.email, user.firstName, verificationToken);

      // Generate JWT tokens
      const tokens = jwtService.generateTokenPair(user);

      logger.info('User registered successfully', {
        userId: user._id,
        email: user.email,
        action: 'register'
      });

      return {
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      };
    } catch (error) {
      logger.error('Registration failed', {
        email,
        error: error.message,
        action: 'register'
      });
      throw error;
    }
  }

  async login(data: LoginData): Promise<AuthResult> {
    const { email, password } = data;

    if (!email || !password) {
      throw new ValidationError('Email and password are required');
    }

    try {
      // Find user by email
      const user = await User.findByEmail(email);
      if (!user) {
        throw new AuthenticationError('Invalid email or password');
      }

      // Check if account is locked
      if (user.isLocked) {
        throw new AuthenticationError('Account is temporarily locked due to too many failed login attempts');
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        // Increment login attempts
        await user.incLoginAttempts();
        throw new AuthenticationError('Invalid email or password');
      }

      // Reset login attempts on successful login
      if (user.loginAttempts > 0) {
        await user.resetLoginAttempts();
      }

      // Update last login
      await user.updateLastLogin();

      // Generate JWT tokens
      const tokens = jwtService.generateTokenPair(user);

      logger.info('User logged in successfully', {
        userId: user._id,
        email: user.email,
        action: 'login'
      });

      return {
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      };
    } catch (error) {
      logger.error('Login failed', {
        email,
        error: error.message,
        action: 'login'
      });
      throw error;
    }
  }

  async refreshToken(refreshToken: string): Promise<RefreshResult> {
    if (!refreshToken) {
      throw new ValidationError('Refresh token is required');
    }

    try {
      // Verify refresh token
      const payload = jwtService.verifyRefreshToken(refreshToken);
      
      // Find user and check token version
      const user = await User.findById(payload.userId);
      if (!user || user.tokenVersion !== payload.tokenVersion) {
        throw new AuthenticationError('Invalid refresh token');
      }

      // Generate new token pair
      const tokens = jwtService.generateTokenPair(user);

      logger.info('Token refreshed successfully', {
        userId: user._id,
        action: 'refresh_token'
      });

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      };
    } catch (error) {
      logger.error('Token refresh failed', {
        error: error.message,
        action: 'refresh_token'
      });
      throw new AuthenticationError('Invalid refresh token');
    }
  }

  async logout(userId: string): Promise<boolean> {
    try {
      // Increment token version to invalidate current refresh tokens
      const user = await User.findById(userId);
      if (user) {
        await user.incrementTokenVersion();
        
        logger.info('User logged out successfully', {
          userId,
          action: 'logout'
        });
      }

      return true;
    } catch (error) {
      logger.error('Logout failed', {
        userId,
        error: error.message,
        action: 'logout'
      });
      throw error;
    }
  }

  async logoutAll(userId: string): Promise<boolean> {
    try {
      // Increment token version to invalidate all refresh tokens
      const user = await User.findById(userId);
      if (user) {
        await user.incrementTokenVersion();
        
        logger.info('User logged out from all devices', {
          userId,
          action: 'logout_all'
        });
      }

      return true;
    } catch (error) {
      logger.error('Logout all failed', {
        userId,
        error: error.message,
        action: 'logout_all'
      });
      throw error;
    }
  }

  async forgotPassword(email: string): Promise<boolean> {
    if (!email) {
      throw new ValidationError('Email is required');
    }

    try {
      const user = await User.findByEmail(email);
      if (!user) {
        // Don't reveal if user exists or not
        return true;
      }

      // Generate password reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      user.passwordResetToken = resetToken;
      user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await user.save();

      // Send password reset email
      await emailService.sendPasswordResetEmail(user.email, user.firstName, resetToken);

      logger.info('Password reset email sent', {
        userId: user._id,
        email: user.email,
        action: 'forgot_password'
      });

      return true;
    } catch (error) {
      logger.error('Forgot password failed', {
        email,
        error: error.message,
        action: 'forgot_password'
      });
      throw error;
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    if (!token || !newPassword) {
      throw new ValidationError('Token and new password are required');
    }

    if (newPassword.length < 8) {
      throw new ValidationError('Password must be at least 8 characters long');
    }

    try {
      const user = await User.findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: new Date() }
      });

      if (!user) {
        throw new AuthenticationError('Invalid or expired reset token');
      }

      // Update password and clear reset token
      user.password = newPassword;
      user.passwordResetToken = null;
      user.passwordResetExpires = null;
      
      // Increment token version to invalidate all existing tokens
      user.tokenVersion += 1;
      
      await user.save();

      logger.info('Password reset successfully', {
        userId: user._id,
        action: 'reset_password'
      });

      return true;
    } catch (error) {
      logger.error('Password reset failed', {
        error: error.message,
        action: 'reset_password'
      });
      throw error;
    }
  }

  async verifyEmail(token: string): Promise<boolean> {
    if (!token) {
      throw new ValidationError('Verification token is required');
    }

    try {
      const user = await User.findOne({
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: new Date() }
      });

      if (!user) {
        throw new AuthenticationError('Invalid or expired verification token');
      }

      // Mark email as verified and clear verification token
      user.isEmailVerified = true;
      user.emailVerificationToken = null;
      user.emailVerificationExpires = null;
      await user.save();

      logger.info('Email verified successfully', {
        userId: user._id,
        email: user.email,
        action: 'verify_email'
      });

      return true;
    } catch (error) {
      logger.error('Email verification failed', {
        error: error.message,
        action: 'verify_email'
      });
      throw error;
    }
  }

  async resendVerificationEmail(userId: string): Promise<boolean> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new AuthenticationError('User not found');
      }

      if (user.isEmailVerified) {
        throw new ValidationError('Email is already verified');
      }

      // Generate new verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      user.emailVerificationToken = verificationToken;
      user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      await user.save();

      // Send verification email
      await emailService.sendVerificationEmail(user.email, user.firstName, verificationToken);

      logger.info('Verification email resent', {
        userId: user._id,
        email: user.email,
        action: 'resend_verification'
      });

      return true;
    } catch (error) {
      logger.error('Resend verification email failed', {
        userId,
        error: error.message,
        action: 'resend_verification'
      });
      throw error;
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    if (!currentPassword || !newPassword) {
      throw new ValidationError('Current password and new password are required');
    }

    if (newPassword.length < 8) {
      throw new ValidationError('New password must be at least 8 characters long');
    }

    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new AuthenticationError('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        throw new AuthenticationError('Current password is incorrect');
      }

      // Update password and increment token version
      user.password = newPassword;
      user.tokenVersion += 1;
      await user.save();

      logger.info('Password changed successfully', {
        userId: user._id,
        action: 'change_password'
      });

      return true;
    } catch (error) {
      logger.error('Change password failed', {
        userId,
        error: error.message,
        action: 'change_password'
      });
      throw error;
    }
  }
}

export const authService = new AuthService();
