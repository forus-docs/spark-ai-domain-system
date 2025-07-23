'use client';

import React from 'react';
import { FileJson, Eye } from 'lucide-react';
import { cn } from '@/app/lib/utils';

interface ArtifactButtonProps {
  title: string;
  type: string;
  onClick: () => void;
  className?: string;
}

export function ArtifactButton({ title, type, onClick, className }: ArtifactButtonProps) {
  const getIcon = () => {
    switch (type) {
      case 'form':
        return <FileJson className="w-5 h-5" />;
      default:
        return <Eye className="w-5 h-5" />;
    }
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative my-3 w-full max-w-md rounded-lg border border-gray-200 bg-gray-50 p-3 text-left transition-all hover:border-gray-300 hover:shadow-md",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 text-gray-600">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 truncate">{title}</div>
          <div className="text-sm text-gray-500">Click to view {type}</div>
        </div>
      </div>
    </button>
  );
}