'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/app/lib/utils';
import { Send, X, Bot, User, Loader2, Info } from 'lucide-react';
import { SSE } from 'sse.js';
import { useChat } from '@/app/contexts/chat-context';
import { useDomain } from '@/app/contexts/domain-context';
import { useFiles } from '@/app/contexts/file-context';
import { ConversationInfoPopup } from './conversation-info-popup';
import { Markdown } from './markdown';
import { FileUploadEnhanced } from './file-upload-enhanced';
import { StructuredDataDisplay } from './structured-data-display';
import { useFileUpload } from '@/app/hooks/use-file-upload';
import { formatFileSize } from '@/app/lib/file-config';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  extractedData?: any;
  files?: Array<{
    file_id: string;
    filepath: string;
    type: string;
    originalName?: string;
    width?: number;
    height?: number;
  }>;
}

interface ChatInterfaceProps {
  processName: string;
  processId?: string;
  executionModel?: string;
  onClose: () => void;
  accessToken?: string;
  chatId?: string;
  executionId?: string;
}

export function ChatInterfaceV3({ 
  processName, 
  processId,
  executionModel, 
  onClose,
  accessToken,
  chatId,
  executionId: propConversationId 
}: ChatInterfaceProps) {
  const { updateChatActivity } = useChat();
  const { currentDomain } = useDomain();
  const { 
    getFiles, 
    addFiles, 
    removeFile, 
    clearFiles, 
    updateFileProgress,
    updateFileAfterUpload,
    setFileError
  } = useFiles();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(!!propConversationId);
  const [executionId, setConversationId] = useState<string | null>(
    propConversationId || (chatId && !chatId.startsWith('temp-') ? chatId : null)
  );
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showInfoPopup, setShowInfoPopup] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sseRef = useRef<SSE | null>(null);

  // Use conversation ID for file context
  const contextId = executionId || chatId || 'temp';
  const attachedFiles = getFiles(contextId);

  // File upload hook
  const { uploadFile } = useFileUpload({
    onProgress: (progress, file) => {
      const fileAttachment = attachedFiles.find(f => f.file.name === file.name);
      if (fileAttachment) {
        updateFileProgress(contextId, fileAttachment.id, progress);
      }
    },
    onSuccess: (uploadedFile) => {
      const fileAttachment = attachedFiles.find(f => f.file.name === uploadedFile.originalName);
      if (fileAttachment) {
        updateFileAfterUpload(contextId, fileAttachment.id, {
          file_id: uploadedFile.file_id,
          filepath: uploadedFile.filepath,
          width: uploadedFile.width,
          height: uploadedFile.height,
        });
      }
    },
    onError: (error, file) => {
      const fileAttachment = attachedFiles.find(f => f.file.name === file.name);
      if (fileAttachment) {
        setFileError(contextId, fileAttachment.id, error);
      }
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load existing messages if executionId is provided
  useEffect(() => {
    if (propConversationId) {
      const loadMessages = async () => {
        try {
          setIsLoadingMessages(true);
          
          const headers: Record<string, string> = {};
          if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
          }
          
          const response = await fetch(`/api/conversations/${propConversationId}/messages`, {
            headers,
          });
          
          if (!response.ok) {
            throw new Error(`Failed to load messages: ${response.status}`);
          }
          
          const data = await response.json();
          
          const formattedMessages: Message[] = data.messages.map((msg: any) => ({
            id: msg.messageId,
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
            timestamp: new Date(msg.createdAt),
            files: msg.files,
          }));
          
          if (data.processIntro && formattedMessages.length === 0) {
            formattedMessages.unshift({
              id: 'intro-message',
              role: 'assistant',
              content: data.processIntro,
              timestamp: new Date(),
            });
          }
          
          setMessages(formattedMessages);
        } catch (error) {
          console.error('Error loading messages:', error);
          setMessages([{
            id: '1',
            role: 'assistant',
            content: `Welcome back! I'll help you continue with the "${processName}" process. How can I assist you?`,
            timestamp: new Date(),
          }]);
        } finally {
          setIsLoadingMessages(false);
        }
      };
      
      loadMessages();
    } else {
      setMessages([{
        id: '1',
        role: 'assistant',
        content: `Welcome! I'll help you with the "${processName}" process.${executionModel ? ` This is a ${executionModel} workflow.` : ''} How can I assist you today?`,
        timestamp: new Date(),
      }]);
    }
  }, [propConversationId, processName, executionModel, accessToken]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Cleanup SSE on unmount
  useEffect(() => {
    return () => {
      if (sseRef.current) {
        sseRef.current.close();
      }
      // Clean up files when leaving chat
      clearFiles(contextId);
    };
  }, [contextId, clearFiles]);

  const handleFilesSelected = (files: File[]) => {
    addFiles(contextId, files);
  };

  const handleRemoveFile = (fileId: string) => {
    removeFile(contextId, fileId);
  };

  const handleDataExtract = (messageId: string) => (data: any) => {
    console.log('Extracted data from message:', messageId, data);
    
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, extractedData: data }
        : msg
    ));
  };

  const handleSend = useCallback(async () => {
    if ((!input.trim() && attachedFiles.length === 0) || isStreaming) return;

    // Upload files first if any
    let uploadedFileData: Array<{
      file_id: string;
      filepath: string;
      type: string;
      originalName: string;
      width?: number;
      height?: number;
    }> = [];

    if (attachedFiles.length > 0) {
      for (const attachment of attachedFiles) {
        if (!attachment.file_id) {
          // File not uploaded yet
          try {
            const uploaded = await uploadFile(attachment.file);
            if (uploaded) {
              uploadedFileData.push({
                file_id: uploaded.file_id,
                filepath: uploaded.filepath,
                type: uploaded.type,
                originalName: uploaded.originalName,
                width: uploaded.width,
                height: uploaded.height,
              });
            }
          } catch (error) {
            console.error('Failed to upload file:', attachment.file.name, error);
          }
        } else {
          // File already uploaded
          uploadedFileData.push({
            file_id: attachment.file_id,
            filepath: attachment.filepath!,
            type: attachment.file.type,
            originalName: attachment.file.name,
            width: attachment.width,
            height: attachment.height,
          });
        }
      }
    }

    // Build message content
    let messageContent = input;
    if (uploadedFileData.length > 0) {
      const fileDescriptions = uploadedFileData.map(file => {
        if (file.type.startsWith('image/')) {
          return `[Uploaded image: ${file.originalName}]`;
        } else if (file.type === 'application/pdf') {
          return `[Uploaded PDF: ${file.originalName}]`;
        }
        return `[Uploaded file: ${file.originalName} (${file.type})]`;
      });
      messageContent = fileDescriptions.join('\n') + (input ? '\n\n' + input : '');
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent,
      timestamp: new Date(),
      files: uploadedFileData.length > 0 ? uploadedFileData : undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    clearFiles(contextId); // Clear files after sending
    setIsStreaming(true);

    // Create assistant message placeholder
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };
    setMessages(prev => [...prev, assistantMessage]);

    try {
      // Prepare messages for API
      const messagesToSend = messages.concat(userMessage).map(msg => ({
        role: msg.role,
        content: msg.content,
        // Include file IDs if present
        ...(msg.files ? { files: msg.files } : {}),
      }));

      // Set up SSE connection
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
      
      const eventSource = new SSE('/api/chat/stream', {
        headers,
        payload: JSON.stringify({
          messages: messagesToSend,
          processId,
          processName,
          executionModel,
          domainId: currentDomain?.id,
          executionId: executionId || undefined,
        }),
        method: 'POST',
      });

      sseRef.current = eventSource;
      let streamedContent = '';

      eventSource.addEventListener('message', (event: any) => {
        const data = JSON.parse(event.data);
        
        if (data.executionId && !executionId) {
          setConversationId(data.executionId);
          if (chatId) {
            updateChatActivity(chatId, data.executionId, data.title || processName);
          }
        }
        
        if (data.content) {
          streamedContent += data.content;
          
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, content: streamedContent }
              : msg
          ));
        }
      });

      eventSource.addEventListener('done', () => {
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessageId 
            ? { ...msg, isStreaming: false }
            : msg
        ));
        setIsStreaming(false);
        eventSource.close();
        sseRef.current = null;
      });

      eventSource.addEventListener('error', (error: any) => {
        console.error('SSE error:', error);
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessageId 
            ? { ...msg, content: 'Sorry, an error occurred. Please try again.', isStreaming: false }
            : msg
        ));
        setIsStreaming(false);
        eventSource.close();
        sseRef.current = null;
      });

      eventSource.stream();
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { ...msg, content: 'Sorry, an error occurred. Please try again.', isStreaming: false }
          : msg
      ));
      setIsStreaming(false);
    }
  }, [input, attachedFiles, isStreaming, messages, accessToken, executionModel, processId, chatId, executionId, currentDomain?.id, processName, updateChatActivity, uploadFile, contextId, clearFiles]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-lg font-medium text-gray-900">{processName}</h2>
            <p className="text-sm text-gray-600">{executionModel}</p>
          </div>
          {executionId && (
            <button
              onClick={() => setShowInfoPopup(true)}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              aria-label="View conversation info"
            >
              <Info className="w-5 h-5 text-gray-600" />
            </button>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          aria-label="Close chat"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {isLoadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading conversation...</span>
            </div>
          </div>
        ) : (
          messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-3",
              message.role === 'user' && "flex-row-reverse"
            )}
          >
            <div className={cn(
              "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
              message.role === 'assistant' ? "bg-blue-100" : "bg-gray-100"
            )}>
              {message.role === 'assistant' ? (
                <Bot className="w-4 h-4 text-blue-600" />
              ) : (
                <User className="w-4 h-4 text-gray-600" />
              )}
            </div>
            <div
              className={cn(
                "flex-1 max-w-[80%] rounded-lg px-4 py-2",
                message.role === 'assistant'
                  ? "bg-white border border-gray-200"
                  : "bg-blue-600 text-white"
              )}
            >
              {/* Display attached files */}
              {message.files && message.files.length > 0 && (
                <div className="mb-2 space-y-1">
                  {message.files.map((file, index) => (
                    <div key={index} className={cn(
                      "text-xs",
                      message.role === 'assistant' ? "text-gray-500" : "text-blue-100"
                    )}>
                      📎 {file.originalName || file.filepath.split('/').pop()}
                    </div>
                  ))}
                </div>
              )}
              
              {message.role === 'assistant' ? (
                <>
                  <Markdown 
                    content={message.content} 
                    className="text-sm" 
                    onDataExtract={handleDataExtract(message.id)}
                  />
                  {message.extractedData && (
                    <div className="mt-4">
                      <StructuredDataDisplay
                        data={message.extractedData}
                        title="Extracted Fields"
                        onFieldSelect={(path, value) => {
                          console.log('Field selected:', path, value);
                        }}
                        className="text-xs"
                      />
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              )}
              {message.isStreaming && message.content && (
                <span className="inline-block w-1 h-4 bg-gray-400 animate-pulse ml-1" />
              )}
              {!message.isStreaming && (
                <p className={cn(
                  "text-xs mt-1",
                  message.role === 'assistant' ? "text-gray-500" : "text-blue-100"
                )}>
                  {message.timestamp.toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
          ))
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* File upload area */}
      {attachedFiles.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-wrap gap-2">
            {attachedFiles.map((attachment) => (
              <div
                key={attachment.id}
                className="relative group bg-white rounded-lg border border-gray-200 p-2 pr-8"
              >
                <div className="flex items-center gap-2">
                  <div className="text-sm text-gray-600">
                    {attachment.file.name}
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatFileSize(attachment.file.size)}
                  </div>
                </div>
                
                {/* Progress bar */}
                {attachment.uploading && attachment.progress !== undefined && (
                  <div className="mt-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${attachment.progress}%` }}
                    />
                  </div>
                )}
                
                {/* Error state */}
                {attachment.error && (
                  <div className="mt-1 text-xs text-red-500">{attachment.error}</div>
                )}
                
                {/* Remove button */}
                <button
                  onClick={() => handleRemoveFile(attachment.id)}
                  className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded"
                  disabled={attachment.uploading}
                >
                  <X className="w-3 h-3 text-gray-500" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <FileUploadEnhanced
          onFilesSelected={handleFilesSelected}
          disabled={isStreaming}
          existingFiles={attachedFiles.map(a => a.file)}
          className="mb-3"
        />
        
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isStreaming}
            className="flex-1 px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
          />
          <button
            type="submit"
            disabled={(!input.trim() && attachedFiles.length === 0) || isStreaming}
            className={cn(
              "p-2 rounded-md transition-colors flex items-center justify-center",
              (input.trim() || attachedFiles.length > 0) && !isStreaming
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            )}
          >
            {isStreaming ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>

      {/* Info Popup */}
      {showInfoPopup && executionId && (
        <ConversationInfoPopup
          executionId={executionId}
          accessToken={accessToken}
          onClose={() => setShowInfoPopup(false)}
        />
      )}
    </div>
  );
}