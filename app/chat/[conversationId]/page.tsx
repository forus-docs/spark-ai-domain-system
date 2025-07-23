'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/auth-context';
import { ChatInterfaceV2 } from '@/app/components/chat-interface-v2';
import { ConversationService } from '@/app/services/conversations';

interface PageProps {
  params: {
    conversationId: string;
  };
}

export default function ChatPage({ params }: PageProps) {
  const router = useRouter();
  const { user, accessToken } = useAuth();
  const [conversation, setConversation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !accessToken) {
      router.push('/auth');
      return;
    }

    const loadConversation = async () => {
      try {
        console.log('Loading conversation:', params.conversationId);
        console.log('User ID:', user.id);
        
        // Get conversation details using API route instead of service
        const headers: Record<string, string> = {};
        if (accessToken) {
          headers['Authorization'] = `Bearer ${accessToken}`;
        }
        
        const response = await fetch(`/api/conversations/${params.conversationId}`, {
          headers,
        });
        
        if (!response.ok) {
          console.error('Failed to load conversation:', response.status);
          if (response.status === 404) {
            console.error('Conversation not found');
          }
          router.push('/');
          return;
        }
        
        const data = await response.json();
        console.log('Conversation loaded:', data);
        
        setConversation(data);
      } catch (error) {
        console.error('Error loading conversation:', error);
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    loadConversation();
  }, [params.conversationId, user, accessToken, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading conversation...</div>
      </div>
    );
  }

  if (!conversation) {
    return null;
  }

  return (
    <ChatInterfaceV2
      conversationId={conversation.conversationId}
      processName={conversation.processName}
      processId={conversation.processId}
      executionModel={conversation.executionModel}
      userPostId={conversation.userPostId}
      onClose={() => router.push('/')}
      accessToken={accessToken || undefined}
    />
  );
}