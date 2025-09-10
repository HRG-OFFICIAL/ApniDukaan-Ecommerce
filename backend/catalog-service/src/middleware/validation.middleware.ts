export interface ImageUploadData {
  imageData: string;
  fileName: string;
  productId: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateImageUpload(data: ImageUploadData): ValidationResult {
  const errors: string[] = [];

  // Validate productId
  if (!data.productId || typeof data.productId !== 'string') {
    errors.push('Product ID is required and must be a string');
  } else if (data.productId.trim().length === 0) {
    errors.push('Product ID cannot be empty');
  }

  // Validate fileName
  if (!data.fileName || typeof data.fileName !== 'string') {
    errors.push('File name is required and must be a string');
  } else {
    const fileName = data.fileName.trim();
    if (fileName.length === 0) {
      errors.push('File name cannot be empty');
    } else if (fileName.length > 255) {
      errors.push('File name cannot exceed 255 characters');
    } else {
      // Check file extension
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
      const fileExtension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
      
      if (!allowedExtensions.includes(fileExtension)) {
        errors.push(`File extension ${fileExtension} is not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`);
      }
    }
  }

  // Validate imageData (base64)
  if (!data.imageData || typeof data.imageData !== 'string') {
    errors.push('Image data is required and must be a string');
  } else {
    const imageData = data.imageData.trim();
    if (imageData.length === 0) {
      errors.push('Image data cannot be empty');
    } else {
      // Check if it's valid base64
      const base64Regex = /^data:image\/([a-zA-Z]*);base64,([^"]*)$/;
      if (!base64Regex.test(imageData)) {
        errors.push('Image data must be a valid base64 encoded image');
      } else {
        // Check file size (base64 is ~33% larger than binary)
        const base64Data = imageData.split(',')[1];
        const fileSizeInBytes = (base64Data.length * 3) / 4;
        const maxSizeInBytes = 10 * 1024 * 1024; // 10MB

        if (fileSizeInBytes > maxSizeInBytes) {
          errors.push(`Image size exceeds maximum allowed size of ${maxSizeInBytes / (1024 * 1024)}MB`);
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateMultipleImages(images: any[]): ValidationResult {
  const errors: string[] = [];

  if (!Array.isArray(images)) {
    errors.push('Images must be an array');
    return { isValid: false, errors };
  }

  if (images.length === 0) {
    errors.push('At least one image is required');
    return { isValid: false, errors };
  }

  if (images.length > 10) {
    errors.push('Maximum 10 images allowed per upload');
    return { isValid: false, errors };
  }

  // Validate each image
  images.forEach((image, index) => {
    if (!image || typeof image !== 'object') {
      errors.push(`Image at index ${index} must be an object`);
      return;
    }

    if (!image.imageData || typeof image.imageData !== 'string') {
      errors.push(`Image at index ${index} must have valid imageData`);
    }

    if (!image.fileName || typeof image.fileName !== 'string') {
      errors.push(`Image at index ${index} must have valid fileName`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}
