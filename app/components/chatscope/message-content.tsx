/**
 * Custom message content component for ChatScope messages
 * Handles multi-part messages, code blocks, attachments, etc.
 */

'use client';

import React from 'react';
import { FileText, Download } from 'lucide-react';
import { IExecutionMessage } from '@/app/models/ExecutionMessage';
import { hasAttachments, getAttachments } from '@/app/lib/chat-transformers';
import { Markdown } from '../markdown';
import { CodeBlock } from '../code-block';
import { LinkPreview } from './link-preview';
import { SimpleLinkPreview } from './simple-link-preview';
import { extractUrls } from '@/app/lib/url-utils';

interface MessageContentProps {
  message: IExecutionMessage & { isStreaming?: boolean };
}

export function MessageContent({ message }: MessageContentProps) {
  const attachments = getAttachments(message);
  const hasFiles = attachments.length > 0;
  
  // Extract main text content
  let textContent = message.content || message.text || '';
  if (message.content_parts) {
    const textPart = message.content_parts.find(part => part.type === 'text');
    if (textPart) {
      textContent = textPart.text || textContent;
    }
  }

  // Only extract URLs from messages that:
  // 1. Have been saved (have messageId or _id)
  // 2. Are not currently streaming
  // 3. Have a createdAt timestamp (ensures they're not being typed)
  const isSavedMessage = (!!message.messageId || !!message._id) && 
                         !message.isStreaming && 
                         !!message.createdAt;
  
  // Extract URLs for link previews (but only from saved messages)
  const urls = isSavedMessage ? extractUrls(textContent, true) : [];
  
  // Remove duplicates by creating a Set of unique URLs
  const uniqueUrls = Array.from(new Set(urls.map(u => u.url)));
  const hasUrls = uniqueUrls.length > 0;

  // Render content following chat app best practices:
  // 1. Always show the full message text with markdown (URLs become clickable)
  // 2. Show link previews below the message for all URLs found
  const renderTextContent = () => {
    return (
      <>
        {/* Always show the full message text */}
        <Markdown content={textContent} />
        
        {/* Show link previews below the message (like WhatsApp, Slack, Discord) */}
        {hasUrls && (
          <div className="mt-3 space-y-2">
            {uniqueUrls.map((url, index) => (
              <div key={index} className="block">
                <LinkPreview url={url} />
              </div>
            ))}
          </div>
        )}
      </>
    );
  };

  return (
    <div className="message-content" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
      {/* Main text content with markdown support and link previews */}
      {textContent && (
        <div style={{ overflowX: 'hidden', wordBreak: 'break-word' }}>
          {renderTextContent()}
        </div>
      )}

      {/* Attachments */}
      {hasFiles && (
        <div className="mt-3 space-y-2">
          {attachments.map((attachment, index) => (
            <div key={index} className="flex items-center gap-2">
              {attachment.type === 'image' ? (
                <div className="relative">
                  <img
                    src={attachment.url}
                    alt="Attachment"
                    className="max-w-sm rounded-lg shadow-sm"
                  />
                </div>
              ) : (
                <a
                  href={attachment.url}
                  download={attachment.name}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <FileText className="h-4 w-4 text-gray-600" />
                  <span className="text-sm text-gray-700">{attachment.name || 'File'}</span>
                  {attachment.size && (
                    <span className="text-xs text-gray-500">
                      ({Math.round(attachment.size / 1024)}KB)
                    </span>
                  )}
                  <Download className="h-3 w-3 text-gray-600 ml-auto" />
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Code blocks from content_parts */}
      {message.content_parts?.filter(part => part.type === 'code').map((part, index) => (
        <div key={index} className="mt-3" style={{ overflowX: 'hidden', maxWidth: '100%' }}>
          <CodeBlock
            code={part.code?.content || ''}
            language={part.code?.language || 'text'}
          />
        </div>
      ))}
    </div>
  );
}