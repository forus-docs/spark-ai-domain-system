'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/app/lib/utils';
import { Send, X, Bot, User } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  processName: string;
  executionModel: string;
  onClose: () => void;
}

export function ChatInterface({ processName, executionModel, onClose }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Welcome! I'll help you with the "${processName}" process. This is a ${executionModel} workflow. How can I assist you today?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I understand you're working on "${input}". In a production environment, I would guide you through the ${executionModel} process step by step. For now, this is a Sprint 1 demo.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div>
          <h2 className="text-lg font-medium text-gray-900">{processName}</h2>
          <p className="text-sm text-gray-600">{executionModel}</p>
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
        {messages.map((message) => (
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
              <p className="text-sm">{message.content}</p>
              <p className={cn(
                "text-xs mt-1",
                message.role === 'assistant' ? "text-gray-500" : "text-blue-100"
              )}>
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Bot className="w-4 h-4 text-blue-600" />
            </div>
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
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
            className="flex-1 px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className={cn(
              "p-2 rounded-md transition-colors",
              input.trim() && !isTyping
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            )}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}