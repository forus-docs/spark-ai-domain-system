'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/auth-context';
import { useDomain } from '@/app/contexts/domain-context';
import { ChatInterfaceWrapper } from '@/app/components/chat-interface-wrapper';
import { TaskExecutionService } from '@/app/services/task-executions';

interface PageProps {
  params: {
    executionId: string;
  };
}

export default function ChatPage({ params }: PageProps) {
  const router = useRouter();
  const { user, accessToken } = useAuth();
  const { currentDomain } = useDomain();
  const [taskExecution, setTaskExecution] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !accessToken) {
      router.push('/auth');
      return;
    }

    const loadTaskExecution = async () => {
      try {
        console.log('Loading task execution:', params.executionId);
        console.log('User ID:', user.id);
        
        // Get task execution details using API route instead of service
        const headers: Record<string, string> = {};
        if (accessToken) {
          headers['Authorization'] = `Bearer ${accessToken}`;
        }
        
        const response = await fetch(`/api/task-executions/${params.executionId}`, {
          headers,
        });
        
        if (!response.ok) {
          console.error('Failed to load task execution:', response.status);
          if (response.status === 404) {
            console.error('Task execution not found');
          }
          router.push(currentDomain?.slug ? `/${currentDomain.slug}` : '/');
          return;
        }
        
        const data = await response.json();
        console.log('Task execution loaded:', data);
        
        setTaskExecution(data);
      } catch (error) {
        console.error('Error loading task execution:', error);
        router.push(currentDomain?.slug ? `/${currentDomain.slug}` : '/');
      } finally {
        setIsLoading(false);
      }
    };

    loadTaskExecution();
  }, [params.executionId, user, accessToken, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading task execution...</div>
      </div>
    );
  }

  if (!taskExecution) {
    return null;
  }

  return (
    <>
      <ChatInterfaceWrapper
        taskExecution={taskExecution}
        executionId={params.executionId}
        onClose={() => router.push(currentDomain?.slug ? `/${currentDomain.slug}` : '/')}
      />
    </>
  );
}