/**
 * Custom avatar component for ChatScope messages
 */

'use client';

import React from 'react';
import { Bot, User } from 'lucide-react';

interface MessageAvatarProps {
  role: 'user' | 'assistant' | 'system';
  userName?: string;
}

export function MessageAvatar({ role, userName }: MessageAvatarProps) {
  if (role === 'assistant') {
    return (
      <div className="w-full h-full rounded-full bg-blue-500 flex items-center justify-center">
        <Bot className="h-2 w-2 text-white" />
      </div>
    );
  }

  if (role === 'user') {
    return (
      <div className="w-full h-full rounded-full bg-gray-600 flex items-center justify-center">
        {userName ? (
          <span className="text-white text-[0.4rem] font-medium">
            {userName.charAt(0).toUpperCase()}
          </span>
        ) : (
          <User className="h-2 w-2 text-white" />
        )}
      </div>
    );
  }

  // System messages
  return (
    <div className="w-full h-full rounded-full bg-gray-400 flex items-center justify-center">
      <span className="text-white text-[0.3rem]">S</span>
    </div>
  );
}