import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

export interface ImageUploadResult {
  fileId: string;
  originalFileName: string;
  productId: string;
  images: {
    [key: string]: {
      url: string;
      s3Key: string;
      s3Url: string;
    };
  };
  cloudfrontDomain: string;
  timestamp: string;
}

export interface ImageUploadOptions {
  productId: string;
  fileName: string;
  imageData: string; // base64 encoded
  isPublic?: boolean;
}

export class AWSS3Service {
  private s3: AWS.S3;
  private cloudfront: AWS.CloudFront;
  private bucketName: string;
  private cloudfrontDomain: string;
  private apiGatewayUrl: string;

  constructor() {
    // Configure AWS SDK
    AWS.config.update({
      region: process.env.AWS_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    });

    this.s3 = new AWS.S3();
    this.cloudfront = new AWS.CloudFront();
    this.bucketName = process.env.S3_BUCKET_NAME || '';
    this.cloudfrontDomain = process.env.CLOUDFRONT_DOMAIN || '';
    this.apiGatewayUrl = process.env.IMAGE_UPLOAD_API_URL || '';
  }

  /**
   * Upload image using the Lambda optimization service
   */
  async uploadImage(options: ImageUploadOptions): Promise<ImageUploadResult> {
    try {
      // If API Gateway URL is configured, use it for optimized uploads
      if (this.apiGatewayUrl) {
        return await this.uploadImageViaAPI(options);
      }
      
      // Fallback to direct S3 upload
      return await this.uploadImageDirect(options);
    } catch (error) {
      logger.error('Error uploading image', {
        productId: options.productId,
        fileName: options.fileName,
        error: (error as any).message,
        action: 'image_upload_error'
      });
      throw error;
    }
  }

  /**
   * Upload image using the Lambda optimization service
   */
  private async uploadImageViaAPI(options: ImageUploadOptions): Promise<ImageUploadResult> {
    try {
      const response = await fetch(this.apiGatewayUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData: options.imageData,
          fileName: options.fileName,
          productId: options.productId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json() as ImageUploadResult;
      
      logger.info('Image uploaded via API', {
        productId: options.productId,
        fileName: options.fileName,
        fileId: result.fileId,
        action: 'image_uploaded_via_api'
      });

      return result;
    } catch (error) {
      logger.error('Error uploading image via API', {
        productId: options.productId,
        fileName: options.fileName,
        error: (error as any).message,
        action: 'image_upload_api_error'
      });
      throw error;
    }
  }

  /**
   * Upload image directly to S3 (fallback method)
   */
  async uploadImageDirect(options: ImageUploadOptions): Promise<ImageUploadResult> {
    try {
      const fileId = uuidv4();
      const baseFileName = options.fileName.split('.')[0];
      const fileExtension = options.fileName.split('.').pop()?.toLowerCase();

      // Convert base64 to buffer
      const imageBuffer = Buffer.from(options.imageData, 'base64');

      // Generate S3 key
      const s3Key = `images/${options.productId}/${fileId}_original.${fileExtension}`;

      // Upload to S3
      const uploadResult = await this.s3.upload({
        Bucket: this.bucketName,
        Key: s3Key,
        Body: imageBuffer,
        ContentType: `image/${fileExtension}`,
        CacheControl: 'max-age=31536000', // 1 year
        Metadata: {
          'original-filename': options.fileName,
          'product-id': options.productId,
          'file-id': fileId,
        },
      }).promise();

      // Create response object
      const result: ImageUploadResult = {
        fileId,
        originalFileName: options.fileName,
        productId: options.productId,
        images: {
          original: {
            url: `https://${this.cloudfrontDomain}/${s3Key}`,
            s3Key,
            s3Url: uploadResult.Location,
          },
        },
        cloudfrontDomain: this.cloudfrontDomain,
        timestamp: new Date().toISOString(),
      };

      logger.info('Image uploaded directly to S3', {
        productId: options.productId,
        fileName: options.fileName,
        fileId,
        s3Key,
        action: 'image_uploaded_direct'
      });

      return result;
    } catch (error) {
      logger.error('Error uploading image directly', {
        productId: options.productId,
        fileName: options.fileName,
        error: (error as any).message,
        action: 'image_upload_direct_error'
      });
      throw error;
    }
  }

  /**
   * Delete image from S3
   */
  async deleteImage(s3Key: string): Promise<void> {
    try {
      await this.s3.deleteObject({
        Bucket: this.bucketName,
        Key: s3Key,
      }).promise();

      logger.info('Image deleted from S3', {
        s3Key,
        action: 'image_deleted'
      });
    } catch (error) {
      logger.error('Error deleting image', {
        s3Key,
        error: (error as any).message,
        action: 'image_delete_error'
      });
      throw error;
    }
  }

  /**
   * Delete multiple images from S3
   */
  async deleteImages(s3Keys: string[]): Promise<void> {
    try {
      const deleteParams = {
        Bucket: this.bucketName,
        Delete: {
          Objects: s3Keys.map(key => ({ Key: key })),
        },
      };

      await this.s3.deleteObjects(deleteParams).promise();

      logger.info('Multiple images deleted from S3', {
        count: s3Keys.length,
        s3Keys,
        action: 'images_deleted'
      });
    } catch (error) {
      logger.error('Error deleting images', {
        s3Keys,
        error: (error as any).message,
        action: 'images_delete_error'
      });
      throw error;
    }
  }

  /**
   * Get signed URL for direct upload
   */
  async getSignedUploadUrl(
    productId: string,
    fileName: string,
    contentType: string,
    expiresIn: number = 300
  ): Promise<string> {
    try {
      const fileId = uuidv4();
      const s3Key = `images/${productId}/${fileId}_${fileName}`;

      const signedUrl = await this.s3.getSignedUrlPromise('putObject', {
        Bucket: this.bucketName,
        Key: s3Key,
        ContentType: contentType,
        Expires: expiresIn,
        Metadata: {
          'product-id': productId,
          'file-id': fileId,
        },
      });

      logger.info('Signed upload URL generated', {
        productId,
        fileName,
        fileId,
        s3Key,
        expiresIn,
        action: 'signed_url_generated'
      });

      return signedUrl;
    } catch (error) {
      logger.error('Error generating signed URL', {
        productId,
        fileName,
        error: (error as any).message,
        action: 'signed_url_error'
      });
      throw error;
    }
  }

  /**
   * Get signed URL for image access
   */
  async getSignedAccessUrl(
    s3Key: string,
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      const signedUrl = await this.s3.getSignedUrlPromise('getObject', {
        Bucket: this.bucketName,
        Key: s3Key,
        Expires: expiresIn,
      });

      logger.info('Signed access URL generated', {
        s3Key,
        expiresIn,
        action: 'signed_access_url_generated'
      });

      return signedUrl;
    } catch (error) {
      logger.error('Error generating signed access URL', {
        s3Key,
        error: (error as any).message,
        action: 'signed_access_url_error'
      });
      throw error;
    }
  }

  /**
   * List images for a product
   */
  async listProductImages(productId: string): Promise<string[]> {
    try {
      const params = {
        Bucket: this.bucketName,
        Prefix: `images/${productId}/`,
      };

      const result = await this.s3.listObjectsV2(params).promise();
      const s3Keys = result.Contents?.map(obj => obj.Key || '') || [];

      logger.info('Product images listed', {
        productId,
        count: s3Keys.length,
        action: 'product_images_listed'
      });

      return s3Keys;
    } catch (error) {
      logger.error('Error listing product images', {
        productId,
        error: (error as any).message,
        action: 'product_images_list_error'
      });
      throw error;
    }
  }

  /**
   * Generate CloudFront URL for an image
   */
  generateCloudFrontUrl(s3Key: string): string {
    return `https://${this.cloudfrontDomain}/${s3Key}`;
  }

  /**
   * Invalidate CloudFront cache
   */
  async invalidateCache(paths: string[]): Promise<void> {
    try {
      const distributionId = process.env.CLOUDFRONT_DISTRIBUTION_ID;
      if (!distributionId) {
        logger.warn('CloudFront distribution ID not configured', {
          action: 'cloudfront_config_warning'
        });
        return;
      }

      await this.cloudfront.createInvalidation({
        DistributionId: distributionId,
        InvalidationBatch: {
          CallerReference: `invalidation-${Date.now()}`,
          Paths: {
            Quantity: paths.length,
            Items: paths.map(path => `/${path}`),
          },
        },
      }).promise();

      logger.info('CloudFront cache invalidated', {
        distributionId,
        paths,
        action: 'cloudfront_cache_invalidated'
      });
    } catch (error) {
      logger.error('Error invalidating CloudFront cache', {
        paths,
        error: (error as any).message,
        action: 'cloudfront_cache_invalidation_error'
      });
      // Don't throw error as cache invalidation is not critical
    }
  }
}

export const awsS3Service = new AWSS3Service();
