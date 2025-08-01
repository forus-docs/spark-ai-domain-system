'use client';

import React from 'react';
import { X, Sparkles } from 'lucide-react';

interface TaskCreationStubModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'create' | 'request';
}

export function TaskCreationStubModal({ isOpen, onClose, type }: TaskCreationStubModalProps) {
  if (!isOpen) return null;

  const content = type === 'create' ? {
    title: 'Create New Task',
    icon: <Sparkles className="w-12 h-12 text-blue-500" />,
    heading: 'Task Creation Coming Soon',
    description: 'Domain administrators will soon be able to create custom tasks directly from the admin portal.',
    features: [
      'Create tasks tailored to your domain needs',
      'Set up forms, SOPs, and workflows',
      'Configure AI assistance and parameters',
      'Assign tasks to specific roles'
    ]
  } : {
    title: 'Request Task from Library',
    icon: <Sparkles className="w-12 h-12 text-purple-500" />,
    heading: 'Task Library Requests Coming Soon',
    description: 'You\'ll be able to browse the master task library and request tasks for your domain.',
    features: [
      'Browse comprehensive task library',
      'Request tasks relevant to your work',
      'Admins receive adoption notifications',
      'Track request status and updates'
    ]
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">{content.title}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex flex-col items-center text-center mb-6">
            {content.icon}
            <h3 className="text-xl font-semibold text-gray-900 mt-4">
              {content.heading}
            </h3>
            <p className="text-sm text-gray-600 mt-2">
              {content.description}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Upcoming Features:
            </h4>
            <ul className="space-y-2">
              {content.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {type === 'create' && (
            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <p className="text-xs text-blue-700">
                <strong>Note:</strong> Task creation will be available through the admin portal to ensure proper governance and quality control.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}