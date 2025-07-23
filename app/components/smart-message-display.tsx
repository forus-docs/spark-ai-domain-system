'use client';

import React, { useEffect, useState } from 'react';
import { Markdown } from './markdown';
import { ArtifactButton } from './artifact-button';
import { ArtifactPanel } from './artifact-panel';
import { cn } from '@/app/lib/utils';

interface SmartMessageDisplayProps {
  content: string;
  className?: string;
  onDataExtract?: (data: any) => void;
  onInteract?: (action: string, data?: any) => void;
  requiredParameters?: Array<{
    name: string;
    displayName: string;
    type: string;
    validation?: {
      required?: boolean;
    };
  }>;
}

interface ParsedContent {
  beforeJson: string;
  jsonData: any | null;
  afterJson: string;
  hasFields: boolean;
  extractedFields: Record<string, any>;
  artifactType?: string;
  artifactData?: any;
}

// Function to extract fields from any JSON structure
function extractFieldsFromJson(jsonData: any): Record<string, any> {
  const fields: Record<string, any> = {};
  
  function extractRecursively(obj: any, prefix: string = '') {
    if (obj === null || obj === undefined) return;
    
    if (typeof obj === 'object' && !Array.isArray(obj)) {
      // Handle special case: if there's a "fields" object, prioritize it
      if (obj.fields && typeof obj.fields === 'object') {
        Object.entries(obj.fields).forEach(([key, value]) => {
          fields[key] = value;
        });
        return;
      }
      
      // Skip metadata objects that we don't want to display as fields
      const skipKeys = ['validation', 'metadata', 'timestamp', 'processedAt', 'confidence', 'extractionConfidence'];
      
      // Otherwise, extract all key-value pairs
      Object.entries(obj).forEach(([key, value]) => {
        // Skip metadata keys
        if (skipKeys.includes(key)) return;
        
        const fieldName = prefix ? `${prefix}.${key}` : key;
        
        if (value !== null && value !== undefined) {
          if (typeof value === 'object' && !Array.isArray(value)) {
            // Recursively extract from nested objects
            extractRecursively(value, fieldName);
          } else {
            // Store primitive values
            fields[fieldName] = value;
          }
        }
      });
    }
  }
  
  extractRecursively(jsonData);
  return fields;
}

export function SmartMessageDisplay({ 
  content, 
  className,
  onDataExtract,
  onInteract,
  requiredParameters
}: SmartMessageDisplayProps) {
  const [selectedArtifact, setSelectedArtifact] = useState<any>(null);
  const [isArtifactOpen, setIsArtifactOpen] = useState(false);
  const [parsedContent, setParsedContent] = useState<ParsedContent>({
    beforeJson: content,
    jsonData: null,
    afterJson: '',
    hasFields: false,
    extractedFields: {}
  });

  useEffect(() => {
    // First, check for artifact blocks
    const artifactBlockRegex = /```artifact:(\w+)\n([\s\S]*?)\n```/;
    const artifactMatch = content.match(artifactBlockRegex);
    
    if (artifactMatch) {
      const [fullMatch, artifactType, artifactContent] = artifactMatch;
      const beforeArtifact = content.substring(0, artifactMatch.index);
      const afterArtifact = content.substring((artifactMatch.index || 0) + fullMatch.length);
      
      try {
        const artifactData = JSON.parse(artifactContent);
        
        // Handle different artifact types
        if (artifactType === 'error') {
          // For error artifacts, we don't extract fields
          setParsedContent({
            beforeJson: beforeArtifact,
            jsonData: artifactData,
            afterJson: afterArtifact,
            hasFields: false,
            extractedFields: {},
            artifactType,
            artifactData
          });
        } else {
          // For form and other artifacts, extract fields
          const extractedFields = artifactData.fields || {};
          const hasFields = Object.keys(extractedFields).length > 0;
          
          setParsedContent({
            beforeJson: beforeArtifact,
            jsonData: artifactData,
            afterJson: afterArtifact,
            hasFields,
            extractedFields,
            artifactType,
            artifactData
          });
          
          // Notify parent if data was extracted
          if (hasFields && onDataExtract) {
            onDataExtract({ fields: extractedFields, artifactType, ...artifactData });
          }
        }
      } catch (error) {
        console.error('Failed to parse artifact:', error);
        // If parsing fails, treat as regular content
        setParsedContent({
          beforeJson: content,
          jsonData: null,
          afterJson: '',
          hasFields: false,
          extractedFields: {}
        });
      }
    } else {
      // Fallback to regular JSON block detection
      const jsonBlockRegex = /```json\n([\s\S]*?)\n```/;
      const match = content.match(jsonBlockRegex);
      
      if (match) {
        const beforeJson = content.substring(0, match.index);
        const afterJson = content.substring((match.index || 0) + match[0].length);
        
        try {
          const jsonData = JSON.parse(match[1]);
          const extractedFields = extractFieldsFromJson(jsonData);
          const hasFields = Object.keys(extractedFields).length > 0;
          
          setParsedContent({
            beforeJson,
            jsonData,
            afterJson,
            hasFields,
            extractedFields
          });
          
          // Notify parent if data was extracted
          if (hasFields && onDataExtract) {
            onDataExtract({ fields: extractedFields, ...jsonData });
          }
        } catch (error) {
          // If JSON parsing fails, just show the original content
          setParsedContent({
            beforeJson: content,
            jsonData: null,
            afterJson: '',
            hasFields: false,
            extractedFields: {}
          });
        }
      } else {
        setParsedContent({
          beforeJson: content,
          jsonData: null,
          afterJson: '',
          hasFields: false,
          extractedFields: {}
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]); // Removed onDataExtract to prevent infinite loop

  // Handle artifact interactions
  const handleArtifactInteraction = (action: string, data?: any) => {
    if (action === 'submit' && onDataExtract) {
      onDataExtract({ fields: data, confirmed: true });
      setIsArtifactOpen(false);
    } else if (action === 're-upload' && onDataExtract) {
      onDataExtract({ action: 're-upload' });
      setIsArtifactOpen(false);
    }
    onInteract?.(action, data);
  };

  // If we have an artifact, show it with artifact display
  if (parsedContent.artifactType) {
    return (
      <>
        <div className={cn('space-y-4', className)}>
          {parsedContent.beforeJson.trim() && (
            <Markdown 
              content={parsedContent.beforeJson} 
              className="text-sm"
            />
          )}
          
          {/* Show artifact button */}
          <ArtifactButton
            title={parsedContent.artifactData?.title || (parsedContent.artifactType === 'error' ? 'Error' : "Extracted Information")}
            type={parsedContent.artifactType}
            onClick={() => {
              setSelectedArtifact({
                type: parsedContent.artifactType,
                title: parsedContent.artifactData?.title || (parsedContent.artifactType === 'error' ? 'Error' : "Extracted Information"),
                content: JSON.stringify(parsedContent.jsonData, null, 2),
                data: {
                  ...parsedContent.artifactData,
                  fields: parsedContent.extractedFields,
                  requiredParameters: requiredParameters
                }
              });
              setIsArtifactOpen(true);
            }}
          />
          
          {parsedContent.afterJson.trim() && (
            <Markdown 
              content={parsedContent.afterJson} 
              className="text-sm"
            />
          )}
        </div>
        
        {/* Artifact Panel */}
        <ArtifactPanel
          isOpen={isArtifactOpen}
          onClose={() => setIsArtifactOpen(false)}
          artifact={selectedArtifact}
          onInteract={handleArtifactInteraction}
        />
      </>
    );
  }
  
  // If we have extracted fields but no artifact type, show as form
  if (parsedContent.hasFields && Object.keys(parsedContent.extractedFields).length > 0) {
    return (
      <>
        <div className={cn('space-y-4', className)}>
          {parsedContent.beforeJson.trim() && (
            <Markdown 
              content={parsedContent.beforeJson} 
              className="text-sm"
            />
          )}
          
          {/* Show as form artifact button */}
          <ArtifactButton
            title="Extracted Information"
            type="form"
            onClick={() => {
              setSelectedArtifact({
                type: "form",
                title: "Extracted Information",
                content: JSON.stringify(parsedContent.jsonData, null, 2),
                data: {
                  fields: parsedContent.extractedFields,
                  requiredParameters: requiredParameters
                }
              });
              setIsArtifactOpen(true);
            }}
          />
          
          {parsedContent.afterJson.trim() && (
            <Markdown 
              content={parsedContent.afterJson} 
              className="text-sm"
            />
          )}
        </div>
        
        {/* Artifact Panel */}
        <ArtifactPanel
          isOpen={isArtifactOpen}
          onClose={() => setIsArtifactOpen(false)}
          artifact={selectedArtifact}
          onInteract={handleArtifactInteraction}
        />
      </>
    );
  }

  // If no extracted fields or JSON parsing failed, show regular markdown
  return (
    <>
      <Markdown 
        content={content} 
        className={cn('text-sm', className)}
        onDataExtract={onDataExtract}
      />
      
      {/* Artifact Panel */}
      <ArtifactPanel
        isOpen={isArtifactOpen}
        onClose={() => setIsArtifactOpen(false)}
        artifact={selectedArtifact}
        onInteract={handleArtifactInteraction}
      />
    </>
  );
}