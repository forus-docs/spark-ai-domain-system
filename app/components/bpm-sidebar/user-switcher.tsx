'use client';

import { useState } from 'react';
import { ChevronDown, User } from 'lucide-react';
import { useCamunda } from '@/app/contexts/camunda-context';

export function UserSwitcher() {
  const { currentUser, setCurrentUser, availableUsers } = useCamunda();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-md hover:bg-orange-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <div className="text-sm font-medium text-gray-900">
              {currentUser?.displayName}
            </div>
            <div className="text-xs text-gray-500">@{currentUser?.username}</div>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-20">
            {availableUsers.map((user) => (
              <button
                key={user.username}
                onClick={() => {
                  setCurrentUser(user);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors ${
                  currentUser?.username === user.username ? 'bg-orange-50' : ''
                }`}
              >
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="text-left flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {user.displayName}
                  </div>
                  <div className="text-xs text-gray-500">@{user.username}</div>
                </div>
                {currentUser?.username === user.username && (
                  <div className="w-2 h-2 bg-orange-500 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}