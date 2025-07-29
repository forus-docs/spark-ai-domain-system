'use client';

import React, { useRef } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/app/lib/utils';

interface FileUploadSimpleProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
  multiple?: boolean;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
}

export function FileUploadSimple({
  onFilesSelected,
  disabled = false,
  multiple = true,
  accept = 'image/*,.pdf,.doc,.docx,.txt,.csv,.html',
  maxSize = 10, // 10MB default
  className
}: FileUploadSimpleProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    processFiles(files);
  };

  const processFiles = (files: File[]) => {
    const maxSizeBytes = maxSize * 1024 * 1024;
    const validFiles: File[] = [];

    files.forEach(file => {
      if (file.size > maxSizeBytes) {
        // You could pass an onError callback if needed
        console.error(`File "${file.name}" exceeds maximum size of ${maxSize}MB`);
        return;
      }
      validFiles.push(file);
    });

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
    <div 
      className={cn('relative', className)}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
        className={cn(
          'p-2.5 rounded-full transition-colors',
          disabled 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
        )}
        title="Attach files"
      >
        <Plus className="w-5 h-5" />
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
    </div>
  );
}