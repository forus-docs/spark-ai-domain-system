'use client';

import { useEffect, useRef, useState } from 'react';
import { Form } from '@bpmn-io/form-js-viewer';
import type { FormSchema } from '@/app/lib/services/conversational-form.service';
import { Check, Edit2 } from 'lucide-react';

interface FormMessageProps {
  type: 'form-field' | 'form-review';
  schema?: FormSchema;
  data?: Record<string, any>;
  fieldKey?: string;
  fieldValue?: any;
  onSubmit?: (data: Record<string, any>) => void;
  onFieldSubmit?: (fieldKey: string, value: any) => void;
  actions?: Array<{
    label: string;
    value: any;
  }>;
}

export function FormMessage({ 
  type, 
  schema, 
  data, 
  fieldKey, 
  fieldValue,
  onSubmit,
  onFieldSubmit,
  actions
}: FormMessageProps) {
  const formRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(fieldValue || '');

  useEffect(() => {
    if (type === 'form-review' && schema && formRef.current) {
      const formInstance = new Form({
        container: formRef.current
      });

      formInstance.importSchema(schema, data || {}).then(() => {
        setForm(formInstance);
      });

      return () => {
        formInstance.destroy();
      };
    }
  }, [type, schema, data]);

  // Handle single field interaction
  if (type === 'form-field' && fieldKey) {
    if (actions) {
      // Quick actions for extracted data
      return (
        <div className="bg-blue-50 rounded-lg p-4 mt-2">
          <p className="text-sm text-gray-700 mb-3">
            <span className="font-medium">{fieldKey}:</span> {fieldValue}
          </p>
          <div className="flex gap-2">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={() => {
                  if (action.value === null) {
                    setIsEditing(true);
                  } else {
                    onFieldSubmit?.(fieldKey, action.value);
                  }
                }}
                className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      );
    }

    // Manual input field
    if (isEditing || !fieldValue) {
      return (
        <div className="bg-gray-50 rounded-lg p-4 mt-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && inputValue) {
                  onFieldSubmit?.(fieldKey, inputValue);
                }
              }}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={`Enter ${fieldKey}`}
              autoFocus
            />
            <button
              onClick={() => {
                if (inputValue) {
                  onFieldSubmit?.(fieldKey, inputValue);
                }
              }}
              disabled={!inputValue}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Submit
            </button>
          </div>
        </div>
      );
    }
  }

  // Full form review
  if (type === 'form-review' && schema) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-4">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Review Your Information</h3>
          <p className="text-sm text-gray-600">Please verify all details are correct</p>
        </div>
        
        <div ref={formRef} className="form-js-container mb-4" />
        
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={async () => {
              if (form) {
                const { data: formData, errors } = form.submit();
                if (!errors || Object.keys(errors).length === 0) {
                  onSubmit?.(formData);
                }
              }
            }}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            Confirm & Submit
          </button>
          <button
            onClick={() => {
              // Allow editing individual fields
              setIsEditing(true);
            }}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </button>
        </div>
      </div>
    );
  }

  return null;
}

// Add styles for form-js
export const formJsStyles = `
  .form-js-container .fjs-container {
    font-family: inherit;
  }
  
  .form-js-container .fjs-form {
    padding: 0;
  }
  
  .form-js-container .fjs-element {
    margin-bottom: 1rem;
  }
  
  .form-js-container .fjs-input,
  .form-js-container .fjs-textarea,
  .form-js-container .fjs-select {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 0.875rem;
  }
  
  .form-js-container .fjs-input:focus,
  .form-js-container .fjs-textarea:focus,
  .form-js-container .fjs-select:focus {
    outline: none;
    border-color: #3b82f6;
    ring: 2px;
    ring-color: #3b82f6;
  }
  
  .form-js-container .fjs-label {
    display: block;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
  }
  
  .form-js-container .fjs-errors {
    margin-top: 0.25rem;
    font-size: 0.875rem;
    color: #dc2626;
  }
`;