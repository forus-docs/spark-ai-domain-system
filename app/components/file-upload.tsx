'use client';

import React, { useRef, useState } from 'react';
import { Paperclip, X, FileText, Image as ImageIcon, FileType } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/app/lib/utils';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
  multiple?: boolean;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
}

interface UploadedFile {
  file: File;
  preview?: string;
  id: string;
}

export function FileUpload({
  onFilesSelected,
  disabled = false,
  multiple = true,
  accept = 'image/*,.pdf,.doc,.docx,.txt,.csv,.html',
  maxSize = 10, // 10MB default
  className
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    processFiles(files);
  };

  const processFiles = (files: File[]) => {
    setError(null);
    const maxSizeBytes = maxSize * 1024 * 1024;
    const validFiles: File[] = [];
    const newUploadedFiles: UploadedFile[] = [];

    files.forEach(file => {
      if (file.size > maxSizeBytes) {
        setError(`File "${file.name}" exceeds maximum size of ${maxSize}MB`);
        return;
      }

      validFiles.push(file);
      const uploadedFile: UploadedFile = {
        file,
        id: `${Date.now()}-${Math.random()}`,
      };

      // Generate preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          uploadedFile.preview = e.target?.result as string;
          setUploadedFiles(prev => [...prev]);
        };
        reader.readAsDataURL(file);
      }

      newUploadedFiles.push(uploadedFile);
    });

    if (validFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...newUploadedFiles]);
      onFilesSelected(validFiles);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* File input button */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className={cn(
            'p-2 rounded-md transition-colors',
            disabled 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'hover:bg-gray-100 text-gray-600'
          )}
          title="Attach files"
        >
          <Paperclip className="w-5 h-5" />
        </button>
        
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          multiple={multiple}
          accept={accept}
          disabled={disabled}
          className="hidden"
        />

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
      </div>

      {/* Uploaded files preview */}
      {uploadedFiles.length > 0 && (
        <div 
          className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {uploadedFiles.map(({ file, preview, id }) => (
            <div
              key={id}
              className="relative group bg-white border border-gray-200 rounded-md overflow-hidden"
            >
              {preview ? (
                // Image preview
                <div className="w-20 h-20 relative">
                  <Image
                    src={preview}
                    alt={file.name}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity" />
                </div>
              ) : (
                // File icon
                <div className="w-20 h-20 flex items-center justify-center bg-gray-50">
                  {file.type.includes('image') ? (
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  ) : file.type === 'application/pdf' ? (
                    <FileType className="w-8 h-8 text-red-500" />
                  ) : (
                    <FileText className="w-8 h-8 text-gray-400" />
                  )}
                </div>
              )}
              
              {/* File name tooltip */}
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                {file.name}
              </div>

              {/* Remove button */}
              <button
                onClick={() => removeFile(id)}
                className="absolute top-1 right-1 p-1 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3 text-gray-600" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}