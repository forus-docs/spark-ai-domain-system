'use client';

import { useState } from 'react';
import { ChevronDown, User } from 'lucide-react';
import { useCamunda } from '@/app/contexts/camunda-context';
import { cn } from '@/app/lib/utils';

export function UserSwitcherChip() {
  const { currentUser, setCurrentUser, availableUsers, authStatus } = useCamunda();
  const [isOpen, setIsOpen] = useState(false);

  // Extract first name from display name
  const getFirstName = (displayName: string) => {
    return displayName.split(' ')[0];
  };

  // Get border color based on auth status
  const getBorderClass = () => {
    switch (authStatus) {
      case 'authenticated':
        return 'border-2 border-green-500';
      case 'failed':
        return 'border-2 border-red-500';
      case 'checking':
        return 'border-2 border-amber-500 animate-pulse';
      default:
        return 'border border-orange-200';
    }
  };

  // Get tooltip text based on auth status
  const getTooltipText = () => {
    switch (authStatus) {
      case 'authenticated':
        return 'Connected to Camunda';
      case 'failed':
        return 'Authentication failed';
      case 'checking':
        return 'Verifying credentials...';
      default:
        return 'Select user';
    }
  };

  return (
    <div className="relative hidden md:block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        title={getTooltipText()}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 text-orange-900 rounded-full hover:bg-orange-200 transition-all text-sm font-medium",
          getBorderClass()
        )}
      >
        <span>{getFirstName(currentUser?.displayName || 'User')}</span>
        <ChevronDown className={cn(
          "w-3.5 h-3.5 transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-20">
            {availableUsers.map((user) => (
              <button
                key={user.username}
                onClick={() => {
                  setCurrentUser(user);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors text-left",
                  currentUser?.username === user.username && "bg-orange-50"
                )}
              >
                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-3 h-3 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {user.displayName}
                  </div>
                  <div className="text-xs text-gray-500">@{user.username}</div>
                </div>
                {currentUser?.username === user.username && (
                  <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}