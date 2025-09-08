import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import multer from 'multer';
import sharp from 'sharp';
import ProfileService from '../services/ProfileService';
import {
  ICreateProfileRequest,
  IUpdateProfileRequest,
  IAddAddressRequest,
  IUpdateAddressRequest,
  IAddWishlistItemRequest,
  IUpdateWishlistItemRequest
} from '../types/profile.types';
import { logger } from '@shopsphere/shared';

const router = express.Router();
const profileService = new ProfileService();

// Configure multer for avatar uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Middleware to extract user ID from headers (replace with actual auth middleware)
const authenticate = (req: any, res: any, next: any) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      code: 'AUTHENTICATION_REQUIRED'
    });
  }
  req.userId = userId;
  next();
};

// Validation middleware
const createProfileValidation = [
  body('personalInfo.firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and must be less than 50 characters'),
  body('personalInfo.lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and must be less than 50 characters'),
  body('personalInfo.email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('personalInfo.phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Valid phone number is required'),
  body('personalInfo.dateOfBirth')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Valid date of birth is required'),
  body('personalInfo.gender')
    .optional()
    .isIn(['male', 'female', 'other', 'prefer_not_to_say'])
    .withMessage('Invalid gender option'),
  body('registrationSource')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Registration source must be less than 50 characters')
];

const updateProfileValidation = [
  body('personalInfo.firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be less than 50 characters'),
  body('personalInfo.lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be less than 50 characters'),
  body('personalInfo.email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('personalInfo.phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Valid phone number is required'),
  body('personalInfo.dateOfBirth')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Valid date of birth is required'),
  body('personalInfo.bio')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Bio must be less than 1000 characters')
];

const addressValidation = [
  body('type')
    .isIn(['home', 'work', 'billing', 'shipping', 'other'])
    .withMessage('Invalid address type'),
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and must be less than 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and must be less than 50 characters'),
  body('addressLine1')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Address line 1 is required and must be less than 200 characters'),
  body('city')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('City is required and must be less than 100 characters'),
  body('state')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('State is required and must be less than 100 characters'),
  body('postalCode')
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('Postal code is required and must be less than 20 characters'),
  body('country')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Country is required and must be less than 100 characters')
];

const wishlistValidation = [
  body('productId')
    .isMongoId()
    .withMessage('Valid product ID is required'),
  body('variantId')
    .optional()
    .isMongoId()
    .withMessage('Valid variant ID is required'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Invalid priority option'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must be less than 500 characters')
];

/**
 * @route POST /profile
 * @desc Create user profile
 * @access Private
 */
router.post('/',
  authenticate,
  createProfileValidation,
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

      const profileData: ICreateProfileRequest = {
        userId: req.userId,
        personalInfo: req.body.personalInfo,
        preferences: req.body.preferences,
        registrationSource: req.body.registrationSource,
        referralCode: req.body.referralCode
      };

      const result = await profileService.createProfile(profileData);

      if (!result.success) {
        const statusCode = result.code === 'PROFILE_EXISTS' || result.code === 'EMAIL_EXISTS' ? 409 : 400;
        return res.status(statusCode).json(result);
      }

      res.status(201).json(result);

    } catch (error) {
      logger.error('Error in create profile route:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * @route GET /profile
 * @desc Get user profile
 * @access Private
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await profileService.getProfile(req.userId);

    if (!result.success) {
      const statusCode = result.code === 'PROFILE_NOT_FOUND' ? 404 : 500;
      return res.status(statusCode).json(result);
    }

    res.json(result);

  } catch (error) {
    logger.error('Error in get profile route:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * @route PUT /profile
 * @desc Update user profile
 * @access Private
 */
router.put('/',
  authenticate,
  updateProfileValidation,
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

      const updateData: IUpdateProfileRequest = req.body;
      const result = await profileService.updateProfile(req.userId, updateData);

      if (!result.success) {
        const statusCode = result.code === 'PROFILE_NOT_FOUND' ? 404 : 
                          result.code === 'EMAIL_EXISTS' ? 409 : 500;
        return res.status(statusCode).json(result);
      }

      res.json(result);

    } catch (error) {
      logger.error('Error in update profile route:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * @route DELETE /profile
 * @desc Delete user profile
 * @access Private
 */
router.delete('/', authenticate, async (req, res) => {
  try {
    const result = await profileService.deleteProfile(req.userId);

    if (!result.success) {
      const statusCode = result.code === 'PROFILE_NOT_FOUND' ? 404 : 500;
      return res.status(statusCode).json(result);
    }

    res.json(result);

  } catch (error) {
    logger.error('Error in delete profile route:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * @route POST /profile/avatar
 * @desc Upload user avatar
 * @access Private
 */
router.post('/avatar',
  authenticate,
  upload.single('avatar'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'Avatar image is required',
          code: 'FILE_REQUIRED'
        });
      }

      // Process image with Sharp
      const processedImage = await sharp(req.file.buffer)
        .resize(200, 200, { 
          fit: 'cover', 
          position: 'center' 
        })
        .jpeg({ quality: 90 })
        .toBuffer();

      // In a real implementation, upload to cloud storage (AWS S3, Cloudinary, etc.)
      const avatarUrl = `https://storage.example.com/avatars/${req.userId}.jpg`;

      const result = await profileService.updateProfile(req.userId, {
        personalInfo: { avatar: avatarUrl }
      });

      if (!result.success) {
        const statusCode = result.code === 'PROFILE_NOT_FOUND' ? 404 : 500;
        return res.status(statusCode).json(result);
      }

      res.json({
        success: true,
        message: 'Avatar uploaded successfully',
        data: { avatarUrl }
      });

    } catch (error) {
      logger.error('Error in upload avatar route:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to upload avatar',
        code: 'UPLOAD_ERROR'
      });
    }
  }
);

/**
 * @route GET /profile/statistics
 * @desc Get user profile statistics
 * @access Private
 */
router.get('/statistics', authenticate, async (req, res) => {
  try {
    const statistics = await profileService.getProfileStatistics(req.userId);

    if (!statistics) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found',
        code: 'PROFILE_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: { statistics }
    });

  } catch (error) {
    logger.error('Error in get statistics route:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Address Management Routes

/**
 * @route GET /profile/addresses
 * @desc Get user addresses
 * @access Private
 */
router.get('/addresses', authenticate, async (req, res) => {
  try {
    const result = await profileService.getProfile(req.userId);

    if (!result.success) {
      const statusCode = result.code === 'PROFILE_NOT_FOUND' ? 404 : 500;
      return res.status(statusCode).json(result);
    }

    res.json({
      success: true,
      data: { 
        addresses: result.data!.profile.addresses,
        totalAddresses: result.data!.profile.addresses.length
      }
    });

  } catch (error) {
    logger.error('Error in get addresses route:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * @route POST /profile/addresses
 * @desc Add new address
 * @access Private
 */
router.post('/addresses',
  authenticate,
  addressValidation,
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

      const addressData: IAddAddressRequest = req.body;
      const result = await profileService.addAddress(req.userId, addressData);

      if (!result.success) {
        const statusCode = result.code === 'PROFILE_NOT_FOUND' ? 404 : 500;
        return res.status(statusCode).json(result);
      }

      res.status(201).json(result);

    } catch (error) {
      logger.error('Error in add address route:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * @route PUT /profile/addresses/:addressId
 * @desc Update address
 * @access Private
 */
router.put('/addresses/:addressId',
  authenticate,
  param('addressId').isMongoId().withMessage('Valid address ID is required'),
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

      const updateData: IUpdateAddressRequest = req.body;
      const result = await profileService.updateAddress(req.userId, req.params.addressId, updateData);

      if (!result.success) {
        const statusCode = result.code === 'PROFILE_NOT_FOUND' ? 404 : 500;
        return res.status(statusCode).json(result);
      }

      res.json(result);

    } catch (error) {
      logger.error('Error in update address route:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * @route DELETE /profile/addresses/:addressId
 * @desc Delete address
 * @access Private
 */
router.delete('/addresses/:addressId',
  authenticate,
  param('addressId').isMongoId().withMessage('Valid address ID is required'),
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

      const result = await profileService.removeAddress(req.userId, req.params.addressId);

      if (!result.success) {
        const statusCode = result.code === 'PROFILE_NOT_FOUND' ? 404 : 500;
        return res.status(statusCode).json(result);
      }

      res.json(result);

    } catch (error) {
      logger.error('Error in delete address route:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * @route POST /profile/addresses/:addressId/default
 * @desc Set default address
 * @access Private
 */
router.post('/addresses/:addressId/default',
  authenticate,
  param('addressId').isMongoId().withMessage('Valid address ID is required'),
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

      const result = await profileService.setDefaultAddress(req.userId, req.params.addressId);

      if (!result.success) {
        const statusCode = result.code === 'PROFILE_NOT_FOUND' || 
                          result.code === 'ADDRESS_NOT_FOUND' ? 404 : 500;
        return res.status(statusCode).json(result);
      }

      res.json(result);

    } catch (error) {
      logger.error('Error in set default address route:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

// Wishlist Management Routes

/**
 * @route GET /profile/wishlist
 * @desc Get user wishlist
 * @access Private
 */
router.get('/wishlist', authenticate, async (req, res) => {
  try {
    const includeDetails = req.query.includeDetails === 'true';

    let result;
    if (includeDetails) {
      result = await profileService.getWishlistWithDetails(req.userId);
    } else {
      const profileResult = await profileService.getProfile(req.userId);
      if (!profileResult.success) {
        const statusCode = profileResult.code === 'PROFILE_NOT_FOUND' ? 404 : 500;
        return res.status(statusCode).json(profileResult);
      }

      result = {
        success: true,
        data: {
          wishlist: profileResult.data!.profile.wishlist,
          totalItems: profileResult.data!.profile.wishlist.length
        }
      };
    }

    if (!result.success) {
      const statusCode = result.code === 'PROFILE_NOT_FOUND' ? 404 : 500;
      return res.status(statusCode).json(result);
    }

    res.json(result);

  } catch (error) {
    logger.error('Error in get wishlist route:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * @route POST /profile/wishlist
 * @desc Add item to wishlist
 * @access Private
 */
router.post('/wishlist',
  authenticate,
  wishlistValidation,
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

      const wishlistData: IAddWishlistItemRequest = req.body;
      const result = await profileService.addToWishlist(req.userId, wishlistData);

      if (!result.success) {
        const statusCode = result.code === 'PROFILE_NOT_FOUND' ? 404 :
                          result.code === 'PRODUCT_NOT_FOUND' ? 404 : 500;
        return res.status(statusCode).json(result);
      }

      res.status(201).json(result);

    } catch (error) {
      logger.error('Error in add to wishlist route:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * @route PUT /profile/wishlist/:itemId
 * @desc Update wishlist item
 * @access Private
 */
router.put('/wishlist/:itemId',
  authenticate,
  param('itemId').isMongoId().withMessage('Valid item ID is required'),
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

      const updateData: IUpdateWishlistItemRequest = req.body;
      const result = await profileService.updateWishlistItem(req.userId, req.params.itemId, updateData);

      if (!result.success) {
        const statusCode = result.code === 'PROFILE_NOT_FOUND' ||
                          result.code === 'WISHLIST_ITEM_NOT_FOUND' ? 404 : 500;
        return res.status(statusCode).json(result);
      }

      res.json(result);

    } catch (error) {
      logger.error('Error in update wishlist item route:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * @route DELETE /profile/wishlist/:itemId
 * @desc Remove item from wishlist
 * @access Private
 */
router.delete('/wishlist/:itemId',
  authenticate,
  param('itemId').isMongoId().withMessage('Valid item ID is required'),
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

      const result = await profileService.removeFromWishlist(req.userId, req.params.itemId);

      if (!result.success) {
        const statusCode = result.code === 'PROFILE_NOT_FOUND' ||
                          result.code === 'WISHLIST_ITEM_NOT_FOUND' ? 404 : 500;
        return res.status(statusCode).json(result);
      }

      res.json(result);

    } catch (error) {
      logger.error('Error in remove from wishlist route:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

// Preferences and Settings Routes

/**
 * @route GET /profile/preferences
 * @desc Get user preferences
 * @access Private
 */
router.get('/preferences', authenticate, async (req, res) => {
  try {
    const result = await profileService.getProfile(req.userId);

    if (!result.success) {
      const statusCode = result.code === 'PROFILE_NOT_FOUND' ? 404 : 500;
      return res.status(statusCode).json(result);
    }

    res.json({
      success: true,
      data: { preferences: result.data!.profile.preferences }
    });

  } catch (error) {
    logger.error('Error in get preferences route:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * @route PUT /profile/preferences
 * @desc Update user preferences
 * @access Private
 */
router.put('/preferences', authenticate, async (req, res) => {
  try {
    const result = await profileService.updatePreferences(req.userId, req.body);

    if (!result.success) {
      const statusCode = result.code === 'PROFILE_NOT_FOUND' ? 404 : 500;
      return res.status(statusCode).json(result);
    }

    res.json(result);

  } catch (error) {
    logger.error('Error in update preferences route:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * @route GET /profile/settings
 * @desc Get account settings
 * @access Private
 */
router.get('/settings', authenticate, async (req, res) => {
  try {
    const result = await profileService.getProfile(req.userId);

    if (!result.success) {
      const statusCode = result.code === 'PROFILE_NOT_FOUND' ? 404 : 500;
      return res.status(statusCode).json(result);
    }

    res.json({
      success: true,
      data: { settings: result.data!.profile.accountSettings }
    });

  } catch (error) {
    logger.error('Error in get settings route:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * @route PUT /profile/settings
 * @desc Update account settings
 * @access Private
 */
router.put('/settings', authenticate, async (req, res) => {
  try {
    const result = await profileService.updateAccountSettings(req.userId, req.body);

    if (!result.success) {
      const statusCode = result.code === 'PROFILE_NOT_FOUND' ? 404 : 500;
      return res.status(statusCode).json(result);
    }

    res.json(result);

  } catch (error) {
    logger.error('Error in update settings route:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * @route POST /profile/loyalty/points
 * @desc Add loyalty points (internal use)
 * @access Private (Admin)
 */
router.post('/loyalty/points',
  authenticate,
  [
    body('points').isInt({ min: 1 }).withMessage('Points must be a positive integer'),
    body('reason').trim().isLength({ min: 1, max: 200 }).withMessage('Reason is required')
  ],
  async (req, res) => {
    try {
      // This would typically require admin authentication
      const userRole = req.headers['x-user-role'] as string;
      if (userRole !== 'admin' && userRole !== 'system') {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          code: 'ACCESS_DENIED'
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { points, reason } = req.body;
      const result = await profileService.addLoyaltyPoints(req.userId, points, reason);

      if (!result.success) {
        const statusCode = result.code === 'PROFILE_NOT_FOUND' ? 404 : 500;
        return res.status(statusCode).json(result);
      }

      res.json(result);

    } catch (error) {
      logger.error('Error in add loyalty points route:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'user-profile-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware for this router
router.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Profile router error:', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    body: req.body
  });

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
});

export default router;
