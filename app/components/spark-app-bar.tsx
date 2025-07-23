'use client';

import { Menu } from 'lucide-react';
import { useDomain } from '@/app/contexts/domain-context';
import { cn } from '@/app/lib/utils';

interface SparkAppBarProps {
  onMenuClick: () => void;
  onLeftMenuClick: () => void;
}

export function SparkAppBar({ onMenuClick, onLeftMenuClick }: SparkAppBarProps) {
  const { currentDomain } = useDomain();

  // If we have a current domain, show it with gradient
  if (currentDomain) {
    return (
      <div className={cn(
        "sticky top-0 z-30",
        "bg-gradient-to-r",
        currentDomain.gradient
      )}>
        <div className="flex items-center justify-between h-14 px-3">
          {/* Left Menu Button */}
          <button
            onClick={onLeftMenuClick}
            className="p-1.5 hover:bg-white/10 rounded-md transition-colors"
            aria-label="Open left menu"
          >
            <Menu className="w-5 h-5 text-white" />
          </button>

          {/* Domain Name - Centered */}
          <div className="flex-1 flex items-center justify-center">
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
    <div className="sticky top-0 z-30 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-14 px-3">
        {/* Left Menu Button */}
        <button
          onClick={onLeftMenuClick}
          className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
          aria-label="Open left menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex-1 flex items-center justify-center">
          <h2 className="text-base font-semibold text-gray-900">Spark AI</h2>
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