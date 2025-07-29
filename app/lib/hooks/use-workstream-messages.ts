import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/auth-context';

interface WorkstreamMessage {
  _id: string;
  messageId: string;
  executionId: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  text: string;
  userId: string;
  isCreatedByUser?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function useWorkstreamMessages(workstreamId: string) {
  const { accessToken } = useAuth();
  const [messages, setMessages] = useState<WorkstreamMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken || !workstreamId) return;

    const fetchMessages = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/workstreams/${workstreamId}/messages?limit=100`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch messages');
        }

        const data = await response.json();
        setMessages(data.messages || []);
      } catch (err) {
        console.error('Error fetching messages:', err);
        setError(err instanceof Error ? err.message : 'Failed to load messages');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [workstreamId, accessToken]);

  return { messages, loading, error, setMessages };
}