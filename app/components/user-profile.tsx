'use client';

import { useState } from 'react';
import { cn } from '@/app/lib/utils';
import { User, Settings, LogOut, ChevronUp } from 'lucide-react';
import { useAuth } from '@/app/contexts/auth-context';
import { useRouter } from 'next/navigation';

interface UserProfileProps {
  onNavigate?: () => void;
}

export function UserProfile({ onNavigate }: UserProfileProps = {}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) {
    return (
      <button
        onClick={() => {
          router.push('/auth');
          onNavigate?.();
        }}
        className="flex items-center justify-center gap-2 w-full p-2 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors"
      >
        <LogOut className="w-3 h-3" />
        <span className="text-sm font-medium">Sign In</span>
      </button>
    );
  }

  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative">
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="flex items-center gap-3 w-full p-2 rounded-md hover:bg-gray-100 transition-colors"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
          {initials}
        </div>
        
        <div className="flex-1 text-left">
          <div className="text-sm font-medium text-gray-900 truncate">
            {user.name}
          </div>
          <div className="text-xs text-gray-600 truncate">
            {user.email}
          </div>
        </div>
        <ChevronUp className={cn(
          "w-4 h-4 text-gray-400 transition-transform",
          !isMenuOpen && "rotate-180"
        )} />
      </button>

      {/* Dropdown Menu */}
      {isMenuOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-white rounded-md shadow-lg border border-gray-200 py-0.5 max-h-64 overflow-y-auto">
          <button className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            <User className="w-3 h-3" />
            View Profile
          </button>
          <button className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            <Settings className="w-3 h-3" />
            Settings
          </button>
          <hr className="my-0.5 border-gray-200" />
          <button 
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-3 h-3" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}