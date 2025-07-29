'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDomain } from '@/app/contexts/domain-context';
import { useAuth } from '@/app/contexts/auth-context';
import { MessageSquare, Clock, CheckCircle } from 'lucide-react';
import { cn } from '@/app/lib/utils';

interface TaskExecution {
  _id: string;
  executionId: string;
  taskSnapshot: {
    title: string;
    description?: string;
    taskType?: string;
  };
  status: 'assigned' | 'in_progress' | 'completed' | 'failed';
  assignedAt: string;
  updatedAt: string;
}

export default function TaskExecutions() {
  const router = useRouter();
  const { currentDomain } = useDomain();
  const { user, accessToken } = useAuth();
  const [taskExecutions, setTaskExecutions] = useState<TaskExecution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentDomain && accessToken) {
      fetchTaskExecutions();
    }
  }, [currentDomain, accessToken]);

  const fetchTaskExecutions = async () => {
    if (!accessToken || !currentDomain) return;

    try {
      const response = await fetch(`/api/task-executions?limit=1000&domainId=${currentDomain.id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTaskExecutions(data.executions || []);
      }
    } catch (error) {
      console.error('Error fetching task executions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-600" />;
      default:
        return <MessageSquare className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      case 'assigned':
        return 'Assigned';
      default:
        return status;
    }
  };

  if (!currentDomain) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-light text-gray-900 mb-4">
            Welcome to Spark AI
          </h1>
          <p className="text-gray-600 mb-8">
            Select a domain to get started with AI-powered business processes.
          </p>
          <Link
            href="/domains"
            className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Browse Domains
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4">
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : taskExecutions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No active tasks</p>
          </div>
        ) : (
          <div className="space-y-2">
            {taskExecutions.map((execution) => (
              <div
                key={execution._id}
                onClick={() => router.push(`/chat/${execution.executionId}`)}
                className="block bg-white rounded-lg p-4 hover:bg-gray-50 transition-colors border border-gray-200 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <MessageSquare className="w-5 h-5 text-gray-400" />
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {execution.taskSnapshot.title || 'Untitled Chat'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {getStatusText(execution.status)} • {new Date(execution.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}