'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/auth-context';
import { useDomain } from '@/app/contexts/domain-context';
import { PostCard } from '@/app/components/post-card';
import { IMasterTask } from '@/app/models/MasterTask';
import { cn } from '@/app/lib/utils';

export default function TasksPage() {
  const router = useRouter();
  const { user, accessToken } = useAuth();
  const { currentDomain } = useDomain();
  
  // State management
  const [activeTab, setActiveTab] = useState<'library' | 'domain' | 'assigned'>('domain');
  const [assignmentFilter, setAssignmentFilter] = useState<'to-me' | 'by-me'>('to-me');
  const [domainTasks, setDomainTasks] = useState<IMasterTask[]>([]);
  const [userTasks, setUserTasks] = useState<IMasterTask[]>([]);
  const [masterTasks, setMasterTasks] = useState<IMasterTask[]>([]);
  const [selectedMasterTask, setSelectedMasterTask] = useState<IMasterTask | null>(null);
  const [showAdoptModal, setShowAdoptModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch domain tasks
  const fetchDomainTasks = async () => {
    if (!currentDomain || !accessToken) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(
        `/api/domain-tasks/master?domain=${currentDomain.id}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch domain tasks');
      }
      
      const data = await response.json();
      setDomainTasks(data.posts || []); // API returns as 'posts' for backward compatibility
    } catch (error) {
      console.error('Error fetching domain tasks:', error);
      setError('Failed to load domain tasks');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch master tasks (library)
  const fetchMasterTasks = async () => {
    if (!accessToken || !currentDomain) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(
        `/api/domains/${currentDomain.id}/adopt-task`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
      console.log('Fetching from URL:', `/api/domains/${currentDomain.id}/adopt-task`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch master tasks');
      }
      
      const data = await response.json();
      console.log('Library API response:', data);
      setMasterTasks(data.availableTasks || []);
    } catch (error) {
      console.error('Error fetching master tasks:', error);
      setError('Failed to load task library');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch user tasks
  const fetchUserTasks = async () => {
    if (!currentDomain || !accessToken || !user) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const filter = assignmentFilter === 'to-me' ? 'to-me' : 'by-me';
      const response = await fetch(
        `/api/tasks/assigned?filter=${filter}&domain=${currentDomain.id}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch user tasks');
      }
      
      const data = await response.json();
      setUserTasks(data.tasks || []);
    } catch (error) {
      console.error('Error fetching user tasks:', error);
      setError('Failed to load assigned tasks');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle domain task click (assign to self)
  const handleDomainTaskClick = async (task: IMasterTask) => {
    try {
      // Assign task to self
      const response = await fetch('/api/domain-tasks/assign', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ taskId: task._id })
      });
      
      if (response.ok) {
        const { executionId } = await response.json();
        // Navigate directly to chat with the execution
        router.push(`/chat/${executionId}`);
      }
    } catch (error) {
      console.error('Error assigning task:', error);
    }
  };

  // Handle master task click (show detail view)
  const handleMasterTaskClick = (task: IMasterTask) => {
    setSelectedMasterTask(task);
  };

  // Handle adopt button click
  const handleAdoptClick = () => {
    if (selectedMasterTask) {
      setShowAdoptModal(true);
    }
  };

  // Handle adoption confirmation
  const handleAdoptConfirm = async () => {
    if (!selectedMasterTask || !currentDomain) return;
    
    try {
      const response = await fetch(`/api/domains/${currentDomain.id}/adopt-task`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          masterTaskId: selectedMasterTask._id || selectedMasterTask.masterTaskId 
        })
      });
      
      if (response.ok) {
        // Refresh domain tasks to show newly adopted task
        await fetchDomainTasks();
        setShowAdoptModal(false);
        setSelectedMasterTask(null);
        setActiveTab('domain'); // Switch to domain tab to see the new task
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to adopt task');
      }
    } catch (error) {
      console.error('Error adopting task:', error);
      alert('Failed to adopt task');
    }
  };

  // Handle user task click (navigate to execution)
  const handleUserTaskClick = async (task: any) => {
    // Task executions already exist, just navigate to chat
    if (task.executionId) {
      router.push(`/chat/${task.executionId}`);
    }
  };

  // Effect for domain tasks
  useEffect(() => {
    if (activeTab !== 'domain' || !currentDomain || !accessToken) return;
    fetchDomainTasks();
  }, [activeTab, currentDomain, accessToken]);

  // Effect for user tasks
  useEffect(() => {
    if (activeTab !== 'assigned' || !currentDomain || !accessToken || !user) return;
    fetchUserTasks();
  }, [activeTab, assignmentFilter, currentDomain, accessToken, user]);

  // Effect for master tasks
  useEffect(() => {
    if (activeTab !== 'library' || !currentDomain || !accessToken) return;
    fetchMasterTasks();
  }, [activeTab, currentDomain, accessToken]);

  // Since this is now under /[domain]/tasks, we should always have a domain
  if (!currentDomain) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center py-12 text-gray-500">
          Loading domain information...
        </div>
      </div>
    );
  }

  const tasks = activeTab === 'library' ? masterTasks : activeTab === 'domain' ? domainTasks : userTasks;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8">Tasks</h1>
      
      {/* Tab Navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          {/* Library tab - only show on desktop */}
          <button
            onClick={() => setActiveTab('library')}
            className={cn(
              "hidden md:flex px-4 py-2 rounded-full text-sm font-medium transition-colors",
              activeTab === 'library' 
                ? "bg-blue-100 text-blue-700" 
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            Library
          </button>
          <button
            onClick={() => setActiveTab('domain')}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-colors",
              activeTab === 'domain' 
                ? "bg-blue-100 text-blue-700" 
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            Domain
          </button>
          <button
            onClick={() => setActiveTab('assigned')}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-colors",
              activeTab === 'assigned' 
                ? "bg-blue-100 text-blue-700" 
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            Assigned
          </button>
        </div>

        {/* Assignment Toggle (only for assigned tab) */}
        {activeTab === 'assigned' && (
          <div className="flex gap-2">
            <button
              onClick={() => setAssignmentFilter('to-me')}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                assignmentFilter === 'to-me'
                  ? "bg-gray-900 text-white"
                  : "bg-gray-200 text-gray-600 hover:bg-gray-300"
              )}
            >
              to me
            </button>
            <button
              onClick={() => setAssignmentFilter('by-me')}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                assignmentFilter === 'by-me'
                  ? "bg-gray-900 text-white"
                  : "bg-gray-200 text-gray-600 hover:bg-gray-300"
              )}
            >
              by me
            </button>
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-100 animate-pulse rounded-lg h-48" />
          ))}
        </div>
      )}

      {/* Task List */}
      {!isLoading && tasks.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          {activeTab === 'domain' 
            ? "No tasks available for this domain"
            : assignmentFilter === 'to-me' 
              ? "No tasks assigned to you"
              : "You haven't assigned any tasks"}
        </div>
      )}

      {!isLoading && tasks.length > 0 && activeTab !== 'library' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map(task => (
            <PostCard
              key={task._id ? String(task._id) : task.masterTaskId}
              post={task as any}
              onClick={() => 
                activeTab === 'domain' 
                  ? handleDomainTaskClick(task)
                  : handleUserTaskClick(task)
              }
            />
          ))}
        </div>
      )}

      {/* Library view - Master tasks */}
      {!isLoading && activeTab === 'library' && !selectedMasterTask && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {masterTasks.map(task => (
            <div
              key={(task._id || task.masterTaskId) as string}
              onClick={() => handleMasterTaskClick(task)}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
            >
              <h3 className="text-lg font-semibold mb-2">{task.name || task.title}</h3>
              <p className="text-sm text-gray-600 mb-4 line-clamp-3">{task.description}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                  {task.category}
                </span>
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                  {task.executionModel}
                </span>
                {task.aiAgentAttached && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                    AI Enabled
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-500">
                {task.sopMetadata?.estimatedDuration || task.estimatedTime || 'Duration varies'}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Master task detail view - Full screen */}
      {selectedMasterTask && activeTab === 'library' && (
        <div className="fixed inset-0 bg-gray-50 z-40 overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Header - Same height as app bar */}
            <div className="bg-white border-b h-14 flex items-center">
              <div className="flex items-center justify-between w-full px-3">
                {/* Back button - Aligned with hamburger */}
                <button
                  onClick={() => setSelectedMasterTask(null)}
                  className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                  aria-label="Back to library"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                {/* Title - Centered in remaining space */}
                <div className="flex-1 flex items-center px-3">
                  <h2 className="text-base font-semibold text-gray-900">{selectedMasterTask.name || selectedMasterTask.title}</h2>
                </div>

                {/* Actions - Copy and Download */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(selectedMasterTask, null, 2));
                      // TODO: Add toast notification
                    }}
                    className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                    aria-label="Copy task data"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      const blob = new Blob([JSON.stringify(selectedMasterTask, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${selectedMasterTask.masterTaskId || 'task'}.json`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }}
                    className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                    aria-label="Download task data"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-6xl mx-auto p-6 space-y-6">
                {/* Basic Information */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-700">Master Task ID</h4>
                      <p className="text-gray-600">{selectedMasterTask.masterTaskId}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700">Name</h4>
                      <p className="text-gray-600">{selectedMasterTask.name}</p>
                    </div>
                    <div className="md:col-span-2">
                      <h4 className="font-medium text-gray-700">Description</h4>
                      <p className="text-gray-600">{selectedMasterTask.description}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700">Category</h4>
                      <p className="text-gray-600">{selectedMasterTask.category}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700">Task Type</h4>
                      <p className="text-gray-600">{selectedMasterTask.taskType || 'task'}</p>
                    </div>
                  </div>
                </div>

                {/* Execution Configuration */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold mb-4">Execution Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-700">Execution Model</h4>
                      <p className="text-gray-600">{selectedMasterTask.executionModel}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700">Current Stage</h4>
                      <p className="text-gray-600">{selectedMasterTask.currentStage}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700">Priority</h4>
                      <p className="text-gray-600">{selectedMasterTask.priority}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700">Estimated Time</h4>
                      <p className="text-gray-600">{selectedMasterTask.estimatedTime || 'Not specified'}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700">Version</h4>
                      <p className="text-gray-600">{selectedMasterTask.version}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700">QMS Compliant</h4>
                      <p className="text-gray-600">{selectedMasterTask.isQMSCompliant ? 'Yes' : 'No'}</p>
                    </div>
                    {selectedMasterTask.reward && (
                      <div>
                        <h4 className="font-medium text-gray-700">Reward</h4>
                        <p className="text-gray-600">{selectedMasterTask.reward.displayText}</p>
                        <p className="text-xs text-gray-500">{selectedMasterTask.reward.amount} {selectedMasterTask.reward.currency}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Display Configuration */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold mb-4">Display Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-700">Title</h4>
                      <p className="text-gray-600">{selectedMasterTask.title || selectedMasterTask.name}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700">Icon Type</h4>
                      <p className="text-gray-600">{selectedMasterTask.iconType || 'checklist'}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700">Color Scheme</h4>
                      <p className="text-gray-600">{selectedMasterTask.colorScheme || 'blue'}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700">CTA Text</h4>
                      <p className="text-gray-600">{selectedMasterTask.ctaText || 'Start Task'}</p>
                    </div>
                    {selectedMasterTask.ctaAction && (
                      <div className="md:col-span-2">
                        <h4 className="font-medium text-gray-700">CTA Action</h4>
                        <div className="text-sm text-gray-600">
                          <div>Type: {selectedMasterTask.ctaAction.type}</div>
                          <div>Target: {selectedMasterTask.ctaAction.target}</div>
                          {Object.keys(selectedMasterTask.ctaAction.params || {}).length > 0 && (
                            <details className="mt-1">
                              <summary className="cursor-pointer">Parameters</summary>
                              <pre className="mt-1 p-2 bg-gray-50 rounded text-xs overflow-auto">
                                {JSON.stringify(selectedMasterTask.ctaAction.params, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    )}
                    {selectedMasterTask.imageUrl && (
                      <div className="md:col-span-2">
                        <h4 className="font-medium text-gray-700">Image URL</h4>
                        <p className="text-gray-600 break-all">{selectedMasterTask.imageUrl}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Task Flow */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold mb-4">Task Flow</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-700">Requires Identity Verification</h4>
                      <p className="text-gray-600">{selectedMasterTask.requiresIdentityVerification ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700">Can Hide</h4>
                      <p className="text-gray-600">{selectedMasterTask.canHide ? 'Yes' : 'No'}</p>
                    </div>
                    {selectedMasterTask.prerequisiteTasks?.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-700">Prerequisite Tasks</h4>
                        <ul className="list-disc list-inside text-gray-600">
                          {selectedMasterTask.prerequisiteTasks.map((task: string, index: number) => (
                            <li key={index}>{task}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {selectedMasterTask.nextTasks?.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-700">Next Tasks</h4>
                        <ul className="list-disc list-inside text-gray-600">
                          {selectedMasterTask.nextTasks.map((task: string, index: number) => (
                            <li key={index}>{task}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* AI Configuration */}
                {selectedMasterTask.aiAgentAttached && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold mb-4">AI Configuration</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-700">AI Agent Attached</h4>
                        <p className="text-gray-600">Yes</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-700">AI Agent Role</h4>
                        <p className="text-gray-600">{selectedMasterTask.aiAgentRole || 'Not specified'}</p>
                      </div>
                      {selectedMasterTask.aiAgentId && (
                        <div>
                          <h4 className="font-medium text-gray-700">AI Agent ID</h4>
                          <p className="text-gray-600">{selectedMasterTask.aiAgentId}</p>
                        </div>
                      )}
                      {selectedMasterTask.aiCurrentFocus && (
                        <div>
                          <h4 className="font-medium text-gray-700">Current Focus</h4>
                          <p className="text-gray-600">{selectedMasterTask.aiCurrentFocus}</p>
                        </div>
                      )}
                      {selectedMasterTask.promotionArtifact && (
                        <div>
                          <h4 className="font-medium text-gray-700">Promotion Artifact</h4>
                          <p className="text-gray-600">{selectedMasterTask.promotionArtifact}</p>
                        </div>
                      )}
                      {selectedMasterTask.promotionDate && (
                        <div>
                          <h4 className="font-medium text-gray-700">Promotion Date</h4>
                          <p className="text-gray-600">{new Date(selectedMasterTask.promotionDate).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>
                    {selectedMasterTask.systemPrompt && (
                      <div className="mt-4">
                        <h4 className="font-medium text-gray-700">System Prompt</h4>
                        <pre className="mt-2 p-3 bg-gray-50 rounded text-sm text-gray-600 whitespace-pre-wrap">
                          {selectedMasterTask.systemPrompt}
                        </pre>
                      </div>
                    )}
                    {selectedMasterTask.intro && (
                      <div className="mt-4">
                        <h4 className="font-medium text-gray-700">Introduction Message</h4>
                        <p className="mt-2 p-3 bg-gray-50 rounded text-gray-600">
                          {selectedMasterTask.intro}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Domain Customizations */}
                {selectedMasterTask.domainCustomizations && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold mb-4">Domain Customizations</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedMasterTask.domainCustomizations.title && (
                        <div className="md:col-span-2">
                          <h4 className="font-medium text-gray-700">Custom Title</h4>
                          <p className="text-gray-600">{selectedMasterTask.domainCustomizations.title}</p>
                        </div>
                      )}
                      {selectedMasterTask.domainCustomizations.description && (
                        <div className="md:col-span-2">
                          <h4 className="font-medium text-gray-700">Custom Description</h4>
                          <p className="text-gray-600">{selectedMasterTask.domainCustomizations.description}</p>
                        </div>
                      )}
                      {selectedMasterTask.domainCustomizations.estimatedTime && (
                        <div>
                          <h4 className="font-medium text-gray-700">Custom Estimated Time</h4>
                          <p className="text-gray-600">{selectedMasterTask.domainCustomizations.estimatedTime}</p>
                        </div>
                      )}
                      {selectedMasterTask.domainCustomizations.reward && (
                        <div>
                          <h4 className="font-medium text-gray-700">Custom Reward</h4>
                          <p className="text-gray-600">{selectedMasterTask.domainCustomizations.reward.displayText}</p>
                        </div>
                      )}
                      {selectedMasterTask.domainCustomizations.systemPrompt && (
                        <div className="md:col-span-2">
                          <h4 className="font-medium text-gray-700">Custom System Prompt</h4>
                          <pre className="mt-2 p-3 bg-gray-50 rounded text-sm text-gray-600 whitespace-pre-wrap">
                            {selectedMasterTask.domainCustomizations.systemPrompt}
                          </pre>
                        </div>
                      )}
                      {selectedMasterTask.domainCustomizations.additionalContext && (
                        <div className="md:col-span-2">
                          <h4 className="font-medium text-gray-700">Additional Context</h4>
                          <p className="text-gray-600">{selectedMasterTask.domainCustomizations.additionalContext}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Domain-Specific Fields */}
                {(selectedMasterTask.domain || selectedMasterTask.adoptedAt || selectedMasterTask.adoptedBy) && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold mb-4">Domain Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedMasterTask.domain && (
                        <div>
                          <h4 className="font-medium text-gray-700">Domain ID</h4>
                          <p className="text-gray-600">{selectedMasterTask.domain}</p>
                        </div>
                      )}
                      {selectedMasterTask.adoptedAt && (
                        <div>
                          <h4 className="font-medium text-gray-700">Adopted At</h4>
                          <p className="text-gray-600">{new Date(selectedMasterTask.adoptedAt).toLocaleDateString()}</p>
                        </div>
                      )}
                      {selectedMasterTask.adoptedBy && (
                        <div>
                          <h4 className="font-medium text-gray-700">Adopted By</h4>
                          <p className="text-gray-600">{selectedMasterTask.adoptedBy}</p>
                        </div>
                      )}
                      {selectedMasterTask.adoptionNotes && (
                        <div className="md:col-span-2">
                          <h4 className="font-medium text-gray-700">Adoption Notes</h4>
                          <p className="text-gray-600">{selectedMasterTask.adoptionNotes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Adopted By Domains */}
                {selectedMasterTask.adoptedByDomains && selectedMasterTask.adoptedByDomains.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold mb-4">Adopted By Domains</h3>
                    <div className="space-y-3">
                      {selectedMasterTask.adoptedByDomains.map((adoption: any, index: number) => (
                        <div key={index} className="border-l-4 border-blue-500 pl-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <h4 className="font-medium text-gray-700">Domain ID</h4>
                              <p className="text-gray-600">{adoption.domainId}</p>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-700">Adopted At</h4>
                              <p className="text-gray-600">{new Date(adoption.adoptedAt).toLocaleDateString()}</p>
                            </div>
                            {adoption.customName && (
                              <div>
                                <h4 className="font-medium text-gray-700">Custom Name</h4>
                                <p className="text-gray-600">{adoption.customName}</p>
                              </div>
                            )}
                            {adoption.customDescription && (
                              <div>
                                <h4 className="font-medium text-gray-700">Custom Description</h4>
                                <p className="text-gray-600">{adoption.customDescription}</p>
                              </div>
                            )}
                            <div>
                              <h4 className="font-medium text-gray-700">Active</h4>
                              <p className="text-gray-600">{adoption.isActive ? 'Yes' : 'No'}</p>
                            </div>
                            {adoption.allowedRoles && adoption.allowedRoles.length > 0 && (
                              <div>
                                <h4 className="font-medium text-gray-700">Allowed Roles</h4>
                                <p className="text-gray-600">{adoption.allowedRoles.join(', ')}</p>
                              </div>
                            )}
                            {adoption.metrics && (
                              <div className="md:col-span-2">
                                <h4 className="font-medium text-gray-700">Metrics</h4>
                                <div className="grid grid-cols-3 gap-2 mt-1 text-sm">
                                  <div>
                                    <span className="font-medium">Executions:</span> {adoption.metrics.executionCount}
                                  </div>
                                  <div>
                                    <span className="font-medium">Avg Time:</span> {adoption.metrics.averageCompletionTime}min
                                  </div>
                                  <div>
                                    <span className="font-medium">Success:</span> {adoption.metrics.successRate}%
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* User Assignment Fields */}
                {(selectedMasterTask.userId || selectedMasterTask.assignedTo) && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold mb-4">User Assignment</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedMasterTask.userId && (
                        <div>
                          <h4 className="font-medium text-gray-700">User ID</h4>
                          <p className="text-gray-600">{selectedMasterTask.userId}</p>
                        </div>
                      )}
                      {selectedMasterTask.domainTaskId && (
                        <div>
                          <h4 className="font-medium text-gray-700">Domain Task ID</h4>
                          <p className="text-gray-600">{selectedMasterTask.domainTaskId}</p>
                        </div>
                      )}
                      {selectedMasterTask.assignedTo && (
                        <div>
                          <h4 className="font-medium text-gray-700">Assigned To</h4>
                          <p className="text-gray-600">{selectedMasterTask.assignedTo}</p>
                        </div>
                      )}
                      {selectedMasterTask.assignedBy && (
                        <div>
                          <h4 className="font-medium text-gray-700">Assigned By</h4>
                          <p className="text-gray-600">{selectedMasterTask.assignedBy}</p>
                        </div>
                      )}
                      {selectedMasterTask.assignmentReason && (
                        <div className="md:col-span-2">
                          <h4 className="font-medium text-gray-700">Assignment Reason</h4>
                          <p className="text-gray-600">{selectedMasterTask.assignmentReason}</p>
                        </div>
                      )}
                      {selectedMasterTask.timestampAssigned && (
                        <div>
                          <h4 className="font-medium text-gray-700">Assigned At</h4>
                          <p className="text-gray-600">{new Date(selectedMasterTask.timestampAssigned).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* User Progress */}
                {(selectedMasterTask.progress || selectedMasterTask.isCompleted !== undefined) && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold mb-4">User Progress</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-700">Completed</h4>
                        <p className="text-gray-600">{selectedMasterTask.isCompleted ? 'Yes' : 'No'}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-700">Hidden</h4>
                        <p className="text-gray-600">{selectedMasterTask.isHidden ? 'Yes' : 'No'}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-700">View Count</h4>
                        <p className="text-gray-600">{selectedMasterTask.viewCount || 0}</p>
                      </div>
                      {selectedMasterTask.completedAt && (
                        <div>
                          <h4 className="font-medium text-gray-700">Completed At</h4>
                          <p className="text-gray-600">{new Date(selectedMasterTask.completedAt).toLocaleDateString()}</p>
                        </div>
                      )}
                      {selectedMasterTask.progress && (
                        <>
                          <div>
                            <h4 className="font-medium text-gray-700">Current Step</h4>
                            <p className="text-gray-600">{selectedMasterTask.progress.currentStep}/{selectedMasterTask.progress.totalSteps}</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-700">Progress</h4>
                            <div className="mt-1">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ width: `${selectedMasterTask.progress.percentComplete}%` }}
                                />
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{selectedMasterTask.progress.percentComplete}% complete</p>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    {selectedMasterTask.completionData && (
                      <div className="mt-4">
                        <h4 className="font-medium text-gray-700">Completion Data</h4>
                        <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-auto">
                          {JSON.stringify(selectedMasterTask.completionData, null, 2)}
                        </pre>
                      </div>
                    )}
                    {selectedMasterTask.params && (
                      <div className="mt-4">
                        <h4 className="font-medium text-gray-700">Parameters</h4>
                        <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-auto">
                          {JSON.stringify(selectedMasterTask.params, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}

                {/* Standard Operating Procedure */}
                {selectedMasterTask.standardOperatingProcedure && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold mb-4">Standard Operating Procedure</h3>
                    
                    {/* SOP Objective */}
                    <div className="mb-6">
                      <h4 className="font-medium text-gray-700 mb-2">Objective</h4>
                      <p className="text-gray-600">{selectedMasterTask.standardOperatingProcedure.objective}</p>
                    </div>

                    {/* SOP Scope */}
                    <div className="mb-6">
                      <h4 className="font-medium text-gray-700 mb-2">Scope</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {selectedMasterTask.standardOperatingProcedure.scope.included?.length > 0 && (
                          <div>
                            <h5 className="font-medium text-gray-600 text-sm mb-1">Included</h5>
                            <ul className="list-disc list-inside text-sm text-gray-600">
                              {selectedMasterTask.standardOperatingProcedure.scope.included.map((item: string, i: number) => (
                                <li key={i}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {selectedMasterTask.standardOperatingProcedure.scope.excluded?.length > 0 && (
                          <div>
                            <h5 className="font-medium text-gray-600 text-sm mb-1">Excluded</h5>
                            <ul className="list-disc list-inside text-sm text-gray-600">
                              {selectedMasterTask.standardOperatingProcedure.scope.excluded.map((item: string, i: number) => (
                                <li key={i}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {selectedMasterTask.standardOperatingProcedure.scope.applicableTo?.length > 0 && (
                          <div>
                            <h5 className="font-medium text-gray-600 text-sm mb-1">Applicable To</h5>
                            <ul className="list-disc list-inside text-sm text-gray-600">
                              {selectedMasterTask.standardOperatingProcedure.scope.applicableTo.map((item: string, i: number) => (
                                <li key={i}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* SOP Policies */}
                    <div className="mb-6">
                      <h4 className="font-medium text-gray-700 mb-2">Policies</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {selectedMasterTask.standardOperatingProcedure.policies.compliance?.length > 0 && (
                          <div>
                            <h5 className="font-medium text-gray-600 text-sm mb-1">Compliance</h5>
                            <div className="flex flex-wrap gap-1">
                              {selectedMasterTask.standardOperatingProcedure.policies.compliance.map((item: string, i: number) => (
                                <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">{item}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {selectedMasterTask.standardOperatingProcedure.policies.standards?.length > 0 && (
                          <div>
                            <h5 className="font-medium text-gray-600 text-sm mb-1">Standards</h5>
                            <div className="flex flex-wrap gap-1">
                              {selectedMasterTask.standardOperatingProcedure.policies.standards.map((item: string, i: number) => (
                                <span key={i} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">{item}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {selectedMasterTask.standardOperatingProcedure.policies.regulations?.length > 0 && (
                          <div>
                            <h5 className="font-medium text-gray-600 text-sm mb-1">Regulations</h5>
                            <div className="flex flex-wrap gap-1">
                              {selectedMasterTask.standardOperatingProcedure.policies.regulations.map((item: string, i: number) => (
                                <span key={i} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">{item}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Roles and Responsibilities */}
                    {selectedMasterTask.standardOperatingProcedure.rolesAndResponsibilities?.length > 0 && (
                      <div className="mb-6">
                        <h4 className="font-medium text-gray-700 mb-2">Roles and Responsibilities</h4>
                        <div className="space-y-3">
                          {selectedMasterTask.standardOperatingProcedure.rolesAndResponsibilities.map((role: any, i: number) => (
                            <div key={i} className="border-l-4 border-indigo-500 pl-4">
                              <h5 className="font-medium text-gray-700">{role.role}</h5>
                              <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                                {role.responsibilities.map((resp: string, j: number) => (
                                  <li key={j}>{resp}</li>
                                ))}
                              </ul>
                              {role.requiredSkills?.length > 0 && (
                                <div className="mt-2">
                                  <span className="text-sm font-medium text-gray-600">Required Skills: </span>
                                  <span className="text-sm text-gray-600">{role.requiredSkills.join(', ')}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Procedures Checklist */}
                    {selectedMasterTask.standardOperatingProcedure.procedures?.length > 0 && (
                      <div className="mb-6">
                        <h4 className="font-medium text-gray-700 mb-2">Procedures Checklist</h4>
                        <div className="space-y-4">
                          {selectedMasterTask.standardOperatingProcedure.procedures.map((proc: any, i: number) => {
                            return (
                              <div key={i} className="rounded-lg p-4 border-2 bg-gray-50 border-gray-200">
                                <div className="flex items-start gap-3">
                                  <div className="flex-shrink-0">
                                    {/* Step number indicator */}
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm bg-gray-300 text-gray-600">
                                      {proc.stepNumber}
                                    </div>
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <h5 className="font-medium text-gray-700">{proc.name}</h5>
                                        <p className="text-sm text-gray-600 mt-1">{proc.description}</p>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                                      <div>
                                        <span className="font-medium">Responsible:</span> {proc.responsible}
                                      </div>
                                      {proc.duration && (
                                        <div>
                                          <span className="font-medium">Duration:</span> {proc.duration}
                                        </div>
                                      )}
                                    </div>
                                    {(proc.inputs?.length > 0 || proc.outputs?.length > 0 || proc.tools?.length > 0) && (
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-3 text-sm">
                                        {proc.inputs?.length > 0 && (
                                          <div>
                                            <span className="font-medium">Inputs:</span>
                                            <ul className="list-disc list-inside text-gray-600">
                                              {proc.inputs.map((input: string, j: number) => (
                                                <li key={j}>{input}</li>
                                              ))}
                                            </ul>
                                          </div>
                                        )}
                                        {proc.outputs?.length > 0 && (
                                          <div>
                                            <span className="font-medium">Outputs:</span>
                                            <ul className="list-disc list-inside text-gray-600">
                                              {proc.outputs.map((output: string, j: number) => (
                                                <li key={j}>{output}</li>
                                              ))}
                                            </ul>
                                          </div>
                                        )}
                                        {proc.tools?.length > 0 && (
                                          <div>
                                            <span className="font-medium">Tools:</span>
                                            <ul className="list-disc list-inside text-gray-600">
                                              {proc.tools.map((tool: string, j: number) => (
                                                <li key={j}>{tool}</li>
                                              ))}
                                            </ul>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                    {proc.qualityChecks?.length > 0 && (
                                      <div className="mt-3">
                                        <span className="text-sm font-medium">Quality Checks:</span>
                                        <ul className="list-disc list-inside text-sm text-gray-600">
                                          {proc.qualityChecks.map((check: string, j: number) => (
                                            <li key={j}>{check}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                    {proc.dependencies?.length > 0 && (
                                      <div className="mt-2">
                                        <span className="text-sm font-medium">Dependencies:</span>
                                        <span className="text-sm text-gray-600"> {proc.dependencies.join(', ')}</span>
                                      </div>
                                    )}
                                    {proc.decisionPoints?.length > 0 && (
                                      <div className="mt-3">
                                        <span className="font-medium text-sm">Decision Points:</span>
                                        <div className="space-y-2 mt-1">
                                          {proc.decisionPoints.map((dp: any, j: number) => (
                                            <div key={j} className="text-sm bg-yellow-50 p-2 rounded">
                                              <span className="font-medium">If:</span> {dp.condition}<br/>
                                              <span className="font-medium text-green-700">Then:</span> {dp.truePath}<br/>
                                              <span className="font-medium text-red-700">Else:</span> {dp.falsePath}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* SOP Metadata */}
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-gray-700 mb-2">Metadata</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="font-medium">Version:</span> {selectedMasterTask.standardOperatingProcedure.metadata.version}
                        </div>
                        <div>
                          <span className="font-medium">Owner:</span> {selectedMasterTask.standardOperatingProcedure.metadata.owner}
                        </div>
                        <div>
                          <span className="font-medium">Effective Date:</span> {new Date(selectedMasterTask.standardOperatingProcedure.metadata.effectiveDate).toLocaleDateString()}
                        </div>
                        <div>
                          <span className="font-medium">Review Date:</span> {new Date(selectedMasterTask.standardOperatingProcedure.metadata.reviewDate).toLocaleDateString()}
                        </div>
                        <div>
                          <span className="font-medium">Approved By:</span> {selectedMasterTask.standardOperatingProcedure.metadata.approvedBy}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SOP Metadata */}
                {selectedMasterTask.sopMetadata && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold mb-4">SOP Metadata</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedMasterTask.sopMetadata.complianceStandards?.length > 0 && (
                        <div className="md:col-span-2">
                          <h4 className="font-medium text-gray-700">Compliance Standards</h4>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {selectedMasterTask.sopMetadata.complianceStandards.map((standard: string, index: number) => (
                              <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                                {standard}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div>
                        <h4 className="font-medium text-gray-700">Audit Trail Required</h4>
                        <p className="text-gray-600">{selectedMasterTask.sopMetadata.auditTrailRequired ? 'Yes' : 'No'}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-700">Regulatory Body</h4>
                        <p className="text-gray-600">{selectedMasterTask.sopMetadata.regulatoryBody || 'Not specified'}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-700">Risk Level</h4>
                        <p className="text-gray-600">{selectedMasterTask.sopMetadata.riskLevel || 'Not specified'}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-700">Estimated Duration</h4>
                        <p className="text-gray-600">{selectedMasterTask.sopMetadata.estimatedDuration || 'Not specified'}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-700">Mandatory Steps</h4>
                        <p className="text-gray-600">{selectedMasterTask.sopMetadata.mandatorySteps || 'Not specified'}</p>
                      </div>
                      {selectedMasterTask.sopMetadata.requiredApprovals?.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-700">Required Approvals</h4>
                          <ul className="list-disc list-inside text-gray-600">
                            {selectedMasterTask.sopMetadata.requiredApprovals.map((approval: string, i: number) => (
                              <li key={i}>{approval}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {selectedMasterTask.sopMetadata.auditRequirements?.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-700">Audit Requirements</h4>
                          <ul className="list-disc list-inside text-gray-600">
                            {selectedMasterTask.sopMetadata.auditRequirements.map((req: string, i: number) => (
                              <li key={i}>{req}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Required Parameters */}
                {selectedMasterTask.requiredParameters?.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold mb-4">Required Parameters</h3>
                    <div className="space-y-4">
                      {selectedMasterTask.requiredParameters.map((param: any, index: number) => (
                        <div key={index} className="border-l-4 border-blue-500 pl-4">
                          <h4 className="font-medium text-gray-700">{param.displayName}</h4>
                          <p className="text-sm text-gray-600 mt-1">{param.description}</p>
                          <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                            <div>
                              <span className="font-medium">Type:</span> {param.type}
                            </div>
                            <div>
                              <span className="font-medium">Required:</span> {param.validation?.required ? 'Yes' : 'No'}
                            </div>
                            {param.examples?.length > 0 && (
                              <div className="col-span-2">
                                <span className="font-medium">Examples:</span> {param.examples.join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}


                {/* Form Schema */}
                {selectedMasterTask.formSchema && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold mb-4">Form Schema</h3>
                    <pre className="bg-gray-50 p-4 rounded text-xs overflow-auto">
                      {JSON.stringify(selectedMasterTask.formSchema, null, 2)}
                    </pre>
                    {selectedMasterTask.validationRules && (
                      <div className="mt-4">
                        <h4 className="font-medium text-gray-700 mb-2">Validation Rules</h4>
                        <pre className="bg-gray-50 p-4 rounded text-xs overflow-auto">
                          {JSON.stringify(selectedMasterTask.validationRules, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}

                {/* BPMN Workflow */}
                {selectedMasterTask.workflowDefinition && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold mb-4">BPMN Workflow Definition</h3>
                    <pre className="bg-gray-50 p-4 rounded text-xs overflow-auto">
                      {JSON.stringify(selectedMasterTask.workflowDefinition, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Training Curriculum */}
                {selectedMasterTask.curriculum?.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold mb-4">Training Curriculum</h3>
                    <div className="space-y-3">
                      {selectedMasterTask.curriculum.map((module: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <div>
                            <h4 className="font-medium text-gray-700">{module.name}</h4>
                            <p className="text-sm text-gray-600">Module ID: {module.moduleId}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-700">{module.duration} min</p>
                            <p className="text-xs text-gray-500">{module.required ? 'Required' : 'Optional'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Context Documents */}
                {selectedMasterTask.contextDocuments?.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold mb-4">Context Documents</h3>
                    <div className="space-y-3">
                      {selectedMasterTask.contextDocuments.map((doc: any, index: number) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-700">{doc.name}</h4>
                            <p className="text-sm text-gray-600">Type: {doc.type}</p>
                            {doc.url && (
                              <p className="text-sm text-blue-600 hover:underline">
                                <a href={doc.url} target="_blank" rel="noopener noreferrer">View Document</a>
                              </p>
                            )}
                            {doc.content && (
                              <details className="mt-2">
                                <summary className="text-sm text-gray-600 cursor-pointer">Show Content</summary>
                                <pre className="mt-2 text-xs bg-white p-2 rounded whitespace-pre-wrap">{doc.content}</pre>
                              </details>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Global Metrics */}
                {selectedMasterTask.globalMetrics && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold mb-4">Global Metrics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-700">Total Executions</h4>
                        <p className="text-2xl font-semibold text-gray-900">{selectedMasterTask.globalMetrics.totalExecutions || 0}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-700">Average Completion Time</h4>
                        <p className="text-2xl font-semibold text-gray-900">{selectedMasterTask.globalMetrics.averageCompletionTime || 0}min</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-700">Success Rate</h4>
                        <p className="text-2xl font-semibold text-gray-900">{selectedMasterTask.globalMetrics.averageSuccessRate || 0}%</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Raw JSON View - Collapsible */}
                <details className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <summary className="cursor-pointer font-semibold text-gray-700">Raw Task Data (JSON)</summary>
                  <pre className="mt-4 p-4 bg-gray-50 rounded text-xs overflow-auto">
                    {JSON.stringify(selectedMasterTask, null, 2)}
                  </pre>
                </details>
              </div>
            </div>

            {/* Footer - Fixed at bottom */}
            <div className="border-t bg-white p-4">
              <div className="max-w-6xl mx-auto flex gap-3 justify-end">
                <button
                  onClick={handleAdoptClick}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Adopt Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Adoption Modal */}
      {showAdoptModal && selectedMasterTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="fixed inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center">
            <div className="bg-white md:rounded-lg shadow-xl w-full md:max-w-md h-auto md:h-auto max-h-[90vh] flex flex-col">
              {/* Modal Header - Same height as app bar */}
              <div className="h-14 border-b flex items-center px-3">
                <div className="flex items-center justify-between w-full">
                  {/* Close button - Aligned with hamburger */}
                  <button
                    onClick={() => setShowAdoptModal(false)}
                    className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                    aria-label="Close modal"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  {/* Title */}
                  <div className="flex-1 flex items-center px-3">
                    <h3 className="text-base font-semibold text-gray-900">Adopt Task</h3>
                  </div>

                  {/* Empty space for balance */}
                  <div className="w-11"></div>
                </div>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <h4 className="text-lg font-medium mb-2">
                  {selectedMasterTask.name || selectedMasterTask.title}
                </h4>
                <p className="text-gray-600 mb-4">
                  Proceed to adopt this task for <span className="font-medium">{currentDomain?.name}</span>?
                </p>
                <p className="text-sm text-gray-500">
                  This will make the task available for assignment to users in your domain.
                </p>
              </div>

              {/* Modal Footer */}
              <div className="border-t p-4">
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => console.log('Edit not implemented')}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm opacity-50 cursor-not-allowed"
                    disabled
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleAdoptConfirm}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Adopt
                  </button>
                  <button
                    onClick={() => setShowAdoptModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}