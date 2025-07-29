/**
 * Link preview component using Microlink
 */

'use client';

import React, { useState } from 'react';
import Microlink from '@microlink/react';
import { Loader2 } from 'lucide-react';
import { isValidUrl } from '@/app/lib/url-utils';

// Cache failed URLs to prevent repeated attempts
const failedUrlCache = new Set<string>();

interface LinkPreviewProps {
  url: string;
  className?: string;
  onError?: (error: Error) => void;
}

export function LinkPreview({ url, className, onError }: LinkPreviewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [timedOut, setTimedOut] = useState(false);
  
  // Set a shorter timeout to prevent hanging on invalid URLs
  React.useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        setTimedOut(true);
        setError(true);
        setLoading(false);
        setShowPreview(false);
      }
    }, 3000); // 3 second timeout - much shorter

    return () => clearTimeout(timeout);
  }, [loading, url]);
  
  // Validate URL more strictly
  const isValid = isValidUrl(url);
  
  // Simple link component
  const SimpleLinkFallback = () => (
    <a 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer"
      className="text-blue-600 hover:underline break-all inline-block"
    >
      {url}
    </a>
  );
  
  // Return early if URL is invalid - no console warning to reduce noise
  if (!isValid) {
    return <SimpleLinkFallback />;
  }
  
  // Check if this URL has failed before
  if (failedUrlCache.has(url)) {
    return <SimpleLinkFallback />;
  }
  
  // Skip preview for certain domains known to cause issues
  const problematicDomains = ['localhost', '127.0.0.1', '0.0.0.0'];
  try {
    const urlObj = new URL(url);
    if (problematicDomains.some(domain => urlObj.hostname.includes(domain))) {
      return <SimpleLinkFallback />;
    }
  } catch {
    return <SimpleLinkFallback />;
  }

  const handleError = (err: Error) => {
    // Silently fail - no console logging to reduce noise
    setError(true);
    setLoading(false);
    setShowPreview(false);
    // Cache this URL as failed
    failedUrlCache.add(url);
    onError?.(err);
  };

  const handleSuccess = () => {
    setLoading(false);
    setError(false);
    setTimedOut(false);
  };


  if (error || !showPreview) {
    return <SimpleLinkFallback />;
  }

  return (
    <div className={`relative inline-block ${className || ''}`}>
      {loading && (
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          <span className="text-sm text-gray-500">Loading preview...</span>
        </div>
      )}
      <div style={{ display: loading ? 'none' : 'block' }}>
        <Microlink
          url={url}
          size="large"
          media={['image', 'logo', 'video']}
          style={{
            maxWidth: '100%',
            borderRadius: '0.5rem',
            border: '1px solid #e5e7eb',
            fontFamily: 'inherit',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
          }}
          onLoad={handleSuccess}
          onError={handleError}
          loading="lazy"
        />
      </div>
    </div>
  );
}