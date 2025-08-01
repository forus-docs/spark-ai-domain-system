'use client';

import { Menu, Plus } from 'lucide-react';
import { useDomain } from '@/app/contexts/domain-context';
import { cn } from '@/app/lib/utils';

interface SparkAppBarProps {
  onMenuClick: () => void;
  onPlusClick: () => void;
}

export function SparkAppBar({ onMenuClick, onPlusClick }: SparkAppBarProps) {
  const { currentDomain } = useDomain();

  // If we have a current domain, show it with gradient
  if (currentDomain) {
    return (
      <div className={cn(
        "fixed md:sticky top-0 left-0 right-0 z-30",
        "bg-gradient-to-r",
        currentDomain.gradient
      )}>
        <div className="flex items-center justify-between h-14 px-3">
          {/* Left side - Plus button and Domain name */}
          <div className="flex items-center gap-3 flex-1">
            <button
              onClick={onPlusClick}
              className="p-1.5 hover:bg-white/10 rounded-md transition-colors"
              aria-label="Open workstream menu"
            >
              <Plus className="w-5 h-5 text-white" />
            </button>
            <h2 className="text-base font-bold text-white">{currentDomain.name}</h2>
          </div>

          {/* Right Menu Button */}
          <button
            onClick={onMenuClick}
            className="p-1.5 hover:bg-white/10 rounded-md transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    );
  }

  // No domain selected - show simple bar
  return (
    <div className="fixed md:sticky top-0 left-0 right-0 z-30 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-14 px-3">
        {/* Left side - Plus button and Title */}
        <div className="flex items-center gap-3 flex-1">
          <button
            onClick={onPlusClick}
            className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
            aria-label="Open workstream menu"
          >
            <Plus className="w-5 h-5" />
          </button>
          <h2 className="text-base font-semibold text-gray-900">NetBuild</h2>
        </div>

        {/* Right Menu Button */}
        <button
          onClick={onMenuClick}
          className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}