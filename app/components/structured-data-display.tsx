'use client';

import React from 'react';
import { ChevronRight, ChevronDown, Copy, Check } from 'lucide-react';
import { cn } from '@/app/lib/utils';

interface StructuredDataDisplayProps {
  data: any;
  title?: string;
  onFieldSelect?: (path: string, value: any) => void;
  className?: string;
}

export function StructuredDataDisplay({ 
  data, 
  title = 'Extracted Data', 
  onFieldSelect,
  className 
}: StructuredDataDisplayProps) {
  const [expandedPaths, setExpandedPaths] = React.useState<Set<string>>(new Set(['']));
  const [copiedPath, setCopiedPath] = React.useState<string | null>(null);

  const toggleExpand = (path: string) => {
    setExpandedPaths(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const copyValue = async (value: any, path: string) => {
    try {
      const textValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
      await navigator.clipboard.writeText(textValue);
      setCopiedPath(path);
      setTimeout(() => setCopiedPath(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const renderValue = (value: any, path: string = '', level: number = 0): React.ReactNode => {
    if (value === null) return <span className="text-gray-400">null</span>;
    if (value === undefined) return <span className="text-gray-400">undefined</span>;

    const isExpanded = expandedPaths.has(path);
    const indent = level * 16;

    if (Array.isArray(value)) {
      return (
        <div>
          <div 
            className="flex items-center gap-1 cursor-pointer hover:bg-gray-50 rounded px-2 py-1 -mx-2"
            onClick={() => toggleExpand(path)}
            style={{ paddingLeft: indent }}
          >
            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            <span className="text-gray-600">Array[{value.length}]</span>
          </div>
          {isExpanded && (
            <div className="ml-4">
              {value.map((item, index) => (
                <div key={index} className="border-l-2 border-gray-200 pl-4 ml-1">
                  <div className="text-gray-500 text-xs">[{index}]</div>
                  {renderValue(item, `${path}[${index}]`, level + 1)}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (typeof value === 'object') {
      const entries = Object.entries(value);
      return (
        <div>
          <div 
            className="flex items-center gap-1 cursor-pointer hover:bg-gray-50 rounded px-2 py-1 -mx-2"
            onClick={() => toggleExpand(path)}
            style={{ paddingLeft: indent }}
          >
            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            <span className="text-gray-600">Object{entries.length > 0 && `{${entries.length}}`}</span>
          </div>
          {isExpanded && (
            <div className="ml-4">
              {entries.map(([key, val]) => (
                <div key={key} className="border-l-2 border-gray-200 pl-4 ml-1 py-1">
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 font-medium min-w-[120px]">{key}:</span>
                    <div className="flex-1">
                      {renderValue(val, `${path}.${key}`, level + 1)}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyValue(val, `${path}.${key}`);
                        if (onFieldSelect) {
                          onFieldSelect(`${path}.${key}`.slice(1), val);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 rounded"
                      title="Copy value"
                    >
                      {copiedPath === `${path}.${key}` ? (
                        <Check className="w-3 h-3 text-green-600" />
                      ) : (
                        <Copy className="w-3 h-3 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Primitive values
    let valueClass = 'text-gray-800';
    if (typeof value === 'string') valueClass = 'text-green-600';
    if (typeof value === 'number') valueClass = 'text-orange-600';
    if (typeof value === 'boolean') valueClass = 'text-purple-600';

    return (
      <div className="flex items-center gap-2 group" style={{ paddingLeft: indent }}>
        <span className={valueClass}>
          {typeof value === 'string' ? `"${value}"` : String(value)}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            copyValue(value, path);
            if (onFieldSelect) {
              onFieldSelect(path.slice(1), value);
            }
          }}
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 rounded"
          title="Copy value"
        >
          {copiedPath === path ? (
            <Check className="w-3 h-3 text-green-600" />
          ) : (
            <Copy className="w-3 h-3 text-gray-400" />
          )}
        </button>
      </div>
    );
  };

  return (
    <div className={cn('bg-white border border-gray-200 rounded-lg p-4', className)}>
      <h3 className="text-sm font-medium text-gray-900 mb-3">{title}</h3>
      <div className="font-mono text-sm">
        {renderValue(data)}
      </div>
    </div>
  );
}