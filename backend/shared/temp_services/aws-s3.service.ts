import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

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

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
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

      return result;
    } catch (error) {
      console.error('Error uploading image directly:', error);
      throw new Error(`Failed to upload image directly: ${error.message}`);
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
    } catch (error) {
      console.error('Error deleting image:', error);
      throw new Error(`Failed to delete image: ${error.message}`);
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
    } catch (error) {
      console.error('Error deleting images:', error);
      throw new Error(`Failed to delete images: ${error.message}`);
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

      return signedUrl;
    } catch (error) {
      console.error('Error generating signed URL:', error);
      throw new Error(`Failed to generate signed URL: ${error.message}`);
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

      return signedUrl;
    } catch (error) {
      console.error('Error generating signed access URL:', error);
      throw new Error(`Failed to generate signed access URL: ${error.message}`);
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
      return result.Contents?.map(obj => obj.Key || '') || [];
    } catch (error) {
      console.error('Error listing product images:', error);
      throw new Error(`Failed to list product images: ${error.message}`);
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
        console.warn('CloudFront distribution ID not configured');
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
    } catch (error) {
      console.error('Error invalidating CloudFront cache:', error);
      // Don't throw error as cache invalidation is not critical
    }
  }
}

export const awsS3Service = new AWSS3Service();
