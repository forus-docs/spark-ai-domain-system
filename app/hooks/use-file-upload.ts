import { useState, useCallback } from 'react';
import { useAuth } from '@/app/contexts/auth-context';

export interface UploadedFile {
  file_id: string;
  filename: string;
  originalName: string;
  filepath: string;
  type: string;
  size: number;
  width?: number;
  height?: number;
  uploadedAt: string;
  // Client-side properties
  preview?: string;
  progress?: number;
  error?: string;
  uploading?: boolean;
}

interface UseFileUploadOptions {
  onSuccess?: (file: UploadedFile) => void;
  onError?: (error: string, file: File) => void;
  onProgress?: (progress: number, file: File) => void;
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const { accessToken } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const uploadFile = useCallback(async (file: File): Promise<UploadedFile | null> => {
    if (!accessToken) {
      const error = 'No authentication token available';
      options.onError?.(error, file);
      throw new Error(error);
    }

    try {
      setUploading(true);

      // Create FormData
      const formData = new FormData();
      formData.append('file', file);

      // Add image dimensions if it's an image and we can get them
      if (file.type.startsWith('image/')) {
        const dimensions = await getImageDimensions(file);
        if (dimensions) {
          formData.append('width', dimensions.width.toString());
          formData.append('height', dimensions.height.toString());
        }
      }

      // Create XMLHttpRequest for progress tracking
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Track upload progress
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            options.onProgress?.(progress, file);
          }
        };

        // Handle completion
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response: UploadedFile = JSON.parse(xhr.responseText);
              
              // Add client-side properties
              if (file.type.startsWith('image/')) {
                response.preview = URL.createObjectURL(file);
              }
              response.progress = 100;

              setUploadedFiles(prev => [...prev, response]);
              options.onSuccess?.(response);
              resolve(response);
            } catch (error) {
              const errorMsg = 'Failed to parse upload response';
              options.onError?.(errorMsg, file);
              reject(new Error(errorMsg));
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              const errorMsg = errorData.error || 'Upload failed';
              options.onError?.(errorMsg, file);
              reject(new Error(errorMsg));
            } catch {
              const errorMsg = `Upload failed with status ${xhr.status}`;
              options.onError?.(errorMsg, file);
              reject(new Error(errorMsg));
            }
          }
        };

        // Handle errors
        xhr.onerror = () => {
          const errorMsg = 'Network error during upload';
          options.onError?.(errorMsg, file);
          reject(new Error(errorMsg));
        };

        // Handle abort
        xhr.onabort = () => {
          const errorMsg = 'Upload cancelled';
          options.onError?.(errorMsg, file);
          reject(new Error(errorMsg));
        };

        // Send request
        xhr.open('POST', '/api/files/upload');
        xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
        xhr.send(formData);
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Upload failed';
      options.onError?.(errorMsg, file);
      throw error;
    } finally {
      setUploading(false);
    }
  }, [accessToken, options]);

  const uploadFiles = useCallback(async (files: File[]): Promise<UploadedFile[]> => {
    const results: UploadedFile[] = [];
    
    // Upload files sequentially to avoid overwhelming the server
    for (const file of files) {
      try {
        const result = await uploadFile(file);
        if (result) {
          results.push(result);
        }
      } catch (error) {
        // Continue with other files even if one fails
        console.error(`Failed to upload ${file.name}:`, error);
      }
    }
    
    return results;
  }, [uploadFile]);

  const removeFile = useCallback((fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.file_id !== fileId));
    // In a real implementation, you might also want to delete from server
  }, []);

  const clearFiles = useCallback(() => {
    // Clean up preview URLs
    uploadedFiles.forEach(file => {
      if (file.preview && file.preview.startsWith('blob:')) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setUploadedFiles([]);
  }, [uploadedFiles]);

  return {
    uploadFile,
    uploadFiles,
    uploadedFiles,
    removeFile,
    clearFiles,
    uploading,
  };
}

// Helper function to get image dimensions
async function getImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      resolve(null);
    };
    img.src = URL.createObjectURL(file);
  });
}