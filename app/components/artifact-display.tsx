'use client';

import React from 'react';
import { cn } from '@/app/lib/utils';
import { Copy, Check, FileJson, Maximize2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

interface ArtifactDisplayProps {
  type: 'form' | 'react' | 'html' | 'mermaid' | 'svg' | 'data' | 'error';
  title?: string;
  content: string;
  data?: any;
  className?: string;
  onInteract?: (action: string, data?: any) => void;
}

export function ArtifactDisplay({ 
  type, 
  title,
  content, 
  data,
  className,
  onInteract 
}: ArtifactDisplayProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // For error artifacts, render error display
  if (type === 'error' && data?.error) {
    const error = data.error;
    const severity: 'error' | 'warning' | 'info' = error.severity || 'error';
    const SeverityIcon = {
      error: AlertCircle,
      warning: AlertTriangle,
      info: Info
    }[severity] || AlertCircle;

    const severityStyles: Record<'error' | 'warning' | 'info', string> = {
      error: 'bg-red-50 border-red-200 text-red-800',
      warning: 'bg-amber-50 border-amber-200 text-amber-800',
      info: 'bg-blue-50 border-blue-200 text-blue-800'
    };
    const severityStyle = severityStyles[severity] || severityStyles.error;

    return (
      <div className={cn('border rounded-lg overflow-hidden', className, severityStyle)}>
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3">
          <SeverityIcon className="w-5 h-5" />
          <span className="font-medium">
            {error.code || 'Error'}
          </span>
        </div>

        {/* Error Message */}
        <div className="px-4 pb-3">
          <p className="text-sm mb-3">{error.message}</p>
          
          {/* Suggestions */}
          {data.recovery?.suggestions && data.recovery.suggestions.length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-medium mb-2">Suggestions:</p>
              <ul className="list-disc list-inside text-sm space-y-1 pl-2">
                {data.recovery.suggestions.map((suggestion: string, idx: number) => (
                  <li key={idx}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          {data.recovery?.actions && data.recovery.actions.length > 0 && (
            <div className="mt-4 flex gap-2">
              {data.recovery.actions.map((action: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => onInteract?.(action.action)}
                  className="px-3 py-1.5 text-sm bg-white border rounded-md hover:bg-gray-50 transition-colors"
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // For form artifacts, render an interactive form
  if (type === 'form' && data?.fields) {
    return (
      <div className={cn('border border-gray-200 rounded-lg artifact-form-container', className)}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FileJson className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">
              {title || 'Form Artifact'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="p-1.5 hover:bg-gray-200 rounded transition-colors"
              title="Copy form data"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 text-gray-600" />
              )}
            </button>
            <button
              onClick={() => onInteract?.('fullscreen')}
              className="p-1.5 hover:bg-gray-200 rounded transition-colors"
              title="View fullscreen"
            >
              <Maximize2 className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-4 bg-white overflow-visible">
          {data?.description && (
            <p className="text-sm text-gray-600 mb-4">{data.description}</p>
          )}
          
          <form className="space-y-4">
            {Object.entries(data.fields).map(([fieldName, fieldValue]) => {
              const fieldConfig = data.requiredParameters?.find(
                (param: any) => param.name === fieldName
              );
              
              return (
                <div key={fieldName}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {fieldConfig?.displayName || fieldName}
                    {(fieldConfig?.validation?.required || data.validation?.required?.[fieldName]) && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </label>
                  <input
                    type="text"
                    name={fieldName}
                    defaultValue={String(fieldValue || '')}
                    placeholder={fieldValue === null ? 'Not provided' : ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => {
                      onInteract?.('field-change', {
                        field: fieldName,
                        value: e.target.value
                      });
                    }}
                  />
                </div>
              );
            })}
          </form>

          {/* Validation Status */}
          {data?.validation && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <p className="text-sm text-amber-800">
                {data.validation.allRequiredFieldsFound 
                  ? '✅ All required fields found' 
                  : `⚠️ Missing fields: ${data.validation.missingFields?.join(', ')}`}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex gap-3 justify-end">
            {data?.actions?.includes('cancel') !== false && (
              <button
                type="button"
                onClick={() => onInteract?.('cancel')}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {data?.cancelText || 'Cancel'}
              </button>
            )}
            {data?.actions?.includes('submit') !== false && (
              <button
                type="button"
                onClick={() => onInteract?.('submit', data.fields)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {data?.submitText || 'Submit'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // For other artifact types, show a placeholder for now
  return (
    <div className={cn('border border-gray-200 rounded-lg overflow-hidden', className)}>
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <span className="text-sm font-medium text-gray-900">
          {title || `${type} Artifact`}
        </span>
      </div>
      <div className="p-4 bg-gray-100">
        <pre className="text-sm text-gray-600 whitespace-pre-wrap">{content}</pre>
      </div>
    </div>
  );
}