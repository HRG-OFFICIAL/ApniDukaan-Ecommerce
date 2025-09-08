import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import multer from 'multer';
import rateLimit from 'express-rate-limit';

import AuthService from '../services/AuthService';
import UserService from '../services/UserService';
import RoleService from '../services/RoleService';
import SocialAuthService from '../services/SocialAuthService';

import {
  IRegisterRequest,
  ILoginRequest,
  IPasswordResetRequest,
  IPasswordUpdateRequest,
  IProfileUpdateRequest,
  IAddressRequest,
  IMfaSetupRequest,
  IMfaVerifyRequest,
  ISocialAuthRequest,
  AuthProvider,
  UserStatus,
  UserRole,
  AddressType,
  MfaMethod
} from '../types/user.types';

import { logger } from '../utils/logger';

const router = express.Router();

// Initialize services
const authService = new AuthService();
const userService = new UserService();
const roleService = new RoleService();
const socialAuthService = new SocialAuthService();

// Configure file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
    }
  }
});

// Rate limiting configurations
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs for auth endpoints
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs for general endpoints
  message: {
    success: false,
    error: 'Too many requests, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});

// Authentication middleware
const authenticate = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    const sessionId = req.headers['x-session-id'] as string;

    if (!authHeader || !sessionId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const sessionValidation = await authService.validateSession(sessionId);

    if (!sessionValidation.valid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid session',
        code: 'INVALID_SESSION'
      });
    }

    req.user = sessionValidation.user;
    req.session = sessionValidation.session;
    next();
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication error',
      code: 'AUTHENTICATION_ERROR'
    });
  }
};

// Authorization middleware
const authorize = (permissions: string[] = [], roles: string[] = []) => {
  return async (req: any, res: any, next: any) => {
    try {
      const user = req.user;
      
      // Check roles
      if (roles.length > 0) {
        const hasRole = roles.some(role => user.roles.includes(role.toLowerCase()));
        if (!hasRole) {
          return res.status(403).json({
            success: false,
            error: 'Insufficient permissions',
            code: 'ACCESS_DENIED'
          });
        }
      }

      // Check permissions
      if (permissions.length > 0) {
        for (const permission of permissions) {
          const hasPermission = await roleService.hasPermission(user.id, permission);
          if (!hasPermission) {
            return res.status(403).json({
              success: false,
              error: 'Insufficient permissions',
              code: 'ACCESS_DENIED'
            });
          }
        }
      }

      next();
    } catch (error) {
      logger.error('Authorization middleware error:', error);
      res.status(500).json({
        success: false,
        error: 'Authorization error',
        code: 'AUTHORIZATION_ERROR'
      });
    }
  };
};

// ==================== AUTHENTICATION ENDPOINTS ====================

/**
 * @route POST /api/users/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('firstName').trim().isLength({ min: 1 }).withMessage('First name is required'),
    body('lastName').trim().isLength({ min: 1 }).withMessage('Last name is required'),
    body('acceptTerms').equals('true').withMessage('You must accept the terms and conditions'),
    body('username').optional().isAlphanumeric().isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 alphanumeric characters')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const userData: IRegisterRequest = {
        email: req.body.email,
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        username: req.body.username,
        phone: req.body.phone,
        dateOfBirth: req.body.dateOfBirth,
        acceptTerms: req.body.acceptTerms === 'true',
        acceptMarketing: req.body.acceptMarketing === 'true',
        referralCode: req.body.referralCode,
        metadata: req.body.metadata
      };

      const result = await authService.register(userData);
      
      const statusCode = result.success ? 201 : 400;
      res.status(statusCode).json({
        ...result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({
        success: false,
        error: 'Registration failed',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * @route POST /api/users/login
 * @desc Login user
 * @access Public
 */
router.post('/login',
  authLimiter,
  [
    body('password').notEmpty().withMessage('Password is required'),
    body().custom((value) => {
      if (!value.email && !value.username) {
        throw new Error('Email or username is required');
      }
      return true;
    })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const credentials: ILoginRequest = {
        email: req.body.email,
        username: req.body.username,
        password: req.body.password,
        rememberMe: req.body.rememberMe === 'true',
        mfaToken: req.body.mfaToken,
        deviceInfo: req.body.deviceInfo
      };

      const result = await authService.login(credentials, req);
      
      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json({
        ...result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Login failed',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * @route POST /api/users/logout
 * @desc Logout user
 * @access Private
 */
router.post('/logout',
  authenticate,
  async (req: any, res) => {
    try {
      const result = await authService.logout(req.session.sessionId);
      res.json({
        ...result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({
        success: false,
        error: 'Logout failed',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * @route POST /api/users/refresh-token
 * @desc Refresh access token
 * @access Public
 */
router.post('/refresh-token',
  [
    body('refreshToken').notEmpty().withMessage('Refresh token is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const result = await authService.refreshToken(req.body.refreshToken);
      
      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json({
        ...result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Token refresh error:', error);
      res.status(500).json({
        success: false,
        error: 'Token refresh failed',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

// ==================== EMAIL VERIFICATION ====================

/**
 * @route POST /api/users/verify-email
 * @desc Verify email address
 * @access Public
 */
router.post('/verify-email',
  [
    body('token').notEmpty().withMessage('Verification token is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const result = await authService.verifyEmail(req.body.token);
      
      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json({
        ...result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Email verification error:', error);
      res.status(500).json({
        success: false,
        error: 'Email verification failed',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * @route POST /api/users/resend-verification
 * @desc Resend email verification
 * @access Public
 */
router.post('/resend-verification',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const result = await authService.resendVerification(req.body.email);
      res.json({
        ...result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Resend verification error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to resend verification',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

// ==================== PASSWORD MANAGEMENT ====================

/**
 * @route POST /api/users/forgot-password
 * @desc Request password reset
 * @access Public
 */
router.post('/forgot-password',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const data: IPasswordResetRequest = {
        email: req.body.email,
        redirectUrl: req.body.redirectUrl
      };

      const result = await authService.requestPasswordReset(data);
      res.json({
        ...result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Password reset request error:', error);
      res.status(500).json({
        success: false,
        error: 'Password reset request failed',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * @route POST /api/users/reset-password
 * @desc Reset password with token
 * @access Public
 */
router.post('/reset-password',
  authLimiter,
  [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('confirmPassword').custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const data: IPasswordUpdateRequest = {
        resetToken: req.body.token,
        newPassword: req.body.newPassword,
        confirmPassword: req.body.confirmPassword
      };

      const result = await authService.resetPassword(data);
      
      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json({
        ...result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Password reset error:', error);
      res.status(500).json({
        success: false,
        error: 'Password reset failed',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * @route PUT /api/users/change-password
 * @desc Change password (authenticated user)
 * @access Private
 */
router.put('/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
    body('confirmPassword').custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
  ],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const data: IPasswordUpdateRequest = {
        currentPassword: req.body.currentPassword,
        newPassword: req.body.newPassword,
        confirmPassword: req.body.confirmPassword
      };

      const result = await authService.changePassword(req.user.id, data);
      
      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json({
        ...result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Password change error:', error);
      res.status(500).json({
        success: false,
        error: 'Password change failed',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

// ==================== USER PROFILE ENDPOINTS ====================

/**
 * @route GET /api/users/profile
 * @desc Get current user profile
 * @access Private
 */
router.get('/profile',
  authenticate,
  async (req: any, res) => {
    try {
      const result = await userService.getUserById(req.user.id);
      
      if (!result.success) {
        return res.status(404).json({
          ...result,
          timestamp: new Date().toISOString()
        });
      }

      res.json({
        success: true,
        data: { user: result.user },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get profile',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * @route PUT /api/users/profile
 * @desc Update user profile
 * @access Private
 */
router.put('/profile',
  authenticate,
  generalLimiter,
  [
    body('firstName').optional().trim().isLength({ min: 1, max: 50 }).withMessage('First name must be 1-50 characters'),
    body('lastName').optional().trim().isLength({ min: 1, max: 50 }).withMessage('Last name must be 1-50 characters'),
    body('displayName').optional().trim().isLength({ max: 100 }).withMessage('Display name must be less than 100 characters'),
    body('bio').optional().isLength({ max: 500 }).withMessage('Bio must be less than 500 characters'),
    body('website').optional().isURL().withMessage('Valid website URL is required'),
    body('dateOfBirth').optional().isISO8601().toDate().withMessage('Valid date of birth is required')
  ],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const profileData: IProfileUpdateRequest = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        displayName: req.body.displayName,
        bio: req.body.bio,
        dateOfBirth: req.body.dateOfBirth,
        gender: req.body.gender,
        phone: req.body.phone,
        website: req.body.website,
        socialLinks: req.body.socialLinks,
        preferences: req.body.preferences
      };

      const result = await userService.updateProfile(req.user.id, profileData);
      
      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json({
        ...result,
        data: result.user ? { user: result.user } : undefined,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Profile update error:', error);
      res.status(500).json({
        success: false,
        error: 'Profile update failed',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * @route POST /api/users/profile/avatar
 * @desc Upload user avatar
 * @access Private
 */
router.post('/profile/avatar',
  authenticate,
  upload.single('avatar'),
  async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'Avatar image is required',
          code: 'FILE_REQUIRED'
        });
      }

      const result = await userService.uploadAvatar(req.user.id, req.file);
      
      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json({
        ...result,
        data: result.avatar ? { avatar: result.avatar } : undefined,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Avatar upload error:', error);
      res.status(500).json({
        success: false,
        error: 'Avatar upload failed',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

// ==================== ADDRESS MANAGEMENT ====================

/**
 * @route POST /api/users/addresses
 * @desc Add user address
 * @access Private
 */
router.post('/addresses',
  authenticate,
  [
    body('type').isIn(Object.values(AddressType)).withMessage('Valid address type is required'),
    body('firstName').trim().isLength({ min: 1, max: 50 }).withMessage('First name is required'),
    body('lastName').trim().isLength({ min: 1, max: 50 }).withMessage('Last name is required'),
    body('addressLine1').trim().isLength({ min: 1, max: 100 }).withMessage('Address line 1 is required'),
    body('city').trim().isLength({ min: 1, max: 50 }).withMessage('City is required'),
    body('state').trim().isLength({ min: 1, max: 50 }).withMessage('State is required'),
    body('postalCode').trim().isLength({ min: 3, max: 20 }).withMessage('Postal code is required'),
    body('country').trim().isLength({ min: 1, max: 50 }).withMessage('Country is required')
  ],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const addressData: IAddressRequest = req.body;
      const result = await userService.addAddress(req.user.id, addressData);
      
      const statusCode = result.success ? 201 : 400;
      res.status(statusCode).json({
        ...result,
        data: result.address ? { address: result.address } : undefined,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Add address error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add address',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * @route PUT /api/users/addresses/:addressId
 * @desc Update user address
 * @access Private
 */
router.put('/addresses/:addressId',
  authenticate,
  param('addressId').isMongoId().withMessage('Valid address ID is required'),
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const result = await userService.updateAddress(req.user.id, req.params.addressId, req.body);
      
      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json({
        ...result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Update address error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update address',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * @route DELETE /api/users/addresses/:addressId
 * @desc Delete user address
 * @access Private
 */
router.delete('/addresses/:addressId',
  authenticate,
  param('addressId').isMongoId().withMessage('Valid address ID is required'),
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const result = await userService.deleteAddress(req.user.id, req.params.addressId);
      
      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json({
        ...result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Delete address error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete address',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

// ==================== USER PREFERENCES ====================

/**
 * @route PUT /api/users/preferences
 * @desc Update user preferences
 * @access Private
 */
router.put('/preferences',
  authenticate,
  async (req: any, res) => {
    try {
      const result = await userService.updatePreferences(req.user.id, req.body);
      
      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json({
        ...result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Update preferences error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update preferences',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

// ==================== MULTI-FACTOR AUTHENTICATION ====================

/**
 * @route POST /api/users/mfa/setup
 * @desc Setup MFA for user
 * @access Private
 */
router.post('/mfa/setup',
  authenticate,
  [
    body('method').isIn(Object.values(MfaMethod)).withMessage('Valid MFA method is required')
  ],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const setupData: IMfaSetupRequest = {
        method: req.body.method,
        phoneNumber: req.body.phoneNumber
      };

      const result = await authService.setupMfa(req.user.id, setupData);
      
      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json({
        ...result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('MFA setup error:', error);
      res.status(500).json({
        success: false,
        error: 'MFA setup failed',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * @route POST /api/users/mfa/verify
 * @desc Verify MFA setup
 * @access Private
 */
router.post('/mfa/verify',
  authenticate,
  [
    body('token').notEmpty().withMessage('MFA token is required'),
    body('method').isIn(Object.values(MfaMethod)).withMessage('Valid MFA method is required')
  ],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const verifyData: IMfaVerifyRequest = {
        token: req.body.token,
        method: req.body.method,
        backupCode: req.body.backupCode
      };

      const result = await authService.verifyMfaSetup(req.user.id, verifyData);
      
      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json({
        ...result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('MFA verification error:', error);
      res.status(500).json({
        success: false,
        error: 'MFA verification failed',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * @route POST /api/users/mfa/disable
 * @desc Disable MFA for user
 * @access Private
 */
router.post('/mfa/disable',
  authenticate,
  [
    body('token').notEmpty().withMessage('MFA token is required'),
    body('method').isIn(Object.values(MfaMethod)).withMessage('Valid MFA method is required')
  ],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const disableData: IMfaVerifyRequest = {
        token: req.body.token,
        method: req.body.method,
        backupCode: req.body.backupCode
      };

      const result = await authService.disableMfa(req.user.id, disableData);
      
      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json({
        ...result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('MFA disable error:', error);
      res.status(500).json({
        success: false,
        error: 'MFA disable failed',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

// ==================== SOCIAL AUTHENTICATION ====================

/**
 * @route GET /api/users/auth/:provider/url
 * @desc Get OAuth URL for social provider
 * @access Public
 */
router.get('/auth/:provider/url',
  param('provider').isIn(Object.values(AuthProvider)).withMessage('Valid auth provider is required'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const provider = req.params.provider as AuthProvider;
      const state = req.query.state as string;
      const authUrl = socialAuthService.getAuthUrl(provider, state);

      if (!authUrl) {
        return res.status(400).json({
          success: false,
          error: `${provider} authentication not configured`,
          code: 'PROVIDER_NOT_CONFIGURED'
        });
      }

      res.json({
        success: true,
        data: { authUrl },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Get auth URL error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get auth URL',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * @route POST /api/users/auth/:provider
 * @desc Authenticate with social provider
 * @access Public
 */
router.post('/auth/:provider',
  authLimiter,
  param('provider').isIn(Object.values(AuthProvider)).withMessage('Valid auth provider is required'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const provider = req.params.provider as AuthProvider;
      const authData: ISocialAuthRequest = {
        provider,
        code: req.body.code,
        accessToken: req.body.accessToken,
        idToken: req.body.idToken,
        redirectUri: req.body.redirectUri,
        state: req.body.state
      };

      let result;
      switch (provider) {
        case AuthProvider.GOOGLE:
          result = await socialAuthService.authenticateWithGoogle(authData);
          break;
        case AuthProvider.FACEBOOK:
          result = await socialAuthService.authenticateWithFacebook(authData);
          break;
        case AuthProvider.GITHUB:
          result = await socialAuthService.authenticateWithGitHub(authData);
          break;
        case AuthProvider.TWITTER:
          result = await socialAuthService.authenticateWithTwitter(authData);
          break;
        default:
          return res.status(400).json({
            success: false,
            error: 'Unsupported auth provider',
            code: 'UNSUPPORTED_PROVIDER'
          });
      }

      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json({
        ...result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Social auth error:', error);
      res.status(500).json({
        success: false,
        error: 'Social authentication failed',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * @route GET /api/users/social-accounts
 * @desc Get linked social accounts
 * @access Private
 */
router.get('/social-accounts',
  authenticate,
  async (req: any, res) => {
    try {
      const result = await socialAuthService.getSocialAccountInfo(req.user.id);
      
      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json({
        ...result,
        data: result.accounts ? { accounts: result.accounts } : undefined,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Get social accounts error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get social accounts',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * @route POST /api/users/social-accounts/:provider/link
 * @desc Link social account
 * @access Private
 */
router.post('/social-accounts/:provider/link',
  authenticate,
  param('provider').isIn(Object.values(AuthProvider)).withMessage('Valid auth provider is required'),
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const provider = req.params.provider as AuthProvider;
      const result = await socialAuthService.linkSocialAccount(req.user.id, provider, req.body);
      
      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json({
        ...result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Link social account error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to link social account',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * @route DELETE /api/users/social-accounts/:provider
 * @desc Unlink social account
 * @access Private
 */
router.delete('/social-accounts/:provider',
  authenticate,
  param('provider').isIn(Object.values(AuthProvider)).withMessage('Valid auth provider is required'),
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const provider = req.params.provider as AuthProvider;
      const result = await socialAuthService.unlinkSocialAccount(req.user.id, provider);
      
      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json({
        ...result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Unlink social account error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to unlink social account',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

// ==================== USER ACCOUNT MANAGEMENT ====================

/**
 * @route POST /api/users/deactivate
 * @desc Deactivate user account
 * @access Private
 */
router.post('/deactivate',
  authenticate,
  [
    body('reason').optional().trim().isLength({ max: 200 }).withMessage('Reason must be less than 200 characters')
  ],
  async (req: any, res) => {
    try {
      const result = await userService.deactivateUser(req.user.id, req.body.reason);
      
      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json({
        ...result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Deactivate account error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to deactivate account',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

// ==================== ERROR HANDLING MIDDLEWARE ====================

// File upload error handling
router.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 10MB.',
        code: 'FILE_TOO_LARGE'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: 'Unexpected file field',
        code: 'UNEXPECTED_FILE'
      });
    }
  }

  if (error.message === 'Invalid file type. Only JPEG, PNG, and WebP are allowed.') {
    return res.status(400).json({
      success: false,
      error: error.message,
      code: 'INVALID_FILE_TYPE'
    });
  }

  logger.error('User router error:', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method
  });

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
});

export default router;
