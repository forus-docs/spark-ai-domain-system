'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Search, Plus, Library } from 'lucide-react';
import { cn } from '@/app/lib/utils';

interface TaskCommandOption {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  available: boolean;
}

interface TaskCommandPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectExistingTask: () => void;
  onCreateNewTask: () => void;
  onRequestFromLibrary: () => void;
  anchorRef?: React.RefObject<HTMLElement>;
}

export function TaskCommandPopup({
  isOpen,
  onClose,
  onSelectExistingTask,
  onCreateNewTask,
  onRequestFromLibrary,
  anchorRef
}: TaskCommandPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [position, setPosition] = useState({ bottom: 0, left: 0 });

  const options: TaskCommandOption[] = [
    {
      id: 'browse',
      label: 'Browse Available Tasks',
      description: 'Select from tasks already in your domain',
      icon: <Search className="w-5 h-5" />,
      action: () => {
        onSelectExistingTask();
        onClose();
      },
      available: true
    },
    {
      id: 'create',
      label: 'Create New Task',
      description: 'Coming soon via admin portal',
      icon: <Plus className="w-5 h-5" />,
      action: () => {
        onCreateNewTask();
        onClose();
      },
      available: false
    },
    {
      id: 'request',
      label: 'Request from Library',
      description: 'Notify admins to adopt a task',
      icon: <Library className="w-5 h-5" />,
      action: () => {
        onRequestFromLibrary();
        onClose();
      },
      available: false
    }
  ];

  // Calculate position based on anchor element
  useEffect(() => {
    if (anchorRef?.current && isOpen) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPosition({
        bottom: window.innerHeight - rect.top + 8,
        left: rect.left
      });
    }
  }, [isOpen, anchorRef]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
          break;
        case 'Enter':
          e.preventDefault();
          const selectedOption = options[selectedIndex];
          if (selectedOption.available) {
            selectedOption.action();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case '1':
        case '2':
        case '3':
          e.preventDefault();
          const index = parseInt(e.key) - 1;
          if (index < options.length && options[index].available) {
            options[index].action();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, options, onClose]);

  // Handle click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Delay to prevent immediate close on open
    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={popupRef}
      className="fixed z-50 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden"
      style={{
        bottom: `${position.bottom}px`,
        left: `${position.left}px`
      }}
    >
      <div className="p-2">
        <div className="text-xs font-medium text-gray-500 px-3 py-1.5">
          Task Commands
        </div>
        <div className="space-y-1">
          {options.map((option, index) => (
            <button
              key={option.id}
              onClick={() => option.available && option.action()}
              onMouseEnter={() => setSelectedIndex(index)}
              disabled={!option.available}
              className={cn(
                "w-full flex items-start gap-3 px-3 py-2 rounded-md transition-colors text-left",
                selectedIndex === index && "bg-gray-100",
                !option.available && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className={cn(
                "flex-shrink-0 mt-0.5",
                selectedIndex === index ? "text-blue-600" : "text-gray-400"
              )}>
                {option.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-sm font-medium",
                    selectedIndex === index ? "text-gray-900" : "text-gray-700"
                  )}>
                    {option.label}
                  </span>
                  <span className="text-xs text-gray-400">
                    {index + 1}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {option.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
      <div className="border-t border-gray-100 px-3 py-2 bg-gray-50">
        <p className="text-xs text-gray-500">
          Use arrow keys to navigate, Enter to select, or press 1-3
        </p>
      </div>
    </div>
  );
}