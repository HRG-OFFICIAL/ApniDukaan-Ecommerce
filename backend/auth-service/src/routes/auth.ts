import express from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult, query } from 'express-validator';
import { UserModel } from '../models/User';
import { jwtService, generateTokens } from '../../shared/src/utils/jwt';
import { logger } from '../../shared/src/utils/logger';
import { authenticate, optionalAuthenticate, authRateLimit, handleRefreshToken } from '../../shared/src/middleware/auth';
import { googleAuthService, passport, isGoogleAuthAvailable } from '../services/googleAuth';
import { UserRole } from '../../shared/src/types/user';
import { initializeDefaultRoles, getRoleByName } from '../models/Role';
import { initializeSystemPermissions } from '../models/Permission';

const router = express.Router();

// Validation rules
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('terms')
    .equals('true')
    .withMessage('You must accept the terms and conditions')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
];

const resetPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character')
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, one number, and one special character')
];

// Initialize roles and permissions on startup
router.use(async (req, res, next) => {
  if (!router.initialized) {
    try {
      await initializeDefaultRoles();
      await initializeSystemPermissions();
      router.initialized = true;
      logger.info('Authentication service initialized');
    } catch (error) {
      logger.error('Error initializing auth service:', error);
    }
  }
  next();
});

/**
 * @route POST /auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', 
  authRateLimit(15 * 60 * 1000, 5), // 5 attempts per 15 minutes
  registerValidation,
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { email, password, firstName, lastName } = req.body;

      // Check if user already exists
      const existingUser = await UserModel.findOne({ email });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'User already exists with this email address',
          code: 'USER_EXISTS'
        });
      }

      // Hash password
      const saltRounds = process.env.BCRYPT_ROUNDS ? parseInt(process.env.BCRYPT_ROUNDS) : 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user
      const user = new UserModel({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: UserRole.USER,
        preferences: {
          currency: 'USD',
          language: 'en',
          notifications: {
            email: true,
            push: false,
            sms: false
          },
          privacy: {
            showProfile: false,
            showActivity: false
          }
        },
        metadata: {
          registrationSource: 'direct',
          userAgent: req.get('User-Agent') || '',
          ipAddress: req.ip || ''
        }
      });

      await user.save();

      // Generate tokens
      const tokens = generateTokens(user);

      // Set secure cookies
      const isProduction = process.env.NODE_ENV === 'production';
      res.cookie('accessToken', tokens.accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'strict' : 'lax',
        maxAge: 15 * 60 * 1000 // 15 minutes
      });

      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'strict' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      logger.info('User registered successfully', { 
        userId: user._id, 
        email: user.email 
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            emailVerified: user.emailVerified
          },
          tokens
        }
      });

    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({
        success: false,
        error: 'Registration failed',
        code: 'REGISTRATION_ERROR'
      });
    }
  }
);

/**
 * @route POST /auth/login
 * @desc Authenticate user and get tokens
 * @access Public
 */
router.post('/login',
  authRateLimit(15 * 60 * 1000, 10), // 10 attempts per 15 minutes
  loginValidation,
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { email, password } = req.body;

      // Find user
      const user = await UserModel.findOne({ email }).select('+password');
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Check if user is active
      if (!user.active) {
        return res.status(401).json({
          success: false,
          error: 'Account is deactivated',
          code: 'ACCOUNT_DEACTIVATED'
        });
      }

      // Check if user is banned
      if (user.status === 'banned') {
        return res.status(401).json({
          success: false,
          error: 'Account is banned',
          code: 'ACCOUNT_BANNED'
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        // Increment failed login attempts
        user.security.failedLoginAttempts += 1;
        user.security.lastFailedLogin = new Date();

        // Lock account if too many failed attempts
        if (user.security.failedLoginAttempts >= 5) {
          user.security.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
          await user.save();

          return res.status(423).json({
            success: false,
            error: 'Account locked due to too many failed attempts',
            code: 'ACCOUNT_LOCKED'
          });
        }

        await user.save();

        return res.status(401).json({
          success: false,
          error: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Check if account is locked
      if (user.security.lockUntil && user.security.lockUntil > new Date()) {
        return res.status(423).json({
          success: false,
          error: 'Account is temporarily locked',
          code: 'ACCOUNT_LOCKED'
        });
      }

      // Reset failed login attempts on successful login
      user.security.failedLoginAttempts = 0;
      user.security.lastFailedLogin = null;
      user.security.lockUntil = null;
      user.security.lastLogin = new Date();
      
      // Update login metadata
      user.metadata.lastLoginIP = req.ip || '';
      user.metadata.lastUserAgent = req.get('User-Agent') || '';

      await user.save();

      // Generate tokens
      const tokens = generateTokens(user);

      // Set secure cookies
      const isProduction = process.env.NODE_ENV === 'production';
      res.cookie('accessToken', tokens.accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'strict' : 'lax',
        maxAge: 15 * 60 * 1000 // 15 minutes
      });

      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'strict' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      logger.info('User logged in successfully', { 
        userId: user._id, 
        email: user.email 
      });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            emailVerified: user.emailVerified,
            avatar: user.avatar
          },
          tokens
        }
      });

    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Login failed',
        code: 'LOGIN_ERROR'
      });
    }
  }
);

/**
 * @route POST /auth/logout
 * @desc Logout user and invalidate tokens
 * @access Private
 */
router.post('/logout', authenticate, async (req, res) => {
  try {
    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    // In a real application, you might want to blacklist the tokens
    // For now, we'll just clear the cookies

    logger.info('User logged out', { userId: req.userId });

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed',
      code: 'LOGOUT_ERROR'
    });
  }
});

/**
 * @route POST /auth/refresh
 * @desc Refresh access token using refresh token
 * @access Public
 */
router.post('/refresh', handleRefreshToken, async (req, res) => {
  try {
    const { refreshTokenPayload } = req.body;

    // Find user and verify token version
    const user = await UserModel.findById(refreshTokenPayload.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    if (user.tokenVersion !== refreshTokenPayload.tokenVersion) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token expired',
        code: 'TOKEN_VERSION_MISMATCH'
      });
    }

    // Generate new tokens
    const tokens = generateTokens(user);

    // Set secure cookies
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.json({
      success: true,
      message: 'Tokens refreshed successfully',
      data: {
        accessToken: tokens.accessToken
      }
    });

  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      error: 'Token refresh failed',
      code: 'REFRESH_ERROR'
    });
  }
});

/**
 * @route POST /auth/forgot-password
 * @desc Send password reset email
 * @access Public
 */
router.post('/forgot-password',
  authRateLimit(60 * 60 * 1000, 3), // 3 attempts per hour
  forgotPasswordValidation,
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { email } = req.body;

      // Find user
      const user = await UserModel.findOne({ email });
      
      // Always return success to prevent email enumeration
      res.json({
        success: true,
        message: 'If an account with that email exists, we have sent a password reset link'
      });

      if (!user) {
        logger.warn('Password reset requested for non-existent email', { email });
        return;
      }

      // Generate reset token
      const resetToken = jwtService.generatePasswordResetToken(user._id, user.password);

      // In a real application, you would send an email here
      // For now, we'll just log the token (DO NOT DO THIS IN PRODUCTION)
      logger.info('Password reset token generated', { 
        userId: user._id, 
        email: user.email,
        resetToken: process.env.NODE_ENV !== 'production' ? resetToken : '[REDACTED]'
      });

      // TODO: Integrate with email service
      // await emailService.sendPasswordReset(user.email, resetToken);

    } catch (error) {
      logger.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        error: 'Password reset request failed',
        code: 'FORGOT_PASSWORD_ERROR'
      });
    }
  }
);

/**
 * @route POST /auth/reset-password
 * @desc Reset password using token
 * @access Public
 */
router.post('/reset-password',
  authRateLimit(60 * 60 * 1000, 5), // 5 attempts per hour
  resetPasswordValidation,
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { token, password } = req.body;

      // Verify reset token
      let decoded;
      try {
        decoded = jwtService.verifyPasswordResetToken(token);
      } catch (error) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired reset token',
          code: 'INVALID_RESET_TOKEN'
        });
      }

      // Find user
      const user = await UserModel.findById(decoded.userId).select('+password');
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid reset token',
          code: 'INVALID_RESET_TOKEN'
        });
      }

      // Verify token is still valid (password hasn't changed)
      const passwordHash = require('crypto').createHash('sha256').update(user.password).digest('hex').substring(0, 8);
      if (decoded.passwordHash !== passwordHash) {
        return res.status(401).json({
          success: false,
          error: 'Reset token has been invalidated',
          code: 'TOKEN_INVALIDATED'
        });
      }

      // Hash new password
      const saltRounds = process.env.BCRYPT_ROUNDS ? parseInt(process.env.BCRYPT_ROUNDS) : 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Update user password and increment token version
      user.password = hashedPassword;
      user.tokenVersion += 1;
      user.security.passwordChangedAt = new Date();

      await user.save();

      logger.info('Password reset successfully', { userId: user._id });

      res.json({
        success: true,
        message: 'Password reset successfully'
      });

    } catch (error) {
      logger.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        error: 'Password reset failed',
        code: 'RESET_PASSWORD_ERROR'
      });
    }
  }
);

/**
 * @route POST /auth/change-password
 * @desc Change user password
 * @access Private
 */
router.post('/change-password',
  authenticate,
  changePasswordValidation,
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { currentPassword, newPassword } = req.body;

      // Find user with password
      const user = await UserModel.findById(req.userId).select('+password');
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(401).json({
          success: false,
          error: 'Current password is incorrect',
          code: 'INVALID_CURRENT_PASSWORD'
        });
      }

      // Check if new password is different from current
      const isSamePassword = await bcrypt.compare(newPassword, user.password);
      if (isSamePassword) {
        return res.status(400).json({
          success: false,
          error: 'New password must be different from current password',
          code: 'SAME_PASSWORD'
        });
      }

      // Hash new password
      const saltRounds = process.env.BCRYPT_ROUNDS ? parseInt(process.env.BCRYPT_ROUNDS) : 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update user password and increment token version
      user.password = hashedPassword;
      user.tokenVersion += 1;
      user.security.passwordChangedAt = new Date();

      await user.save();

      logger.info('Password changed successfully', { userId: user._id });

      res.json({
        success: true,
        message: 'Password changed successfully'
      });

    } catch (error) {
      logger.error('Change password error:', error);
      res.status(500).json({
        success: false,
        error: 'Password change failed',
        code: 'CHANGE_PASSWORD_ERROR'
      });
    }
  }
);

/**
 * @route GET /auth/me
 * @desc Get current user profile
 * @access Private
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await UserModel.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          emailVerified: user.emailVerified,
          avatar: user.avatar,
          preferences: user.preferences,
          createdAt: user.createdAt
        }
      }
    });

  } catch (error) {
    logger.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user profile',
      code: 'GET_PROFILE_ERROR'
    });
  }
});

// Google OAuth routes (only if configured)
if (isGoogleAuthAvailable()) {
  /**
   * @route GET /auth/google
   * @desc Redirect to Google OAuth
   * @access Public
   */
  router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
  }));

  /**
   * @route GET /auth/google/callback
   * @desc Google OAuth callback
   * @access Public
   */
  router.get('/google/callback', 
    passport.authenticate('google', { failureRedirect: '/auth/login?error=oauth_failed' }),
    async (req, res) => {
      try {
        await googleAuthService.handleCallback(req.user, req, res, () => {});
      } catch (error) {
        logger.error('Google OAuth callback error:', error);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendUrl}/auth/callback?error=authentication_failed`);
      }
    }
  );

  /**
   * @route POST /auth/google/revoke
   * @desc Revoke Google OAuth access
   * @access Private
   */
  router.post('/google/revoke', authenticate, async (req, res) => {
    try {
      const user = await UserModel.findById(req.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      await googleAuthService.revokeGoogleAccess(user);

      res.json({
        success: true,
        message: 'Google access revoked successfully'
      });

    } catch (error) {
      logger.error('Google OAuth revoke error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to revoke Google access',
        code: 'GOOGLE_REVOKE_ERROR'
      });
    }
  });
}

/**
 * @route GET /auth/status
 * @desc Check authentication status
 * @access Public
 */
router.get('/status', optionalAuthenticate, (req, res) => {
  res.json({
    success: true,
    data: {
      authenticated: !!req.user,
      user: req.user ? {
        id: req.user.userId,
        email: req.user.email,
        role: req.user.role
      } : null,
      features: {
        googleOAuth: isGoogleAuthAvailable()
      }
    }
  });
});

export default router;
