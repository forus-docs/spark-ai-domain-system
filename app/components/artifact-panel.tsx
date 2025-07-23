'use client';

import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { ArtifactDisplay } from './artifact-display';

interface ArtifactPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onInteract?: (action: string, data?: any) => void;
  artifact: {
    type: string;
    title: string;
    content: string;
    data?: any;
  } | null;
}

export function ArtifactPanel({ isOpen, onClose, onInteract, artifact }: ArtifactPanelProps) {
  if (!artifact) return null;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}

      {/* Panel - Full screen on mobile */}
      <div className={cn(
        "fixed inset-0 bg-white z-50 transform transition-transform duration-300",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">{artifact.title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="h-full overflow-y-auto p-4" style={{ maxHeight: 'calc(100% - 64px)' }}>
          <ArtifactDisplay
            type={artifact.type as any}
            title={artifact.title}
            content={artifact.content}
            data={artifact.data}
            className="h-full"
            onInteract={onInteract}
          />
        </div>
      </div>
    </>
  );
}