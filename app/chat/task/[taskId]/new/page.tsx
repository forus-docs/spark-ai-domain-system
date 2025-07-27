'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/auth-context';
import { ChatInterfaceV2 } from '@/app/components/chat-interface-v2';
import { Loader2 } from 'lucide-react';

interface PageProps {
  params: {
    taskId: string;
  };
}

export default function NewTaskChatPage({ params }: PageProps) {
  const router = useRouter();
  const { accessToken } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [executionData, setExecutionData] = useState<{
    executionId: string;
    title: string;
    executionModel: string;
    aiAgentRole?: string;
    introMessage?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    const startTask = async () => {
      try {
        const response = await fetch('/api/chat/start-task', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userTaskId: params.taskId }),
        });

        if (!response.ok) {
          const error = await response.json();
          setError(error.error || 'Failed to start task');
          setIsLoading(false);
          return;
        }

        const data = await response.json();
        setExecutionData(data);
        
        // Redirect to the chat with the execution ID
        router.replace(`/chat/${data.executionId}`);
      } catch (error) {
        console.error('Error starting task:', error);
        setError('Failed to start task. Please try again.');
        setIsLoading(false);
      }
    };

    startTask();
  }, [accessToken, params.taskId, router]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Start Task</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Starting task...</p>
      </div>
    </div>
  );
}