/**
 * WhatsApp-style attachment menu component
 * Shows various attachment options when clicking the plus button
 */

'use client';

import React from 'react';
import { File, Image, User, BarChart3, Calendar, ListChecks, X } from 'lucide-react';

export type AttachmentType = 'file' | 'media' | 'contact' | 'poll' | 'event' | 'task';

interface AttachmentMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: AttachmentType) => void;
}

interface AttachmentOption {
  type: AttachmentType;
  label: string;
  icon: React.ReactNode;
  color: string;
  disabled?: boolean;
}

const attachmentOptions: AttachmentOption[] = [
  {
    type: 'file',
    label: 'File',
    icon: <File className="w-5 h-5" />,
    color: 'bg-blue-500',
  },
  {
    type: 'media',
    label: 'Photos & videos',
    icon: <Image className="w-5 h-5" />,
    color: 'bg-blue-500',
  },
  {
    type: 'contact',
    label: 'Contact',
    icon: <User className="w-5 h-5" />,
    color: 'bg-orange-500',
    disabled: true,
  },
  {
    type: 'poll',
    label: 'Poll',
    icon: <BarChart3 className="w-5 h-5" />,
    color: 'bg-yellow-500',
    disabled: true,
  },
  {
    type: 'event',
    label: 'Event',
    icon: <Calendar className="w-5 h-5" />,
    color: 'bg-red-500',
    disabled: true,
  },
  {
    type: 'task',
    label: 'Task',
    icon: <ListChecks className="w-5 h-5" />,
    color: 'bg-purple-500',
    disabled: true,
  },
];

export function AttachmentMenu({ isOpen, onClose, onSelect }: AttachmentMenuProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Menu */}
      <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 bg-white rounded-2xl shadow-2xl z-50 transform transition-all duration-200 animate-fade-in">
        <div className="p-4">
          {attachmentOptions.map((option) => (
            <button
              key={option.type}
              onClick={() => {
                if (!option.disabled) {
                  onSelect(option.type);
                  onClose();
                }
              }}
              disabled={option.disabled}
              className={`w-full flex items-center gap-4 p-3 rounded-lg transition-colors ${
                option.disabled 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-gray-50 cursor-pointer'
              }`}
            >
              <div className={`p-2.5 rounded-full ${
                option.disabled ? 'bg-gray-300' : option.color
              } text-white`}>
                {option.icon}
              </div>
              <span className={`font-medium text-left flex-1 ${
                option.disabled ? 'text-gray-400' : 'text-gray-900'
              }`}>
                {option.label}
              </span>
            </button>
          ))}
        </div>
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </>
  );
}