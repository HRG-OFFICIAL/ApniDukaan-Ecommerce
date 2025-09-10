const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { CloudFrontClient, CreateInvalidationCommand } = require('@aws-sdk/client-cloudfront');
const { Upload } = require('@aws-sdk/lib-storage');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const cloudfrontClient = new CloudFrontClient({ region: process.env.AWS_REGION || 'us-east-1' });

const BUCKET_NAME = process.env.S3_BUCKET;
const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN;

// Image sizes for different use cases
const IMAGE_SIZES = {
  thumbnail: { width: 150, height: 150 },
  small: { width: 300, height: 300 },
  medium: { width: 600, height: 600 },
  large: { width: 1200, height: 1200 },
  original: null // Keep original size
};

exports.handler = async (event) => {
  try {
    console.log('Image optimization request:', JSON.stringify(event, null, 2));

    // Parse the request body
    const body = JSON.parse(event.body);
    const { imageData, fileName, productId } = body;

    if (!imageData || !fileName) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: JSON.stringify({
          error: 'Missing required fields: imageData and fileName'
        })
      };
    }

    // Generate unique file ID
    const fileId = uuidv4();
    const baseFileName = fileName.split('.')[0];
    const fileExtension = fileName.split('.').pop().toLowerCase();

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(imageData, 'base64');

    // Validate image format
    const supportedFormats = ['jpeg', 'jpg', 'png', 'webp'];
    if (!supportedFormats.includes(fileExtension)) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'Unsupported image format. Supported formats: JPEG, PNG, WebP'
        })
      };
    }

    // Process images in different sizes
    const processedImages = {};
    const uploadPromises = [];

    for (const [sizeName, dimensions] of Object.entries(IMAGE_SIZES)) {
      try {
        let processedBuffer;
        
        if (dimensions) {
          // Resize image
          processedBuffer = await sharp(imageBuffer)
            .resize(dimensions.width, dimensions.height, {
              fit: 'cover',
              position: 'center'
            })
            .jpeg({ quality: 85 })
            .toBuffer();
        } else {
          // Keep original size but optimize
          processedBuffer = await sharp(imageBuffer)
            .jpeg({ quality: 90 })
            .toBuffer();
        }

        // Generate S3 key
        const s3Key = `images/${productId || 'temp'}/${fileId}_${sizeName}.jpg`;
        
        // Upload to S3 using AWS SDK v3
        const upload = new Upload({
          client: s3Client,
          params: {
            Bucket: BUCKET_NAME,
            Key: s3Key,
            Body: processedBuffer,
            ContentType: 'image/jpeg',
            CacheControl: 'max-age=31536000', // 1 year
            Metadata: {
              'original-filename': fileName,
              'processed-size': sizeName,
              'product-id': productId || 'temp'
            }
          }
        });
        
        const uploadPromise = upload.done();

        uploadPromises.push(uploadPromise.then(result => ({
          size: sizeName,
          key: s3Key,
          url: `https://${CLOUDFRONT_DOMAIN}/${s3Key}`,
          s3Url: `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${s3Key}`
        })));

      } catch (error) {
        console.error(`Error processing ${sizeName} image:`, error);
        throw error;
      }
    }

    // Wait for all uploads to complete
    const uploadResults = await Promise.all(uploadPromises);

    // Create response object
    const response = {
      fileId,
      originalFileName: fileName,
      productId: productId || 'temp',
      images: uploadResults.reduce((acc, result) => {
        acc[result.size] = {
          url: result.url,
          s3Key: result.key,
          s3Url: result.s3Url
        };
        return acc;
      }, {}),
      cloudfrontDomain: CLOUDFRONT_DOMAIN,
      timestamp: new Date().toISOString()
    };

    // Invalidate CloudFront cache for the uploaded images
    try {
      const invalidationPaths = uploadResults.map(result => `/${result.key}`);
      
      const invalidationCommand = new CreateInvalidationCommand({
        DistributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID,
        InvalidationBatch: {
          CallerReference: `image-upload-${fileId}-${Date.now()}`,
          Paths: {
            Quantity: invalidationPaths.length,
            Items: invalidationPaths
          }
        }
      });
      
      await cloudfrontClient.send(invalidationCommand);
    } catch (error) {
      console.warn('Failed to invalidate CloudFront cache:', error);
      // Don't fail the request if cache invalidation fails
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('Error in image optimization:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};
