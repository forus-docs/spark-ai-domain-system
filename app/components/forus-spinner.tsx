'use client';

import React from 'react';
import { cn } from '@/app/lib/utils';

interface ForusSpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

export function ForusSpinner({ className, size = 'md', message }: ForusSpinnerProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <div className={cn('flex flex-col items-center justify-center', className)}>
      <div className={cn(
        'relative',
        sizeClasses[size]
      )}>
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
        
        {/* Spinning gradient ring */}
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 animate-spin"></div>
        
        {/* Forus logo placeholder - you can replace with actual logo */}
        <div className="absolute inset-2 rounded-full bg-white flex items-center justify-center">
          <span className="text-xs font-bold text-blue-600">F</span>
        </div>
      </div>
      
      {message && (
        <p className="mt-4 text-sm text-gray-600">{message}</p>
      )}
    </div>
  );
}