'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/app/lib/utils';
import { Send, X, Bot, User, Loader2, Info, FileText } from 'lucide-react';
import { SSE } from 'sse.js';
import { useChat } from '@/app/contexts/chat-context';
import { useDomain } from '@/app/contexts/domain-context';
import { useAuth } from '@/app/contexts/auth-context';
import { ConversationInfoPopup } from './conversation-info-popup';
import { SopPopup } from './sop-popup';
import { SmartMessageDisplay } from './smart-message-display';
import { FileUploadSimple } from './file-upload-simple';
import { FilePreviewItem } from './file-preview-item';
import { StructuredDataDisplay } from './structured-data-display';
import { ForusSpinner } from './forus-spinner';
import { AnimatedCounter } from './animated-counter';
import { FormMessage, formJsStyles } from './form-message';
import { ConversationalFormRenderer, type FormSchema } from '@/app/lib/services/conversational-form.service';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  extractedData?: any;
  // Form-specific fields
  type?: 'text' | 'form-field' | 'form-review' | 'file-upload';
  fieldKey?: string;
  fieldValue?: any;
  schema?: FormSchema;
  data?: Record<string, any>;
  actions?: Array<{
    label: string;
    value: any;
  }>;
}

interface ChatInterfaceProps {
  masterTaskName: string;
  masterTaskId?: string;
  executionModel?: string;
  onClose: () => void;
  accessToken?: string;
  chatId?: string; // For existing conversations
  executionId?: string; // For loading existing task executions
  userTaskId?: string; // For linking to UserTask
}

export function ChatInterfaceV2({ 
  masterTaskName, 
  masterTaskId,
  executionModel, 
  onClose,
  accessToken,
  chatId,
  executionId: propExecutionId,
  userTaskId 
}: ChatInterfaceProps) {
  const router = useRouter();
  const { updateChatActivity } = useChat();
  const { currentDomain } = useDomain();
  const { setUserVerified } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(!!propExecutionId);
  // Use prop executionId if provided, otherwise fall back to chatId
  const [executionId, setExecutionId] = useState<string | null>(
    propExecutionId || (chatId && !chatId.startsWith('temp-') ? chatId : null)
  );
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showInfoPopup, setShowInfoPopup] = useState(false);
  const [showSopPopup, setShowSopPopup] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [extractedFields, setExtractedFields] = useState<Record<string, any>>({});
  const [processData, setProcessData] = useState<any>(null);
  const [showPostCompletedSpinner, setShowPostCompletedSpinner] = useState(false);
  const [tokenCount, setTokenCount] = useState(0);
  const [cost, setCost] = useState(0);
  // TECHNICAL DEBT: LLM provider is hardcoded to Gemini 1.5 Flash
  // Should be configurable per process from process.aiModel or process.llmProvider
  // Each process should be able to specify its own LLM (GPT-4, Claude, Gemini, etc.)
  const [llmProvider] = useState('Gemini 1.5 Flash');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sseRef = useRef<SSE | null>(null);
  const formRendererRef = useRef<ConversationalFormRenderer | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Prevent body scrolling when chat is open
  useEffect(() => {
    document.body.classList.add('chat-open');
    // Add form-js styles
    const styleElement = document.createElement('style');
    styleElement.textContent = formJsStyles;
    document.head.appendChild(styleElement);
    
    return () => {
      document.body.classList.remove('chat-open');
      document.head.removeChild(styleElement);
    };
  }, []);

  // Load existing messages if executionId is provided
  useEffect(() => {
    if (propExecutionId) {
      const loadMessages = async () => {
        try {
          setIsLoadingMessages(true);
          
          // Use API route to get messages
          const headers: Record<string, string> = {};
          if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
          }
          
          const response = await fetch(`/api/task-executions/${propExecutionId}/messages`, {
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
          }));
          
          // Calculate initial token count and cost from existing messages
          let initialTokens = 0;
          for (const msg of data.messages) {
            if (msg.tokenCount) {
              initialTokens += msg.tokenCount;
            }
          }
          
          // Calculate cost based on token counts (rough estimate)
          // TECHNICAL DEBT: Hardcoded pricing and 70/30 input/output ratio assumption
          // Should be configurable and based on actual token type counts
          const COST_PER_1K_INPUT_TOKENS = 0.00015;
          const COST_PER_1K_OUTPUT_TOKENS = 0.0006;
          const inputTokens = Math.floor(initialTokens * 0.7);
          const outputTokens = initialTokens - inputTokens;
          const initialCost = (inputTokens / 1000 * COST_PER_1K_INPUT_TOKENS) + 
                            (outputTokens / 1000 * COST_PER_1K_OUTPUT_TOKENS);
          
          setTokenCount(initialTokens);
          setCost(initialCost);
          
          // If we have a process intro and no messages, add it as the first message
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
          // If we can't load messages, show a welcome message
          setMessages([{
            id: '1',
            role: 'assistant',
            content: `Welcome back! I'll help you continue with the "${masterTaskName}" task. How can I assist you?`,
            timestamp: new Date(),
          }]);
        } finally {
          setIsLoadingMessages(false);
        }
      };
      
      loadMessages();
    } else {
      // New conversation - show welcome message
      setMessages([{
        id: '1',
        role: 'assistant',
        content: `Welcome! I'll help you with the "${masterTaskName}" task.${executionModel ? ` This is a ${executionModel} workflow.` : ''} How can I assist you today?`,
        timestamp: new Date(),
      }]);
    }
  }, [propExecutionId, masterTaskName, executionModel, accessToken]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch process data for required parameters
  useEffect(() => {
    const fetchMasterTaskData = async () => {
      if (!masterTaskId || !accessToken) return;
      
      try {
        const response = await fetch(`/api/master-tasks/${masterTaskId}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setProcessData(data);
          
          // Initialize form renderer if we have form schema
          if (data.formSchema && executionModel === 'form') {
            formRendererRef.current = new ConversationalFormRenderer(data.formSchema);
            
            // Start conversational flow after initial intro
            setTimeout(() => {
              const firstFieldMessage = formRendererRef.current!.startConversation();
              const message: Message = {
                id: Date.now().toString(),
                ...firstFieldMessage,
                timestamp: new Date()
              };
              setMessages(prev => [...prev, message]);
            }, 2000); // Give time for intro message
          }
        }
      } catch (error) {
        console.error('Error fetching process data:', error);
      }
    };
    
    fetchMasterTaskData();
  }, [masterTaskId, accessToken]);

  // Cleanup SSE on unmount
  useEffect(() => {
    return () => {
      if (sseRef.current) {
        sseRef.current.close();
      }
    };
  }, []);

  const handleFilesSelected = (files: File[]) => {
    setAttachedFiles(prev => [...prev, ...files]);
  };

  const handleDataExtract = useCallback((messageId: string) => (data: any) => {
    console.log('Extracted data from message:', messageId, data);
    
    // Update the message with extracted data
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, extractedData: data }
        : msg
    ));

    // Store extracted fields for process use
    if (data.fields) {
      setExtractedFields(prev => ({ ...prev, ...data.fields }));
    }
  }, []);


  const handleFieldSelect = (path: string, value: any) => {
    console.log('Field selected:', path, value);
    // You can emit this to parent component or store for later use
  };

  const handleFormFieldSubmit = useCallback((fieldKey: string, value: any) => {
    console.log('Form field submitted:', fieldKey, value);
    
    if (!formRendererRef.current) return;
    
    // Process the field response
    const result = formRendererRef.current.processFieldResponse(fieldKey, value);
    
    if (!result.isValid) {
      // Show validation error
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: result.error || 'Invalid input. Please try again.',
        timestamp: new Date(),
        type: 'text'
      };
      setMessages(prev => [...prev, errorMessage]);
    } else if (result.nextMessage) {
      // Add next field message
      const nextMessage: Message = {
        id: Date.now().toString(),
        ...result.nextMessage,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, nextMessage]);
    } else if (result.isComplete) {
      // All fields collected, show review
      const reviewMessage: Message = {
        id: Date.now().toString(),
        ...formRendererRef.current.generateReviewMessage(),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, reviewMessage]);
    }
    
    scrollToBottom();
  }, []);

  const handleFormSubmit = useCallback(async (formData: Record<string, any>) => {
    console.log('Form submitted:', formData);
    
    // Add user confirmation message
    const confirmMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: 'Confirmed all information',
      timestamp: new Date(),
      type: 'text'
    };
    setMessages(prev => [...prev, confirmMessage]);
    
    // Continue with regular chat flow, sending the form data
    if (executionModel === 'form' && masterTaskId === 'identity-verification') {
      // For identity verification, update user status
      setUserVerified(true);
      setShowPostCompletedSpinner(true);
      
      // Redirect after delay
      setTimeout(() => {
        router.push(`/${currentDomain?.slug || ''}`);
      }, 3000);
    }
    
    // You can send the formData to the AI for further processing
    // handleSend(`Form data submitted: ${JSON.stringify(formData)}`);
  }, [executionModel, masterTaskId, setUserVerified, router, currentDomain]);

  const handleArtifactInteract = useCallback(async (action: string, data?: any) => {
    console.log('Artifact interaction:', action, data);
    console.log('MasterTaskId:', masterTaskId);
    
    if (action === 'submit') {
      // Don't proceed if already streaming
      if (isStreaming) return;
      
      // Check if this is identity verification
      if (masterTaskId === 'identity-verification') {
        console.log('Identity verification completed, updating user status');
        
        // Update user verification status
        setUserVerified(true);
        
        // Show success message
        const successMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: '✅ Identity verification complete! Your account is now verified. Redirecting to home...',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, successMessage]);
        
        // Redirect to domain home after a short delay
        setTimeout(() => {
          router.push(currentDomain?.slug ? `/${currentDomain.slug}` : '/');
        }, 2000);
        
        return; // Exit early, no need to send to chat stream
      }
      
      // For other tasks, send the MasterTaskID to chat stream
      const confirmationMessage = `Task completed. [MasterTaskID: ${masterTaskId}]`;
      
      // Create user message
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: confirmationMessage,
        timestamp: new Date(),
      };

      // Add user message to chat
      setMessages(prev => [...prev, userMessage]);
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
            processName: masterTaskName,
            executionModel,
            executionId: executionId || undefined,
          }),
          method: 'POST',
        });

        sseRef.current = eventSource;
        let streamedContent = '';

        eventSource.addEventListener('message', (event: any) => {
          const data = JSON.parse(event.data);
          
          if (data.executionId && !executionId) {
            setExecutionId(data.executionId);
            if (chatId) {
              updateChatActivity(chatId, data.executionId, data.title || masterTaskName);
            }
          }
          
          // Update token count and cost if provided
          if (data.tokenCount !== undefined) {
            setTokenCount(data.tokenCount);
          }
          if (data.cost !== undefined) {
            setCost(data.cost);
          }
          
          if (data.content) {
            streamedContent += data.content;
            setMessages(prev => prev.map(msg => 
              msg.id === assistantMessageId 
                ? { ...msg, content: streamedContent, isStreaming: true }
                : msg
            ));
          }
        });

        eventSource.addEventListener('postCompleted', (event: any) => {
          const data = JSON.parse(event.data);
          console.log('Post completed:', data);
          
          // Show spinner for 5 seconds then redirect
          setShowPostCompletedSpinner(true);
          setTimeout(() => {
            setShowPostCompletedSpinner(false);
            // Close the chat and redirect to domain home
            router.push(currentDomain?.slug ? `/${currentDomain.slug}` : '/');
          }, 5000);
        });

        eventSource.addEventListener('done', () => {
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, isStreaming: false }
              : msg
          ));
          setIsStreaming(false);
          if (sseRef.current) {
            sseRef.current.close();
            sseRef.current = null;
          }
        });

        eventSource.addEventListener('error', (error: any) => {
          console.error('SSE error:', error);
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, content: streamedContent || 'Sorry, there was an error processing your request.', isStreaming: false }
              : msg
          ));
          setIsStreaming(false);
          if (sseRef.current) {
            sseRef.current.close();
            sseRef.current = null;
          }
        });

        eventSource.stream();
      } catch (error) {
        console.error('Failed to send message:', error);
        setMessages(prev => prev.filter(msg => msg.id !== assistantMessage.id));
        setIsStreaming(false);
      }
    }
  }, [isStreaming, userTaskId, messages, accessToken, masterTaskId, masterTaskName, executionModel, currentDomain?.id, executionId, updateChatActivity, chatId, router, setUserVerified]);

  const handleDocumentExtraction = async (file: File) => {
    // Simulate AI extraction from document
    // In real implementation, this would call an OCR/AI service
    console.log('Extracting data from document:', file.name);
    
    // Add AI processing message
    const processingMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: 'Processing your document... 🔄',
      timestamp: new Date(),
      type: 'text'
    };
    setMessages(prev => [...prev, processingMessage]);
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock extracted data (in real app, this would come from OCR/AI)
    const extractedData = {
      firstName: 'John',
      lastName: 'Smith',
      idNumber: 'A1234567',
      dateOfBirth: '1990-01-15',
      nationality: 'South African',
      gender: 'male',
      documentType: 'national_id'
    };
    
    // Update form renderer with extracted data
    if (formRendererRef.current) {
      formRendererRef.current.setExtractedData(extractedData);
      
      // Start form conversation with extracted data
      const firstFieldMessage = formRendererRef.current.startConversation();
      const message: Message = {
        id: (Date.now() + 1).toString(),
        ...firstFieldMessage,
        timestamp: new Date()
      };
      
      // Replace processing message with success and first field
      setMessages(prev => prev.slice(0, -1).concat([
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Great! I\'ve extracted information from your document. Let\'s verify each field:',
          timestamp: new Date(),
          type: 'text'
        },
        message
      ]));
    }
  };

  const handleSend = useCallback(async () => {
    if ((!input.trim() && attachedFiles.length === 0) || isStreaming) return;
    
    // Check if this is a form execution with document upload
    if (executionModel === 'form' && attachedFiles.length > 0 && formRendererRef.current) {
      // Handle document extraction for forms
      const documentFile = attachedFiles.find(f => 
        f.type.startsWith('image/') || f.type === 'application/pdf'
      );
      
      if (documentFile) {
        await handleDocumentExtraction(documentFile);
        setAttachedFiles([]); // Clear files after processing
        setInput('');
        return;
      }
    }

    // Convert images and PDFs to base64
    const filePromises = attachedFiles
      .filter(file => file.type.startsWith('image/') || file.type === 'application/pdf')
      .map(file => new Promise<{ mimeType: string; data: string }>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = e.target?.result as string;
          // Remove data URL prefix to get just the base64 data
          const base64Data = base64.split(',')[1];
          resolve({
            mimeType: file.type,
            data: base64Data
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      }));

    const files = await Promise.all(filePromises);

    // Build message content with file info
    let messageContent = input;
    if (attachedFiles.length > 0) {
      const fileDescriptions = attachedFiles.map(file => {
        if (file.type.startsWith('image/')) {
          return `[Uploaded image: ${file.name}]`;
        } else if (file.type === 'application/pdf') {
          return `[Uploaded PDF: ${file.name}]`;
        }
        return `[Uploaded file: ${file.name} (${file.type})]`;
      });
      messageContent = fileDescriptions.join('\n') + (input ? '\n\n' + input : '');
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setAttachedFiles([]); // Clear attached files after sending
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
      // Store files in a variable that's accessible in the SSE setup
      const messagesToSend = messages.concat(userMessage).map((msg, index) => {
        // Add files to the last user message if it's the current one
        if (index === messages.length && files.length > 0) {
          return {
            role: msg.role,
            content: msg.content,
            images: files // Still called 'images' in the API for backward compatibility
          };
        }
        return {
          role: msg.role,
          content: msg.content,
        };
      });

      // Set up SSE connection
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Only add Authorization header if we have a token
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
      
      const eventSource = new SSE('/api/chat/stream', {
        headers,
        payload: JSON.stringify({
          messages: messagesToSend,
          processName: masterTaskName,
          executionModel,
          executionId: executionId || undefined,
        }),
        method: 'POST',
      });

      sseRef.current = eventSource;
      let streamedContent = '';

      eventSource.addEventListener('message', (event: any) => {
        const data = JSON.parse(event.data);
        
        // Handle conversation creation response
        if (data.executionId && !executionId) {
          setExecutionId(data.executionId);
          // Update chat context with real conversation ID
          if (chatId) {
            updateChatActivity(chatId, data.executionId, data.title || masterTaskName);
          }
        }
        
        // Update token count and cost if provided
        if (data.tokenCount !== undefined) {
          setTokenCount(data.tokenCount);
        }
        if (data.cost !== undefined) {
          setCost(data.cost);
        }
        
        // Handle streaming content
        if (data.content) {
          streamedContent += data.content;
          
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, content: streamedContent }
              : msg
          ));
        }
      });

      eventSource.addEventListener('postCompleted', (event: any) => {
        const data = JSON.parse(event.data);
        console.log('Post completed:', data);
        
        // Show spinner for 5 seconds then redirect
        setShowPostCompletedSpinner(true);
        setTimeout(() => {
          setShowPostCompletedSpinner(false);
          // Close the chat and redirect to domain home
          router.push(currentDomain?.slug ? `/${currentDomain.slug}` : '/domains');
        }, 5000);
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
  }, [input, attachedFiles, isStreaming, messages, accessToken, executionModel, masterTaskId, chatId, executionId, currentDomain?.id, masterTaskName, updateChatActivity, router, setUserVerified]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        {/* First line: Title and icons */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-medium text-gray-900">{masterTaskName}</h2>
          
          <div className="flex items-center gap-1">
            {executionId && (
              <>
                <button
                  onClick={() => setShowSopPopup(true)}
                  className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                  aria-label="View Standard Operating Procedure"
                  title="View Standard Operating Procedure"
                >
                  <FileText className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={() => setShowInfoPopup(true)}
                  className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                  aria-label="View conversation info"
                  title="View conversation info"
                >
                  <Info className="w-5 h-5 text-gray-600" />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Second line: Chips */}
        <div className="flex items-center gap-2">
          {/* LLM Provider Chip */}
          <div className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
            {llmProvider}
          </div>
          
          {/* Token Count Chip */}
          <div className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
            {tokenCount === 0 ? (
              <span>Usage</span>
            ) : (
              <AnimatedCounter value={tokenCount} suffix=" tokens" />
            )}
          </div>
          
          {/* Cost Chip */}
          <div className="inline-flex items-center px-2 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-medium">
            <AnimatedCounter value={cost} prefix="$" decimals={2} />
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
        style={{ 
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch'
        }}
      >
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
                "flex-1 max-w-[80%]",
                message.type === 'form-field' || message.type === 'form-review' 
                  ? "" 
                  : "rounded-lg px-4 py-2",
                message.role === 'assistant'
                  ? (message.type === 'form-field' || message.type === 'form-review' ? "" : "bg-white border border-gray-200")
                  : "bg-blue-600 text-white"
              )}
            >
              {/* Regular text message */}
              {message.type !== 'form-field' && message.type !== 'form-review' && (
                <>
                  {message.role === 'assistant' ? (
                    <SmartMessageDisplay
                      content={message.content}
                      className="text-sm"
                      onDataExtract={handleDataExtract(message.id)}
                      onInteract={handleArtifactInteract}
                      requiredParameters={processData?.requiredParameters}
                    />
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  )}
                </>
              )}
              
              {/* Form message */}
              {(message.type === 'form-field' || message.type === 'form-review') && (
                <>
                  {message.content && (
                    <p className="text-sm mb-2">{message.content}</p>
                  )}
                  <FormMessage
                    type={message.type}
                    schema={message.schema}
                    data={message.data}
                    fieldKey={message.fieldKey}
                    fieldValue={message.fieldValue}
                    actions={message.actions}
                    onFieldSubmit={handleFormFieldSubmit}
                    onSubmit={handleFormSubmit}
                  />
                </>
              )}
              
              {message.isStreaming && message.content && (
                <span className="inline-block w-1 h-4 bg-gray-400 animate-pulse ml-1" />
              )}
              {!message.isStreaming && message.type !== 'form-field' && message.type !== 'form-review' && (
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

      {/* Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        {/* File attachments preview */}
        {attachedFiles.length > 0 && (
          <div className="mb-2 flex items-center gap-2 flex-wrap">
            {attachedFiles.map((file, index) => (
              <FilePreviewItem
                key={index}
                file={file}
                index={index}
                onRemove={(i) => setAttachedFiles(prev => prev.filter((_, idx) => idx !== i))}
              />
            ))}
          </div>
        )}
        
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <FileUploadSimple
            onFilesSelected={handleFilesSelected}
            disabled={isStreaming}
            className="flex-shrink-0"
          />
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

      {/* SOP Popup */}
      {showSopPopup && executionId && (
        <SopPopup
          executionId={executionId}
          accessToken={accessToken}
          onClose={() => setShowSopPopup(false)}
        />
      )}

      {/* Post Completed Spinner Overlay */}
      {showPostCompletedSpinner && (
        <div className="fixed inset-0 z-60 bg-white bg-opacity-50 flex items-center justify-center">
          <ForusSpinner 
            size="lg" 
            message="Processing your verification... Your journey continues!" 
          />
        </div>
      )}

    </div>
  );
}