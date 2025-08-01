'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Clock, User, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { useDomain } from '@/app/contexts/domain-context';
import { useCamunda } from '@/app/contexts/camunda-context';

interface Task {
  id: string;
  name: string;
  assignee: string | null;
  created: string;
  due: string | null;
  priority: number;
  processDefinitionId: string;
  processDefinitionName?: string;
  processInstanceId: string;
}

interface TaskListProps {
  filters: {
    assignee: 'all' | 'me' | 'unassigned';
    processDefinition: string;
    searchTerm: string;
  };
  selectedTaskId: string | null;
  onTaskSelect: (taskId: string) => void;
  currentUser: string;
}

export function TaskList({
  filters,
  selectedTaskId,
  onTaskSelect,
  currentUser,
}: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentDomain } = useDomain();
  
  // Try to use Camunda context if available (BPM domain)
  let camundaUser = null;
  try {
    const camundaContext = useCamunda();
    camundaUser = camundaContext.currentUser;
  } catch (e) {
    // Not in Camunda context, that's fine
  }

  useEffect(() => {
    fetchTasks();
  }, [filters, currentUser]);

  const fetchTasks = async () => {
    // Only fetch if we're in BPM domain
    if (currentDomain?.slug !== 'bpm') {
      setTasks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // Add Camunda auth if available
      if (camundaUser) {
        headers['X-Camunda-Auth'] = btoa(`${camundaUser.username}:${camundaUser.password}`);
      }

      const response = await fetch('/api/camunda/tasks', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          filters,
          currentUser: camundaUser?.username || currentUser,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }

      const data = await response.json();
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimTask = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (currentDomain?.slug !== 'bpm') return;
    
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // Add Camunda auth if available
      if (camundaUser) {
        headers['X-Camunda-Auth'] = btoa(`${camundaUser.username}:${camundaUser.password}`);
      }

      const response = await fetch(`/api/camunda/tasks/${taskId}/claim`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId: camundaUser?.username || currentUser }),
      });

      if (response.ok) {
        fetchTasks();
      }
    } catch (error) {
      console.error('Error claiming task:', error);
    }
  };

  const handleUnclaimTask = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (currentDomain?.slug !== 'bpm') return;
    
    try {
      const headers: HeadersInit = {};

      // Add Camunda auth if available
      if (camundaUser) {
        headers['X-Camunda-Auth'] = btoa(`${camundaUser.username}:${camundaUser.password}`);
      }

      const response = await fetch(`/api/camunda/tasks/${taskId}/claim`, {
        method: 'DELETE',
        headers,
      });

      if (response.ok) {
        fetchTasks();
      }
    } catch (error) {
      console.error('Error unclaiming task:', error);
    }
  };

  const formatTaskName = (name: string) => {
    return name.replace(/\\n/g, ' ');
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 75) return 'text-red-600';
    if (priority >= 50) return 'text-orange-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <AlertCircle className="w-12 h-12 mb-2" />
        <p>No tasks found</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {tasks.map((task) => (
        <div
          key={task.id}
          onClick={() => onTaskSelect(task.id)}
          className={cn(
            'p-4 hover:bg-gray-50 cursor-pointer transition-colors',
            selectedTaskId === task.id && 'bg-blue-50 hover:bg-blue-50'
          )}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-medium text-sm text-gray-900">
                {formatTaskName(task.name)}
              </h3>
              
              <div className="mt-1 flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {format(new Date(task.created), 'MMM d, HH:mm')}
                </span>
                
                {task.assignee ? (
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {task.assignee}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-600">
                    <AlertCircle className="w-3 h-3" />
                    Unassigned
                  </span>
                )}
                
                {task.priority > 0 && (
                  <span className={cn('font-medium', getPriorityColor(task.priority))}>
                    Priority: {task.priority}
                  </span>
                )}
              </div>
              
              <div className="mt-1 text-xs text-gray-500">
                {task.processDefinitionName || task.processDefinitionId}
              </div>
              
              {task.due && (
                <div className="mt-1 text-xs text-gray-500">
                  Due: {format(new Date(task.due), 'MMM d, yyyy')}
                </div>
              )}
            </div>
            
            <div className="ml-4 flex items-center gap-2">
              {!task.assignee ? (
                <button
                  onClick={(e) => handleClaimTask(task.id, e)}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Claim
                </button>
              ) : task.assignee === currentUser ? (
                <button
                  onClick={(e) => handleUnclaimTask(task.id, e)}
                  className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                >
                  Unclaim
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}