/**
 * Simple link preview component that renders links nicely without external dependencies
 */

'use client';

import React from 'react';
import { Link2 } from 'lucide-react';

interface SimpleLinkPreviewProps {
  url: string;
  className?: string;
}

export function SimpleLinkPreview({ url, className }: SimpleLinkPreviewProps) {
  // Extract domain from URL
  const getDomain = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  const domain = getDomain(url);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`block p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors ${className || ''}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-white rounded-lg border border-gray-200 flex items-center justify-center">
          <Link2 className="w-5 h-5 text-gray-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{domain}</p>
          <p className="text-xs text-gray-500 truncate mt-0.5">{url}</p>
        </div>
      </div>
    </a>
  );
}