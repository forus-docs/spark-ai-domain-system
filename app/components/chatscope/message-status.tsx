/**
 * Message status indicator component
 * Shows sent, delivered, read states for messages
 */

'use client';

import React from 'react';
import { Check, CheckCheck, Clock, AlertCircle } from 'lucide-react';

interface MessageStatusProps {
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
  error?: boolean;
  timestamp?: Date;
}

export function MessageStatus({ status = 'sent', error, timestamp }: MessageStatusProps) {
  if (error) {
    return (
      <div className="flex items-center gap-1 text-red-500">
        <AlertCircle className="h-3 w-3" />
        <span className="text-xs">Failed to send</span>
      </div>
    );
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'sending':
        return <Clock className="h-3 w-3 text-gray-400" />;
      case 'sent':
        return <Check className="h-3 w-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center gap-1">
      {timestamp && (
        <span className="text-xs text-gray-500">
          {new Date(timestamp).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit' 
          })}
        </span>
      )}
      {getStatusIcon()}
    </div>
  );
}