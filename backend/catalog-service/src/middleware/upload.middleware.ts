import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { validateImageUpload, validateMultipleImages } from './validation.middleware';

// Configure multer for memory storage
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10, // Maximum 10 files
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`));
    }
  },
});

export const uploadMiddleware = (req: Request, res: Response, next: NextFunction): any => {
  // Handle different upload methods
  if (req.body.imageData) {
    // Handle base64 upload
    return handleBase64Upload(req, res, next);
  } else if (req.files || req.file) {
    // Handle multipart upload
    return handleMultipartUpload(req, res, next);
  } else {
    res.status(400).json({
      success: false,
      error: 'No image data provided. Use either base64 or multipart upload.',
    });
    return;
  }
};

function handleBase64Upload(req: Request, res: Response, next: NextFunction): void {
  const { imageData, fileName } = req.body;

  // Validate base64 upload
  const validation = validateImageUpload({
    imageData,
    fileName,
    productId: req.params.productId,
  });

  if (!validation.isValid) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: validation.errors,
    });
    return;
  }

  next();
}

function handleMultipartUpload(req: Request, res: Response, next: NextFunction): void {
  // Use multer for multipart uploads
  const uploadHandler = upload.array('images', 10);

  uploadHandler(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            error: 'File size too large. Maximum size is 10MB.',
          });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            success: false,
            error: 'Too many files. Maximum 10 files allowed.',
          });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({
            success: false,
            error: 'Unexpected field name. Use "images" as field name.',
          });
        }
      }

      return res.status(400).json({
        success: false,
        error: err.message,
      });
    }

    // Convert files to base64 for processing
    if (req.files && Array.isArray(req.files)) {
      const images = req.files.map((file: any) => ({
        imageData: `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
        fileName: file.originalname,
      }));

      // Validate multiple images
      const validation = validateMultipleImages(images);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validation.errors,
        });
      }

      req.body.images = images;
    } else if (req.file) {
      const image = {
        imageData: `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
        fileName: req.file.originalname,
      };

      // Validate single image
      const validation = validateImageUpload({
        imageData: image.imageData,
        fileName: image.fileName,
        productId: req.params.productId,
      });

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validation.errors,
        });
      }

      req.body.imageData = image.imageData;
      req.body.fileName = image.fileName;
    }

    next();
  });
}

export { upload };
