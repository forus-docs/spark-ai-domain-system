'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  User, 
  CreditCard, 
  Calendar,
  Globe,
  FileText,
  AlertCircle,
  Users
} from 'lucide-react';
import { cn } from '@/app/lib/utils';

interface ExtractedFieldsDisplayProps {
  fields: Record<string, any>;
  requiredParameters?: Array<{
    name: string;
    displayName: string;
    type: string;
    validation?: {
      required?: boolean;
    };
  }>;
  className?: string;
  onFieldsConfirmed?: (fields: Record<string, any>) => void;
  onInjectMessage?: (message: string) => void;
}

interface FieldConfig {
  icon: React.ElementType;
  color: string;
  formatter?: (value: any) => string;
}

// Field configuration for better display
const fieldConfigs: Record<string, FieldConfig> = {
  firstName: { icon: User, color: 'blue' },
  lastName: { icon: User, color: 'blue' },
  idNumber: { icon: CreditCard, color: 'purple' },
  dateOfBirth: { 
    icon: Calendar, 
    color: 'green',
    formatter: (value) => {
      if (!value) return '';
      const date = new Date(value);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  },
  nationality: { icon: Globe, color: 'indigo' },
  gender: { icon: Users, color: 'pink' },
  documentType: { icon: FileText, color: 'orange' },
  documentExpiry: { 
    icon: Calendar, 
    color: 'red',
    formatter: (value) => {
      if (!value) return '';
      const date = new Date(value);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  },
  documentIssueDate: { 
    icon: Calendar, 
    color: 'teal',
    formatter: (value) => {
      if (!value) return '';
      const date = new Date(value);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  },
  // Add more field configurations as needed
};

export function ExtractedFieldsDisplay({ 
  fields, 
  requiredParameters,
  className,
  onFieldsConfirmed,
  onInjectMessage
}: ExtractedFieldsDisplayProps) {
  const [visibleFields, setVisibleFields] = useState<string[]>([]);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [editableFields, setEditableFields] = useState<Record<string, any>>({});
  const [isEditing, setIsEditing] = useState(false);

  // Get field entries to display
  const fieldEntries = useMemo(() => {
    return Object.entries(fields).filter(([key, value]) => {
      // Only show fields that are in requiredParameters if provided
      if (requiredParameters) {
        return requiredParameters.some(param => param.name === key);
      }
      return true;
    });
  }, [fields, requiredParameters]);

  // Initialize editable fields
  useEffect(() => {
    setEditableFields({ ...fields });
  }, [fields]);

  const getFieldDisplay = useCallback((fieldName: string) => {
    const param = requiredParameters?.find(p => p.name === fieldName);
    return param?.displayName || fieldName;
  }, [requiredParameters]);

  // Inject fields into chat stream when component mounts
  useEffect(() => {
    if (onInjectMessage && fieldEntries.length > 0) {
      // Create a message with field names and values
      const fieldsList = fieldEntries.map(([fieldName, value]) => {
        const displayName = getFieldDisplay(fieldName);
        const formattedValue = value === null || value === undefined ? 'Not provided' : value;
        return `**${displayName}**: ${formattedValue}`;
      }).join('\n');
      
      const message = `${fieldsList}\n\n*Status: Wait for Approval*`;
      onInjectMessage(message);
    }
  }, [fieldEntries, onInjectMessage, getFieldDisplay]);

  // Animate fields appearing one by one
  useEffect(() => {
    // Reset animation state when fields change
    setVisibleFields([]);
    setAnimationComplete(false);
    
    const timer = setTimeout(() => {
      fieldEntries.forEach(([key], index) => {
        setTimeout(() => {
          setVisibleFields(prev => [...prev, key]);
          if (index === fieldEntries.length - 1) {
            setTimeout(() => setAnimationComplete(true), 300);
          }
        }, index * 150); // 150ms delay between each field
      });
    }, 100); // Initial delay

    return () => clearTimeout(timer);
  }, [fieldEntries]);

  const getFieldIcon = (fieldName: string) => {
    const config = fieldConfigs[fieldName];
    const Icon = config?.icon || FileText;
    const color = config?.color || 'gray';
    
    // Color mapping to avoid dynamic class generation
    const colorClasses = {
      blue: 'bg-blue-100 text-blue-600',
      purple: 'bg-purple-100 text-purple-600',
      green: 'bg-green-100 text-green-600',
      indigo: 'bg-indigo-100 text-indigo-600',
      pink: 'bg-pink-100 text-pink-600',
      orange: 'bg-orange-100 text-orange-600',
      red: 'bg-red-100 text-red-600',
      teal: 'bg-teal-100 text-teal-600',
      gray: 'bg-gray-100 text-gray-600',
    };
    
    const colorClass = colorClasses[color as keyof typeof colorClasses] || colorClasses.gray;
    const [bgClass, textClass] = colorClass.split(' ');
    
    return (
      <div className={cn(
        'w-10 h-10 rounded-lg flex items-center justify-center',
        bgClass
      )}>
        <Icon className={cn('w-5 h-5', textClass)} />
      </div>
    );
  };

  const formatFieldValue = (fieldName: string, value: any) => {
    if (value === null || value === undefined) {
      return <span className="text-gray-400 italic">Not provided</span>;
    }
    
    const config = fieldConfigs[fieldName];
    if (config?.formatter) {
      return config.formatter(value);
    }
    
    return value.toString();
  };

  const handleFieldChange = (fieldName: string, value: string) => {
    setEditableFields(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleOkayClick = () => {
    if (onFieldsConfirmed) {
      onFieldsConfirmed(editableFields);
    }
    
    // Inject "Approved" message into chat stream
    if (onInjectMessage) {
      onInjectMessage('**Approved**');
    }
    
    setIsEditing(false);
  };

  const isFieldValid = (fieldName: string, value: any) => {
    const param = requiredParameters?.find(p => p.name === fieldName);
    if (param?.validation?.required && (value === null || value === undefined || value === '')) {
      return false;
    }
    return true;
  };

  // Since we're injecting the fields into the chat stream,
  // we just need to show a simple component that allows editing
  return (
    <div className={cn('space-y-3', className)}>
      {/* Simple editable fields display */}
      <div className="space-y-2">
        {fieldEntries.map(([fieldName, value]) => {
          const editableValue = editableFields[fieldName] || '';
          const isValid = isFieldValid(fieldName, editableValue);
          
          return (
            <div
              key={fieldName}
              className={cn(
                'flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg',
                !isValid && 'border-amber-200 bg-amber-50'
              )}
            >
              {/* Icon */}
              {getFieldIcon(fieldName)}
              
              {/* Field content */}
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-500 mb-1">
                  {getFieldDisplay(fieldName)}
                </div>
                <input
                  type="text"
                  value={editableValue || ''}
                  onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                  placeholder={editableValue === null ? 'Not provided' : ''}
                  className={cn(
                    'w-full text-sm font-medium bg-transparent border-none outline-none',
                    'focus:bg-gray-50 focus:px-2 focus:py-1 focus:rounded',
                    'transition-colors duration-200',
                    editableValue === null || editableValue === '' 
                      ? 'text-gray-400 italic' 
                      : 'text-gray-900'
                  )}
                />
              </div>
              
              {/* Validation indicator */}
              <div className="flex-shrink-0">
                {isValid ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-amber-500" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit prompt and OK button */}
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800 mb-3">
          Please edit the above information if it is incorrect, and tap &apos;Okay&apos; when done.
        </p>
        <button
          onClick={handleOkayClick}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Okay
        </button>
      </div>
    </div>
  );
}