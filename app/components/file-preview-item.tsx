'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';

interface FilePreviewItemProps {
  file: File;
  index: number;
  onRemove: (index: number) => void;
}

export function FilePreviewItem({ file, index, onRemove }: FilePreviewItemProps) {
  const isImage = file.type.startsWith('image/');
  const [preview, setPreview] = useState<string | null>(null);
  
  // Create a stable key for the file
  const fileKey = `${file.name}-${file.size}-${file.lastModified}`;
  
  useEffect(() => {
    let mounted = true;
    
    if (isImage && file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (mounted && e.target?.result) {
          setPreview(e.target.result as string);
        }
      };
      reader.onerror = () => {
        console.error('Error reading file');
      };
      try {
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Error processing file:', error);
      }
    }
    
    return () => {
      mounted = false;
    };
  }, [fileKey, isImage]); // Use stable key instead of file object
  
  return (
    <div className="relative group">
      {isImage && preview ? (
        <div className="relative h-10 w-10 rounded border border-gray-200 overflow-hidden">
          <Image
            src={preview}
            alt={file.name}
            fill
            className="object-cover"
            sizes="40px"
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity" />
        </div>
      ) : (
        <div className="flex items-center gap-1 h-10 bg-white px-2 rounded border border-gray-200">
          <span className="text-sm text-gray-600 truncate max-w-[100px]">{file.name}</span>
        </div>
      )}
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="absolute -top-1 -right-1 p-0.5 bg-white rounded-full shadow-md border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="w-3 h-3 text-gray-600" />
      </button>
    </div>
  );
}