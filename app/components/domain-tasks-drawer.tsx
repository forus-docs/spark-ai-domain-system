'use client';

import React, { useState, useEffect } from 'react';
import { ChevronRight, Loader2, X } from 'lucide-react';
import { useDomain } from '@/app/contexts/domain-context';
import { useAuth } from '@/app/contexts/auth-context';
import { cn } from '@/app/lib/utils';

interface DomainTask {
  id: string;
  title: string;
  description: string;
  category: string;
  icon?: string;
  taskType?: string;
}

interface DomainTasksDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskSelect: (task: DomainTask) => void;
}

export function DomainTasksDrawer({ isOpen, onClose, onTaskSelect }: DomainTasksDrawerProps) {
  const { currentDomain } = useDomain();
  const { accessToken } = useAuth();
  const [tasks, setTasks] = useState<DomainTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && currentDomain) {
      fetchDomainTasks();
    }
  }, [isOpen, currentDomain, accessToken]);

  const fetchDomainTasks = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!accessToken) {
        setError('Not authenticated');
        return;
      }

      if (!currentDomain) {
        setError('No domain selected');
        return;
      }

      const response = await fetch(`/api/domain-tasks/master?domain=${currentDomain.id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }

      const data = await response.json();
      setTasks(data.posts || []);
    } catch (err) {
      console.error('Error fetching domain tasks:', err);
      setError('Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  };

  // Group tasks by category
  const tasksByCategory = tasks.reduce((acc, task) => {
    const category = task.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(task);
    return acc;
  }, {} as Record<string, DomainTask[]>);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 z-50"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div className={cn(
        "fixed bottom-0 left-0 right-0 bg-white rounded-t-xl shadow-lg z-50 transition-transform duration-300 ease-out",
        isOpen ? "translate-y-0" : "translate-y-full"
      )}>
        {/* Handle */}
        <div className="flex justify-center pt-2">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Available Tasks</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          )}

          {error && (
            <div className="text-center py-8 text-gray-500">
              {error}
            </div>
          )}

          {!isLoading && !error && tasks.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No tasks available
            </div>
          )}

          {!isLoading && !error && tasks.length > 0 && (
            <div className="py-2">
              {Object.entries(tasksByCategory).map(([category, categoryTasks]) => (
                <div key={category} className="mb-4">
                  <h4 className="px-4 py-2 text-sm font-medium text-gray-600 uppercase tracking-wider">
                    {category}
                  </h4>
                  <div className="space-y-1">
                    {categoryTasks.map((task) => (
                      <button
                        key={task.id}
                        onClick={() => {
                          onTaskSelect(task);
                          onClose();
                        }}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3 text-left">
                          {task.icon && (
                            <span className="text-2xl">{task.icon}</span>
                          )}
                          <div>
                            <div className="font-medium text-gray-900">{task.title}</div>
                            <div className="text-sm text-gray-500 line-clamp-1">{task.description}</div>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}