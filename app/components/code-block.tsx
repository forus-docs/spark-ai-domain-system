'use client';

import React, { useState } from 'react';
import { Check, Copy, FileJson, Code2 } from 'lucide-react';
import { cn } from '@/app/lib/utils';

interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
  onExtractData?: (data: any) => void;
}

export function CodeBlock({ code, language = '', className, onExtractData }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleExtractJSON = () => {
    setExtractError(null);
    try {
      const jsonData = JSON.parse(code);
      if (onExtractData) {
        onExtractData(jsonData);
      }
    } catch (error) {
      setExtractError('Invalid JSON format');
      console.error('JSON parse error:', error);
    }
  };

  const isJSON = language === 'json' || language === 'jsonc';
  const displayLanguage = language || 'plaintext';

  return (
    <div className={cn('relative group', className)}>
      <div className="absolute top-2 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Language label */}
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
          {displayLanguage}
        </span>
        
        {/* Extract JSON button */}
        {isJSON && onExtractData && (
          <button
            onClick={handleExtractJSON}
            className="p-1.5 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
            title="Extract JSON data"
          >
            <FileJson className="w-4 h-4 text-gray-600" />
          </button>
        )}
        
        {/* Copy button */}
        <button
          onClick={handleCopy}
          className="p-1.5 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
          title="Copy code"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-600" />
          ) : (
            <Copy className="w-4 h-4 text-gray-600" />
          )}
        </button>
      </div>

      <pre className="bg-gray-100 rounded-md p-4 overflow-x-auto">
        <code className={`language-${language}`}>{code}</code>
      </pre>

      {extractError && (
        <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
          {extractError}
        </div>
      )}
    </div>
  );
}