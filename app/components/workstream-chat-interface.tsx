/**
 * Workstream chat interface for multi-user conversations
 * Supports both AI-assisted and human-only conversations
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDomain } from '@/app/contexts/domain-context';
import { useAuth } from '@/app/contexts/auth-context';
import {
  MainContainer,
  ChatContainer,
  MessageList,
  MessageInput,
  TypingIndicator,
  MessageSeparator,
} from '@chatscope/chat-ui-kit-react';
import { toChatscopeMessage } from '@/app/lib/chat-transformers';
import { v4 as uuidv4 } from 'uuid';
import { SSE } from 'sse.js';
import { MessageContent } from './chatscope/message-content';
import { MessageAvatar } from './chatscope/message-avatar';
import { MessageFooter } from './chatscope/message-footer';
import { AttachedFilesPreview } from './chatscope/attached-files-preview';

// Import existing components we'll reuse
import { ConversationInfoPopup } from './conversation-info-popup';
import { SopPopup } from './sop-popup';
import { TaskSnapshotPopup } from './task-snapshot-popup';
import { Copy, Download, Info, CheckSquare, Code, X, ArrowDown, Plus, Bot, BotOff } from 'lucide-react';
import { DomainTasksDrawer } from './domain-tasks-drawer';
import { TaskCommandPopup } from './task-command-popup';
import { TaskCreationStubModal } from './task-creation-stub-modal';
import { AttachmentMenu, AttachmentType } from './attachment-menu';
import { format } from 'date-fns';

interface WorkstreamChatInterfaceProps {
  executionId: string;
  masterTaskName: string;
  executionModel?: string;
  userTaskId?: string;
  onClose?: () => void;
  accessToken?: string;
  taskSnapshot?: any;
}

export function WorkstreamChatInterface({
  executionId,
  masterTaskName,
  executionModel = 'Forus AI',
  userTaskId,
  onClose,
  accessToken,
  taskSnapshot,
}: WorkstreamChatInterfaceProps) {
  const router = useRouter();
  const { currentDomain } = useDomain();
  const { user } = useAuth();
  const messageListRef = useRef<HTMLDivElement>(null);
  const isScrolledToBottomRef = useRef(true);
  
  // State management - keeping all existing state
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showInfoPopup, setShowInfoPopup] = useState(false);
  const [showSOPPopup, setShowSOPPopup] = useState(false);
  const [showTaskSnapshot, setShowTaskSnapshot] = useState(false);
  const [showDomainTasksDrawer, setShowDomainTasksDrawer] = useState(false);
  const [showTaskCommandPopup, setShowTaskCommandPopup] = useState(false);
  const [showTaskCreationModal, setShowTaskCreationModal] = useState(false);
  const [taskCreationModalType, setTaskCreationModalType] = useState<'create' | 'request'>('create');
  const [totalTokenCount, setTotalTokenCount] = useState(0);
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [currentModel, setCurrentModel] = useState<'openai' | 'google'>('google');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);

  const eventSourceRef = useRef<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if task has AI attached - default to true for backwards compatibility
  const initialHasAI = taskSnapshot?.aiAgentAttached !== false;
  const [hasAI, setHasAI] = useState(initialHasAI);

  // Scroll to bottom function
  const scrollToBottom = useCallback(() => {
    if (messageListRef.current) {
      const scrollElement = messageListRef.current.querySelector('.cs-message-list__scroll-wrapper');
      if (scrollElement) {
        scrollElement.scrollTo({
          top: scrollElement.scrollHeight,
          behavior: 'smooth'
        });
        isScrolledToBottomRef.current = true;
        setShowScrollButton(false);
      }
    }
  }, []);

  // Check if scrolled to bottom
  const checkIfScrolledToBottom = useCallback(() => {
    if (messageListRef.current) {
      const scrollElement = messageListRef.current.querySelector('.cs-message-list__scroll-wrapper');
      if (scrollElement) {
        const { scrollTop, scrollHeight, clientHeight } = scrollElement;
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
        isScrolledToBottomRef.current = isAtBottom;
        setShowScrollButton(!isAtBottom && scrollHeight > clientHeight);
      }
    }
  }, []);

  // Load messages function
  const loadMessages = useCallback(async () => {
    try {
      const response = await fetch(`/api/task-executions/${executionId}/messages`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Loaded messages data:', data);
        
        // Ensure data is an array
        const messagesArray = Array.isArray(data) ? data : (data.messages || []);
        setMessages(messagesArray);
        
        // Calculate total tokens
        const totalTokens = messagesArray.reduce((sum: number, msg: any) => 
          sum + (msg.tokenCount || 0), 0
        );
        setTotalTokenCount(totalTokens);
        
        // Calculate cost
        const cost = messagesArray.reduce((sum: number, msg: any) => {
          const tokens = msg.tokenCount || 0;
          const costPerToken = msg.endpoint === 'openai' ? 0.000002 : 0.000001;
          return sum + (tokens * costPerToken);
        }, 0);
        setEstimatedCost(cost);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, [executionId, accessToken]);

  // Load messages on mount
  useEffect(() => {
    if (executionId && accessToken) {
      loadMessages();
    }
  }, [executionId, accessToken, loadMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (isScrolledToBottomRef.current) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  // Scroll to bottom on initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100);
    return () => clearTimeout(timer);
  }, [scrollToBottom]);

  // Handle input change with "/" command detection
  const handleInputChange = (value: string) => {
    setInput(value);
    if (value === '/' && value.length === 1) {
      setShowTaskCommandPopup(true);
    }
  };

  // Handle task command popup actions
  const handleSelectExistingTask = () => {
    setShowDomainTasksDrawer(true);
    setInput(''); // Clear the "/" from input
  };

  const handleCreateNewTask = () => {
    setTaskCreationModalType('create');
    setShowTaskCreationModal(true);
    setInput(''); // Clear the "/" from input
  };

  const handleRequestFromLibrary = () => {
    setTaskCreationModalType('request');
    setShowTaskCreationModal(true);
    setInput(''); // Clear the "/" from input
  };

  // Handle file selection
  const handleFilesSelected = (files: File[]) => {
    setAttachedFiles(files);
  };

  // Handle removing attached file
  const handleRemoveFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Handle attachment type selection
  const handleAttachmentSelect = (type: AttachmentType) => {
    switch (type) {
      case 'file':
      case 'media':
        // Trigger file input for file and media attachments
        if (fileInputRef.current) {
          fileInputRef.current.accept = type === 'media' 
            ? 'image/*,video/*' 
            : '.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv';
          fileInputRef.current.click();
        }
        break;
      case 'contact':
        // TODO: Implement contact picker
        console.log('Contact picker not yet implemented');
        break;
      case 'poll':
        // TODO: Implement poll creator
        console.log('Poll creator not yet implemented');
        break;
      case 'event':
        // TODO: Implement event creator
        console.log('Event creator not yet implemented');
        break;
      case 'task':
        // TODO: Implement task selector
        console.log('Task selector not yet implemented');
        break;
    }
  };

  // Handle copying individual message
  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  // Handle sending messages
  const handleSend = async (_innerHtml: string, textContent: string) => {
    if ((!textContent.trim() && attachedFiles.length === 0) || isStreaming) return;

    // Create content parts if there are attachments
    let content_parts: any[] | undefined;
    if (attachedFiles.length > 0) {
      content_parts = [
        { type: 'text', text: textContent },
        ...attachedFiles.map(file => ({
          type: file.type.startsWith('image/') ? 'image_url' : 'file',
          [file.type.startsWith('image/') ? 'image_url' : 'file']: {
            url: URL.createObjectURL(file),
            name: file.name,
            size: file.size,
            type: file.type
          }
        }))
      ];
    }

    const userMessage = {
      messageId: uuidv4(),
      executionId,
      role: 'user' as const,
      content: textContent,
      text: textContent,
      content_parts,
      userId: user?.id || '',
      createdAt: new Date(),
      isCreatedByUser: true,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setAttachedFiles([]);
    setIsStreaming(true);

    // Stream AI response
    streamAIResponse([...messages, userMessage]);
  };

  const streamAIResponse = async (allMessages: any[]) => {
    if (!hasAI) {
      setIsStreaming(false);
      return;
    }

    console.log('Starting AI stream with:', {
      hasAI,
      executionId,
      currentModel,
      masterTaskName,
      messageCount: allMessages.length,
      hasAccessToken: !!accessToken
    });

    try {
      abortControllerRef.current = new AbortController();
      
      const messageHistory = allMessages.map(msg => ({
        role: msg.role,
        content: msg.content || msg.text || '',
      }));

      const requestPayload = {
        messages: messageHistory,
        processName: masterTaskName,
        executionModel: currentModel,
        executionId,
      };
      
      console.log('SSE request payload:', requestPayload);

      const eventSource = new SSE('/api/chat/stream', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        payload: JSON.stringify(requestPayload),
      });

      eventSourceRef.current = eventSource;
      
      const streamingMessageId = uuidv4();
      let streamingContent = '';
      
      const createStreamingMessage = (content: string, isStreaming: boolean) => ({
        messageId: streamingMessageId,
        executionId,
        role: 'assistant' as const,
        content: content,
        text: content,
        userId: 'ai',
        createdAt: new Date(),
        isStreaming: isStreaming,
        aiModel: currentModel === 'openai' ? 'GPT-4o-mini' : 'Gemini 1.5 Flash',
      });

      // Add initial streaming message
      setMessages(prev => [...prev, createStreamingMessage('', true)]);

      eventSource.addEventListener('message', (event: any) => {
        console.log('SSE message event:', event.data);
        const data = JSON.parse(event.data);
        
        // Log all fields to understand the response format
        console.log('SSE data fields:', Object.keys(data));
        
        if (data.done) {
          console.log('Stream completed via done flag');
          // Update with final non-streaming message
          setMessages(prev => [
            ...prev.slice(0, -1),
            createStreamingMessage(streamingContent, false)
          ]);
          setIsStreaming(false);
          loadMessages(); // Reload to get token counts
        } else if (data.chunk || data.content) {
          // Handle both 'chunk' and 'content' fields for compatibility
          streamingContent += data.chunk || data.content;
          
          // Check if message ends with newline, indicating completion
          const isComplete = streamingContent.endsWith('\n');
          
          // Update the streaming message
          setMessages(prev => [
            ...prev.slice(0, -1),
            createStreamingMessage(streamingContent, !isComplete)
          ]);
          
          if (isComplete) {
            console.log('Stream completed - message ends with newline');
            setIsStreaming(false);
            loadMessages(); // Reload to get token counts
          }
        } else if (data.error) {
          console.error('Stream error:', data.error);
          setMessages(prev => [
            ...prev.slice(0, -1),
            {
              messageId: uuidv4(),
              executionId,
              role: 'system' as const,
              content: `Error: ${data.error}`,
              text: `Error: ${data.error}`,
              userId: 'system',
              createdAt: new Date(),
              isStreaming: false,
            }
          ]);
          setIsStreaming(false);
        }
      });

      eventSource.addEventListener('error', (error: any) => {
        console.error('SSE error event:', error);
        setIsStreaming(false);
        eventSource.close();
        
        // Add error message to chat
        setMessages(prev => [
          ...prev.slice(0, -1), // Remove the empty streaming message
          {
            messageId: uuidv4(),
            executionId,
            role: 'system' as const,
            content: 'Error: Failed to get AI response. Please try again.',
            text: 'Error: Failed to get AI response. Please try again.',
            userId: 'system',
            createdAt: new Date(),
            isStreaming: false,
          }
        ]);
      });

      // Add done event listener
      eventSource.addEventListener('done', () => {
        console.log('Stream completed via done event');
        setMessages(prev => [
          ...prev.slice(0, -1),
          createStreamingMessage(streamingContent, false)
        ]);
        setIsStreaming(false);
        eventSource.close();
        eventSourceRef.current = null;
        loadMessages(); // Reload to get token counts
      });

      eventSource.stream();
    } catch (error) {
      console.error('Streaming error:', error);
      setIsStreaming(false);
      
      // Add error message to chat
      setMessages(prev => [
        ...prev,
        {
          messageId: uuidv4(),
          executionId,
          role: 'system' as const,
          content: `Error: ${error instanceof Error ? error.message : 'Failed to connect to AI service'}`,
          text: `Error: ${error instanceof Error ? error.message : 'Failed to connect to AI service'}`,
          userId: 'system',
          createdAt: new Date(),
          isStreaming: false,
        }
      ]);
    }
  };

  // Handle copy chat
  const handleCopyChat = () => {
    if (!messages || !Array.isArray(messages)) return;
    
    const chatText = messages.map(msg => {
      const role = msg.role === 'assistant' ? 'AI' : msg.role.charAt(0).toUpperCase() + msg.role.slice(1);
      const timestamp = new Date(msg.createdAt).toLocaleTimeString();
      return `[${timestamp}] ${role}: ${msg.content || msg.text}`;
    }).join('\n\n');
    
    const fullText = `Task: ${masterTaskName}\nExecution ID: ${executionId}\nDate: ${format(new Date(), 'PPP')}\n\n${chatText}`;
    navigator.clipboard.writeText(fullText);
  };

  // Handle download chat
  const handleDownloadChat = () => {
    if (!messages || !Array.isArray(messages)) return;
    
    const chatMarkdown = messages.map(msg => {
      const role = msg.role === 'assistant' ? 'AI' : msg.role.charAt(0).toUpperCase() + msg.role.slice(1);
      const timestamp = new Date(msg.createdAt).toLocaleTimeString();
      return `**[${timestamp}] ${role}:**\n${msg.content || msg.text}`;
    }).join('\n\n---\n\n');
    
    const fullMarkdown = `# Task: ${masterTaskName}\n\n**Execution ID:** ${executionId}\n**Date:** ${format(new Date(), 'PPP')}\n\n---\n\n${chatMarkdown}`;
    
    const blob = new Blob([fullMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${masterTaskName.replace(/\s+/g, '-')}-${executionId}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col" style={{ height: '100vh' }}>
      {/* Custom Header - maintaining all existing functionality */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white px-2 sm:px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{masterTaskName}</h2>
            {hasAI && (
              <span className="text-sm text-gray-500">{executionModel}</span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {/* AI Toggle */}
            <button
              onClick={() => setHasAI(!hasAI)}
              className={`p-2 rounded-lg transition-colors ${
                hasAI 
                  ? 'text-blue-600 hover:text-blue-700 hover:bg-blue-50' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
              title={hasAI ? "AI is enabled (click to disable)" : "AI is disabled (click to enable)"}
            >
              {hasAI ? <Bot className="h-4 w-4" /> : <BotOff className="h-4 w-4" />}
            </button>
            <button
              onClick={handleCopyChat}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Copy chat"
            >
              <Copy className="h-4 w-4" />
            </button>
            <button
              onClick={handleDownloadChat}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Download chat"
            >
              <Download className="h-4 w-4" />
            </button>
            {taskSnapshot && (
              <button
                onClick={() => setShowTaskSnapshot(!showTaskSnapshot)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="View task data"
              >
                <Code className="h-4 w-4" />
              </button>
            )}
            {taskSnapshot?.sop && (
              <button
                onClick={() => setShowSOPPopup(!showSOPPopup)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="View SOP"
              >
                <CheckSquare className="h-4 w-4" />
              </button>
            )}
            {taskSnapshot?.additionalInfo && (
              <button
                onClick={() => setShowInfoPopup(!showInfoPopup)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Additional information"
              >
                <Info className="h-4 w-4" />
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors ml-2"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main chat container with flex layout */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <MainContainer className="flex-1 flex flex-col">
          <ChatContainer className="flex-1 flex flex-col">
            {/* Conversation header for better mobile UX */}
            <div className="bg-gray-50 border-b border-gray-200 px-3 py-2 flex items-center justify-between flex-shrink-0">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 truncate">{masterTaskName}</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {hasAI ? (
                    <>{executionModel} • {totalTokenCount.toLocaleString()} tokens</>
                  ) : (
                    <span className="text-orange-600 font-medium">AI Disabled - Human conversation only</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-1 ml-2">
                <button
                  onClick={handleCopyChat}
                  className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                  title="Copy chat"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={handleDownloadChat}
                  className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                  title="Download chat"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            
            <MessageList 
              typingIndicator={isStreaming && <TypingIndicator content="AI is thinking..." />}
              onScroll={checkIfScrolledToBottom}
              className="flex-1"
            >
              <div ref={messageListRef} style={{ position: 'absolute', inset: 0 }} />
            {messages && Array.isArray(messages) && messages.map((msg, index) => {
              const prevMsg = index > 0 ? messages[index - 1] : null;
              
              // Add separators for date changes
              const showDateSeparator = index === 0 || 
                (prevMsg && new Date(msg.createdAt).toDateString() !== new Date(prevMsg.createdAt).toDateString());
              
              return (
                <React.Fragment key={msg.messageId}>
                  {showDateSeparator && (
                    <MessageSeparator content={format(new Date(msg.createdAt), 'EEEE, MMMM d, yyyy')} />
                  )}
                  {/* Custom message implementation - no ChatScope Message component */}
                  <div 
                    className="flex items-start gap-2 px-2 mb-3"
                    data-role={msg.role}
                  >
                    {/* Avatar */}
                    <div className="w-6 h-6 flex-shrink-0">
                      <MessageAvatar role={msg.role} userName={user?.name} />
                    </div>
                    
                    {/* Message content */}
                    <div className="flex-1 min-w-0">
                      <div className={`inline-block px-3 py-2 rounded-lg text-sm ${
                        msg.role === 'user' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <MessageContent message={msg} />
                      </div>
                      
                      {/* Footer - Always show outside the message bubble */}
                      <div className="mt-1.5 px-0.5">
                        <MessageFooter 
                          message={msg}
                          isUserMessage={msg.userId === user?.id && msg.role === 'user'}
                          onCopy={() => handleCopyMessage(msg.content || msg.text || '')}
                          onRetry={msg.role === 'assistant' && msg.status === 'failed' 
                            ? () => {
                                console.log('Retry message:', msg.messageId);
                                // TODO: Implement retry logic - resend the message
                              }
                            : undefined
                          }
                        />
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
            </MessageList>
            
            {/* Scroll to bottom button */}
            {showScrollButton && (
              <button
                onClick={scrollToBottom}
                className="absolute bottom-20 right-4 p-2 bg-white border border-gray-300 rounded-full shadow-lg hover:bg-gray-50 transition-all z-10"
                title="Scroll to bottom"
              >
                <ArrowDown className="h-5 w-5 text-gray-600" />
              </button>
            )}
          </ChatContainer>
        </MainContainer>
        
        {/* Input area - outside of ChatContainer, pinned to bottom */}
        <div className="flex-shrink-0 border-t border-gray-200 bg-white">
          {/* Attached files preview */}
          {attachedFiles.length > 0 && (
            <AttachedFilesPreview 
              files={attachedFiles}
              onRemove={handleRemoveFile}
            />
          )}
          
          <div className="flex items-center p-3 gap-2">
            {/* Plus button for attachments - opens menu */}
            <button
              onClick={() => setShowAttachmentMenu(true)}
              disabled={isStreaming}
              className="p-2.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
              title="Add attachment"
            >
              <Plus className="w-5 h-5" />
            </button>
            
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                if (files.length > 0) {
                  handleFilesSelected(files);
                }
                // Reset input
                e.target.value = '';
              }}
              className="hidden"
            />
            
            {/* Text input */}
            <div className="flex-1 relative">
              <MessageInput
                placeholder={attachedFiles.length > 0 ? "Add a message..." : "Type your message..."}
                value={input}
                onChange={(val) => handleInputChange(val)}
                onSend={handleSend}
                attachButton={false}
                sendDisabled={isStreaming}
                autoFocus
                sendOnReturnDisabled={false}
              />
            </div>
            
          </div>
        </div>
      </div>

      {/* Status bar for AI metrics */}
      {hasAI && (
        <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50 px-2 sm:px-3 py-1.5">
          <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <span>Tokens: {totalTokenCount.toLocaleString()}</span>
              <span>Est. Cost: ${estimatedCost.toFixed(4)}</span>
              <span>Model: {currentModel === 'openai' ? 'GPT-4o-mini' : 'Gemini 1.5 Flash'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Popups and drawers */}
      {showInfoPopup && (
        <ConversationInfoPopup 
          executionId={executionId}
          accessToken={accessToken}
          onClose={() => setShowInfoPopup(false)} 
        />
      )}
      {showSOPPopup && (
        <SopPopup 
          executionId={executionId}
          accessToken={accessToken}
          onClose={() => setShowSOPPopup(false)} 
        />
      )}
      {showDomainTasksDrawer && (
        <DomainTasksDrawer
          isOpen={showDomainTasksDrawer}
          onClose={() => setShowDomainTasksDrawer(false)}
          onTaskSelect={(task) => {
            setInput(`/${task.title}`);
            setShowDomainTasksDrawer(false);
          }}
        />
      )}
      
      {/* Task command popup */}
      {showTaskCommandPopup && (
        <TaskCommandPopup
          isOpen={showTaskCommandPopup}
          onClose={() => setShowTaskCommandPopup(false)}
          onSelectExistingTask={handleSelectExistingTask}
          onCreateNewTask={handleCreateNewTask}
          onRequestFromLibrary={handleRequestFromLibrary}
        />
      )}
      
      {/* Task creation stub modal */}
      {showTaskCreationModal && (
        <TaskCreationStubModal
          isOpen={showTaskCreationModal}
          onClose={() => setShowTaskCreationModal(false)}
          type={taskCreationModalType}
        />
      )}
      
      {/* Attachment menu */}
      <AttachmentMenu
        isOpen={showAttachmentMenu}
        onClose={() => setShowAttachmentMenu(false)}
        onSelect={handleAttachmentSelect}
      />
      
      {/* Render popups outside the main container to avoid clipping */}
      {showTaskSnapshot && taskSnapshot && (
        <TaskSnapshotPopup
          taskSnapshot={taskSnapshot}
          executionId={executionId}
          onClose={() => setShowTaskSnapshot(false)}
        />
      )}
    </div>
  );
}