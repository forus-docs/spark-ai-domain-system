'use client';

import { useState, useRef, useEffect } from 'react';
import { useDomain } from '@/app/contexts/domain-context';
import { cn } from '@/app/lib/utils';
import { ChevronDown, Check } from 'lucide-react';

interface DomainSelectorProps {
  onSelect?: () => void;
}

export function DomainSelector({ onSelect }: DomainSelectorProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { currentDomain, joinedDomains, setCurrentDomain } = useDomain();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (joinedDomains.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        No domains joined yet
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between px-2 py-1.5 text-left",
          "bg-white border border-gray-200 rounded-md",
          "hover:bg-gray-50 transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="flex-1 min-w-0">
          <div className="text-xs text-gray-600">Current Domain</div>
          <div className="font-medium text-sm text-gray-900 truncate">
            {currentDomain?.name || 'Select a domain'}
          </div>
        </div>
        <ChevronDown className={cn(
          "w-4 h-4 text-gray-400 transition-transform ml-2",
          isOpen && "transform rotate-180"
        )} />
      </button>

      {isOpen && (
        <div className={cn(
          "absolute z-50 w-full mt-1",
          "bg-white rounded-md shadow-lg border border-gray-200",
          "py-1 max-h-60 overflow-y-auto overflow-x-hidden"
        )}>
          {joinedDomains.map((membership) => {
            const isSelected = currentDomain?.id === membership.domain.id;
            
            return (
              <button
                key={membership.domain.id}
                onClick={() => {
                  setCurrentDomain(membership.domain);
                  setIsOpen(false);
                  onSelect?.();
                }}
                className={cn(
                  "w-full flex items-center justify-between px-2 py-1.5 text-left",
                  "hover:bg-gray-50 transition-colors",
                  isSelected && "bg-gray-50"
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-900 truncate">
                    {membership.domain.name}
                  </div>
                  <div className="text-xs text-gray-600">
                    {membership.role.name}
                  </div>
                </div>
                {isSelected && (
                  <Check className="w-4 h-4 text-green-600 ml-2 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}