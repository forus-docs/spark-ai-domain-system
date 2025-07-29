'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/app/lib/utils';
import { CodeBlock } from './code-block';

interface MarkdownProps {
  content: string;
  className?: string;
  onDataExtract?: (data: any) => void;
}

export function Markdown({ content, className, onDataExtract }: MarkdownProps) {
  return (
    <div className={cn('prose prose-sm max-w-none overflow-x-hidden text-sm', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
        // Custom link renderer to open in new tab
        a: ({ node, ...props }) => (
          <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" />
        ),
        // Custom code block with enhanced functionality
        pre: ({ node, children, ...props }: any) => {
          // Extract code and language from children
          if (children?.props?.children) {
            const code = String(children.props.children).trim();
            const className = children.props.className || '';
            const match = /language-(\w+)/.exec(className);
            const language = match ? match[1] : '';
            
            return (
              <CodeBlock
                code={code}
                language={language}
                onExtractData={onDataExtract}
              />
            );
          }
          return <pre {...props} className="bg-gray-100 rounded-md p-3 overflow-x-auto">{children}</pre>;
        },
        code: ({ node, inline, className, children, ...props }: any) => {
          // Only handle inline code here
          const isInline = !className || !className.includes('language-');
          if (isInline) {
            return (
              <code className="bg-gray-100 rounded px-1 py-0.5 text-sm" {...props}>
                {children}
              </code>
            );
          }
          // Block code is handled by pre component
          return <code className={className} {...props}>{children}</code>;
        },
        // Custom list styling
        ul: ({ node, ...props }) => (
          <ul {...props} className="list-disc list-inside space-y-1" />
        ),
        ol: ({ node, ...props }) => (
          <ol {...props} className="list-decimal list-inside space-y-1" />
        ),
        // Custom paragraph spacing
        p: ({ node, ...props }) => (
          <p {...props} className="mb-3 last:mb-0" />
        ),
        // Custom heading styles
        h1: ({ node, ...props }) => (
          <h1 {...props} className="text-lg font-semibold mb-2 mt-4 first:mt-0" />
        ),
        h2: ({ node, ...props }) => (
          <h2 {...props} className="text-base font-semibold mb-2 mt-3 first:mt-0" />
        ),
        h3: ({ node, ...props }) => (
          <h3 {...props} className="text-sm font-semibold mb-1 mt-2 first:mt-0" />
        ),
        // Custom blockquote styling
        blockquote: ({ node, ...props }) => (
          <blockquote {...props} className="border-l-4 border-gray-300 pl-4 italic my-3" />
        ),
        // Custom table styling
        table: ({ node, ...props }) => (
          <div className="overflow-x-auto my-3">
            <table {...props} className="min-w-full divide-y divide-gray-200" />
          </div>
        ),
        thead: ({ node, ...props }) => (
          <thead {...props} className="bg-gray-50" />
        ),
        th: ({ node, ...props }) => (
          <th {...props} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" />
        ),
        td: ({ node, ...props }) => (
          <td {...props} className="px-3 py-2 whitespace-nowrap text-sm" />
        ),
      }}
    >
      {content}
    </ReactMarkdown>
    </div>
  );
}