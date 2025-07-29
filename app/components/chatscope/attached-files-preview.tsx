/**
 * Preview component for files attached to a message before sending
 */

'use client';

import React from 'react';
import { X, FileText, Image as ImageIcon } from 'lucide-react';

interface AttachedFilesPreviewProps {
  files: File[];
  onRemove: (index: number) => void;
}

export function AttachedFilesPreview({ files, onRemove }: AttachedFilesPreviewProps) {
  if (files.length === 0) return null;

  return (
    <div className="border-t border-gray-200 p-2 bg-gray-50">
      <div className="flex flex-wrap gap-1.5">
        {files.map((file, index) => (
          <div
            key={index}
            className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2 py-1.5 group"
          >
            {file.type.startsWith('image/') ? (
              <ImageIcon className="h-3 w-3 text-blue-500" />
            ) : (
              <FileText className="h-3 w-3 text-gray-500" />
            )}
            
            <span className="text-xs text-gray-700 max-w-[120px] truncate">
              {file.name}
            </span>
            
            <span className="text-xs text-gray-500">
              ({Math.round(file.size / 1024)}KB)
            </span>
            
            <button
              onClick={() => onRemove(index)}
              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}