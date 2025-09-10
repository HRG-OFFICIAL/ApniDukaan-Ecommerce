'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import { Button } from '../ui/Button';

interface ImageUploadProps {
  productId: string;
  onUploadComplete?: (result: { uploadResult: { fileId: string; images: { original: { url: string; s3Key: string } } } }) => void;
  onUploadError?: (error: string) => void;
  maxFiles?: number;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
  className?: string;
}

interface UploadedImage {
  fileId: string;
  originalFileName: string;
  url: string;
  s3Key: string;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

export default function ImageUpload({
  productId,
  onUploadComplete,
  onUploadError,
  maxFiles = 10,
  maxSize = 10,
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  className = ''
}: ImageUploadProps) {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList) => {
    const fileArray = Array.from(files);
    
    // Validate files
    const validationErrors: string[] = [];
    
    if (fileArray.length > maxFiles) {
      validationErrors.push(`Maximum ${maxFiles} files allowed`);
    }

    fileArray.forEach((file, index) => {
      if (file.size > maxSize * 1024 * 1024) {
        validationErrors.push(`File ${index + 1}: Size exceeds ${maxSize}MB limit`);
      }
      
      // Fix: Handle empty MIME types
      if (!file.type || !acceptedTypes.includes(file.type)) {
        validationErrors.push(`File ${index + 1}: Invalid file type. Allowed: ${acceptedTypes.join(', ')}`);
      }
    });

    if (validationErrors.length > 0) {
      onUploadError?.(validationErrors.join('; '));
      return;
    }

    // Fix: Collect all new images first to avoid race conditions
    const newImages = fileArray.map(file => ({
      fileId: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      originalFileName: file.name,
      url: '',
      s3Key: '',
      status: 'uploading' as const
    }));

    setImages(prev => [...prev, ...newImages]);

    // Convert files to base64 and upload
    setIsUploading(true);
    const uploadPromises = fileArray.map(async (file, index) => {
      const fileId = newImages[index].fileId;

      try {
        // Convert to base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Fix: Handle localStorage for Next.js SSR
        const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
        
        // Upload image
        const response = await fetch(`/api/catalog/images/upload/${productId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: JSON.stringify({
            imageData: base64,
            fileName: file.name
          })
        });

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Upload failed');
        }

        // Update image status
        setImages(prev => prev.map(img => 
          img.fileId === fileId 
            ? {
                ...img,
                fileId: result.data.uploadResult.fileId,
                url: result.data.uploadResult.images.original.url,
                s3Key: result.data.uploadResult.images.original.s3Key,
                status: 'success'
              }
            : img
        ));

        onUploadComplete?.(result.data);
        return result.data;

      } catch (error: unknown) {
        console.error('Upload error:', error);
        
        // Fix: Proper error handling with type checking
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // Update image status to error
        setImages(prev => prev.map(img => 
          img.fileId === fileId 
            ? {
                ...img,
                status: 'error',
                error: errorMessage
              }
            : img
        ));

        onUploadError?.(errorMessage);
        return null;
      }
    });

    await Promise.all(uploadPromises);
    setIsUploading(false);
  }, [productId, maxFiles, maxSize, acceptedTypes, onUploadComplete, onUploadError]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const removeImage = useCallback((fileId: string) => {
    setImages(prev => prev.filter(img => img.fileId !== fileId));
  }, []);

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); handleDrag(e); }}
        onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleDrop(e); }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileInput}
          className="hidden"
        />
        
        <div className="space-y-2">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <div className="text-sm text-gray-600">
            <p className="font-medium">Drop images here or click to upload</p>
            <p className="text-xs">
              PNG, JPG, WebP up to {maxSize}MB each (max {maxFiles} files)
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={openFileDialog}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              'Choose Files'
            )}
          </Button>
        </div>
      </div>

      {/* Uploaded Images */}
      {images.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-900">
            Uploaded Images ({images.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image) => (
              <div key={image.fileId} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  {image.status === 'uploading' ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    </div>
                  ) : image.status === 'success' ? (
                    <Image
                      src={image.url}
                      alt={image.originalFileName}
                      width={300}
                      height={300}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <ImageIcon className="h-8 w-8 text-red-500" />
                    </div>
                  )}
                </div>
                
                {/* Status Overlay */}
                <div className="absolute top-2 right-2">
                  {image.status === 'uploading' && (
                    <div className="bg-blue-500 text-white rounded-full p-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                    </div>
                  )}
                  {image.status === 'success' && (
                    <div className="bg-green-500 text-white rounded-full p-1">
                      <CheckCircle className="h-3 w-3" />
                    </div>
                  )}
                  {image.status === 'error' && (
                    <div className="bg-red-500 text-white rounded-full p-1">
                      <X className="h-3 w-3" />
                    </div>
                  )}
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeImage(image.fileId)}
                  className="absolute top-2 left-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>

                {/* Error Message */}
                {image.status === 'error' && image.error && (
                  <div className="absolute bottom-0 left-0 right-0 bg-red-500 text-white text-xs p-1 rounded-b-lg max-h-[40px] overflow-auto">
                    {image.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
