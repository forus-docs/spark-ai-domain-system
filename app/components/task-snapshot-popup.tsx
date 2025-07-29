'use client';

import React, { useState } from 'react';
import { X, Code2, Copy, Check, Download } from 'lucide-react';
import { cn } from '@/app/lib/utils';

interface TaskSnapshotPopupProps {
  taskSnapshot: any;
  executionId: string;
  onClose: () => void;
}

export function TaskSnapshotPopup({ taskSnapshot, executionId, onClose }: TaskSnapshotPopupProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(taskSnapshot, null, 2));
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(taskSnapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `task-snapshot-${executionId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] w-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Task Snapshot</h2>
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={handleCopy}
              className={cn(
                "p-2 rounded-md transition-all",
                isCopied 
                  ? "bg-green-100 text-green-600" 
                  : "hover:bg-gray-100 text-gray-600"
              )}
              title="Copy snapshot"
            >
              {isCopied ? (
                <Check className="w-5 h-5" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </button>
            
            <button
              onClick={handleDownload}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors text-gray-600"
              title="Download snapshot"
            >
              <Download className="w-5 h-5" />
            </button>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          <pre className="text-sm font-mono bg-gray-50 p-4 rounded-lg overflow-x-auto">
            <code>{JSON.stringify(taskSnapshot, null, 2)}</code>
          </pre>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <p className="text-sm text-gray-600">
            Execution ID: <span className="font-mono text-gray-800">{executionId}</span>
          </p>
        </div>
      </div>
    </div>
  );
}