import { Router } from 'express';
import { imageController } from '../controllers/image.controller';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';
import { uploadMiddleware } from '../middleware/upload.middleware';

const router = Router();

/**
 * @route POST /api/images/upload/:productId
 * @desc Upload a single product image
 * @access Private (Admin/Moderator)
 */
router.post('/upload/:productId', authMiddleware, adminMiddleware, uploadMiddleware, imageController.uploadProductImage.bind(imageController));

/**
 * @route POST /api/images/upload-multiple/:productId
 * @desc Upload multiple product images
 * @access Private (Admin/Moderator)
 */
router.post('/upload-multiple/:productId', authMiddleware, adminMiddleware, uploadMiddleware, imageController.uploadMultipleImages.bind(imageController));

/**
 * @route DELETE /api/images/:productId/:imageUrl
 * @desc Delete a product image
 * @access Private (Admin/Moderator)
 */
router.delete('/:productId/:imageUrl', authMiddleware, adminMiddleware, imageController.deleteProductImage.bind(imageController));

/**
 * @route GET /api/images/signed-url/:productId
 * @desc Get signed URL for direct upload
 * @access Private (Admin/Moderator)
 */
router.get('/signed-url/:productId', authMiddleware, adminMiddleware, imageController.getSignedUploadUrl.bind(imageController));

/**
 * @route GET /api/images/:productId
 * @desc List all images for a product
 * @access Public
 */
router.get('/:productId', imageController.listProductImages.bind(imageController));

export default router;
