import { Request, Response } from 'express';
import { awsS3Service, ImageUploadOptions, ImageUploadResult, kafkaProducerService, EventType, createEvent } from '@apnidukaan/shared';
import { Product } from '../models/Product';
import { validateImageUpload } from '../middleware/validation.middleware';

export class ImageController {
  /**
   * Upload product image
   */
  async uploadProductImage(req: Request, res: Response): Promise<void> {
    try {
      const { productId } = req.params;
      const { imageData, fileName } = req.body;

      // Validate input
      const validation = validateImageUpload({ imageData, fileName, productId });
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validation.errors,
        });
        return;
      }

      // Check if product exists
      const product = await Product.findById(productId);
      if (!product) {
        res.status(404).json({
          success: false,
          error: 'Product not found',
        });
        return;
      }

      // Upload image
      const uploadOptions: ImageUploadOptions = {
        productId,
        fileName,
        imageData,
        isPublic: true,
      };

      const uploadResult = await awsS3Service.uploadImage(uploadOptions);

      // Update product with image URLs
      const imageUrls = Object.values(uploadResult.images as Record<string, any>).map((img: any) => img.url);
      product.images = [...(product.images || []), ...imageUrls];
      await product.save();

      // Publish event
      try {
        const event = createEvent(EventType.PRODUCT_IMAGE_UPLOADED, {
          productId: (product._id as any).toString(),
          name: product.name,
          sku: product.sku,
          imageUrls,
          uploadResult,
        }, {
          userId: req.user?.id,
          correlationId: req.headers['x-correlation-id'] as string,
        });
        
        await kafkaProducerService.publish(event);
      } catch (eventError) {
        console.error('Failed to publish image upload event:', eventError);
        // Don't fail the request if event publishing fails
      }

      res.status(200).json({
        success: true,
        data: {
          uploadResult,
          product: {
            id: product._id,
            name: product.name,
            images: product.images,
          },
        },
      });
    } catch (error: any) {
      console.error('Error uploading product image:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to upload image',
        message: error?.message || 'Unexpected error',
      });
    }
  }

  /**
   * Upload multiple product images
   */
  async uploadMultipleImages(req: Request, res: Response): Promise<void> {
    try {
      const { productId } = req.params;
      const { images } = req.body; // Array of { imageData, fileName }

      if (!Array.isArray(images) || images.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Images array is required and must not be empty',
        });
        return;
      }

      // Check if product exists
      const product = await Product.findById(productId);
      if (!product) {
        res.status(404).json({
          success: false,
          error: 'Product not found',
        });
        return;
      }

      // Upload all images
      const uploadPromises = images.map((image: any) => {
        const uploadOptions: ImageUploadOptions = {
          productId,
          fileName: image.fileName,
          imageData: image.imageData,
          isPublic: true,
        };
        return awsS3Service.uploadImage(uploadOptions);
      });

      const uploadResults = await Promise.all(uploadPromises);

      // Update product with all image URLs
      const allImageUrls = uploadResults.flatMap((result: any) => 
        Object.values(result.images as Record<string, any>).map((img: any) => img.url)
      );
      product.images = [...(product.images || []), ...allImageUrls];
      await product.save();

      res.status(200).json({
        success: true,
        data: {
          uploadResults,
          product: {
            id: product._id,
            name: product.name,
            images: product.images,
          },
        },
      });
    } catch (error: any) {
      console.error('Error uploading multiple images:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to upload images',
        message: error?.message || 'Unexpected error',
      });
    }
  }

  /**
   * Delete product image
   */
  async deleteProductImage(req: Request, res: Response): Promise<void> {
    try {
      const { productId, imageUrl } = req.params;

      // Check if product exists
      const product = await Product.findById(productId);
      if (!product) {
        res.status(404).json({
          success: false,
          error: 'Product not found',
        });
        return;
      }

      // Extract S3 key from CloudFront URL
      const s3Key = this.extractS3KeyFromUrl(imageUrl);
      if (!s3Key) {
        res.status(400).json({
          success: false,
          error: 'Invalid image URL',
        });
        return;
      }

      // Delete from S3
      await awsS3Service.deleteImage(s3Key);

      // Remove from product images
      product.images = product.images?.filter(img => img !== imageUrl) || [];
      await product.save();

      // Publish event
      try {
        const event = createEvent(EventType.PRODUCT_IMAGE_DELETED, {
          productId: (product._id as any).toString(),
          name: product.name,
          sku: product.sku,
          deletedImageUrl: imageUrl,
          s3Key,
        }, {
          userId: req.user?.id,
          correlationId: req.headers['x-correlation-id'] as string,
        });
        
        await kafkaProducerService.publish(event);
      } catch (eventError) {
        console.error('Failed to publish image delete event:', eventError);
        // Don't fail the request if event publishing fails
      }

      res.status(200).json({
        success: true,
        message: 'Image deleted successfully',
        data: {
          product: {
            id: product._id,
            name: product.name,
            images: product.images,
          },
        },
      });
    } catch (error: any) {
      console.error('Error deleting product image:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete image',
        message: error?.message || 'Unexpected error',
      });
    }
  }

  /**
   * Get signed URL for direct upload
   */
  async getSignedUploadUrl(req: Request, res: Response): Promise<void> {
    try {
      const { productId } = req.params;
      const { fileName, contentType } = req.query;

      if (!fileName || !contentType) {
        res.status(400).json({
          success: false,
          error: 'fileName and contentType are required',
        });
        return;
      }

      // Check if product exists
      const product = await Product.findById(productId);
      if (!product) {
        res.status(404).json({
          success: false,
          error: 'Product not found',
        });
        return;
      }

      const signedUrl = await awsS3Service.getSignedUploadUrl(
        productId,
        fileName as string,
        contentType as string
      );

      res.status(200).json({
        success: true,
        data: {
          signedUrl,
          expiresIn: 300, // 5 minutes
        },
      });
    } catch (error: any) {
      console.error('Error generating signed URL:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate signed URL',
        message: error?.message || 'Unexpected error',
      });
    }
  }

  /**
   * List product images
   */
  async listProductImages(req: Request, res: Response): Promise<void> {
    try {
      const { productId } = req.params;

      // Check if product exists
      const product = await Product.findById(productId);
      if (!product) {
        res.status(404).json({
          success: false,
          error: 'Product not found',
        });
        return;
      }

      const images = product.images || [];

      res.status(200).json({
        success: true,
        data: {
          productId,
          images,
          count: images.length,
        },
      });
    } catch (error: any) {
      console.error('Error listing product images:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to list images',
        message: error?.message || 'Unexpected error',
      });
    }
  }

  /**
   * Extract S3 key from CloudFront URL
   */
  private extractS3KeyFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      
      // Remove leading slash and extract the key
      return pathname.startsWith('/') ? pathname.substring(1) : pathname;
    } catch (error) {
      console.error('Error extracting S3 key from URL:', error);
      return null;
    }
  }
}

export const imageController = new ImageController();
