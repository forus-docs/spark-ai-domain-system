/**
 * Enhanced message footer component
 * Shows metadata, status, and actions for messages
 */

'use client';

import React from 'react';
import { MessageStatus } from './message-status';
import { Copy, RotateCcw } from 'lucide-react';
import { IExecutionMessage } from '@/app/models/ExecutionMessage';

interface MessageFooterProps {
  message: IExecutionMessage & { isStreaming?: boolean; status?: string };
  isUserMessage: boolean;
  onRetry?: () => void;
  onCopy?: () => void;
}

export function MessageFooter({ message, isUserMessage, onRetry, onCopy }: MessageFooterProps) {
  const showTokens = message.role === 'assistant' && message.tokenCount && !message.isStreaming;
  const showActions = !message.isStreaming;

  // Determine message status for user messages
  const getMessageStatus = () => {
    if (message.role !== 'user') return undefined;
    if (message.isStreaming) return 'sending';
    if (message.status === 'failed') return 'error';
    // For now, we'll show all sent messages as delivered
    // In a real app, you'd track actual delivery/read status
    return 'delivered';
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs mt-0.5">
      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
        {/* Timestamp and status for user messages */}
        {isUserMessage ? (
          <MessageStatus 
            status={getMessageStatus()}
            error={message.status === 'failed'}
            timestamp={message.createdAt}
          />
        ) : (
          <span className="text-gray-500 whitespace-nowrap">
            {new Date(message.createdAt).toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit' 
            })}
          </span>
        )}
        
        {/* Token count for AI messages - hide on very small screens */}
        {showTokens && message.tokenCount && (
          <span className="hidden sm:flex items-center gap-1.5">
            <span className="text-gray-400">•</span>
            <span className="text-gray-500 whitespace-nowrap">
              {message.tokenCount.toLocaleString()} tokens
            </span>
          </span>
        )}
        
        {/* AI Model - abbreviated on mobile */}
        {message.role === 'assistant' && message.endpoint && (
          <>
            <span className="text-gray-400">•</span>
            <span className="text-gray-500 whitespace-nowrap">
              <span className="sm:hidden">
                {message.endpoint === 'openai' ? 'GPT' : 'Gemini'}
              </span>
              <span className="hidden sm:inline">
                {message.endpoint === 'openai' ? 'GPT-4o-mini' : 'Gemini 1.5 Flash'}
              </span>
            </span>
          </>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1 self-end sm:self-auto">
        {showActions && onCopy && (
          <button
            onClick={onCopy}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors touch-manipulation"
            title="Copy message"
          >
            <Copy className="h-3 w-3" />
          </button>
        )}
        
        {/* Retry button for failed assistant messages */}
        {showActions && message.role === 'assistant' && message.status === 'failed' && onRetry && (
          <button
            onClick={onRetry}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors touch-manipulation"
            title="Retry message"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}