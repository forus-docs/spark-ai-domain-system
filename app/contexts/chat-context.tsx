'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/app/contexts/auth-context';

export interface Chat {
  id: string;
  conversationId?: string;
  domainId: string;
  processName: string;
  processId?: string;
  executionModel: string;
  startedAt: Date;
  lastMessageAt: Date;
  messageCount: number;
  title?: string;
}

interface ChatContextType {
  recentChats: Chat[];
  addChat: (chat: Omit<Chat, 'id' | 'startedAt' | 'lastMessageAt' | 'messageCount'>) => Chat;
  updateChatActivity: (chatId: string, conversationId?: string, title?: string) => void;
  clearRecentChats: () => void;
  isLoading: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user, accessToken } = useAuth();
  const [recentChats, setRecentChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load conversations from database when user changes
  useEffect(() => {
    if (!user || !accessToken) {
      setRecentChats([]);
      return;
    }

    const loadConversations = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/task-executions?limit=10', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const chats: Chat[] = data.executions.map((exec: any) => ({
            id: exec._id,
            conversationId: exec.executionId,
            domainId: exec.domainId,
            processName: exec.masterTaskName || 'Chat',
            processId: exec.masterTaskId,
            executionModel: exec.executionModel || 'chat',
            startedAt: new Date(exec.createdAt),
            lastMessageAt: new Date(exec.updatedAt),
            messageCount: exec.messages?.length || 0,
            title: exec.title,
          }));
          setRecentChats(chats);
        }
      } catch (error) {
        console.error('Failed to load conversations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadConversations();
  }, [user, accessToken]);

  // Don't persist to session storage anymore - use database

  const addChat = (chatData: Omit<Chat, 'id' | 'startedAt' | 'lastMessageAt' | 'messageCount'>) => {
    // Create a temporary chat object for immediate UI feedback
    const tempChat: Chat = {
      ...chatData,
      id: `temp-${Date.now()}`,
      startedAt: new Date(),
      lastMessageAt: new Date(),
      messageCount: 0,
      title: chatData.processName,
    };

    // Optimistically add to UI
    setRecentChats(prev => [tempChat, ...prev].slice(0, 10));
    
    // Note: The actual conversation will be created when the first message is sent
    // This avoids creating empty conversations if the user closes the chat without sending a message
    return tempChat;
  };

  const updateChatActivity = (chatId: string, conversationId?: string, title?: string) => {
    setRecentChats(prev => 
      prev.map(chat => {
        if (chat.id === chatId) {
          return { 
            ...chat, 
            lastMessageAt: new Date(), 
            messageCount: chat.messageCount + 1,
            // Update with real conversation ID when available
            ...(conversationId && { conversationId, id: conversationId }),
            ...(title && { title })
          };
        }
        return chat;
      }).sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime())
    );
  };

  const clearRecentChats = () => {
    setRecentChats([]);
  };

  return (
    <ChatContext.Provider 
      value={{ 
        recentChats,
        addChat,
        updateChatActivity,
        clearRecentChats,
        isLoading,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}