'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDomain } from '@/app/contexts/domain-context';
import { useAuth } from '@/app/contexts/auth-context';
import { ChevronRight, Sparkles, RefreshCw, Bug } from 'lucide-react';
import { PostCard } from '@/app/components/post-card';
import { ExecutionCard } from '@/app/components/execution-card';
import { UserTaskDisplay, MasterTask } from '@/app/types/post.types';
import { DebugPopup } from '@/app/components/debug-popup';

interface RecentExecution {
  executionId: string;
  title: string;
  updatedAt: string;
  createdAt: string;
  lastMessage?: {
    content: string;
    role: string;
    createdAt: string;
  } | null;
  messageCount: number;
}

function HomePage() {
  const router = useRouter();
  const { currentDomain, isLoading: isDomainLoading } = useDomain();
  const { user, accessToken } = useAuth();
  const [userPosts, setUserPosts] = useState<UserTaskDisplay[]>([]);
  const [domainPosts, setDomainPosts] = useState<MasterTask[]>([]);
  const [recentExecutions, setRecentExecutions] = useState<RecentExecution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDebug, setShowDebug] = useState(false);
  
  // Compute unassigned posts from userPosts and domainPosts
  const unassignedPosts = domainPosts.filter((dt: MasterTask) => {
    const assignedTaskIds = userPosts.map(p => p.domainTaskId);
    return !assignedTaskIds.includes(dt.id);
  });
  
  

  useEffect(() => {
    // Only redirect if user is authenticated and domains are loaded
    if (user && !isDomainLoading) {
      if (!currentDomain) {
        console.log('[HomePage] Redirecting to /domains - no currentDomain selected');
        router.push('/domains');
      } else if (currentDomain.slug) {
        // Redirect to domain-specific home page
        console.log('[HomePage] Redirecting to domain-specific home:', `/${currentDomain.slug}`);
        router.push(`/${currentDomain.slug}`);
      }
    }
  }, [user, currentDomain, isDomainLoading, router]);

  // Fetch user's assigned tasks
  useEffect(() => {
    if (!user || !accessToken) return;
    
    // Safety check - ensure user has id
    if (!user.id) {
      console.log('[HomePage] No user.id available');
      return;
    }

    const fetchUserTasks = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        
        if (currentDomain) {
          params.append('domain', currentDomain.id);
        }

        console.log('[HomePage] Fetching user tasks with params:', params.toString());
        
        const response = await fetch(`/api/domain-tasks?${params}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        console.log('[HomePage] User tasks response status:', response.status);
        
        if (!response.ok) {
          console.error('[HomePage] Failed to fetch user tasks:', response.status);
          return;
        }
        
        const data = await response.json();
        console.log('[HomePage] User tasks data:', data);
        setUserPosts(data.tasks || []);
      } catch (error) {
        console.error('[HomePage] Error fetching user tasks:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserTasks();
  }, [user, accessToken, currentDomain]);

  // Fetch domain tasks that user can assign to themselves
  useEffect(() => {
    if (!user || !accessToken || !currentDomain) return;

    const fetchDomainTasks = async () => {
      try {
        // Fetch all domain tasks for the current domain
        const params = new URLSearchParams({
          domain: currentDomain.id
        });
        
        console.log('[HomePage] Fetching domain tasks with params:', params.toString());
        
        const response = await fetch(`/api/domain-tasks/master?${params}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        console.log('[HomePage] Domain tasks response status:', response.status);

        if (!response.ok) {
          console.error('[HomePage] Failed to fetch domain tasks:', response.status);
          return;
        }
        
        const data = await response.json();
        console.log('[HomePage] Domain tasks data:', data);
        setDomainPosts(data.posts || []);
      } catch (error) {
        console.error('[HomePage] Error fetching domain tasks:', error);
      }
    };

    fetchDomainTasks();
  }, [user, accessToken, currentDomain]);

  // Fetch recent executions
  useEffect(() => {
    if (!user || !accessToken || !currentDomain) return;

    const fetchRecentExecutions = async () => {
      try {
        const params = new URLSearchParams({
          domain: currentDomain.id
        });
        
        const response = await fetch(`/api/task-executions/recent?${params}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          console.error('[HomePage] Failed to fetch recent executions:', response.status);
          return;
        }
        
        const data = await response.json();
        setRecentExecutions(data.executions || []);
      } catch (error) {
        console.error('[HomePage] Error fetching recent executions:', error);
      }
    };

    fetchRecentExecutions();
  }, [user, accessToken, currentDomain]);

  // Show loading state while contexts are initializing
  if (!user || isDomainLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }
  
  // If domains are loaded but no domain selected, the useEffect will redirect
  if (!currentDomain) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Redirecting...</div>
      </div>
    );
  }

  const handleMasterTaskClick = async (masterTask: MasterTask) => {
    console.log('[HomePage] handleMasterTaskClick called with:', {
      id: masterTask.id,
      title: masterTask.title
    });
    
    try {
      console.log('[HomePage] Assigning task:', { taskId: masterTask.id });
      const response = await fetch('/api/domain-tasks/assign', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ taskId: masterTask.id }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('[HomePage] Task assignment failed:', error);
        console.error('[HomePage] Detailed error:', {
          status: response.status,
          error: error.error,
          details: error.details,
          taskId: error.taskId,
          userId: error.userId
        });
        alert(`Failed to assign task: ${error.details || error.error || 'Unknown error'}`);
        return;
      }

      const assignmentData = await response.json();
      console.log('[HomePage] Task assigned successfully:', assignmentData);
      
      // Refresh both lists to update UI
      const [userTasksRes, domainTasksRes] = await Promise.all([
        fetch(`/api/domain-tasks?domain=${currentDomain?.id}`, {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        }),
        fetch(`/api/domain-tasks/master?domain=${currentDomain?.id}`, {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        })
      ]);

      let updatedUserTasks: UserTaskDisplay[] = [];
      
      if (userTasksRes.ok) {
        const data = await userTasksRes.json();
        updatedUserTasks = data.tasks || [];
        setUserPosts(updatedUserTasks);
      }
      
      if (domainTasksRes.ok) {
        const domainData = await domainTasksRes.json();
        setDomainPosts(domainData.posts || []);
      }
    } catch (error) {
      console.error('Error assigning task:', error);
      alert('An error occurred. Please try again.');
    }
  };

  const handleUserPostClick = async (post: UserTaskDisplay) => {
    console.log('[HomePage] handleUserPostClick - navigating to chat');
    
    // For onboarding phase - always create new execution
    router.push(`/chat/task/${post.id}/new`);
  };



  return (
    <div className="p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-light text-gray-900">Your Journey</h2>
          <p className="text-xs text-gray-600">Complete tasks to unlock features</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDebug(true)}
            className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
            title="Debug User Settings"
          >
            <Bug className="w-4 h-4 text-gray-500 hover:text-red-500" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      ) : userPosts.length === 0 && unassignedPosts.length === 0 ? (
        <div className="text-center py-12">
          <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No posts available</p>
          <p className="text-xs text-gray-400 mt-1">Check back later for new content</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Recent Conversations Section */}
          {recentExecutions.length > 0 && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-3">Recent Conversations</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {recentExecutions.map(execution => (
                  <ExecutionCard
                    key={execution.executionId}
                    execution={execution}
                    onClick={() => router.push(`/chat/${execution.executionId}`)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Your Tasks Section */}
          {userPosts.length > 0 && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-3">Your Tasks</h2>
              <div className="space-y-2">
                {userPosts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onClick={() => handleUserPostClick(post)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Available Tasks Section */}
          {unassignedPosts.length > 0 && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-3">Available Tasks</h2>
              <div className="space-y-2">
                {unassignedPosts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onClick={() => handleMasterTaskClick(post)}
                    isUnassigned={true}
                  />
                ))}
              </div>
            </div>
          )}


        </div>
      )}
      
      {/* Debug Popup */}
      <DebugPopup isOpen={showDebug} onClose={() => setShowDebug(false)} />
    </div>
  );
}

export default function Home() {
  return <HomePage />;
}