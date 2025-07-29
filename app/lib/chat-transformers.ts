/**
 * Transformation utilities for converting between our internal message format
 * and @chatscope/chat-ui-kit-react message format
 */

import { IExecutionMessage } from '@/app/models/ExecutionMessage';
import { format } from 'date-fns';

// @chatscope types (we'll define minimal types here to avoid import issues)
export interface MessageModel {
  message: string;
  sentTime: string;
  sender: string;
  direction: 'incoming' | 'outgoing';
  position: 'single' | 'first' | 'normal' | 'last';
  type?: 'html' | 'text' | 'image' | 'custom';
}

/**
 * Calculate message position for proper grouping in chat UI
 */
function calculatePosition(
  msg: IExecutionMessage,
  prevMsg: IExecutionMessage | null,
  nextMsg: IExecutionMessage | null
): 'single' | 'first' | 'normal' | 'last' {
  const hasPrev = prevMsg && prevMsg.role === msg.role;
  const hasNext = nextMsg && nextMsg.role === msg.role;
  
  if (!hasPrev && !hasNext) return 'single';
  if (!hasPrev && hasNext) return 'first';
  if (hasPrev && hasNext) return 'normal';
  return 'last';
}

/**
 * Determine message type based on content_parts
 */
function determineMessageType(msg: IExecutionMessage): MessageModel['type'] {
  // We'll use custom type for all messages to have full control over rendering
  return 'custom';
}

/**
 * Transform IExecutionMessage to MessageModel for @chatscope
 */
export function toChatscopeMessage(
  msg: IExecutionMessage & { isStreaming?: boolean },
  currentUserId: string,
  prevMsg: IExecutionMessage | null = null,
  nextMsg: IExecutionMessage | null = null
): MessageModel {
  const isUserMessage = msg.userId === currentUserId && msg.role === 'user';
  
  // For streaming messages, show partial content
  const content = msg.isStreaming 
    ? (msg.content || msg.text || '...') 
    : (msg.content || msg.text || '');
  
  return {
    message: content,
    sentTime: format(new Date(msg.createdAt), 'HH:mm'),
    sender: msg.role === 'assistant' ? 'AI Assistant' : 'You',
    direction: 'incoming', // Always use incoming for consistent layout
    position: calculatePosition(msg, prevMsg, nextMsg),
    type: determineMessageType(msg)
  };
}

/**
 * Check if message has attachments
 */
export function hasAttachments(msg: IExecutionMessage): boolean {
  return !!(msg.content_parts && msg.content_parts.some(part => 
    part.type === 'image_url' || part.type === 'file'
  ));
}

/**
 * Get attachment details from message
 */
export function getAttachments(msg: IExecutionMessage): Array<{
  type: 'image' | 'file';
  url?: string;
  name?: string;
  size?: number;
}> {
  if (!msg.content_parts) return [];
  
  return msg.content_parts
    .filter(part => part.type === 'image_url' || part.type === 'file')
    .map(part => {
      if (part.type === 'image_url') {
        return {
          type: 'image' as const,
          url: part.image_url?.url
        };
      } else if (part.type === 'file') {
        return {
          type: 'file' as const,
          url: part.file?.url,
          name: part.file?.name,
          size: part.file?.size
        };
      }
      return null;
    })
    .filter(Boolean) as any[];
}

/**
 * Transform input from @chatscope MessageInput to partial IExecutionMessage
 */
export function fromChatscopeInput(
  input: string,
  userId: string
): Partial<IExecutionMessage> {
  return {
    content: input,
    text: input,
    role: 'user',
    userId: userId,
    createdAt: new Date(),
    isCreatedByUser: true,
    content_parts: [{
      type: 'text',
      text: input
    }]
  };
}

/**
 * Extract display content from IExecutionMessage
 * Handles multi-part messages and different content types
 */
export function extractDisplayContent(msg: IExecutionMessage): {
  primaryContent: string;
  hasAttachments: boolean;
  attachmentCount: number;
} {
  let primaryContent = msg.content || msg.text || '';
  let hasAttachments = false;
  let attachmentCount = 0;
  
  if (msg.content_parts && msg.content_parts.length > 0) {
    // Find the primary text content
    const textPart = msg.content_parts.find(part => part.type === 'text');
    if (textPart) {
      primaryContent = textPart.text || primaryContent;
    }
    
    // Count non-text attachments
    const attachments = msg.content_parts.filter(part => 
      part.type !== 'text' && part.type !== 'code'
    );
    hasAttachments = attachments.length > 0;
    attachmentCount = attachments.length;
  }
  
  return {
    primaryContent,
    hasAttachments,
    attachmentCount
  };
}