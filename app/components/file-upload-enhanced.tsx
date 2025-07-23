'use client';

import React, { useRef, useState, useCallback } from 'react';
import { 
  Paperclip, 
  X, 
  FileText, 
  Image as ImageIcon, 
  FileType,
  FileSpreadsheet,
  FileCode,
  Archive,
  Upload,
  Loader2
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/app/lib/utils';
import {
  validateFiles,
  formatFileSize,
  getFileCategory,
  needsConversion,
  FILE_CONFIG,
} from '@/app/lib/file-config';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
  multiple?: boolean;
  maxSize?: number; // in MB
  className?: string;
  existingFiles?: File[];
}

interface UploadedFile {
  file: File;
  preview?: string;
  id: string;
  progress?: number;
  converting?: boolean;
  error?: string;
}

export function FileUploadEnhanced({
  onFilesSelected,
  disabled = false,
  multiple = true,
  maxSize = FILE_CONFIG.maxFileSize / (1024 * 1024), // Convert to MB
  className,
  existingFiles = [],
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const dragCounter = useRef(0);

  // Process files with validation
  const processFiles = useCallback(async (files: File[]) => {
    setValidationErrors([]);
    
    // Validate files
    const validationResults = validateFiles(files, existingFiles);
    const errors: string[] = [];
    const validFiles: File[] = [];
    const newUploadedFiles: UploadedFile[] = [];

    for (const result of validationResults) {
      if (!result.valid && result.error) {
        errors.push(result.error);
      } else if (result.valid && result.file) {
        validFiles.push(result.file);
        
        const uploadedFile: UploadedFile = {
          file: result.file,
          id: `${Date.now()}-${Math.random()}`,
          progress: 0,
        };

        // Check if needs conversion
        if (needsConversion(result.file)) {
          uploadedFile.converting = true;
        }

        // Generate preview for images
        if (result.file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            uploadedFile.preview = e.target?.result as string;
            setUploadedFiles(prev => [...prev]);
          };
          reader.readAsDataURL(result.file);
        }

        newUploadedFiles.push(uploadedFile);
      }
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
    }

    if (validFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...newUploadedFiles]);
      onFilesSelected(validFiles);
      
      // Simulate upload progress
      newUploadedFiles.forEach((file) => {
        simulateProgress(file.id);
      });
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [existingFiles, onFilesSelected]);

  // Simulate upload progress (replace with real upload later)
  const simulateProgress = (fileId: string) => {
    const intervals = [10, 30, 60, 90, 100];
    let currentIndex = 0;

    const interval = setInterval(() => {
      if (currentIndex < intervals.length) {
        setUploadedFiles(prev =>
          prev.map(f =>
            f.id === fileId
              ? { ...f, progress: intervals[currentIndex], converting: false }
              : f
          )
        );
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 300);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    processFiles(files);
  };

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  // Enhanced drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  }, [processFiles]);

  // Get icon for file type
  const getFileIcon = (file: File) => {
    const category = getFileCategory(file.type);
    const iconClass = "w-8 h-8";
    
    switch (category) {
      case 'image':
        return <ImageIcon className={cn(iconClass, "text-blue-500")} />;
      case 'document':
        return <FileType className={cn(iconClass, "text-red-500")} />;
      case 'spreadsheet':
        return <FileSpreadsheet className={cn(iconClass, "text-green-500")} />;
      case 'code':
        return <FileCode className={cn(iconClass, "text-orange-500")} />;
      case 'archive':
        return <Archive className={cn(iconClass, "text-purple-500")} />;
      default:
        return <FileText className={cn(iconClass, "text-gray-400")} />;
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Drop zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-lg p-4 transition-all',
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          multiple={multiple}
          accept="*/*" // Accept all files, validate with our logic
          disabled={disabled}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-2">
          <Upload className={cn(
            "w-8 h-8",
            isDragging ? "text-blue-500" : "text-gray-400"
          )} />
          
          <div className="text-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className={cn(
                'text-sm font-medium',
                disabled
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-blue-600 hover:text-blue-500'
              )}
            >
              Click to upload
            </button>
            <span className="text-sm text-gray-500"> or drag and drop</span>
          </div>
          
          <p className="text-xs text-gray-500">
            Maximum file size: {formatFileSize(FILE_CONFIG.maxFileSize)}
          </p>
        </div>

        {/* Overlay when dragging */}
        {isDragging && (
          <div className="absolute inset-0 bg-blue-500 bg-opacity-10 rounded-lg pointer-events-none" />
        )}
      </div>

      {/* Validation errors */}
      {validationErrors.length > 0 && (
        <div className="space-y-1">
          {validationErrors.map((error, index) => (
            <p key={index} className="text-sm text-red-500">{error}</p>
          ))}
        </div>
      )}

      {/* Uploaded files preview */}
      {uploadedFiles.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {uploadedFiles.map(({ file, preview, id, progress, converting, error }) => (
            <div
              key={id}
              className="relative group bg-white border border-gray-200 rounded-lg overflow-hidden"
            >
              {preview ? (
                // Image preview
                <div className="aspect-square relative">
                  <Image
                    src={preview}
                    alt={file.name}
                    fill
                    className="object-cover"
                  />
                  {converting && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="text-white text-xs">Converting...</div>
                    </div>
                  )}
                </div>
              ) : (
                // File icon
                <div className="aspect-square flex flex-col items-center justify-center p-4 bg-gray-50">
                  {getFileIcon(file)}
                  <p className="mt-2 text-xs text-gray-600 text-center truncate w-full">
                    {file.name}
                  </p>
                </div>
              )}

              {/* Progress bar */}
              {progress !== undefined && progress < 100 && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}

              {/* Error state */}
              {error && (
                <div className="absolute inset-0 bg-red-500 bg-opacity-90 flex items-center justify-center p-2">
                  <p className="text-white text-xs text-center">{error}</p>
                </div>
              )}

              {/* File info overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-75 transition-opacity flex flex-col items-center justify-center p-2 opacity-0 group-hover:opacity-100">
                <p className="text-white text-xs font-medium truncate w-full text-center">
                  {file.name}
                </p>
                <p className="text-white text-xs mt-1">
                  {formatFileSize(file.size)}
                </p>
              </div>

              {/* Remove button */}
              <button
                onClick={() => removeFile(id)}
                className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove file"
              >
                <X className="w-3 h-3 text-gray-600" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Compact button for inline use */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors',
          disabled
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'hover:bg-gray-100 text-gray-600'
        )}
      >
        <Paperclip className="w-4 h-4" />
        <span>Attach files</span>
      </button>
    </div>
  );
}