'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface FileAttachment {
  id: string;
  file: File;
  preview?: string;
  progress?: number;
  uploading?: boolean;
  error?: string;
  // Server response
  file_id?: string;
  filepath?: string;
  width?: number;
  height?: number;
}

interface FileContextValue {
  // File attachments per conversation
  attachments: Map<string, FileAttachment[]>;
  
  // Add files to a conversation
  addFiles: (conversationId: string, files: File[]) => void;
  
  // Remove a file from a conversation
  removeFile: (conversationId: string, fileId: string) => void;
  
  // Clear all files for a conversation
  clearFiles: (conversationId: string) => void;
  
  // Update file progress
  updateFileProgress: (conversationId: string, fileId: string, progress: number) => void;
  
  // Update file after upload
  updateFileAfterUpload: (
    conversationId: string, 
    fileId: string, 
    data: { file_id: string; filepath: string; width?: number; height?: number }
  ) => void;
  
  // Set file error
  setFileError: (conversationId: string, fileId: string, error: string) => void;
  
  // Get files for a conversation
  getFiles: (conversationId: string) => FileAttachment[];
}

const FileContext = createContext<FileContextValue | null>(null);

export function FileProvider({ children }: { children: ReactNode }) {
  const [attachments, setAttachments] = useState<Map<string, FileAttachment[]>>(new Map());

  const addFiles = useCallback((conversationId: string, files: File[]) => {
    setAttachments(prev => {
      const newMap = new Map(prev);
      const existingFiles = newMap.get(conversationId) || [];
      
      const newFiles: FileAttachment[] = files.map(file => ({
        id: `${Date.now()}-${Math.random()}`,
        file,
        progress: 0,
        uploading: false,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      }));
      
      newMap.set(conversationId, [...existingFiles, ...newFiles]);
      return newMap;
    });
  }, []);

  const removeFile = useCallback((conversationId: string, fileId: string) => {
    setAttachments(prev => {
      const newMap = new Map(prev);
      const files = newMap.get(conversationId) || [];
      
      // Clean up preview URL if exists
      const fileToRemove = files.find(f => f.id === fileId);
      if (fileToRemove?.preview?.startsWith('blob:')) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      
      newMap.set(conversationId, files.filter(f => f.id !== fileId));
      return newMap;
    });
  }, []);

  const clearFiles = useCallback((conversationId: string) => {
    setAttachments(prev => {
      const newMap = new Map(prev);
      const files = newMap.get(conversationId) || [];
      
      // Clean up all preview URLs
      files.forEach(file => {
        if (file.preview?.startsWith('blob:')) {
          URL.revokeObjectURL(file.preview);
        }
      });
      
      newMap.delete(conversationId);
      return newMap;
    });
  }, []);

  const updateFileProgress = useCallback((
    conversationId: string, 
    fileId: string, 
    progress: number
  ) => {
    setAttachments(prev => {
      const newMap = new Map(prev);
      const files = newMap.get(conversationId) || [];
      
      newMap.set(
        conversationId,
        files.map(f => f.id === fileId ? { ...f, progress, uploading: progress < 100 } : f)
      );
      return newMap;
    });
  }, []);

  const updateFileAfterUpload = useCallback((
    conversationId: string,
    fileId: string,
    data: { file_id: string; filepath: string; width?: number; height?: number }
  ) => {
    setAttachments(prev => {
      const newMap = new Map(prev);
      const files = newMap.get(conversationId) || [];
      
      newMap.set(
        conversationId,
        files.map(f => 
          f.id === fileId 
            ? { ...f, ...data, progress: 100, uploading: false, error: undefined }
            : f
        )
      );
      return newMap;
    });
  }, []);

  const setFileError = useCallback((
    conversationId: string,
    fileId: string,
    error: string
  ) => {
    setAttachments(prev => {
      const newMap = new Map(prev);
      const files = newMap.get(conversationId) || [];
      
      newMap.set(
        conversationId,
        files.map(f => f.id === fileId ? { ...f, error, uploading: false } : f)
      );
      return newMap;
    });
  }, []);

  const getFiles = useCallback((conversationId: string): FileAttachment[] => {
    return attachments.get(conversationId) || [];
  }, [attachments]);

  const value: FileContextValue = {
    attachments,
    addFiles,
    removeFile,
    clearFiles,
    updateFileProgress,
    updateFileAfterUpload,
    setFileError,
    getFiles,
  };

  return <FileContext.Provider value={value}>{children}</FileContext.Provider>;
}

export function useFiles() {
  const context = useContext(FileContext);
  if (!context) {
    throw new Error('useFiles must be used within a FileProvider');
  }
  return context;
}